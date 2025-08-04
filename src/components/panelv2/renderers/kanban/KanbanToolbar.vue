<!--
  看板渲染器配置面板
  在浮层中显示，提供完整的看板配置选项
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NInputNumber, NSelect, NSwitch, NIcon, NTooltip, NSpace, NDivider, NCard } from 'naive-ui'
import { GridOutline, ResizeOutline, MagnetOutline, OptionsOutline } from '@vicons/ionicons5'
import { useThemeStore } from '@/store/modules/theme'

// 看板工具栏配置类型
export interface KanbanToolbarConfig {
  columns: number
  rowHeight: number
  margin: [number, number]
  showGrid: boolean
  enableSnap: boolean
  compactType: 'vertical' | 'horizontal' | null
  preventCollision: boolean
  enableDrag: boolean
  enableResize: boolean
}

interface Props {
  config: Partial<KanbanToolbarConfig>
  readonly?: boolean
}

interface Emits {
  (e: 'config-change', config: Partial<KanbanToolbarConfig>): void
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  config: () => ({
    columns: 12,
    rowHeight: 60,
    margin: [10, 10],
    showGrid: true,
    enableSnap: true,
    compactType: 'vertical',
    preventCollision: false,
    enableDrag: true,
    enableResize: true
  })
})

const emit = defineEmits<Emits>()

// 主题状态
const themeStore = useThemeStore()

// 动态主题颜色
const themeColors = computed(() => ({
  // 背景色
  panelBg: themeStore.isDark ? 'rgba(24, 24, 28, 0.7)' : 'rgba(255, 255, 255, 0.7)',
  sectionBg: themeStore.isDark ? 'rgba(32, 32, 36, 0.8)' : 'rgba(248, 249, 250, 0.8)',
  headerBg: themeStore.isDark ? 'rgba(28, 28, 32, 0.8)' : 'rgba(250, 250, 250, 0.8)',

  // 文字颜色
  primaryText: themeStore.isDark ? '#e5e7eb' : '#495057',
  secondaryText: themeStore.isDark ? '#9ca3af' : '#6b7280',
  labelText: themeStore.isDark ? '#d1d5db' : '#374151',

  // 边框颜色
  border: themeStore.isDark ? 'rgba(55, 65, 81, 0.4)' : 'rgba(226, 232, 240, 0.4)',
  sectionBorder: themeStore.isDark ? 'rgba(75, 85, 99, 0.6)' : 'rgba(233, 236, 239, 0.6)',
  itemBorder: themeStore.isDark ? 'rgba(55, 65, 81, 0.3)' : 'rgba(240, 240, 240, 0.8)'
}))

// 本地配置状态
const localConfig = ref<KanbanToolbarConfig>({
  columns: props.config.columns || 12,
  rowHeight: props.config.rowHeight || 60,
  margin: props.config.margin || [10, 10],
  showGrid: props.config.showGrid ?? true,
  enableSnap: props.config.enableSnap ?? true,
  compactType: props.config.compactType || 'vertical',
  preventCollision: props.config.preventCollision ?? false,
  enableDrag: props.config.enableDrag ?? true,
  enableResize: props.config.enableResize ?? true
})

// 紧凑类型选项
const compactTypeOptions = [
  { label: '垂直紧凑', value: 'vertical' },
  { label: '水平紧凑', value: 'horizontal' },
  { label: '无紧凑', value: null }
]

// 更新配置
const updateConfig = (key: keyof KanbanToolbarConfig, value: any) => {
  localConfig.value[key] = value
  emit('config-change', { ...localConfig.value })
}

// 更新边距
const updateMargin = (index: number, value: number) => {
  const newMargin = [...localConfig.value.margin] as [number, number]
  newMargin[index] = value
  updateConfig('margin', newMargin)
}

// 快速配置预设
const applyPreset = (preset: 'tight' | 'normal' | 'loose') => {
  const presets = {
    tight: {
      columns: 24,
      rowHeight: 40,
      margin: [5, 5] as [number, number],
      compactType: 'vertical' as const
    },
    normal: {
      columns: 12,
      rowHeight: 60,
      margin: [10, 10] as [number, number],
      compactType: 'vertical' as const
    },
    loose: {
      columns: 8,
      rowHeight: 80,
      margin: [20, 20] as [number, number],
      compactType: null
    }
  }

  const preset_config = presets[preset]
  Object.keys(preset_config).forEach(key => {
    updateConfig(key as keyof KanbanToolbarConfig, preset_config[key as keyof typeof preset_config])
  })
}
</script>

<template>
  <div
    class="kanban-config-panel"
    :style="{
      '--panel-bg': themeColors.panelBg,
      '--section-bg': themeColors.sectionBg,
      '--header-bg': themeColors.headerBg,
      '--primary-text': themeColors.primaryText,
      '--secondary-text': themeColors.secondaryText,
      '--label-text': themeColors.labelText,
      '--border': themeColors.border,
      '--section-border': themeColors.sectionBorder,
      '--item-border': themeColors.itemBorder
    }"
  >
    <!-- 配置内容 -->
    <div class="panel-content space-y-4">
      <!-- 快速预设 -->
      <div class="preset-section">
        <div class="text-xs font-medium mb-2" style="color: var(--primary-text)">快速预设</div>
        <NSpace size="small">
          <NButton size="tiny" :disabled="readonly" @click="applyPreset('tight')">紧凑</NButton>
          <NButton size="tiny" :disabled="readonly" @click="applyPreset('normal')">标准</NButton>
          <NButton size="tiny" :disabled="readonly" @click="applyPreset('loose')">宽松</NButton>
        </NSpace>
      </div>

      <NDivider size="small" />

      <!-- 网格配置 -->
      <div class="grid-section">
        <div class="text-xs font-medium mb-2" style="color: var(--primary-text)">网格设置</div>

        <!-- 列数 -->
        <div class="config-item">
          <span class="text-sm" style="color: var(--secondary-text)">列数:</span>
          <NInputNumber
            v-model:value="localConfig.columns"
            size="small"
            :min="1"
            :max="48"
            :disabled="readonly"
            style="width: 100px"
            @update:value="val => updateConfig('columns', val)"
          />
        </div>

        <!-- 行高 -->
        <div class="config-item">
          <span class="text-sm" style="color: var(--secondary-text)">行高:</span>
          <NInputNumber
            v-model:value="localConfig.rowHeight"
            size="small"
            :min="20"
            :max="200"
            :disabled="readonly"
            style="width: 100px"
            @update:value="val => updateConfig('rowHeight', val)"
          />
        </div>

        <!-- 边距 -->
        <div class="config-item" style="grid-column: 1 / -1">
          <div class="flex items-center gap-4">
            <span class="text-sm" style="color: var(--secondary-text)">边距:</span>
            <div class="flex gap-2 items-center">
              <span class="text-xs" style="color: var(--secondary-text)">X:</span>
              <NInputNumber
                :value="localConfig.margin[0]"
                size="small"
                :min="0"
                :max="50"
                :disabled="readonly"
                style="width: 80px"
                @update:value="val => updateMargin(0, val || 0)"
              />
              <span class="text-xs" style="color: var(--secondary-text)">Y:</span>
              <NInputNumber
                :value="localConfig.margin[1]"
                size="small"
                :min="0"
                :max="50"
                :disabled="readonly"
                style="width: 80px"
                @update:value="val => updateMargin(1, val || 0)"
              />
            </div>
          </div>
        </div>
      </div>

      <NDivider size="small" />

      <!-- 布局行为 -->
      <div class="layout-section">
        <div class="text-xs font-medium mb-2" style="color: var(--primary-text)">布局行为</div>

        <!-- 紧凑类型 -->
        <div class="config-item flex items-center justify-between mb-2">
          <span class="text-xs" style="color: var(--secondary-text)">紧凑:</span>
          <NSelect
            v-model:value="localConfig.compactType"
            size="tiny"
            :options="compactTypeOptions"
            :disabled="readonly"
            style="width: 120px"
            @update:value="val => updateConfig('compactType', val)"
          />
        </div>

        <!-- 防碰撞 -->
        <div class="config-item flex items-center justify-between mb-2">
          <span class="text-xs" style="color: var(--secondary-text)">防碰撞:</span>
          <NSwitch
            v-model:value="localConfig.preventCollision"
            size="small"
            :disabled="readonly"
            @update:value="val => updateConfig('preventCollision', val)"
          />
        </div>
      </div>

      <NDivider size="small" />

      <!-- 交互功能 -->
      <div class="interaction-section">
        <div class="text-xs font-medium mb-2" style="color: var(--primary-text)">交互功能</div>

        <!-- 显示网格 -->
        <div class="config-item flex items-center justify-between mb-2">
          <span class="text-xs" style="color: var(--secondary-text)">显示网格:</span>
          <NSwitch
            v-model:value="localConfig.showGrid"
            size="small"
            :disabled="readonly"
            @update:value="val => updateConfig('showGrid', val)"
          />
        </div>

        <!-- 启用吸附 -->
        <div class="config-item flex items-center justify-between mb-2">
          <span class="text-xs" style="color: var(--secondary-text)">启用吸附:</span>
          <NSwitch
            v-model:value="localConfig.enableSnap"
            size="small"
            :disabled="readonly"
            @update:value="val => updateConfig('enableSnap', val)"
          />
        </div>

        <!-- 启用拖拽 -->
        <div class="config-item flex items-center justify-between mb-2">
          <span class="text-xs" style="color: var(--secondary-text)">启用拖拽:</span>
          <NSwitch
            v-model:value="localConfig.enableDrag"
            size="small"
            :disabled="readonly"
            @update:value="val => updateConfig('enableDrag', val)"
          />
        </div>

        <!-- 启用调整大小 -->
        <div class="config-item flex items-center justify-between mb-2">
          <span class="text-xs" style="color: var(--secondary-text)">调整大小:</span>
          <NSwitch
            v-model:value="localConfig.enableResize"
            size="small"
            :disabled="readonly"
            @update:value="val => updateConfig('enableResize', val)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 看板配置面板 - 支持主题切换 */
.kanban-config-panel {
  width: 100%;
  background-color: var(--panel-bg) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border: 1px solid var(--border) !important;
  border-radius: 8px;
  padding: 16px;
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease;
}

.panel-header {
  background: var(--header-bg);
  transition: background-color 0.3s ease;
}

.panel-content {
  font-size: 14px;
  color: var(--label-text);
  transition: color 0.3s ease;
}

.config-item {
  min-height: 32px;
}

/* 配置区域样式 - 支持主题切换 */
.preset-section,
.grid-section,
.layout-section,
.interaction-section {
  background: var(--section-bg);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--section-border);
  margin-bottom: 16px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease;
}

/* 区域标题样式 - 支持主题切换 */
.preset-section .text-xs,
.grid-section .text-xs,
.layout-section .text-xs,
.interaction-section .text-xs {
  font-size: 13px;
  font-weight: 600;
  color: var(--primary-text) !important;
  margin-bottom: 12px;
  transition: color 0.3s ease;
}

/* 在模态弹窗中的布局优化 */
.grid-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: center;
}

.grid-section .text-xs {
  grid-column: 1 / -1;
  margin-bottom: 12px;
}

.grid-section .config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 配置项样式 - 支持主题切换 */
.layout-section .config-item,
.interaction-section .config-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--item-border);
  transition: border-color 0.3s ease;
}

.layout-section .config-item:last-child,
.interaction-section .config-item:last-child {
  border-bottom: none;
}

/* 配置项标签文字颜色 - 支持主题切换 */
.config-item .text-sm,
.config-item .text-xs {
  color: var(--secondary-text) !important;
  transition: color 0.3s ease;
}

/* 快速预设按钮样式优化 */
.preset-section {
  text-align: center;
}

.preset-section .n-space {
  justify-content: center;
}
</style>
