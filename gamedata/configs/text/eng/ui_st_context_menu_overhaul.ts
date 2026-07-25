import type { Texts } from "anomaly-packer"

// The MCM page's strings. Group labels follow MCM's `ui_mcm_menu_<group id>` convention; an option's
// label is keyed by its full tree path, `ui_mcm_<addon>_<group path>_<option id>`, which is what MCM
// builds the caption from — mirroring the subsections defined in `scripts/mcm.ts`.
export default (t: Texts) =>
  t.translations({
    ui_mcm_menu_context_menu_overhaul: "Context Menu Overhaul",
    ui_mcm_menu_cmo_base: "Base",
    ui_mcm_menu_cmo_compat: "Compatibility",
    ui_mcm_menu_cmo_wpo: "Weapon Parts Overhaul",
    ui_mcm_context_menu_overhaul_cmo_base_group_related_actions: "Group related actions",
    ui_mcm_context_menu_overhaul_cmo_base_use_colors: "Use colors",
    ui_mcm_context_menu_overhaul_cmo_base_show_separators: "Show separators",
    ui_mcm_context_menu_overhaul_cmo_base_details_shows_item_name:
      "Details option shows item's name",
    ui_mcm_context_menu_overhaul_cmo_base_capitalize_labels: "Capitalize options",
    ui_mcm_context_menu_overhaul_cmo_base_hide_gift: 'Hide the "gift" option',
    ui_mcm_context_menu_overhaul_cmo_compat_cmo_wpo_field_strip_icons:
      "Show weapon parts as icons when field-stripping",
    ui_mcm_context_menu_overhaul_cmo_compat_cmo_wpo_maintenance_icons:
      "Show weapon parts as icons when maintaining",
  })
