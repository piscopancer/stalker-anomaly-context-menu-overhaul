import type { FileExtension, Texts } from "anomaly-packer"

export const extension: FileExtension = "xml"

const CELL = 50

function grid(id: string, x: number, y: number, w = 1, h = w): UI.TextureRect {
  return { id, x: x * CELL, y: y * CELL, width: w * CELL, height: h * CELL }
}

const ICON = 64
const COLS = 4

function cell(id: keyof UI.Textures, index: number): UI.TextureRect {
  const col = index % COLS
  const row = Math.floor(index / COLS)
  return { id, x: col * ICON, y: row * ICON, width: ICON, height: ICON }
}

// Row-major sheet order. `ui_cmo_placeholder` holds the freed first cell (0,0), so every real
// glyph sits one cell later than the sheet's previous layout — the armour vest is now the second
// slot and the rest follow unchanged.
const order = [
  "ui_cmo_placeholder",
  "ui_cmo_vest",
  "ui_cmo_cell",
  "ui_cmo_info",
  "ui_cmo_tools",
  "ui_cmo_bullets",
  "ui_cmo_gift",
  "ui_cmo_book",
  "ui_cmo_backpack",
  "ui_cmo_star",
  "ui_cmo_unstar",
  "ui_cmo_arrows",
  "ui_cmo_utensils",
  "ui_cmo_arrow_down",
  "ui_cmo_saw",
  "ui_cmo_divide",
  "ui_cmo_trashbin",
  "ui_cmo_untrashbin",
  "ui_cmo_helmet",
  "ui_cmo_silencer",
  "ui_cmo_gl",
  "ui_cmo_scope",
  "ui_cmo_patch",
  "ui_cmo_unpack",
  "ui_cmo_pie",
  "ui_cmo_screwdriver",
  "ui_cmo_components_star",
  "ui_cmo_oil",
  "ui_cmo_pda",
  "ui_cmo_magazine",
  "ui_cmo_health",
  "ui_cmo_water",
  "ui_cmo_hands",
  "ui_cmo_cigarette",
] as const satisfies (keyof UI.Textures)[]

const icons: UI.TextureRect[] = order.map((id, index) => cell(id, index))

export default (t: Texts) =>
  t.ui.jsxToXml(
    <w>
      <file name="ui\ui_icon_equipment">
        {[grid("ui_cmo_battery", 0, 26)].map((crop) => (
          <texture key={crop.id} {...crop} />
        ))}
      </file>
      <file name="ui\cmo_icons">
        {icons.map((icon) => (
          <texture key={icon.id} {...icon} />
        ))}
      </file>
    </w>,
  )
