## Attempted and reverted: keybinds for quick actions

Built in 1.2.0 and taken back out. The feature itself worked — keys from `[keys]`, a hint box per
row, dispatch identical to a click — but it cannot be made to coexist with the inventory's own key
handling, and that is a property of Anomaly rather than of this implementation.

The inventory sets `_GUIs_keyfree["UIInventory"] = true` (`ui_inventory.script:129`), so
`KEYS_UNLOCK` stays true and every game binding keeps firing while the inventory is open. A key
bound here therefore also runs whatever the player has that key bound to: pressing X to drop also
opened the ammo wheel, which acts on key *release* (`item_weapon.script:976`). Suppressing that by
registering our own non-key-free GUI works, but it splits the keystroke — the press is swallowed
while the menu is open, the release is delivered after it closes — and lifting the lock on a timer
instead did not fix the observed behaviour either.

Anything future should start from the conclusion that a menu key and a game key are the same key,
and either pick keys the game does not bind, or find out how the engine decides a dialog has
consumed a keystroke, rather than fighting `KEYS_UNLOCK` from script.

The parts worth keeping if it is tried again: keys resolve like icons do (label, property id,
functor), so a toggle keyed on its property id covers both states; `DIK_ESCAPE` must stay with the
menu's own handler; MCM's `kb_mod_radio` plus `get_mod_key` handle the modifier, including one held
before the right-click, so nothing needs tracking here; and `CUIStatic` reaches its text only
through `TextControl`, whose `CUILines` has no alignment, so a hint box needs `AddIconField` for the
box and `AddTextField` for the letter.

## Ideas, in rough order of value

The PDA map spot menu is the obvious next surface. It uses a different builder, so the drawing code
would have to stop assuming `UIInventory` is the owner.

Per-item-type icon overrides beyond the current `@variant` mechanism, so `use` could differ between
food and a medkit rather than only between item classes.

A registration helper for addons that would rather call a function than ship an ltx file.

Artwork for the three entries still borrowed from vanilla textures: `battery`, `stash` and `mark`.

## Third-party support to add: Anomaly Magazines Redux

Registers its rows through `custom_functor_autoinject` in `magazines.script`, so they arrive as
already-translated labels and are best keyed in `[label_icons]` like the other addons there. There
are four of them. `st_mag_eject_magazine` pulls a loaded magazine out of a supported weapon back
into the inventory (the `mags_load` functor, `check_eject_magazine`/`eject_magazine`).
`st_mag_unload_ammo` empties the loose rounds out of a magazine item. `st_mag_loadout_add` and
`st_mag_loadout_remove` are the two states of one toggle — whether the magazine is carried in the
rig pouch that feeds quick reloads. `st_mag_retool` converts an empty magazine to another section
with a `leatherman_tool`, and refuses while ammo remains.

Icons all resolve from the existing sheet. Eject has no natural magazine glyph, so `arrow_down`
reads best short of drawing one; unload takes `bullets`, mirroring vanilla's own `unload`; retool
takes `tools`, since it consumes the leatherman; and the loadout toggle takes `vest` for the rig it
acts on, with the option of splitting `backpack` for add against `vest` for remove if the two states
should look different. The mod folder sits outside the packer's working dirs, so reading it back for
the exact section names prompts for access.

## Uncovered vanilla context-menu rows

Every built-in `UIInventory.properties` id already has an icon; the gaps are all `custom_N`
rows, i.e. vanilla items whose `useN_functor` names a `<script>.<function>` this addon does not
key in `[functor_icons]` yet. Harvested by grepping every `useN_functor` across vanilla configs
and diffing against `menu.ts`. What is left:

`itms_manager.menu_play` — the "Play" action on musical instruments (guitar, harmonica),
label `st_item_play`.

`txr_mines.str_prox_plant`, `txr_mines.str_timer_plant_10`, `txr_mines.str_timer_plant_30` — the
three plant actions on explosives: a proximity trigger and two timer lengths, labels
`st_plant_explosive_prox` / `_timer_10` / `_timer_30`.

`item_money.menu_money_100`, `_500`, `_1000`, `_5000` — split a chosen denomination off a money
stack. The label is built at runtime with the amount, so these key by functor, not by label.

Intentionally skipped: `ui_debug_launcher.menu_cond_dec` / `_inc` / `_release` exist only under the
debug launcher and never appear in normal play, so they are not worth an icon.

Note on the artefact container: opening one is not a new functor — lead containers, and every other
openable container, use `bind_container.access_inventory`, which is already keyed (on the placeholder
cell for now). So it is covered, just not yet given real artwork.

## Known limitations

`attach_1..3` resolve through the item's section (`sil`, `scope`, `gl`) because the slot number is
positional and the label is built at runtime with the weapon's name appended.

Patching replaces rather than wraps, which is standard practice here but means the last addon to
touch a method wins. A conflict costs the icons, not correctness.

`default` is a reserved key in `[groups]`: it holds the group of every row the section does not name.

Capitalization assumes windows-1251 for non-Latin text, which is what Anomaly's localization files
use. A localization in another encoding would go through `string.upper` and stay unchanged.
