/**
 * 测试组件的数据需求声明
 * 为每个测试组件定义具体的数据源需求和字段映射
 */

import {
  createComponentDataRequirements,
  componentDataRequirementsRegistry
} from '@/components/visual-editor/core/component-data-requirements'

/**
 * 简单数据展示组件的数据需求
 */
const SIMPLE_DATA_DISPLAY_REQUIREMENTS = createComponentDataRequirements('simple-data-display', '简单数据展示')
  .addDetailedDataSource({
    id: 'display_data',
    name: '展示数据',
    structureType: 'object',
    required: true,
    description: '要展示的JSON对象数据',
    usage: '提供组件显示的数据内容',
    fields: [
      {
        name: 'id',
        type: 'string',
        description: '唯一标识符',
        required: true,
        example: 'device_001'
      },
      {
        name: 'name',
        type: 'string',
        description: '显示名称',
        required: true,
        example: '温度传感器'
      },
      {
        name: 'value',
        type: 'number',
        description: '主要数值',
        required: true,
        example: 25.6
      },
      {
        name: 'status',
        type: 'string',
        description: '状态信息',
        required: false,
        example: 'online'
      },
      {
        name: 'lastUpdate',
        type: 'date',
        description: '最后更新时间',
        required: false,
        example: '2024-01-01T12:00:00Z'
      }
    ]
  })
  .setLimits(1, 1)
  .build()

/**
 * 时间序列图表组件的数据需求
 */
const TIME_SERIES_CHART_REQUIREMENTS = createComponentDataRequirements('time-series-chart', '时间序列图表')
  .addDetailedDataSource({
    id: 'chart_data',
    name: '图表数据',
    structureType: 'array',
    required: true,
    description: '时间序列数据数组',
    usage: '提供图表绘制所需的时间点和数值',
    fields: [
      {
        name: 'time',
        type: 'string',
        description: '时间戳',
        required: true,
        example: '2024-01-01T12:00:00Z'
      },
      {
        name: 'value',
        type: 'number',
        description: '数值',
        required: true,
        example: 25.6
      },
      {
        name: 'label',
        type: 'string',
        description: '数据标签',
        required: false,
        example: '温度'
      }
    ]
  })
  .setLimits(1, 1)
  .build()

/**
 * 统计卡片组件的数据需求
 */
const STATISTICS_CARD_REQUIREMENTS = createComponentDataRequirements('statistics-card', '统计卡片')
  .addDetailedDataSource({
    id: 'primary_stats',
    name: '主要统计数据',
    structureType: 'object',
    required: true,
    description: '主要的统计指标数据',
    usage: '显示核心统计指标',
    fields: [
      {
        name: 'total',
        type: 'number',
        description: '总数',
        required: true,
        example: 1000
      },
      {
        name: 'active',
        type: 'number',
        description: '活跃数量',
        required: true,
        example: 850
      },
      {
        name: 'rate',
        type: 'number',
        description: '比率或百分比',
        required: false,
        example: 85.5
      }
    ]
  })
  .addDetailedDataSource({
    id: 'detail_data',
    name: '详细数据列表',
    structureType: 'array',
    required: false,
    description: '详细的数据记录列表',
    usage: '提供详细统计计算的原始数据',
    fields: [
      {
        name: 'id',
        type: 'string',
        description: '记录ID',
        required: true,
        example: 'record_001'
      },
      {
        name: 'value',
        type: 'number',
        description: '数值',
        required: true,
        example: 123.45
      },
      {
        name: 'category',
        type: 'string',
        description: '分类',
        required: false,
        example: '类型A'
      },
      {
        name: 'timestamp',
        type: 'string',
        description: '时间戳',
        required: false,
        example: '2024-01-01T12:00:00Z'
      }
    ]
  })
  .addDetailedDataSource({
    id: 'config_data',
    name: '配置参数',
    structureType: 'object',
    required: false,
    description: '组件的配置参数',
    usage: '自定义组件的显示行为和计算逻辑',
    fields: [
      {
        name: 'displayMode',
        type: 'string',
        description: '显示模式',
        required: false,
        example: 'compact'
      },
      {
        name: 'refreshInterval',
        type: 'number',
        description: '刷新间隔（秒）',
        required: false,
        example: 30
      },
      {
        name: 'thresholds',
        type: 'any',
        description: '阈值配置',
        required: false,
        example: { low: 10, high: 90 }
      }
    ]
  })
  .setLimits(1, 3)
  .build()

/**
 * 数据映射测试组件的数据需求
 * 用于测试和验证JSON路径映射功能
 */
const DATA_MAPPING_TEST_REQUIREMENTS = createComponentDataRequirements('data-mapping-test', '数据映射测试')
  .addDetailedDataSource({
    id: 'array_data_source',
    name: '数组数据源',
    structureType: 'array',
    required: true,
    description: 'JSON数组数据，用于测试数组路径映射',
    usage: '提供数组类型的数据进行路径映射测试',
    fields: [
      {
        name: 'field1',
        type: 'string',
        description: '数组字段1 - 用于映射测试',
        required: true,
        example: '数组中的文本值'
      },
      {
        name: 'field2',
        type: 'number',
        description: '数组字段2 - 用于映射测试',
        required: true,
        example: 42
      },
      {
        name: 'field3',
        type: 'any',
        description: '数组字段3 - 用于映射测试',
        required: true,
        example: '可以是任意类型的值'
      }
    ]
  })
  .addDetailedDataSource({
    id: 'object_data_source',
    name: '对象数据源',
    structureType: 'object',
    required: true,
    description: 'JSON对象数据，用于测试对象路径映射',
    usage: '提供对象类型的数据进行路径映射测试',
    fields: [
      {
        name: 'fieldA',
        type: 'string',
        description: '对象字段A - 用于映射测试',
        required: true,
        example: '对象中的文本值'
      },
      {
        name: 'fieldB',
        type: 'number',
        description: '对象字段B - 用于映射测试',
        required: true,
        example: 100
      },
      {
        name: 'fieldC',
        type: 'any',
        description: '对象字段C - 用于映射测试',
        required: true,
        example: { nested: 'value' }
      }
    ]
  })
  .setLimits(2, 2) // 严格要求2个数据源
  .build()

/**
 * 注册所有测试组件的数据需求
 */
export function registerTestComponentDataRequirements() {
  console.log('📋 [Card2.1] 开始注册测试组件数据需求...')

  try {
    // 注册各个组件的数据需求
    componentDataRequirementsRegistry.register('simple-data-display', SIMPLE_DATA_DISPLAY_REQUIREMENTS)

    componentDataRequirementsRegistry.register('time-series-chart', TIME_SERIES_CHART_REQUIREMENTS)

    componentDataRequirementsRegistry.register('statistics-card', STATISTICS_CARD_REQUIREMENTS)

    componentDataRequirementsRegistry.register('data-mapping-test', DATA_MAPPING_TEST_REQUIREMENTS)

    console.log('✅ [Card2.1] 测试组件数据需求注册完成')

    // 验证注册结果
    const registeredIds = componentDataRequirementsRegistry.getAllComponentIds()
    console.log('📊 [Card2.1] 当前已注册数据需求的组件:', registeredIds)
  } catch (error) {
    console.error('❌ [Card2.1] 测试组件数据需求注册失败:', error)
    throw error
  }
}

/**
 * 获取测试组件的数据需求
 */
export function getTestComponentRequirements() {
  return {
    'simple-data-display': SIMPLE_DATA_DISPLAY_REQUIREMENTS,
    'time-series-chart': TIME_SERIES_CHART_REQUIREMENTS,
    'statistics-card': STATISTICS_CARD_REQUIREMENTS,
    'data-mapping-test': DATA_MAPPING_TEST_REQUIREMENTS
  }
}

// 导出具体的需求对象，供其他模块使用
export {
  SIMPLE_DATA_DISPLAY_REQUIREMENTS,
  TIME_SERIES_CHART_REQUIREMENTS,
  STATISTICS_CARD_REQUIREMENTS,
  DATA_MAPPING_TEST_REQUIREMENTS
}
