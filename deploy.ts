import fs from "node:fs/promises"
import path from "node:path"

// Copies the packed addon into Mod Organizer 2's mods folder, so testing a change is one
// `pnpm build` rather than a build plus a manual copy.

/** The addon's folder name in MO2's left pane. */
const MOD_NAME = "Context Menu Overhaul"

/**
 * MO2's mods directory. This instance is a global (non-portable) one, so it lives under
 * `%LOCALAPPDATA%\ModOrganizer\<instance>` rather than beside `ModOrganizer.exe`. Override
 * with `MO2_MODS_DIR` when pointing at a different instance.
 */
const modsDir =
  process.env.MO2_MODS_DIR ??
  path.join(
    process.env.LOCALAPPDATA ?? "",
    "ModOrganizer",
    "STALKER Anomaly",
    "mods",
  )

const source = path.join(import.meta.dirname, "build", "gamedata")
const target = path.join(modsDir, MOD_NAME)

if (!(await fs.stat(source).catch(() => null))?.isDirectory()) {
  throw new Error(`Nothing to deploy: ${source} does not exist. Run the build first.`)
}
if (!(await fs.stat(modsDir).catch(() => null))?.isDirectory()) {
  throw new Error(
    `MO2 mods folder not found at ${modsDir}. Set MO2_MODS_DIR to the right path.`,
  )
}

// Replace rather than merge: a file that stops being generated (a renamed script, a dropped
// config) must not linger in the deployed copy and keep loading in game.
await fs.rm(target, { recursive: true, force: true })
await fs.mkdir(target, { recursive: true })
await fs.cp(source, path.join(target, "gamedata"), { recursive: true })

// Without a meta.ini MO2 lists the mod as an unmanaged "backup" and nags on every refresh.
await fs.writeFile(
  path.join(target, "meta.ini"),
  ["[General]", "modid=0", "version=d1.0.0", "category=0", ""].join("\n"),
)

console.log(`Deployed to ${target}`)
