/**
 * 数据源执行器 - 核心执行模块
 * 完全解耦的数据处理执行器，支持单数据源和多数据源执行
 *
 * 核心功能:
 * 1. 执行HTTP请求 - 支持手动触发和自动触发
 * 2. 处理数据转换 - 基于配置执行数据处理逻辑
 * 3. 依赖链执行 - 前置数据未准备好时阻止后续执行
 * 4. 配置变更触发 - 任何配置变动都触发重新执行
 * 5. 错误容忍 - 继续执行即使遇到错误
 */

import { ref, reactive, computed, watch, type Ref } from 'vue'
import { request } from '@/service/request'
import { defaultScriptEngine } from '@/core/script-engine'
import type {
  DataSourceConfig,
  ExecutionState,
  DependencyRule,
  DependencyCheckResult,
  ErrorHandlingStrategy,
  RawDataResult,
  ExecutionStats,
  IDataSourceExecutor,
  RawDataItem
} from '../types/execution'

/**
 * 数据源执行器类
 */
export class DataSourceExecutor implements IDataSourceExecutor {
  private config: Ref<DataSourceConfig | null> = ref(null)
  private state: ExecutionState = reactive({
    isExecuting: false,
    lastExecuteTime: null,
    lastError: null,
    executionCount: 0,
    rawDataResults: [],
    finalResult: null,
    finalProcessingSuccess: false
  })

  // 依赖规则配置
  private dependencyRules: Ref<DependencyRule[]> = ref([])

  // 错误处理策略
  private errorHandlingStrategy: Ref<ErrorHandlingStrategy> = ref({
    tolerant: true,
    retryPolicy: {
      enabled: false,
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true
    }
  })

  // 监听器
  private configWatcher: (() => void) | null = null

  constructor() {
    // 监听配置变化，自动触发重新执行
    this.setupConfigWatcher()
  }

  /**
   * 设置配置监听器
   */
  private setupConfigWatcher() {
    this.configWatcher = watch(
      () => this.config.value,
      (newConfig, oldConfig) => {
        if (newConfig && oldConfig) {
          console.log('🔄 [Executor] 配置变更检测')
          this.handleConfigChange(newConfig, oldConfig)
        }
      },
      { deep: true }
    )
  }

  /**
   * 处理配置变更 - 智能判断是否需要重新获取原始数据
   */
  private async handleConfigChange(newConfig: DataSourceConfig, oldConfig: DataSourceConfig) {
    const needsDataRefresh = this.shouldRefreshRawData(newConfig, oldConfig)
    const needsProcessingRefresh = this.shouldRefreshProcessing(newConfig, oldConfig)

    if (needsDataRefresh) {
      console.log('📊 [Executor] 原始数据配置变更，重新执行所有数据源')
      await this.executeAll()
    } else if (needsProcessingRefresh) {
      console.log('🔧 [Executor] 处理配置变更，仅重新处理数据')
      await this.performFinalProcessing()
    } else {
      console.log('🔍 [Executor] 配置变更不影响执行，跳过')
    }
  }

  /**
   * 判断是否需要重新获取原始数据
   */
  private shouldRefreshRawData(newConfig: DataSourceConfig, oldConfig: DataSourceConfig): boolean {
    const newRawData = newConfig.configuration.rawDataList
    const oldRawData = oldConfig.configuration.rawDataList

    // 数据项数量变化
    if (newRawData.length !== oldRawData.length) {
      return true
    }

    // 检查每个数据项的关键配置是否变化
    for (let i = 0; i < newRawData.length; i++) {
      const newItem = newRawData[i]
      const oldItem = oldRawData[i]

      // ID、名称、类型变化
      if (newItem.id !== oldItem.id || newItem.name !== oldItem.name || newItem.type !== oldItem.type) {
        return true
      }

      // JSON数据变化
      if (newItem.type === 'json' && JSON.stringify(newItem.data) !== JSON.stringify(oldItem.data)) {
        return true
      }

      // HTTP配置变化 - 🔥 修复：使用正确的配置路径
      if (newItem.type === 'http') {
        const newHttpConfig = newItem.config?.httpConfig || newItem.httpConfig
        const oldHttpConfig = oldItem.config?.httpConfig || oldItem.httpConfig

        if (newHttpConfig && oldHttpConfig) {
          const httpConfigChanged = this.isHttpConfigChanged(newHttpConfig, oldHttpConfig)
          if (httpConfigChanged) {
            return true
          }
        }
      }
    }

    return false
  }

  /**
   * 判断HTTP配置是否变化
   */
  private isHttpConfigChanged(newConfig: any, oldConfig: any): boolean {
    // 关键HTTP配置字段
    const keyFields = ['method', 'url', 'bodyType', 'bodyContent', 'timeout']

    for (const field of keyFields) {
      if (newConfig[field] !== oldConfig[field]) {
        return true
      }
    }

    // 检查请求头变化
    if (JSON.stringify(newConfig.headers || []) !== JSON.stringify(oldConfig.headers || [])) {
      return true
    }

    // 检查请求参数变化
    if (JSON.stringify(newConfig.params || []) !== JSON.stringify(oldConfig.params || [])) {
      return true
    }

    return false
  }

  /**
   * 判断是否需要重新处理数据
   */
  private shouldRefreshProcessing(newConfig: DataSourceConfig, oldConfig: DataSourceConfig): boolean {
    const newProcessing = newConfig.configuration
    const oldProcessing = oldConfig.configuration

    // 处理类型变化
    if (newProcessing.finalProcessingType !== oldProcessing.finalProcessingType) {
      return true
    }

    // 处理脚本变化
    if (newProcessing.finalProcessingScript !== oldProcessing.finalProcessingScript) {
      return true
    }

    // 选择的数据项索引变化
    if (newProcessing.selectedDataItemIndex !== oldProcessing.selectedDataItemIndex) {
      return true
    }

    // 处理配置变化
    if (
      JSON.stringify(newProcessing.finalProcessingConfig || {}) !==
      JSON.stringify(oldProcessing.finalProcessingConfig || {})
    ) {
      return true
    }

    return false
  }

  /**
   * 加载配置
   */
  loadConfig(config: DataSourceConfig) {
    console.log('📋 [Executor] 加载配置:', config.dataSourceKey)
    this.config.value = config
    this.resetState()
  }

  /**
   * 获取当前配置
   */
  getConfig(): DataSourceConfig | null {
    return this.config.value
  }

  /**
   * 重置执行状态
   */
  private resetState() {
    Object.assign(this.state, {
      isExecuting: false,
      lastExecuteTime: null,
      lastError: null,
      executionCount: 0,
      rawDataResults: [],
      finalResult: null,
      finalProcessingSuccess: false
    })
  }

  /**
   * 执行所有数据源 - 主入口方法
   */
  async executeAll(): Promise<ExecutionState> {
    if (!this.config.value) {
      throw new Error('未加载配置，无法执行')
    }

    console.log('🚀 [Executor] 开始执行所有数据源')
    this.state.isExecuting = true
    this.state.lastError = null
    this.state.executionCount++

    try {
      // 1. 执行原始数据获取
      await this.executeRawDataSources()

      // 2. 检查依赖关系
      const dependencyCheck = this.checkDependencies()
      if (!dependencyCheck.canProceed) {
        throw new Error(`依赖检查失败: ${dependencyCheck.reason}`)
      }

      // 3. 执行最终数据处理
      await this.performFinalProcessing()

      this.state.lastExecuteTime = new Date().toISOString()
      console.log('✅ [Executor] 执行完成')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      this.state.lastError = errorMessage
      console.error('❌ [Executor] 执行失败:', errorMessage)

      if (!this.errorHandlingStrategy.value.tolerant) {
        throw error
      }
    } finally {
      this.state.isExecuting = false
    }

    return this.getExecutionState()
  }

  /**
   * 执行原始数据源获取
   */
  private async executeRawDataSources() {
    const { rawDataList } = this.config.value!.configuration
    console.log(`📊 [Executor] 执行 ${rawDataList.length} 个原始数据源`)

    // 清空之前的结果
    this.state.rawDataResults = []

    // 并行执行所有原始数据源
    const promises = rawDataList.map(async dataItem => {
      const result = {
        id: dataItem.id,
        name: dataItem.name || dataItem.id,
        type: dataItem.type,
        success: false,
        data: null as any,
        timestamp: new Date().toISOString(),
        error: undefined as string | undefined
      }

      try {
        // 步骤1：获取原始数据
        let rawData: any = null
        switch (dataItem.type) {
          case 'json':
            rawData = dataItem.data
            break

          case 'http':
            rawData = await this.executeHttpRequest(dataItem)
            break

          case 'websocket':
            // WebSocket 实现可以后续添加
            throw new Error('WebSocket 数据源暂未实现')

          default:
            throw new Error(`不支持的数据源类型: ${dataItem.type}`)
        }

        // 步骤2：应用数据过滤（如果配置了filterPath）
        let filteredData = rawData
        if (dataItem.config?.filterPath) {
          filteredData = this.applyDataFilter(rawData, dataItem.config.filterPath)

          // 关键检查：过滤后是否为null，尝试路径修复
          if (filteredData === null || filteredData === undefined) {
            console.warn(`⚠️ [Executor] 数据源 ${dataItem.name} 过滤结果为空，尝试路径修复`)
            
            // 尝试修复路径
            const originalPath = dataItem.config.filterPath
            const fixedPath = this.fixInvalidPrefix(originalPath, rawData)

            if (fixedPath && fixedPath !== originalPath) {
              filteredData = this.applyDataFilter(rawData, fixedPath)
              if (filteredData !== null) {
                console.info(`✅ [Executor] 路径修复成功: "${originalPath}" -> "${fixedPath}"`)
              }
            }
          }
        }

        // 步骤3：应用脚本处理（如果配置了processScript）
        let processedData = filteredData
        if (dataItem.config?.processScript) {
          // 检查输入数据是否有效
          if (filteredData === null || filteredData === undefined) {
            console.warn(`⚠️ [Executor] 数据源 ${dataItem.name} 输入数据为空，跳过脚本处理`)
            processedData = filteredData // 保持null/undefined
          } else {
            processedData = await this.applyProcessScript(filteredData, dataItem.config.processScript)
          }
        }

        // 步骤4：存储最终处理结果
        result.data = processedData
        result.success = true
      } catch (error) {
        result.error = this.handleExecutionError(error, `数据源 ${dataItem.name} 执行失败`)

        // 根据错误容忍配置决定是否继续
        if (!this.errorHandlingStrategy.value.tolerant) {
          throw error
        }
      }

      this.state.rawDataResults.push(result)
      return result
    })

    await Promise.allSettled(promises)
  }

  /**
   * 执行HTTP请求
   */
  private async executeHttpRequest(dataItem: any): Promise<any> {
    // 🔥 修复：HTTP配置在 config.httpConfig 中，而不是直接在 dataItem 中
    const httpConfig = dataItem.config?.httpConfig || dataItem.httpConfig
    if (!httpConfig) {
      console.error('❌ [Executor] HTTP配置缺失，数据项结构:', {
        dataItemKeys: Object.keys(dataItem),
        configKeys: dataItem.config ? Object.keys(dataItem.config) : 'config不存在',
        hasDirectHttpConfig: !!dataItem.httpConfig,
        hasConfigHttpConfig: !!dataItem.config?.httpConfig
      })
      throw new Error('HTTP配置缺失')
    }

    console.log(`🌐 [Executor] 执行HTTP请求: ${httpConfig.method} ${httpConfig.url}`)

    // 🔥 修复：直接使用项目封装好的request，不要重复造轮子
    // 构建请求参数
    const params: Record<string, any> = {}
    httpConfig.params?.forEach((param: any) => {
      if (param.key && param.value) {
        params[param.key] = param.value
      }
    })

    // 构建请求选项（让项目的request自己处理所有配置）
    const requestOptions: any = {}
    if (Object.keys(params).length > 0) {
      requestOptions.params = params
    }

    console.log(`🚀 [Executor] 使用项目request发送请求:`, httpConfig.url, httpConfig.method, requestOptions)

    let response: any
    let responseData: any

    try {
      // 直接使用项目的request，它会自动处理代理、baseURL、拦截器等
      if (httpConfig.method === 'GET') {
        response = await request.get(httpConfig.url, requestOptions)
      } else if (httpConfig.method === 'POST') {
        let data = {}
        if (httpConfig.bodyType === 'json' && httpConfig.bodyContent) {
          try {
            data = JSON.parse(httpConfig.bodyContent)
          } catch (error) {
            throw new Error('JSON格式错误')
          }
        }
        response = await request.post(httpConfig.url, data, requestOptions)
      } else if (httpConfig.method === 'PUT') {
        let data = {}
        if (httpConfig.bodyType === 'json' && httpConfig.bodyContent) {
          try {
            data = JSON.parse(httpConfig.bodyContent)
          } catch (error) {
            throw new Error('JSON格式错误')
          }
        }
        response = await request.put(httpConfig.url, data, requestOptions)
      } else if (httpConfig.method === 'DELETE') {
        response = await request.delete(httpConfig.url, requestOptions)
      } else {
        throw new Error(`不支持的HTTP方法: ${httpConfig.method}`)
      }

      // 智能提取响应数据，支持多种格式
      responseData = this.extractResponseData(response)
    } catch (error) {
      this.handleExecutionError(error, 'HTTP请求失败')

      // 处理请求失败但服务器有响应的情况（可能是格式不匹配）
      if (error instanceof Error && 'response' in error) {
        const errorResponse = (error as any).response
        if (errorResponse?.status >= 200 && errorResponse?.status < 300) {
          responseData = this.extractResponseData(errorResponse)
        } else {
          throw new Error(`HTTP请求失败: ${errorResponse?.status} ${errorResponse?.statusText || error.message}`)
        }
      } else {
        throw error
      }
    }


    if (responseData && typeof responseData === 'object') {
    }

    return responseData
  }

  /**
   * 智能提取响应数据，支持多种格式
   */
  private extractResponseData(response: any): any {
    if (!response || typeof response !== 'object') {
      return response
    }

    // 项目内部API格式：{code: 200, data: actualData}
    if ('code' in response && 'data' in response) {
      return response.data
    }
    
    // 标准HTTP响应格式：{data: actualData}
    if ('data' in response) {
      return response.data
    }
    
    // 直接就是数据
    return response
  }

  /**
   * 统一错误处理 - 提供用户友好的错误信息
   */
  private handleExecutionError(error: any, context: string): string {
    let errorMessage = error instanceof Error ? error.message : String(error)
    
    // 转换技术错误为用户友好的提示
    if (errorMessage.includes('network') || errorMessage.includes('ENOTFOUND')) {
      errorMessage = '网络连接失败，请检查网络设置或URL是否正确'
    } else if (errorMessage.includes('timeout')) {
      errorMessage = '请求超时，请稍后重试或检查服务器状态'
    } else if (errorMessage.includes('JSON')) {
      errorMessage = 'JSON数据格式错误，请检查数据格式是否正确'
    } else if (errorMessage.includes('script')) {
      errorMessage = '脚本执行错误，请检查脚本语法和逻辑'
    } else if (errorMessage.includes('path') || errorMessage.includes('filter')) {
      errorMessage = '数据过滤路径错误，请检查JSONPath语法'
    }
    
    console.error(`❌ [Executor] ${context}:`, errorMessage)
    return errorMessage
  }

  /**
   * 检查依赖关系
   */
  private checkDependencies(): DependencyCheckResult {
    if (this.dependencyRules.value.length === 0) {
      return { canProceed: true }
    }

    const failedDependencies: string[] = []
    const blockedSources: string[] = []

    for (const rule of this.dependencyRules.value) {
      const result = this.state.rawDataResults.find(r => r.id === rule.sourceDataId)

      if (!result) {
        if (rule.required) {
          failedDependencies.push(rule.sourceDataId)
          return {
            canProceed: false,
            reason: `必需的数据源 ${rule.sourceDataId} 未找到`,
            failedDependencies: [rule.sourceDataId]
          }
        }
        continue
      }

      if (!result.success && rule.blockOnFailure) {
        blockedSources.push(rule.sourceDataId)
        return {
          canProceed: false,
          reason: `数据源 ${rule.sourceDataId} 失败，阻塞后续执行`,
          blockedSources: [rule.sourceDataId]
        }
      }
    }

    return { canProceed: true }
  }

  /**
   * 执行最终数据处理 - 内部方法
   */
  private async performFinalProcessing() {
    const { finalProcessingType, finalProcessingScript, selectedDataItemIndex } = this.config.value!.configuration

    console.log(`🔧 [Executor] 执行最终数据处理: ${finalProcessingType}`)
    console.log(`🔧 [Executor] 原始数据结果汇总:`)

    this.state.rawDataResults.forEach((result, index) => {
      console.log(`  [${index}] ${result.name} (${result.success ? '成功' : '失败'}):`, result.data)
    })

    // 获取成功的原始数据
    const successfulData = this.state.rawDataResults.filter(r => r.success).map(r => r.data)

    console.log(`🔧 [Executor] 成功的数据项数量: ${successfulData.length}`)
    console.log(`🔧 [Executor] 成功的数据内容:`, successfulData)

    let result: any = null

    switch (finalProcessingType) {
      case 'merge-object': {
        // 对象合并
        result = {}
        successfulData.forEach((data, index) => {
          console.log(`🔧 [Executor] 合并数据项 [${index}]:`, {
            type: typeof data,
            isNull: data === null,
            isArray: Array.isArray(data),
            data: data
          })

          if (data && typeof data === 'object' && !Array.isArray(data)) {
            console.log(`🔧 [Executor] 将数据项 [${index}] 合并到结果中`)
            Object.assign(result, data)
          } else {
            console.log(`🔧 [Executor] 跳过数据项 [${index}] (不是有效对象)`)
          }
        })
        break
      }

      case 'concat-array': {
        // 数组连接
        result = []
        successfulData.forEach(data => {
          if (Array.isArray(data)) {
            result = result.concat(data)
          } else if (data) {
            result.push(data)
          }
        })
        break
      }

      case 'select-specific': {
        // 选择特定数据项
        const index = selectedDataItemIndex ?? 0
        const selectedResult = this.state.rawDataResults[index]
        result = selectedResult?.success ? selectedResult.data : null
        break
      }

      case 'custom-script': {
        // 自定义脚本处理
        if (!finalProcessingScript) {
          throw new Error('自定义脚本处理类型需要提供脚本内容')
        }

        // 准备脚本执行环境
        const scriptContext = {
          processedDataList: successfulData, // 🔥 修复：现在这些数据已经经过完整处理链，应该叫processedDataList
          rawDataList: successfulData, // 保持向后兼容
          dataCount: successfulData.length,
          rawResults: this.state.rawDataResults,
          console: console
        }

        const scriptResult = await defaultScriptEngine.execute(finalProcessingScript, scriptContext)

        console.log('🔧 [Executor] 最终处理脚本执行元数据:', {
          success: scriptResult.success,
          executionTime: scriptResult.executionTime,
          hasData: scriptResult.data !== undefined
        })

        if (!scriptResult.success) {
          throw new Error(`最终处理脚本执行失败: ${scriptResult.error?.message || '未知错误'}`)
        }

        result = scriptResult.data // 🔥 关键修复：提取脚本的实际返回值
        break
      }

      default:
        throw new Error(`不支持的处理类型: ${finalProcessingType}`)
    }

    this.state.finalResult = result
    this.state.finalProcessingSuccess = true
    console.log('✅ [Executor] 最终数据处理完成')
    console.log('✅ [Executor] 最终结果类型:', typeof result)
    console.log('✅ [Executor] 最终结果内容:', result)
  }

  /**
   * 手动执行特定数据源
   */
  async executeDataSource(dataSourceId: string): Promise<any> {
    if (!this.config.value) {
      throw new Error('未加载配置')
    }

    const dataItem = this.config.value.configuration.rawDataList.find(item => item.id === dataSourceId)
    if (!dataItem) {
      throw new Error(`数据源 ${dataSourceId} 不存在`)
    }

    console.log(`🎯 [Executor] 手动执行数据源: ${dataItem.name}`)

    let result: any
    switch (dataItem.type) {
      case 'json':
        result = dataItem.data
        break
      case 'http':
        result = await this.executeHttpRequest(dataItem)
        break
      default:
        throw new Error(`不支持的数据源类型: ${dataItem.type}`)
    }

    // 更新结果到状态中
    const existingResultIndex = this.state.rawDataResults.findIndex(r => r.id === dataSourceId)
    const newResult = {
      id: dataSourceId,
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    }

    if (existingResultIndex >= 0) {
      this.state.rawDataResults[existingResultIndex] = newResult
    } else {
      this.state.rawDataResults.push(newResult)
    }

    return result
  }

  /**
   * 设置依赖规则
   */
  setDependencyRules(rules: DependencyRule[]) {
    this.dependencyRules.value = rules
    console.log('🔗 [Executor] 设置依赖规则:', rules)
  }

  /**
   * 设置错误处理策略
   */
  setErrorHandlingStrategy(strategy: ErrorHandlingStrategy) {
    this.errorHandlingStrategy.value = strategy
    console.log('🛡️ [Executor] 设置错误处理策略:', strategy)
  }

  /**
   * 执行最终数据处理 - 公开方法
   */
  async executeFinalProcessing(): Promise<any> {
    if (!this.config.value) {
      throw new Error('未加载配置')
    }

    await this.performFinalProcessing()
    return this.state.finalResult
  }

  /**
   * 获取执行状态
   */
  getExecutionState(): ExecutionState {
    return { ...this.state }
  }

  /**
   * 获取最终结果
   */
  getFinalResult() {
    return this.state.finalResult
  }

  /**
   * 获取原始数据结果
   */
  getRawDataResults() {
    return this.state.rawDataResults
  }

  /**
   * 修复无效前缀 - 简单直接的方法
   */
  private fixInvalidPrefix(originalPath: string, responseData: any): string {
    if (!originalPath || !responseData || typeof responseData !== 'object') {
      return originalPath
    }

    // 移除JSONPath前缀
    let cleanPath = originalPath.replace(/^\$\.?/, '')

    if (!cleanPath) {
      return originalPath
    }

    // 获取响应数据的可用属性
    const availableKeys = Object.keys(responseData)
    console.warn(`🔧 [PathFixer] 可用属性:`, availableKeys)
    console.warn(`🔧 [PathFixer] 清理后路径:`, cleanPath)

    // 检查路径是否以不存在的属性开头
    const firstPart = cleanPath.split('.')[0].split('[')[0] // 获取第一个属性名
    console.warn(`🔧 [PathFixer] 路径第一部分:`, firstPart)

    if (!availableKeys.includes(firstPart)) {
      console.warn(`🔧 [PathFixer] 第一部分"${firstPart}"不存在，尝试移除...`)

      // 如果第一部分不存在，尝试移除它
      const pathParts = cleanPath.split('.')
      if (pathParts.length > 1) {
        // 移除第一部分，保留后面的路径
        const fixedPath = pathParts.slice(1).join('.')
        console.warn(`🔧 [PathFixer] 移除无效前缀后:`, fixedPath)

        // 检查修复后的路径是否有效
        const newFirstPart = fixedPath.split('.')[0].split('[')[0]
        if (availableKeys.includes(newFirstPart)) {
          console.warn(`✅ [PathFixer] 修复成功！新的第一部分"${newFirstPart}"存在`)
          return fixedPath
        }
      }
    }

    return originalPath // 无法修复，返回原路径
  }

  /**
   * 智能生成候选路径 - 基于原始路径和响应结构
   */
  private generateCandidatePaths(
    originalPath: string,
    responseData: any
  ): Array<{ path: string; description: string }> {
    const candidates: Array<{ path: string; description: string }> = []

    // 分析响应数据结构
    const responseStructure = this.analyzeResponseStructure(responseData)
    console.log(`🔍 [PathFixer] 响应结构分析:`, responseStructure)

    // 解析原始路径意图
    const pathIntent = this.parsePathIntent(originalPath)
    console.log(`🔍 [PathFixer] 路径意图分析:`, pathIntent)

    // 策略1: 移除常见的多余前缀
    this.addPrefixRemovalCandidates(originalPath, candidates)

    // 策略2: 基于响应结构的智能匹配
    this.addStructureBasedCandidates(pathIntent, responseStructure, candidates)

    // 策略3: 常见属性名变体匹配
    this.addCommonVariantCandidates(pathIntent, responseStructure, candidates)

    // 策略4: 如果是单纯访问根级属性，尝试直接返回
    this.addDirectAccessCandidates(pathIntent, responseStructure, candidates)

    // 去重并排序（按成功概率）
    return this.deduplicateAndSort(candidates)
  }

  /**
   * 分析响应数据结构
   */
  private analyzeResponseStructure(data: any): any {
    if (!data || typeof data !== 'object') {
      return { type: typeof data, isNull: data === null }
    }

    const structure: any = {
      type: Array.isArray(data) ? 'array' : 'object',
      properties: Array.isArray(data) ? [] : Object.keys(data),
      length: Array.isArray(data) ? data.length : undefined,
      hasArrayProperties: false,
      arrayProperties: [],
      hasNestedObjects: false
    }

    if (!Array.isArray(data)) {
      // 分析对象属性
      for (const [key, value] of Object.entries(data)) {
        if (Array.isArray(value)) {
          structure.hasArrayProperties = true
          structure.arrayProperties.push({
            name: key,
            length: value.length,
            itemType: value.length > 0 ? typeof value[0] : 'unknown'
          })
        } else if (value && typeof value === 'object') {
          structure.hasNestedObjects = true
        }
      }
    }

    return structure
  }

  /**
   * 解析路径意图
   */
  private parsePathIntent(path: string): any {
    const intent: any = {
      originalPath: path,
      hasPrefix: false,
      prefix: '',
      mainPath: path,
      wantsArray: false,
      arrayIndex: null,
      wantsDirectAccess: false,
      targetProperty: null
    }

    // 移除并记录前缀
    let cleanPath = path.trim()
    if (cleanPath.startsWith('$.')) {
      intent.hasPrefix = true
      intent.prefix = '$.'
      cleanPath = cleanPath.substring(2)
    } else if (cleanPath.startsWith('$')) {
      intent.hasPrefix = true
      intent.prefix = '$'
      cleanPath = cleanPath.substring(1)
    }

    intent.mainPath = cleanPath

    // 检查是否访问数组索引
    const arrayMatch = cleanPath.match(/\[(\d+)\]$/)
    if (arrayMatch) {
      intent.wantsArray = true
      intent.arrayIndex = parseInt(arrayMatch[1])
      intent.targetProperty = cleanPath.replace(/\[(\d+)\]$/, '')
    } else {
      intent.targetProperty = cleanPath
    }

    // 检查是否只是简单的属性访问
    if (!cleanPath.includes('.') && !cleanPath.includes('[')) {
      intent.wantsDirectAccess = true
    }

    return intent
  }

  /**
   * 添加前缀移除候选路径 - 智能处理复杂路径
   */
  private addPrefixRemovalCandidates(originalPath: string, candidates: Array<{ path: string; description: string }>) {
    // 更智能的前缀移除策略
    const prefixStrategies = [
      // 策略1: 移除 $. 或 $ 前缀
      {
        test: (path: string) => path.startsWith('$.') || path.startsWith('$'),
        fix: (path: string) => {
          if (path.startsWith('$.')) return path.substring(2)
          if (path.startsWith('$')) return path.substring(1)
          return path
        },
        desc: '移除JSONPath前缀'
      },
      // 策略2: 移除常见的API包装字段
      {
        test: (path: string) => /^(data|result|response)\./i.test(path),
        fix: (path: string) => path.replace(/^(data|result|response)\./i, ''),
        desc: '移除API包装字段'
      },
      // 策略3: 组合策略 - 移除 $.data. 类型的前缀
      {
        test: (path: string) => /^\$\.(data|result|response)\./i.test(path),
        fix: (path: string) => path.replace(/^\$\.(data|result|response)\./i, ''),
        desc: '移除JSONPath+API包装前缀'
      },
      // 策略4: 移除 $data. 类型的前缀（没有点的格式）
      {
        test: (path: string) => /^\$(data|result|response)\./i.test(path),
        fix: (path: string) => path.replace(/^\$(data|result|response)\./i, ''),
        desc: '移除$API包装前缀'
      }
    ]

    for (const strategy of prefixStrategies) {
      if (strategy.test(originalPath)) {
        const fixedPath = strategy.fix(originalPath)
        if (fixedPath !== originalPath && fixedPath.trim()) {
          candidates.push({
            path: fixedPath,
            description: strategy.desc
          })
        }
      }
    }

    // 额外策略：如果路径仍然包含不存在的前缀，尝试进一步清理
    const cleanedPath = originalPath.replace(/^\$\.?/, '') // 移除JSONPath前缀
    if (cleanedPath.includes('.')) {
      const parts = cleanedPath.split('.')
      // 如果第一部分可能是无效的包装字段，尝试移除它
      if (parts.length > 1 && ['data', 'result', 'response'].includes(parts[0].toLowerCase())) {
        const withoutFirstPart = parts.slice(1).join('.')
        candidates.push({
          path: withoutFirstPart,
          description: `移除可能无效的包装字段: ${parts[0]}`
        })
      }
    }
  }

  /**
   * 添加基于结构的候选路径 - 智能重构复杂路径
   */
  private addStructureBasedCandidates(
    pathIntent: any,
    structure: any,
    candidates: Array<{ path: string; description: string }>
  ) {
    if (structure.type === 'object' && structure.hasArrayProperties) {
      // 分析用户的完整路径意图
      const originalParts = this.parseComplexPath(pathIntent.originalPath)
      console.log(`🔍 [PathFixer] 复杂路径解析:`, originalParts)

      // 为每个数组属性生成智能候选路径
      for (const arrayProp of structure.arrayProperties) {
        // 策略1: 如果用户想要数组中的特定元素
        if (originalParts.hasArrayAccess) {
          const reconstructedPath = this.reconstructPath(arrayProp.name, originalParts)
          if (reconstructedPath) {
            candidates.push({
              path: reconstructedPath,
              description: `重构路径: 使用${arrayProp.name}数组 + 原始结构`
            })
          }

          // 简化版本：只获取数组元素
          candidates.push({
            path: `${arrayProp.name}[${originalParts.arrayIndex}]`,
            description: `简化版: 直接访问${arrayProp.name}数组的第${originalParts.arrayIndex}个元素`
          })
        }

        // 策略2: 如果用户只想要整个数组
        if (!originalParts.hasArrayAccess || originalParts.afterArrayPath === '') {
          candidates.push({
            path: arrayProp.name,
            description: `直接访问${arrayProp.name}数组`
          })
        }
      }
    }

    if (structure.type === 'array' && pathIntent.wantsArray) {
      // 如果响应本身就是数组，直接访问索引
      candidates.push({
        path: `[${pathIntent.arrayIndex}]`,
        description: `直接访问数组第${pathIntent.arrayIndex}个元素`
      })
    }
  }

  /**
   * 解析复杂路径结构
   */
  private parseComplexPath(originalPath: string): any {
    const result = {
      originalPath,
      cleanPath: originalPath.replace(/^\$\.?/, ''), // 移除JSONPath前缀
      beforeArray: '',
      hasArrayAccess: false,
      arrayIndex: 0,
      afterArrayPath: '',
      invalidPrefix: null
    }

    // 查找数组访问模式 [数字]
    const arrayMatch = result.cleanPath.match(/^(.*?)\[(\d+)\](.*)$/)
    if (arrayMatch) {
      result.hasArrayAccess = true
      result.beforeArray = arrayMatch[1]
      result.arrayIndex = parseInt(arrayMatch[2])
      result.afterArrayPath = arrayMatch[3]

      // 检查beforeArray是否包含无效前缀
      if (result.beforeArray.includes('.')) {
        const parts = result.beforeArray.split('.')
        const possibleInvalidPrefixes = ['data', 'result', 'response']
        if (parts.length > 1 && possibleInvalidPrefixes.includes(parts[0].toLowerCase())) {
          result.invalidPrefix = parts[0]
          result.beforeArray = parts.slice(1).join('.')
        }
      }
    }

    return result
  }

  /**
   * 重构路径：使用正确的数组名称 + 原始路径结构
   */
  private reconstructPath(correctArrayName: string, parsedPath: any): string {
    if (!parsedPath.hasArrayAccess) {
      return correctArrayName
    }

    // 重构: correctArrayName + [index] + afterArrayPath
    let reconstructed = `${correctArrayName}[${parsedPath.arrayIndex}]`

    if (parsedPath.afterArrayPath && parsedPath.afterArrayPath.startsWith('.')) {
      reconstructed += parsedPath.afterArrayPath
    } else if (parsedPath.afterArrayPath) {
      reconstructed += '.' + parsedPath.afterArrayPath
    }

    return reconstructed
  }

  /**
   * 添加常见变体候选路径 - 支持复杂路径重构
   */
  private addCommonVariantCandidates(
    pathIntent: any,
    structure: any,
    candidates: Array<{ path: string; description: string }>
  ) {
    if (structure.type === 'object') {
      const commonArrayNames = ['list', 'items', 'data', 'results', 'records', 'rows', 'content']
      const availableProps = structure.properties

      // 解析原始路径的复杂结构
      const originalParts = this.parseComplexPath(pathIntent.originalPath)

      for (const commonName of commonArrayNames) {
        if (availableProps.includes(commonName)) {
          // 如果有复杂的数组访问路径，重构它
          if (originalParts.hasArrayAccess) {
            const reconstructedPath = this.reconstructPath(commonName, originalParts)
            candidates.push({
              path: reconstructedPath,
              description: `使用${commonName}重构复杂路径`
            })

            // 也添加简化版本
            candidates.push({
              path: `${commonName}[${originalParts.arrayIndex}]`,
              description: `简化版: ${commonName}数组的第${originalParts.arrayIndex}个元素`
            })
          }
          // 如果是简单路径或想要整个数组
          else {
            candidates.push({
              path: commonName,
              description: `尝试${commonName}属性`
            })
          }
        }
      }
    }
  }

  /**
   * 添加直接访问候选路径
   */
  private addDirectAccessCandidates(
    pathIntent: any,
    structure: any,
    candidates: Array<{ path: string; description: string }>
  ) {
    if (
      pathIntent.wantsDirectAccess ||
      pathIntent.targetProperty === 'data' ||
      pathIntent.targetProperty === 'result'
    ) {
      candidates.push({
        path: '',
        description: '直接返回原始响应数据'
      })
    }
  }

  /**
   * 去重并排序候选路径
   */
  private deduplicateAndSort(
    candidates: Array<{ path: string; description: string }>
  ): Array<{ path: string; description: string }> {
    // 去重
    const unique = candidates.filter(
      (candidate, index, self) => index === self.findIndex(c => c.path === candidate.path)
    )

    // 按成功概率排序（简单启发式）
    return unique.sort((a, b) => {
      // 空路径（直接返回）优先级最低
      if (a.path === '' && b.path !== '') return 1
      if (b.path === '' && a.path !== '') return -1

      // 较短的路径通常成功率更高
      if (a.path.length !== b.path.length) {
        return a.path.length - b.path.length
      }

      // 包含常见属性名的路径优先
      const commonProps = ['list', 'items', 'data']
      const aHasCommon = commonProps.some(prop => a.path.includes(prop))
      const bHasCommon = commonProps.some(prop => b.path.includes(prop))

      if (aHasCommon && !bHasCommon) return -1
      if (bHasCommon && !aHasCommon) return 1

      return 0
    })
  }

  /**
   * 应用数据过滤
   */
  private applyDataFilter(data: any, filterPath: string): any {
    try {
      // 处理各种JSONPath格式
      let current = data
      let cleanPath = filterPath.trim()

      // 移除开头的 $ 或 $. 前缀
      cleanPath = cleanPath.replace(/^\$\.?/, '')

      if (!cleanPath) {
        console.log(`🔍 [Executor] 空路径，直接返回原始数据`)
        return data
      }

      console.log(`🔍 [Executor] 开始过滤数据`)
      console.log(`🔍 [Executor] - 原始路径: "${filterPath}"`)
      console.log(`🔍 [Executor] - 清理后路径: "${cleanPath}"`)
      console.log(`🔍 [Executor] - 原始数据类型: ${typeof data}`)
      console.log(`🔍 [Executor] - 原始数据:`, data)

      // 将路径分解为组件，支持 . 和 [] 语法
      const parts: string[] = []
      let currentPart = ''
      let inBrackets = false

      for (let i = 0; i < cleanPath.length; i++) {
        const char = cleanPath[i]

        if (char === '[') {
          if (currentPart.trim()) {
            parts.push(currentPart.trim())
            currentPart = ''
          }
          inBrackets = true
        } else if (char === ']') {
          if (currentPart.trim()) {
            parts.push(currentPart.trim())
            currentPart = ''
          }
          inBrackets = false
        } else if (char === '.' && !inBrackets) {
          if (currentPart.trim()) {
            parts.push(currentPart.trim())
            currentPart = ''
          }
        } else {
          currentPart += char
        }
      }

      if (currentPart.trim()) {
        parts.push(currentPart.trim())
      }

      console.log(`🔍 [Executor] - 路径分段:`, parts)

      // 逐步访问路径
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        console.log(`🔍 [Executor] - 处理路径片段 [${i}]: "${part}" (当前值类型: ${typeof current})`)

        if (current === null || current === undefined) {
          console.log(`🔍 [Executor] - 在路径片段 [${i}] 处遇到null/undefined`)
          return null
        }

        if (/^\d+$/.test(part)) {
          // 数组索引
          const index = parseInt(part)
          console.log(`🔍 [Executor] - 尝试访问数组索引: [${index}]`)

          if (Array.isArray(current)) {
            if (index >= 0 && index < current.length) {
              current = current[index]
              console.log(`🔍 [Executor] - 数组索引 [${index}] 访问成功, 结果类型: ${typeof current}`)
            } else {
              console.log(`🔍 [Executor] - 数组索引 [${index}] 超出范围 (数组长度: ${current.length})`)
              return null
            }
          } else {
            console.log(`🔍 [Executor] - 尝试在非数组上使用索引 [${index}], 当前值类型: ${typeof current}`)
            return null
          }
        } else {
          // 对象属性
          console.log(`🔍 [Executor] - 尝试访问对象属性: "${part}"`)

          if (typeof current === 'object' && current !== null) {
            if (part in current) {
              current = current[part]
              console.log(`🔍 [Executor] - 对象属性 "${part}" 访问成功, 结果类型: ${typeof current}`)
            } else {
              console.log(`🔍 [Executor] - 对象属性 "${part}" 不存在`)
              console.log(`🔍 [Executor] - 可用属性:`, Object.keys(current))
              return null
            }
          } else {
            console.log(`🔍 [Executor] - 尝试在非对象上访问属性 "${part}", 当前值类型: ${typeof current}`)
            return null
          }
        }
      }

      console.log(`🔍 [Executor] - 过滤完成，最终结果类型: ${typeof current}`)
      console.log(`🔍 [Executor] - 过滤完成，最终结果:`, current)
      return current
    } catch (error) {
      console.error(`❌ [Executor] 数据过滤失败:`, error)
      console.error(`❌ [Executor] 过滤路径: "${filterPath}", 数据:`, data)
      return data // 出错时返回原始数据
    }
  }

  /**
   * 应用处理脚本
   */
  private async applyProcessScript(data: any, script: string): Promise<any> {
    try {
      // 准备脚本执行环境 - 对大数据进行只读保护
      const scriptContext = {
        data: Object.freeze(data), // 防止脚本意外修改原始数据
        console: console
      }

      const result = await defaultScriptEngine.execute(script, scriptContext)

      if (!result.success) {
        throw new Error(`脚本执行失败: ${result.error?.message || '未知错误'}`)
      }

      return result.data // 返回脚本的实际结果
    } catch (error) {
      console.error(`❌ [Executor] 脚本执行失败:`, error)
      throw error
    }
  }

  /**
   * 清理资源
   */
  destroy() {
    if (this.configWatcher) {
      this.configWatcher()
      this.configWatcher = null
    }
    this.resetState()
    console.log('🧹 [Executor] 执行器已销毁')
  }
}

/**
 * 创建数据源执行器实例
 */
export function createDataSourceExecutor(): DataSourceExecutor {
  return new DataSourceExecutor()
}

/**
 * 导出默认执行器实例
 */
export const defaultExecutor = createDataSourceExecutor()
