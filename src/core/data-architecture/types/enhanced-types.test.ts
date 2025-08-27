/**
 * 增强版类型系统单元测试
 * 验证泛型配置类型和适配器的正确性
 */

import { describe, test, expect } from 'vitest'
import {
  ConfigurationAdapter,
  createConfigurationAdapter,
  detectConfigVersion,
  upgradeToV2,
  downgradeToV1
} from '../adapters'
import type {
  DataItemConfig,
  EnhancedJsonDataItemConfig,
  EnhancedHttpDataItemConfig,
  EnhancedDataSourceConfiguration,
  DynamicParam
} from './enhanced-types'
import { DEFAULT_ENHANCED_FEATURES } from './enhanced-types'
import type {
  DataSourceConfiguration as LegacyDataSourceConfiguration,
  JsonDataItemConfig as LegacyJsonDataItemConfig,
  HttpDataItemConfig as LegacyHttpDataItemConfig
} from '../executors'

describe('增强版类型系统测试', () => {
  // ==================== 类型系统基础测试 ====================

  test('泛型DataItemConfig类型检查', () => {
    const jsonDataItem: DataItemConfig<EnhancedJsonDataItemConfig> = {
      type: 'json',
      id: 'json-test-1',
      config: {
        jsonData: '{"test": "data"}',
        validation: {
          enableFormat: true,
          enableStructure: false
        }
      },
      metadata: {
        displayName: 'JSON测试数据',
        enabled: true
      }
    }

    expect(jsonDataItem.type).toBe('json')
    expect(jsonDataItem.id).toBe('json-test-1')
    expect(jsonDataItem.config.jsonData).toBe('{"test": "data"}')
    expect(jsonDataItem.metadata?.displayName).toBe('JSON测试数据')
  })

  test('增强版HTTP配置类型检查', () => {
    const httpConfig: EnhancedHttpDataItemConfig = {
      url: 'https://api.example.com/data?id={{deviceId}}',
      method: 'GET',
      headers: [
        {
          key: 'Authorization',
          value: 'Bearer {{token}}',
          enabled: true,
          isDynamic: true,
          dynamicName: 'token'
        }
      ],
      params: [
        {
          key: 'deviceId',
          value: 'device001',
          enabled: true,
          isDynamic: true,
          dynamicName: 'deviceId'
        }
      ],
      timeout: 5000,
      retry: {
        maxRetries: 3,
        retryDelay: 1000
      }
    }

    expect(httpConfig.url).toContain('{{deviceId}}')
    expect(httpConfig.headers).toHaveLength(1)
    expect(httpConfig.params).toHaveLength(1)
    expect(httpConfig.headers[0].isDynamic).toBe(true)
    expect(httpConfig.params[0].isDynamic).toBe(true)
  })

  test('动态参数类型检查', () => {
    const dynamicParam: DynamicParam = {
      name: 'deviceId',
      type: 'string',
      currentValue: 'device001',
      exampleValue: 'device123',
      description: '设备ID参数',
      required: true,
      validation: {
        pattern: '^device\\d{3}$',
        min: 6,
        max: 10
      }
    }

    expect(dynamicParam.name).toBe('deviceId')
    expect(dynamicParam.type).toBe('string')
    expect(dynamicParam.required).toBe(true)
    expect(dynamicParam.validation?.pattern).toBe('^device\\d{3}$')
  })

  // ==================== 配置适配器测试 ====================

  describe('配置版本检测', () => {
    const adapter = createConfigurationAdapter()

    test('检测v1.0配置', () => {
      const v1Config: LegacyDataSourceConfiguration = {
        componentId: 'test-component',
        dataSources: [
          {
            sourceId: 'test-source',
            dataItems: [
              {
                item: {
                  type: 'json',
                  config: { jsonString: '{"test": true}' }
                },
                processing: {}
              }
            ],
            mergeStrategy: { type: 'object' }
          }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      expect(adapter.detectVersion(v1Config)).toBe('v1.0')
      expect(detectConfigVersion(v1Config)).toBe('v1.0')
    })

    test('检测v2.0配置', () => {
      const v2Config: EnhancedDataSourceConfiguration = {
        componentId: 'test-component',
        version: '2.0.0',
        dataSources: [
          {
            sourceId: 'test-source',
            dataItems: [
              {
                item: {
                  type: 'json',
                  id: 'json-item-1',
                  config: { jsonData: '{"test": true}' }
                },
                processing: {}
              }
            ],
            mergeStrategy: { type: 'object' }
          }
        ],
        dynamicParams: [],
        enhancedFeatures: DEFAULT_ENHANCED_FEATURES,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      expect(adapter.detectVersion(v2Config)).toBe('v2.0')
      expect(detectConfigVersion(v2Config)).toBe('v2.0')
    })
  })

  describe('配置升级测试', () => {
    test('v1升级到v2（JSON数据项）', () => {
      const v1Config: LegacyDataSourceConfiguration = {
        componentId: 'test-component',
        dataSources: [
          {
            sourceId: 'json-source',
            dataItems: [
              {
                item: {
                  type: 'json',
                  config: { jsonString: '{"sensor": "temperature", "value": 25.6}' }
                },
                processing: {
                  filterPath: '$.sensor',
                  defaultValue: {}
                }
              }
            ],
            mergeStrategy: { type: 'object' }
          }
        ],
        createdAt: 1692000000000,
        updatedAt: 1692000000000
      }

      const v2Config = upgradeToV2(v1Config)

      // 检查基本字段保持不变
      expect(v2Config.componentId).toBe('test-component')
      expect(v2Config.dataSources).toHaveLength(1)
      expect(v2Config.createdAt).toBe(1692000000000)

      // 检查新增字段
      expect(v2Config.version).toBe('2.0.0')
      expect(v2Config.dynamicParams).toEqual([])
      expect(v2Config.enhancedFeatures).toBeDefined()
      expect(v2Config.metadata).toBeDefined()

      // 检查数据项升级
      const dataItem = v2Config.dataSources[0].dataItems[0].item as DataItemConfig
      expect(dataItem.id).toBeDefined()
      expect(dataItem.type).toBe('json')
      expect(dataItem.metadata).toBeDefined()

      // 检查JSON配置字段重命名
      const jsonConfig = dataItem.config as EnhancedJsonDataItemConfig
      expect(jsonConfig.jsonData).toBe('{"sensor": "temperature", "value": 25.6}')
      expect(jsonConfig.validation).toBeDefined()
    })

    test('v1升级到v2（HTTP数据项）', () => {
      const v1Config: LegacyDataSourceConfiguration = {
        componentId: 'test-component',
        dataSources: [
          {
            sourceId: 'api-source',
            dataItems: [
              {
                item: {
                  type: 'http',
                  config: {
                    url: 'https://api.example.com/sensors',
                    method: 'GET',
                    headers: {
                      Authorization: 'Bearer token123',
                      'Content-Type': 'application/json'
                    },
                    timeout: 5000
                  }
                },
                processing: {}
              }
            ],
            mergeStrategy: { type: 'array' }
          }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      const v2Config = upgradeToV2(v1Config)
      const dataItem = v2Config.dataSources[0].dataItems[0].item as DataItemConfig
      const httpConfig = dataItem.config as EnhancedHttpDataItemConfig

      // 检查HTTP配置升级
      expect(httpConfig.url).toBe('https://api.example.com/sensors')
      expect(httpConfig.method).toBe('GET')
      expect(httpConfig.headers).toHaveLength(2)
      expect(httpConfig.params).toEqual([])
      expect(httpConfig.retry).toBeDefined()

      // 检查headers格式转换
      expect(httpConfig.headers[0].key).toBe('Authorization')
      expect(httpConfig.headers[0].value).toBe('Bearer token123')
      expect(httpConfig.headers[0].enabled).toBe(true)
      expect(httpConfig.headers[1].key).toBe('Content-Type')
      expect(httpConfig.headers[1].value).toBe('application/json')
    })
  })

  describe('配置降级测试', () => {
    test('v2降级到v1（JSON数据项）', () => {
      const v2Config: EnhancedDataSourceConfiguration = {
        componentId: 'test-component',
        version: '2.0.0',
        dataSources: [
          {
            sourceId: 'json-source',
            dataItems: [
              {
                item: {
                  type: 'json',
                  id: 'json-item-1',
                  config: {
                    jsonData: '{"temperature": 26.5}',
                    validation: { enableFormat: true, enableStructure: false },
                    preprocessing: { removeComments: true, formatOutput: false }
                  },
                  metadata: { displayName: '温度传感器数据', enabled: true }
                },
                processing: { filterPath: '$.temperature' }
              }
            ],
            mergeStrategy: { type: 'object' }
          }
        ],
        dynamicParams: [],
        enhancedFeatures: DEFAULT_ENHANCED_FEATURES,
        metadata: {
          name: '温度监控配置',
          description: '温度传感器数据采集配置'
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      const v1Config = downgradeToV1(v2Config)

      // 检查基本字段保持
      expect(v1Config.componentId).toBe('test-component')
      expect(v1Config.dataSources).toHaveLength(1)

      // 检查数据项降级
      const dataItem = v1Config.dataSources[0].dataItems[0].item
      expect(dataItem.type).toBe('json')

      const jsonConfig = dataItem.config as LegacyJsonDataItemConfig
      expect(jsonConfig.jsonString).toBe('{"temperature": 26.5}')

      // 检查v2字段被移除
      expect((v1Config as any).version).toBeUndefined()
      expect((v1Config as any).dynamicParams).toBeUndefined()
      expect((v1Config as any).enhancedFeatures).toBeUndefined()
    })

    test('v2降级到v1（HTTP数据项）', () => {
      const v2Config: EnhancedDataSourceConfiguration = {
        componentId: 'test-component',
        version: '2.0.0',
        dataSources: [
          {
            sourceId: 'api-source',
            dataItems: [
              {
                item: {
                  type: 'http',
                  id: 'http-item-1',
                  config: {
                    url: 'https://api.example.com/data',
                    method: 'POST',
                    headers: [
                      { key: 'Authorization', value: 'Bearer token', enabled: true },
                      { key: 'Content-Type', value: 'application/json', enabled: true },
                      { key: 'X-Debug', value: 'true', enabled: false }
                    ],
                    params: [{ key: 'format', value: 'json', enabled: true }],
                    body: { type: 'json', content: { query: 'test' } },
                    timeout: 10000,
                    retry: { maxRetries: 3, retryDelay: 1000 }
                  }
                },
                processing: {}
              }
            ],
            mergeStrategy: { type: 'object' }
          }
        ],
        dynamicParams: [],
        enhancedFeatures: DEFAULT_ENHANCED_FEATURES,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      const v1Config = downgradeToV1(v2Config)
      const dataItem = v1Config.dataSources[0].dataItems[0].item
      const httpConfig = dataItem.config as LegacyHttpDataItemConfig

      // 检查HTTP配置降级
      expect(httpConfig.url).toBe('https://api.example.com/data')
      expect(httpConfig.method).toBe('POST')
      expect(httpConfig.timeout).toBe(10000)
      expect(httpConfig.body).toEqual({ query: 'test' })

      // 检查headers格式转换（只包含enabled的headers）
      expect(httpConfig.headers).toEqual({
        Authorization: 'Bearer token',
        'Content-Type': 'application/json'
        // X-Debug被过滤掉因为enabled: false
      })
    })
  })

  describe('转换一致性验证', () => {
    test('往返转换一致性', () => {
      const adapter = createConfigurationAdapter()

      const originalV1: LegacyDataSourceConfiguration = {
        componentId: 'consistency-test',
        dataSources: [
          {
            sourceId: 'test-source',
            dataItems: [
              {
                item: {
                  type: 'json',
                  config: { jsonString: '{"test": "data"}' }
                },
                processing: { filterPath: '$.test' }
              }
            ],
            mergeStrategy: { type: 'object' }
          }
        ],
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      // v1 -> v2 -> v1 往返转换
      const upgradedV2 = adapter.upgradeV1ToV2(originalV1)
      const downgradedV1 = adapter.downgradeV2ToV1(upgradedV2)

      // 验证核心字段一致性
      expect(downgradedV1.componentId).toBe(originalV1.componentId)
      expect(downgradedV1.dataSources.length).toBe(originalV1.dataSources.length)
      expect(downgradedV1.dataSources[0].sourceId).toBe(originalV1.dataSources[0].sourceId)

      // 验证数据项类型和配置一致性
      const originalItem = originalV1.dataSources[0].dataItems[0].item
      const convertedItem = downgradedV1.dataSources[0].dataItems[0].item
      expect(convertedItem.type).toBe(originalItem.type)

      const originalJsonConfig = originalItem.config as LegacyJsonDataItemConfig
      const convertedJsonConfig = convertedItem.config as LegacyJsonDataItemConfig
      expect(convertedJsonConfig.jsonString).toBe(originalJsonConfig.jsonString)
    })

    test('使用适配器验证转换一致性', () => {
      const adapter = createConfigurationAdapter()

      const original: LegacyDataSourceConfiguration = {
        componentId: 'validation-test',
        dataSources: [
          {
            sourceId: 'validation-source',
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

      const upgraded = adapter.upgradeV1ToV2(original)
      const downgraded = adapter.downgradeV2ToV1(upgraded)

      const validation = adapter.validateConversion(original, downgraded)

      expect(validation.valid).toBe(true)
      expect(validation.issues).toHaveLength(0)
    })
  })

  describe('批量转换测试', () => {
    test('批量转换多个配置', () => {
      const adapter = createConfigurationAdapter()

      const configs: LegacyDataSourceConfiguration[] = [
        {
          componentId: 'batch-test-1',
          dataSources: [{ sourceId: 'test1', dataItems: [], mergeStrategy: { type: 'object' } }],
          createdAt: Date.now(),
          updatedAt: Date.now()
        },
        {
          componentId: 'batch-test-2',
          dataSources: [{ sourceId: 'test2', dataItems: [], mergeStrategy: { type: 'array' } }],
          createdAt: Date.now(),
          updatedAt: Date.now()
        }
      ]

      const results = adapter.batchConvert(configs, 'v2.0')

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
      expect(results[0].data?.version).toBe('2.0.0')
      expect(results[1].data?.version).toBe('2.0.0')
    })
  })
})
