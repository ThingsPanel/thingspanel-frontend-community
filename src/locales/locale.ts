// 使用 import.meta.globEager 替代大量 import
// 这可以提高性能，并使代码更简洁
const modules = import.meta.glob('./langs/**/*.json', { eager: true })

function getLangMessages(modules: Record<string, any>, lang: 'zh-cn' | 'en-us') {
  const messages: Record<string, any> = {}
  const prefix = `./langs/${lang}/`

  for (const path in modules) {
    if (path.startsWith(prefix)) {
      const content = modules[path].default

      // 提取文件名作为命名空间
      const fileName = path.replace(prefix, '').replace('.json', '')

      // 特殊处理：某些文件保持扁平化结构以兼容现有代码
      const flatFiles = [
        'common',
        'card',
        'page',
        'device_template',
        'basic',
        'buttons',
        'custom',
        'dashboard_panel',
        'dropdown',
        'form',
        'generate',
        'grouping_details',
        'icon',
        'interaction',
        'kanban',
        'others',
        'route',
        'script',
        'test',
        'theme',
        'time',
        'visual-editor',
        'widget-library'
      ]

      if (flatFiles.includes(fileName)) {
        // 扁平化合并（保持现有行为）
        Object.assign(messages, content)
      } else {
        // 使用文件名作为命名空间
        messages[fileName] = content
      }
    }
  }
  return messages
}

const locales: Record<I18n.LangType, I18n.Schema> = {
  'zh-CN': getLangMessages(modules, 'zh-cn') as unknown as I18n.Schema,
  'en-US': getLangMessages(modules, 'en-us') as unknown as I18n.Schema
}

export default locales
