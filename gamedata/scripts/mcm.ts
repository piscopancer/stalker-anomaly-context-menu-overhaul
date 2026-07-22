// The addon's MCM page. Only the menu definition lives here; the values are read by
// `index.ts`, which owns the drawing and re-reads them whenever MCM reports a change.

import * as mcm from "anomaly-packer/mcm"

const addonId: AddonId = "context_menu_overhaul"

/**
 * Exported so `index.ts` has something to fall back on when MCM is not installed. Both
 * default to on: the addon's whole point is the icons, and someone who installs it wants
 * them coloured and grouped until they say otherwise.
 */
export const defaultConfig = {
  group_related_actions: true,
  use_colors: false,
  show_separators: true,
  details_shows_item_name: true,
  capitalize_labels: true,
} satisfies McmConfig

export function on_mcm_load() {
  return mcm.menu({
    id: addonId,
    gr: [
      mcm.title({
        id: "title",
        text: "ui_mcm_menu_context_menu_overhaul",
      }),
      mcm.check({
        id: "group_related_actions",
        def: defaultConfig.group_related_actions,
        text: "ui_mcm_context_menu_overhaul_group_related_actions",
      }),
      mcm.check({
        id: "use_colors",
        def: defaultConfig.use_colors,
        text: "ui_mcm_context_menu_overhaul_use_colors",
      }),
      mcm.check({
        id: "show_separators",
        def: defaultConfig.show_separators,
        text: "ui_mcm_context_menu_overhaul_show_separators",
      }),
      mcm.check({
        id: "details_shows_item_name",
        def: defaultConfig.details_shows_item_name,
        text: "ui_mcm_context_menu_overhaul_details_shows_item_name",
      }),
      mcm.check({
        id: "capitalize_labels",
        def: defaultConfig.capitalize_labels,
        text: "ui_mcm_context_menu_overhaul_capitalize_labels",
      }),
    ],
  })
}
