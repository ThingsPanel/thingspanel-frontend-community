import { ref, computed } from 'vue'
import { localStg } from '@/utils/storage'
import { setDayjsLocale } from './dayjs'
import { getNaiveLocale, getNaiveDateLocale } from './naive'

// 支持的语言类型
type LangType = 'zh-CN' | 'en-US'

// 当前语言状态
const currentLang = ref<LangType>(localStg.get('lang') || 'zh-CN')

// 翻译数据缓存
const translationsCache: Record<LangType, Record<string, any>> = {
  'zh-CN': {},
  'en-US': {}
}

// 响应式的翻译状态，用于触发Vue重新渲染
const translationsState = ref<Record<LangType, Record<string, any>>>({
  'zh-CN': {},
  'en-US': {}
})

// 是否已加载标记
const loadedLangs = new Set<LangType>()

// 加载状态标记
const loadingLangs = new Set<LangType>()

// 初始化Promise，确保首次加载完成
let initPromise: Promise<void> | null = null

/**
 * 动态获取语言目录下的所有翻译文件
 * 通过 Vite 的 import.meta.glob 自动扫描文件系统
 * 无需手动维护文件列表，添加新JSON文件会自动被发现和加载
 */
function getTranslationModules(lang: LangType) {
  // 使用 Vite 的 glob 导入功能自动扫描所有 JSON 文件
  // 这样添加新文件时无需修改任何代码
  const modules = import.meta.glob('./*/**.json', { eager: false })

  const langModules: Record<string, () => Promise<any>> = {}

  // 过滤出当前语言的文件
  Object.keys(modules).forEach(path => {
    if (path.startsWith(`./${lang}/`)) {
      // 移除语言前缀，得到相对路径
      const relativePath = path.replace(`./${lang}/`, '')
      langModules[relativePath] = modules[path] as () => Promise<any>
    }
  })

  return langModules
}

/**
 * 动态加载语言包
 * 自动扫描并加载指定语言目录下的所有JSON文件
 * @param lang 语言类型
 */
async function loadLanguage(lang: LangType) {
  if (loadedLangs.has(lang)) {
    return translationsCache[lang]
  }

  // 防止重复加载
  if (loadingLangs.has(lang)) {
    // 等待正在进行的加载完成
    while (loadingLangs.has(lang)) {
      await new Promise(resolve => setTimeout(resolve, 10))
    }
    return translationsCache[lang]
  }

  loadingLangs.add(lang)

  try {
    const translations: Record<string, any> = {}

    // 获取当前语言的所有翻译模块
    const langModules = getTranslationModules(lang)

    // 并行加载所有文件
    const loadPromises = Object.entries(langModules).map(async ([relativePath, moduleLoader]) => {
      try {
        const module = await moduleLoader()
        return { relativePath, data: module.default }
      } catch (error) {
        console.warn(`Failed to load ${relativePath} for ${lang}:`, error)
        return null
      }
    })

    const results = await Promise.all(loadPromises)

    // 组织翻译数据结构
    results.forEach(result => {
      if (!result) return

      const { relativePath, data } = result

      if (relativePath === 'common.json') {
        // common.json 的内容直接展开到根级别
        Object.assign(translations, data)
      } else if (relativePath.startsWith('page/')) {
        // 页面文件组织在 page 命名空间下
        if (!translations.page) translations.page = {}
        const fileName = relativePath.replace('page/', '').replace('.json', '')
        translations.page[fileName] = data
      } else if (relativePath.startsWith('custom/')) {
        // 自定义模块文件组织在 custom 命名空间下
        if (!translations.custom) translations.custom = {}
        const fileName = relativePath.replace('custom/', '').replace('.json', '')
        translations.custom[fileName] = data
      } else {
        // 其他根级别文件以文件名作为键
        const fileName = relativePath.replace('.json', '')
        translations[fileName] = data
      }
    })

    translationsCache[lang] = translations
    // 更新响应式状态，触发Vue重新渲染
    translationsState.value = { ...translationsState.value, [lang]: translations }
    loadedLangs.add(lang)
    loadingLangs.delete(lang)

    console.log(`✅ 成功加载 ${lang} 语言包，共 ${results.filter(r => r).length} 个文件`)
    return translations
  } catch (error) {
    console.error(`❌ 加载语言包失败: ${lang}`, error)
    loadingLangs.delete(lang)
    return {}
  }
}

// 初始化：加载当前语言的翻译数据和第三方库语言设置
initPromise = loadLanguage(currentLang.value)
  .then(() => {
    // 初始化时同步设置第三方库的语言环境
    setDayjsLocale(currentLang.value)
    console.log(`🚀 国际化系统初始化完成，当前语言: ${currentLang.value}`)
    initPromise = null
  })
  .catch(error => {
    console.error(`❌ 初始语言加载失败:`, error)
  })

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
 * 全局翻译函数
 * @param key 翻译键，支持嵌套路径如 'page.home.greeting'
 * @param params 参数对象，用于字符串插值
 * @returns 翻译后的字符串
 */
export function $t(key: string, params?: Record<string, any>): string {
  // 使用响应式状态，确保Vue能够追踪到变化
  const currentTranslations = translationsState.value[currentLang.value]

  // 如果翻译数据还未加载，尝试触发加载
  if (!currentTranslations || Object.keys(currentTranslations).length === 0) {
    // 如果是初始化阶段，先等待初始化完成
    if (initPromise && !loadedLangs.has(currentLang.value)) {
      // 异步加载，但立即返回key，避免阻塞渲染
      initPromise.then(() => {
        // 数据已经通过translationsState.value更新触发了响应式更新
        console.log(`🔄 ${currentLang.value} 语言包加载完成，触发重新渲染`)
      })
    }
    return key
  }

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
 * 获取当前语言
 * @returns 当前语言
 */
export function getCurrentLang(): LangType {
  return currentLang.value
}

/**
 * 国际化 Hook
 * @returns 国际化相关的方法和状态
 */
export function useI18n2() {
  return {
    t: $t,
    setLang: setLocale,
    currentLang: computed(() => currentLang.value),
    locale: computed(() => translationsState.value[currentLang.value] || {}),
    // Naive UI 相关
    naiveLocale: computed(() => getNaiveLocale(currentLang.value)),
    naiveDateLocale: computed(() => getNaiveDateLocale(currentLang.value))
  }
}

// 导出类型
export type { LangType }

// 默认导出
export default useI18n2
