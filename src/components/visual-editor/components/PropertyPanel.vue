<template>
  <div class="property-panel">
    <template v-if="selectedItem">
      <!-- 基础属性 -->
      <n-card title="位置和尺寸" size="small" :bordered="false">
        <n-form size="small" label-placement="left" label-width="50">
          <n-grid :cols="2" :x-gap="8">
            <n-gi>
              <n-form-item label="X">
                <n-input-number
                  :value="selectedItem.position.x"
                  size="small"
                  :step="1"
                  @update:value="updatePosition('x', $event)"
                />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item label="Y">
                <n-input-number
                  :value="selectedItem.position.y"
                  size="small"
                  :step="1"
                  @update:value="updatePosition('y', $event)"
                />
              </n-form-item>
            </n-gi>
          </n-grid>

          <n-grid :cols="2" :x-gap="8">
            <n-gi>
              <n-form-item label="宽度">
                <n-input-number
                  :value="selectedItem.size.width"
                  size="small"
                  :step="1"
                  :min="selectedItem.constraints.minWidth"
                  :max="selectedItem.constraints.maxWidth"
                  @update:value="updateSize('width', $event)"
                />
              </n-form-item>
            </n-gi>
            <n-gi>
              <n-form-item label="高度">
                <n-input-number
                  :value="selectedItem.size.height"
                  size="small"
                  :step="1"
                  :min="selectedItem.constraints.minHeight"
                  :max="selectedItem.constraints.maxHeight"
                  @update:value="updateSize('height', $event)"
                />
              </n-form-item>
            </n-gi>
          </n-grid>

          <n-form-item label="层级">
            <n-input-number :value="selectedItem.zIndex" size="small" :step="1" :min="0" @update:value="updateZIndex" />
          </n-form-item>
        </n-form>
      </n-card>

      <!-- 组件特定属性 -->
      <component :is="getPropertyEditor(selectedItem)" :config="selectedItem.cardData.config" @update="updateConfig" />

      <!-- 通用属性 -->
      <n-card title="通用属性" size="small" :bordered="false" class="mt-2">
        <n-form size="small" label-placement="left" label-width="60">
          <n-form-item label="可见">
            <n-switch :value="selectedItem.visible" @update:value="updateVisible" />
          </n-form-item>
          <n-form-item label="锁定">
            <n-switch :value="selectedItem.locked" @update:value="updateLocked" />
          </n-form-item>
        </n-form>
      </n-card>
    </template>

    <!-- 无选中项时的提示 -->
    <n-empty v-else description="请选择一个组件" :style="{ marginTop: '100px' }">
      <template #icon>
        <n-icon size="48" :color="'var(--n-text-color-disabled)'">
          <div class="i-mdi-cursor-default-click" />
        </n-icon>
      </template>
    </n-empty>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useCanvasStore } from '@/components/panelv2/store/canvasStore'
import { getWidgetType } from '../utils/adapter'
import TextPropertyEditor from './property-editors/TextPropertyEditor.vue'
import ImagePropertyEditor from './property-editors/ImagePropertyEditor.vue'
import type { BaseCanvasItem } from '@/components/panelv2/types/core'

// 使用canvas store
const canvasStore = useCanvasStore()
const { selectedItems } = storeToRefs(canvasStore)

// 属性编辑器组件映射
const propertyEditors = {
  text: TextPropertyEditor,
  image: ImagePropertyEditor
}

// 计算属性
const selectedItem = computed(() => (selectedItems.value.length === 1 ? selectedItems.value[0] : null))

// 获取属性编辑器组件
const getPropertyEditor = (item: BaseCanvasItem) => {
  const widgetType = getWidgetType(item)
  return widgetType ? propertyEditors[widgetType] : null
}

// 更新位置
const updatePosition = (axis: 'x' | 'y', value: number | null) => {
  if (!selectedItem.value || value === null) return

  canvasStore.updateItem(selectedItem.value.id, {
    position: {
      ...selectedItem.value.position,
      [axis]: Math.max(0, value)
    }
  })
}

// 更新尺寸
const updateSize = (dimension: 'width' | 'height', value: number | null) => {
  if (!selectedItem.value || value === null) return

  const constraints = selectedItem.value.constraints
  const min = dimension === 'width' ? constraints.minWidth : constraints.minHeight
  const max = dimension === 'width' ? constraints.maxWidth : constraints.maxHeight

  let newValue = Math.max(min || 10, value)
  if (max) {
    newValue = Math.min(max, newValue)
  }

  canvasStore.updateItem(selectedItem.value.id, {
    size: {
      ...selectedItem.value.size,
      [dimension]: newValue
    }
  })
}

// 更新层级
const updateZIndex = (value: number | null) => {
  if (!selectedItem.value || value === null) return
  canvasStore.setItemZIndex(selectedItem.value.id, Math.max(0, value))
}

// 更新可见性
const updateVisible = (value: boolean) => {
  if (!selectedItem.value) return
  canvasStore.updateItem(selectedItem.value.id, { visible: value })
}

// 更新锁定状态
const updateLocked = (value: boolean) => {
  if (!selectedItem.value) return
  canvasStore.updateItem(selectedItem.value.id, { locked: value })
}

// 更新组件配置
const updateConfig = (configUpdates: Record<string, any>) => {
  if (!selectedItem.value) return

  canvasStore.updateItem(selectedItem.value.id, {
    cardData: {
      ...selectedItem.value.cardData,
      config: {
        ...selectedItem.value.cardData.config,
        ...configUpdates
      }
    }
  })
}
</script>

<style scoped>
.property-panel {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
}

/* 表单样式优化 */
:deep(.n-form-item) {
  margin-bottom: 12px;
}

:deep(.n-form-item-label) {
  font-size: 12px;
}

/* 自定义滚动条 */
.property-panel::-webkit-scrollbar {
  width: 4px;
}

.property-panel::-webkit-scrollbar-track {
  background: transparent;
}

.property-panel::-webkit-scrollbar-thumb {
  background: rgba(156, 163, 175, 0.3);
  border-radius: 2px;
}

.property-panel::-webkit-scrollbar-thumb:hover {
  background: rgba(156, 163, 175, 0.5);
}

/* 卡片间距 */
.n-card + .n-card {
  margin-top: 8px;
}
</style>
