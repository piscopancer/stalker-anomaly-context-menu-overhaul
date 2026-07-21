// Icons for the inventory item context menu. The menu is built by
// `UIInventory:InitProperties` and drawn by `UICellProperties` (`utils_ui.script`); rows
// support icons natively through `CUIListBoxItem::AddIconField`, so all this does is get a
// stable key down to the row that draws it.

/**
 * How far the whole list is shifted left, reclaiming the widget's left padding. Applied to
 * the list box rather than to the icon: a negative x on the icon puts it partly outside its
 * row, and the row clips it.
 */
const LIST_SHIFT = -6

/** Gap between the icon and the row's text. */
const ICON_GAP = 2

/** Trimmed off the row height to get the icon size, so icons scale with the row's font. */
const ICON_INSET = 1

const ini = new ini_file_ex("plugins\\context_menu_icons\\icons.ltx")

/** The `UIInventory.properties` key prefix marking an addon-owned custom slot. */
const CUSTOM_PREFIX = "custom_"

/**
 * The MCM options, cached rather than read per row: a menu redraws every row on every open,
 * and `ui_mcm.get` parses a path each time.
 *
 * Refreshed from the `on_option_change` callback, so a change applies to the next menu the
 * player opens without reloading the save. Nothing needs invalidating beyond this table —
 * the menu is rebuilt from scratch each time it is shown.
 */
const settings = {
  group_related_actions: context_menu_icons_mcm.defaultConfig.group_related_actions,
  show_colored_icons: context_menu_icons_mcm.defaultConfig.show_colored_icons,
  show_separators: context_menu_icons_mcm.defaultConfig.show_separators,
}

/** Reads the options, falling back to the defaults when MCM is not installed. */
function load_settings() {
  if (!ui_mcm) {
    return
  }
  settings.group_related_actions = ui_mcm.get(
    "context_menu_icons/group_related_actions",
  )
  settings.show_colored_icons = ui_mcm.get("context_menu_icons/show_colored_icons")
  settings.show_separators = ui_mcm.get("context_menu_icons/show_separators")
}

/**
 * The class of item an entry acts on, when that changes what the entry means. `to_slot` and
 * `to_ruck` are single property keys whose label the game rewrites per item class — the same
 * `to_slot` reads "wear backpack", "equip" or "move to slot" depending on what is clicked
 * (`UIInventory:Name_Equip`) — so keying the icon on the property alone cannot tell them
 * apart. This mirrors that branch, in the same order, so the icon follows the visible label.
 */
function get_variant(obj: CGameObject) {
  const clsid = obj.clsid()
  if (IsOutfit(null, clsid)) return "outfit"
  if (IsHeadgear(null, clsid)) return "helmet"
  if (IsItem("backpack", obj.section())) return "backpack"
  if (IsArtefact(null, clsid)) return "artefact"
  return null
}

/**
 * The icon texture for a menu entry, or `null` when none is configured. Looked up most
 * specific first: the item-class variant (`to_slot@backpack`), then the bare property key,
 * then — for `custom_N` rows — the functor. Every step is optional, so a config that declares
 * only bare keys keeps working and a variant is purely an opt-in refinement.
 */
export function get_icon(
  property_id: string,
  label?: string,
  obj?: CGameObject,
  functor?: FunctorKey,
) {
  // The label is tried first because it is the only key that reflects state. A row whose
  // text toggles keeps one property id, so this is what lets "mark as favourite" and
  // "unmark" differ.
  if (label) {
    const by_label = ini.r_string_ex("label_icons", label)
    if (by_label) {
      return by_label
    }
  }
  let variant: string | null = null
  if (obj) {
    variant = get_variant(obj)
  }
  if (variant) {
    const specific = ini.r_string_ex("icons", `${property_id}@${variant}`)
    if (specific) {
      return specific
    }
  }
  const direct = ini.r_string_ex("icons", property_id)
  if (direct) {
    return direct
  }
  if (!functor) {
    return null
  }
  return ini.r_string_ex("functor_icons", functor)
}

/** Rows with no `[groups]` entry, which is most of them. */
const DEFAULT_GROUP = 2

/** Marks a row this addon inserted rather than one the game asked for. */
const DIVIDER = "__cmi_divider"

/** Height of a divider row, and of the line drawn inside it. */
const DIVIDER_H = 7
const DIVIDER_LINE_H = 2

/** A horizontal line from vanilla's pda textures, used as the divider. */
const DIVIDER_TEXTURE = "ui_pda2_split_e"

/**
 * The group a row belongs to. Resolved through the same three keys as its icon, so a row can
 * be grouped by whichever one the config happens to name.
 */
function get_group(property_id: string, label?: string, functor?: FunctorKey) {
  const keys = [label, property_id, functor]
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (key) {
      const group = ini.r_float_ex("groups", key)
      if (group) {
        return group
      }
    }
  }
  return DEFAULT_GROUP
}

/**
 * The text colour for a row as an argb value, or `null` to keep the game's own. Resolved
 * through the same three keys as its icon.
 */
function get_color(property_id: string, label?: string, functor?: FunctorKey) {
  const keys = [label, property_id, functor]
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    if (key) {
      const hex = ini.r_string_ex("colors", key)
      if (hex) {
        return parse_hex(trim(hex))
      }
    }
  }
  return null
}

/**
 * `#rrggbb` or `#rrggbbaa` as an argb value. Hex is what the colour is authored as, so it is
 * what the ltx holds; splitting it into channels is this addon's problem, not the config's.
 * Returns `null` for anything malformed, leaving the row its own colour rather than drawing
 * it in an arbitrary one.
 */
function parse_hex(hex: string) {
  // Destructured: `string.match` is a multi-return, one value per capture.
  const [digits] = string.match(hex, "^#(%x+)$")
  if (!digits || (string.len(digits) !== 6 && string.len(digits) !== 8)) {
    return null
  }
  const channel = (at: number) => tonumber(string.sub(digits, at, at + 1), 16) ?? 255
  const alpha = string.len(digits) === 8 ? channel(7) : 255
  return GetARGB(alpha, channel(1), channel(3), channel(5))
}

/**
 * The `useN_functor` of a `custom_N` slot as `<script>.<function>`, read from the item's own
 * ltx like `UIInventory:Name_Custom` does. `null` for the built-in properties.
 */
function get_custom_functor(property_id: string, obj: CGameObject) {
  // Lua's own string functions rather than the JavaScript ones. `startsWith`/`slice`/`includes`
  // make the transpiler inline its string library into the output, which both bloats the
  // script and defines those helpers as globals — a real collision risk in a shared Lua state.
  if (string.sub(property_id, 1, string.len(CUSTOM_PREFIX)) !== CUSTOM_PREFIX) {
    return null
  }
  const slot = string.sub(property_id, string.len(CUSTOM_PREFIX) + 1)
  // The line is already `<script>.<function>` — the exact shape of a `[functor_icons]` key —
  // so it is used whole rather than split and rejoined. Note it is dot-separated, not comma
  // separated: `UIInventory:Name_Custom` splits it on `"%."`.
  const line = SYS_GetParam<FunctorKey>(0, obj.section(), `use${slot}_functor`)
  if (!line) {
    return null
  }
  const key = trim(line) as FunctorKey
  // Guard the shape rather than trusting it: a malformed line should mean "no icon", not a
  // lookup with a nonsense key. The dot is escaped — `string.find` takes a pattern.
  return string.find(key, "%.") ? key : null
}

// --- Threading the property key through to the row ------------------------------------
//
// Vanilla `InitProperties` passes the widget only names, callbacks and params — never the
// property key, the one stable identity a row has. This reimplements it to also collect the
// keys. A copy rather than a wrapper because they must be captured inside the filter loop;
// it still iterates `self.properties`, so other addons' entries keep working.

/** The screen as the string-keyed table it is in Lua — callbacks are named as data. */
function methods_of(screen: UIInventory) {
  return screen as unknown as Record<
    string,
    ((...args: unknown[]) => unknown) | undefined
  >
}

/**
 * Whether the screen defines the method a call names, as vanilla checks before dispatching.
 * Never answer this by calling it: the tuples name `Action_Drop`, `Action_Move` and the
 * like, so probing by invocation would perform the action while building the menu.
 */
function has_method(screen: UIInventory, call: InventoryPropertyCall) {
  return typeof methods_of(screen)[call[0]] === "function"
}

/**
 * Invokes a predicate call, `false` if the method is missing. The tuple is forwarded after
 * `(self, obj, bag)`, method name included, as vanilla does. Predicates only — never
 * `action`, see {@link has_method}.
 */
function call_predicate(
  screen: UIInventory,
  call: InventoryPropertyCall,
  obj: CGameObject,
  bag: string,
) {
  const method = methods_of(screen)[call[0]]
  if (!method) {
    return false
  }
  return !!method(screen, obj, bag, ...call)
}

/** The key list for the menu currently being built, handed from `InitProperties` to `FillList`. */
let pending_keys: InventoryPropertyId[] = []

const vanilla_init_properties = ui_inventory.UIInventory.InitProperties

/** Replacement for `UIInventory:InitProperties` — see the note above. */
const init_properties = function (
  this: UIInventory,
  obj: CGameObject,
  bag: string,
) {
  if (!(obj && bag)) {
    return
  }

  const keys: InventoryPropertyId[] = []

  for (const [key, props] of spairs(this.properties, ui_inventory.func_index)) {
    // `cont`/`mode` are authored as arrays but turned into key-sets by `t2k_table`, so
    // both are membership lookups. A `*_func` overrides its table, but only if defined.
    //
    // Written as statements rather than nested ternaries: a ternary used as a value makes
    // the transpiler spill a numbered temporary into the generated script.
    let bag_allowed = true
    if (props.cont_func && has_method(this, props.cont_func)) {
      bag_allowed = call_predicate(this, props.cont_func, obj, bag)
    } else if (props.cont) {
      bag_allowed = props.cont[bag as InventoryContainer] === true
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

    // Preconditions, evaluated as `precondition1`, `precondition2`, ... until one fails.
    // Indexed rather than `for...of`: iterating a literal compiles to `ipairs` with a
    // discarded key, which the transpiler names `____`.
    const preconds = [props.precondition1, props.precondition2, props.precondition3]
    let cond = true
    for (let i = 0; i < preconds.length; i++) {
      const precond = preconds[i]
      if (!cond || !precond) {
        break
      }
      cond = call_predicate(this, precond, obj, bag)
    }

    // Only entries with a callable action reach the list, as in vanilla.
    if (cond && props.action && has_method(this, props.action)) {
      keys.push(key)
    }
  }

  pending_keys = keys
  vanilla_init_properties.call(this, obj, bag)
  pending_keys = []
}

// --- Drawing the icon -----------------------------------------------------------------

// The class table, reached through its script namespace — the handle Anomaly patches.
const cell_properties = utils_ui.UICellProperties

const vanilla_fill_list = cell_properties.FillList

/** Replacement for `UICellProperties:FillList`, parking the key list for the fill. */
const fill_list = function (
  this: UICellProperties,
  action_list: string[],
  name_list: string[],
  params_list: CellPropertyParams[],
) {
  // Rows are regrouped before the widget sees them, so vanilla still builds every row and
  // this addon only decides the order and where the dividers fall.
  const rows: {
    key: InventoryPropertyId
    action: string
    name: string
    params: CellPropertyParams
    group: number
  }[] = []
  for (let i = 0; i < name_list.length; i++) {
    const key = pending_keys[i]
    const name = name_list[i]
    const row_params = params_list[i]
    // The functor has to be resolved here too, not just when the icon is drawn: a row like
    // "details" is a `custom_N` slot whose only stable identity is its functor, so grouping
    // it by property id alone would silently leave it in the default group.
    let functor: FunctorKey | undefined = undefined
    if (row_params) {
      const obj = level.object_by_id(row_params[0])
      if (obj) {
        const found = get_custom_functor(key, obj)
        if (found) {
          functor = found
        }
      }
    }
    rows.push({
      key: key,
      action: action_list[i],
      name: name,
      params: row_params,
      group: get_group(key, name, functor),
    })
  }

  // Insertion sort on group only, so rows within a group keep the order the game gave them.
  // `table.sort` is not stable, which would shuffle same-group rows between openings.
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

  const keys: InventoryPropertyId[] = []
  const actions: string[] = []
  const names: string[] = []
  const params: CellPropertyParams[] = []
  for (let i = 0; i < rows.length; i++) {
    // A divider carries no action: `OnListItemClicked` guards on `item.func`, so a row
    // without one is inert and cannot be triggered by clicking it.
    //
    // `false`, not `nil`. A nil in a Lua array is a hole: `#list` stops there, so every
    // later row lands at the wrong index — which shifts the actions and leaves rows after a
    // divider without their params. `false` is a value, keeps the array contiguous, and is
    // still falsy for the click guard.
    // Separators mark group boundaries, so they only make sense once the rows are grouped:
    // ungrouped, the same group can appear several times and every change would draw a line.
    if (
      settings.group_related_actions &&
      settings.show_separators &&
      i > 0 &&
      rows[i].group !== rows[i - 1].group
    ) {
      keys.push(DIVIDER as InventoryPropertyId)
      actions.push(false as unknown as string)
      names.push("")
      params.push(false as unknown as CellPropertyParams)
    }
    keys.push(rows[i].key)
    actions.push(rows[i].action)
    names.push(rows[i].name)
    params.push(rows[i].params)
  }

  // `AddItemToList` gets only a row index, so the keys are parked on the widget.
  this.cmi_keys = keys
  this.cmi_column = undefined
  this.cmi_dividers = []
  this.cmi_divider_rows = []
  vanilla_fill_list.call(this, actions, names, params)
  this.cmi_keys = undefined

  // Vanilla sized the form to the text alone, so it is widened by exactly one icon column —
  // not per row, which is what made the menu too wide.
  if (this.cmi_column) {
    this.W = this.W + this.cmi_column
    const size = new vector2().set(this.W, this.H)
    this.form.SetWndSize(size)
    this.frame.SetWndSize(size)
    this.list_box.SetWndSize(size)
  }

  // Shift the list once per widget, from its xml position — `FillList` runs on every menu
  // open, so shifting relative to the current position would creep left each time.
  if (this.cmi_list_x === undefined) {
    this.cmi_list_x = this.list_box.GetWndPos().x
  }
  this.list_box.SetWndPos(
    new vector2().set(this.cmi_list_x + LIST_SHIFT, this.list_box.GetWndPos().y),
  )

  // Dividers span the finished menu, so they can only be stretched now that every row has
  // been measured and `W` is final.
  const dividers = this.cmi_dividers
  if (dividers) {
    for (let i = 0; i < dividers.length; i++) {
      dividers[i].SetWndSize(new vector2().set(this.W - this.PDW, DIVIDER_LINE_H))
    }
  }
  this.cmi_dividers = undefined
}

const vanilla_add_item = cell_properties.AddItemToList

/** Replacement for `UICellProperties:AddItemToList`, adding the icon to the finished row. */
const add_item_to_list = function (
  this: UICellProperties,
  index: number,
  str_id: string,
  func: string,
  params?: CellPropertyParams,
) {
  vanilla_add_item.call(this, index, str_id, func, params)

  // Guarded with plain `if`s rather than `?.`/`??` throughout this file: optional chaining
  // makes the transpiler spill a numbered temporary for every link in the chain, which reads
  // badly in the generated script for no benefit here.
  const item = this.list_box.GetItemByIndex(this.list_box.GetSize() - 1)
  if (!item) {
    return
  }
  const text = item.GetTextItem()
  if (!text) {
    return
  }

  // `index` is vanilla's 1-based row number.
  const keys = this.cmi_keys
  if (!keys) {
    return
  }
  const key = keys[index - 1]
  if (!key) {
    return
  }

  // A divider is this addon's own row: a short line spanning the menu, no text and no icon.
  // Its width is set later, once every row has been measured.
  if (key === DIVIDER) {
    // Vanilla already added a full row's height to `H`; give back the difference, or the
    // menu ends up taller than its rows and shows a gap at the bottom.
    this.H = this.H - (item.GetHeight() - DIVIDER_H)
    item.SetWndSize(new vector2().set(item.GetWidth(), DIVIDER_H))
    text.SetWndSize(new vector2().set(0, 0))
    const line = item.AddIconField(DIVIDER_LINE_H)
    if (line) {
      line.InitTexture(DIVIDER_TEXTURE)
      line.SetStretchTexture(true)
      line.SetWndPos(new vector2().set(0, (DIVIDER_H - DIVIDER_LINE_H) / 2))
      const dividers = this.cmi_dividers
      if (dividers) {
        dividers[dividers.length] = line
      }
    }
    // Remembered for `Update`, which must not highlight a row that cannot be clicked.
    const rows = this.cmi_divider_rows
    if (rows) {
      rows[rows.length] = index - 1
    }
    return
  }

  // The icon fills the row's height; the column is reserved on every row, icon or not, so
  // the labels stay aligned whether or not one is configured.
  //
  // Width is narrowed by the screen ratio. The ui is authored in a fixed 1024x768 space that
  // the engine stretches to fill the display, so a box that is square in ui units is drawn
  // wider than it is tall on anything but 4:3 — which turned round icons into ovals.
  const size = item.GetHeight() - ICON_INSET * 2
  const width = size * utils_xml.screen_ratio()
  const column = width + ICON_GAP
  text.SetWndPos(new vector2().set(column, 0))
  item.SetWndSize(new vector2().set(item.GetWidth() + column, item.GetHeight()))
  // `FillList` grows the form by this once, after vanilla has sized it from the text alone.
  this.cmi_column = column

  let obj: CGameObject | null = null
  if (params) {
    obj = level.object_by_id(params[0])
  }
  let functor: FunctorKey | undefined = undefined
  if (obj) {
    const found = get_custom_functor(key, obj)
    if (found) {
      functor = found
    }
  }

  // `str_id` is the row's label as `InitProperties` collected it — the raw translation id,
  // before the widget translates it for display.
  const texture = get_icon(key, str_id, obj ? obj : undefined, functor)
  if (!texture) {
    return
  }

  // `InitTexture` sizes the static from the texture, so it has to run before the box is
  // set; a registered id carries a source rect and would otherwise draw at artwork size.
  const icon = item.AddIconField(width)
  if (!icon) {
    return
  }
  icon.InitTexture(texture)
  icon.SetStretchTexture(true)
  icon.SetWndPos(new vector2().set(0, ICON_INSET))
  icon.SetWndSize(new vector2().set(width, size))

  // Tints the icon rather than the label: a coloured glyph reads as a property of the action,
  // where coloured text reads as the row being disabled or selected.
  if (settings.show_colored_icons) {
    const color = get_color(key, str_id, functor)
    if (color) {
      icon.SetTextureColor(color)
    }
  }
}

const vanilla_update = cell_properties.Update

/**
 * Vanilla sizes the hover strip from the text control, which no longer spans the row once
 * the icon column exists, so it is re-sized to the row. Position and visibility stay theirs.
 */
const update = function (this: UICellProperties) {
  vanilla_update.call(this)
  if (!this.highlight.IsShown()) {
    return
  }
  for (let i = 0; i <= this.list_box.GetSize(); i++) {
    const item = this.list_box.GetItemByIndex(i)
    if (item && item.IsCursorOverWindow()) {
      // A divider is not an entry. It carries no action, so highlighting it would advertise
      // a click that does nothing.
      if (is_divider_row(this, i)) {
        this.highlight.Show(false)
        return
      }
      // Sized to the form, not to the row: rows are only as wide as their own label, so
      // the widest one's strip ran past the frame. `PDH` matches vanilla's x offset.
      this.highlight.SetWndSize(
        new vector2().set(this.form.GetWidth() - this.PDH, item.GetHeight()),
      )
      return
    }
  }
}

/** Whether the row at `index` is one of this addon's dividers rather than a menu entry. */
function is_divider_row(widget: UICellProperties, index: number) {
  const rows = widget.cmi_divider_rows
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

/**
 * `axr_main.on_game_start` calls this for every script defining it, which also guarantees
 * `ui_inventory` and `utils_ui` are loaded before their class tables are patched.
 */
export function on_game_start() {
  ui_inventory.UIInventory.InitProperties = init_properties
  cell_properties.FillList = fill_list
  cell_properties.AddItemToList = add_item_to_list
  cell_properties.Update = update

  load_settings()
  // MCM fires this when the player applies a change. The menu is rebuilt from scratch every
  // time it opens, so re-reading here is all that a change needs — no save reload.
  RegisterScriptCallback("on_option_change", load_settings)
}
