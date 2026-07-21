import type { FileExtension, Texts } from "anomaly-packer"

export const extension: FileExtension = "xml"

const CELL = 50

function grid(id: string, x: number, y: number, w = 1, h = w): UI.TextureRect {
  return { id, x: x * CELL, y: y * CELL, width: w * CELL, height: h * CELL }
}

const ICON = 64

function cell(id: keyof UI.Textures, col: number, row: number): UI.TextureRect {
  return { id, x: col * ICON, y: row * ICON, width: ICON, height: ICON }
}

const icons: UI.TextureRect[] = [
  cell("ui_cmo_vest", 0, 0),
  cell("ui_cmo_boxes", 1, 0),
  cell("ui_cmo_hand", 2, 0),
  cell("ui_cmo_info", 3, 0),
  cell("ui_cmo_tools", 0, 1),
  cell("ui_cmo_bullets", 1, 1),
  cell("ui_cmo_gift", 2, 1),
  cell("ui_cmo_book", 3, 1),
  cell("ui_cmo_backpack", 0, 2),
  cell("ui_cmo_star", 1, 2),
  cell("ui_cmo_unstar", 2, 2),
  cell("ui_cmo_arrows", 3, 2),
  cell("ui_cmo_utensils", 0, 3),
  cell("ui_cmo_arrow_down", 1, 3),
  cell("ui_cmo_saw", 2, 3),
  cell("ui_cmo_divide", 3, 3),
  cell("ui_cmo_trashbin", 0, 4),
  cell("ui_cmo_untrashbin", 1, 4),
  cell("ui_cmo_helmet", 2, 4),
  cell("ui_cmo_silencer", 3, 4),
  cell("ui_cmo_gl", 0, 5),
  cell("ui_cmo_scope", 1, 5),
  cell("ui_cmo_patch", 2, 5),
  cell("ui_cmo_unpack", 3, 5),
]

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
