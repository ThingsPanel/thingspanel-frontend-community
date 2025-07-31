<!--
  公共工具栏组件
  包含所有渲染器都需要的通用工具
-->
<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NSelect, NSwitch, NIcon, NTooltip, useThemeVars } from 'naive-ui'
import { 
  ArrowUndoOutline, 
  ArrowRedoOutline, 
  SaveOutline, 
  RefreshOutline,
  SettingsOutline 
} from '@vicons/ionicons5'
import { useCanvasStore } from '../store/canvasStore'

interface Props {
  mode: 'edit' | 'preview'
  currentRenderer: string
  availableRenderers: Array<{ value: string; label: string; icon: string }>
  readonly?: boolean
  isSaving?: boolean
  showRendererConfig?: boolean
}

interface Emits {
  (e: 'mode-change', mode: 'edit' | 'preview'): void
  (e: 'renderer-change', rendererId: string): void
  (e: 'save'): void
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'reset'): void
  (e: 'toggle-renderer-config'): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  isSaving: false,
  showRendererConfig: false
})

const emit = defineEmits<Emits>()
const canvasStore = useCanvasStore()

// 主题颜色 - 使用Naive UI主题系统
const themeVars = useThemeVars()
const themeColors = computed(() => ({
  '--toolbar-bg': themeVars.value.bodyColor,
  '--toolbar-border': themeVars.value.dividerColor,
  '--divider-color': themeVars.value.dividerColor
}))

// 计算属性
const isEditMode = computed(() => props.mode === 'edit')
const currentModeValue = computed({
  get: () => props.mode,
  set: (value: 'edit' | 'preview') => emit('mode-change', value)
})

const currentRendererValue = computed({
  get: () => props.currentRenderer,
  set: (value: string) => emit('renderer-change', value)
})

// 事件处理
const handleSave = () => emit('save')
const handleUndo = () => emit('undo')
const handleRedo = () => emit('redo')
const handleReset = () => emit('reset')
const handleToggleRendererConfig = () => emit('toggle-renderer-config')
</script>

<template>
  <div class="common-toolbar flex items-center gap-3" :style="themeColors">
    <!-- 左侧：模式和渲染器选择 -->
    <div class="flex items-center gap-2">
      <!-- 模式切换 -->
      <NTooltip>
        <template #trigger>
          <NSwitch
            v-model:value="currentModeValue"
            :disabled="readonly"
            true-value="edit"
            false-value="preview"
          >
            <template #checked>编辑</template>
            <template #unchecked>预览</template>
          </NSwitch>
        </template>
        切换编辑/预览模式
      </NTooltip>

      <!-- 渲染器选择 -->
      <NSelect
        v-model:value="currentRendererValue"
        :options="availableRenderers"
        :disabled="readonly || !isEditMode"
        style="width: 120px"
        size="small"
      />
    </div>

    <!-- 中间：操作工具 -->
    <div class="flex items-center gap-1 ">
      <!-- 撤销 -->
      <NTooltip>
        <template #trigger>
          <NButton
            size="small"
            :disabled="!canvasStore.canUndo || readonly"
            @click="handleUndo"
          >
            <NIcon>
              <ArrowUndoOutline />
            </NIcon>
          </NButton>
        </template>
        撤销 (Ctrl+Z)
      </NTooltip>

      <!-- 重做 -->
      <NTooltip>
        <template #trigger>
          <NButton
            size="small"
            :disabled="!canvasStore.canRedo || readonly"
            @click="handleRedo"
          >
            <NIcon>
              <ArrowRedoOutline />
            </NIcon>
          </NButton>
        </template>
        重做 (Ctrl+Y)
      </NTooltip>

      <div class="w-px h-4 mx-1" style="background-color: var(--divider-color);"></div>

      <!-- 保存 -->
      <NTooltip>
        <template #trigger>
          <NButton
            size="small"
            type="primary"
            :disabled="readonly || isSaving"
            :loading="isSaving"
            @click="handleSave"
          >
            <NIcon v-if="!isSaving">
              <SaveOutline />
            </NIcon>
          </NButton>
        </template>
        {{ isSaving ? '保存中...' : '保存面板 (Ctrl+S)' }}
      </NTooltip>

      <!-- 重置 -->
      <NTooltip>
        <template #trigger>
          <NButton
            size="small"
            :disabled="readonly"
            @click="handleReset"
          >
            <NIcon>
              <RefreshOutline />
            </NIcon>
          </NButton>
        </template>
        重置面板
      </NTooltip>

      <div class="w-px h-4 mx-1" style="background-color: var(--divider-color);"></div>

      <!-- 渲染器配置 -->
      <NTooltip>
        <template #trigger>
          <NButton
            size="small"
            :disabled="readonly || !isEditMode"
            :type="showRendererConfig ? 'primary' : 'default'"
            @click="handleToggleRendererConfig"
          >
            <NIcon>
              <SettingsOutline />
            </NIcon>
          </NButton>
        </template>
        渲染器配置
      </NTooltip>
    </div>
  </div>
</template>

<style scoped>
.common-toolbar {
  height: 40px;
  padding: 0 12px;
  background-color: var(--toolbar-bg);
  border-bottom: 1px solid var(--toolbar-border);
  transition: background-color 0.3s ease, border-color 0.3s ease;
}
</style>