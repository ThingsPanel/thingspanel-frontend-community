<!--
  可视化大屏渲染器专用工具栏
  包含缩放、平移、适应内容等可视化特有的工具
-->
<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NIcon, NTooltip, NSlider, NSpace, NInputNumber } from 'naive-ui'
import { useThemeStore } from '@/store/modules/theme'
import { 
  ExpandOutline,
  ContractOutline, 
  RemoveOutline,
  AddOutline,
  RefreshOutline,
  OptionsOutline,
  ArrowForwardOutline,
  GridOutline
} from '@vicons/ionicons5'

interface VisualizationConfig {
  zoom: number
  gridSize: number
  showRuler: boolean
  showGuides: boolean
  snapToGrid: boolean
}

interface Props {
  config?: Partial<VisualizationConfig>
  readonly?: boolean
}

interface Emits {
  (e: 'zoom-in'): void
  (e: 'zoom-out'): void
  (e: 'reset-zoom'): void
  (e: 'fit-content'): void
  (e: 'center-view'): void
  (e: 'config-change', config: Partial<VisualizationConfig>): void
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
  readonly: false
})

const emit = defineEmits<Emits>()

// 默认配置
const defaultConfig: VisualizationConfig = {
  zoom: 100,
  gridSize: 20,
  showRuler: true,
  showGuides: true,
  snapToGrid: true
}

// 当前配置
const currentConfig = computed(() => ({
  ...defaultConfig,
  ...props.config
}))

// 主题支持
const themeStore = useThemeStore()
const borderColor = computed(() => 
  themeStore.isDark ? 'rgba(75, 85, 99, 0.6)' : 'rgba(229, 231, 235, 1)'
)

// 缩放级别选项
const zoomLevels = [25, 50, 75, 100, 125, 150, 200, 300, 400]

// 事件处理
const handleZoomIn = () => emit('zoom-in')
const handleZoomOut = () => emit('zoom-out')
const handleResetZoom = () => emit('reset-zoom')
const handleFitContent = () => emit('fit-content')
const handleCenterView = () => emit('center-view')

const updateConfig = (key: keyof VisualizationConfig, value: any) => {
  emit('config-change', { [key]: value })
}

// 设置具体缩放级别
const setZoomLevel = (level: number) => {
  updateConfig('zoom', level)
}
</script>

<template>
  <div 
    class="visualization-toolbar flex items-center gap-2"
    :style="{ '--border-color': borderColor }"
  >
    <!-- 视图控制 -->
    <div class="flex items-center gap-1">
      <!-- 适应内容 -->
      <NTooltip>
        <template #trigger>
          <NButton
            size="small"
            @click="handleFitContent"
          >
            <NIcon>
              <ExpandOutline />
            </NIcon>
          </NButton>
        </template>
        适应内容
      </NTooltip>

      <!-- 居中视图 -->
      <NTooltip>
        <template #trigger>
          <NButton
            size="small"
            @click="handleCenterView"
          >
            <NIcon>
              <ContractOutline />
            </NIcon>
          </NButton>
        </template>
        居中视图
      </NTooltip>

      <div class="w-px h-4 mx-1" style="background-color: var(--border-color);"></div>
    </div>

    <!-- 缩放控制 -->
    <div class="flex items-center gap-1">
      <!-- 缩小 -->
      <NTooltip>
        <template #trigger>
          <NButton
            size="small"
            :disabled="currentConfig.zoom <= 25"
            @click="handleZoomOut"
          >
            <NIcon>
              <RemoveOutline />
            </NIcon>
          </NButton>
        </template>
        缩小 (Ctrl+-)
      </NTooltip>

      <!-- 缩放级别显示和选择 -->
      <div class="zoom-control flex items-center">
        <NInputNumber
          :value="currentConfig.zoom"
          :min="25"
          :max="400"
          :step="25"
          size="small"
          style="width: 70px"
          @update:value="(val: number) => setZoomLevel(val)"
        >
          <template #suffix>%</template>
        </NInputNumber>
      </div>

      <!-- 放大 -->
      <NTooltip>
        <template #trigger>
          <NButton
            size="small"
            :disabled="currentConfig.zoom >= 400"
            @click="handleZoomIn"
          >
            <NIcon>
              <AddOutline />
            </NIcon>
          </NButton>
        </template>
        放大 (Ctrl++)
      </NTooltip>

      <!-- 重置缩放 -->
      <NTooltip>
        <template #trigger>
          <NButton
            size="small"
            @click="handleResetZoom"
          >
            <NIcon>
              <RefreshOutline />
            </NIcon>
          </NButton>
        </template>
        重置缩放 (Ctrl+0)
      </NTooltip>

      <div class="w-px h-4 mx-1" style="background-color: var(--border-color);"></div>
    </div>

    <!-- 辅助工具 -->
    <div class="flex items-center gap-1">
      <!-- 显示标尺 -->
      <NTooltip>
        <template #trigger>
          <NButton
            size="small"
            :type="currentConfig.showRuler ? 'primary' : 'default'"
            :disabled="readonly"
            @click="updateConfig('showRuler', !currentConfig.showRuler)"
          >
            <NIcon>
              <OptionsOutline />
            </NIcon>
          </NButton>
        </template>
        {{ currentConfig.showRuler ? '隐藏' : '显示' }}标尺
      </NTooltip>

      <!-- 显示参考线 -->
      <NTooltip>
        <template #trigger>
          <NButton
            size="small"
            :type="currentConfig.showGuides ? 'primary' : 'default'"
            :disabled="readonly"
            @click="updateConfig('showGuides', !currentConfig.showGuides)"
          >
            <NIcon>
              <ArrowForwardOutline />
            </NIcon>
          </NButton>
        </template>
        {{ currentConfig.showGuides ? '隐藏' : '显示' }}参考线
      </NTooltip>

      <!-- 网格对齐 -->
      <NTooltip>
        <template #trigger>
          <NButton
            size="small"
            :type="currentConfig.snapToGrid ? 'primary' : 'default'"
            :disabled="readonly"
            @click="updateConfig('snapToGrid', !currentConfig.snapToGrid)"
          >
            <NIcon>
              <GridOutline />
            </NIcon>
          </NButton>
        </template>
        {{ currentConfig.snapToGrid ? '关闭' : '开启' }}网格对齐
      </NTooltip>
    </div>
  </div>
</template>

<style scoped>
.visualization-toolbar {
  padding: 0 8px;
  border-left: 1px solid var(--border-color);
  transition: border-color 0.3s ease;
}

.zoom-control {
  min-width: 80px;
}
</style>