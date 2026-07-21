import type { Texts } from "anomaly-packer"

// The MCM page's strings. The menu title follows MCM's own `ui_mcm_menu_<addon>` convention;
// every option is `ui_mcm_<addon>_<option id>`, matching the ids in `scripts/mcm.ts`.
export default (t: Texts) =>
  t.translations({
    ui_mcm_menu_context_menu_icons: "Context Menu Icons",
    ui_mcm_context_menu_icons_group_related_actions: "Group related actions",
    ui_mcm_context_menu_icons_show_colored_icons: "Show colored icons",
    ui_mcm_context_menu_icons_show_separators: "Show separators",
  })
