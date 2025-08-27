/**
 * 增强版类型系统验证脚本
 * 验证泛型配置类型系统和适配器的正确性
 *
 * 可以在浏览器控制台直接运行: await validateEnhancedTypeSystem()
 */

import { createConfigurationAdapter, detectConfigVersion, upgradeToV2, downgradeToV1 } from './adapters'

import type {
  DataItemConfig,
  EnhancedJsonDataItemConfig,
  EnhancedHttpDataItemConfig,
  EnhancedDataSourceConfiguration,
  DynamicParam,
  DEFAULT_ENHANCED_FEATURES
} from './types'

import type {
  DataSourceConfiguration as LegacyDataSourceConfiguration,
  JsonDataItemConfig as LegacyJsonDataItemConfig,
  HttpDataItemConfig as LegacyHttpDataItemConfig
} from './executors'

/**
 * 验证结果接口
 */
interface ValidationResult {
  testName: string
  success: boolean
  message: string
  details?: any
}

/**
 * 增强版类型系统完整验证
 */
export async function validateEnhancedTypeSystem(): Promise<boolean> {
  console.log('🧪 [EnhancedTypeSystem] 开始验证增强版类型系统')

  const results: ValidationResult[] = []

  // 测试1: 泛型配置类型创建和验证
  results.push(await testGenericConfigCreation())

  // 测试2: JSON配置类型增强功能
  results.push(await testEnhancedJsonConfig())

  // 测试3: HTTP配置类型数组格式
  results.push(await testEnhancedHttpConfig())

  // 测试4: 动态参数系统
  results.push(await testDynamicParameterSystem())

  // 测试5: 配置版本检测
  results.push(await testVersionDetection())

  // 测试6: v1到v2升级
  results.push(await testV1ToV2Upgrade())

  // 测试7: v2到v1降级
  results.push(await testV2ToV1Downgrade())

  // 测试8: 往返转换一致性
  results.push(await testRoundTripConsistency())

  // 测试9: 批量转换功能
  results.push(await testBatchConversion())

  // 汇总结果
  const successCount = results.filter(r => r.success).length
  const totalCount = results.length

  console.log('📊 [EnhancedTypeSystem] 验证结果汇总:')
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌'
    console.log(`   ${icon} ${result.testName}: ${result.message}`)
    if (!result.success && result.details) {
      console.error('     详细错误:', result.details)
    }
  })

  console.log(`\n🎯 [EnhancedTypeSystem] 总体结果: ${successCount}/${totalCount} 通过`)

  if (successCount === totalCount) {
    console.log('🎉 [EnhancedTypeSystem] 增强版类型系统验证完全通过！')
    return true
  } else {
    console.warn('⚠️ [EnhancedTypeSystem] 发现问题，请检查失败的测试项。')
    return false
  }
}

// ==================== 测试用例实现 ====================

async function testGenericConfigCreation(): Promise<ValidationResult> {
  try {
    // 创建泛型JSON数据项配置
    const jsonDataItem: DataItemConfig<EnhancedJsonDataItemConfig> = {
      type: 'json',
      id: 'test-json-001',
      config: {
        jsonData: '{"sensor": "temperature", "value": 25.6, "unit": "°C"}',
        validation: {
          enableFormat: true,
          enableStructure: false
        },
        preprocessing: {
          removeComments: false,
          formatOutput: true
        }
      },
      metadata: {
        displayName: '温度传感器数据',
        description: '温度传感器JSON数据配置',
        enabled: true,
        tags: ['sensor', 'temperature']
      }
    }

    // 验证配置结构
    const isValid =
      jsonDataItem.type === 'json' &&
      jsonDataItem.id === 'test-json-001' &&
      jsonDataItem.config.jsonData.includes('temperature') &&
      jsonDataItem.metadata?.displayName === '温度传感器数据'

    return {
      testName: '泛型配置类型创建',
      success: isValid,
      message: isValid ? '泛型DataItemConfig创建成功' : '泛型配置结构验证失败',
      details: isValid ? undefined : jsonDataItem
    }
  } catch (error) {
    return {
      testName: '泛型配置类型创建',
      success: false,
      message: '泛型配置创建异常',
      details: error
    }
  }
}

async function testEnhancedJsonConfig(): Promise<ValidationResult> {
  try {
    const enhancedJsonConfig: EnhancedJsonDataItemConfig = {
      jsonData: '{"devices": [{"id": "001", "status": "online"}, {"id": "002", "status": "offline"}]}',
      validation: {
        enableFormat: true,
        enableStructure: true,
        schema: {
          type: 'object',
          properties: {
            devices: { type: 'array' }
          }
        }
      },
      preprocessing: {
        removeComments: true,
        formatOutput: true
      }
    }

    // 验证JSON数据解析
    const parsedData = JSON.parse(enhancedJsonConfig.jsonData)
    const isValid =
      Array.isArray(parsedData.devices) &&
      parsedData.devices.length === 2 &&
      enhancedJsonConfig.validation?.enableFormat === true

    return {
      testName: '增强JSON配置功能',
      success: isValid,
      message: isValid ? 'JSON配置增强功能正常' : 'JSON配置功能验证失败',
      details: isValid ? undefined : { config: enhancedJsonConfig, parsed: parsedData }
    }
  } catch (error) {
    return {
      testName: '增强JSON配置功能',
      success: false,
      message: 'JSON配置功能测试异常',
      details: error
    }
  }
}

async function testEnhancedHttpConfig(): Promise<ValidationResult> {
  try {
    const enhancedHttpConfig: EnhancedHttpDataItemConfig = {
      url: 'https://api.iot-platform.com/devices/{{deviceId}}/data',
      method: 'GET',
      headers: [
        {
          key: 'Authorization',
          value: 'Bearer {{accessToken}}',
          enabled: true,
          isDynamic: true,
          dynamicName: 'accessToken',
          exampleValue: 'Bearer eyJhbGciOiJIUzI1NiIs...'
        },
        {
          key: 'Content-Type',
          value: 'application/json',
          enabled: true,
          isDynamic: false
        },
        {
          key: 'X-Debug-Mode',
          value: 'true',
          enabled: false
        }
      ],
      params: [
        {
          key: 'deviceId',
          value: 'device001',
          enabled: true,
          isDynamic: true,
          dynamicName: 'deviceId',
          exampleValue: 'device123'
        },
        {
          key: 'format',
          value: 'json',
          enabled: true,
          isDynamic: false
        }
      ],
      timeout: 10000,
      retry: {
        maxRetries: 3,
        retryDelay: 2000
      }
    }

    // 验证HTTP配置结构
    const hasTemplateParams = enhancedHttpConfig.url.includes('{{deviceId}}')
    const hasDynamicHeaders = enhancedHttpConfig.headers.some(h => h.isDynamic)
    const hasDynamicParams = enhancedHttpConfig.params.some(p => p.isDynamic)
    const hasRetryConfig = enhancedHttpConfig.retry?.maxRetries === 3

    const isValid = hasTemplateParams && hasDynamicHeaders && hasDynamicParams && hasRetryConfig

    return {
      testName: '增强HTTP配置数组格式',
      success: isValid,
      message: isValid ? 'HTTP数组格式和动态参数支持正常' : 'HTTP配置结构验证失败',
      details: isValid
        ? undefined
        : {
            hasTemplateParams,
            hasDynamicHeaders,
            hasDynamicParams,
            hasRetryConfig
          }
    }
  } catch (error) {
    return {
      testName: '增强HTTP配置数组格式',
      success: false,
      message: 'HTTP配置测试异常',
      details: error
    }
  }
}

async function testDynamicParameterSystem(): Promise<ValidationResult> {
  try {
    const dynamicParams: DynamicParam[] = [
      {
        name: 'deviceId',
        type: 'string',
        currentValue: 'device001',
        exampleValue: 'device123',
        description: '设备唯一标识符',
        required: true,
        validation: {
          pattern: '^device\\d{3}$',
          min: 6,
          max: 10
        }
      },
      {
        name: 'interval',
        type: 'number',
        currentValue: 30,
        exampleValue: 60,
        description: '数据采集间隔（秒）',
        required: false,
        validation: {
          min: 10,
          max: 3600
        }
      }
    ]

    // 验证动态参数结构
    const deviceParam = dynamicParams.find(p => p.name === 'deviceId')
    const intervalParam = dynamicParams.find(p => p.name === 'interval')

    const isValid =
      deviceParam?.type === 'string' &&
      deviceParam?.required === true &&
      deviceParam?.validation?.pattern === '^device\\d{3}$' &&
      intervalParam?.type === 'number' &&
      intervalParam?.validation?.min === 10

    return {
      testName: '动态参数系统',
      success: isValid,
      message: isValid ? '动态参数定义和验证规则正常' : '动态参数结构验证失败',
      details: isValid ? undefined : dynamicParams
    }
  } catch (error) {
    return {
      testName: '动态参数系统',
      success: false,
      message: '动态参数系统测试异常',
      details: error
    }
  }
}

async function testVersionDetection(): Promise<ValidationResult> {
  try {
    const adapter = createConfigurationAdapter()

    // 测试v1.0配置检测
    const v1Config: LegacyDataSourceConfiguration = {
      componentId: 'version-test-v1',
      dataSources: [
        {
          sourceId: 'test-source',
          dataItems: [
            {
              item: { type: 'json', config: { jsonString: '{}' } },
              processing: {}
            }
          ],
          mergeStrategy: { type: 'object' }
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    // 测试v2.0配置检测
    const v2Config: EnhancedDataSourceConfiguration = {
      ...v1Config,
      version: '2.0.0',
      dynamicParams: [],
      enhancedFeatures: DEFAULT_ENHANCED_FEATURES
    }

    const v1Detection = adapter.detectVersion(v1Config)
    const v2Detection = adapter.detectVersion(v2Config)

    const isValid = v1Detection === 'v1.0' && v2Detection === 'v2.0'

    return {
      testName: '配置版本检测',
      success: isValid,
      message: isValid ? '版本检测功能正常' : '版本检测结果错误',
      details: isValid ? undefined : { v1Detection, v2Detection }
    }
  } catch (error) {
    return {
      testName: '配置版本检测',
      success: false,
      message: '版本检测测试异常',
      details: error
    }
  }
}

async function testV1ToV2Upgrade(): Promise<ValidationResult> {
  try {
    const v1Config: LegacyDataSourceConfiguration = {
      componentId: 'upgrade-test',
      dataSources: [
        {
          sourceId: 'sensor-data',
          dataItems: [
            {
              item: {
                type: 'json',
                config: { jsonString: '{"temperature": 25.5, "humidity": 60}' }
              },
              processing: { filterPath: '$.temperature' }
            }
          ],
          mergeStrategy: { type: 'object' }
        }
      ],
      createdAt: 1692000000000,
      updatedAt: 1692000000000
    }

    const v2Config = upgradeToV2(v1Config)

    // 验证升级结果
    const hasVersion = v2Config.version === '2.0.0'
    const hasMetadata = !!v2Config.metadata
    const hasEnhancedFeatures = !!v2Config.enhancedFeatures
    const hasDynamicParams = Array.isArray(v2Config.dynamicParams)

    // 验证数据项升级
    const dataItem = v2Config.dataSources[0].dataItems[0].item as DataItemConfig
    const hasItemId = !!dataItem.id
    const hasItemMetadata = !!dataItem.metadata

    // 验证JSON配置字段重命名
    const jsonConfig = dataItem.config as EnhancedJsonDataItemConfig
    const hasJsonData = !!jsonConfig.jsonData && jsonConfig.jsonData.includes('temperature')

    const isValid =
      hasVersion &&
      hasMetadata &&
      hasEnhancedFeatures &&
      hasDynamicParams &&
      hasItemId &&
      hasItemMetadata &&
      hasJsonData

    return {
      testName: 'v1到v2升级',
      success: isValid,
      message: isValid ? 'v1到v2升级成功' : '升级过程中缺失字段',
      details: isValid
        ? undefined
        : {
            hasVersion,
            hasMetadata,
            hasEnhancedFeatures,
            hasDynamicParams,
            hasItemId,
            hasItemMetadata,
            hasJsonData
          }
    }
  } catch (error) {
    return {
      testName: 'v1到v2升级',
      success: false,
      message: 'v1到v2升级异常',
      details: error
    }
  }
}

async function testV2ToV1Downgrade(): Promise<ValidationResult> {
  try {
    const v2Config: EnhancedDataSourceConfiguration = {
      componentId: 'downgrade-test',
      version: '2.0.0',
      dataSources: [
        {
          sourceId: 'api-source',
          dataItems: [
            {
              item: {
                type: 'json',
                id: 'json-item-1',
                config: {
                  jsonData: '{"sensors": ["temp", "humidity"]}',
                  validation: { enableFormat: true, enableStructure: false },
                  preprocessing: { removeComments: true, formatOutput: false }
                },
                metadata: { displayName: '传感器数据', enabled: true }
              },
              processing: { filterPath: '$.sensors' }
            }
          ],
          mergeStrategy: { type: 'array' }
        }
      ],
      dynamicParams: [],
      enhancedFeatures: DEFAULT_ENHANCED_FEATURES,
      metadata: { name: '测试配置' },
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    const v1Config = downgradeToV1(v2Config)

    // 验证降级结果
    const basicFieldsPreserved = v1Config.componentId === 'downgrade-test' && v1Config.dataSources.length === 1

    const v2FieldsRemoved =
      !(v1Config as any).version && !(v1Config as any).dynamicParams && !(v1Config as any).enhancedFeatures

    // 验证数据项降级
    const dataItem = v1Config.dataSources[0].dataItems[0].item
    const jsonConfig = dataItem.config as LegacyJsonDataItemConfig
    const hasJsonString = jsonConfig.jsonString === '{"sensors": ["temp", "humidity"]}'

    const isValid = basicFieldsPreserved && v2FieldsRemoved && hasJsonString

    return {
      testName: 'v2到v1降级',
      success: isValid,
      message: isValid ? 'v2到v1降级成功' : '降级过程中字段处理错误',
      details: isValid
        ? undefined
        : {
            basicFieldsPreserved,
            v2FieldsRemoved,
            hasJsonString
          }
    }
  } catch (error) {
    return {
      testName: 'v2到v1降级',
      success: false,
      message: 'v2到v1降级异常',
      details: error
    }
  }
}

async function testRoundTripConsistency(): Promise<ValidationResult> {
  try {
    const adapter = createConfigurationAdapter()

    const originalV1: LegacyDataSourceConfiguration = {
      componentId: 'roundtrip-test',
      dataSources: [
        {
          sourceId: 'test-source',
          dataItems: [
            {
              item: { type: 'json', config: { jsonString: '{"test": "consistency"}' } },
              processing: { filterPath: '$.test', defaultValue: {} }
            }
          ],
          mergeStrategy: { type: 'object' }
        }
      ],
      createdAt: 1692000000000,
      updatedAt: 1692000000000
    }

    // 往返转换: v1 -> v2 -> v1
    const upgradedV2 = adapter.upgradeV1ToV2(originalV1)
    const downgradedV1 = adapter.downgradeV2ToV1(upgradedV2)

    // 验证关键字段一致性
    const componentIdConsistent = originalV1.componentId === downgradedV1.componentId
    const dataSourceConsistent =
      originalV1.dataSources.length === downgradedV1.dataSources.length &&
      originalV1.dataSources[0].sourceId === downgradedV1.dataSources[0].sourceId

    const originalItem = originalV1.dataSources[0].dataItems[0].item
    const convertedItem = downgradedV1.dataSources[0].dataItems[0].item
    const itemTypeConsistent = originalItem.type === convertedItem.type

    const originalJsonConfig = originalItem.config as LegacyJsonDataItemConfig
    const convertedJsonConfig = convertedItem.config as LegacyJsonDataItemConfig
    const configContentConsistent = originalJsonConfig.jsonString === convertedJsonConfig.jsonString

    // 使用适配器内置的验证功能
    const validation = adapter.validateConversion(originalV1, downgradedV1)

    const isValid =
      componentIdConsistent && dataSourceConsistent && itemTypeConsistent && configContentConsistent && validation.valid

    return {
      testName: '往返转换一致性',
      success: isValid,
      message: isValid ? '往返转换保持一致性' : '往返转换出现数据差异',
      details: isValid
        ? undefined
        : {
            componentIdConsistent,
            dataSourceConsistent,
            itemTypeConsistent,
            configContentConsistent,
            validationIssues: validation.issues
          }
    }
  } catch (error) {
    return {
      testName: '往返转换一致性',
      success: false,
      message: '往返转换一致性测试异常',
      details: error
    }
  }
}

async function testBatchConversion(): Promise<ValidationResult> {
  try {
    const adapter = createConfigurationAdapter()

    const batchConfigs: LegacyDataSourceConfiguration[] = [
      {
        componentId: 'batch-test-1',
        dataSources: [{ sourceId: 'source1', dataItems: [], mergeStrategy: { type: 'object' } }],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        componentId: 'batch-test-2',
        dataSources: [{ sourceId: 'source2', dataItems: [], mergeStrategy: { type: 'array' } }],
        createdAt: Date.now(),
        updatedAt: Date.now()
      },
      {
        componentId: 'batch-test-3',
        dataSources: [{ sourceId: 'source3', dataItems: [], mergeStrategy: { type: 'script', script: 'return {}' } }],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ]

    const results = adapter.batchConvert(batchConfigs, 'v2.0')

    // 验证批量转换结果
    const allSuccessful = results.every(r => r.success)
    const correctCount = results.length === 3
    const allHaveVersion = results.every(r => r.data?.version === '2.0.0')

    const isValid = allSuccessful && correctCount && allHaveVersion

    return {
      testName: '批量转换功能',
      success: isValid,
      message: isValid ? '批量转换功能正常' : '批量转换出现失败',
      details: isValid
        ? undefined
        : {
            successCount: results.filter(r => r.success).length,
            totalCount: results.length,
            results
          }
    }
  } catch (error) {
    return {
      testName: '批量转换功能',
      success: false,
      message: '批量转换功能测试异常',
      details: error
    }
  }
}

// 全局暴露验证函数
if (typeof window !== 'undefined') {
  ;(window as any).validateEnhancedTypeSystem = validateEnhancedTypeSystem

  console.log('💡 增强版类型系统验证函数已注册到 window 对象:')
  console.log('   - window.validateEnhancedTypeSystem() - 运行完整类型系统验证')
}
