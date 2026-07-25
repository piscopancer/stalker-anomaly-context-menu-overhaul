import type { Texts } from "anomaly-packer"

// The Russian MCM strings, keyed exactly as the English ones in `../eng`. Anomaly Packer
// writes the file in windows-1251, which is the encoding the game reads localization in.
export default (t: Texts) =>
  t.translations({
    ui_mcm_menu_context_menu_overhaul: "Переработка контекстного меню",
    ui_mcm_menu_cmo_base: "Базовые",
    ui_mcm_menu_cmo_compat: "Совместимость",
    ui_mcm_menu_cmo_wpo: "Weapon Parts Overhaul",
    ui_mcm_context_menu_overhaul_cmo_base_group_related_actions:
      "Группировать похожие действия",
    ui_mcm_context_menu_overhaul_cmo_base_use_colors: "Использовать цвета",
    ui_mcm_context_menu_overhaul_cmo_base_show_separators: "Разделители",
    ui_mcm_context_menu_overhaul_cmo_base_details_shows_item_name:
      "Опция «Подробнее» показывает название предмета",
    ui_mcm_context_menu_overhaul_cmo_base_capitalize_labels: "Опции с заглавной буквы",
    ui_mcm_context_menu_overhaul_cmo_base_hide_gift: "Скрывать опцию «Подарить»",
    ui_mcm_context_menu_overhaul_cmo_compat_cmo_wpo_field_strip_icons:
      "При снятии деталей оружия показывать их как иконки",
    ui_mcm_context_menu_overhaul_cmo_compat_cmo_wpo_maintenance_icons:
      "При обслуживании оружия показывать детали как иконки",
  })
