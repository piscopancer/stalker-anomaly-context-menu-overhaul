/** Weapon Parts Overhaul's field strip, drawn on the same `UICellPropertiesCustom` subclass the main hooks patch: a horizontal strip of the parts' own inventory icons, or a plain text list, reusing WPO's arrays and its `act_fieldstrip` functor. Reached only through the calls the shared hooks make into `context_menu_overhaul_strip`. */

const {
  settings,
  row_label,
  finish_layout,
  reserve_column,
  draw_icon,
  draw_divider,
  vanilla_fill_list,
  vanilla_add_item,
  UNKNOWN,
  DIVIDER,
  DIVIDER_LINE_H,
  safe_index,
} = context_menu_overhaul
const { vec } = context_menu_overhaul_utils

/** WPO's action string on every field-strip row; a menu whose rows all carry it is the field strip. */
const FIELD_STRIP_ACTION = "remove_part"

/** WPO's two maintenance actions; a menu whose rows all carry one is the "replace parts" menu. */
const REPLACE_PART_ACTION = "replace_part"
const CLEAN_PART_ACTION = "clean_part"

/** Label id whose icon every field-strip row inherits — the same `[label_icons]` entry the "field strip" menu entry uses. */
const FIELD_STRIP_LABEL = "st_field_strip"

/** Label id whose icon the maintenance rows inherit — the "replace parts" entry's oil can. */
const MAINTENANCE_LABEL = "st_wpo_replace_parts"

/** `grid_size` for a part cell — the multiplier the inventory sprite is scaled by. */
const STRIP_CELL = 40

/** Gap between two cells. */
const STRIP_GAP = 4

/** Inset between the cells and the frame, on every side. */
const STRIP_PAD = 8

/** Name the strip registers under while shown, so `Overlapped_UI` counts it and the inventory below stops drawing its own hover tooltip and locks its keys — the same suppression the built-in menu gets through `item_props:IsShown()`. */
const STRIP_UI_NAME = "cmo_field_strip"

/** Icon on the strip's "remove all" row, matching the screwdriver the field-strip entry carries in the main menu. */
const STRIP_REMOVE_ALL_ICON: IconTexture = "ui_cmo_screwdriver"

/** One field-strip row as WPO hands it over: the action, the drawn name, and the positional params. */
type StripRow = { action: string; name: string; params: CellPropertyParams }

/** A part's section, packed by WPO at params[1] of its heterogeneous params (`{weapon_id, section, ...}`). */
function part_sec(p: CellPropertyParams) {
  return p[1] as ItemSection
}

/** A part's condition (0-100), read from the weapon since only the field strip packs it into params, and the maintenance menu does not. */
function part_cond(p: CellPropertyParams) {
  const wpn = level.object_by_id(p[0] as number)
  if (!wpn) {
    return 100
  }
  const con = item_parts.get_parts_con(wpn)
  if (!con) {
    return 100
  }
  return con[part_sec(p)] ?? 100
}

/** Strips STALKER `%c[r,g,b,a]` colour escapes some WPO maintenance rows embed, which the menu's plain text control would otherwise render literally. */
function clean_label(name: string) {
  const [clean] = string.gsub(name, "%%c%[.-%]", "")
  return clean
}

/** Whether every row carries the field-strip action; an empty list is not a strip. */
export function is_field_strip(action_list: string[]) {
  if (action_list.length === 0) {
    return false
  }
  for (let i = 0; i < action_list.length; i++) {
    if (action_list[i] !== FIELD_STRIP_ACTION) {
      return false
    }
  }
  return true
}

/** Whether every row carries a maintenance action; an empty list is not a maintenance menu. */
export function is_maintenance(action_list: string[]) {
  if (action_list.length === 0) {
    return false
  }
  for (let i = 0; i < action_list.length; i++) {
    if (action_list[i] !== REPLACE_PART_ACTION && action_list[i] !== CLEAN_PART_ACTION) {
      return false
    }
  }
  return true
}

/** Splits a field strip into its part rows (each carries a section) and WPO's section-less "remove all", which its own loop vars have gone out of scope by. */
function split_strip(
  action_list: string[],
  name_list: string[],
  params_list: CellPropertyParams[],
) {
  const parts: StripRow[] = []
  let remove_all: StripRow | undefined
  for (let i = 0; i < params_list.length; i++) {
    const p = params_list[i]
    if (!p) {
      continue
    }
    const row: StripRow = { action: action_list[i], name: name_list[i], params: p }
    if (p[1]) {
      parts.push(row)
    } else if (!remove_all) {
      remove_all = row
    }
  }
  return { parts, remove_all }
}

/** Returned for any method the proxy does not override, so an unforeseen call answers `0` instead of a nil-call crash. */
const proxy_stub = () => 0

/**
 * A stand-in for the game object a field-strip part has none of. Only the methods that must return
 * real data are given; every other method a `UICellItem` — or a third-party hook layered on it, such
 * as GAMMA's total-weights and stacks-to-uses patches — happens to call is caught by the metatable
 * and answered with `0`, so the strip renders (icon, and the condition bar mods draw from
 * `condition()`) without spawning anything and without a stub per addon.
 */
function make_part_proxy(sec: ItemSection, cond: number) {
  const cond01 = cond > 1 ? cond / 100 : cond
  const overrides = {
    section: () => sec,
    name: () => sec,
    condition: () => cond01,
  }
  // `__index` fires only for the keys above's absentees; it hands back the shared nullary stub so any obj:method() the cell reads returns 0.
  const proxy = setmetatable(overrides, { __index: () => proxy_stub })
  // A proxy, not a real object; it answers the three real reads and stubs the rest.
  return proxy as unknown as CGameObject
}

/** Rebuilds the field strip as the horizontal icon strip; the caller has already checked the icon option is on. */
export function fill_icons(
  widget: UICellProperties,
  action_list: string[],
  name_list: string[],
  params_list: CellPropertyParams[],
) {
  const { parts, remove_all } = split_strip(action_list, name_list, params_list)
  clear(widget)
  widget.cmo_strip = []
  // Registered while shown so the inventory below suppresses its hover tooltip and locks its keys.
  if (!widget.cmo_registered) {
    Register_UI(STRIP_UI_NAME)
    widget.cmo_registered = true
  }
  // The parts are drawn as cells on the form; the list box holds only the "remove all" text row.
  widget.list_box.RemoveAll()
  build(widget, parts, remove_all)
}

/** Fills the field strip as an ordinary text menu (icon option off), routed through the main row builder so every row carries the field-strip icon and a separator is drawn above "remove all". */
export function fill_text(
  widget: UICellProperties,
  action_list: string[],
  name_list: string[],
  params_list: CellPropertyParams[],
) {
  const { parts, remove_all } = split_strip(action_list, name_list, params_list)
  const keys: RowKey[] = []
  const labels: string[] = []
  const actions: (string | false)[] = []
  const names: string[] = []
  const params: (CellPropertyParams | false)[] = []

  // Field-strip rows borrow the screwdriver; maintenance rows the oil can, resolved through `get_icon`.
  const icon_label = action_list[0] === FIELD_STRIP_ACTION ? FIELD_STRIP_LABEL : MAINTENANCE_LABEL
  const push_row = (row: StripRow) => {
    keys.push(UNKNOWN)
    labels.push(icon_label)
    actions.push(row.action)
    names.push(row_label(clean_label(row.name)))
    params.push(row.params)
  }

  for (const part of parts) {
    push_row(part)
  }
  if (remove_all) {
    if (settings.show_separators && keys.length > 0) {
      keys.push(DIVIDER)
      labels.push("")
      actions.push(false)
      names.push("")
      params.push(false)
    }
    push_row(remove_all)
  }

  widget.cmo_keys = keys
  widget.cmo_labels = labels
  widget.cmo_dividers = []
  widget.cmo_inert_rows = []
  widget.cmo_strip_text = true
  // `false` marks an inert row at runtime; vanilla's typed `string[]` never sees it as anything else.
  vanilla_fill_list.call(widget, actions as string[], names, params as CellPropertyParams[])
  widget.cmo_strip_text = undefined
  widget.cmo_keys = undefined
  widget.cmo_labels = undefined
  finish_layout(widget)
}

/** Hides the cells of a previous opening; the pool keeps their instances for reuse. Also drops the UI registration so the inventory below is only suppressed while a strip is actually shown. */
export function clear(widget: UICellProperties) {
  const old = widget.cmo_strip
  if (old) {
    for (const cell of old) {
      cell.item.cell.Show(false)
    }
  }
  widget.cmo_strip = undefined
  widget.cmo_row = undefined
  if (widget.cmo_registered) {
    Unregister_UI(STRIP_UI_NAME)
    widget.cmo_registered = undefined
  }
}

/** Builds a real inventory cell per part on the form, laid out in a row, reusing a pool so nothing leaks. The optional "remove all" is added as a plain text row beneath them. */
function build(widget: UICellProperties, parts: StripRow[], remove_all?: StripRow) {
  const cells = widget.cmo_strip
  if (!cells) {
    return
  }
  const pool = widget.cmo_pool ?? []
  widget.cmo_pool = pool
  const container = { path: "container", xml: utils_ui.get_utils_xml(), grid_size: STRIP_CELL }

  let x = 0
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i].params
    if (!pool[i]) {
      pool[i] = utils_ui.UICellItem(container, { path: "container:st", base: widget.form }, 0, false)
    }
    const item = pool[i]
    if (!item.Set(make_part_proxy(part_sec(p), part_cond(p)))) {
      item.cell.Show(false)
      continue
    }
    item.cell.SetWndPos(vec(STRIP_PAD + x, STRIP_PAD))
    item.cell.Show(true)
    cells.push({ item: item, params: p })
    x = x + item.cell.GetWidth() + STRIP_GAP
  }
  // Hide any pooled cells beyond this menu's part count.
  for (let i = parts.length; i < pool.length; i++) {
    pool[i].cell.Show(false)
  }

  const strip_w = x > 0 ? x - STRIP_GAP : 0
  let content_w = strip_w
  let content_h = strip_w > 0 ? STRIP_CELL : 0

  // WPO's "remove all", reused as a row styled like the ordinary menu rows — capitalised label, an icon column, and the field-strip screwdriver — under the icon strip, with a separator between them when separators are on.
  if (remove_all) {
    let divider: CUIStatic | undefined
    let div_h = 0
    // The separator is a first, inert list row; its height is set before the "remove all" row is added, so the row stacks tight beneath it.
    if (strip_w > 0 && settings.show_separators) {
      vanilla_add_item.call(widget, 1, "")
      const div = widget.list_box.GetItemByIndex(0)
      if (div) {
        divider = draw_divider(div)
        div_h = div.GetHeight()
      }
    }

    const row_index = div_h > 0 ? 2 : 1
    vanilla_add_item.call(widget, row_index, row_label(remove_all.name), remove_all.action, remove_all.params)
    const row = widget.list_box.GetItemByIndex(div_h > 0 ? 1 : 0)
    if (row) {
      const row_h = row.GetHeight()
      const column = reserve_column(row)
      const text = row.GetTextItem()
      const row_w = (text ? text.GetWidth() + column : row.GetWidth()) + widget.PDW
      content_w = math.max(content_w, row_w)
      const list_y = STRIP_PAD + (strip_w > 0 ? STRIP_CELL + STRIP_GAP : 0)
      widget.list_box.SetWndPos(vec(STRIP_PAD, list_y))
      widget.list_box.SetWndSize(vec(content_w, div_h + row_h))
      // Full row width so a click lands anywhere along it, matching the ordinary menu rows.
      row.SetWndSize(vec(content_w, row_h))
      if (divider) {
        // Fixed line height, as the main menu's separators use; the field's own height is taller and stretches the texture into what looks like two lines.
        divider.SetWndSize(vec(content_w, DIVIDER_LINE_H))
      }
      draw_icon(row, STRIP_REMOVE_ALL_ICON)
      content_h = list_y - STRIP_PAD + div_h + row_h
      // The list box is offset below the icons (and the divider), so `Update` cannot place the highlight from the row's own position; its form-space rect is kept for {@link highlight}.
      widget.cmo_row = { item: row, x: STRIP_PAD, y: list_y + div_h, w: content_w, h: row_h }
    }
  }

  widget.W = content_w + STRIP_PAD * 2
  widget.H = content_h + STRIP_PAD * 2
  const form = vec(widget.W, widget.H)
  widget.form.SetWndSize(form)
  widget.frame.SetWndSize(form)
  if (!remove_all) {
    widget.list_box.SetWndSize(form)
  }
  ensure_info(widget)
}

/** Creates the item-info tooltip window once, owned by the widget. */
function ensure_info(widget: UICellProperties) {
  if (!widget.cmo_info) {
    widget.cmo_info = utils_ui.UIInfoItem(widget)
  }
}

/** Highlights the cell under the cursor and shows the game's item-info window for its part. Returns whether this is a strip. */
export function highlight(widget: UICellProperties) {
  const cells = widget.cmo_strip
  if (!cells) {
    return false
  }
  const info = widget.cmo_info
  for (const cell of cells) {
    const c = cell.item.cell
    if (c.IsCursorOverWindow()) {
      widget.highlight.SetWndPos(c.GetWndPos())
      widget.highlight.SetWndSize(vec(c.GetWidth(), c.GetHeight()))
      widget.highlight.Show(true)
      if (info) {
        info.Update(undefined, part_sec(cell.params))
      }
      return true
    }
  }
  // Over the "remove all" row: drive the highlight from the row's kept form-space rect, since the list box's downward offset makes the vanilla row-relative placement land at the top.
  const row = widget.cmo_row
  if (row && row.item.IsCursorOverWindow()) {
    widget.highlight.SetWndPos(vec(row.x, row.y))
    widget.highlight.SetWndSize(vec(row.w, row.h))
    widget.highlight.Show(true)
  } else {
    widget.highlight.Show(false)
  }
  if (info) {
    info.Update()
  }
  return true
}

/** Dispatches a click on the strip cell under the cursor through WPO's functor and closes the menu. Returns false when the cursor is over no icon, so a click on the "remove all" text row falls through to the class's own list-item handling instead of being swallowed here. */
function try_click(widget: UICellProperties) {
  const cells = widget.cmo_strip
  if (!cells) {
    return false
  }
  const functor = widget.functor
  for (const cell of cells) {
    if (cell.item.cell.IsCursorOverWindow()) {
      if (functor) {
        pcall(functor, ...cell.params)
      }
      if (widget.cmo_info) {
        widget.cmo_info.Update()
      }
      if (widget.IsShown()) {
        widget.OnHide()
      }
      return true
    }
  }
  return false
}

/** Routes a left click to the part icon under the cursor. The icons are drawn on the form, not added to the list box, so the class's own `OnListItemDbClicked` never fires for them; the click is caught here, where the class already handles `MOUSE_1`. The "remove all" text row is a real list item, so it is left to the class's list-item handling. */
const on_keyboard = function (this: UICellProperties, dik: number, action: number) {
  if (
    action === ui_events.WINDOW_KEY_PRESSED &&
    dik === DIK_keys.MOUSE_1 &&
    this.cmo_strip &&
    this.form.IsCursorOverWindow() &&
    try_click(this)
  ) {
    return true
  }
  // Not an icon click — the class handles it: the "remove all" row through its list-item click, a click off the form to dismiss, Escape, and so on.
  const orig = this.cmo_orig_keyboard
  return orig ? orig.call(this, dik, action) : true
}

/** Drops the strip's UI registration when the menu closes, then runs the class's own hide. */
const on_hide = function (this: UICellProperties) {
  clear(this)
  const orig = this.cmo_orig_hide
  if (orig) {
    orig.call(this)
  }
}

/** Captures a subclass's own key and hide handlers so a strip click and close route through this addon. */
export function patch(cls: UICellProperties) {
  const keyboard = safe_index(cls, "OnKeyboard")
  if (type(keyboard) === "function") {
    cls.cmo_orig_keyboard = keyboard as UICellProperties["cmo_orig_keyboard"]
    cls.OnKeyboard = on_keyboard
  }
  const hide = safe_index(cls, "OnHide")
  if (type(hide) === "function") {
    cls.cmo_orig_hide = hide as UICellProperties["cmo_orig_hide"]
    cls.OnHide = on_hide
  }
}
