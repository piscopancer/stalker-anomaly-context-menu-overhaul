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

// DirectX 8 needs power-of-two texture dimensions; a non-POT atlas (e.g. 256x704) is rescaled by
// the engine to the nearest POT, which shifts every glyph. Padding the canvas up to the next POT,
// anchored top-left so the pixel rects in `ui_cmo_icons.tsx` stay valid, keeps the icons crisp.
const nextPot = (n: number) => 2 ** Math.ceil(Math.log2(n))

const [w, h] = execFileSync("magick", ["identify", "-format", "%w %h", inputPath])
  .toString()
  .trim()
  .split(" ")
  .map(Number)

const extent = `${nextPot(w)}x${nextPot(h)}`

execFileSync(
  "magick",
  [
    inputPath,
    "-background", "none",
    "-gravity", "NorthWest",
    "-extent", extent,
    "-define", "dds:compression=dxt5",
    "-define", "dds:mipmaps=0",
    outputPath,
  ],
  { stdio: "inherit" },
)

console.log(`Converted ${inputPath} -> ${outputPath}`)
