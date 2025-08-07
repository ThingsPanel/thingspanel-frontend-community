/**
 * 配置系统 Hook
 * 提供便捷的配置管理功能
 */

import { ref, computed, watch, onUnmounted } from 'vue'
import { configurationManager } from '../ConfigurationManager'
import type { WidgetConfiguration, ValidationResult } from '../types'

export interface UseConfigurationOptions {
  /** 组件ID */
  widgetId?: string
  /** 是否自动初始化 */
  autoInit?: boolean
  /** 是否启用自动保存 */
  autoSave?: boolean
  /** 自动保存延迟(ms) */
  autoSaveDelay?: number
}

export function useConfiguration(options: UseConfigurationOptions = {}) {
  const { widgetId, autoInit = true, autoSave = true, autoSaveDelay = 300 } = options

  // 状态
  const currentWidgetId = ref<string | null>(widgetId || null)
  const configuration = ref<WidgetConfiguration | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const validationResult = ref<ValidationResult | null>(null)

  // 配置变更监听器清理函数
  let configChangeCleanup: (() => void) | null = null

  // 自动保存定时器
  let autoSaveTimer: NodeJS.Timeout | null = null

  // 计算属性
  const hasConfiguration = computed(() => {
    return configuration.value !== null
  })

  const isValid = computed(() => {
    return validationResult.value?.valid !== false
  })

  // 初始化配置
  const initialize = async (targetWidgetId?: string) => {
    const id = targetWidgetId || currentWidgetId.value
    if (!id) return

    try {
      isLoading.value = true
      error.value = null

      // 清理旧的监听器
      if (configChangeCleanup) {
        configChangeCleanup()
        configChangeCleanup = null
      }

      // 获取或创建配置
      let config = configurationManager.getConfiguration(id)
      if (!config) {
        configurationManager.initializeConfiguration(id)
        config = configurationManager.getConfiguration(id)
      }

      configuration.value = config
      currentWidgetId.value = id

      // 设置配置变更监听
      configChangeCleanup = configurationManager.onConfigurationChange(id, newConfig => {
        configuration.value = newConfig
        validateConfiguration()
      })

      // 初始验证
      validateConfiguration()

      console.log(`[useConfiguration] 配置初始化完成: ${id}`)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '初始化失败'
      console.error('[useConfiguration] 初始化失败:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 更新配置
  const updateConfiguration = <K extends keyof WidgetConfiguration>(section: K, config: WidgetConfiguration[K]) => {
    if (!currentWidgetId.value) {
      console.warn('[useConfiguration] 无法更新配置：未设置 widgetId')
      return
    }

    try {
      configurationManager.updateConfiguration(currentWidgetId.value, section, config)

      if (autoSave) {
        scheduleAutoSave()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新失败'
      console.error('[useConfiguration] 配置更新失败:', err)
    }
  }

  // 设置完整配置
  const setConfiguration = (config: WidgetConfiguration) => {
    if (!currentWidgetId.value) {
      console.warn('[useConfiguration] 无法设置配置：未设置 widgetId')
      return
    }

    try {
      configurationManager.setConfiguration(currentWidgetId.value, config)

      if (autoSave) {
        scheduleAutoSave()
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : '设置失败'
      console.error('[useConfiguration] 配置设置失败:', err)
    }
  }

  // 重置配置
  const resetConfiguration = () => {
    if (!currentWidgetId.value) return

    try {
      configurationManager.resetConfiguration(currentWidgetId.value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '重置失败'
      console.error('[useConfiguration] 配置重置失败:', err)
    }
  }

  // 验证配置
  const validateConfiguration = () => {
    if (!configuration.value) return

    try {
      const result = configurationManager.validateConfiguration(configuration.value)
      validationResult.value = result
      return result
    } catch (err) {
      console.error('[useConfiguration] 配置验证失败:', err)
      return { valid: false, errors: [{ field: 'global', message: '验证失败' }] }
    }
  }

  // 导出配置
  const exportConfiguration = (): string | null => {
    if (!currentWidgetId.value) return null

    try {
      return configurationManager.exportConfiguration(currentWidgetId.value)
    } catch (err) {
      error.value = err instanceof Error ? err.message : '导出失败'
      console.error('[useConfiguration] 配置导出失败:', err)
      return null
    }
  }

  // 导入配置
  const importConfiguration = (configData: string): boolean => {
    if (!currentWidgetId.value) return false

    try {
      const success = configurationManager.importConfiguration(currentWidgetId.value, configData)
      if (!success) {
        error.value = '配置格式无效'
      }
      return success
    } catch (err) {
      error.value = err instanceof Error ? err.message : '导入失败'
      console.error('[useConfiguration] 配置导入失败:', err)
      return false
    }
  }

  // 应用预设
  const applyPreset = (presetName: string): boolean => {
    if (!currentWidgetId.value) return false

    try {
      const success = configurationManager.applyPreset(currentWidgetId.value, presetName)
      if (!success) {
        error.value = `预设 ${presetName} 不存在`
      }
      return success
    } catch (err) {
      error.value = err instanceof Error ? err.message : '应用预设失败'
      console.error('[useConfiguration] 应用预设失败:', err)
      return false
    }
  }

  // 获取可用预设
  const getAvailablePresets = (componentType?: string) => {
    return configurationManager.getPresets(componentType)
  }

  // 计划自动保存
  const scheduleAutoSave = () => {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }

    autoSaveTimer = setTimeout(() => {
      if (currentWidgetId.value && configuration.value) {
        // 这里可以添加实际的保存逻辑，比如保存到服务器
        console.log(`[useConfiguration] 自动保存配置: ${currentWidgetId.value}`)
      }
    }, autoSaveDelay)
  }

  // 切换组件
  const switchWidget = (newWidgetId: string) => {
    if (newWidgetId !== currentWidgetId.value) {
      initialize(newWidgetId)
    }
  }

  // 清理资源
  const cleanup = () => {
    if (configChangeCleanup) {
      configChangeCleanup()
      configChangeCleanup = null
    }

    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  // 监听 widgetId 变化
  watch(
    () => currentWidgetId.value,
    (newId, oldId) => {
      if (newId && newId !== oldId) {
        initialize(newId)
      }
    },
    { immediate: autoInit }
  )

  // 清理
  onUnmounted(() => {
    cleanup()
  })

  return {
    // 状态
    currentWidgetId,
    configuration,
    isLoading,
    error,
    validationResult,

    // 计算属性
    hasConfiguration,
    isValid,

    // 方法
    initialize,
    updateConfiguration,
    setConfiguration,
    resetConfiguration,
    validateConfiguration,
    exportConfiguration,
    importConfiguration,
    applyPreset,
    getAvailablePresets,
    switchWidget,
    cleanup
  }
}

export default useConfiguration
