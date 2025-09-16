<template>
  <div class="configuration-panel">
    <!-- 选中组件时显示配置界面 -->
    <div v-if="selectedWidget" class="config-container">
      <div class="widget-header">
        <h3 class="widget-title">{{ selectedWidget.type }}</h3>
        <span class="widget-id">{{ selectedWidget.id }}</span>
      </div>

      <!-- 配置标签页 -->
      <n-tabs v-model:value="activeTab" type="line" class="config-tabs">
        <n-tab-pane
          v-for="layer in visibleConfigLayers"
          :key="layer.name"
          :name="layer.name"
          :tab="$t(layer.label)"
        >
          <div class="config-scrollbar">
            <component
              :is="layer.component"
              :node-id="selectedWidget.id"
              :widget="selectedWidget"
              :readonly="readonly"
              :component-id="selectedWidget.id"
              :component-type="selectedWidget.type"
              class="config-form"
            />
          </div>
        </n-tab-pane>
      </n-tabs>
    </div>

    <!-- 未选中组件时的提示 -->
    <div v-else class="no-selection">
      <n-empty description="请选择一个组件进行配置" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 🔥 ConfigurationPanel - 统一配置架构版本
 * 基于新的统一配置架构，作为配置的显示和编辑界面
 */

import { ref, computed, watch } from 'vue'
import { NTabs, NTabPane, NEmpty, NScrollbar } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { getVisibleConfigLayers } from '@/components/visual-editor/configuration/component-registry'
import type { VisualEditorWidget } from '@/components/visual-editor/types'

interface Props {
  selectedWidget: VisualEditorWidget | null
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  selectedWidget: null,
  readonly: false
})

// 组合式函数
const { t } = useI18n()

// 当前活跃的标签页
const activeTab = ref('base')

// 根据选中组件获取可见的配置层
const visibleConfigLayers = computed(() => {
  if (!props.selectedWidget) return []

  // 获取该组件类型支持的配置层
  return getVisibleConfigLayers(props.selectedWidget.id, props.selectedWidget)
})

console.log(`🔥 [ConfigurationPanel] 统一配置架构已启用`, {
  selectedWidget: props.selectedWidget?.id,
  visibleLayers: visibleConfigLayers.value.map(layer => layer.name)
})

// 监听组件选择变化，重置到基础标签页
watch(() => props.selectedWidget, async (newWidget) => {
  if (newWidget) {
    // 确保默认选择的标签页存在
    const firstAvailableTab = visibleConfigLayers.value[0]?.name || 'base'
    activeTab.value = firstAvailableTab

    // 🔥 尝试刷新组件定义（如果缺失configComponent）
    if (!newWidget.metadata?.card2Definition?.configComponent) {
      try {
        const { refreshComponentDefinitions } = await import('./component-registry')
        await refreshComponentDefinitions(newWidget)
      } catch (error) {
        console.warn('⚠️ [ConfigurationPanel] 组件定义刷新失败:', error)
      }
    }
  }
})
</script>

<style scoped>
.configuration-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.config-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.widget-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--card-color);
}

.widget-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
}

.widget-id {
  font-size: 12px;
  color: var(--text-color-3);
  font-family: monospace;
}

.config-tabs {
  overflow: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.n-tabs-content) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

:deep(.n-tab-pane) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.config-scrollbar {
  flex: 1;
  overflow: auto;
}

.config-form {
  /* 内容容器，不需要特殊样式 */
}

.no-selection {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color-3);
}
</style>
