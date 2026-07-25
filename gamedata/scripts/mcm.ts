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
  hide_gift: true,
  field_strip_icons: true,
  maintenance_icons: true,
} satisfies McmConfig

/** Sidebar subsection ids. Each is a segment of its options' stored value path, so it must not change without resetting them; the `cmo_` prefix keeps the labels (`ui_mcm_menu_<id>`) from colliding with other mods' groups. */
const BASE = "cmo_base"
const COMPAT = "cmo_compat"
const WPO = "cmo_wpo"

/** Ordered option ids per subsection — the single source the tree and the value paths are both built from. */
const base_options = [
  "group_related_actions",
  "use_colors",
  "show_separators",
  "details_shows_item_name",
  "capitalize_labels",
  "hide_gift",
] as const satisfies readonly (keyof McmConfig)[]
const wpo_options = ["field_strip_icons", "maintenance_icons"] as const satisfies readonly (keyof McmConfig)[]

/** Every option must live in exactly one subsection, or `index` cannot read it back; a missing one is a compile error here. */
type Grouped = (typeof base_options)[number] | (typeof wpo_options)[number]
const _exhaustive: Exclude<keyof McmConfig, Grouped> extends never ? true : never = true

/** The group path each option's value is stored under (after the addon id), read back verbatim by `index`. */
export const optionGroup = {} as Record<keyof McmConfig, string>
for (const id of base_options) {
  optionGroup[id] = BASE
}
for (const id of wpo_options) {
  optionGroup[id] = `${COMPAT}/${WPO}`
}

// No `text`: MCM builds an option's label from `ui_mcm_<full path>`, so the label lives under the path-derived key in the text files, not a `text` override.
const option = (id: keyof McmConfig) => mcm.check({ id, def: defaultConfig[id] })

function options_of(ids: readonly (keyof McmConfig)[]) {
  const list: ReturnType<typeof option>[] = []
  for (const id of ids) {
    list.push(option(id))
  }
  return list
}

export function on_mcm_load() {
  // `sh: false` on the root and on `compat` tells MCM to descend into the groups rather than treat their contents as this level's options.
  return mcm.menu({
    id: addonId,
    sh: false,
    gr: [
      mcm.group({ id: BASE, sh: true, gr: options_of(base_options) }),
      mcm.group({
        id: COMPAT,
        sh: false,
        gr: [mcm.group({ id: WPO, sh: true, gr: options_of(wpo_options) })],
      }),
    ],
  })
}
