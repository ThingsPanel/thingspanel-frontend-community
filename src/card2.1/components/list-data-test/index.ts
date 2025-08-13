/**
 * 列表数据测试组件定义
 * 用于验证V4优化方案中的数组数据绑定和初始化修复
 */

import ListDataTestWidget from './ListDataTestWidget.vue'
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

  // ===== V6标准化定义 =====
  // 静态参数定义
  staticParams: [
    {
      key: 'title',
      label: '组件标题',
      type: 'text',
      defaultValue: '列表数据测试',
      description: '列表组件的显示标题',
      placeholder: '请输入组件标题'
    },
    {
      key: 'showTimestamp',
      label: '显示时间戳',
      type: 'switch',
      defaultValue: true,
      description: '是否显示数据更新时间'
    },
    {
      key: 'enablePagination',
      label: '启用分页',
      type: 'switch',
      defaultValue: true,
      description: '是否启用分页功能'
    },
    {
      key: 'pageSize',
      label: '每页条数',
      type: 'number',
      defaultValue: 10,
      description: '每页显示的数据条数',
      min: 5,
      max: 50
    },
    {
      key: 'maxItems',
      label: '最大条数',
      type: 'number',
      defaultValue: 100,
      description: '最多显示的数据条数',
      min: 10,
      max: 1000
    }
  ],

  // 数据源需求定义（V6标准）
  dataSources: [
    {
      key: 'listData',
      label: '列表数据源',
      description: '提供列表展示的数组数据',
      fieldsToMap: [
        {
          key: 'dataPath',
          label: '数据路径',
          targetProperty: 'listData',
          description: '指向数组数据的JSON路径，如果是根数组则使用 $',
          placeholder: '如: $.data 或 $'
        },
        {
          key: 'updateTimePath',
          label: '更新时间路径',
          targetProperty: 'updateTime',
          description: '指向时间戳字段的JSON路径',
          placeholder: '如: $.timestamp',
          required: false
        }
      ]
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
