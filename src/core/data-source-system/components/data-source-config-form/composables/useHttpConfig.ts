/**
 * HTTP配置管理 Composable
 * 专门处理HTTP数据源的配置、测试和管理逻辑
 */

import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type {
  HttpConfiguration,
  HttpMethod,
  KeyValuePair,
  SystemApiItem,
  TestConnectionResponse,
  ValidationResult
} from '../../../types'

// HTTP配置选项接口
export interface UseHttpConfigOptions {
  /** 初始配置 */
  initialConfig?: Partial<HttpConfiguration>
  /** 是否启用自动验证 */
  autoValidate?: boolean
  /** 验证延迟（毫秒） */
  validationDelay?: number
  /** 系统API列表 */
  systemApis?: SystemApiItem[]
  /** 是否启用连接测试 */
  enableTesting?: boolean
}

// HTTP状态接口
export interface HttpState {
  /** 是否正在测试连接 */
  testing: boolean
  /** 是否已连接 */
  connected: boolean
  /** 最后测试时间 */
  lastTestTime?: number
  /** 测试结果 */
  testResult?: TestConnectionResponse
  /** 验证状态 */
  validation: ValidationResult | null
  /** 错误信息 */
  errors: string[]
}

/**
 * HTTP配置管理 Composable
 */
export function useHttpConfig(options: UseHttpConfigOptions = {}) {
  const { t } = useI18n()

  // 默认选项
  const { autoValidate = true, validationDelay = 300, systemApis = [], enableTesting = true } = options

  // HTTP配置状态
  const httpConfig = reactive<HttpConfiguration>({
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
    sslVerify: true,
    ...options.initialConfig
  })

  // HTTP状态管理
  const httpState = reactive<HttpState>({
    testing: false,
    connected: false,
    validation: null,
    errors: []
  })

  // 系统API列表
  const availableSystemApis = ref<SystemApiItem[]>(systemApis)

  // 验证定时器
  let validationTimer: number | null = null

  // 计算属性
  const isUrlValid = computed(() => {
    if (!httpConfig.url) return false
    try {
      new URL(httpConfig.url)
      return true
    } catch {
      return false
    }
  })

  const isBodyAllowed = computed(() => {
    return ['POST', 'PUT', 'PATCH'].includes(httpConfig.method)
  })

  const hasValidConfig = computed(() => {
    return !!(httpConfig.method && httpConfig.url && isUrlValid.value)
  })

  const enabledHeaders = computed(() => {
    return httpConfig.headers.filter(header => header.enabled && header.key && header.value)
  })

  const enabledParams = computed(() => {
    return httpConfig.params.filter(param => param.enabled && param.key && param.value)
  })

  const requestSummary = computed(() => {
    const summary = {
      method: httpConfig.method,
      url: httpConfig.url,
      headersCount: enabledHeaders.value.length,
      paramsCount: enabledParams.value.length,
      hasBody: isBodyAllowed.value && getRequestBody() !== undefined,
      bodyType: isBodyAllowed.value ? httpConfig.bodyType : 'none'
    }
    return summary
  })

  /**
   * 设置HTTP方法
   */
  const setMethod = (method: HttpMethod) => {
    httpConfig.method = method

    // 如果切换到不支持请求体的方法，清空请求体
    if (!isBodyAllowed.value) {
      httpConfig.body = {
        json: '',
        form: [],
        text: '',
        raw: ''
      }
      httpConfig.bodyType = 'json'
    }

    triggerValidation()
  }

  /**
   * 设置URL
   */
  const setUrl = (url: string) => {
    httpConfig.url = url
    triggerValidation()
  }

  /**
   * 添加请求头
   */
  const addHeader = (key: string = '', value: string = '', enabled: boolean = true) => {
    httpConfig.headers.push({ key, value, enabled })
    triggerValidation()
  }

  /**
   * 更新请求头
   */
  const updateHeader = (index: number, updates: Partial<KeyValuePair>) => {
    if (index >= 0 && index < httpConfig.headers.length) {
      Object.assign(httpConfig.headers[index], updates)
      triggerValidation()
    }
  }

  /**
   * 删除请求头
   */
  const removeHeader = (index: number) => {
    if (index >= 0 && index < httpConfig.headers.length) {
      httpConfig.headers.splice(index, 1)
      triggerValidation()
    }
  }

  /**
   * 批量设置请求头
   */
  const setHeaders = (headers: KeyValuePair[]) => {
    httpConfig.headers = [...headers]
    triggerValidation()
  }

  /**
   * 添加URL参数
   */
  const addParam = (key: string = '', value: string = '', enabled: boolean = true) => {
    httpConfig.params.push({ key, value, enabled })
    triggerValidation()
  }

  /**
   * 更新URL参数
   */
  const updateParam = (index: number, updates: Partial<KeyValuePair>) => {
    if (index >= 0 && index < httpConfig.params.length) {
      Object.assign(httpConfig.params[index], updates)
      triggerValidation()
    }
  }

  /**
   * 删除URL参数
   */
  const removeParam = (index: number) => {
    if (index >= 0 && index < httpConfig.params.length) {
      httpConfig.params.splice(index, 1)
      triggerValidation()
    }
  }

  /**
   * 设置请求体类型
   */
  const setBodyType = (bodyType: string) => {
    if (isBodyAllowed.value) {
      httpConfig.bodyType = bodyType as any
      triggerValidation()
    }
  }

  /**
   * 设置JSON请求体
   */
  const setJsonBody = (json: string) => {
    httpConfig.body.json = json
    triggerValidation()
  }

  /**
   * 设置表单请求体
   */
  const setFormBody = (formData: KeyValuePair[]) => {
    httpConfig.body.form = [...formData]
    triggerValidation()
  }

  /**
   * 获取构建后的请求体
   */
  const getRequestBody = (): any => {
    if (!isBodyAllowed.value) return undefined

    switch (httpConfig.bodyType) {
      case 'json':
        if (!httpConfig.body.json) return undefined
        try {
          return JSON.parse(httpConfig.body.json)
        } catch {
          return httpConfig.body.json // 返回原始字符串
        }

      case 'form':
        if (httpConfig.body.form.length === 0) return undefined
        const formData: Record<string, string> = {}
        httpConfig.body.form
          .filter(item => item.enabled && item.key)
          .forEach(item => {
            formData[item.key] = item.value
          })
        return formData

      case 'text':
        return httpConfig.body.text || undefined

      case 'raw':
        return httpConfig.body.raw || undefined

      default:
        return undefined
    }
  }

  /**
   * 构建完整的请求配置
   */
  const buildRequestConfig = () => {
    // 构建请求头
    const headers: Record<string, string> = {}
    enabledHeaders.value.forEach(header => {
      headers[header.key] = header.value
    })

    // 构建URL参数
    const params: Record<string, string> = {}
    enabledParams.value.forEach(param => {
      params[param.key] = param.value
    })

    // 获取请求体
    const body = getRequestBody()

    // 自动设置Content-Type
    if (body && httpConfig.bodyType === 'json' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json'
    }

    return {
      method: httpConfig.method,
      url: httpConfig.url,
      headers,
      params,
      body,
      timeout: httpConfig.timeout,
      retryCount: httpConfig.retryCount,
      retryDelay: httpConfig.retryDelay,
      followRedirect: httpConfig.followRedirect,
      sslVerify: httpConfig.sslVerify
    }
  }

  /**
   * 测试HTTP连接
   */
  const testConnection = async (): Promise<TestConnectionResponse> => {
    if (!enableTesting) {
      throw new Error(t('dataSource.http.testingDisabled'))
    }

    if (!hasValidConfig.value) {
      throw new Error(t('dataSource.http.configInvalid'))
    }

    httpState.testing = true
    httpState.errors = []

    const startTime = Date.now()

    try {
      const requestConfig = buildRequestConfig()

      // 模拟HTTP请求（在实际项目中应替换为真实的HTTP客户端）
      const response = await simulateHttpRequest(requestConfig)

      const responseTime = Date.now() - startTime

      const testResult: TestConnectionResponse = {
        success: true,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
        responseTime,
        error: undefined
      }

      httpState.connected = true
      httpState.lastTestTime = Date.now()
      httpState.testResult = testResult

      return testResult
    } catch (error: any) {
      const responseTime = Date.now() - startTime

      const testResult: TestConnectionResponse = {
        success: false,
        status: 0,
        statusText: 'Error',
        headers: {},
        data: null,
        responseTime,
        error: error.message
      }

      httpState.connected = false
      httpState.testResult = testResult
      httpState.errors.push(error.message)

      return testResult
    } finally {
      httpState.testing = false
    }
  }

  /**
   * 模拟HTTP请求
   */
  const simulateHttpRequest = async (config: any): Promise<any> => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 700))

    // 模拟请求失败
    if (Math.random() < 0.1) {
      throw new Error('网络连接超时')
    }

    // 构建模拟响应
    const response = {
      status: 200,
      statusText: 'OK',
      headers: {
        'content-type': 'application/json',
        server: 'nginx/1.18.0',
        date: new Date().toUTCString(),
        'x-response-time': `${Math.floor(Math.random() * 100) + 50}ms`
      },
      data: {
        success: true,
        message: 'HTTP请求测试成功',
        timestamp: new Date().toISOString(),
        echo: {
          method: config.method,
          url: config.url,
          headers: config.headers,
          params: config.params,
          hasBody: !!config.body,
          bodyType: typeof config.body
        }
      }
    }

    // 模拟不同状态码
    if (config.url.includes('404')) {
      response.status = 404
      response.statusText = 'Not Found'
      response.data = { error: 'Resource not found' }
    } else if (config.url.includes('500')) {
      response.status = 500
      response.statusText = 'Internal Server Error'
      response.data = { error: 'Server error' }
    }

    return response
  }

  /**
   * 从系统API应用配置
   */
  const applySystemApi = (api: SystemApiItem) => {
    httpConfig.method = api.method
    httpConfig.url = api.url

    // 应用默认请求头
    if (api.defaultHeaders?.length) {
      httpConfig.headers = api.defaultHeaders.map(header => ({
        ...header,
        enabled: true
      }))
    }

    // 应用默认参数
    if (api.defaultParams?.length) {
      httpConfig.params = api.defaultParams.map(param => ({
        ...param,
        enabled: true
      }))
    }

    triggerValidation()
  }

  /**
   * 生成cURL命令
   */
  const generateCurlCommand = (): string => {
    const config = buildRequestConfig()
    let curl = `curl -X ${config.method}`

    // 添加请求头
    Object.entries(config.headers).forEach(([key, value]) => {
      curl += ` -H "${key}: ${value}"`
    })

    // 添加URL参数
    let url = config.url
    const paramStr = new URLSearchParams(config.params).toString()
    if (paramStr) {
      url += (url.includes('?') ? '&' : '?') + paramStr
    }

    // 添加请求体
    if (config.body) {
      if (typeof config.body === 'string') {
        curl += ` -d '${config.body}'`
      } else {
        curl += ` -d '${JSON.stringify(config.body)}'`
      }
    }

    // 添加其他选项
    if (config.timeout) {
      curl += ` --max-time ${Math.ceil(config.timeout / 1000)}`
    }

    if (!config.sslVerify) {
      curl += ` -k`
    }

    if (config.followRedirect) {
      curl += ` -L`
    }

    curl += ` "${url}"`

    return curl
  }

  /**
   * 验证HTTP配置
   */
  const validateConfig = (): ValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []

    // 基础验证
    if (!httpConfig.method) {
      errors.push(t('dataSource.http.validation.methodRequired'))
    }

    if (!httpConfig.url) {
      errors.push(t('dataSource.http.validation.urlRequired'))
    } else if (!isUrlValid.value) {
      errors.push(t('dataSource.http.validation.urlInvalid'))
    }

    // 请求头验证
    const headerKeys = httpConfig.headers.filter(h => h.enabled && h.key).map(h => h.key)
    const duplicateHeaders = headerKeys.filter((key, index) => headerKeys.indexOf(key) !== index)
    if (duplicateHeaders.length > 0) {
      warnings.push(t('dataSource.http.validation.duplicateHeaders', { keys: duplicateHeaders.join(', ') }))
    }

    // URL参数验证
    const paramKeys = httpConfig.params.filter(p => p.enabled && p.key).map(p => p.key)
    const duplicateParams = paramKeys.filter((key, index) => paramKeys.indexOf(key) !== index)
    if (duplicateParams.length > 0) {
      warnings.push(t('dataSource.http.validation.duplicateParams', { keys: duplicateParams.join(', ') }))
    }

    // 请求体验证
    if (isBodyAllowed.value && httpConfig.bodyType === 'json' && httpConfig.body.json) {
      try {
        JSON.parse(httpConfig.body.json)
      } catch (error: any) {
        errors.push(t('dataSource.http.validation.jsonBodyInvalid', { error: error.message }))
      }
    }

    // 超时验证
    if (httpConfig.timeout < 1000) {
      warnings.push(t('dataSource.http.validation.timeoutTooSmall'))
    } else if (httpConfig.timeout > 300000) {
      warnings.push(t('dataSource.http.validation.timeoutTooLarge'))
    }

    // 构建验证结果
    const result: ValidationResult = {
      type: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'success',
      text: errors.length > 0 ? t('common.invalid') : warnings.length > 0 ? t('common.warning') : t('common.valid'),
      detail:
        errors.length > 0
          ? errors.join('; ')
          : warnings.length > 0
            ? warnings.join('; ')
            : t('dataSource.http.validation.configValid')
    }

    httpState.validation = result
    httpState.errors = errors

    return result
  }

  /**
   * 触发验证（防抖）
   */
  const triggerValidation = () => {
    if (!autoValidate) return

    if (validationTimer) {
      clearTimeout(validationTimer)
    }

    validationTimer = window.setTimeout(() => {
      validateConfig()
    }, validationDelay)
  }

  /**
   * 重置HTTP配置
   */
  const reset = () => {
    Object.assign(httpConfig, {
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
    })

    // 重置状态
    httpState.testing = false
    httpState.connected = false
    httpState.lastTestTime = undefined
    httpState.testResult = undefined
    httpState.validation = null
    httpState.errors = []

    // 清除定时器
    if (validationTimer) {
      clearTimeout(validationTimer)
      validationTimer = null
    }
  }

  /**
   * 获取配置副本
   */
  const getConfig = (): HttpConfiguration => {
    return JSON.parse(JSON.stringify(httpConfig))
  }

  /**
   * 设置完整配置
   */
  const setConfig = (config: HttpConfiguration) => {
    Object.assign(httpConfig, config)
    triggerValidation()
  }

  /**
   * 导入系统API列表
   */
  const setSystemApis = (apis: SystemApiItem[]) => {
    availableSystemApis.value = [...apis]
  }

  /**
   * 查找系统API
   */
  const findSystemApi = (id: string): SystemApiItem | undefined => {
    return availableSystemApis.value.find(api => api.id === id)
  }

  /**
   * 搜索系统API
   */
  const searchSystemApis = (keyword: string): SystemApiItem[] => {
    if (!keyword) return availableSystemApis.value

    const searchLower = keyword.toLowerCase()
    return availableSystemApis.value.filter(
      api =>
        api.name.toLowerCase().includes(searchLower) ||
        api.description.toLowerCase().includes(searchLower) ||
        api.url.toLowerCase().includes(searchLower)
    )
  }

  /**
   * 获取请求预览信息
   */
  const getRequestPreview = () => {
    const config = buildRequestConfig()
    const preview = {
      method: config.method,
      url: config.url,
      headers: config.headers,
      params: config.params,
      body: config.body,
      curl: generateCurlCommand(),
      estimatedSize: JSON.stringify(config).length
    }
    return preview
  }

  /**
   * 应用请求头模板
   */
  const applyHeaderTemplate = (template: 'json' | 'form' | 'auth' | 'cors') => {
    const templates = {
      json: [
        { key: 'Content-Type', value: 'application/json', enabled: true },
        { key: 'Accept', value: 'application/json', enabled: true }
      ],
      form: [{ key: 'Content-Type', value: 'application/x-www-form-urlencoded', enabled: true }],
      auth: [{ key: 'Authorization', value: 'Bearer {token}', enabled: true }],
      cors: [
        { key: 'Access-Control-Allow-Origin', value: '*', enabled: true },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE', enabled: true },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization', enabled: true }
      ]
    }

    const templateHeaders = templates[template] || []
    templateHeaders.forEach(header => {
      // 检查是否已存在相同的键
      const existingIndex = httpConfig.headers.findIndex(h => h.key === header.key)
      if (existingIndex >= 0) {
        // 更新现有的
        httpConfig.headers[existingIndex] = { ...header }
      } else {
        // 添加新的
        httpConfig.headers.push({ ...header })
      }
    })

    triggerValidation()
  }

  // 监听配置变化
  watch(
    httpConfig,
    () => {
      // 可以在这里添加额外的变化处理逻辑
    },
    { deep: true }
  )

  // 初始验证
  if (autoValidate) {
    triggerValidation()
  }

  // 返回composable接口
  return {
    // 状态
    httpConfig,
    httpState,
    availableSystemApis,

    // 计算属性
    isUrlValid,
    isBodyAllowed,
    hasValidConfig,
    enabledHeaders,
    enabledParams,
    requestSummary,

    // HTTP基础配置
    setMethod,
    setUrl,

    // 请求头管理
    addHeader,
    updateHeader,
    removeHeader,
    setHeaders,
    applyHeaderTemplate,

    // URL参数管理
    addParam,
    updateParam,
    removeParam,

    // 请求体管理
    setBodyType,
    setJsonBody,
    setFormBody,
    getRequestBody,

    // 配置操作
    buildRequestConfig,
    getConfig,
    setConfig,
    reset,

    // 系统API管理
    setSystemApis,
    findSystemApi,
    searchSystemApis,
    applySystemApi,

    // 连接测试
    testConnection,

    // 验证
    validateConfig,
    triggerValidation,

    // 工具方法
    generateCurlCommand,
    getRequestPreview
  }
}
