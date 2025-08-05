// src/card2.1/components/button/index.ts
import { defineComponent } from 'vue'
import type { IComponentDefinition } from '@/card2.1/core/types'
import View from './view.vue'

export default {
  id: 'button', // 使用 id 作为唯一标识
  meta: {
    name: 'button',
    title: '按钮', // 使用 title 作为显示名称
    category: 'control',
    icon: 'button-icon', // 替换为真实图标
    description: '一个简单的可交互按钮',
    version: '1.0.0'
  },
  properties: {
    buttonText: {
      type: 'string',
      defaultValue: '点击我',
      label: '按钮文字'
    }
    // 后续可以添加更多属性, 如 color, size 等
  },
  // Vue 的 defineComponent 提供了更好的类型推断
  component: defineComponent(View)
} as IComponentDefinition
