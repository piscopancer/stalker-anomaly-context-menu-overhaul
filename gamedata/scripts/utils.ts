/** Generic helpers with no knowledge of the context menu, shared through the addon's `context_menu_overhaul_utils` namespace. */

export const vec = (x: number, y: number) => new vector2().set(x, y)

/** `#rrggbb` or `#rrggbbaa` as argb, `null` when malformed so a typo means "no colour" rather than an arbitrary one. */
export function parse_hex(hex: string) {
  const [digits] = string.match(hex, "^#(%x+)$")
  if (!digits || (string.len(digits) !== 6 && string.len(digits) !== 8)) {
    return null
  }
  const channel = (at: number) => tonumber(string.sub(digits, at, at + 1), 16) ?? 255
  const alpha = string.len(digits) === 8 ? channel(7) : 255
  return GetARGB(alpha, channel(1), channel(3), channel(5))
}

/** Lower-case `а`-`я` in windows-1251, the encoding Anomaly's localization files use; their upper-case forms sit 32 bytes below. */
const CP1251_A = 224
const CP1251_YA = 255
const CP1251_CASE_GAP = 32

/** Lower-case `ё`, which sits outside the contiguous range and pairs with `Ё`. */
const CP1251_YO = 184
const CP1251_YO_UPPER = 168

/** Upper-cases the first character, leaving the rest as authored so an acronym like "PDA" survives. */
export function capitalize(text: string) {
  const rest = string.sub(text, 2)
  const first = string.byte(text)
  if (!first) {
    return text
  }
  if (first >= CP1251_A && first <= CP1251_YA) {
    return string.char(first - CP1251_CASE_GAP) + rest
  }
  if (first === CP1251_YO) {
    return string.char(CP1251_YO_UPPER) + rest
  }
  return string.upper(string.sub(text, 1, 1)) + rest
}
