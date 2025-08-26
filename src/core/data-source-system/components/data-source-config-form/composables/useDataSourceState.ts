/**
 * 数据源配置状态管理 Composable
 * 提供统一的数据源配置状态管理，包括HTTP、WebSocket、原始数据和最终处理的所有配置
 */

import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
  HttpConfigData,
  WebSocketConfigData,
  RawDataItem,
  FinalDataProcessingConfig,
  ValidationResult,
  ProcessingError
} from '../types'

// 数据源类型
export type DataSourceType = '' | 'http' | 'websocket' | 'manual' | 'script' // 支持空字符串作为初始未选择状态

// 配置数据状态接口
export interface DataSourceConfigState {
  /** 数据源类型 */
  sourceType: DataSourceType
  /** HTTP配置 */
  httpConfig: HttpConfigData
  /** WebSocket配置 */
  websocketConfig: WebSocketConfigData
  /** 原始数据列表 */
  rawDataItems: RawDataItem[]
  /** 最终处理配置 */
  finalProcessingConfig: FinalDataProcessingConfig
  /** 手动输入的JSON数据 */
  manualJsonData: string
  /** 脚本配置 */
  scriptConfig: {
    code: string
    language: 'javascript' | 'typescript'
    template: string
  }
}

// 验证状态接口
export interface ValidationState {
  /** 整体验证结果 */
  isValid: boolean
  /** 各部分验证结果 */
  validations: {
    sourceConfig: ValidationResult | null
    rawData: ValidationResult | null
    finalProcessing: ValidationResult | null
    overall: ValidationResult | null
  }
  /** 验证错误列表 */
  errors: string[]
  /** 验证警告列表 */
  warnings: string[]
}

// 运行时状态接口
export interface RuntimeState {
  /** 是否正在保存 */
  saving: boolean
  /** 是否正在测试连接 */
  testing: boolean
  /** 是否正在处理数据 */
  processing: boolean
  /** 最后保存时间 */
  lastSaved?: number
  /** 最后测试时间 */
  lastTested?: number
  /** 配置是否有未保存的更改 */
  hasUnsavedChanges: boolean
  /** 当前操作步骤 */
  currentStep: string
  /** 错误列表 */
  errors: ProcessingError[]
}

// Composable选项接口
export interface UseDataSourceStateOptions {
  /** 是否启用自动保存 */
  autoSave?: boolean
  /** 自动保存间隔（毫秒） */
  autoSaveInterval?: number
  /** 是否启用本地存储 */
  enableLocalStorage?: boolean
  /** 本地存储键名 */
  localStorageKey?: string
  /** 是否启用验证 */
  enableValidation?: boolean
  /** 验证延迟（毫秒） */
  validationDelay?: number
}

/**
 * 数据源配置状态管理 Composable
 */
export function useDataSourceState(options: UseDataSourceStateOptions = {}) {
  const { t } = useI18n()

  // 默认选项
  const {
    autoSave = false,
    autoSaveInterval = 30000,
    enableLocalStorage = true,
    localStorageKey = 'dataSourceConfig',
    enableValidation = true,
    validationDelay = 500
  } = options

  // 配置数据状态
  const configState = reactive<DataSourceConfigState>({
    sourceType: '' as DataSourceType, // 让数据源类型通过弹窗添加数据时决定
    httpConfig: {
      method: 'GET',
      url: '',
      headers: [],
      params: [],
      body: {
        json: '',
        form: [],
        text: '',
        raw: ''
      },
      bodyType: 'json',
      timeout: 30000,
      retryCount: 3,
      retryDelay: 1000,
      followRedirect: true,
      sslVerify: true
    },
    websocketConfig: {
      url: '',
      protocols: [],
      headers: [],
      heartbeat: {
        enabled: true,
        interval: 30000,
        messageType: 'ping',
        customMessage: '',
        jsonMessage: ''
      },
      reconnect: {
        enabled: true,
        maxAttempts: 5,
        delay: 1000,
        exponentialBackoff: true,
        maxDelay: 30000
      },
      connectionTimeout: 10000,
      bufferSize: 1000,
      binaryType: 'arraybuffer',
      compression: false
    },
    rawDataItems: [],
    finalProcessingConfig: {
      type: 'merge-object',
      enabled: true,
      config: {
        mergeObject: {
          strategy: 'deep',
          conflictResolution: 'last-wins',
          keepEmptyValues: false
        }
      }
    } as FinalDataProcessingConfig,
    manualJsonData: '',
    scriptConfig: {
      code: '',
      language: 'javascript',
      template: 'basic'
    }
  })

  // 验证状态
  const validationState = reactive<ValidationState>({
    isValid: false,
    validations: {
      sourceConfig: null,
      rawData: null,
      finalProcessing: null,
      overall: null
    },
    errors: [],
    warnings: []
  })

  // 运行时状态
  const runtimeState = reactive<RuntimeState>({
    saving: false,
    testing: false,
    processing: false,
    hasUnsavedChanges: false,
    currentStep: '',
    errors: []
  })

  // 定时器引用
  let autoSaveTimer: number | null = null
  let validationTimer: number | null = null

  // 计算属性
  const currentConfig = computed(() => {
    switch (configState.sourceType) {
      case 'http':
        return configState.httpConfig
      case 'websocket':
        return configState.websocketConfig
      case 'manual':
        return { data: configState.manualJsonData }
      case 'script':
        return configState.scriptConfig
      default:
        return null
    }
  })

  const isConfigComplete = computed(() => {
    switch (configState.sourceType) {
      case 'http':
        return !!(configState.httpConfig.method && configState.httpConfig.url)
      case 'websocket':
        return !!configState.websocketConfig.url
      case 'manual':
        return !!configState.manualJsonData.trim()
      case 'script':
        return !!configState.scriptConfig.code.trim()
      default:
        return false
    }
  })

  const canSave = computed(() => {
    return validationState.isValid && isConfigComplete.value && !runtimeState.saving && runtimeState.hasUnsavedChanges
  })

  const canTest = computed(() => {
    return (
      isConfigComplete.value &&
      !runtimeState.testing &&
      (configState.sourceType === 'http' || configState.sourceType === 'websocket')
    )
  })

  /**
   * 设置数据源类型
   */
  const setDataSourceType = (type: DataSourceType) => {
    if (configState.sourceType !== type) {
      configState.sourceType = type
      markAsChanged()
      validateConfiguration()
    }
  }

  /**
   * 更新HTTP配置
   */
  const updateHttpConfig = (config: Partial<HttpConfigData>) => {
    Object.assign(configState.httpConfig, config)
    markAsChanged()
    debouncedValidation()
  }

  /**
   * 更新WebSocket配置
   */
  const updateWebSocketConfig = (config: Partial<WebSocketConfigData>) => {
    Object.assign(configState.websocketConfig, config)
    markAsChanged()
    debouncedValidation()
  }

  /**
   * 添加原始数据项
   */
  const addRawDataItem = (item: RawDataItem) => {
    configState.rawDataItems.push(item)
    markAsChanged()
    validateRawData()
  }

  /**
   * 删除原始数据项
   */
  const removeRawDataItem = (index: number) => {
    if (index >= 0 && index < configState.rawDataItems.length) {
      configState.rawDataItems.splice(index, 1)
      markAsChanged()
      validateRawData()
    }
  }

  /**
   * 更新原始数据项
   */
  const updateRawDataItem = (index: number, item: Partial<RawDataItem>) => {
    if (index >= 0 && index < configState.rawDataItems.length) {
      Object.assign(configState.rawDataItems[index], item)
      markAsChanged()
      validateRawData()
    }
  }

  /**
   * 批量设置原始数据
   */
  const setRawDataItems = (items: RawDataItem[]) => {
    configState.rawDataItems = [...items]
    markAsChanged()
    validateRawData()
  }

  /**
   * 更新最终处理配置
   */
  const updateFinalProcessingConfig = (config: Partial<FinalDataProcessingConfig>) => {
    Object.assign(configState.finalProcessingConfig, config)
    markAsChanged()
    debouncedValidation()
  }

  /**
   * 更新手动JSON数据
   */
  const updateManualJsonData = (data: string) => {
    configState.manualJsonData = data
    markAsChanged()
    debouncedValidation()
  }

  /**
   * 更新脚本配置
   */
  const updateScriptConfig = (config: Partial<typeof configState.scriptConfig>) => {
    Object.assign(configState.scriptConfig, config)
    markAsChanged()
    debouncedValidation()
  }

  /**
   * 标记配置已更改
   */
  const markAsChanged = () => {
    runtimeState.hasUnsavedChanges = true

    if (autoSave) {
      startAutoSave()
    }
  }

  /**
   * 验证当前数据源配置
   */
  const validateSourceConfig = async (): Promise<ValidationResult> => {
    const config = currentConfig.value

    if (!config) {
      return {
        type: 'error',
        text: t('dataSource.validation.noConfig'),
        detail: t('dataSource.validation.noConfigDetail')
      }
    }

    switch (configState.sourceType) {
      case 'http':
        return validateHttpConfig(configState.httpConfig)
      case 'websocket':
        return validateWebSocketConfig(configState.websocketConfig)
      case 'manual':
        return validateManualJsonData(configState.manualJsonData)
      case 'script':
        return validateScriptConfig(configState.scriptConfig)
      default:
        return {
          type: 'error',
          text: t('dataSource.validation.unknownType'),
          detail: t('dataSource.validation.unknownTypeDetail')
        }
    }
  }

  /**
   * 验证HTTP配置
   */
  const validateHttpConfig = (config: HttpConfigData): ValidationResult => {
    const errors: string[] = []

    if (!config.method) errors.push(t('dataSource.validation.httpMethodRequired'))
    if (!config.url) errors.push(t('dataSource.validation.httpUrlRequired'))

    if (config.url) {
      try {
        new URL(config.url)
      } catch {
        errors.push(t('dataSource.validation.httpUrlInvalid'))
      }
    }

    // 验证JSON请求体
    if (['POST', 'PUT', 'PATCH'].includes(config.method) && config.bodyType === 'json' && config.body.json) {
      try {
        JSON.parse(config.body.json)
      } catch {
        errors.push(t('dataSource.validation.httpJsonBodyInvalid'))
      }
    }

    return {
      type: errors.length === 0 ? 'success' : 'error',
      text: errors.length === 0 ? t('common.valid') : t('common.invalid'),
      detail: errors.length === 0 ? t('dataSource.validation.httpConfigValid') : errors.join(', ')
    }
  }

  /**
   * 验证WebSocket配置
   */
  const validateWebSocketConfig = (config: WebSocketConfigData): ValidationResult => {
    const errors: string[] = []

    if (!config.url) {
      errors.push(t('dataSource.validation.websocketUrlRequired'))
    } else {
      try {
        const url = new URL(config.url)
        if (url.protocol !== 'ws:' && url.protocol !== 'wss:') {
          errors.push(t('dataSource.validation.websocketProtocolInvalid'))
        }
      } catch {
        errors.push(t('dataSource.validation.websocketUrlInvalid'))
      }
    }

    // 验证心跳JSON消息
    if (config.heartbeat.enabled && config.heartbeat.messageType === 'json' && config.heartbeat.jsonMessage) {
      try {
        JSON.parse(config.heartbeat.jsonMessage)
      } catch {
        errors.push(t('dataSource.validation.websocketHeartbeatJsonInvalid'))
      }
    }

    return {
      type: errors.length === 0 ? 'success' : 'error',
      text: errors.length === 0 ? t('common.valid') : t('common.invalid'),
      detail: errors.length === 0 ? t('dataSource.validation.websocketConfigValid') : errors.join(', ')
    }
  }

  /**
   * 验证手动JSON数据
   */
  const validateManualJsonData = (data: string): ValidationResult => {
    if (!data.trim()) {
      return {
        type: 'warning',
        text: t('dataSource.validation.empty'),
        detail: t('dataSource.validation.manualDataEmpty')
      }
    }

    try {
      JSON.parse(data)
      return {
        type: 'success',
        text: t('common.valid'),
        detail: t('dataSource.validation.manualJsonValid')
      }
    } catch (error: any) {
      return {
        type: 'error',
        text: t('common.invalid'),
        detail: t('dataSource.validation.manualJsonInvalid', { error: error.message })
      }
    }
  }

  /**
   * 验证脚本配置
   */
  const validateScriptConfig = (config: typeof configState.scriptConfig): ValidationResult => {
    if (!config.code.trim()) {
      return {
        type: 'warning',
        text: t('dataSource.validation.empty'),
        detail: t('dataSource.validation.scriptEmpty')
      }
    }

    // 基础语法检查
    try {
      new Function(config.code)
      return {
        type: 'success',
        text: t('common.valid'),
        detail: t('dataSource.validation.scriptValid')
      }
    } catch (error: any) {
      return {
        type: 'error',
        text: t('common.invalid'),
        detail: t('dataSource.validation.scriptInvalid', { error: error.message })
      }
    }
  }

  /**
   * 验证原始数据
   */
  const validateRawData = (): ValidationResult => {
    if (configState.rawDataItems.length === 0) {
      return {
        type: 'warning',
        text: t('dataSource.validation.empty'),
        detail: t('dataSource.validation.rawDataEmpty')
      }
    }

    const invalidItems = configState.rawDataItems.filter(item => !item.data || !item.name)

    if (invalidItems.length > 0) {
      return {
        type: 'error',
        text: t('common.invalid'),
        detail: t('dataSource.validation.rawDataInvalid', { count: invalidItems.length })
      }
    }

    return {
      type: 'success',
      text: t('common.valid'),
      detail: t('dataSource.validation.rawDataValid', { count: configState.rawDataItems.length })
    }
  }

  /**
   * 完整配置验证
   */
  const validateConfiguration = async () => {
    runtimeState.currentStep = t('dataSource.validation.validating')

    try {
      // 验证数据源配置
      validationState.validations.sourceConfig = await validateSourceConfig()

      // 验证原始数据
      validationState.validations.rawData = validateRawData()

      // 验证最终处理配置
      validationState.validations.finalProcessing = {
        type: 'success',
        text: t('common.valid'),
        detail: t('dataSource.validation.finalProcessingValid')
      }

      // 计算整体验证结果
      const allValidations = Object.values(validationState.validations)
      const hasErrors = allValidations.some(v => v?.type === 'error')
      const hasWarnings = allValidations.some(v => v?.type === 'warning')

      validationState.isValid = !hasErrors
      validationState.errors = allValidations.filter(v => v?.type === 'error').map(v => v!.detail)
      validationState.warnings = allValidations.filter(v => v?.type === 'warning').map(v => v!.detail)

      // 设置整体验证结果
      validationState.validations.overall = {
        type: hasErrors ? 'error' : hasWarnings ? 'warning' : 'success',
        text: hasErrors ? t('common.invalid') : t('common.valid'),
        detail: hasErrors
          ? t('dataSource.validation.overallInvalid', { count: validationState.errors.length })
          : hasWarnings
            ? t('dataSource.validation.overallWarning', { count: validationState.warnings.length })
            : t('dataSource.validation.overallValid')
      }
    } catch (error: any) {
      addError('validation', error.message)
      validationState.isValid = false
      validationState.validations.overall = {
        type: 'error',
        text: t('common.error'),
        detail: t('dataSource.validation.validationError', { error: error.message })
      }
    } finally {
      runtimeState.currentStep = ''
    }
  }

  /**
   * 防抖验证
   */
  const debouncedValidation = () => {
    if (!enableValidation) return

    if (validationTimer) {
      clearTimeout(validationTimer)
    }

    validationTimer = window.setTimeout(() => {
      validateConfiguration()
    }, validationDelay)
  }

  /**
   * 保存配置
   */
  const saveConfiguration = async (): Promise<boolean> => {
    if (!canSave.value) return false

    runtimeState.saving = true
    runtimeState.currentStep = t('dataSource.operations.saving')

    try {
      // 执行验证
      await validateConfiguration()

      if (!validationState.isValid) {
        window.$message?.error(t('dataSource.operations.saveValidationFailed'))
        return false
      }

      // 保存到本地存储
      if (enableLocalStorage) {
        localStorage.setItem(localStorageKey, JSON.stringify(configState))
      }

      // 模拟API保存
      await new Promise(resolve => setTimeout(resolve, 1000))

      runtimeState.lastSaved = Date.now()
      runtimeState.hasUnsavedChanges = false

      window.$message?.success(t('dataSource.operations.saveSuccess'))
      return true
    } catch (error: any) {
      addError('save', error.message)
      window.$message?.error(t('dataSource.operations.saveError', { error: error.message }))
      return false
    } finally {
      runtimeState.saving = false
      runtimeState.currentStep = ''
    }
  }

  /**
   * 加载配置
   */
  const loadConfiguration = (config?: Partial<DataSourceConfigState>): boolean => {
    try {
      if (config) {
        // 从外部配置加载
        Object.assign(configState, config)
      } else if (enableLocalStorage) {
        // 从本地存储加载
        const stored = localStorage.getItem(localStorageKey)
        if (stored) {
          const parsedConfig = JSON.parse(stored)
          Object.assign(configState, parsedConfig)
        }
      }

      runtimeState.hasUnsavedChanges = false
      validateConfiguration()

      return true
    } catch (error: any) {
      addError('load', error.message)
      window.$message?.error(t('dataSource.operations.loadError', { error: error.message }))
      return false
    }
  }

  /**
   * 重置配置
   */
  const resetConfiguration = () => {
    // 重置所有状态到初始值（保持当前选择的数据源类型）
    // 注意：不重置sourceType，让用户的选择保持不变
    configState.httpConfig = {
      method: 'GET',
      url: '',
      headers: [],
      params: [],
      body: { json: '', form: [], text: '', raw: '' },
      bodyType: 'json',
      timeout: 30000,
      retryCount: 3,
      retryDelay: 1000,
      followRedirect: true,
      sslVerify: true
    }
    // 重置其他配置...

    configState.rawDataItems = []
    configState.manualJsonData = ''
    configState.scriptConfig = { code: '', language: 'javascript', template: 'basic' }

    // 重置验证状态
    validationState.isValid = false
    validationState.validations = {
      sourceConfig: null,
      rawData: null,
      finalProcessing: null,
      overall: null
    }
    validationState.errors = []
    validationState.warnings = []

    // 重置运行时状态
    runtimeState.hasUnsavedChanges = false
    runtimeState.errors = []
    runtimeState.lastSaved = undefined
    runtimeState.lastTested = undefined

    stopAutoSave()

    window.$message?.info(t('dataSource.operations.resetSuccess'))
  }

  /**
   * 导出配置
   */
  const exportConfiguration = (): string => {
    const exportData = {
      metadata: {
        version: '1.0.0',
        exportTime: new Date().toISOString(),
        sourceType: configState.sourceType
      },
      config: configState,
      validation: validationState,
      statistics: {
        rawDataCount: configState.rawDataItems.length,
        lastModified: runtimeState.lastSaved,
        lastTested: runtimeState.lastTested
      }
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * 导入配置
   */
  const importConfiguration = (configJson: string): boolean => {
    try {
      const importData = JSON.parse(configJson)

      if (importData.config) {
        Object.assign(configState, importData.config)
        markAsChanged()
        validateConfiguration()

        window.$message?.success(t('dataSource.operations.importSuccess'))
        return true
      } else {
        window.$message?.error(t('dataSource.operations.importInvalidFormat'))
        return false
      }
    } catch (error: any) {
      addError('import', error.message)
      window.$message?.error(t('dataSource.operations.importError', { error: error.message }))
      return false
    }
  }

  /**
   * 添加错误
   */
  const addError = (type: string, message: string, data?: any) => {
    runtimeState.errors.unshift({
      type,
      message,
      timestamp: Date.now(),
      data
    })

    // 限制错误数量
    if (runtimeState.errors.length > 20) {
      runtimeState.errors = runtimeState.errors.slice(0, 20)
    }
  }

  /**
   * 清空错误
   */
  const clearErrors = () => {
    runtimeState.errors = []
  }

  /**
   * 开始自动保存
   */
  const startAutoSave = () => {
    stopAutoSave()

    if (autoSave) {
      autoSaveTimer = window.setInterval(async () => {
        if (canSave.value) {
          await saveConfiguration()
        }
      }, autoSaveInterval)
    }
  }

  /**
   * 停止自动保存
   */
  const stopAutoSave = () => {
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  /**
   * 获取完整状态快照
   */
  const getStateSnapshot = () => {
    return {
      config: JSON.parse(JSON.stringify(configState)),
      validation: JSON.parse(JSON.stringify(validationState)),
      runtime: JSON.parse(JSON.stringify(runtimeState))
    }
  }

  // 监听配置变化
  watch(
    configState,
    () => {
      markAsChanged()
    },
    { deep: true }
  )

  // 初始验证
  nextTick(() => {
    validateConfiguration()
  })

  // 返回composable接口
  return {
    // 状态
    configState,
    validationState,
    runtimeState,

    // 计算属性
    currentConfig,
    isConfigComplete,
    canSave,
    canTest,

    // 数据源类型管理
    setDataSourceType,

    // HTTP配置管理
    updateHttpConfig,

    // WebSocket配置管理
    updateWebSocketConfig,

    // 原始数据管理
    addRawDataItem,
    removeRawDataItem,
    updateRawDataItem,
    setRawDataItems,

    // 最终处理配置管理
    updateFinalProcessingConfig,

    // 手动数据管理
    updateManualJsonData,

    // 脚本配置管理
    updateScriptConfig,

    // 验证方法
    validateConfiguration,
    validateSourceConfig,
    debouncedValidation,

    // 配置操作
    saveConfiguration,
    loadConfiguration,
    resetConfiguration,
    exportConfiguration,
    importConfiguration,

    // 错误管理
    addError,
    clearErrors,

    // 自动保存控制
    startAutoSave,
    stopAutoSave,

    // 工具方法
    getStateSnapshot,
    markAsChanged
  }
}

// 默认配置创建函数
export function createDefaultHttpConfig(): HttpConfigData {
  return {
    method: 'GET',
    url: '',
    headers: [],
    params: [],
    body: {
      json: '',
      form: [],
      text: '',
      raw: ''
    },
    bodyType: 'json',
    timeout: 30000,
    retryCount: 3,
    retryDelay: 1000,
    followRedirect: true,
    sslVerify: true
  }
}

export function createDefaultWebSocketConfig(): WebSocketConfigData {
  return {
    url: '',
    protocols: [],
    headers: [],
    heartbeat: {
      enabled: true,
      interval: 30000,
      messageType: 'ping',
      customMessage: '',
      jsonMessage: ''
    },
    reconnect: {
      enabled: true,
      maxAttempts: 5,
      delay: 1000,
      exponentialBackoff: true,
      maxDelay: 30000
    },
    connectionTimeout: 10000,
    bufferSize: 1000,
    binaryType: 'arraybuffer',
    compression: false
  }
}

// 类型导出
export type { DataSourceConfigState, ValidationState, RuntimeState }
