import { defineComponent } from 'vue'
import Card from './SimpleTestCard.vue'
import type { ComponentDefinition } from '../../core/types'

/**
 * 简单测试组件定义
 * 遵循 ComponentDefinition 接口
 */
const simpleTestDefinition: ComponentDefinition = {
  type: 'simple-test',
  name: '简单测试',
  description: '一个用于测试自动注册功能的简单组件。',
  category: '测试',
  subCategory: '基础',
  mainCategory: '系统',
  icon: '<svg viewBox="0 0 1024 1024"><path d="M512 0C229.2 0 0 229.2 0 512s229.2 512 512 512 512-229.2 512-512S794.8 0 512 0z m0 960C264.7 960 64 759.3 64 512S264.7 64 512 64s448 200.7 448 448-200.7 448-448 448z" fill="#409eff"/></svg>',
  component: Card,
  configComponent: defineComponent({
    template: '<div>简单测试组件的配置面板</div>'
  }),
  config: {},
  tags: ['test', 'simple'],
  version: '1.0.0',
  author: 'AI Assistant'
}

export default simpleTestDefinition
