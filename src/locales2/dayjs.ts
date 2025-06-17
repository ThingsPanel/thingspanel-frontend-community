import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import 'dayjs/locale/en'
import { localStg } from '@/utils/storage'
import type { LangType } from './index'

/**
 * Day.js 语言映射表
 * 将应用的语言类型映射到 Day.js 的语言标识
 */
const dayjsLocaleMap: Record<LangType, string> = {
  'zh-CN': 'zh-cn',
  'en-US': 'en'
}

/**
 * 设置 Day.js 的语言环境
 * 用于日期格式化、相对时间显示等功能的本地化
 * @param lang 语言类型，默认为中文
 */
export function setDayjsLocale(lang: LangType = 'zh-CN'): void {
  // 获取当前语言，优先级：参数 > 本地存储 > 默认中文
  const currentLang = lang || localStg.get('lang') || 'zh-CN'

  // 获取对应的 Day.js 语言标识
  const dayjsLang = dayjsLocaleMap[currentLang]

  if (dayjsLang) {
    // 设置 Day.js 全局语言环境
    dayjs.locale(dayjsLang)
    console.log(`📅 Day.js 语言环境已设置为: ${dayjsLang}`)
  } else {
    console.warn(`⚠️ 未找到语言 ${currentLang} 对应的 Day.js 语言包，使用默认中文`)
    dayjs.locale('zh-cn')
  }
}

/**
 * 获取当前语言对应的 Day.js 语言标识
 * @param lang 语言类型
 * @returns Day.js 语言标识
 */
export function getDayjsLocale(lang: LangType): string {
  return dayjsLocaleMap[lang] || 'zh-cn'
}
