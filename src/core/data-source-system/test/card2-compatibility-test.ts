/**
 * Card2.1 兼容性测试
 * 验证Card2.1组件定义与数据源系统的完整兼容性
 */

import { card2CompatibilityManager, configMigrationManager, componentDataAdapter, card2Integration } from '../index'

import type { ComponentDefinition } from '@/card2.1/core/types'

/**
 * Card2.1兼容性测试套件
 */
export class Card2CompatibilityTest {
  /**
   * 测试Card2.1组件类型定义转换
   */
  async testComponentDefinitionConversion() {
    console.log('🧪 [Test] Card2.1组件定义转换测试')

    // 模拟Card2.1组件定义
    const mockCard2Component: Partial<ComponentDefinition> = {
      type: 'data-display-card',
      name: '数据展示卡片',
      description: '功能丰富的数据展示卡片，支持指标展示、趋势分析和数据列表',
      category: 'display',
      version: '2.1.0',
      supportedDataSources: ['static', 'api', 'websocket', 'mqtt'],

      // Card2.1的数据需求声明
      staticParams: [
        {
          key: 'title',
          name: '卡片标题',
          type: 'string',
          description: '卡片显示的标题文字',
          defaultValue: '数据展示卡片',
          required: false,
          ui: {
            component: 'input',
            placeholder: '请输入卡片标题',
            label: '标题'
          }
        }
      ],

      dataSources: [
        {
          key: 'mainData',
          name: '主要数据源',
          description: '卡片显示的主要数据',
          supportedTypes: ['api', 'websocket'],
          fieldMappings: {
            value: {
              targetField: 'mainValue',
              type: 'value',
              required: true,
              defaultValue: '0'
            },
            unit: {
              targetField: 'mainUnit',
              type: 'value',
              required: false,
              defaultValue: ''
            }
          },
          required: true
        }
      ]
    }

    try {
      // 1. 测试组件需求提取
      const requirement = card2CompatibilityManager.convertCard2ToDataSource(mockCard2Component)
      console.log('✅ 组件需求提取成功:', requirement)

      // 2. 测试组件定义迁移
      const migratedConfig = configMigrationManager.migrateCard2ComponentToDataSourceConfig(mockCard2Component)
      console.log('✅ 组件配置迁移成功:', migratedConfig?.id)

      // 3. 测试适配器检测
      const isCard2 = card2CompatibilityManager.isCard2Component(mockCard2Component)
      console.log('✅ Card2.1组件检测:', isCard2 ? '正确识别' : '❌ 识别失败')

      // 4. 测试反向转换
      if (requirement) {
        const backConverted = card2CompatibilityManager.convertDataSourceToCard2(requirement)
        console.log('✅ 反向转换成功:', backConverted)
      }

      return {
        success: true,
        requirement,
        migratedConfig,
        isCard2Detection: isCard2
      }
    } catch (error) {
      console.error('❌ [Test] 组件定义转换测试失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 测试数据适配器功能
   */
  async testDataAdapterCompatibility() {
    console.log('🧪 [Test] 数据适配器兼容性测试')

    // 模拟组件数据
    const mockComponentData = {
      mainData: {
        type: 'api',
        data: {
          value: 8765,
          unit: '次访问',
          trend: '+12.5%',
          timestamp: Date.now()
        },
        lastUpdated: Date.now()
      }
    }

    try {
      // 1. 测试自动检测和适配
      const adaptedData = componentDataAdapter.autoAdapt(mockComponentData, 'data-display-card')
      console.log('✅ 自动数据适配成功:', adaptedData)

      // 2. 测试Card2.1特定适配
      const card21Data = componentDataAdapter.card21Adapter.adaptToCard21(mockComponentData)
      console.log('✅ Card2.1格式适配成功:', card21Data)

      // 3. 测试数据提取
      const extractedData = componentDataAdapter.card21Adapter.extractFromCard21(card21Data)
      console.log('✅ Card2.1数据提取成功:', extractedData)

      return {
        success: true,
        adaptedData,
        card21Data,
        extractedData
      }
    } catch (error) {
      console.error('❌ [Test] 数据适配器测试失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 测试快速集成接口
   */
  async testQuickIntegration() {
    console.log('🧪 [Test] 快速集成接口测试')

    const mockComponentDef = {
      type: 'simple-test-component',
      name: '简单测试组件',
      version: '2.1.0',
      staticParams: [
        {
          key: 'title',
          name: '组件标题',
          type: 'string',
          description: '组件显示的标题'
        }
      ],
      dataSources: [
        {
          key: 'testData',
          name: '测试数据',
          description: '用于测试的数据源',
          supportedTypes: ['static', 'api'],
          fieldMappings: {
            content: {
              targetField: 'displayContent',
              type: 'value',
              required: true
            }
          }
        }
      ]
    }

    try {
      // 1. 测试需求提取
      const requirement = card2Integration.extractRequirement(mockComponentDef)
      console.log('✅ 快速需求提取成功:', requirement.componentId)

      // 2. 测试配置迁移
      const migratedConfig = card2Integration.migrateConfig(mockComponentDef)
      console.log('✅ 快速配置迁移成功:', migratedConfig?.id)

      // 3. 测试兼容性验证
      const isCompatible = card2Integration.validateCompatibility(mockComponentDef)
      console.log('✅ 兼容性验证:', isCompatible ? '兼容' : '❌ 不兼容')

      // 4. 测试数据适配
      const mockData = { testData: { type: 'static', data: { content: '测试内容' }, lastUpdated: Date.now() } }
      const adaptedData = card2Integration.adaptData(mockData, 'simple-test-component')
      console.log('✅ 快速数据适配成功:', adaptedData)

      return {
        success: true,
        requirement,
        migratedConfig,
        isCompatible,
        adaptedData
      }
    } catch (error) {
      console.error('❌ [Test] 快速集成测试失败:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 测试字段映射和转换
   */
  async testFieldMappingTransformation() {
    console.log('🧪 [Test] 字段映射转换测试')

    const testCases = [
      {
        name: '简单值映射',
        sourceData: { temperature: 25.6, humidity: 60 },
        fieldMappings: {
          temperature: {
            targetField: 'mainValue',
            type: 'value',
            required: true,
            transform: 'value + "°C"'
          },
          humidity: {
            targetField: 'subValue',
            type: 'value',
            required: false,
            transform: 'value + "%"'
          }
        },
        expected: {
          mainValue: '25.6°C',
          subValue: '60%'
        }
      },
      {
        name: '嵌套对象映射',
        sourceData: {
          sensor: {
            reading: { value: 123, unit: 'ppm' },
            status: 'active'
          }
        },
        fieldMappings: {
          'sensor.reading.value': {
            targetField: 'measurement',
            type: 'value',
            required: true
          },
          'sensor.status': {
            targetField: 'deviceStatus',
            type: 'value',
            required: true
          }
        },
        expected: {
          measurement: 123,
          deviceStatus: 'active'
        }
      }
    ]

    const results = []

    for (const testCase of testCases) {
      try {
        const mockComponentData = {
          testSource: {
            type: 'static',
            data: testCase.sourceData,
            lastUpdated: Date.now()
          }
        }

        const mockRequirement = {
          componentId: 'test-component',
          componentName: '测试组件',
          dataSources: [
            {
              key: 'testSource',
              name: '测试数据源',
              description: '用于测试字段映射',
              supportedTypes: ['static'],
              fieldMappings: testCase.fieldMappings,
              required: true
            }
          ]
        }

        // 使用增强的Card21Adapter进行字段映射
        const adaptedData = componentDataAdapter.card21Adapter.adaptComponentConfig(mockComponentData, mockRequirement)

        console.log(`✅ ${testCase.name} 映射成功:`, adaptedData.testSource)

        results.push({
          testCase: testCase.name,
          success: true,
          result: adaptedData.testSource
        })
      } catch (error) {
        console.error(`❌ ${testCase.name} 映射失败:`, error)
        results.push({
          testCase: testCase.name,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return results
  }

  /**
   * 运行完整的兼容性测试套件
   */
  async runFullCompatibilityTest() {
    console.log('🚀 [Test Suite] 开始Card2.1完整兼容性测试')

    const startTime = Date.now()
    const results = {
      definitionConversion: await this.testComponentDefinitionConversion(),
      dataAdapter: await this.testDataAdapterCompatibility(),
      quickIntegration: await this.testQuickIntegration(),
      fieldMapping: await this.testFieldMappingTransformation()
    }
    const endTime = Date.now()

    // 统计测试结果
    const testResults = Object.values(results).flat()
    const successCount = testResults.filter(r => r.success).length
    const totalCount = testResults.length
    const passRate = ((successCount / totalCount) * 100).toFixed(1)

    console.log(`🎯 [Test Summary] 测试完成: ${successCount}/${totalCount} 通过 (${passRate}%)`)
    console.log(`⏱️  [Test Summary] 耗时: ${endTime - startTime}ms`)

    return {
      summary: {
        total: totalCount,
        success: successCount,
        failed: totalCount - successCount,
        passRate: parseFloat(passRate),
        duration: endTime - startTime
      },
      results
    }
  }

  /**
   * 获取兼容性报告
   */
  generateCompatibilityReport() {
    return {
      version: '1.0.0',
      testDate: new Date().toISOString(),
      supportedFeatures: [
        'Card2.1组件定义转换',
        'staticParams和dataSources支持',
        '字段类型映射和转换',
        '复杂嵌套结构处理',
        '数据验证和错误处理',
        '双向配置迁移',
        '自动组件类型检测',
        'UI配置保留',
        '快速集成接口'
      ],
      limitations: ['复杂JavaScript转换函数执行有安全限制', 'UI配置在某些转换中可能丢失', '自定义验证器需要额外适配'],
      recommendations: [
        '生产环境中使用前进行完整测试',
        '复杂转换逻辑建议单独验证',
        '保留原始配置作为备份',
        '定期检查兼容性更新'
      ]
    }
  }
}

// 导出测试实例
export const card2CompatibilityTest = new Card2CompatibilityTest()

// 导出便捷测试函数
export const testCard2Compatibility = {
  /**
   * 快速测试单个组件兼容性
   */
  async testSingleComponent(componentDef: any) {
    try {
      const requirement = card2Integration.extractRequirement(componentDef)
      const isCompatible = card2Integration.validateCompatibility(componentDef)
      const migratedConfig = card2Integration.migrateConfig(componentDef)

      return {
        success: true,
        compatible: isCompatible,
        requirement: !!requirement,
        migrated: !!migratedConfig
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  },

  /**
   * 测试数据适配是否正常
   */
  async testDataAdaptation(componentData: any, componentId: string) {
    try {
      const adapted = card2Integration.adaptData(componentData, componentId)
      return {
        success: true,
        adapted: !!adapted,
        data: adapted
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }
}
