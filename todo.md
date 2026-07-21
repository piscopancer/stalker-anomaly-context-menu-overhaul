todo

- ~~create a separator. it will separate groups.~~ Done — `[groups]` in `icons.ltx` assigns a
  number per row, rows are ordered by it and a divider is drawn wherever it changes. Group 1
  is info, 2 is favourite/junk, 3 is the default catch-all, 4 is destructive (drop,
  disassemble). Keys resolve like icons do: label, then property id, then functor.
- ~~add colors (useful for destructive - red)~~ Done — `[colors]`, keyed per row rather than
  per group, so any single entry can be coloured. Only the destructive rows are set.

# Context Menu Icons — plan

The goal is to draw a small icon next to every entry of the right-click context menu on
inventory items, and to let other addons contribute icons for their own entries through a
DLTX-mergeable ltx file rather than through code.

Scope for the first version is the inventory item menu only. The PDA map spot menu and any
other list menus are deliberately left out until the inventory case works end to end; the
widget written here is meant to be reusable for them later. No engine (C++) change is
planned — everything is done from Lua and XML on top of stock Anomaly 1.5.3.

## What the engine and the game scripts actually do

This has already been checked in the unpacked 1.5.3 scripts, and it shapes the whole design.

The menu is built in `UIInventory:InitProperties` (`ui_inventory.script:698`). It walks the
`self.properties` table (`ui_inventory.script:234`), whose keys are exactly the stable
action ids we want to key icons on: `use`, `attach_1..3`, `to_slot`, `to_ruck`, `move`,
`move_all`, `donate`, `unload`, and `custom_1..10`. For each entry that passes its
preconditions it appends to three parallel arrays — a name, an action method name, and a
params tuple — and hands them to `self.item_props:Reset(...)`.

The important problem is that the property key is **not** among the three arrays. By the
time the widget builds its rows it only knows the display string and the callback, so the
icon lookup has nothing stable to key on. The first task is therefore to carry a fourth
parallel array of property keys through `InitProperties` → `Reset` → `FillList` →
`AddItemToList`.

The widget itself is `UICellProperties` in `utils_ui.script:3162`. Rows are
`UICellProperties_item`, a `CUIListBoxItem` subclass whose only child is the text control
returned by `GetTextItem()`. Row and list sizing is computed by hand in `AddItemToList`
(`utils_ui.script:3330`) from `AdjustWidthToText()`, and the hover highlight in `Update`
is positioned from `textControl`'s size. Adding an icon means widening each row by the icon
box, shifting the text right by the same amount, and updating both the running `self.W` and
the highlight rect — otherwise the icon will overlap the text or fall outside the frame.
Note the deliberate `W_L`/`H_L` minimums: the frame crashes the game if drawn smaller than
its `textures_desc` corner size.

The `custom_1..10` slots are the addon extension points, and their ids are not stable
identities — slot 3 is whichever addon registered third. Their real identity comes from the
item's own ltx (`useN_functor`, read in `UIInventory:Name_Custom`,
`ui_inventory.script:835`), which names a script namespace and function. So custom entries
must be keyed on that functor pair, not on the `custom_N` slot number.

## Engine findings

All three questions are now settled against the xray-monolith sources; no engine change is
needed and no fallback rendering trick is required.

**Icons in list rows are a first-class engine feature.** `CUIListBoxItem::AddIconField`
(`src/xrGame/ui/UIListBoxItem.cpp:105`) creates a `CUIStatic`, sizes it to the row height,
and attaches it as a child — and it is exported to Lua at
`src/xrGame/ui/UIListBox_script.cpp:55`, alongside `AddTextField`. Rows draw through plain
`CUIWindow::Draw`, so children render normally. The one catch is ordering: `AddIconField`
positions the new field at `FieldsLength()`, the right edge of the _last_ attached child.
Since `CUIListBoxItem`'s constructor already creates the text field, an icon added
afterwards lands to the right of the text. To put the icon first we either call
`SetWndPos` on both fields explicitly after creating them, or subclass and lay the row out
ourselves. Decided: explicit positioning — call `AddIconField`, then `SetWndPos` on the icon and the
text so the icon sits at x=0 and the text is shifted right by the icon width.

**Textures do not need a `textures_desc` entry.** `CUITextureMaster::InitTexture`
(`src/xrGame/ui/UITextureMaster.cpp:96`) looks the name up in the registered texture map
and, on a miss, falls through to `tc->CreateShader(texture_name, shader_name)` — it treats
the string as a direct texture path. So a declared `textures_desc` id and a raw path to a
DDS both work. Declared ids additionally carry a source rect and set the static's size for
free; a raw path does not, so with raw paths we must set the size ourselves. Third-party
icons can therefore be pure data, which is what the ltx-based extension model needs.
Decided: `icons.ltx` values are raw DDS paths (`ui\ui_cmi_icons\use`), so a contributing
addon ships a texture and one ltx line and nothing else. Because raw paths carry no rect,
the icon size is set explicitly from a single shared constant.

**`AdjustWidthToText` ignores position entirely.** Both `CUIStatic::AdjustWidthToText`
(`UIStatic.cpp:255`) and the `CUITextWnd` variant (`UIStatic.cpp:297`) just measure the
string with `SizeOf_` and call `SetWidth` — the `x` offset is untouched. So it stays usable
after shifting the text right; the row width simply has to be computed as icon width plus
the adjusted text width rather than the text width alone.

## Configuration format

Icons are declared in `configs/plugins/context_menu_icons/icons.ltx`, extended by other
addons through DLTX (`mod_icons_<addon>.ltx`), which needs no cooperation from this addon.

```ini
[icons]
use                     = ui_icons_context\use
unload                  = ui_icons_context\unload
to_slot                 = ui_icons_context\equip

[functor_icons]
; for custom_N entries, keyed on "<script>.<function>" from the item's useN_functor
my_addon.repair_item    = ui_icons_context\repair
```

Lookup order per row: the property key in `[icons]`; for a `custom_N` row, the resolved
functor in `[functor_icons]`; otherwise no icon and the row keeps its current layout, so an
incomplete config degrades cleanly instead of leaving a gap.

## Status

The first version is built and ready to test in game. `build/gamedata` holds
`scripts/context_menu_icons.script` and `configs/plugins/context_menu_icons/icons.ltx`.

The earlier "no scripts emitted" note was a misconfiguration, not a packer bug: `pack`'s
`scripts` option lists file names under `gamedata/scripts`, and it had been copied from the
reference project verbatim. The entry script is now `scripts/index.ts`, which the packer
emits as the bare addon id.

Patching happens in `on_game_start`, which `axr_main` calls for every script that defines
one. That is also what guarantees `ui_inventory` and `utils_ui` are loaded before their
class tables are patched.

Icons are currently Anomaly's own inventory sort-button textures, used as placeholders so
the feature is testable before any art exists. They are the wrong pictures for the actions
on purpose. Shipping real icons means replacing the values in `icons.ts` — a `textures_desc`
id and a raw DDS path both resolve, so nothing else has to change.

Known loose ends: `build/gamedata/tsconfig.json` is copied into the build and should not be;
nothing has been confirmed in game yet.

## Order of work

1. Scaffold `env.d.ts` with the `IniFileSchemas` entry for `icons.ltx` and the ambient
   declarations for this addon's script namespace.
2. ~~Verify the three engine questions.~~ Done — see Engine findings.
3. Ship the icon set and the default `icons.ltx` for the ten built-in property keys.
4. Monkey-patch `UIInventory:InitProperties` and the `UICellProperties` methods from a
   script that loads after `ui_inventory`, threading the property key through and drawing
   the icon. Patching rather than forking keeps this compatible with other addons that
   only add properties.
5. Resolve `useN_functor` for the custom slots and wire `[functor_icons]`.
6. MCM toggle for icon on/off and icon size, once the rest is stable.
7. Real icon artwork, replacing the placeholder texture ids.

## Later

The PDA map spot menu is the next surface; it uses a different builder, so step 4's widget
work has to be factored so the drawing code does not assume `UIInventory` is the owner.
Beyond that: per-item-type icon overrides (a different icon for `use` on food vs. on a
medkit), and a small registration helper for addons that would rather call a function than
ship an ltx.
