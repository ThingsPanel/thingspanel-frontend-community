/**
 * SimpleDataBridge 使用示例
 * 展示如何使用简化的数据桥接器替代复杂的ComponentExecutorManager
 */

import { simpleDataBridge, convertToSimpleDataRequirement } from '@/core/data-architecture/interfaces'

/**
 * 示例1：基本使用
 */
export function basicUsageExample() {
  // 1. 注册数据更新回调
  const cleanup = simpleDataBridge.onDataUpdate((componentId, data) => {})

  // 2. 执行组件数据获取
  simpleDataBridge
    .executeComponent({
      componentId: 'test-component-1',
      dataSources: [
        {
          id: 'dataSource1',
          type: 'static',
          config: {
            data: { value: 123, label: '测试数据' }
          }
        },
        {
          id: 'dataSource2',
          type: 'http',
          config: {
            url: 'https://api.example.com/data',
            method: 'GET',
            timeout: 5000
          }
        }
      ]
    })
    .then(result => {
      if (process.env.NODE_ENV === 'development') {
      }
    })
    .catch(error => {
      console.error('❌ 执行失败:', error)
    })

  // 3. 清理资源
  setTimeout(() => {
    cleanup()
    if (process.env.NODE_ENV === 'development') {
    }
  }, 10000)
}

/**
 * 示例2：配置转换
 */
export function configConversionExample() {
  // 模拟来自ConfigurationPanel的复杂配置
  const complexConfig = {
    type: 'data-source-bindings',
    enabled: true,
    dataSourceBindings: {
      dataSource1: {
        rawData: '{"temperature": 25.5, "humidity": 60}'
      },
      dataSource2: {
        rawData: '[{"id": 1, "name": "设备A"}, {"id": 2, "name": "设备B"}]'
      }
    },
    metadata: {
      componentType: 'dual-data-display',
      updatedAt: Date.now()
    }
  }

  // 转换为SimpleDataBridge格式
  const requirement = convertToSimpleDataRequirement('test-component-2', complexConfig)

  if (requirement) {
    if (process.env.NODE_ENV === 'development') {
    }

    // 使用转换后的配置执行数据获取
    simpleDataBridge.executeComponent(requirement).then(result => {})
  } else {
    if (process.env.NODE_ENV === 'development') {
    }
  }
}

/**
 * 示例3：对比SimpleDataBridge vs ComponentExecutorManager
 */
export function comparisonExample() {
  // 统计信息对比
  const stats = simpleDataBridge.getStats()
}

/**
 * 示例4：实际替换ComponentExecutorManager的步骤
 */
export function migrationExample() {
  // 模拟迁移过程
  const legacyConfig = {
    config: {
      dataSourceBindings: {
        sensor1: { rawData: '{"temp": 23}' },
        sensor2: { rawData: '{"humidity": 45}' }
      }
    },
    metadata: { componentType: 'sensor-display' }
  }

  // 转换并执行
  const requirement = convertToSimpleDataRequirement('migrated-component', legacyConfig)
  if (requirement) {
    simpleDataBridge.executeComponent(requirement).then(result => {})
  }
}
