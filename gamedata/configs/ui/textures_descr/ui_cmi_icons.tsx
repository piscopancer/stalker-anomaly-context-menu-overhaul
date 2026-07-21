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
  cell("ui_cmi_trashbin", 0, 0),
  cell("ui_cmi_boxes", 1, 0),
  cell("ui_cmi_hand", 2, 0),
  cell("ui_cmi_info", 3, 0),
  cell("ui_cmi_tools", 0, 1),
  cell("ui_cmi_bullets", 1, 1),
  cell("ui_cmi_gift", 2, 1),
  cell("ui_cmi_hammer", 3, 1),
  cell("ui_cmi_backpack", 0, 2),
  cell("ui_cmi_star", 1, 2),
  cell("ui_cmi_unstar", 2, 2),
  cell("ui_cmi_arrows", 3, 2),
  cell("ui_cmi_utensils", 0, 3),
  cell("ui_cmi_arrow_down", 1, 3),
  cell("ui_cmi_saw", 2, 3),
  cell("ui_cmi_divide", 3, 3),
]

export default (t: Texts) =>
  t.ui.jsxToXml(
    <w>
      <file name="ui\ui_icon_equipment">
        {[grid("ui_cmi_battery", 0, 26)].map((crop) => (
          <texture key={crop.id} {...crop} />
        ))}
      </file>
      <file name="ui\cmi_icons">
        {icons.map((icon) => (
          <texture key={icon.id} {...icon} />
        ))}
      </file>
    </w>,
  )
