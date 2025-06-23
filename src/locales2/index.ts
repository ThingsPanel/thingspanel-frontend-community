import { ref, computed } from 'vue'
import { localStg } from '@/utils/storage'
import { setDayjsLocale } from './dayjs'
import { getNaiveLocale, getNaiveDateLocale } from './naive'

// 支持的语言类型
export type LangType = 'zh-CN' | 'en-US'

// 当前语言状态
const currentLang = ref<LangType>(localStg.get('lang') || 'zh-CN')

// 翻译数据缓存 - 使用 Map 提高性能
const translationsCache = new Map<LangType, Record<string, any>>()

// 响应式的翻译状态
const translationsState = ref<Record<LangType, Record<string, any>>>({
  'zh-CN': {},
  'en-US': {}
})

// 加载状态管理
const loadedLangs = new Set<LangType>()
const loadingLangs = new Set<LangType>()

/**
 * 优化的模块获取函数 - 减少内存占用
 * @param lang 语言类型
 */
function getTranslationModules(lang: LangType) {
  // 使用更精确的 glob 模式，减少扫描范围
  const modules = import.meta.glob('./**/*.json', {
    eager: false, // 关键：使用懒加载
    import: 'default' // 只导入 default 导出
  })

  const langModules: Record<string, () => Promise<any>> = {}

  // 过滤当前语言的文件
  Object.keys(modules).forEach(path => {
    if (path.startsWith(`./${lang}/`)) {
      const relativePath = path.replace(`./${lang}/`, '')
      langModules[relativePath] = modules[path] as () => Promise<any>
    }
  })

  return langModules
}

/**
 * 优化的语言包加载函数
 * @param lang 语言类型
 */
async function loadLanguage(lang: LangType) {
  // 检查缓存
  if (translationsCache.has(lang)) {
    return translationsCache.get(lang)!
  }

  // 防止重复加载
  if (loadingLangs.has(lang)) {
    while (loadingLangs.has(lang)) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    return translationsCache.get(lang) || {}
  }

  loadingLangs.add(lang)

  try {
    const translations: Record<string, any> = {}
    const langModules = getTranslationModules(lang)

    // 分批加载，避免内存峰值
    const entries = Object.entries(langModules)
    const batchSize = 5 // 每批处理5个文件

    for (let i = 0; i < entries.length; i += batchSize) {
      const batch = entries.slice(i, i + batchSize)

      const batchPromises = batch.map(async ([relativePath, moduleLoader]) => {
        try {
          const data = await moduleLoader()
          return { relativePath, data }
        } catch (error) {
          console.warn(`Failed to load ${relativePath} for ${lang}:`, error)
          return null
        }
      })

      const batchResults = await Promise.all(batchPromises)

      // 处理批次结果
      batchResults.forEach(result => {
        if (!result) return

        const { relativePath, data } = result

        if (relativePath === 'common.json') {
          Object.assign(translations, data)
        } else {
          const pathParts = relativePath.replace('.json', '').split('/')
          let currentLevel = translations

          pathParts.forEach((part, index) => {
            if (index === pathParts.length - 1) {
              if (currentLevel[part] && typeof currentLevel[part] === 'object' && typeof data === 'object') {
                Object.assign(currentLevel[part], data)
              } else {
                currentLevel[part] = data
              }
            } else {
              if (!currentLevel[part] || typeof currentLevel[part] !== 'object') {
                currentLevel[part] = {}
              }
              currentLevel = currentLevel[part]
            }
          })
        }
      })
    }

    // 缓存结果
    translationsCache.set(lang, translations)
    translationsState.value = { ...translationsState.value, [lang]: translations }
    loadedLangs.add(lang)

    return translations
  } catch (error) {
    console.error(`Failed to load language ${lang}:`, error)
    return {}
  } finally {
    loadingLangs.delete(lang)
  }
}

/**
 * 获取嵌套对象的值
 * @param obj 对象
 * @param path 路径
 * @param params 参数对象
 */
function getValue(obj: Record<string, any>, path: string, params?: Record<string, any>): string {
  const keys = path.split('.')
  let result: any = obj

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key]
    } else {
      return path
    }
  }

  if (typeof result !== 'string') {
    return path
  }

  // 参数插值
  if (params) {
    return result.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match
    })
  }

  return result
}

/**
 * 翻译函数
 * @param key 翻译键
 * @param params 参数对象
 */
export function t(key: string, params?: Record<string, any>): string {
  const currentTranslations = translationsCache.get(currentLang.value) || {}
  return getValue(currentTranslations, key, params)
}

/**
 * 设置语言
 * @param lang 语言类型
 */
export async function setLocale(lang: LangType) {
  currentLang.value = lang
  localStg.set('lang', lang)

  // 确保新语言的翻译数据已加载
  await loadLanguage(lang)

  // 同步设置第三方库的语言环境
  setDayjsLocale(lang)

  console.log(`🌐 语言已切换到: ${lang}`)
}

/**
 * 设置 Vue 应用的国际化
 * @param app Vue应用实例
 */
export function setupI18n(app: any) {
  app.config.globalProperties.$t = t
  initI18n()
}

/**
 * 获取当前语言
 * @returns 当前语言
 */
export function getCurrentLang(): LangType {
  return currentLang.value
}

/**
 * 国际化 Hook
 */
export function useI18n() {
  return {
    t,
    setLocale,
    currentLang: computed(() => currentLang.value),
    naiveLocale: computed(() => getNaiveLocale(currentLang.value)),
    naiveDateLocale: computed(() => getNaiveDateLocale(currentLang.value))
  }
}

/**
 * 初始化国际化系统
 */
export async function initI18n() {
  await loadLanguage(currentLang.value)
  setDayjsLocale(currentLang.value)
  console.log(`🚀 国际化系统初始化完成，当前语言: ${currentLang.value}`)
}

// 全局翻译函数，用于兼容旧系统
export const $t = t

// 导出类型
export type { LangType }

// 默认导出
export default useI18n
