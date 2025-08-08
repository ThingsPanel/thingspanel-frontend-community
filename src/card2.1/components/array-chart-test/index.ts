/**
 * 数组图表测试组件定义
 * Card 2.1 系统 - 专门处理数组数据渲染的示例组件
 */

import type { ComponentDefinition } from '../../core/types'
import type { ComponentDataSourceDefinition } from '../../../components/visual-editor/types/data-source'
import ArrayChartTestCard from './ArrayChartTestCard.vue'
import icon from './icon'

/**
 * 组件数据源定义 - 专门用于数组数据
 * 这是关键部分：告诉Visual Editor的表单如何处理数组数据
 */
const dataSourceDefinitions: ComponentDataSourceDefinition[] = [
  {
    name: 'data',
    type: 'array', // 关键：声明为数组类型
    required: false,
    description: '图表数据数组，支持时间序列、坐标点等格式',
    defaultValue: [],
    
    // 🔥 新增：数组结构定义
    arrayItemStructure: {
      // 期望数组中每个对象的结构
      x: {
        type: 'value',
        valueType: 'any', // 支持数字或字符串
        description: 'X轴值（时间、标签等）',
        example: '2024-01-01 或 0, 1, 2...'
      },
      y: {
        type: 'value', 
        valueType: 'number',
        description: 'Y轴数值',
        example: 25.5
      },
      label: {
        type: 'value',
        valueType: 'string',
        description: '数据点标签（可选）',
        example: '温度传感器1',
        required: false
      },
      timestamp: {
        type: 'value',
        valueType: 'number', 
        description: '时间戳（可选）',
        example: 1640995200000,
        required: false
      }
    },
    
    // 🔥 数组数据映射配置
    arrayMappingConfig: {
      // 支持从复杂JSON中提取数组
      supportedSourceTypes: ['direct_array', 'nested_array', 'object_to_array'],
      
      // 直接数组：[{x: 1, y: 10}, {x: 2, y: 20}]
      directArrayPath: '',
      
      // 嵌套数组：data.measurements.values
      nestedArrayPath: 'data.measurements.values',
      
      // 对象转数组：{point1: {x:1,y:10}, point2: {x:2,y:20}} → [{x:1,y:10}, {x:2,y:20}]
      objectToArrayConfig: {
        enabled: false,
        keyAsProperty: 'key' // 将对象的key作为数组item的某个属性
      }
    },

    // 🔥 数组数据验证规则
    arrayValidation: {
      minItems: 0,
      maxItems: 10000,
      itemValidation: {
        requiredFields: ['y'], // y字段必须存在
        fieldTypes: {
          x: ['number', 'string'],
          y: 'number',
          label: 'string',
          timestamp: 'number'
        }
      }
    }
  }
]

/**
 * 数组图表测试组件定义
 */
const ArrayChartTestDefinition: ComponentDefinition = {
  type: 'array-chart-test',
  name: '数组图表测试',
  description: '专门用于测试数组数据渲染的图表组件，支持时间序列、坐标点等多种数组数据格式。展示ECharts集成和数组数据处理最佳实践。',
  category: 'chart',
  version: '1.0.0',
  author: 'ThingsPanel Team',
  
  // Vue组件
  component: ArrayChartTestCard,
  
  // 图标
  icon,
  
  // 🔥 关键：数据源定义
  dataSourceDefinitions,
  
  // 默认配置
  config: {
    style: {
      width: 600,
      height: 450
    },
    data: {
      title: '数组图表测试组件',
      showDebugInfo: true,
      chartType: 'line',
      xAxisKey: 'x',
      yAxisKey: 'y'
    }
  },
  
  // 属性配置
  properties: {
    title: {
      type: 'string',
      label: '图表标题',
      default: '数组图表测试组件',
      description: '图表顶部显示的标题'
    },
    chartType: {
      type: 'select',
      label: '图表类型',
      default: 'line',
      options: [
        { label: '折线图', value: 'line' },
        { label: '柱状图', value: 'bar' },
        { label: '散点图', value: 'scatter' }
      ],
      description: '选择图表的渲染方式'
    },
    xAxisKey: {
      type: 'string',
      label: 'X轴字段',
      default: 'x',
      description: '数组对象中作为X轴的字段名'
    },
    yAxisKey: {
      type: 'string',
      label: 'Y轴字段',
      default: 'y', 
      description: '数组对象中作为Y轴的字段名'
    },
    showDebugInfo: {
      type: 'boolean',
      label: '显示调试信息',
      default: true,
      description: '是否显示数据结构和处理过程的调试信息'
    }
  },

  // 支持的数据源类型
  supportedDataSources: ['static', 'api', 'websocket', 'script', 'database'],

  // 组件标签
  tags: ['数组数据', '图表', 'ECharts', '时间序列', '坐标点', '测试'],

  // 🔥 数组数据使用示例
  examples: [
    {
      name: '时间序列数据',
      description: '典型的时间序列图表数据',
      sourceData: {
        "timeSeries": {
          "sensor": "temperature_01",
          "unit": "°C",
          "data": [
            { "timestamp": 1640995200000, "x": "09:00", "y": 22.5, "label": "早上" },
            { "timestamp": 1640998800000, "x": "10:00", "y": 24.8, "label": "上午" },
            { "timestamp": 1641002400000, "x": "11:00", "y": 26.2, "label": "上午" },
            { "timestamp": 1641006000000, "x": "12:00", "y": 28.5, "label": "中午" },
            { "timestamp": 1641009600000, "x": "13:00", "y": 30.1, "label": "下午" },
            { "timestamp": 1641013200000, "x": "14:00", "y": 31.8, "label": "下午" },
            { "timestamp": 1641016800000, "x": "15:00", "y": 29.6, "label": "下午" },
            { "timestamp": 1641020400000, "x": "16:00", "y": 27.3, "label": "下午" }
          ]
        }
      },
      arrayPath: "timeSeries.data",
      expectedOutput: [
        { "timestamp": 1640995200000, "x": "09:00", "y": 22.5, "label": "早上" },
        { "timestamp": 1640998800000, "x": "10:00", "y": 24.8, "label": "上午" }
        // ... 更多数据点
      ],
      chartConfig: {
        xAxisKey: "x",
        yAxisKey: "y",
        chartType: "line"
      }
    },
    {
      name: '坐标点数据',
      description: 'XY坐标散点图数据',
      sourceData: {
        "measurements": {
          "experiment": "pressure_test",
          "points": [
            { "x": 0, "y": 0, "label": "起点" },
            { "x": 10, "y": 15.5, "label": "点1" },
            { "x": 20, "y": 28.8, "label": "点2" },
            { "x": 30, "y": 35.2, "label": "点3" },
            { "x": 40, "y": 42.7, "label": "点4" },
            { "x": 50, "y": 38.1, "label": "点5" }
          ]
        }
      },
      arrayPath: "measurements.points",
      expectedOutput: [
        { "x": 0, "y": 0, "label": "起点" },
        { "x": 10, "y": 15.5, "label": "点1" }
        // ... 更多坐标点
      ],
      chartConfig: {
        xAxisKey: "x",
        yAxisKey: "y", 
        chartType: "scatter"
      }
    },
    {
      name: '简单数值数组',
      description: '纯数值数组，索引作为X轴',
      sourceData: {
        "values": [10, 20, 15, 30, 25, 35, 40, 28, 32, 45]
      },
      arrayPath: "values",
      expectedOutput: [
        { "x": 0, "y": 10 },
        { "x": 1, "y": 20 },
        { "x": 2, "y": 15 }
        // ... 自动生成坐标
      ],
      chartConfig: {
        xAxisKey: "x",
        yAxisKey: "y",
        chartType: "bar"
      }
    }
  ],

  // 组件文档
  documentation: {
    overview: '数组图表测试组件专门用于处理和可视化数组格式的数据，支持多种数组结构和图表类型',
    features: [
      '支持多种数组数据格式（对象数组、数值数组）',
      '自动数据类型识别和验证',
      'ECharts集成，支持折线图、柱状图、散点图',
      '灵活的字段映射配置（X轴、Y轴字段可配置）',
      '实时数据更新和图表刷新',
      '详细的调试信息显示',
      '数据统计计算（最大值、最小值、平均值）'
    ],
    usage: {
      basic: '1. 添加组件到画布\n2. 在数据源面板配置数组数据源\n3. 设置数组路径和字段映射\n4. 组件自动渲染图表',
      arrayDataSource: '配置数组数据源时，需要指定数组路径和对象结构，组件会自动处理数据映射',
      fieldMapping: 'xAxisKey和yAxisKey用于指定数组对象中哪个字段作为坐标轴数据'
    },
    arrayDataFlow: {
      step1: 'Visual Editor 数据源面板配置数组数据源和路径映射',
      step2: 'Card 2.1 数据绑定系统提取数组数据并验证结构',
      step3: '组件接收数组数据，进行字段映射和类型转换',
      step4: '生成ECharts配置并渲染图表',
      step5: '支持实时数据更新和图表刷新'
    }
  }
}

export default ArrayChartTestDefinition