/** Icons, grouping and dividers for the inventory context menu (`UIInventory:InitProperties`, drawn by `UICellProperties`). */

/** Left shift of the list, reclaiming the widget's padding; on the list box since a negative icon x is clipped by its row. */
const LIST_SHIFT = -6

/** Gap between an icon and its row's text. */
const ICON_GAP = 2

/** Trimmed off the row height to get the icon size, so icons scale with the font. */
const ICON_INSET = 1

/** Divider row height, and the line drawn inside it. */
const DIVIDER_H = 7
export const DIVIDER_LINE_H = 2

/** A horizontal line from vanilla's pda textures, used as the divider. */
const DIVIDER_TEXTURE = "ui_pda2_split_e"

/** Stands in for a row whose property key could not be resolved. */
export const UNKNOWN: RowKey = "__cmo_unknown"

/** Marks the divider rows this addon inserts. */
export const DIVIDER: RowKey = "__cmo_divider"

/** The "details" entry, whose label the item's own name can replace. */
const DETAILS_FUNCTOR: FunctorKey = "ui_itm_details.menu_details"

/** The "gift" row; hidden by default, rarely wanted and easily mis-clicked. */
const GIFT: RowKey = "donate"

/** `[groups]` key for a row the config does not name. */
const DEFAULT_GROUP_KEY = "default"

/** Fallback when `[groups] default` is missing. */
const DEFAULT_GROUP = 2

/** `UIInventory.properties` key prefix marking an addon-owned custom slot. */
const CUSTOM_PREFIX = "custom_"

const ini = new ini_file_ex("plugins\\context_menu_overhaul\\menu.ltx")

const { vec, parse_hex, capitalize } = context_menu_overhaul_utils

/** MCM options, cached because a menu re-reads them for every row of every opening. */
export const settings: McmConfig = {
  // Field by field, not a spread: a spread makes the transpiler define a global `ObjectAssign` in the shared Lua state.
  group_related_actions: context_menu_overhaul_mcm.defaultConfig.group_related_actions,
  use_colors: context_menu_overhaul_mcm.defaultConfig.use_colors,
  show_separators: context_menu_overhaul_mcm.defaultConfig.show_separators,
  details_shows_item_name: context_menu_overhaul_mcm.defaultConfig.details_shows_item_name,
  capitalize_labels: context_menu_overhaul_mcm.defaultConfig.capitalize_labels,
  hide_gift: context_menu_overhaul_mcm.defaultConfig.hide_gift,
  field_strip_icons: context_menu_overhaul_mcm.defaultConfig.field_strip_icons,
  maintenance_icons: context_menu_overhaul_mcm.defaultConfig.maintenance_icons,
}

/** Re-read on `on_option_change`; enough, since the menu is rebuilt each time it opens. One loop over the keys keeps this in step with `McmConfig` on its own. */
function load_settings() {
  if (!ui_mcm) {
    return
  }
  const group = context_menu_overhaul_mcm.optionGroup
  for (const [key] of pairs(settings)) {
    const path = `context_menu_overhaul/${group[key]}/${key}`
    // The value path carries the MCM group segments; McmConfig's flat keys don't model them, so the assembled path is re-typed for the flat `get`.
    settings[key] = ui_mcm.get(path as `context_menu_overhaul/${keyof McmConfig}`)
  }
}

/** The keys a row can be configured under, most specific first; label first since it alone reflects state. */
function row_keys(property_id: string, label?: string, functor?: FunctorKey) {
  return [label, property_id, functor]
}

/** First non-empty `read` over the row's keys, or `null` when the config names none. */
function resolve<T>(
  keys: (string | undefined)[],
  read: (key: string) => T | null | undefined,
) {
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (key) {
      const value = read(key)
      if (value) {
        return value
      }
    }
  }
  return null
}

/** The sections keyed on a row's label rather than its property id or functor. */
type LabelSection = "label_icons" | "groups" | "colors" | "chevrons"

/** The key naming this row in `section`: the label, or a translation id that renders to it (some addons hand the menu finished text, so comparing translations lets it be named by id in any language). */
function label_key(section: LabelSection, label: string) {
  if (ini.line_exist(section, label)) {
    return label
  }
  const entries = ini.collect_section(section)
  if (entries) {
    for (const [key] of pairs(entries)) {
      if (game.translate_string(key) === label) {
        return key
      }
    }
  }
  return label
}

/** The item class an entry acts on (mirrors `UIInventory:Name_Equip`), so `to_slot` and `use` can carry a per-class icon. */
function get_variant(obj: CGameObject) {
  const clsid = obj.clsid()
  const sec = obj.section()
  if (IsOutfit(null, clsid)) return "outfit"
  if (IsHeadgear(null, clsid)) return "helmet"
  if (IsItem("backpack", sec)) return "backpack"
  if (IsArtefact(null, clsid)) return "artefact"
  // attach_1..3 are slot numbers, not identities, so the item itself says which glyph the row wants.
  if (IsItem("sil", sec)) return "sil"
  if (IsItem("scope", sec)) return "scope"
  if (IsItem("gl", sec)) return "gl"
  // Consumables key off `kind`; smokes share `i_drink` but carry a `required_tool` (a light).
  const kind = SYS_GetParam<string>(0, sec, "kind")
  if (kind === "i_drink") return SYS_GetParam<string>(0, sec, "required_tool") ? "smoke" : "drink"
  if (kind === "i_food" || kind === "i_mutant_cooked" || kind === "i_mutant_raw") return "food"
  if (kind === "i_medical") return "medkit"
  return null
}

/** The icon for a menu entry, or `null` when the config declares none. */
export function get_icon(
  property_id: string,
  label?: string,
  obj?: CGameObject,
  functor?: FunctorKey,
) {
  if (label) {
    const by_label = ini.r_string_ex("label_icons", label_key("label_icons", label))
    if (by_label) {
      return by_label
    }
  }
  const variant = obj ? get_variant(obj) : null
  if (variant) {
    const by_variant = ini.r_string_ex("icons", `${property_id}@${variant}`)
    if (by_variant) {
      return by_variant
    }
  }
  const direct = ini.r_string_ex("icons", property_id)
  if (direct) {
    return direct
  }
  return functor ? ini.r_string_ex("functor_icons", functor) : null
}

/** The row's group; rows are ordered by it and a divider drawn where it changes. */
function get_group(property_id: string, label?: string, functor?: FunctorKey) {
  return (
    resolve(row_keys(property_id, label && label_key("groups", label), functor), (key) =>
      ini.r_float_ex("groups", key),
    ) ??
    ini.r_float_ex("groups", DEFAULT_GROUP_KEY) ??
    DEFAULT_GROUP
  )
}

/** The chevron glyph for a row that opens a further menu, or `null` when the config marks none. */
function get_chevron(property_id: string, label?: string, functor?: FunctorKey) {
  return resolve(row_keys(property_id, label && label_key("chevrons", label), functor), (key) =>
    ini.r_string_ex("chevrons", key),
  )
}

/** The row's icon tint as argb, or `null` to leave the texture as authored. */
function get_color(property_id: string, label?: string, functor?: FunctorKey) {
  return resolve(row_keys(property_id, label && label_key("colors", label), functor), (key) => {
    const hex = ini.r_string_ex("colors", key)
    return hex ? parse_hex(trim(hex)) : null
  })
}

/** Whether a line has the `<script>.<function>` shape a `[functor_icons]` key needs. */
function is_functor_key(line: string): line is FunctorKey {
  return string.find(line, "%.") !== undefined
}

/** The `useN_functor` of a `custom_N` slot, the only stable identity those rows have; `null` for built-ins. */
function get_custom_functor(key: RowKey, obj: CGameObject) {
  if (string.sub(key, 1, string.len(CUSTOM_PREFIX)) !== CUSTOM_PREFIX) {
    return null
  }
  const slot = string.sub(key, string.len(CUSTOM_PREFIX) + 1)
  const line = SYS_GetParam<string>(0, obj.section(), `use${slot}_functor`)
  if (!line) {
    return null
  }
  const functor = trim(line)
  return is_functor_key(functor) ? functor : null
}

/** The label as drawn; translated here since capitalising needs the display text, not the id. */
export function row_label(str_id: string) {
  const text = game.translate_string(str_id)
  if (!settings.capitalize_labels) {
    return text
  }
  return capitalize(text)
}

/** The item a row acts on, and the functor identifying it when the row is a custom slot. */
function row_identity(key: RowKey, params?: CellPropertyParams | false) {
  const obj = params ? level.object_by_id(params[0]) : null
  const functor = obj ? get_custom_functor(key, obj) : null
  return { obj: obj ?? undefined, functor: functor ?? undefined }
}

/** The screen as the string-keyed table it is in Lua, where a callback is named by a string. */
function methods_of(screen: UIInventory) {
  return screen as unknown as Record<
    string,
    ((...args: unknown[]) => unknown) | undefined
  >
}

/** Whether the screen defines the method a call names; never answered by invoking it. */
function has_method(screen: UIInventory, call: InventoryPropertyCall) {
  return typeof methods_of(screen)[call[0]] === "function"
}

/** Invokes a predicate call as vanilla does, forwarding the tuple after `(self, obj, bag)`. */
function call_predicate(
  screen: UIInventory,
  call: InventoryPropertyCall,
  obj: CGameObject,
  bag: InventoryContainer,
) {
  const method = methods_of(screen)[call[0]]
  return method ? !!method(screen, obj, bag, ...call) : false
}

/** Property keys of the menu being built, handed from `InitProperties` to `FillList`. */
let pending_keys: InventoryPropertyId[] = []

const vanilla_init_properties = ui_inventory.UIInventory.InitProperties

/** Reimplements vanilla's filter loop to also collect each row's property key — its one stable identity, which vanilla never passes on. */
const init_properties = function (
  this: UIInventory,
  obj: CGameObject,
  bag: InventoryContainer,
) {
  if (!(obj && bag)) {
    return
  }

  const keys: InventoryPropertyId[] = []

  for (const [key, props] of spairs(this.properties, ui_inventory.func_index)) {
    // Statements not ternaries: a ternary as a value makes the transpiler spill a numbered temporary.
    let bag_allowed = true
    if (props.cont_func && has_method(this, props.cont_func)) {
      bag_allowed = call_predicate(this, props.cont_func, obj, bag)
    } else if (props.cont) {
      bag_allowed = props.cont[bag] === true
    }

    let mode_allowed = true
    if (props.mode_func && has_method(this, props.mode_func)) {
      mode_allowed = call_predicate(this, props.mode_func, obj, bag)
    } else if (props.mode) {
      mode_allowed = props.mode[this.mode] === true
    }

    if (!(mode_allowed && bag_allowed)) {
      continue
    }

    // Walked until one is missing, as vanilla does, so an addon may declare a fourth precondition.
    let cond = true
    let k = 1
    while (cond) {
      const precond = props[`precondition${k}`]
      if (!precond) {
        break
      }
      cond = call_predicate(this, precond, obj, bag)
      k = k + 1
    }

    // Keyed on `cond` alone, exactly as vanilla appends to `context_str`, or every later key would shift.
    if (cond) {
      keys.push(key)
    }
  }

  pending_keys = keys
  vanilla_init_properties.call(this, obj, bag)
  pending_keys = []
}

const cell_properties = utils_ui.UICellProperties

/** Vanilla `FillList`, captured before `on_game_start` swaps in the addon's; the field strip runs it directly to draw a plain list. */
export const vanilla_fill_list = cell_properties.FillList

/** Regroups the rows, inserts dividers, and parks their keys on the widget for `AddItemToList`. */
const fill_list = function (
  this: UICellProperties,
  action_list: string[],
  name_list: string[],
  params_list: CellPropertyParams[],
) {
  const rows: {
    key: RowKey
    action: string
    label: string
    name: string
    params: CellPropertyParams
    group: number
  }[] = []
  // A length mismatch means our filter disagreed with vanilla's; drop the keys rather than mis-key every row.
  const aligned = pending_keys.length === name_list.length

  for (let i = 0; i < name_list.length; i++) {
    const key = aligned ? pending_keys[i] : UNKNOWN
    // Dropped here, not in `InitProperties`, where vanilla's own `context_str` is built and would stop lining up.
    if (settings.hide_gift && key === GIFT) {
      continue
    }
    const name = name_list[i]
    const params = params_list[i]
    const { obj, functor } = row_identity(key, params)
    const renamed = settings.details_shows_item_name && functor === DETAILS_FUNCTOR && obj
    rows.push({
      key: key,
      action: action_list[i],
      label: name,
      // The item's name replaces the label for display only; grouping and icons still resolve on the original.
      name: renamed ? row_label(ui_item.get_obj_name(obj)) : row_label(name),
      params: params,
      group: get_group(key, name, functor),
    })
  }

  // Insertion sort: `table.sort` is unstable and would shuffle same-group rows between openings.
  if (settings.group_related_actions) {
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      let j = i - 1
      while (j >= 0 && rows[j].group > row.group) {
        rows[j + 1] = rows[j]
        j = j - 1
      }
      rows[j + 1] = row
    }
  }

  const keys: RowKey[] = []
  const actions: (string | false)[] = []
  const names: string[] = []
  const labels: string[] = []
  const params: (CellPropertyParams | false)[] = []

  /** `false` not `nil` for an inserted row: nil truncates the Lua array, false still fails vanilla's `item.func` click guard. */
  const push_inert = (key: RowKey, name: string) => {
    keys.push(key)
    actions.push(false)
    names.push(name)
    labels.push(name)
    params.push(false)
  }

  for (let i = 0; i < rows.length; i++) {
    // A divider marks a group boundary, so only where the group changes.
    if (
      settings.group_related_actions &&
      settings.show_separators &&
      i > 0 &&
      rows[i].group !== rows[i - 1].group
    ) {
      push_inert(DIVIDER, "")
    }
    keys.push(rows[i].key)
    actions.push(rows[i].action)
    names.push(rows[i].name)
    labels.push(rows[i].label)
    params.push(rows[i].params)
  }

  this.cmo_keys = keys
  this.cmo_labels = labels
  this.cmo_column = undefined
  this.cmo_column_right = undefined
  this.cmo_chevrons = []
  this.cmo_dividers = []
  this.cmo_inert_rows = []
  vanilla_fill_list.call(
    this,
    actions as string[],
    names,
    params as CellPropertyParams[],
  )
  this.cmo_keys = undefined
  this.cmo_labels = undefined

  finish_layout(this)
}

/** Widens the menu by the icon column and squares up its rows; shared with submenus, which get the geometry only. */
export function finish_layout(widget: UICellProperties) {
  // One icon column for the whole form, not one per row, which is what made the menu too wide; a
  // second column on the right when any row carries a chevron, so the glyph clears the longest label.
  let extra = 0
  if (widget.cmo_column) {
    extra = extra + widget.cmo_column
  }
  if (widget.cmo_column_right) {
    extra = extra + widget.cmo_column_right
  }
  if (extra > 0) {
    widget.W = widget.W + extra
    const size = vec(widget.W, widget.H)
    widget.form.SetWndSize(size)
    widget.frame.SetWndSize(size)
    widget.list_box.SetWndSize(size)
  }

  // Shifted from the remembered xml position, or the list creeps left on every opening. The y is
  // restored from the captured original too, in case a field strip moved the list box down under
  // its icons and the menu is now being drawn as plain text.
  if (widget.cmo_list_x === undefined) {
    widget.cmo_list_x = widget.list_box.GetWndPos().x
  }
  if (widget.cmo_list_y === undefined) {
    widget.cmo_list_y = widget.list_box.GetWndPos().y
  }
  widget.list_box.SetWndPos(vec(widget.cmo_list_x + LIST_SHIFT, widget.cmo_list_y))

  // Vanilla sizes a row to its label, leaving dead space right of a short one where a click hits nothing.
  for (let i = 0; i < widget.list_box.GetSize(); i++) {
    const item = widget.list_box.GetItemByIndex(i)
    if (item) {
      item.SetWndSize(vec(widget.W - widget.PDW, item.GetHeight()))
    }
  }

  // Dividers span the finished menu, so they are stretched now that `W` is final.
  const dividers = widget.cmo_dividers
  if (dividers) {
    for (let i = 0; i < dividers.length; i++) {
      dividers[i].SetWndSize(vec(widget.W - widget.PDW, DIVIDER_LINE_H))
    }
  }
  widget.cmo_dividers = undefined

  // Right-aligned now that each row's width (W - PDW) is final, so every chevron sits at the same x.
  const chevrons = widget.cmo_chevrons
  if (chevrons && widget.cmo_column_right) {
    // The chevron column carries an `ICON_GAP` gutter left of the glyph, so the glyph sits a gap in from the right edge.
    const x = widget.W - widget.PDW - widget.cmo_column_right + ICON_GAP
    for (let i = 0; i < chevrons.length; i++) {
      chevrons[i].SetWndPos(vec(x, ICON_INSET))
    }
  }
  widget.cmo_chevrons = undefined
}

function icon_size(item: CUIListBoxItem) {
  return item.GetHeight() - ICON_INSET * 2
}

/** Narrowed by the screen ratio, since the ui is authored in a stretched 1024x768 space. */
function icon_width(item: CUIListBoxItem) {
  return icon_size(item) * utils_xml.screen_ratio()
}

function column_width(item: CUIListBoxItem) {
  return icon_width(item) + ICON_GAP
}

function indent_row(item: CUIListBoxItem, text: CUITextWnd, column: number) {
  text.SetWndPos(vec(column, 0))
  item.SetWndSize(vec(item.GetWidth() + column, item.GetHeight()))
}

/** Reserves the icon column on a row and shifts its label clear of it, returning the column width (0 when the row has no text) so the menu can be widened to match. */
export function reserve_column(item: CUIListBoxItem) {
  const text = item.GetTextItem()
  if (!text) {
    return 0
  }
  const column = column_width(item)
  indent_row(item, text, column)
  return column
}

/** Draws a texture in a row's reserved icon column, tinted when a colour is given. */
export function draw_icon(item: CUIListBoxItem, texture: string, color?: number | null) {
  const width = icon_width(item)
  const icon = item.AddIconField(width)
  if (!icon) {
    return
  }
  // `InitTexture` sizes the static from a registered id's rect, so the box is set after.
  icon.InitTexture(texture)
  icon.SetStretchTexture(true)
  icon.SetWndPos(vec(0, ICON_INSET))
  icon.SetWndSize(vec(width, icon_size(item)))
  if (color) {
    icon.SetTextureColor(color)
  }
}

/** Draws a chevron into a row's own space; positioned by {@link finish_layout} once the menu width, and so the row's right edge, is final. */
function draw_chevron(item: CUIListBoxItem, texture: string) {
  const width = icon_width(item)
  const icon = item.AddIconField(width)
  if (!icon) {
    return undefined
  }
  icon.InitTexture(texture)
  icon.SetStretchTexture(true)
  icon.SetWndSize(vec(width, icon_size(item)))
  return icon
}

/** Turns a row into a separator — collapses its text, sets the divider height, draws the line — and returns the line so its width can be stretched once the menu is sized. */
export function draw_divider(item: CUIListBoxItem) {
  const text = item.GetTextItem()
  if (text) {
    text.SetWndSize(vec(0, 0))
  }
  item.SetWndSize(vec(item.GetWidth(), DIVIDER_H))
  const line = item.AddIconField(DIVIDER_LINE_H)
  if (!line) {
    return undefined
  }
  line.InitTexture(DIVIDER_TEXTURE)
  line.SetStretchTexture(true)
  line.SetWndPos(vec(0, (DIVIDER_H - DIVIDER_LINE_H) / 2))
  return line
}

/** Remembers a row `Update` must not highlight, since it carries no action. */
function mark_inert(widget: UICellProperties, index: number) {
  const rows = widget.cmo_inert_rows
  if (rows) {
    rows.push(index)
  }
}

/** Vanilla `AddItemToList`, captured before the swap; the field strip adds its own rows through it. */
export const vanilla_add_item = cell_properties.AddItemToList

/** Draws this addon's own rows and adds the icon to the game's, once vanilla has sized the row. */
const add_item_to_list = function (
  this: UICellProperties,
  index: number,
  str_id: string,
  func: string,
  params?: CellPropertyParams,
) {
  vanilla_add_item.call(this, index, str_id, func, params)

  // Plain `if`s not `?.`: optional chaining spills a numbered temporary per link.
  const item = this.list_box.GetItemByIndex(this.list_box.GetSize() - 1)
  if (!item) {
    return
  }
  const text = item.GetTextItem()
  if (!text) {
    return
  }
  const keys = this.cmo_keys
  if (!keys) {
    return
  }
  const key = keys[index - 1]
  if (!key) {
    return
  }
  const row = index - 1

  if (key === DIVIDER) {
    // Vanilla added a full row's height to `H`; give the difference back, or the menu ends with a gap.
    this.H = this.H - (this.file_item_fn_sz.y - DIVIDER_H)
    const line = draw_divider(item)
    const dividers = this.cmo_dividers
    if (line && dividers) {
      dividers.push(line)
    }
    mark_inert(this, row)
    return
  }

  // Reserved on every row, icon or not, so the labels stay aligned.
  this.cmo_column = reserve_column(item)

  const { obj, functor } = row_identity(key, params)
  // Icons key on the raw id `InitProperties` collected, not the drawn text this addon may have rewritten.
  const labels = this.cmo_labels
  const label = labels ? labels[row] : str_id

  // Colours the label and the glyph; applied to the text even on rows with no icon.
  const color = settings.use_colors ? get_color(key, label, functor) : null
  if (color) {
    text.SetTextColor(color)
  }

  const texture = get_icon(key, label, obj, functor)
  if (texture) {
    draw_icon(item, texture, color)
  }

  // A row that opens a further menu gets a chevron at its right edge; the reserved right column widens the whole menu.
  const chevron = get_chevron(key, label, functor)
  if (chevron) {
    const drawn = draw_chevron(item, chevron)
    if (drawn) {
      this.cmo_column_right = column_width(item)
      const chevrons = this.cmo_chevrons
      if (chevrons) {
        chevrons.push(drawn)
      }
    }
  }
}

/** Whether the row at `index` is one this addon inserted rather than a menu entry. */
function is_inert_row(widget: UICellProperties, index: number) {
  const rows = widget.cmo_inert_rows
  if (!rows) {
    return false
  }
  for (let i = 0; i < rows.length; i++) {
    if (rows[i] === index) {
      return true
    }
  }
  return false
}

const vanilla_update = cell_properties.Update

/** Re-sizes the hover strip, which vanilla takes from the text control and which no longer spans the row. */
const update = function (this: UICellProperties) {
  vanilla_update.call(this)
  // A field strip draws its own per-cell highlight.
  if (context_menu_overhaul_wpo.highlight(this)) {
    return
  }
  if (!this.highlight.IsShown()) {
    return
  }
  for (let i = 0; i < this.list_box.GetSize(); i++) {
    const item = this.list_box.GetItemByIndex(i)
    if (item && item.IsCursorOverWindow()) {
      if (is_inert_row(this, i)) {
        this.highlight.Show(false)
        return
      }
      // Sized to the form, since a row is only as wide as its label and the widest strip ran past the frame.
      this.highlight.SetWndSize(vec(this.form.GetWidth() - this.PDH, item.GetHeight()))
      return
    }
  }
}

/** Layout twin of {@link fill_list} for the submenus addons open on their own subclass: geometry only, since those rows carry no property id, functor or config key. Weapon Parts Overhaul's field strip is the one exception, handed off to {@link strip_try_fill}. */
const sub_fill_list = function (
  this: UICellProperties,
  action_list: string[],
  name_list: string[],
  params_list: CellPropertyParams[],
) {
  const wpo = context_menu_overhaul_wpo
  this.cmo_column = undefined
  // Captured before the field strip can move the list box down, so the text menu is always put back at the top.
  if (this.cmo_list_y === undefined) {
    this.cmo_list_y = this.list_box.GetWndPos().y
  }
  const is_fs = wpo.is_field_strip(action_list)
  if (is_fs || wpo.is_maintenance(action_list)) {
    if (is_fs ? settings.field_strip_icons : settings.maintenance_icons) {
      wpo.fill_icons(this, action_list, name_list, params_list)
    } else {
      // Text menu: reuse the main row builder so each row carries the parts icon and, for the field strip, a separator above "remove all".
      wpo.clear(this)
      wpo.fill_text(this, action_list, name_list, params_list)
    }
    return
  }
  wpo.clear(this)
  vanilla_fill_list.call(this, action_list, name_list, params_list)
  finish_layout(this)
}

/** Layout twin of {@link add_item_to_list}: reserves the submenu's icon column, unless a field strip claims the row. */
const sub_add_item_to_list = function (
  this: UICellProperties,
  index: number,
  str_id: string,
  func: string,
  params?: CellPropertyParams,
) {
  // A field strip filled as text borrows the main builder, which draws the icon and the dividers.
  if (this.cmo_strip_text) {
    add_item_to_list.call(this, index, str_id, func, params)
    return
  }

  vanilla_add_item.call(this, index, str_id, func, params)

  const item = this.list_box.GetItemByIndex(this.list_box.GetSize() - 1)
  if (item) {
    this.cmo_column = reserve_column(item)
  }
}

/** Reads `key` off a value that may be a luabind class, where indexing a missing key can raise. */
export function safe_index(value: unknown, key: string) {
  const [ok, result] = pcall(() => (value as Record<string, unknown>)[key])
  return ok ? result : undefined
}

/**
 * Applies the layout to every subclass of the widget, found rather than named. Anomaly's
 * `class "X" (Y)` copies the base's methods into the subclass when defined — before
 * `on_game_start` — so assigning onto the base never reaches one; each is recognised instead
 * by still holding the vanilla methods. The base and any deliberately-overridden subclass no
 * longer match and are skipped.
 */
function patch_subclasses() {
  const globals = _G as unknown as Record<string, unknown>
  for (const [name, namespace] of pairs(globals)) {
    // One level deep: a script's globals live on its own namespace table.
    if (name === "_G" || type(namespace) !== "table") {
      continue
    }
    for (const [, value] of pairs(namespace as Record<string, unknown>)) {
      // Both must match, or a field merely holding a captured copy of one method would be caught.
      if (
        type(value) === "function" ||
        safe_index(value, "FillList") !== vanilla_fill_list ||
        safe_index(value, "AddItemToList") !== vanilla_add_item
      ) {
        continue
      }
      const cls = value as UICellProperties
      cls.FillList = sub_fill_list
      cls.AddItemToList = sub_add_item_to_list
      cls.Update = update
      context_menu_overhaul_wpo.patch(cls)
    }
  }
}

/** Called by `axr_main`, which also guarantees the patched classes are loaded. */
export function on_game_start() {
  ui_inventory.UIInventory.InitProperties = init_properties
  cell_properties.FillList = fill_list
  cell_properties.AddItemToList = add_item_to_list
  cell_properties.Update = update
  patch_subclasses()

  load_settings()
  RegisterScriptCallback("on_option_change", load_settings)
}
