import zhCNJson from './langs/zh-cn.json'
import enUSJson from './langs/en-us.json'

const locales: Record<App.I18n.LangType, App.I18n.Schema> = {
  'zh-CN': zhCNJson as unknown as App.I18n.Schema,
  'en-US': enUSJson as unknown as App.I18n.Schema
}

export default locales
