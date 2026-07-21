import type { FileExtension, Texts } from "anomaly-packer"

// Emitted as `icons.ltx`. Other addons extend it through DLTX by shipping their own
// `mod_icons_<addon>.ltx` with the same section names, which needs no cooperation from
// this file.
export const extension: FileExtension = "ltx"

/**
 * Icons borrowed from vanilla Anomaly's own `textures_desc` ids, chosen for meaning rather
 * than for looks. A value can be either a `textures_desc` id (as here) or a raw DDS path —
 * `CUITextureMaster::InitTexture` falls through to treating an unregistered name as a path —
 * so swapping in bespoke artwork later is a matter of changing the values and nothing else.
 *
 * Rows are drawn stretched into a square slot, so only square or near-square source rects are
 * used; vanilla's button strips and encyclopedia banners would distort badly. The entries
 * marked below as approximate are the small 15–27px textures, which upscale noticeably softer
 * than the rest — they are here for coverage, and are the first ones worth replacing.
 */
const icon = {
  // The addon's own sheet (`textures/ui/cmi_icons.dds`), 64² cells drawn for this menu.
  /** A hand. */
  hand: "ui_cmi_hand",
  /** A trash bin. */
  trashbin: "ui_cmi_trashbin",
  /** Stacked boxes. */
  boxes: "ui_cmi_boxes",
  /** An "i" in a circle. */
  info: "ui_cmi_info",
  /** Wrench and screwdriver. */
  tools: "ui_cmi_tools",
  /** A hammer. */
  hammer: "ui_cmi_hammer",
  /** Bullets. */
  bullets: "ui_cmi_bullets",
  /** A wrapped gift. */
  gift: "ui_cmi_gift",
  /** A backpack. */
  backpack: "ui_cmi_backpack",
  // Declared and available, but no action uses them yet.
  /** A filled star. */
  star: "ui_cmi_star",
  /** An outlined star. */
  unstar: "ui_cmi_unstar",
  /** Arrows. */
  arrows: "ui_cmi_arrows",
  /** Fork and knife. */
  utensils: "ui_cmi_utensils",
  /** A downward arrow. */
  arrow_down: "ui_cmi_arrow_down",
  /** A saw. */
  saw: "ui_cmi_saw",
  /** A division sign. */
  divide: "ui_cmi_divide",

  // Still borrowed from vanilla, for actions the sheet does not cover yet.
  /** 100² — walking figure. */
  move: "ui_companion_movement",
  /** 100² — loot bag. */
  loot: "ui_companion_loot",
  /** 121² — workbench. */
  craft: "ui_inGame2_Craft",
  /** 72×58 — armour vest, from the inventory sort bar. */
  armor: "ui_btn_sort_outfit_e",
  /** 50² — a battery, cropped from the item atlas. */
  battery: "ui_cmi_battery",
  /** 19² — approximate. */
  attach: "ui_wp_prop_scope_attach",
  /** 27² — approximate; a backpack stash. */
  stash: "ui_inGame2_PDA_icon_backpackstash",
  /** 15² — approximate; a generic marker. */
  mark: "ui_icons_newPDA_mark_e",
  // `satisfies` rather than an annotation: the values are checked against the generated union
  // of vanilla texture ids (and autocomplete as they are typed) while the keys stay literal,
  // so the entries below still bind to the ltx schema.
} as const satisfies Record<string, UI.TextureId>

export default (t: Texts) => {
  const f = t.forFile<ContextMenuIconsIni>()
  return [
    // The built-in `UIInventory.properties` keys. Entries that are the same action on
    // different slots (`attach_1..3`, the three `detach_*`) share an icon.
    f.ltx({
      section: "icons",
      entries: {
        use: icon.utensils,
        attach_1: icon.attach,
        attach_2: icon.attach,
        attach_3: icon.attach,
        // `to_slot` and `to_ruck` carry item-class variants: the script tries `<key>@<class>`
        // before the bare key, so "wear backpack" and "equip outfit" — which share a property
        // key and differ only in label — can still differ in icon. The bare key is the
        // fallback the game labels "move to slot" / "unequip".
        to_slot: icon.hand,
        "to_slot@outfit": icon.armor,
        "to_slot@helmet": icon.armor,
        "to_slot@backpack": icon.backpack,
        to_ruck: icon.backpack,
        "to_ruck@outfit": icon.armor,
        "to_ruck@helmet": icon.armor,
        "to_ruck@backpack": icon.backpack,
        move: icon.arrows,
        move_all: icon.arrows,
        donate: icon.gift,
        unload: icon.bullets,
        detach_silencer: icon.attach,
        detach_scope: icon.attach,
        detach_gl: icon.attach,
        drop: icon.arrow_down,
        drop_all: icon.arrow_down,

        // Third-party support: SortingPlus (RavenAscendant). Its rows are registered through
        // `rax_dynamic_custom_functor`, which writes them into `UIInventory.properties` as
        // `DYN_FUNC_<name>` — ordinary property ids, so they need no functor lookup. These
        // are the fallback; `[label_icons]` below distinguishes the toggled states. Absent
        // SortingPlus, the keys simply never match.
        DYN_FUNC_SP_fav: icon.star,
        DYN_FUNC_SP_junk: icon.trashbin,
      },
    }),
    // Icons for `custom_N` rows, keyed on the `<script>.<function>` pair the item's own
    // `useN_functor` names — the slot number is not a stable identity, the functor is. These
    // cover the functors stock Anomaly ships; contributing addons add their own through DLTX
    // against this same section.
    f.ltx({
      section: "functor_icons",
      entries: {
        "item_parts.menu_disassembly": icon.saw,
        "bind_item.menu_separate": icon.divide,
        "ui_itm_details.menu_details": icon.info,
        "item_backpack.menu_stash": icon.stash,
        "item_repair.menu_tool": icon.tools,
        "item_recipe.menu_read": icon.craft,
        "item_device.menu_battery": icon.battery,
        "itms_manager.menu_unpack": icon.boxes,
        "itms_manager.menu_open": icon.boxes,
        "bind_container.access_inventory": icon.boxes,
        "item_weapon.menu_scope_inv": icon.attach,
        "itms_manager.menu_place": icon.mark,
        "item_tent.str_use": icon.mark,
      },
    }),
    // Icons keyed on the row's label. Checked before everything else, because the label is
    // the only thing that changes when an action toggles: SortingPlus keeps one property id
    // for "mark as favourite" and "unmark", and only the translation id tells them apart.
    f.ltx({
      section: "label_icons",
      entries: {
        st_rax_fav: icon.star,
        st_rax_unfav: icon.unstar,
        st_rax_junk: icon.trashbin,
        st_rax_unjunk: icon.trashbin,
      },
    }),
    // Row grouping. Rows are ordered by group number and a divider is drawn wherever it
    // changes; within a group the game's own order is kept. Anything unlisted falls into the
    // default group, so the menu degrades to "everything in one block" rather than breaking.
    // Keys resolve like icons do: label, then property id, then functor.
    f.ltx({
      section: "groups",
      entries: {
        // 1 — information, which acts on nothing.
        "ui_itm_details.menu_details": 1,
        // 2 is the default and needs no entries: everything else lands there.
        // 3 — marking, which changes only how the item is displayed.
        DYN_FUNC_SP_fav: 3,
        DYN_FUNC_SP_junk: 3,
        // 4 — destructive, last so it is never the accidental click.
        drop: 4,
        drop_all: 4,
        "item_parts.menu_disassembly": 4,
      },
    }),
    // Per-row text colour, resolved like the icons. Only the destructive rows are coloured;
    // everything else keeps the game's own colour, so red stays meaningful.
    f.ltx({
      section: "colors",
      entries: {
        drop: "#7d7d7d",
        drop_all: "#7d7d7d",
        "item_parts.menu_disassembly": "#c6645d",
        st_rax_fav: "#dec983",
        st_rax_unfav: "#dec983",
        st_rax_junk: "#7d7d7d",
        st_rax_unjunk: "#7d7d7d",
      },
    }),
  ]
}
