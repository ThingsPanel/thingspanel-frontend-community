import { dateEnUS, dateZhCN, enUS, zhCN } from 'naive-ui'
import type { NDateLocale, NLocale } from 'naive-ui'
import type { LangType } from './index'

/**
 * Naive UI 组件库的语言包配置
 * 为 Naive UI 组件（按钮、表单、对话框等）提供中英文语言支持
 */
export const naiveLocales: Record<LangType, NLocale> = {
  'zh-CN': zhCN,
  'en-US': enUS
}

/**
 * Naive UI 日期组件的语言包配置
 * 为日期选择器、时间选择器等组件提供中英文语言支持
 */
export const naiveDateLocales: Record<LangType, NDateLocale> = {
  'zh-CN': dateZhCN,
  'en-US': dateEnUS
}

/**
 * 获取当前语言对应的 Naive UI 语言包
 * @param lang 语言类型
 * @returns Naive UI 语言包
 */
export function getNaiveLocale(lang: LangType): NLocale {
  return naiveLocales[lang] || naiveLocales['zh-CN']
}

/**
 * 获取当前语言对应的 Naive UI 日期语言包
 * @param lang 语言类型
 * @returns Naive UI 日期语言包
 */
export function getNaiveDateLocale(lang: LangType): NDateLocale {
  return naiveDateLocales[lang] || naiveDateLocales['zh-CN']
}
