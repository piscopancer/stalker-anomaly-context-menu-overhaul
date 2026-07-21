import { pack } from "anomaly-packer"

const addonId = "context_menu_icons"

await pack({
  addonId,
  // `index` is emitted as the bare addon id, i.e. `context_menu_icons.script`, which is
  // the namespace `env.d.ts` declares.
  scripts: ["index", "mcm"],
})
