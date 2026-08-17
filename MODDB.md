# Context Menu Overhaul

This addon gives every context menu option a colored icon, groups related entries together with a divider between the groups, capitalizes the labels and even more. Options are toggleable in MCM.

## Compatibility

Works with addons that add their own entries to the menu.

- SortingPlus by RavenAscendant
- Quick Action Wheel by HarukaSai
- Weapon Parts Overhaul by arti
- Ammo Maker by arti
- Indirect Parts Favoriter by G_FLAT
- Disassemble All Items
- Combine All Items
- Anomaly Lootboxes
- Filters Redux
- TB's RF Receiver Hidden Package Sidequests
- Placeable Furniture
- Artifacts Inspection Redone

## For addon makers

Create a DLTX patch named `mod_menu_<your addon>.ltx` in
`configs/plugins/context_menu_overhaul/`.

```ini
![functor_icons]
my_addon.menu_repair = ui\my_addon\repair_icon

![icons]
my_property_id = ui_cmo_tools

![groups]
my_addon.menu_repair = 2

![colors]
my_addon.menu_destroy = #ff4444

![chevrons]
my_addon.menu_open_submenu = ui_cmo_chevron
```

A value is a `textures_descr` id or a path to a dds file.

Sections, all optional:

- `[icons]` - property id (`use`, `to_slot`, `drop`). Add `@<class>` for a per-item icon:
  `outfit`, `helmet`, `backpack`, `artefact`, `sil`, `scope`, `gl`, and for the `use` row the
  consumable kinds `food`, `drink`, `medkit`, `smoke`.
- `[functor_icons]` - `<script>.<function>` from the item's `useN_functor`. This is how
  `custom_1..10` entries are identified.
- `[label_icons]` - translation id. The only key that changes when an action toggles, so
  "mark as favourite" and "unmark" can differ.
- `[groups]` - a number per entry. Entries are ordered by it, a divider is drawn where it changes,
  and `default` holds everything unlisted.
- `[colors]` - `#rrggbb` or `#rrggbbaa`.
- `[chevrons]` - a glyph drawn at the row's right edge, marking an entry that opens a further menu.
  The value is a texture id, usually the built-in `ui_cmo_chevron`.

Lookup: label, then property id, then functor. A missing entry means no icon.

A label key may be either the text drawn on the row or the translation id behind it. Some addons
translate their own labels before the menu sees them, so the id never arrives — writing the id still
works, and keeps your icons working in every language.

From a script:

```lua
local texture = context_menu_overhaul.get_icon(property_id, label, obj, functor)
```

## Changelog

1.4.2 (July 27, 2026)

- [New] Icon for the "inspect" entry from Artifacts Inspection Redone
- [New] The GAMMA Mags Reloaded entries form their own group right below the default one, and
  installing or removing a magazine pouch gets a belt pouch glyph of its own
- [Update] The "read a looted stalker's PDA" icon is redrawn as an eye
- [Update] "Unload ammo" on a magazine carries the same bullets icon as the vanilla "Unload"

1.4.1 (July 25, 2026)

- [Update] Field strip lists parts in the same order as the condition dots on the weapon's icon
- [Update] Part condition in the field strip is colored on the same scale as those dots

1.4.0 (July 25, 2026)

- [New] Weapon Parts Overhaul's field strip and maintenance menus show each part as an inventory
  cell, with its icon, condition and tooltip. Two MCM options toggle this, one per menu
- [New] A chevron marks the entries that open a submenu
- [New] MCM option: hide the "gift" entry
- [New] Icons for Disassemble All Items, Combine All Items, lootbox snapgun and coin entries, and
  Gwnf5066's Quick Action Wheel Overhaul patch
- [Update] Submenus are laid out like the inventory menu: full-width clicks and highlight
- [Update] The MCM page is split into "Base" and "Compatibility" sections
- [Update] Quick action wheel entries moved above "mark favorite" and "mark junk"; "separate" and
  "combine all" got their own group
- [Update] Power-of-two icon sheet, fixing misaligned icons on DirectX 8

1.3.2

- [New] Icons for Anomaly Lootboxes, Filters Redux, TB's RF Receiver Hidden Package Sidequests and
  Placeable Furniture

1.3.1

- [New] Icons for GAMMA Mags Reloaded magazine actions, armour pouches and side saddles
- [New] Icon for reading a looted stalker's PDA
- [Update] Colors apply to the whole row, not just the icon; the MCM option is renamed "Use colors"
- [Update] "Use" carries a distinct icon per consumable: drinks, food, medicine, smokes
- [Update] "Drop" sits above "Disassemble"

1.3.0

- [New] Icons for Ammo Maker, Quick Action Wheel, Weapon Parts Overhaul and G_FLAT's Indirect Parts
  Favoriter
- [Update] An entry can be named in the config by its translation id, so icons no longer depend on
  the game's language
- [Update] "Disassemble all" is grouped and colored with the other disassembly entries

1.2.0

- [New] Russian translation
- [Update] The config file is renamed from `icons.ltx` to `menu.ltx`. A DLTX patch written for 1.1.0
  must be renamed from `mod_icons_<addon>.ltx` to `mod_menu_<addon>.ltx`
- [Update] Fixed the MCM page still being titled "Context Menu Icons"

1.1.0

- [New] Own icon set, replacing the borrowed vanilla textures
- [New] Grouping with dividers, colored icons, capitalized labels
- [New] "Details" shows the item's name
- [Update] Fixed clicks not registering to the right of a short label

1.0.0

- [New] Initial release
