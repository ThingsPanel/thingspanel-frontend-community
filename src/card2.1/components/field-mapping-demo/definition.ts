/**
 * 字段映射测试组件定义
 * 用于演示和测试数据字段映射功能的Card2.1组件
 */

import type { ComponentDefinition } from '../../types'

export const fieldMappingDemoDefinition: ComponentDefinition = {
  type: 'field-mapping-demo',
  name: '字段映射测试',
  description: '演示数据字段映射功能的测试组件',
  category: 'test',
  tags: ['测试', '数据映射', '字段转换'],

  // 组件配置
  config: {
    // 样式配置
    style: {
      width: 400,
      height: 350
    },

    // 数据需求配置 - 需要一个经过字段映射的数据源
    dataRequirements: {
      mappedData: {
        type: 'object',
        description: '经过字段映射处理后的数据',
        required: false,
        default: null,
        structure: {
          // 支持任意结构的映射后数据
          '*': 'any'
        }
      }
    },

    // 属性配置
    properties: {
      showDebugInfo: {
        type: 'boolean',
        label: '显示调试信息',
        description: '是否显示原始JSON数据用于调试',
        default: false
      }
    }
  },

  // 组件元数据
  metadata: {
    author: 'System',
    version: '1.0.0',
    createdAt: new Date().toISOString(),

    // 使用说明
    usage: {
      title: '字段映射测试组件使用说明',
      description: '这个组件用于测试和演示数据字段映射功能',
      examples: [
        {
          title: '基本使用',
          description: '配置数据源并设置字段映射规则',
          steps: [
            '1. 在数据源配置中输入原始JSON数据',
            '2. 配置字段映射规则，将原始字段映射为新字段名',
            '3. 组件会实时显示映射后的数据结构',
            '4. 支持对象和数组两种数据结构的映射'
          ]
        },
        {
          title: '字段映射示例',
          description: '常见的字段映射场景',
          steps: [
            '原始数据: {"xingming": "张三", "nianling": 25}',
            '映射规则: xingming → name, nianling → age',
            '映射结果: {"name": "张三", "age": 25}'
          ]
        }
      ]
    },

    // 测试数据
    testData: {
      mappedData: {
        name: '张三',
        age: 25,
        department: '技术部',
        status: 'active'
      }
    }
  }
}
