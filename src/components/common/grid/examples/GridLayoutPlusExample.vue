<!--
  Grid Layout Plus 使用示例
  展示如何使用新的 Grid Layout Plus 组件
-->
<template>
  <div class="grid-layout-plus-example">
    <div class="example-header">
      <h2>Grid Layout Plus 示例</h2>
      <div class="example-controls">
        <n-space>
          <n-button @click="addRandomItem">添加项目</n-button>
          <n-button @click="compactLayout">紧凑布局</n-button>
          <n-button type="error" @click="clearAll">清空</n-button>
          <n-button @click="toggleReadonly">
            {{ readonly ? '启用编辑' : '只读模式' }}
          </n-button>
          <n-button @click="toggleGrid">
            {{ showGrid ? '隐藏网格' : '显示网格' }}
          </n-button>
        </n-space>
      </div>
    </div>

    <div class="example-stats">
      <n-card size="small">
        <n-space>
          <n-statistic label="项目数量" :value="layoutStats.totalItems" />
          <n-statistic label="总行数" :value="layoutStats.totalRows" />
          <n-statistic label="利用率" :value="layoutStats.utilization" suffix="%" />
          <n-statistic label="已选择" :value="selectedItems.length" />
        </n-space>
      </n-card>
    </div>

    <div class="example-content">
      <GridLayoutPlus
        v-model:layout="layout"
        :readonly="readonly"
        :show-grid="showGrid"
        :show-drop-zone="!readonly"
        :config="gridConfig"
        @layout-change="handleLayoutChange"
        @item-add="handleItemAdd"
        @item-delete="handleItemDelete"
        @item-edit="handleItemEdit"
        @item-move="handleItemMove"
        @item-resize="handleItemResize"
        @breakpoint-changed="handleBreakpointChange"
      >
        <template #default="{ item, readonly }">
          <div class="custom-item-content">
            <div v-if="!readonly" class="item-drag-handle">
              <n-icon :size="16">
                <Menu />
              </n-icon>
            </div>

            <div class="item-main-content">
              <div class="item-title">{{ item.title || item.type }}</div>
              <div class="item-info">
                <div>位置: {{ item.x }}, {{ item.y }}</div>
                <div>大小: {{ item.w }} × {{ item.h }}</div>
              </div>

              <!-- 根据类型渲染不同内容 -->
              <div class="item-body">
                <div v-if="item.type === 'chart'" class="chart-placeholder">📊 图表组件</div>
                <div v-else-if="item.type === 'text'" class="text-placeholder">📝 文本组件</div>
                <div v-else-if="item.type === 'image'" class="image-placeholder">🖼️ 图片组件</div>
                <div v-else class="default-placeholder">📦 {{ item.type || '默认组件' }}</div>
              </div>
            </div>
          </div>
        </template>
      </GridLayoutPlus>
    </div>

    <div class="example-actions">
      <n-card title="操作面板" size="small">
        <n-space vertical>
          <n-space>
            <n-button :disabled="!canUndo" @click="undo">撤销</n-button>
            <n-button :disabled="!canRedo" @click="redo">重做</n-button>
          </n-space>

          <n-space>
            <n-button @click="selectAll">全选</n-button>
            <n-button @click="clearSelection">清除选择</n-button>
            <n-button :disabled="!hasSelectedItems" type="error" @click="deleteSelected">删除选中</n-button>
          </n-space>

          <n-space>
            <n-button @click="exportLayout">导出布局</n-button>
            <n-upload :show-file-list="false" accept=".json" @before-upload="importLayout">
              <n-button>导入布局</n-button>
            </n-upload>
          </n-space>
        </n-space>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NSpace, NCard, NStatistic, NIcon, NUpload, useMessage } from 'naive-ui'
import { Menu } from '@vicons/ionicons5'
import {
  GridLayoutPlus,
  useGridLayoutPlus,
  type GridLayoutPlusItem,
  type GridLayoutPlusConfig
} from '../gridLayoutPlusIndex'

const message = useMessage()

// 初始布局数据
const initialLayout: GridLayoutPlusItem[] = [
  {
    i: 'item-1',
    x: 0,
    y: 0,
    w: 3,
    h: 2,
    type: 'chart',
    title: '销售图表'
  },
  {
    i: 'item-2',
    x: 3,
    y: 0,
    w: 2,
    h: 1,
    type: 'text',
    title: '文本模块'
  },
  {
    i: 'item-3',
    x: 5,
    y: 0,
    w: 4,
    h: 2,
    type: 'image',
    title: '图片展示'
  }
]

// 网格配置
const gridConfig: Partial<GridLayoutPlusConfig> = {
  colNum: 12,
  rowHeight: 80,
  margin: [10, 10],
  isDraggable: true,
  isResizable: true,
  responsive: false,
  preventCollision: false
}

// 使用Grid Layout Plus Hook
const {
  layout,
  selectedItems,
  layoutStats,
  canUndo,
  canRedo,
  hasSelectedItems,
  addItem,
  clearLayout,
  selectAllItems,
  clearSelection,
  deleteSelectedItems,
  compactCurrentLayout,
  undo,
  redo,
  exportCurrentLayout,
  importLayout: importLayoutFromHook
} = useGridLayoutPlus({
  initialLayout,
  config: gridConfig,
  enableHistory: true,
  autoSave: true,
  onSave: layout => {}
})

// 组件状态
const readonly = ref(false)
const showGrid = ref(true)

// 项目类型列表
const itemTypes = ['chart', 'text', 'image', 'table', 'button']

// 方法
const addRandomItem = () => {
  const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)]
  const result = addItem(randomType, {
    title: `${randomType} ${Date.now()}`,
    w: Math.floor(Math.random() * 3) + 2,
    h: Math.floor(Math.random() * 2) + 1
  })

  if (result.success) {
    message.success('项目添加成功')
  } else {
    message.error(result.message ?? '操作失败')
  }
}

const compactLayout = () => {
  compactCurrentLayout()
  message.success('布局已紧凑')
}

const clearAll = () => {
  const result = clearLayout()
  if (result.success) {
    message.success('布局已清空')
  }
}

const toggleReadonly = () => {
  readonly.value = !readonly.value
}

const toggleGrid = () => {
  showGrid.value = !showGrid.value
}

const selectAll = () => {
  selectAllItems()
  message.info(`已选择 ${selectedItems.value.length} 个项目`)
}

const deleteSelected = () => {
  const result = deleteSelectedItems()
  if (result.success) {
    message.success(result.message ?? '操作成功')
  }
}

const exportLayout = () => {
  const layoutJson = exportCurrentLayout()
  const blob = new Blob([layoutJson], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `grid-layout-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  message.success('布局已导出')
}

const importLayout = (options: any) => {
  const file = options.file.file
  const reader = new FileReader()

  reader.onload = e => {
    try {
      const layoutData = e.target?.result as string
      const result = importLayoutFromHook(layoutData)

      if (result.success) {
        message.success('布局导入成功')
      } else {
        message.error(result.message ?? '操作失败')
      }
    } catch (error) {
      message.error('布局导入失败')
    }
  }

  reader.readAsText(file)
  return false // 阻止默认上传
}

// 事件处理
const handleLayoutChange = (newLayout: GridLayoutPlusItem[]) => {}

const handleItemAdd = (item: GridLayoutPlusItem) => {
  message.success(`添加了项目: ${item.title || item.i}`)
}

const handleItemDelete = (itemId: string) => {
  message.warning(`删除了项目: ${itemId}`)
}

const handleItemEdit = (item: GridLayoutPlusItem) => {
  message.info(`编辑项目: ${item.title || item.i}`)
}

const handleItemMove = (itemId: string, x: number, y: number) => {}

const handleItemResize = (itemId: string, w: number, h: number) => {}

const handleBreakpointChange = (breakpoint: string) => {
  message.info(`断点切换到: ${breakpoint}`)
}
</script>

<style scoped>
.grid-layout-plus-example {
  padding: 20px;
  min-height: 100vh;
  background: #f5f5f5;
}

.example-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 20px;
}

.example-header h2 {
  margin: 0;
  color: #333;
}

.example-stats {
  margin-bottom: 20px;
}

.example-content {
  height: 500px;
  margin-bottom: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.example-actions {
  max-width: 300px;
}

/* 自定义项目内容样式 */
.custom-item-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.item-drag-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  background: #f0f0f0;
  cursor: move;
  border-bottom: 1px solid #e0e0e0;
}

.item-main-content {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
}

.item-title {
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 8px;
  color: #333;
}

.item-info {
  font-size: 12px;
  color: #666;
  margin-bottom: 12px;
}

.item-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder,
.text-placeholder,
.image-placeholder,
.default-placeholder {
  padding: 20px;
  border: 2px dashed #ddd;
  border-radius: 6px;
  text-align: center;
  color: #999;
  font-size: 16px;
  width: 100%;
}

.chart-placeholder {
  border-color: #3b82f6;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.text-placeholder {
  border-color: #10b981;
  color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.image-placeholder {
  border-color: #f59e0b;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.05);
}

/* 响应式 */
@media (max-width: 768px) {
  .example-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .example-content {
    height: 400px;
  }

  .custom-item-content {
    font-size: 12px;
  }

  .item-main-content {
    padding: 8px;
  }
}
</style>
