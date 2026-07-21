## Next: keybinds for quick actions

An entry with a key declared in the ltx can be triggered from the keyboard while the menu is open,
with the key drawn in a small box at the right end of its row. Safe to do: vanilla's
`UICellProperties:OnKeyboard` returns `true` unconditionally, so the open menu already swallows every
key except the mouse buttons and Escape, which it handles itself. Escape stays vanilla's.

First set: unload (u), mark/unmark favourite (f), mark/unmark junk (j), details (i), drop all (z),
drop (x). Keys resolve like icons do — label, then property id, then functor — so keying the
favourite toggle on its property id gives both of its states one key.

MCM gets a section of its own after the current options: a checkbox for the feature, and a modifier
key to hold, defaulting to none.

Triggering must go through vanilla's own dispatch — `owner[item.func](owner, unpack(item.params))`,
then `action_moment`, then `OnHide()`, as `OnListItemDbClicked` does — so third-party actions behave
identically. Inert rows carry no `func` and are skipped.

The hint box is `ui_inGame2_arrow_button_e` from `ui\ui_actor_multiplayer_game_menu` (454,640, 36x20),
which ships `_h`, `_t` and `_d` variants too — `_h` while the modifier is held would show the binds
are armed. `CUIStatic` exports `SetText`, `SetFont`, `SetTextColor` and `SetTextAlignment` as well as
the texture calls, so one `AddIconField` child is both the box and the centred letter. Note that
`SetStretchTexture` stretches the whole bitmap rather than nine-slicing it, so the border distorts
unless the box stays near its 36x20 aspect; that argues for single-character binds.

Open questions, in the order they need answering:

- **Modifier state.** Anomaly has no `IsKeyDown`; scripts track modifiers from keydown/keyup events,
  which we only see while the dialog holds focus. A modifier held *before* the right-click is
  therefore invisible to us, which is exactly how a player would hold it.
- **Destructive keys.** Drop (x) and drop all (z) are adjacent, and with no modifier a mis-hit dumps
  a stack on the floor. Either default the modifier to something, or let the ltx mark an entry as
  requiring it.
- **Layout.** The hint box needs a right column reserved on every row, like the icon column on the
  left, and can only be placed in the late pass once `W` is final.
- **Keyboard layouts.** DIK codes are physical scancodes, so `x` is a position; on AZERTY the hint
  box would name a key the player is not pressing. Possibly an optional display string in the ltx.
- **Duplicate keys.** Across DLTX files the last merge wins, which is fine. Within a built menu, take
  the first match in row order so it does not depend on merge order.

Idea worth weighing: number keys 1–9 selecting the Nth visible row, which needs no configuration and
covers every addon's entries for free.

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
