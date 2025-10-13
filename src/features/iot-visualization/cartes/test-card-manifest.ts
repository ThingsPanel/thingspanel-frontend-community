/**
 * 测试卡片组件清单
 * 用于验证系统基本功能
 */

import TestCard from './test-card.vue'

// 测试卡片清单
export const testCardManifest = {
  type: 'test-card',
  name: '测试卡片',
  description: '用于验证系统功能的测试卡片',
  icon: 'i-carbon-test-tool',
  version: '1.0.0',
  author: 'IOT Visualization',
  category: '测试',
  tags: ['测试', '验证'],
  dataSources: [
    {
      key: 'testData',
      name: '测试数据',
      description: '测试数据源',
      supportedTypes: ['static', 'http'],
      required: false
    }
  ],
  component: {
    vue: TestCard
  },
  defaultConfig: {
    title: '测试卡片'
  },
  defaultLayout: {
    width: 200,
    height: 150,
    minWidth: 100,
    minHeight: 100
  },
  features: {
    realtime: true,
    dataBinding: true,
    configurable: true,
    resizable: true
  }
}