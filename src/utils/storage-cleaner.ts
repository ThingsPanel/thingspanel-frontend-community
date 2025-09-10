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
  console.log('🧹 开始清理localStorage...')
  
  const cleanedKeys: string[] = []
  const skippedKeys: string[] = []
  
  STORAGE_KEYS_TO_CLEAN.forEach(key => {
    try {
      const value = localStorage.getItem(key)
      if (value !== null) {
        localStorage.removeItem(key)
        cleanedKeys.push(key)
        console.log(`✅ 已清理: ${key}`)
      } else {
        skippedKeys.push(key)
        console.log(`⏭️ 跳过(不存在): ${key}`)
      }
    } catch (error) {
      console.warn(`❌ 清理失败: ${key}`, error)
    }
  })
  
  console.log('🧹 localStorage清理完成:', {
    cleaned: cleanedKeys,
    skipped: skippedKeys,
    total: cleanedKeys.length
  })
}

/**
 * 清理所有localStorage（危险操作）
 */
export function clearAllLocalStorage(): void {
  console.warn('⚠️ 正在清理所有localStorage...')
  
  const allKeys = Object.keys(localStorage)
  console.log('📋 当前localStorage keys:', allKeys)
  
  try {
    localStorage.clear()
    console.log('🧹 所有localStorage已清理')
  } catch (error) {
    console.error('❌ 清理localStorage失败:', error)
  }
}

/**
 * 检查localStorage使用情况
 */
export function inspectLocalStorage(): void {
  console.log('🔍 localStorage使用情况:')
  
  const keys = Object.keys(localStorage)
  keys.forEach(key => {
    try {
      const value = localStorage.getItem(key)
      const size = value ? new Blob([value]).size : 0
      console.log(`- ${key}: ${size} bytes`)
    } catch (error) {
      console.warn(`无法读取 ${key}:`, error)
    }
  })
  
  console.log(`总计 ${keys.length} 个localStorage项`)
}

// 开发环境下自动暴露到全局
if (import.meta.env.DEV) {
  (window as any).storageCleanup = {
    clean: cleanupLocalStorage,
    clearAll: clearAllLocalStorage,
    inspect: inspectLocalStorage
  }
  console.log('🔧 localStorage清理工具已暴露到 window.storageCleanup')
}