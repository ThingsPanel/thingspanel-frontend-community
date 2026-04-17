/**
 * localStorage 清理工具
 * 用于清理不再需要的本地存储项
 */

/**
 * 需要清理的localStorage键列表
 */
const STORAGE_KEYS_TO_CLEAN = [
  'globalTabs',
  '__vue-devtools-frame-state__',
  'RECENTLY_VISITED_ROUTES',
  'visual-editor-config-state-v2',
  'visual-editor-configurations',
  'configuration-states',
  'config-discovery-cache',
  'visual-editor-config',
  'panel-config'
] as const

/**
 * 清理指定的localStorage项
 */
export function cleanupLocalStorage(): void {
  const cleanedKeys: string[] = []
  const skippedKeys: string[] = []

  STORAGE_KEYS_TO_CLEAN.forEach(key => {
    try {
      const value = localStorage.getItem(key)
      if (value !== null) {
        localStorage.removeItem(key)
        cleanedKeys.push(key)
      } else {
        skippedKeys.push(key)
      }
    } catch (error) {
      console.error(`❌ 清理失败: ${key}`, error)
    }
  })
}

/**
 * 清理所有localStorage（危险操作）
 */
export function clearAllLocalStorage(): void {
  console.error('⚠️ 正在清理所有localStorage...')

  const allKeys = Object.keys(localStorage)

  try {
    localStorage.clear()
  } catch (error) {
    console.error('❌ 清理localStorage失败:', error)
  }
}

/**
 * 检查localStorage使用情况
 */
export function inspectLocalStorage(): void {
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    try {
      const value = localStorage.getItem(key)
      const size = value ? new Blob([value]).size : 0
    } catch (error) {
      console.error(`无法读取 ${key}:`, error)
    }
  })
}

// 开发环境下自动暴露到全局
if (import.meta.env.DEV) {
  ;(window as any).storageCleanup = {
    clean: cleanupLocalStorage,
    clearAll: clearAllLocalStorage,
    inspect: inspectLocalStorage
  }
}
