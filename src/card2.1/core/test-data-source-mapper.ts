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
  console.log('🧪 [测试] 开始测试数据源映射器')
  
  // 1. 测试组件注册
  testComponentRegistration()
  
  // 2. 测试数据源映射
  testDataSourceMapping()
  
  // 3. 测试验证功能
  testMappingValidation()
  
  // 4. 测试统计功能
  testMappingStats()
  
  console.log('✅ [测试] 数据源映射器测试完成')
}

/**
 * 测试组件注册功能
 */
function testComponentRegistration(): void {
  console.log('\n📝 [测试] 测试组件注册功能')
  
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
  console.log(`✓ 组件注册状态: ${registered}`)
  
  const definition = ComponentRegistry.get('test-component')
  console.log(`✓ 获取组件定义: ${definition ? '成功' : '失败'}`)
  
  const dataSourceKeys = ComponentRegistry.getDataSourceKeys('test-component')
  console.log(`✓ 数据源键: ${dataSourceKeys.join(', ')}`)
  
  const staticParamKeys = ComponentRegistry.getStaticParamKeys('test-component')
  console.log(`✓ 静态参数键: ${staticParamKeys.join(', ')}`)
}

/**
 * 测试数据源映射功能
 */
function testDataSourceMapping(): void {
  console.log('\n🔄 [测试] 测试数据源映射功能')
  
  // 测试场景1: 直接数据源格式
  const executorData1 = {
    dataSource1: { value: 100, label: '数据1' },
    dataSource2: { value: 200, label: '数据2' }
  }
  
  const result1 = DataSourceMapper.mapDataSources('test-component', executorData1)
  console.log('✓ 直接格式映射结果:', result1)
  
  // 测试场景2: main字段格式
  const executorData2 = {
    main: {
      dataSource1: { value: 300, label: '数据3' },
      dataSource2: { value: 400, label: '数据4' }
    }
  }
  
  const result2 = DataSourceMapper.mapDataSources('test-component', executorData2)
  console.log('✓ main字段格式映射结果:', result2)
  
  // 测试场景3: 空数据
  const result3 = DataSourceMapper.mapDataSources('test-component', null)
  console.log('✓ 空数据映射结果:', result3)
  
  // 测试场景4: 未注册组件
  const result4 = DataSourceMapper.mapDataSources('unknown-component', executorData1)
  console.log('✓ 未注册组件映射结果:', result4)
}

/**
 * 测试映射验证功能
 */
function testMappingValidation(): void {
  console.log('\n🔍 [测试] 测试映射验证功能')
  
  // 测试有效映射
  const validMapping = {
    dataSource1: { value: 100 },
    dataSource2: { value: 200 }
  }
  
  const validation1 = DataSourceMapper.validateMapping('test-component', validMapping)
  console.log('✓ 有效映射验证:', validation1)
  
  // 测试无效映射（缺少数据源）
  const invalidMapping = {
    dataSource1: { value: 100 }
    // 缺少 dataSource2
  }
  
  const validation2 = DataSourceMapper.validateMapping('test-component', invalidMapping)
  console.log('✓ 无效映射验证:', validation2)
  
  // 测试额外字段映射
  const extraMapping = {
    dataSource1: { value: 100 },
    dataSource2: { value: 200 },
    extraField: { value: 300 }
  }
  
  const validation3 = DataSourceMapper.validateMapping('test-component', extraMapping)
  console.log('✓ 额外字段映射验证:', validation3)
}

/**
 * 测试映射统计功能
 */
function testMappingStats(): void {
  console.log('\n📊 [测试] 测试映射统计功能')
  
  const executorData = {
    dataSource1: { value: 100 },
    dataSource2: { value: 200 },
    extraData: { value: 300 }
  }
  
  const stats = DataSourceMapper.getMappingStats('test-component', executorData)
  console.log('✓ 映射统计信息:', stats)
  
  // 测试组件注册表统计
  const registryStats = ComponentRegistry.getStats()
  console.log('✓ 注册表统计信息:', registryStats)
}

/**
 * 测试静态参数映射功能
 */
function testStaticParamMapping(): void {
  console.log('\n⚙️ [测试] 测试静态参数映射功能')
  
  // 测试完整静态参数
  const staticParams1 = {
    title: '自定义标题',
    count: 20
  }
  
  const result1 = DataSourceMapper.mapStaticParams('test-component', staticParams1)
  console.log('✓ 完整静态参数映射:', result1)
  
  // 测试部分静态参数
  const staticParams2 = {
    title: '部分标题'
    // 缺少 count
  }
  
  const result2 = DataSourceMapper.mapStaticParams('test-component', staticParams2)
  console.log('✓ 部分静态参数映射:', result2)
  
  // 测试空静态参数
  const result3 = DataSourceMapper.mapStaticParams('test-component', null)
  console.log('✓ 空静态参数映射:', result3)
}

/**
 * 性能测试
 */
function performanceTest(): void {
  console.log('\n⚡ [测试] 性能测试')
  
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
  
  console.log(`✓ 性能测试完成: ${iterations} 次映射，平均耗时 ${avgTime.toFixed(3)}ms`)
}

/**
 * 清理测试数据
 */
function cleanup(): void {
  console.log('\n🧹 [测试] 清理测试数据')
  
  // 注意：在生产环境中不要清理注册表
  // ComponentRegistry.clear()
  
  console.log('✓ 清理完成')
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