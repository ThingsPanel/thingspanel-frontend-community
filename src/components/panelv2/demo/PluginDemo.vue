<template>
  <div class="plugin-demo">
    <PanelV2
      ref="panelRef"
      :plugins="preinstalledPlugins"
      :toolbarActions="customToolbarActions"
      :draggableItems="customDraggableItems"
      :inspectorRegistry="inspectorRegistry"
      :enablePluginSystem="true"
    >
      <template #card="{ cardData }">
        <component 
          :is="getCardComponent(cardData.type)" 
          v-if="getCardComponent(cardData.type)"
          :config="cardData.config"
        />
        <div v-else class="unknown-card">
          <p>未知卡片类型: {{ cardData.type }}</p>
        </div>
      </template>
    </PanelV2>

    <!-- 插件管理面板 -->
    <div class="plugin-panel" :class="{ 'open': showPluginPanel }">
      <div class="plugin-panel-header">
        <h3>插件管理</h3>
        <button class="close-btn" @click="showPluginPanel = false">
          <i class="fa fa-times"></i>
        </button>
      </div>
      <PluginConfig />
    </div>

    <!-- 浮动按钮 -->
    <button 
      class="plugin-toggle-btn" 
      :title="showPluginPanel ? '关闭插件面板' : '打开插件面板'"
      @click="showPluginPanel = !showPluginPanel"
    >
      <i class="fa fa-plug"></i>
    </button>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import PanelV2 from '../PanelV2.vue'
import PluginConfig from '../plugins/PluginConfig.vue'
import TextCard from '../cards/TextCard.vue'
import { ChartPlugin, usePluginManager } from '../plugins'
import type { ToolbarAction, DraggableItem } from '../types'

// 面板引用
const panelRef = ref<InstanceType<typeof PanelV2>>()

// 插件面板显示状态
const showPluginPanel = ref(false)

// 预装插件
const preinstalledPlugins = [
  ChartPlugin
]

// 自定义工具栏动作
const customToolbarActions: ToolbarAction[] = [
  {
    id: 'toggle-plugin-panel',
    icon: 'fa fa-plug',
    tooltip: '插件管理',
    action: () => {
      showPluginPanel.value = !showPluginPanel.value
    }
  },
  {
    id: 'export-config',
    icon: 'fa fa-download',
    tooltip: '导出配置',
    action: (store) => {
      const config = {
        cards: store.$state.cards,
        config: store.$state.config
      }
      const blob = new Blob([JSON.stringify(config, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'panel-config.json'
      a.click()
      URL.revokeObjectURL(url)
    }
  }
]

// 自定义可拖拽项
const customDraggableItems: DraggableItem[] = [
  {
    type: 'text-card',
    label: '文本卡片',
    icon: 'fa fa-font',
    defaultData: {
      type: 'text-card',
      config: {
        title: { value: '标题', inspector: 'text-input' },
        content: { value: '内容', inspector: 'textarea' },
        backgroundColor: { value: '#ffffff', inspector: 'color-picker' }
      }
    }
  }
]

// 配置器注册表
const inspectorRegistry = {
  'text-input': {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: `
      <div class="inspector-item">
        <input 
          :value="modelValue" 
          @input="$emit('update:modelValue', $event.target.value)"
          class="form-control"
          type="text"
        />
      </div>
    `
  },
  'textarea': {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: `
      <div class="inspector-item">
        <textarea 
          :value="modelValue" 
          @input="$emit('update:modelValue', $event.target.value)"
          class="form-control"
          rows="3"
        ></textarea>
      </div>
    `
  },
  'color-picker': {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: `
      <div class="inspector-item">
        <input 
          :value="modelValue" 
          @input="$emit('update:modelValue', $event.target.value)"
          class="form-control"
          type="color"
        />
      </div>
    `
  }
}

// 获取卡片组件
const getCardComponent = (type: string) => {
  // 检查是否是内置组件
  if (type === 'text-card') {
    return TextCard
  }
  
  // 检查插件提供的组件
  if (panelRef.value?.pluginManager) {
    const registry = panelRef.value.pluginManager.getCardRegistry()
    return registry[type]
  }
  
  return null
}

// 访问插件管理器（在组件挂载后）
const { manager: pluginManager } = usePluginManager?.() || { manager: null }
</script>

<style scoped>
.plugin-demo {
  height: 100vh;
  position: relative;
  overflow: hidden;
}

.unknown-card {
  padding: 20px;
  background: #f5f5f5;
  border: 2px dashed #ccc;
  border-radius: 4px;
  text-align: center;
  color: #666;
}

/* 插件管理面板 */
.plugin-panel {
  position: fixed;
  top: 0;
  right: -400px;
  width: 400px;
  height: 100vh;
  background: white;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  transition: right 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.plugin-panel.open {
  right: 0;
}

.plugin-panel-header {
  padding: 20px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fafafa;
}

.plugin-panel-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #666;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.3s;
}

.close-btn:hover {
  color: #333;
  background: #e6f7ff;
}

/* 浮动按钮 */
.plugin-toggle-btn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #1890ff;
  color: white;
  border: none;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
  transition: all 0.3s ease;
  z-index: 999;
}

.plugin-toggle-btn:hover {
  background: #40a9ff;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(24, 144, 255, 0.5);
}

.plugin-toggle-btn:active {
  transform: translateY(0);
}

/* 全局样式 */
:global(.form-control) {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
}

:global(.form-control:focus) {
  outline: none;
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

:global(.inspector-item) {
  margin-bottom: 12px;
}
</style>