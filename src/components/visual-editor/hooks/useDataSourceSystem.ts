/**
 * 数据源系统组合式函数
 * 提供便捷的数据源管理、验证和集成功能
 */

import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import type { Ref } from 'vue'
import { universalDataSourceManager } from '../core/universal-data-source-manager'
import { dataSourceValidator } from '../core/data-source-validator'
import { card2DataBindingAdapter } from '../core/card2-data-binding-adapter'
import type { DataSourceConfig, DataSourceValue, ValidationResult, IDataSource } from '../core/data-source-types'
import type { DataSourceConfiguration, EnhancedDataSourceConfig } from '../configuration/types'

/**
 * 数据源状态接口
 */
export interface DataSourceState {
  /** 是否正在加载 */
  loading: boolean
  /** 当前数据 */
  data: any
  /** 错误信息 */
  error: Error | null
  /** 是否已连接 */
  connected: boolean
  /** 最后更新时间 */
  lastUpdated: number | null
}

/**
 * 数据源操作接口
 */
export interface DataSourceActions {
  /** 刷新数据 */
  refresh: () => Promise<void>
  /** 测试连接 */
  testConnection: () => Promise<boolean>
  /** 验证配置 */
  validateConfig: () => Promise<ValidationResult>
  /** 启动数据源 */
  start: () => Promise<void>
  /** 停止数据源 */
  stop: () => Promise<void>
}

/**
 * 使用数据源系统的核心Hook
 */
export function useDataSource(
  config: Ref<DataSourceConfiguration | null> | DataSourceConfiguration | null,
  options: {
    /** 是否自动启动 */
    autoStart?: boolean
    /** 刷新间隔(秒) */
    refreshInterval?: number
    /** 是否自动验证配置 */
    autoValidate?: boolean
  } = {}
) {
  const { autoStart = true, refreshInterval, autoValidate = true } = options

  // 状态管理
  const state = reactive<DataSourceState>({
    loading: false,
    data: null,
    error: null,
    connected: false,
    lastUpdated: null
  })

  // 配置响应式处理
  const dataSourceConfig = ref(typeof config === 'object' && 'value' in config ? config.value : config)
  if (typeof config === 'object' && 'value' in config) {
    watch(config, newConfig => {
      dataSourceConfig.value = newConfig
    })
  }

  // 数据源实例
  let dataSourceInstance: IDataSource | null = null
  let unsubscribe: (() => void) | null = null

  /**
   * 刷新数据
   */
  const refresh = async () => {
    if (!dataSourceInstance || state.loading) return

    console.log('🔄 [useDataSource] 刷新数据')

    state.loading = true
    state.error = null

    try {
      const newData = await dataSourceInstance.fetchData()
      state.data = newData
      state.lastUpdated = Date.now()
      state.connected = true

      console.log('✅ [useDataSource] 数据刷新成功')
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      state.error = errorObj
      state.connected = false

      console.error('❌ [useDataSource] 数据刷新失败:', error)
    } finally {
      state.loading = false
    }
  }

  /**
   * 测试连接
   */
  const testConnection = async (): Promise<boolean> => {
    if (!dataSourceConfig.value) return false

    console.log('🧪 [useDataSource] 测试连接')

    try {
      // 转换为统一配置格式
      const unifiedConfig = convertToUnifiedConfig(dataSourceConfig.value)
      const result = await dataSourceValidator.validateConnection(unifiedConfig)

      console.log('📊 [useDataSource] 连接测试结果:', result.valid)
      return result.valid
    } catch (error) {
      console.error('❌ [useDataSource] 连接测试异常:', error)
      return false
    }
  }

  /**
   * 验证配置
   */
  const validateConfig = async (): Promise<ValidationResult> => {
    if (!dataSourceConfig.value) {
      return { valid: false, errors: ['配置不能为空'], warnings: [] }
    }

    console.log('🔍 [useDataSource] 验证配置')

    try {
      // 转换为统一配置格式
      const unifiedConfig = convertToUnifiedConfig(dataSourceConfig.value)
      const result = dataSourceValidator.validateConfig(unifiedConfig)

      console.log('📊 [useDataSource] 配置验证结果:', result)
      return result
    } catch (error) {
      const errorMsg = `配置验证异常: ${error instanceof Error ? error.message : '未知错误'}`
      console.error('❌ [useDataSource] 配置验证异常:', error)

      return {
        valid: false,
        errors: [errorMsg],
        warnings: []
      }
    }
  }

  /**
   * 启动数据源
   */
  const start = async () => {
    if (!dataSourceConfig.value) {
      throw new Error('数据源配置不能为空')
    }

    console.log('▶️ [useDataSource] 启动数据源')

    try {
      // 验证配置
      if (autoValidate) {
        const validation = await validateConfig()
        if (!validation.valid) {
          throw new Error(`配置验证失败: ${validation.errors.join(', ')}`)
        }
      }

      // 创建数据源实例
      const instanceId = `datasource_${Date.now()}`
      const unifiedConfig = convertToUnifiedConfig(dataSourceConfig.value)

      dataSourceInstance = universalDataSourceManager.createDataSource(instanceId, unifiedConfig)

      // 启动数据源
      await dataSourceInstance.start()

      // 订阅数据更新
      unsubscribe = universalDataSourceManager.subscribe(instanceId, (value: DataSourceValue) => {
        state.data = value
        state.lastUpdated = value.timestamp
        state.connected = value.quality === 'good'

        if (value.error) {
          state.error = new Error(value.error)
        } else {
          state.error = null
        }

        console.log('📡 [useDataSource] 收到数据更新:', value)
      })

      // 初始数据获取
      await refresh()

      console.log('✅ [useDataSource] 数据源启动成功')
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      state.error = errorObj

      console.error('❌ [useDataSource] 数据源启动失败:', error)
      throw errorObj
    }
  }

  /**
   * 停止数据源
   */
  const stop = async () => {
    console.log('⏹️ [useDataSource] 停止数据源')

    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }

    if (dataSourceInstance) {
      try {
        await dataSourceInstance.stop()
        console.log('✅ [useDataSource] 数据源已停止')
      } catch (error) {
        console.error('❌ [useDataSource] 停止数据源失败:', error)
      } finally {
        dataSourceInstance = null
      }
    }

    // 重置状态
    state.connected = false
    state.loading = false
  }

  /**
   * 转换配置格式
   */
  const convertToUnifiedConfig = (config: DataSourceConfiguration): DataSourceConfig => {
    if (!config.type) {
      throw new Error('数据源类型不能为空')
    }

    const unifiedConfig: DataSourceConfig = {
      type: config.type as any,
      name: `数据源_${Date.now()}`,
      description: '数据源配置',
      enabled: true,
      ...config.config
    }

    return unifiedConfig
  }

  // 计算属性
  const isValid = computed(() => !state.error && state.connected)
  const isEmpty = computed(() => !state.data)

  // 操作集合
  const actions: DataSourceActions = {
    refresh,
    testConnection,
    validateConfig,
    start,
    stop
  }

  // 生命周期处理
  onMounted(async () => {
    console.log('📋 [useDataSource] Hook挂载')

    if (autoStart && dataSourceConfig.value) {
      try {
        await start()
      } catch (error) {
        console.error('❌ [useDataSource] 自动启动失败:', error)
      }
    }
  })

  onUnmounted(async () => {
    console.log('🧹 [useDataSource] Hook卸载，清理资源')
    await stop()
  })

  // 监听配置变化
  watch(
    dataSourceConfig,
    async (newConfig, oldConfig) => {
      if (JSON.stringify(newConfig) !== JSON.stringify(oldConfig)) {
        console.log('🔧 [useDataSource] 配置变更，重启数据源')

        await stop()

        if (newConfig && autoStart) {
          try {
            await start()
          } catch (error) {
            console.error('❌ [useDataSource] 配置变更后重启失败:', error)
          }
        }
      }
    },
    { deep: true }
  )

  return {
    // 状态
    ...state,
    isValid,
    isEmpty,

    // 操作
    ...actions
  }
}

/**
 * 使用数据源配置验证Hook
 */
export function useDataSourceValidation(config: Ref<DataSourceConfiguration | null>) {
  const validationState = reactive({
    isValidating: false,
    result: null as ValidationResult | null,
    isValid: false,
    errors: [] as string[],
    warnings: [] as string[]
  })

  /**
   * 执行验证
   */
  const validate = async () => {
    const currentConfig = config.value
    if (!currentConfig || validationState.isValidating) return

    validationState.isValidating = true
    validationState.errors = []
    validationState.warnings = []

    try {
      const unifiedConfig: DataSourceConfig = {
        type: currentConfig.type as any,
        name: `验证_${Date.now()}`,
        description: '配置验证',
        enabled: true,
        ...currentConfig.config
      }

      const result = dataSourceValidator.validateConfig(unifiedConfig)

      validationState.result = result
      validationState.isValid = result.valid
      validationState.errors = result.errors || []
      validationState.warnings = result.warnings || []
    } catch (error) {
      const errorMsg = `验证异常: ${error instanceof Error ? error.message : '未知错误'}`
      validationState.result = {
        valid: false,
        errors: [errorMsg],
        warnings: []
      }
      validationState.isValid = false
      validationState.errors = [errorMsg]
    } finally {
      validationState.isValidating = false
    }
  }

  // 监听配置变化自动验证
  watch(
    config,
    () => {
      if (config.value) {
        validate()
      } else {
        validationState.result = null
        validationState.isValid = false
        validationState.errors = []
        validationState.warnings = []
      }
    },
    { deep: true, immediate: true }
  )

  return {
    ...validationState,
    validate
  }
}

/**
 * 使用Card 2.1集成Hook
 */
export function useCard2Integration(
  componentId: string,
  config: Ref<DataSourceConfiguration | null>,
  options: {
    /** 是否自动初始化 */
    autoInit?: boolean
  } = {}
) {
  const { autoInit = false } = options

  const integrationState = reactive({
    isInitializing: false,
    isInitialized: false,
    hasRequirement: false,
    hasBinding: false,
    requirement: null as any,
    bindingId: null as string | null,
    error: null as Error | null
  })

  /**
   * 初始化集成
   */
  const initialize = async () => {
    if (integrationState.isInitializing) return

    console.log('🔗 [useCard2Integration] 初始化集成:', componentId)

    integrationState.isInitializing = true
    integrationState.error = null

    try {
      // 初始化适配器
      await card2DataBindingAdapter.initialize()

      // 获取或创建组件需求
      let requirement = card2DataBindingAdapter.getComponentRequirement(componentId)

      if (!requirement) {
        // 适配器会自动推断并注册需求
        requirement = card2DataBindingAdapter.getComponentRequirement(componentId)
      }

      integrationState.requirement = requirement
      integrationState.hasRequirement = !!requirement
      integrationState.isInitialized = true

      console.log('✅ [useCard2Integration] 集成初始化成功')
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      integrationState.error = errorObj

      console.error('❌ [useCard2Integration] 集成初始化失败:', error)
      throw errorObj
    } finally {
      integrationState.isInitializing = false
    }
  }

  /**
   * 创建数据绑定
   */
  const createBinding = async () => {
    if (!integrationState.isInitialized || !config.value) {
      throw new Error('请先初始化集成并配置数据源')
    }

    console.log('🔗 [useCard2Integration] 创建数据绑定')

    try {
      // 创建增强的数据源配置
      const enhancedConfig = card2DataBindingAdapter.createDataSourceConfig(componentId, config.value)

      // 创建数据绑定
      const bindingId = card2DataBindingAdapter.createDataBinding(componentId, enhancedConfig)

      integrationState.bindingId = bindingId
      integrationState.hasBinding = true

      console.log('✅ [useCard2Integration] 数据绑定创建成功:', bindingId)
      return bindingId
    } catch (error) {
      console.error('❌ [useCard2Integration] 数据绑定创建失败:', error)
      throw error
    }
  }

  /**
   * 移除数据绑定
   */
  const removeBinding = () => {
    if (integrationState.bindingId) {
      card2DataBindingAdapter.removeDataBinding(integrationState.bindingId)
      integrationState.bindingId = null
      integrationState.hasBinding = false

      console.log('🗑️ [useCard2Integration] 数据绑定已移除')
    }
  }

  // 计算属性
  const requirementSummary = computed(() => {
    if (!integrationState.requirement) return '无需求信息'

    const req = integrationState.requirement
    const fieldCount = Object.keys(req.fields || {}).length
    const requiredFields = Object.entries(req.fields || {})
      .filter(([_, field]: [string, any]) => field.required)
      .map(([name, _]: [string, any]) => name)

    return `${fieldCount}个字段，${requiredFields.length}个必填：${requiredFields.join(', ')}`
  })

  // 生命周期处理
  onMounted(async () => {
    if (autoInit) {
      try {
        await initialize()
      } catch (error) {
        console.error('❌ [useCard2Integration] 自动初始化失败:', error)
      }
    }
  })

  onUnmounted(() => {
    removeBinding()
  })

  return {
    ...integrationState,
    requirementSummary,
    initialize,
    createBinding,
    removeBinding
  }
}

/**
 * 使用数据源管理器Hook
 */
export function useDataSourceManager() {
  const manager = universalDataSourceManager

  /**
   * 获取全局指标
   */
  const getGlobalMetrics = () => manager.getGlobalMetrics()

  /**
   * 获取数据源指标
   */
  const getDataSourceMetrics = (id: string) => manager.getDataSourceMetrics(id)

  /**
   * 测试数据源配置
   */
  const testDataSourceConfig = async (config: DataSourceConfig) => {
    return manager.testDataSourceConfig(config)
  }

  return {
    manager,
    getGlobalMetrics,
    getDataSourceMetrics,
    testDataSourceConfig
  }
}
