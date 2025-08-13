/**
 * 列表数据测试组件定义
 * 用于验证V4优化方案中的数组数据绑定和初始化修复
 */

import ListDataTestWidget from '../ListDataTestWidget.vue'
import type { ComponentDefinition } from '../../core/types'

export const ListDataTest: ComponentDefinition = {
  type: 'list-data-test',
  name: '列表数据测试',
  description: '专门用于测试和验证数组数据绑定的组件，验证V4数据初始化修复效果',
  category: '测试组件',
  subCategory: '数据绑定测试',
  mainCategory: '系统',
  icon: 'list-outline',
  component: ListDataTestWidget,
  version: '1.0.0',
  author: 'ThingsPanel Team',
  tags: ['测试', '列表', '数组数据', 'V4验证'],

  // 默认配置
  config: {
    style: {
      width: 400,
      height: 350
    }
  },

  // ============ 配置驱动的动态数据源 ============

  /** 静态参数需求声明 */
  staticParams: [
    {
      key: 'title',
      name: '组件标题',
      type: 'string',
      description: '列表组件的显示标题',
      defaultValue: '列表数据测试',
      required: false,
      ui: {
        component: 'input',
        placeholder: '请输入组件标题',
        label: '标题',
        group: '基本设置'
      }
    },
    {
      key: 'showTimestamp',
      name: '显示时间戳',
      type: 'boolean',
      description: '是否显示数据更新时间',
      defaultValue: true,
      required: false,
      ui: {
        component: 'switch',
        label: '显示时间戳',
        group: '显示设置'
      }
    },
    {
      key: 'enablePagination',
      name: '启用分页',
      type: 'boolean',
      description: '是否启用分页功能',
      defaultValue: true,
      required: false,
      ui: {
        component: 'switch',
        label: '启用分页',
        group: '显示设置'
      }
    },
    {
      key: 'pageSize',
      name: '每页条数',
      type: 'number',
      description: '每页显示的数据条数',
      defaultValue: 10,
      required: false,
      validation: {
        min: 5,
        max: 50
      },
      ui: {
        component: 'number',
        label: '每页条数',
        group: '分页设置'
      }
    },
    {
      key: 'maxItems',
      name: '最大条数',
      type: 'number',
      description: '最多显示的数据条数',
      defaultValue: 100,
      required: false,
      validation: {
        min: 10,
        max: 1000
      },
      ui: {
        component: 'number',
        label: '最大条数',
        group: '性能设置'
      }
    }
  ],

  /** 数据源需求声明 */
  dataSources: [
    {
      key: 'listData',
      name: '列表数据源',
      description: '提供列表展示的数组数据',
      supportedTypes: ['static', 'api', 'websocket'],
      required: true,
      fieldMappings: {
        data: {
          targetField: 'listData',
          type: 'array',
          required: true,
          defaultValue: [
            { name: '测试项目1', value: 25.6, status: 'online', id: 'item001' },
            { name: '测试项目2', value: 30.2, status: 'offline', id: 'item002' },
            { name: '测试项目3', value: 28.9, status: 'online', id: 'item003' }
          ]
        },
        timestamp: {
          targetField: 'updateTime',
          type: 'value',
          required: false,
          defaultValue: new Date(),
          transform: 'new Date(value)'
        }
      }
    }
  ],

  // 传统属性定义（向后兼容）
  properties: {
    title: {
      type: 'string',
      default: '列表数据测试',
      label: '组件标题',
      description: '组件显示的标题文本'
    },
    showTimestamp: {
      type: 'boolean',
      default: true,
      label: '显示时间戳',
      description: '是否显示数据更新时间'
    },
    enablePagination: {
      type: 'boolean',
      default: true,
      label: '启用分页',
      description: '是否启用分页功能'
    },
    pageSize: {
      type: 'number',
      default: 10,
      label: '每页条数',
      description: '每页显示的数据条数',
      min: 5,
      max: 50
    },
    maxItems: {
      type: 'number',
      default: 100,
      label: '最大条数',
      description: '最多显示的数据条数',
      min: 10,
      max: 1000
    }
  },

  // 示例配置
  examples: [
    {
      name: '基础列表',
      description: '显示基本的设备状态列表',
      config: {
        title: '设备状态列表',
        showTimestamp: true,
        enablePagination: true,
        pageSize: 10
      }
    },
    {
      name: '简洁列表',
      description: '不显示时间戳和分页的简洁列表',
      config: {
        title: '数据概览',
        showTimestamp: false,
        enablePagination: false,
        maxItems: 20
      }
    }
  ],

  // 文档信息
  documentation: {
    description:
      '列表数据测试组件专门用于验证配置驱动数据源系统的数组数据绑定功能，特别是V4优化方案中修复的数据初始化问题。',
    usage: '该组件可以接收任何包含对象数组的数据源，自动展示为列表格式，支持分页和自定义显示设置。',
    dataFormat: {
      expected: 'Array<{ name?: string, value?: number, status?: string, id?: string, [key: string]: any }>',
      example: [
        {
          name: '设备001',
          value: 25.6,
          status: 'online',
          id: 'dev001',
          description: '温度传感器'
        }
      ]
    }
  }
}

// 默认导出组件定义
export default ListDataTest
