<!--
  看板渲染器专用工具栏
  包含网格配置、行高、间距等看板特有的工具
-->
<script setup lang="ts">
import { ref, computed } from 'vue'
import { NButton, NInputNumber, NSwitch, NIcon, NTooltip, NPopover, NSpace, NSlider } from 'naive-ui'
import { 
  GridOutline,
  EyeOutline,
  CopyOutline,
  ReorderThreeOutline
} from '@vicons/ionicons5'

import type { KanbanToolbarConfig } from './index'

interface Props {
  config?: Partial<KanbanToolbarConfig>
  readonly?: boolean
}

interface Emits {
  (e: 'config-change', config: Partial<KanbanToolbarConfig>): void
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({}),
  readonly: false
})

const emit = defineEmits<Emits>()

// 默认配置
const defaultConfig: KanbanToolbarConfig = {
  columns: 12,
  rowHeight: 60,
  margin: [10, 10],
  showGrid: true,
  enableSnap: true,
  compactType: 'vertical'
}

// 当前配置
const currentConfig = computed(() => ({
  ...defaultConfig,
  ...props.config
}))

// 配置修改处理
const updateConfig = (key: keyof KanbanToolbarConfig, value: any) => {
  console.log('KanbanToolbar: Config update:', key, '=', value)
  const configChange = { [key]: value }
  console.log('KanbanToolbar: Emitting config-change:', configChange)
  emit('config-change', configChange)
}

// 网格配置弹出框显示状态
const showGridConfig = ref(false)
</script>

<template>
  <div class="kanban-toolbar flex items-center gap-2">
    <!-- 网格设置弹出框 -->
    <NPopover
      v-model:show="showGridConfig"
      trigger="click"
      placement="bottom-start"
      :disabled="readonly"
    >
      <template #trigger>
        <NTooltip>
          <template #trigger>
            <NButton size="small" :disabled="readonly">
              <NIcon>
                <GridOutline />
              </NIcon>
            </NButton>
          </template>
          网格设置
        </NTooltip>
      </template>

      <div class="grid-config-panel p-4 w-80">
        <div class="text-sm font-medium mb-3">网格配置</div>
        
        <NSpace vertical size="medium">
          <!-- 列数设置 -->
          <div class="flex items-center justify-between">
            <span class="text-sm">列数:</span>
            <NInputNumber
              :value="currentConfig.columns"
              :min="1"
              :max="24"
              size="small"
              style="width: 80px"
              @update:value="(val: number) => updateConfig('columns', val)"
            />
          </div>

          <!-- 行高设置 -->
          <div class="flex items-center justify-between">
            <span class="text-sm">行高:</span>
            <NInputNumber
              :value="currentConfig.rowHeight"
              :min="30"
              :max="200"
              :step="10"
              size="small"
              style="width: 80px"
              @update:value="(val: number) => updateConfig('rowHeight', val)"
            />
          </div>

          <!-- 间距设置 -->
          <div class="space-y-2">
            <div class="text-sm">间距:</div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-500">水平:</span>
              <NSlider
                :value="currentConfig.margin[0]"
                :min="0"
                :max="50"
                style="width: 120px"
                @update:value="(val: number) => updateConfig('margin', [val, currentConfig.margin[1]])"
              />
              <span class="text-xs text-gray-500 w-8">{{ currentConfig.margin[0] }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-500">垂直:</span>
              <NSlider
                :value="currentConfig.margin[1]"
                :min="0"
                :max="50"
                style="width: 120px"
                @update:value="(val: number) => updateConfig('margin', [currentConfig.margin[0], val])"
              />
              <span class="text-xs text-gray-500 w-8">{{ currentConfig.margin[1] }}</span>
            </div>
          </div>

          <!-- 开关选项 -->
          <div class="flex items-center justify-between">
            <span class="text-sm">显示网格:</span>
            <NSwitch
              :value="currentConfig.showGrid"
              size="small"
              @update:value="(val: boolean) => updateConfig('showGrid', val)"
            />
          </div>

          <div class="flex items-center justify-between">
            <span class="text-sm">自动对齐:</span>
            <NSwitch
              :value="currentConfig.enableSnap"
              size="small"
              @update:value="(val: boolean) => updateConfig('enableSnap', val)"
            />
          </div>
        </NSpace>
      </div>
    </NPopover>

    <!-- 快捷显示网格开关 -->
    <NTooltip>
      <template #trigger>
        <NButton
          size="small"
          :type="currentConfig.showGrid ? 'primary' : 'default'"
          :disabled="readonly"
          @click="updateConfig('showGrid', !currentConfig.showGrid)"
        >
          <NIcon>
            <EyeOutline />
          </NIcon>
        </NButton>
      </template>
      {{ currentConfig.showGrid ? '隐藏' : '显示' }}网格线
    </NTooltip>

    <!-- 对齐开关 -->
    <NTooltip>
      <template #trigger>
        <NButton
          size="small"
          :type="currentConfig.enableSnap ? 'primary' : 'default'"
          :disabled="readonly"
          @click="updateConfig('enableSnap', !currentConfig.enableSnap)"
        >
          <NIcon>
            <CopyOutline />
          </NIcon>
        </NButton>
      </template>
      {{ currentConfig.enableSnap ? '关闭' : '开启' }}自动对齐
    </NTooltip>

    <!-- 紧凑模式切换 -->
    <NTooltip>
      <template #trigger>
        <NButton
          size="small"
          :type="currentConfig.compactType === 'vertical' ? 'primary' : 'default'"
          :disabled="readonly"
          @click="updateConfig('compactType', currentConfig.compactType === 'vertical' ? null : 'vertical')"
        >
          <NIcon>
            <ReorderThreeOutline />
          </NIcon>
        </NButton>
      </template>
      {{ currentConfig.compactType === 'vertical' ? '关闭' : '开启' }}垂直紧凑
    </NTooltip>
  </div>
</template>

<style scoped>
.kanban-toolbar {
  padding: 0 8px;
  border-left: 1px solid #e5e7eb;
}

.grid-config-panel {
  min-width: 280px;
}
</style>