<template>
  <div class="property-panel">
    <template v-if="selectedNode">
      <n-card :title="$t('visualEditor.basicProperties')" size="small" :bordered="false">
        <n-form size="small" label-placement="left" label-width="50">
          <n-form-item label="X">
            <n-input-number :value="selectedNode.x" @update:value="updateNodePosition('x', $event)" />
          </n-form-item>
          <n-form-item label="Y">
            <n-input-number :value="selectedNode.y" @update:value="updateNodePosition('y', $event)" />
          </n-form-item>
          <n-form-item :label="$t('visualEditor.width')">
            <n-input-number :value="selectedNode.width" @update:value="updateNodeSize('width', $event)" />
          </n-form-item>
          <n-form-item :label="$t('visualEditor.height')">
            <n-input-number :value="selectedNode.height" @update:value="updateNodeSize('height', $event)" />
          </n-form-item>
        </n-form>
      </n-card>

      <!-- 组件特定属性 -->
      <n-card :title="$t('visualEditor.componentProperties')" size="small" :bordered="false" class="mt-2">
        <component
          :is="getPropertyEditor(selectedNode.type)"
          :properties="selectedNode.properties"
          @update="updateNodeProperties"
        />
      </n-card>
    </template>

    <n-empty v-else :description="$t('visualEditor.selectComponent')" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { $t } from '@/locales'
import { useVisualEditor } from '@/store/modules/visual-editor'
import TextPropertyEditor from './components/TextPropertyEditor.vue'
import ImagePropertyEditor from './components/ImagePropertyEditor.vue'
import BarChartPropertyEditor from './components/BarChartPropertyEditor.vue'
import DigitIndicatorPropertyEditor from './components/DigitIndicatorPropertyEditor.vue'
import ChartDigitIndicatorPropertyEditor from './components/ChartDigitIndicatorPropertyEditor.vue'
import ChartBarPropertyEditor from './components/ChartBarPropertyEditor.vue'

// 🔥 使用新的统一架构
const unifiedEditor = useVisualEditor()

// 适配旧接口
const stateManager = computed(() => ({
  nodes: unifiedEditor.store.nodes,
  selectedIds: unifiedEditor.store.selectedIds
}))

const updateNode = async (nodeId: string, updates: any) => {
  await unifiedEditor.updateNode(nodeId, updates)
}

const selectedNode = computed(() => {
  const nodes = stateManager.value.nodes
  const selectedIds = stateManager.value.selectedIds

  if (selectedIds.length === 1) {
    return nodes.find(node => node.id === selectedIds[0]) || null
  }
  return null
})

const propertyEditors = {
  text: TextPropertyEditor,
  image: ImagePropertyEditor,
  'bar-chart': BarChartPropertyEditor,
  'line-chart': BarChartPropertyEditor,
  'pie-chart': BarChartPropertyEditor,
  'digit-indicator': DigitIndicatorPropertyEditor,
  'chart-digit-indicator': ChartDigitIndicatorPropertyEditor,
  'chart-bar': ChartBarPropertyEditor
}

const getPropertyEditor = (type: string) => {
  return propertyEditors[type as keyof typeof propertyEditors]
}

const updateNodePosition = (axis: 'x' | 'y', value: number | null) => {
  if (!selectedNode.value || value === null) return
  updateNode(selectedNode.value.id, { [axis]: value })
}

const updateNodeSize = (dimension: 'width' | 'height', value: number | null) => {
  if (!selectedNode.value || value === null) return
  updateNode(selectedNode.value.id, { [dimension]: value })
}

const updateNodeProperties = (properties: Record<string, any>) => {
  if (!selectedNode.value) return
  updateNode(selectedNode.value.id, {
    properties: { ...selectedNode.value.properties, ...properties }
  })
}
</script>

<style scoped>
.property-panel {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}
</style>
