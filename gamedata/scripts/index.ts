/** Icons, grouping and dividers for the inventory item context menu, built by `UIInventory:InitProperties` and drawn by `UICellProperties` in `utils_ui.script`. */

/** Left shift of the whole list, reclaiming the widget's padding; on the list box because a negative x on an icon is clipped by its row. */
const LIST_SHIFT = -6

/** Gap between an icon and its row's text. */
const ICON_GAP = 2

/** Trimmed off the row height to get the icon size, so icons scale with the row's font. */
const ICON_INSET = 1

/** Height of a divider row, and of the line drawn inside it. */
const DIVIDER_H = 7
const DIVIDER_LINE_H = 2

/** A horizontal line from vanilla's pda textures, used as the divider. */
const DIVIDER_TEXTURE = "ui_pda2_split_e"

/** Stands in for a row whose property key could not be resolved, so nothing matches it in the config. */
const UNKNOWN: RowKey = "__cmo_unknown"

/** Marks the divider rows this addon inserts between groups. */
const DIVIDER: RowKey = "__cmo_divider"

/** The stock "details" entry, whose label the item's own name can replace: its info icon already says what the row does. */
const DETAILS_FUNCTOR: FunctorKey = "ui_itm_details.menu_details"

/** `[groups]` key holding the group of a row the config does not name, which is most of them. */
const DEFAULT_GROUP_KEY = "default"

/** Used when `[groups] default` is missing, so a stripped-down config still groups. */
const DEFAULT_GROUP = 2

/** The `UIInventory.properties` key prefix marking an addon-owned custom slot. */
const CUSTOM_PREFIX = "custom_"

const ini = new ini_file_ex("plugins\\context_menu_overhaul\\menu.ltx")

const { vec, parse_hex, capitalize } = context_menu_overhaul_utils

/** MCM options, cached because a menu re-reads them for every row of every opening. */
const settings: McmConfig = {
  // Field by field rather than a spread: a spread makes the transpiler define a global `ObjectAssign` in Anomaly's shared Lua state.
  group_related_actions: context_menu_overhaul_mcm.defaultConfig.group_related_actions,
  use_colors: context_menu_overhaul_mcm.defaultConfig.use_colors,
  show_separators: context_menu_overhaul_mcm.defaultConfig.show_separators,
  details_shows_item_name: context_menu_overhaul_mcm.defaultConfig.details_shows_item_name,
  capitalize_labels: context_menu_overhaul_mcm.defaultConfig.capitalize_labels,
}

/** Re-read on `on_option_change`, which is enough: the menu is rebuilt from scratch each time it opens. */
function load_settings() {
  if (!ui_mcm) {
    return
  }
  settings.group_related_actions = ui_mcm.get(
    "context_menu_overhaul/group_related_actions",
  )
  settings.use_colors = ui_mcm.get("context_menu_overhaul/use_colors")
  settings.show_separators = ui_mcm.get("context_menu_overhaul/show_separators")
  settings.details_shows_item_name = ui_mcm.get(
    "context_menu_overhaul/details_shows_item_name",
  )
  settings.capitalize_labels = ui_mcm.get("context_menu_overhaul/capitalize_labels")
}

/** The three keys a row can be configured under, most specific first; the label is first because it is the only one that reflects state. */
function row_keys(property_id: string, label?: string, functor?: FunctorKey) {
  return [label, property_id, functor]
}

/** First non-empty result of `read` over the row's keys, or `null` when the config names none of them. */
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

/** The sections keyed on a row's label rather than on its property id or functor. */
type LabelSection = "label_icons" | "groups" | "colors"

/**
 * The key naming this row in `section`: the label itself, or a translation id that renders to
 * it. Several addons call `game.translate_string` inside their own name functor and hand back
 * finished text, so the id never reaches this addon and a config could otherwise only name
 * such a row in one language. Comparing translations lets it be named by id regardless.
 */
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

/** The item class an entry acts on, mirroring `UIInventory:Name_Equip`, so `to_slot` can carry a different icon per class as its label does. */
function get_variant(obj: CGameObject) {
  const clsid = obj.clsid()
  const sec = obj.section()
  if (IsOutfit(null, clsid)) return "outfit"
  if (IsHeadgear(null, clsid)) return "helmet"
  if (IsItem("backpack", sec)) return "backpack"
  if (IsArtefact(null, clsid)) return "artefact"
  // The attachment kinds, mirroring `UIInventory:Name_Attach`: `attach_1..3` are slot numbers rather than identities, so the item itself is what says which glyph the row wants.
  if (IsItem("sil", sec)) return "sil"
  if (IsItem("scope", sec)) return "scope"
  if (IsItem("gl", sec)) return "gl"
  // Consumables key off `kind`, the field the base game itself categorises items by, so the `use` row can differ between drink, food and meds rather than sharing one glyph.
  const kind = SYS_GetParam<string>(0, sec, "kind")
  // Cigarettes, cigars and joints share `i_drink` but carry a `required_tool` (a light); they are smokes, not beverages, and get their own glyph rather than the glass.
  if (kind === "i_drink") return SYS_GetParam<string>(0, sec, "required_tool") ? "smoke" : "drink"
  if (kind === "i_food" || kind === "i_mutant_cooked" || kind === "i_mutant_raw") return "food"
  if (kind === "i_medical") return "medkit"
  return null
}

/** The icon texture for a menu entry, or `null` when the config declares none, so an incomplete config degrades to no icon. */
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

/** Rows are ordered by group and a divider is drawn wherever it changes. */
function get_group(property_id: string, label?: string, functor?: FunctorKey) {
  return (
    resolve(row_keys(property_id, label && label_key("groups", label), functor), (key) =>
      ini.r_float_ex("groups", key),
    ) ??
    ini.r_float_ex("groups", DEFAULT_GROUP_KEY) ??
    DEFAULT_GROUP
  )
}

/** The row's icon tint as an argb value, or `null` to leave the texture as authored. */
function get_color(property_id: string, label?: string, functor?: FunctorKey) {
  return resolve(row_keys(property_id, label && label_key("colors", label), functor), (key) => {
    const hex = ini.r_string_ex("colors", key)
    return hex ? parse_hex(trim(hex)) : null
  })
}

/** Whether a line has the `<script>.<function>` shape a `[functor_icons]` key needs; the dot is escaped because `string.find` takes a pattern. */
function is_functor_key(line: string): line is FunctorKey {
  return string.find(line, "%.") !== undefined
}

/** The `useN_functor` of a `custom_N` slot, the only stable identity those addon-owned rows have; `null` for the built-in properties. */
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

/** The label as drawn: translated here rather than by the widget, since capitalising it needs the display text and not the translation id. */
function row_label(str_id: string) {
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

/** The screen as the string-keyed table it is in Lua, where a callback is named by a string rather than held as a value. */
function methods_of(screen: UIInventory) {
  // Reinterpreting a luabind class as a table has no honest structural type.
  return screen as unknown as Record<
    string,
    ((...args: unknown[]) => unknown) | undefined
  >
}

/** Whether the screen defines the method a call names; never answered by invoking it, since the tuples name `Action_Drop` and the like. */
function has_method(screen: UIInventory, call: InventoryPropertyCall) {
  return typeof methods_of(screen)[call[0]] === "function"
}

/** Invokes a predicate call the way vanilla does, forwarding the tuple after `(self, obj, bag)`; predicates only, see {@link has_method}. */
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

/** Reimplements vanilla's filter loop to also collect the property keys, the one stable identity a row has and the one thing vanilla never passes on. */
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
    // Statements rather than ternaries: a ternary used as a value makes the transpiler spill a numbered temporary.
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

    // Walked until one is missing, as vanilla does, rather than up to a fixed count: an addon is free to declare a fourth.
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

    // Keyed on `cond` alone, exactly as vanilla appends to `context_str`: it adds the name of every row that passes and the action only if the method exists, so gating on the action here would shift every later key.
    if (cond) {
      keys.push(key)
    }
  }

  pending_keys = keys
  vanilla_init_properties.call(this, obj, bag)
  pending_keys = []
}

const cell_properties = utils_ui.UICellProperties

const vanilla_fill_list = cell_properties.FillList

/** Regroups the rows, inserts the dividers, and parks their keys on the widget for `AddItemToList`. */
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
  // A mismatch means the reimplemented filter disagreed with vanilla's, so the keys cannot be trusted to line up; dropping them costs the icons for this menu instead of putting the wrong one on every row.
  const aligned = pending_keys.length === name_list.length

  for (let i = 0; i < name_list.length; i++) {
    const key = aligned ? pending_keys[i] : UNKNOWN
    const name = name_list[i]
    const params = params_list[i]
    const { obj, functor } = row_identity(key, params)
    const renamed = settings.details_shows_item_name && functor === DETAILS_FUNCTOR && obj
    rows.push({
      key: key,
      action: action_list[i],
      label: name,
      // The item's name replaces the label only for display; grouping and icons still resolve on the original.
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

  /** `false` rather than `nil` for a row this addon inserts: a nil is a hole that truncates the Lua array, while `false` is still falsy for vanilla's `item.func` click guard. */
  const push_inert = (key: RowKey, name: string) => {
    keys.push(key)
    actions.push(false)
    names.push(name)
    labels.push(name)
    params.push(false)
  }

  for (let i = 0; i < rows.length; i++) {
    // Dividers mark group boundaries, so they mean nothing until the rows are grouped.
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
  this.cmo_dividers = []
  this.cmo_inert_rows = []
  // Vanilla's signature has no notion of an inert row, though its own click guard tolerates one.
  vanilla_fill_list.call(
    this,
    actions as string[],
    names,
    params as CellPropertyParams[],
  )
  this.cmo_keys = undefined
  this.cmo_labels = undefined

  // One icon column for the whole form, not one per row, which is what made the menu too wide.
  if (this.cmo_column) {
    this.W = this.W + this.cmo_column
    const size = vec(this.W, this.H)
    this.form.SetWndSize(size)
    this.frame.SetWndSize(size)
    this.list_box.SetWndSize(size)
  }

  // Shifted from the remembered xml position, or the list would creep left on every opening.
  if (this.cmo_list_x === undefined) {
    this.cmo_list_x = this.list_box.GetWndPos().x
  }
  this.list_box.SetWndPos(vec(this.cmo_list_x + LIST_SHIFT, this.list_box.GetWndPos().y))

  // Vanilla sizes a row to its own label, leaving the space right of a short one inside the menu but outside every row, where a click hits nothing.
  for (let i = 0; i < this.list_box.GetSize(); i++) {
    const item = this.list_box.GetItemByIndex(i)
    if (item) {
      item.SetWndSize(vec(this.W - this.PDW, item.GetHeight()))
    }
  }

  // Dividers span the finished menu, so they can only be stretched now that `W` is final.
  const dividers = this.cmo_dividers
  if (dividers) {
    for (let i = 0; i < dividers.length; i++) {
      dividers[i].SetWndSize(vec(this.W - this.PDW, DIVIDER_LINE_H))
    }
  }
  this.cmo_dividers = undefined
}

/** The icon's height: the row's, less the inset. */
function icon_size(item: CUIListBoxItem) {
  return item.GetHeight() - ICON_INSET * 2
}

/** Narrowed by the screen ratio, since the ui is authored in a 1024x768 space the engine stretches, which drew square icons as ovals. */
function icon_width(item: CUIListBoxItem) {
  return icon_size(item) * utils_xml.screen_ratio()
}

/** How far a row's text is indented, shared so the header lines up with the labels below it. */
function column_width(item: CUIListBoxItem) {
  return icon_width(item) + ICON_GAP
}

/** Indents a row's text past the icon column and widens the row to match. */
function indent_row(item: CUIListBoxItem, text: CUITextWnd, column: number) {
  text.SetWndPos(vec(column, 0))
  item.SetWndSize(vec(item.GetWidth() + column, item.GetHeight()))
}

/** Remembers a row `Update` must not highlight, because it carries no action. */
function mark_inert(widget: UICellProperties, index: number) {
  const rows = widget.cmo_inert_rows
  if (rows) {
    rows.push(index)
  }
}

const vanilla_add_item = cell_properties.AddItemToList

/** Draws this addon's own rows and adds the icon to the game's, once vanilla has sized the finished row. */
const add_item_to_list = function (
  this: UICellProperties,
  index: number,
  str_id: string,
  func: string,
  params?: CellPropertyParams,
) {
  vanilla_add_item.call(this, index, str_id, func, params)

  // Plain `if`s rather than `?.` throughout: optional chaining spills a numbered temporary per link into the generated script.
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
    // Vanilla already added a full row's height to `H`; give the difference back, or the menu ends with a gap.
    this.H = this.H - (this.file_item_fn_sz.y - DIVIDER_H)
    item.SetWndSize(vec(item.GetWidth(), DIVIDER_H))
    text.SetWndSize(vec(0, 0))
    const line = item.AddIconField(DIVIDER_LINE_H)
    if (line) {
      line.InitTexture(DIVIDER_TEXTURE)
      line.SetStretchTexture(true)
      line.SetWndPos(vec(0, (DIVIDER_H - DIVIDER_LINE_H) / 2))
      const dividers = this.cmo_dividers
      if (dividers) {
        dividers.push(line)
      }
    }
    mark_inert(this, row)
    return
  }

  // The column is reserved on every row, icon or not, so the labels stay aligned.
  const column = column_width(item)
  indent_row(item, text, column)
  this.cmo_column = column

  const { obj, functor } = row_identity(key, params)
  // Icons key on the raw translation id `InitProperties` collected, not on the text drawn, which this addon may have rewritten.
  const labels = this.cmo_labels
  const label = labels ? labels[row] : str_id

  // Colours both the label and the glyph. Computed once, applied to the text even on rows that carry no icon.
  const color = settings.use_colors ? get_color(key, label, functor) : null
  if (color) {
    text.SetTextColor(color)
  }

  const texture = get_icon(key, label, obj, functor)
  if (!texture) {
    return
  }

  const width = icon_width(item)
  const icon = item.AddIconField(width)
  if (!icon) {
    return
  }
  // `InitTexture` sizes the static from a registered id's source rect, so the box is set after it.
  icon.InitTexture(texture)
  icon.SetStretchTexture(true)
  icon.SetWndPos(vec(0, ICON_INSET))
  icon.SetWndSize(vec(width, icon_size(item)))

  if (color) {
    icon.SetTextureColor(color)
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

/** Re-sizes the hover strip, which vanilla takes from the text control and which no longer spans the row once the icon column exists. */
const update = function (this: UICellProperties) {
  vanilla_update.call(this)
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
      // Sized to the form, since a row is only as wide as its own label and the widest strip ran past the frame.
      this.highlight.SetWndSize(vec(this.form.GetWidth() - this.PDH, item.GetHeight()))
      return
    }
  }
}

/** Called by `axr_main` for every script defining it, which also guarantees the patched classes are loaded. */
export function on_game_start() {
  ui_inventory.UIInventory.InitProperties = init_properties
  cell_properties.FillList = fill_list
  cell_properties.AddItemToList = add_item_to_list
  cell_properties.Update = update

  load_settings()
  RegisterScriptCallback("on_option_change", load_settings)
}
