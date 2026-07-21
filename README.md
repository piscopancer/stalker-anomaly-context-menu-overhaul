Context Menu Overhaul

Draws an icon next to every entry of the inventory item context menu. Other addons add icons for their own entries with one ltx line.

Configuration

Other addons add their own icons with a DLTX patch.
(configs/plugins/context_menu_icons/mod_icons_my_addon.ltx)

```ini
![functor_icons]
my_addon.menu_repair = ui\my_addon\repair
```

A value is a `textures_descr` id or a path to a dds file.

```ini
[icons]
use    = ui_cmi_utensils
drop   = ui_cmi_trashbin
unload = ui_cmi_bullets

[functor_icons]
item_parts.menu_disassembly = ui_cmi_hammer
ui_itm_details.menu_details = ui_cmi_info
```

One id can produce several labels. Append `@<class>` to give each its own icon.

```ini
to_slot          = ui_cmi_hand
to_slot@outfit   = ui_btn_sort_outfit_e
to_slot@backpack = ui_cmi_backpack
Version history
```

`1.0.0` — Initial release
