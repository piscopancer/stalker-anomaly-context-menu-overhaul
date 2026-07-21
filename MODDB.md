# Context Menu Overhaul

This addon gives every context menu option a colored icon, groups related entries together with a divider between the groups, capitalizes the labels, and even more.

## Options

All of it is toggleable in MCM, and all of it is on by default:

- Group related actions
- Show colored icons
- Show separators
- Details option shows item's name
- Capitalize options

## Compatibility

Works with addons that add their own entries to the menu.

- SortingPlus by RavenAscendant.

## For addon makers

Create a DLTX patch named `mod_icons_<your addon>.ltx` in
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
```

A value is a `textures_descr` id or a path to a dds file.

Sections, all optional:

- `[icons]` - property id (`use`, `to_slot`, `drop`). Add `@<class>` for a per-item icon:
  `outfit`, `helmet`, `backpack`, `artefact`, `sil`, `scope`, `gl`.
- `[functor_icons]` - `<script>.<function>` from the item's `useN_functor`. This is how
  `custom_1..10` entries are identified.
- `[label_icons]` - translation id. The only key that changes when an action toggles, so
  "mark as favourite" and "unmark" can differ.
- `[groups]` - a number per entry. Entries are ordered by it, a divider is drawn where it changes,
  and `default` holds everything unlisted.
- `[colors]` - `#rrggbb` or `#rrggbbaa`.

Lookup: label, then property id, then functor. A missing entry means no icon.

From a script:

```lua
local texture = context_menu_overhaul.get_icon(property_id, label, obj, functor)
```

## Changelog

**1.1.0**

- Own icon set, replacing the borrowed vanilla textures
- Grouping, with a divider between groups
- Colored icons
- Capitalized labels
- "Details" shows the item's name
- Fixed clicks not registering to the right of a short label

**1.0.0**

- Initial release
