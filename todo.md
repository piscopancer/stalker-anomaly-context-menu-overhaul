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

## Known limitations

`attach_1..3` resolve through the item's section (`sil`, `scope`, `gl`) because the slot number is
positional and the label is built at runtime with the weapon's name appended.

Patching replaces rather than wraps, which is standard practice here but means the last addon to
touch a method wins. A conflict costs the icons, not correctness.

`default` is a reserved key in `[groups]`: it holds the group of every row the section does not name.

Capitalization assumes windows-1251 for non-Latin text, which is what Anomaly's localization files
use. A localization in another encoding would go through `string.upper` and stay unchanged.
