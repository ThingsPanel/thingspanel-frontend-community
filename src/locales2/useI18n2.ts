import { ref, computed } from 'vue'
import type { App } from 'vue'
import { localStg } from '@/utils/storage'
import { getNaiveLocale, getNaiveDateLocale } from './naive'

// 支持的语言类型
type LangType = 'zh-CN' | 'en-US'

// 当前语言状态
const currentLang = ref<LangType>(localStg.get('lang') || 'zh-CN')

// 语言包缓存
const localeCache = new Map<LangType, Record<string, any>>()

/**
 * 动态加载语言包
 * @param lang 语言类型
 * @returns 语言包对象
 */
async function loadLocale(lang: LangType): Promise<Record<string, any>> {
  if (localeCache.has(lang)) {
    return localeCache.get(lang)!
  }

  try {
    // 动态导入所有语言文件
    const modules = import.meta.glob('./**/**.json', { eager: true })
    const locale: Record<string, any> = {}

    // 根据语言类型过滤文件
    const langPrefix = `./${lang}/`

    for (const [path, module] of Object.entries(modules)) {
      if (path.startsWith(langPrefix)) {
        // 提取文件路径结构，例如：./zh-CN/page/home.json -> page.home
        const relativePath = path.replace(langPrefix, '').replace('.json', '')
        const keys = relativePath.split('/')

        // 构建嵌套对象结构
        let current = locale
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {}
          }
          current = current[keys[i]]
        }

        // 设置最终值
        const lastKey = keys[keys.length - 1]
        current[lastKey] = (module as any).default || module
      }
    }

    localeCache.set(lang, locale)
    return locale
  } catch (error) {
    console.error(`Failed to load locale ${lang}:`, error)
    return {}
  }
}

// 当前语言包
const currentLocale = ref<Record<string, any>>({})

/**
 * 获取嵌套对象的值
 * @param obj 对象
 * @param path 路径，如 'page.home.greeting'
 * @param params 参数对象，用于字符串插值
 * @returns 翻译后的字符串
 */
function getValue(obj: Record<string, any>, path: string, params?: Record<string, any>): string {
  const keys = path.split('.')
  let result: any = obj

  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key]
    } else {
      return path // 如果找不到，返回原始路径
    }
  }

  if (typeof result !== 'string') {
    return path
  }

  // 处理参数插值，支持 {key} 格式
  if (params) {
    return result.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match
    })
  }

  return result
}

/**
 * 翻译函数
 * @param key 翻译键，支持嵌套路径如 'page.home.greeting'
 * @param params 参数对象，用于字符串插值
 * @returns 翻译后的字符串
 */
function t(key: string, params?: Record<string, any>): string {
  return getValue(currentLocale.value, key, params)
}

/**
 * 设置语言
 * @param lang 语言类型
 */
async function setLang(lang: LangType) {
  try {
    currentLang.value = lang
    currentLocale.value = await loadLocale(lang)
    localStg.set('lang', lang)
  } catch (error) {
    console.error(`Failed to set language to ${lang}:`, error)
  }
}

/**
 * 初始化国际化系统
 */
async function initI18n() {
  await setLang(currentLang.value)
}

/**
 * 国际化 Hook
 * @returns 国际化相关的方法和状态
 */
export function useI18n2() {
  // 确保初始化
  if (Object.keys(currentLocale.value).length === 0) {
    initI18n()
  }

  return {
    t,
    setLang,
    currentLang: computed(() => currentLang.value),
    locale: computed(() => currentLocale.value),
    naiveLocale: computed(() => getNaiveLocale(currentLang.value)),
    naiveDateLocale: computed(() => getNaiveDateLocale(currentLang.value))
  }
}

/**
 * 设置Vue插件
 * @param app Vue应用实例
 */
export function setupI18n2(app: App) {
  // 将翻译函数注册为全局属性
  app.config.globalProperties.$t = t

  // 初始化国际化系统
  initI18n()
}

// 获取当前语言
export function getCurrentLang(): LangType {
  return currentLang.value
}

// 全局翻译函数，用于兼容旧系统
export const $t = t

// 导出类型
export type { LangType }

// 默认导出
export default useI18n2
