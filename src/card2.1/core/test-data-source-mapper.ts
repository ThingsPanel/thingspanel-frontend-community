/**
 * 数据源映射器测试文件
 * 用于验证通用数据源映射系统的功能
 */

import { ComponentRegistry } from './component-registry'
import { DataSourceMapper } from './data-source-mapper'
import type { ComponentDefinition } from './types'

/**
 * 测试数据源映射器功能
 */
export function testDataSourceMapper(): void {
  // 1. 测试组件注册
  testComponentRegistration()

  // 2. 测试数据源映射
  testDataSourceMapping()

  // 3. 测试验证功能
  testMappingValidation()

  // 4. 测试统计功能
  testMappingStats()
}

/**
 * 测试组件注册功能
 */
function testComponentRegistration(): void {
  // 创建测试组件定义
  const testComponentDefinition: ComponentDefinition = {
    type: 'test-component',
    name: '测试组件',
    description: '用于测试的组件',
    dataSources: {
      dataSource1: {
        type: 'api',
        name: '数据源1',
        required: true
      },
      dataSource2: {
        type: 'static',
        name: '数据源2',
        required: false
      }
    },
    staticParams: {
      title: {
        type: 'string',
        name: '标题',
        default: '默认标题'
      },
      count: {
        type: 'number',
        name: '数量',
        default: 10
      }
    }
  }

  // 注册组件
  ComponentRegistry.register(testComponentDefinition)

  // 验证注册结果
  const registered = ComponentRegistry.has('test-component')
  const definition = ComponentRegistry.get('test-component')
  const dataSourceKeys = ComponentRegistry.getDataSourceKeys('test-component')
  const staticParamKeys = ComponentRegistry.getStaticParamKeys('test-component')
}

/**
 * 测试数据源映射功能
 */
function testDataSourceMapping(): void {
  // 测试场景1: 直接数据源格式
  const executorData1 = {
    dataSource1: { value: 100, label: '数据1' },
    dataSource2: { value: 200, label: '数据2' }
  }

  const result1 = DataSourceMapper.mapDataSources('test-component', executorData1)
  // 测试场景2: main字段格式
  const executorData2 = {
    main: {
      dataSource1: { value: 300, label: '数据3' },
      dataSource2: { value: 400, label: '数据4' }
    }
  }

  const result2 = DataSourceMapper.mapDataSources('test-component', executorData2)
  // 测试场景3: 空数据
  const result3 = DataSourceMapper.mapDataSources('test-component', null)
  // 测试场景4: 未注册组件
  const result4 = DataSourceMapper.mapDataSources('unknown-component', executorData1)
}

/**
 * 测试映射验证功能
 */
function testMappingValidation(): void {
  // 测试有效映射
  const validMapping = {
    dataSource1: { value: 100 },
    dataSource2: { value: 200 }
  }

  const validation1 = DataSourceMapper.validateMapping('test-component', validMapping)
  // 测试无效映射（缺少数据源）
  const invalidMapping = {
    dataSource1: { value: 100 }
    // 缺少 dataSource2
  }

  const validation2 = DataSourceMapper.validateMapping('test-component', invalidMapping)
  // 测试额外字段映射
  const extraMapping = {
    dataSource1: { value: 100 },
    dataSource2: { value: 200 },
    extraField: { value: 300 }
  }

  const validation3 = DataSourceMapper.validateMapping('test-component', extraMapping)
}

/**
 * 测试映射统计功能
 */
function testMappingStats(): void {
  const executorData = {
    dataSource1: { value: 100 },
    dataSource2: { value: 200 },
    extraData: { value: 300 }
  }

  const stats = DataSourceMapper.getMappingStats('test-component', executorData)
  // 测试组件注册表统计
  const registryStats = ComponentRegistry.getStats()
}

/**
 * 测试静态参数映射功能
 */
function testStaticParamMapping(): void {
  // 测试完整静态参数
  const staticParams1 = {
    title: '自定义标题',
    count: 20
  }

  const result1 = DataSourceMapper.mapStaticParams('test-component', staticParams1)
  // 测试部分静态参数
  const staticParams2 = {
    title: '部分标题'
    // 缺少 count
  }

  const result2 = DataSourceMapper.mapStaticParams('test-component', staticParams2)
  // 测试空静态参数
  const result3 = DataSourceMapper.mapStaticParams('test-component', null)
}

/**
 * 性能测试
 */
function performanceTest(): void {
  const executorData = {
    dataSource1: { value: 100, data: new Array(1000).fill(0).map((_, i) => ({ id: i, value: Math.random() })) },
    dataSource2: { value: 200, data: new Array(1000).fill(0).map((_, i) => ({ id: i, value: Math.random() })) }
  }

  const iterations = 1000
  const startTime = performance.now()

  for (let i = 0; i < iterations; i++) {
    DataSourceMapper.mapDataSources('test-component', executorData)
  }

  const endTime = performance.now()
  const avgTime = (endTime - startTime) / iterations
}

/**
 * 清理测试数据
 */
function cleanup(): void {
  // 注意：在生产环境中不要清理注册表
  // ComponentRegistry.clear()
}

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined' && (window as any).__TEST_DATA_SOURCE_MAPPER__) {
  testDataSourceMapper()
}

// 导出测试函数
export {
  testComponentRegistration,
  testDataSourceMapping,
  testMappingValidation,
  testMappingStats,
  testStaticParamMapping,
  performanceTest,
  cleanup
}
