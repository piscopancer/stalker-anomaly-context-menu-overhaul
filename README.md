# Context Menu Overhaul

An overhaul of the right-click menu on inventory items in S.T.A.L.K.E.R. Anomaly 1.5.3. Every entry
gets an icon, related entries are grouped and separated by a divider, destructive ones are tinted
red, labels are capitalized, and the "Details" entry shows the item's own name. No engine change,
no exe patch, save-safe.

Everything except the drawing itself is data. The mapping from menu entry to icon, group and colour
lives in `configs/plugins/context_menu_overhaul/icons.ltx`, which any addon extends through DLTX
without this addon knowing it exists.

## Options

All five are toggleable in MCM and on by default. MCM itself is optional — without it the addon runs
with everything on.

| Option | Effect |
| --- | --- |
| Group related actions | Reorders entries by group; information first, destructive last |
| Show colored icons | Tints an entry's icon from `[colors]` |
| Show separators | Draws a divider wherever the group changes |
| Details option shows item's name | Replaces the "Details" label with the item's inventory name |
| Capitalize options | Upper-cases the first letter of every label, Cyrillic included |

## Configuration

Ship a DLTX patch named `mod_icons_<your addon>.ltx` in `configs/plugins/context_menu_overhaul/`.
It merges on load, and if the player does not have this addon installed the file is never read — so
this is not a dependency.

```ini
![functor_icons]
my_addon.menu_repair = ui\my_addon\repair_icon

![icons]
my_property_id = ui_cmo_tools

![groups]
my_addon.menu_repair = 2

![colors]
my_addon.menu_destroy = #ff4444
```

A value is either a `textures_descr` id or a direct path to a dds file, so a texture plus one ltx
line is enough — no xml, no script.

### Sections

Every section is optional, and a missing entry means "no icon" rather than an error.

- **`[icons]`** — keyed on the entry's property id (`use`, `to_slot`, `drop`, …).
- **`[functor_icons]`** — keyed on the `<script>.<function>` pair from the item's `useN_functor`.
  This is how `custom_1..10` entries are identified, since the slot number is positional and says
  nothing about which addon owns it.
- **`[label_icons]`** — keyed on the entry's translation id. The only key that changes when an
  action toggles, so it is where "mark as favourite" and "unmark" get different icons.
- **`[groups]`** — a number per entry. Entries are ordered by it and a divider is drawn wherever it
  changes; within a group the game's own order is kept. The `default` key holds the group everything
  unlisted falls into.
- **`[colors]`** — `#rrggbb` or `#rrggbbaa`, tinting the entry's icon.

### Variants

One property id can produce several labels: `to_slot` reads "wear outfit", "wear helmet" or "move to
slot" depending on what was clicked. Append `@<class>` to give each its own icon, and the bare key
stays as the fallback.

```ini
[icons]
to_slot          = ui_cmo_hand
to_slot@outfit   = ui_cmo_vest
to_slot@helmet   = ui_cmo_helmet
to_slot@backpack = ui_cmo_backpack
attach_1@sil     = ui_cmo_silencer
attach_1@scope   = ui_cmo_scope
attach_1@gl      = ui_cmo_gl
```

Available classes: `outfit`, `helmet`, `backpack`, `artefact`, `sil`, `scope`, `gl`.

### Lookup order

Label, then property id (variant before bare), then functor. The most specific thing you declare
wins.

### From a script

```lua
local texture = context_menu_overhaul.get_icon(property_id, label, obj, functor)
```

Every argument except the first is optional; returns `nil` when nothing is configured.

## How it works

`UIInventory:InitProperties` is reimplemented to collect the property key of each entry it accepts —
the one stable identity an entry has, and the one thing vanilla never passes on to the widget.
`UICellProperties`'s `FillList`, `AddItemToList` and `Update` are then replaced to regroup the rows,
insert the dividers, draw the icon through `CUIListBoxItem::AddIconField`, and size the hover strip
to the full row. The keys are parked on the widget for the duration of a fill, because
`AddItemToList` is handed only a row index.

If the collected key list ever disagrees in length with vanilla's name list, the keys are dropped for
that menu: the icons disappear rather than landing on the wrong rows.

## Building

The addon is written in TypeScript and transpiled to Lua with
[anomaly-packer](https://github.com/piscopancer/anomaly-packer).

```sh
pnpm install
pnpm build     # gamedata -> build/gamedata
pnpm deploy    # build/gamedata -> the game's mods folder
pnpm dev       # both
pnpm archive   # a zip ready for release
```

The icon sheet is `gamedata/textures/ui/cmo_icons.dds`, a 4-column grid of 64px cells; its rects are
declared in `gamedata/configs/ui/textures_descr/ui_cmo_icons.tsx`.
