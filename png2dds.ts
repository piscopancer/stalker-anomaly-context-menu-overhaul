import { execFileSync } from "node:child_process"
import { existsSync } from "node:fs"
import { resolve } from "node:path"

// Converts a PNG to a STALKER-ready DDS (DXT5, alpha, no mipmaps — same format as the
// bundled gamedata/textures/ui/cmo_icons.dds). Usage: pnpm png2dds <input.png> <output.dds>
const [input, output] = process.argv.slice(2)

if (!input || !output) {
  console.error("Usage: pnpm png2dds <input.png> <output.dds>")
  process.exit(1)
}

const inputPath = resolve(input)
if (!existsSync(inputPath)) {
  console.error(`Input file not found: ${inputPath}`)
  process.exit(1)
}
const outputPath = resolve(output)

execFileSync(
  "magick",
  [inputPath, "-define", "dds:compression=dxt5", "-define", "dds:mipmaps=0", outputPath],
  { stdio: "inherit" },
)

console.log(`Converted ${inputPath} -> ${outputPath}`)
