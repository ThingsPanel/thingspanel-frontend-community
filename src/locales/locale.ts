// 使用 import.meta.globEager 替代大量 import
// 这可以提高性能，并使代码更简洁
const modules = import.meta.glob('./langs/**/*.json', { eager: true })

function getLangMessages(modules: Record<string, any>, lang: 'zh-cn' | 'en-us') {
  const messages: Record<string, any> = {}
  const prefix = `./langs/${lang}/`

  for (const path in modules) {
    if (path.startsWith(prefix)) {
      const content = modules[path].default
      Object.assign(messages, content)
    }
  }
  return messages
}

const locales: Record<I18n.LangType, I18n.Schema> = {
  'zh-CN': getLangMessages(modules, 'zh-cn') as unknown as I18n.Schema,
  'en-US': getLangMessages(modules, 'en-us') as unknown as I18n.Schema
}

export default locales
