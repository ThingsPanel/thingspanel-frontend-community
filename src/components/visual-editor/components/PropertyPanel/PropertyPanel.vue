<template>
  <div class="property-panel">
    <template v-if="selectedNode">
      <n-card title="基础属性" size="small" :bordered="false">
        <n-form size="small" label-placement="left" label-width="50">
          <n-form-item label="X">
            <n-input-number :value="selectedNode.x" @update:value="updateNodePosition('x', $event)" />
          </n-form-item>
          <n-form-item label="Y">
            <n-input-number :value="selectedNode.y" @update:value="updateNodePosition('y', $event)" />
          </n-form-item>
          <n-form-item label="宽度">
            <n-input-number :value="selectedNode.width" @update:value="updateNodeSize('width', $event)" />
          </n-form-item>
          <n-form-item label="高度">
            <n-input-number :value="selectedNode.height" @update:value="updateNodeSize('height', $event)" />
          </n-form-item>
        </n-form>
      </n-card>

      <!-- 组件特定属性 -->
      <n-card title="组件属性" size="small" :bordered="false" class="mt-2">
        <component
          :is="getPropertyEditor(selectedNode.type)"
          :properties="selectedNode.properties"
          @update="updateNodeProperties"
        />
      </n-card>
    </template>

    <n-empty v-else description="请选择一个组件" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useEditor } from '../../hooks/useEditor'
import TextPropertyEditor from './components/TextPropertyEditor.vue'
import ImagePropertyEditor from './components/ImagePropertyEditor.vue'
import BarChartPropertyEditor from './components/BarChartPropertyEditor.vue'
import DigitIndicatorPropertyEditor from './components/DigitIndicatorPropertyEditor.vue'
import ChartDigitIndicatorPropertyEditor from './components/ChartDigitIndicatorPropertyEditor.vue'
import ChartBarPropertyEditor from './components/ChartBarPropertyEditor.vue'

const { stateManager, updateNode } = useEditor()

const selectedNode = computed(() => {
  const selected = stateManager.selectedNodes.value
  return selected.length === 1 ? selected[0] : null
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
