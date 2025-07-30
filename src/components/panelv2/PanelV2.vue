<script setup lang="ts">
// PanelV2 主组件
// Main PanelV2 component for managing different renderers

import { ref, reactive, watch } from 'vue'
import type { BaseItem } from './renderers/base/types'
import type { GridConfig } from './renderers/grid/types'
// import { BaseRenderer } from './renderers/base/BaseRenderer' // 不再需要手动DOM操作
import BaseToolbar from './renderers/base/BaseToolbar.vue'
import PanelLayout from './layout/PanelLayout.vue'
import GridLayoutRenderer from './renderers/grid/GridLayoutRenderer.vue'
import CanvasRenderer from './renderers/canvas/index.vue'
import GridConfigForm from './renderers/grid/GridConfigForm.vue'
// import type { ExternalPanelData } from './renderers/adapters/GridAdapter' // unused
import { realGridData } from './renderers/adapters/mockData'

// Props定义
interface Props {
  panelId: string
  mode?: 'edit' | 'preview'
  /** 初始渲染器类型 */
  initialRenderer?: 'grid' | 'canvas'
  /** 面板项目列表 */
  items?: BaseItem[]
  /** 选中的项目ID列表 */
  selectedIds?: string[]
  /** 是否显示调试信息 */
  showDebug?: boolean
  /** 外部数据源 */
  externalData?: any
  /** 是否显示主工具栏 */
  showMainToolbar?: boolean
  /** 工具栏位置 */
  toolbarPosition?: 'top' | 'bottom' | 'left' | 'right'
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'edit',
  initialRenderer: 'grid',
  items: () => [],
  selectedIds: () => [],
  showDebug: false,
  externalData: null,
  showMainToolbar: true,
  toolbarPosition: 'top'
})

// Events定义
interface Events {
  /** 渲染器切换事件 */
  'renderer-change': [renderer: string]
  /** 项目选择事件 */
  'item-select': [itemId: string, selected: boolean]
  /** 项目更新事件 */
  'item-update': [itemId: string, data: Partial<BaseItem>]
  /** 项目删除事件 */
  'item-remove': [itemId: string]
  /** 项目添加事件 */
  'item-add': [item: BaseItem]
  /** 模式切换事件 */
  'mode-change': [mode: 'edit' | 'preview']
  /** 配置更新事件 */
  'config-update': [config: any]
  /** 数据导入事件 */
  'data-import': [data: any]
  /** 数据导出事件 */
  'data-export': []
}

const emit = defineEmits<Events>()

// 响应式状态
const currentRenderer = ref(props.initialRenderer)
const currentMode = ref(props.mode)
const currentSelectedIds = ref([...props.selectedIds])
const currentItems = ref([...props.items])
const showConfigPanel = ref(false)
const rendererInstance = ref<any>() // Vue组件实例

// 配置状态
const gridConfig = reactive<GridConfig>({
  columns: 12,
  rowHeight: 60,
  gap: 10,
  padding: 10,
  showGrid: true,
  enableSnap: true,
  snapThreshold: 5,
  minItemWidth: 100,
  minItemHeight: 60
})

// 使用真实的外部面板数据
const mockExternalData = reactive(realGridData)

// 数据测试模式开关
const useTestData = ref(true)

// 切换渲染器
const switchRenderer = () => {
  const newRenderer = currentRenderer.value === 'grid' ? 'canvas' : 'grid'
  currentRenderer.value = newRenderer
  emit('renderer-change', newRenderer)
}

// 切换测试数据模式
const toggleTestData = () => {
  useTestData.value = !useTestData.value
  console.log('PanelV2: 测试数据模式', useTestData.value ? '开启' : '关闭')
}

// 切换模式
const toggleMode = () => {
  currentMode.value = currentMode.value === 'edit' ? 'preview' : 'edit'
  emit('mode-change', currentMode.value)
}

// 配置管理
const handleConfigUpdate = (config: any) => {
  Object.assign(gridConfig, config)
  emit('config-update', config)
}

// 数据导入导出
const handleDataImport = (data: any) => {
  emit('data-import', data)
}

const handleDataExport = () => {
  emit('data-export')
}

// 项目管理
const handleItemSelect = (itemId: string, selected: boolean) => {
  if (selected) {
    if (!currentSelectedIds.value.includes(itemId)) {
      currentSelectedIds.value.push(itemId)
    }
  } else {
    const index = currentSelectedIds.value.indexOf(itemId)
    if (index > -1) {
      currentSelectedIds.value.splice(index, 1)
    }
  }
  emit('item-select', itemId, selected)
}

const handleItemUpdate = (itemId: string, data: Partial<BaseItem>) => {
  emit('item-update', itemId, data)
}

const handleItemRemove = (itemId: string) => {
  emit('item-remove', itemId)
}

const handleItemAdd = (item: BaseItem) => {
  emit('item-add', item)
}

// 监听props变化
watch(() => props.mode, (newMode) => {
  currentMode.value = newMode
})

watch(() => props.selectedIds, (newSelectedIds) => {
  currentSelectedIds.value = [...newSelectedIds]
})

watch(() => props.items, (newItems) => {
  currentItems.value = [...newItems]
})
</script>

<template>
  <div class="panel-v2 h-full w-full">
    <PanelLayout :mode="mode">
      <!-- 工具栏 - 渲染器切换和数据测试 -->
      <template #toolbar>
        <div class="flex items-center justify-between w-full">
          <h3 class="text-lg font-medium text-gray-900 dark:text-white">
            PanelV2 - {{ props.panelId }}
          </h3>
          <div class="flex items-center gap-3">
            <!-- 基础工具栏 -->
            <BaseToolbar
              v-if="showMainToolbar"
              :current-renderer="currentRenderer"
              :current-mode="currentMode"
              :show-debug="showDebug"
              @renderer-change="switchRenderer"
              @mode-change="toggleMode"
              @config-toggle="showConfigPanel = !showConfigPanel"
              @data-import="handleDataImport"
              @data-export="handleDataExport"
            />
            <!-- 测试数据开关 -->
            <button 
              :class="[
                'px-3 py-1 text-sm rounded transition-colors',
                useTestData 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              ]"
              @click="toggleTestData"
            >
              {{ useTestData ? '✓ 测试数据' : '✗ 测试数据' }}
            </button>
            <!-- 渲染器切换 -->
            <button 
              class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              @click="switchRenderer"
            >
              切换到{{ currentRenderer === 'grid' ? 'Canvas渲染器' : 'Grid渲染器' }}
            </button>
          </div>
        </div>
      </template>

      <!-- 左侧暂时空着 -->
      <template #left>
        <div class="p-4 text-gray-500">
          左侧组件库 - 待实现
        </div>
      </template>

      <!-- 中间渲染器区域 -->
      <template #main>
        <div class="h-full w-full">
          <!-- 动态渲染不同的渲染器 -->
          <GridLayoutRenderer 
            v-if="currentRenderer === 'grid'" 
            ref="rendererInstance"
            :mode="currentMode"
            :items="currentItems"
            :external-data="useTestData ? mockExternalData : props.externalData"
            :selected-ids="currentSelectedIds"
            :config="gridConfig"
            @item-select="handleItemSelect"
            @item-update="handleItemUpdate"
            @item-remove="handleItemRemove"
            @item-add="handleItemAdd"
          />
          <CanvasRenderer 
            v-else 
            ref="rendererInstance"
            :mode="currentMode"
            :items="currentItems"
            :external-data="useTestData ? mockExternalData : props.externalData"
            :selected-ids="currentSelectedIds"
            @item-select="handleItemSelect"
            @item-update="handleItemUpdate"
            @item-remove="handleItemRemove"
            @item-add="handleItemAdd"
          />
        </div>
      </template>

      <!-- 右侧配置面板 -->
      <template #right>
        <div class="p-4">
          <div v-if="!showConfigPanel" class="text-gray-500">
            右侧配置面板 - 待实现
          </div>
          <div v-else class="space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="text-lg font-medium text-gray-900 dark:text-white">
                {{ currentRenderer === 'grid' ? 'Grid配置' : 'Canvas配置' }}
              </h4>
              <button 
                class="text-gray-500 hover:text-gray-700"
                @click="showConfigPanel = false"
              >
                ✕
              </button>
            </div>
            <!-- Grid配置表单 -->
            <GridConfigForm
              v-if="currentRenderer === 'grid'"
              :config="gridConfig"
              @update="handleConfigUpdate"
            />
            <!-- Canvas配置表单 - 待实现 -->
            <div v-else class="text-gray-500">
              Canvas配置表单 - 待实现
            </div>
          </div>
        </div>
      </template>
    </PanelLayout>
  </div>
</template>

<style scoped>
.panel-v2 {
  font-family: var(--font-family);
}

.component-item:hover {
  transform: translateY(-1px);
}

.component-item:active {
  transform: rotate(5deg) scale(0.95);
}

.canvas-wrapper {
  height: 100%;
  width: 100%;
}
</style>