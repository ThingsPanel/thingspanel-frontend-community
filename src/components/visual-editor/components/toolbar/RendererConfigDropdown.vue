<!--
  渲染器配置下拉面板
  替代弹窗方案，提供更流畅的交互体验
-->
<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  NForm,
  NFormItem,
  NInputNumber,
  NSwitch,
  NColorPicker,
  NSlider,
  NSelect,
  NDivider,
  NSpace,
  NCard,
  useThemeVars
} from 'naive-ui'
import { $t } from '@/locales'

/**
 * 组件属性接口
 */
interface Props {
  // 显示状态
  show: boolean
  // 当前渲染器类型
  currentRenderer: string
  // 配置数据
  canvasConfig?: Record<string, any>
  gridstackConfig?: Record<string, any>
  visualizationConfig?: Record<string, any>
}

/**
 * 组件事件接口
 */
interface Emits {
  // 配置变更事件
  (e: 'canvas-config-change', config: Record<string, any>): void
  (e: 'gridstack-config-change', config: Record<string, any>): void
  (e: 'visualization-config-change', config: Record<string, any>): void
}

const props = withDefaults(defineProps<Props>(), {
  canvasConfig: () => ({}),
  gridstackConfig: () => ({}),
  visualizationConfig: () => ({})
})

const emit = defineEmits<Emits>()

// 主题变量
const themeVars = useThemeVars()

// 渲染器类型判断
const isCanvasRenderer = computed(() => props.currentRenderer === 'canvas')
const isGridstackRenderer = computed(() => props.currentRenderer === 'gridstack')
const isVisualizationRenderer = computed(() => props.currentRenderer === 'visualization')

// 计算配置对象
const canvasConfig = computed(() => ({
  width: 1200,
  height: 800,
  showGrid: true,
  backgroundColor: '#f5f5f5',
  gridSize: 20,
  ...props.canvasConfig
}))

const gridstackConfig = computed(() => ({
  colNum: 24, // 🔥 修复：统一默认为24列
  rowHeight: 80,
  // 🔥 使用新的 gap 配置
  horizontalGap: 0, // 水平间距默认 0px
  verticalGap: 0, // 垂直间距默认 0px
  // 保留 margin 以保持向后兼容，但不再使用
  margin: [0, 0],
  isDraggable: true,
  isResizable: true,
  staticGrid: false,
  ...props.gridstackConfig
}))

const visualizationConfig = computed(() => ({
  theme: 'default',
  animation: true,
  responsive: true,
  ...props.visualizationConfig
}))

// 配置选项
// 12的倍数列数选项
const columnOptions = [
  { label: '12列', value: 12 },
  { label: '24列', value: 24 },
  { label: '36列', value: 36 },
  { label: '48列', value: 48 },
  { label: '60列', value: 60 },
  { label: '72列', value: 72 },
  { label: '84列', value: 84 },
  { label: '96列', value: 96 }
]

// 行高已改为滑块控制，不再需要选项数组

const themeOptions = [
  { label: $t('visualEditor.defaultTheme'), value: 'default' },
  { label: $t('visualEditor.darkTheme'), value: 'dark' },
  { label: $t('visualEditor.lightTheme'), value: 'light' }
]

// 配置变更处理
const handleCanvasConfigChange = (config: Record<string, any>) => {
  emit('canvas-config-change', config)
}

const handleGridstackConfigChange = (config: Record<string, any>) => {
  emit('gridstack-config-change', config)
}

const handleVisualizationConfigChange = (config: Record<string, any>) => {
  emit('visualization-config-change', config)
}
</script>

<template>
  <Transition name="dropdown-fade">
    <div v-if="show" class="config-dropdown" @click.stop>
      <NCard class="config-panel" :bordered="true" size="small">
        <!-- Canvas 配置 -->
        <div v-if="isCanvasRenderer" class="config-section">
          <h4 class="section-title">{{ $t('visualEditor.canvasConfig') }}</h4>
          <NForm label-placement="left" label-width="80px" size="small">
            <NFormItem :label="$t('visualEditor.canvasWidth')">
              <NInputNumber
                :value="canvasConfig.width"
                :min="800"
                :max="4000"
                :step="100"
                size="small"
                style="width: 80px"
                @update:value="value => handleCanvasConfigChange({ ...canvasConfig, width: value })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.canvasHeight')">
              <NInputNumber
                :value="canvasConfig.height"
                :min="600"
                :max="3000"
                :step="100"
                size="small"
                style="width: 80px"
                @update:value="value => handleCanvasConfigChange({ ...canvasConfig, height: value })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.showGrid')">
              <NSwitch
                :value="canvasConfig.showGrid"
                size="small"
                @update:value="value => handleCanvasConfigChange({ ...canvasConfig, showGrid: value })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.backgroundColor')">
              <NColorPicker
                :value="canvasConfig.backgroundColor"
                size="small"
                @update:value="value => handleCanvasConfigChange({ ...canvasConfig, backgroundColor: value })"
              />
            </NFormItem>
          </NForm>
        </div>

        <!-- Gridstack 配置 -->
        <div v-else-if="isGridstackRenderer" class="config-section">
          <h4 class="section-title">{{ $t('visualEditor.gridConfig') }}</h4>
          <NForm label-placement="left" label-width="80px" size="small">
            <NFormItem :label="$t('visualEditor.columns')">
              <NSelect
                :value="gridstackConfig.colNum"
                :options="columnOptions"
                size="small"
                style="width: 80px"
                @update:value="value => handleGridstackConfigChange({ ...gridstackConfig, colNum: value })"
              />
            </NFormItem>

            <NFormItem :label="`${$t('visualEditor.rowHeight')} ${gridstackConfig.rowHeight}px`">
              <NSlider
                :value="gridstackConfig.rowHeight"
                :min="25"
                :max="200"
                :step="5"
                style="width: 120px"
                @update:value="value => handleGridstackConfigChange({ ...gridstackConfig, rowHeight: value })"
              />
            </NFormItem>

            <NFormItem :label="`${$t('visualEditor.horizontalMargin')} ${gridstackConfig.horizontalGap}px`">
              <NSlider
                :value="gridstackConfig.horizontalGap"
                :min="0"
                :max="50"
                :step="2"
                style="width: 120px"
                @update:value="value => handleGridstackConfigChange({ ...gridstackConfig, horizontalGap: value })"
              />
            </NFormItem>

            <NFormItem :label="`${$t('visualEditor.verticalMargin')} ${gridstackConfig.verticalGap}px`">
              <NSlider
                :value="gridstackConfig.verticalGap"
                :min="0"
                :max="50"
                :step="2"
                style="width: 120px"
                @update:value="value => handleGridstackConfigChange({ ...gridstackConfig, verticalGap: value })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.draggable')">
              <NSwitch
                :value="gridstackConfig.isDraggable"
                size="small"
                @update:value="value => handleGridstackConfigChange({ ...gridstackConfig, isDraggable: value })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.resizable')">
              <NSwitch
                :value="gridstackConfig.isResizable"
                size="small"
                @update:value="value => handleGridstackConfigChange({ ...gridstackConfig, isResizable: value })"
              />
            </NFormItem>
          </NForm>
        </div>

        <!-- 可视化配置 -->
        <div v-else-if="isVisualizationRenderer" class="config-section">
          <h4 class="section-title">{{ $t('visualEditor.visualizationConfig') }}</h4>
          <NForm label-placement="left" label-width="80px" size="small">
            <NFormItem :label="$t('visualEditor.theme')">
              <NSelect
                :value="visualizationConfig.theme"
                :options="themeOptions"
                size="small"
                style="width: 80px"
                @update:value="value => handleVisualizationConfigChange({ ...visualizationConfig, theme: value })"
              />
            </NFormItem>

            <NFormItem :label="$t('visualEditor.animation')">
              <NSwitch
                :value="visualizationConfig.animation"
                size="small"
                @update:value="value => handleVisualizationConfigChange({ ...visualizationConfig, animation: value })"
              />
            </NFormItem>
          </NForm>
        </div>
      </NCard>
    </div>
  </Transition>
</template>

<style scoped>
/* 🎯 下拉面板容器 */
.config-dropdown {
  position: absolute;
  top: 100%;
  right: 16px;
  z-index: 1000;
  min-width: 240px;
  max-width: 300px;
  margin-top: 8px;
}

/* 🎨 配置面板样式 - 78%透明 */
.config-panel {
  /* 78%透明背景 */
  background: rgba(255, 255, 255, 0.78) !important;

  /* 阴影和边框 */
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
  border: 1px solid var(--border-color) !important;
  border-radius: 12px !important;
}

/* 📝 配置区块 */
.config-section {
  padding: 16px;
}

.section-title {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding-bottom: 8px;
  opacity: 0.9;
}

[data-theme='dark'] .section-title {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

/* 📋 表单单行布局 */
.form-row {
  margin-bottom: 16px;
}

.form-row .n-form-item {
  margin-bottom: 12px;
  width: 100%;
}

/* 🎭 过渡动画 */
.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: top right;
}

.dropdown-fade-enter-from {
  opacity: 0;
  transform: scale(0.95) translateY(-8px);
}

.dropdown-fade-leave-to {
  opacity: 0;
  transform: scale(0.95) translateY(-8px);
}

/* 📱 响应式处理 */
@media (max-width: 768px) {
  .config-dropdown {
    right: 8px;
    left: 8px;
    min-width: auto;
    max-width: none;
  }

  .form-row {
    flex-direction: column;
    gap: 8px;
  }

  .form-row .n-form-item {
    width: 100%;
  }
}

/* 🌙 深色主题适配 - 78%透明 */
[data-theme='dark'] .config-panel {
  background: rgba(42, 42, 45, 0.78) !important;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
}
</style>
