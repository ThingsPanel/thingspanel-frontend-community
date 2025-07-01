import basicJson from './langs/zh-cn/basic.json'
import othersJson from './langs/zh-cn/others.json'
import commonJson from './langs/zh-cn/common.json'
import themeJson from './langs/zh-cn/theme.json'
import timeJson from './langs/zh-cn/time.json'
import routeJson from './langs/zh-cn/route.json'
import formJson from './langs/zh-cn/form.json'
import dropdownJson from './langs/zh-cn/dropdown.json'
import buttonsJson from './langs/zh-cn/buttons.json'
import iconJson from './langs/zh-cn/icon.json'
import kanbanJson from './langs/zh-cn/kanban.json'
import customJson from './langs/zh-cn/custom.json'
import pageJson from './langs/zh-cn/page.json'
import generateJson from './langs/zh-cn/generate.json'
import cardJson from './langs/zh-cn/card.json'
import device_templateJson from './langs/zh-cn/device_template.json'
import dashboard_panelJson from './langs/zh-cn/dashboard_panel.json'
import grouping_detailsJson from './langs/zh-cn/grouping_details.json'

import basicEnJson from './langs/en-us/basic.json'
import othersEnJson from './langs/en-us/others.json'
import commonEnJson from './langs/en-us/common.json'
import themeEnJson from './langs/en-us/theme.json'
import timeEnJson from './langs/en-us/time.json'
import routeEnJson from './langs/en-us/route.json'
import formEnJson from './langs/en-us/form.json'
import dropdownEnJson from './langs/en-us/dropdown.json'
import buttonsEnJson from './langs/en-us/buttons.json'
import iconEnJson from './langs/en-us/icon.json'
import kanbanEnJson from './langs/en-us/kanban.json'
import customEnJson from './langs/en-us/custom.json'
import pageEnJson from './langs/en-us/page.json'
import generateEnJson from './langs/en-us/generate.json'
import cardEnJson from './langs/en-us/card.json'
import device_templateEnJson from './langs/en-us/device_template.json'
import dashboard_panelEnJson from './langs/en-us/dashboard_panel.json'
import grouping_detailsEnJson from './langs/en-us/grouping_details.json'

const zhCNJson = {
  ...basicJson,
  ...othersJson,
  ...commonJson,
  ...themeJson,
  ...timeJson,
  ...routeJson,
  ...formJson,
  ...dropdownJson,
  ...buttonsJson,
  ...iconJson,
  ...kanbanJson,
  ...customJson,
  ...pageJson,
  ...generateJson,
  ...cardJson,
  ...device_templateJson,
  ...dashboard_panelJson,
  ...grouping_detailsJson
}

const enUSJson = {
  ...basicEnJson,
  ...othersEnJson,
  ...commonEnJson,
  ...themeEnJson,
  ...timeEnJson,
  ...routeEnJson,
  ...formEnJson,
  ...dropdownEnJson,
  ...buttonsEnJson,
  ...iconEnJson,
  ...kanbanEnJson,
  ...customEnJson,
  ...pageEnJson,
  ...generateEnJson,
  ...cardEnJson,
  ...device_templateEnJson,
  ...dashboard_panelEnJson,
  ...grouping_detailsEnJson
}

const locales: Record<App.I18n.LangType, App.I18n.Schema> = {
  'zh-CN': zhCNJson as unknown as App.I18n.Schema,
  'en-US': enUSJson as unknown as App.I18n.Schema
}

export default locales
