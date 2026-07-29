/**
 * 新配置管理系统测试脚本
 * 验证ConfigurationStateManager和ConfigurationIntegrationBridge的工作效果
 *
 * 测试场景：
 * 1. 模拟添加第二个数据项的场景（原本会导致无限循环）
 * 2. 验证内容哈希去重机制
 * 3. 验证循环检测机制
 * 4. 验证配置版本控制
 */

import { configurationStateManager } from '@/components/visual-editor/configuration/ConfigurationStateManager'
import { configurationIntegrationBridge } from '@/components/visual-editor/configuration/ConfigurationIntegrationBridge'
import type { WidgetConfiguration } from '@/components/visual-editor/configuration/types'

/**
 * 测试配置内容哈希去重机制
 */
async function testContentHashDeduplication() {
  const testComponentId = 'test-component-hash'

  // 初始化组件配置
  configurationStateManager.initializeConfiguration(testComponentId)

  const testConfig: WidgetConfiguration = {
    base: { showTitle: true, title: 'Test Component' },
    component: { type: 'test' },
    dataSource: {
      componentId: testComponentId,
      dataSources: [
        {
          sourceId: 'dataSource1',
          dataItems: [
            {
              item: { type: 'json', config: { jsonString: '{"test": "data1"}' } },
              processing: { filterPath: '$' }
            }
          ],
          mergeStrategy: { type: 'object' }
        }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    interaction: {},
    metadata: {
      version: '1.0.0',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
  }

  // 第一次设置配置
  const result1 = configurationStateManager.setConfiguration(testComponentId, testConfig, 'user')

  // 第二次设置相同配置（应该被去重）
  const result2 = configurationStateManager.setConfiguration(testComponentId, testConfig, 'user')

  // 第三次设置稍微不同的配置
  const modifiedConfig = {
    ...testConfig,
    base: { ...testConfig.base, title: 'Modified Test Component' }
  }
  const result3 = configurationStateManager.setConfiguration(testComponentId, modifiedConfig, 'user')

  // 获取配置版本信息
  const version = configurationStateManager.getConfigurationVersion(testComponentId)
}

/**
 * 测试配置分节更新的循环检测
 */
async function testSectionUpdateCircularDetection() {
  const testComponentId = 'test-component-circular'

  // 初始化组件配置
  configurationStateManager.initializeConfiguration(testComponentId)

  const dataSourceConfig = {
    componentId: testComponentId,
    dataSources: [
      {
        sourceId: 'dataSource1',
        dataItems: [
          {
            item: { type: 'json', config: { jsonString: '{"test": "data1"}' } },
            processing: { filterPath: '$' }
          }
        ],
        mergeStrategy: { type: 'object' }
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
  const result1 = configurationStateManager.updateConfigurationSection(
    testComponentId,
    'dataSource',
    dataSourceConfig,
    'user'
  )
  const result2 = configurationStateManager.updateConfigurationSection(
    testComponentId,
    'dataSource',
    dataSourceConfig,
    'user'
  )

  // 模拟快速连续更新（测试循环检测）
  setTimeout(() => {
    const result3 = configurationStateManager.updateConfigurationSection(
      testComponentId,
      'dataSource',
      dataSourceConfig,
      'user'
    )
  }, 0)

  setTimeout(() => {
    const result4 = configurationStateManager.updateConfigurationSection(
      testComponentId,
      'dataSource',
      dataSourceConfig,
      'user'
    )
  }, 0)
}

/**
 * 测试添加第二个数据项的场景（原始问题场景）
 */
async function testAddSecondDataItemScenario() {
  const testComponentId = 'test-component-second-item'

  // 初始化组件配置
  configurationStateManager.initializeConfiguration(testComponentId)

  // 模拟第一个数据项
  const firstItemConfig = {
    componentId: testComponentId,
    dataSources: [
      {
        sourceId: 'dataSource1',
        dataItems: [
          {
            item: { type: 'json', config: { jsonString: '{"test": "data1"}' } },
            processing: { filterPath: '$' }
          }
        ],
        mergeStrategy: { type: 'object' }
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  if (process.env.NODE_ENV === 'development') {
  }
  const result1 = configurationStateManager.updateConfigurationSection(
    testComponentId,
    'dataSource',
    firstItemConfig,
    'user'
  )
  if (process.env.NODE_ENV === 'development') {
  }

  // 等待防抖处理
  await new Promise(resolve => setTimeout(resolve, 100))

  // 模拟第二个数据项（这是原本导致无限循环的场景）
  const secondItemConfig = {
    componentId: testComponentId,
    dataSources: [
      {
        sourceId: 'dataSource1',
        dataItems: [
          {
            item: { type: 'json', config: { jsonString: '{"test": "data1"}' } },
            processing: { filterPath: '$' }
          },
          {
            item: { type: 'json', config: { jsonString: '{"test": "data2"}' } },
            processing: { filterPath: '$' }
          }
        ],
        mergeStrategy: { type: 'object' } // 这里会触发合并策略选择器显示
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  if (process.env.NODE_ENV === 'development') {
  }
  const result2 = configurationStateManager.updateConfigurationSection(
    testComponentId,
    'dataSource',
    secondItemConfig,
    'user'
  )
  if (process.env.NODE_ENV === 'development') {
  }

  // 等待防抖处理
  await new Promise(resolve => setTimeout(resolve, 100))

  // 模拟合并策略更新
  const strategyUpdateConfig = {
    ...secondItemConfig,
    dataSources: [
      {
        ...secondItemConfig.dataSources[0],
        mergeStrategy: { type: 'select', selectedIndex: 0 }
      }
    ]
  }

  if (process.env.NODE_ENV === 'development') {
  }
  const result3 = configurationStateManager.updateConfigurationSection(
    testComponentId,
    'dataSource',
    strategyUpdateConfig,
    'user'
  )
  if (process.env.NODE_ENV === 'development') {
  }

  // 获取最终状态
  const finalConfig = configurationStateManager.getConfiguration(testComponentId)
  const finalVersion = configurationStateManager.getConfigurationVersion(testComponentId)

  if (process.env.NODE_ENV === 'development') {
  }
}

/**
 * 测试配置集成桥接器的兼容性
 */
async function testIntegrationBridgeCompatibility() {
  if (process.env.NODE_ENV === 'development') {
  }

  // 初始化桥接器
  await configurationIntegrationBridge.initialize()

  const testComponentId = 'test-component-bridge'

  // 测试初始化配置
  if (process.env.NODE_ENV === 'development') {
  }
  configurationIntegrationBridge.initializeConfiguration(testComponentId)

  // 测试获取配置
  const config = configurationIntegrationBridge.getConfiguration(testComponentId)
  if (process.env.NODE_ENV === 'development') {
  }

  // 测试更新配置
  const updateConfig = {
    componentId: testComponentId,
    dataSources: [
      {
        sourceId: 'dataSource1',
        dataItems: [
          {
            item: { type: 'json', config: { jsonString: '{"bridge": "test"}' } },
            processing: { filterPath: '$' }
          }
        ],
        mergeStrategy: { type: 'object' }
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  if (process.env.NODE_ENV === 'development') {
  }
  configurationIntegrationBridge.updateConfiguration(testComponentId, 'dataSource', updateConfig)

  // 等待处理
  await new Promise(resolve => setTimeout(resolve, 100))

  const updatedConfig = configurationIntegrationBridge.getConfiguration(testComponentId)
  if (process.env.NODE_ENV === 'development') {
  }
}

/**
 * 主测试函数
 */
export async function runNewConfigSystemTests() {
  try {
    await testContentHashDeduplication()
    await testSectionUpdateCircularDetection()
    await testAddSecondDataItemScenario()
    await testIntegrationBridgeCompatibility()

    if (process.env.NODE_ENV === 'development') {
    }
    if (process.env.NODE_ENV === 'development') {
    }
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

// 在浏览器环境中暴露测试函数
if (typeof window !== 'undefined') {
  ;(window as any).testNewConfigSystem = runNewConfigSystemTests
  if (process.env.NODE_ENV === 'development') {
  }
}
