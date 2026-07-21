import type { Texts } from "anomaly-packer"

// The Russian MCM strings, keyed exactly as the English ones in `../eng`. Anomaly Packer
// writes the file in windows-1251, which is the encoding the game reads localization in.
export default (t: Texts) =>
  t.translations({
    ui_mcm_menu_context_menu_overhaul: "Переработка контекстного меню",
    ui_mcm_context_menu_overhaul_group_related_actions:
      "Группировать похожие действия",
    ui_mcm_context_menu_overhaul_show_colored_icons: "Цветные иконки",
    ui_mcm_context_menu_overhaul_show_separators: "Разделители",
    ui_mcm_context_menu_overhaul_details_shows_item_name:
      "Опция «Подробнее» показывает название предмета",
    ui_mcm_context_menu_overhaul_capitalize_labels: "Опции с заглавной буквы",
  })
