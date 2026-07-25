# Context Menu Overhaul

This addon gives every context menu option a colored icon, groups related entries together with a divider between the groups, capitalizes the labels and even more. Options are toggleable in MCM and on by default. The page is split into two sections.

## Compatibility

Works with addons that add their own entries to the menu. These already have icons out of the box:

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

**1.4.0** (July 25, 2026)

- Weapon Parts Overhaul's field strip and "maintain parts" menus are drawn as real inventory cells,
  one per part, with the part's own icon, condition and hover tooltip. Each has its own MCM option,
  on by default; turned off, the menu falls back to a plain text list
- A chevron marks the rows that open a further menu ("Field strip", "Maintain parts")
- Submenus get the inventory menu's layout: clickable anywhere on a row and a full-width highlight
- New MCM option, on by default: hide the "gift" entry
- MCM options are split into a "Base" section and a "Compatibility → Weapon Parts Overhaul" section
- Icons for Disassemble All Items and for Combine All Items, with a new "merge" glyph
- Icons for opening a lootbox with a snapgun or a coin, and for Gwnf5066's Quick Action Wheel
  Overhaul patch
- Quick action wheel entries moved above "mark favorite" and "mark junk"; "separate" and "combine
  all" moved into their own group above them
- The icon atlas is padded to power-of-two dimensions, fixing slightly misaligned glyphs on DirectX 8

**1.3.2**

- Icons for entries added by more addons, with new glyphs to match: Anomaly Lootboxes (pick a lock), Filters Redux (equip and remove gas-mask filters and oxygen tanks), TB's RF Receiver Hidden Package Sidequests (cancel a package) and Placeable Furniture (place an item)

**1.3.1**

- Colors now apply to the whole row, label text included, not just the icon. The MCM option is
  renamed "Use colors"
- The "Use" entry carries a distinct icon per consumable: a glass for drinks, cutlery for food,
  a cross for medicine and a cigarette for smokes, with a neutral hands icon for anything else,
  instead of one shared glyph for all of them
- Icons for GAMMA Mags Reloaded: magazine actions (eject, unload, loadout, retool), armour
  pouches and weapon side saddles
- Icon for reading a looted stalker's PDA
- "Drop" now sits above "Disassemble" rather than below

**1.3.0**

- Icons for entries added by other addons: Ammo Maker, Quick Action Wheel, Weapon Parts Overhaul
  and G_FLAT's Indirect Parts Favoriter
- An entry can now be named in the config by its translation id even when the addon that owns it
  hands the menu finished text, so icons no longer depend on the game's language
- "Disassemble all" is grouped and colored with the other disassembly entries

**1.2.0**

- Russian translation
- Fixed the MCM page still being titled "Context Menu Icons"
- Renamed the config file from `icons.ltx` to `menu.ltx`. A DLTX patch written for 1.1.0 must be
  renamed from `mod_icons_<addon>.ltx` to `mod_menu_<addon>.ltx`

**1.1.0**

- Own icon set, replacing the borrowed vanilla textures
- Grouping, with a divider between groups
- Colored icons
- Capitalized labels
- "Details" shows the item's name
- Fixed clicks not registering to the right of a short label

**1.0.0**

- Initial release
