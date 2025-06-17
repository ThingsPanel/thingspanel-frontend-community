import { useI18n2 } from './useI18n2'

// 创建全局的 $t 函数，兼容现有代码
export const $t = (key: string, params?: Record<string, any>): string => {
  const { t } = useI18n2()
  return t(key, params)
}

// 导出其他必要的函数
export { useI18n2 } from './useI18n2'

// 兼容旧的 setLocale 函数
export const setLocale = (locale: string) => {
  const { setCurrentLang } = useI18n2()
  setCurrentLang(locale)
}
