import type { Texts } from "anomaly-packer"

// The MCM page's strings. The menu title follows MCM's own `ui_mcm_menu_<addon>` convention;
// every option is `ui_mcm_<addon>_<option id>`, matching the ids in `scripts/mcm.ts`.
export default (t: Texts) =>
  t.translations({
    ui_mcm_menu_context_menu_overhaul: "Context Menu Icons",
    ui_mcm_context_menu_overhaul_group_related_actions: "Group related actions",
    ui_mcm_context_menu_overhaul_show_colored_icons: "Show colored icons",
    ui_mcm_context_menu_overhaul_show_separators: "Show separators",
    ui_mcm_context_menu_overhaul_details_shows_item_name: "Details option shows item's name",
    ui_mcm_context_menu_overhaul_capitalize_labels: "Capitalize options",
  })
