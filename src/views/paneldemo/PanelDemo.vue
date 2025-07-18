<template>
  <div style="height: 100vh; width: 100vw;">
    <PanelV2
      :initialState="initialState"
      :toolbarActions="toolbarActions"
      :draggableItems="draggableItems"
      :inspectorRegistry="inspectorRegistry"
    >
      <!-- 这是新架构的核心：渲染逻辑由用户在插槽中定义 -->
      <template #card="{ cardData }">
        <component
          :is="cardRenderRegistry[cardData.type]"
          :config="cardData.config"
        />
      </template>
    </PanelV2>
  </div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent } from 'vue';
import PanelV2 from '@/components/panelv2/PanelV2.vue';
import type { PanelState, ToolbarAction, DraggableItem, ComponentRegistry } from '@/components/panelv2/types';

// --- 1. 卡片渲染注册表 ---
// 用户实现层：定义卡片类型和其渲染组件的映射关系
const cardRenderRegistry: ComponentRegistry<any> = {
  'text-card': defineAsyncComponent(() => import('@/components/panelv2/cards/TextCard.vue')),
  // 未来可以添加更多卡片类型
  // 'chart-card': defineAsyncComponent(() => import('./cards/ChartCard.vue')),
};

// --- 2. 配置器注册表 ---
// 用户实现层：定义配置器标识和其UI组件的映射关系
const inspectorRegistry: ComponentRegistry<any> = {
  'text-input': defineAsyncComponent(() => import('@/components/panelv2/inspector/inspectors/TextCardInspector.vue')),
  'color-picker': defineAsyncComponent(() => import('@/components/panelv2/inspector/inspectors/PanelInspector.vue')),
  // 未来可以添加更多配置器类型
  // 'number-slider': defineAsyncComponent(() => import('./inspectors/NumberSlider.vue')),
};

// --- 3. 初始数据和配置 ---

const initialState: PanelState = {
  cards: [
    {
      id: 'card-1',
      type: 'text-card',
      layout: { x: 0, y: 0, w: 4, h: 2 },
      config: {
        title: { value: '欢迎使用', inspector: 'text-input' },
        content: { value: '这是一个文本卡片。', inspector: 'text-input' },
      },
    },
  ],
  selectedItemId: null,
  config: {
    backgroundColor: { value: '#f0f2f5', inspector: 'color-picker' },
  },
};

const toolbarActions: ToolbarAction[] = [
  {
    id: 'save',
    icon: 'fa fa-save', // 示例图标，需要引入 Font Awesome
    tooltip: '保存',
    action: (store) => {
      const stateJson = JSON.stringify(store.$state, null, 2);
      console.log('Saving state:', stateJson);
      alert('状态已保存到控制台！');
    },
  },
  {
    id: 'clear',
    icon: 'fa fa-trash',
    tooltip: '清空',
    action: (store) => {
      if (confirm('确定要清空所有卡片吗？')) {
        store.setPanelState({ cards: [], selectedItemId: null, config: store.config });
      }
    },
  },
];

const draggableItems: DraggableItem[] = [
  {
    type: 'text-card',
    label: '文本卡片',
    icon: 'fa fa-font',
    defaultData: {
      type: 'text-card',
      config: {
        title: { value: '新标题', inspector: 'text-input' },
        content: { value: '新内容', inspector: 'text-input' },
      },
    },
  },
];

</script>

<style>
/* 引入 Font Awesome 或其他图标库 */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css');

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
</style>
