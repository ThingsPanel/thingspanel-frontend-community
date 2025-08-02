<template>
  <div class="grid-demo-page">
    <!-- 页面头部 -->
    <div class="demo-header">
      <n-page-header title="DraggableResizableGrid 组件测试" subtitle="基础功能验证和压力测试">
        <template #extra>
          <n-space>
            <n-button type="primary" @click="addRandomItem">
              <template #icon>
                <n-icon><div class="i-mdi-plus" /></n-icon>
              </template>
              添加项目
            </n-button>
            <n-button @click="clearAllItems">
              <template #icon>
                <n-icon><div class="i-mdi-delete-sweep" /></n-icon>
              </template>
              清空所有
            </n-button>
            <n-button @click="exportLayout">
              <template #icon>
                <n-icon><div class="i-mdi-export" /></n-icon>
              </template>
              导出布局
            </n-button>
          </n-space>
        </template>
      </n-page-header>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <n-card title="配置控制" size="small">
        <n-grid :cols="4" :x-gap="12">
          <n-gi>
            <n-form-item label="列数">
              <n-input-number v-model:value="gridConfig.columns" :min="6" :max="24" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="行高">
              <n-input-number v-model:value="gridConfig.rowHeight" :min="60" :max="200" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="间距">
              <n-input-number v-model:value="gridConfig.gap" :min="0" :max="20" />
            </n-form-item>
          </n-gi>
          <n-gi>
            <n-form-item label="碰撞策略">
              <n-select v-model:value="gridConfig.collision" :options="collisionOptions" />
            </n-form-item>
          </n-gi>
        </n-grid>
        
        <n-space class="mt-3">
          <n-switch v-model:value="gridConfig.showGrid">
            <template #checked>显示网格</template>
            <template #unchecked>隐藏网格</template>
          </n-switch>
          <n-switch v-model:value="gridConfig.readonly">
            <template #checked>只读模式</template>
            <template #unchecked>编辑模式</template>
          </n-switch>
        </n-space>
      </n-card>
    </div>

    <!-- 网格容器 -->
    <div class="grid-container">
      <DraggableResizableGrid
        ref="gridRef"
        :items="gridItems"
        :config="gridConfig"
        container-class="demo-grid"
        @layout-change="handleLayoutChange"
        @item-click="handleItemClick"
        @item-dblclick="handleItemDblclick"
        @drag-start="handleDragStart"
        @drag-end="handleDragEnd"
        @resize-start="handleResizeStart"
        @resize-end="handleResizeEnd"
        @collision="handleCollision"
        @container-click="handleContainerClick"
      >
        <template #default="{ item }">
          <DemoWidget :item="item" />
        </template>
      </DraggableResizableGrid>
    </div>

    <!-- 状态信息 -->
    <div class="status-panel">
      <n-grid :cols="2" :x-gap="12">
        <n-gi>
          <n-card title="实时状态" size="small">
            <n-descriptions :column="2" size="small">
              <n-descriptions-item label="项目总数">{{ gridItems.length }}</n-descriptions-item>
              <n-descriptions-item label="当前行数">{{ currentRows }}</n-descriptions-item>
              <n-descriptions-item label="选中项目">{{ selectedItem?.id || '无' }}</n-descriptions-item>
              <n-descriptions-item label="容器高度">{{ containerHeight }}px</n-descriptions-item>
            </n-descriptions>
            
            <div class="mt-3">
              <n-tag v-if="lastEvent" :type="getEventType(lastEvent.type)" size="small">
                {{ lastEvent.type }}: {{ lastEvent.itemId }}
              </n-tag>
            </div>
          </n-card>
        </n-gi>
        <n-gi>
          <n-card title="布局数据" size="small">
            <n-scrollbar style="max-height: 200px;">
              <n-code 
                :code="JSON.stringify(gridItems, null, 2)" 
                language="json"
                word-wrap
              />
            </n-scrollbar>
          </n-card>
        </n-gi>
      </n-grid>
    </div>

    <!-- 事件日志 -->
    <div class="event-log">
      <n-card title="事件日志" size="small">
        <template #header-extra>
          <n-button size="small" @click="clearEventLog">清空日志</n-button>
        </template>
        <n-scrollbar style="max-height: 300px;">
          <div v-for="(event, index) in eventLog" :key="index" class="event-item">
            <n-tag :type="getEventType(event.type)" size="small">{{ event.type }}</n-tag>
            <span class="event-time">{{ event.time }}</span>
            <span class="event-detail">{{ event.detail }}</span>
          </div>
        </n-scrollbar>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick } from 'vue'
import { useMessage } from 'naive-ui'
import { DraggableResizableGrid } from '@/components/common/grid'
import type { GridItem, GridConfig, DragEvent, ResizeEvent } from '@/components/common/grid'

const message = useMessage()

// 网格引用
const gridRef = ref<InstanceType<typeof DraggableResizableGrid>>()

// 网格配置
const gridConfig = reactive<Partial<GridConfig>>({
  columns: 12,
  rowHeight: 100,
  gap: 10,
  showGrid: true,
  readonly: false,
  collision: 'block',
  bounds: 'parent',
  minHeight: 400
})

// 碰撞策略选项
const collisionOptions = [
  { label: '阻止重叠', value: 'block' },
  { label: '推挤元素', value: 'push' },
  { label: '交换位置', value: 'swap' },
  { label: '允许重叠', value: 'allow' }
]

// 网格项数据
const gridItems = ref<GridItem[]>([
  {
    id: 'demo-1',
    gridCol: 1,
    gridRow: 1,
    gridColSpan: 3,
    gridRowSpan: 2,
    component: 'DemoWidget',
    props: { 
      title: '文本组件',
      type: 'text',
      content: '这是一个文本内容示例',
      color: '#18a058'
    }
  },
  {
    id: 'demo-2', 
    gridCol: 4,
    gridRow: 1,
    gridColSpan: 4,
    gridRowSpan: 3,
    component: 'DemoWidget',
    props: {
      title: '图表组件',
      type: 'chart',
      content: '柱状图示例',
      color: '#2080f0'
    }
  },
  {
    id: 'demo-3',
    gridCol: 8,
    gridRow: 1,
    gridColSpan: 2,
    gridRowSpan: 1,
    component: 'DemoWidget', 
    props: {
      title: '指标组件',
      type: 'indicator',
      content: '888',
      color: '#f0a020'
    }
  },
  {
    id: 'demo-4',
    gridCol: 1,
    gridRow: 3,
    gridColSpan: 3,
    gridRowSpan: 2,
    component: 'DemoWidget',
    props: {
      title: '锁定组件',
      type: 'locked',
      content: '此组件已锁定',
      color: '#d03050'
    },
    locked: true
  }
])

// 状态数据
const selectedItem = ref<GridItem | null>(null)
const lastEvent = ref<{ type: string; itemId: string } | null>(null)
const eventLog = ref<Array<{ type: string; time: string; detail: string }>>([])

// 计算属性
const currentRows = computed(() => {
  if (gridItems.value.length === 0) return 0
  return Math.max(...gridItems.value.map(item => item.gridRow + item.gridRowSpan - 1))
})

const containerHeight = computed(() => {
  return currentRows.value * gridConfig.rowHeight! + (currentRows.value - 1) * gridConfig.gap!
})

// 添加随机项目
const addRandomItem = () => {
  const colors = ['#18a058', '#2080f0', '#f0a020', '#d03050', '#722ed1', '#eb2f96']
  const types = ['text', 'chart', 'indicator', 'image']
  
  const newItem: GridItem = {
    id: `demo-${Date.now()}`,
    gridCol: Math.floor(Math.random() * (gridConfig.columns! - 2)) + 1,
    gridRow: Math.floor(Math.random() * 3) + 1,
    gridColSpan: Math.floor(Math.random() * 3) + 2,
    gridRowSpan: Math.floor(Math.random() * 2) + 1,
    component: 'DemoWidget',
    props: {
      title: `组件${gridItems.value.length + 1}`,
      type: types[Math.floor(Math.random() * types.length)],
      content: `随机内容 ${Math.floor(Math.random() * 1000)}`,
      color: colors[Math.floor(Math.random() * colors.length)]
    }
  }

  const addedItem = gridRef.value?.addItem(newItem)
  if (addedItem) {
    addEventLog('add', `添加项目: ${addedItem.id}`)
    message.success(`添加项目成功: ${addedItem.id}`)
  } else {
    message.warning('添加项目失败，可能没有足够空间')
  }
}

// 清空所有项目
const clearAllItems = () => {
  gridRef.value?.clearItems()
  selectedItem.value = null
  addEventLog('clear', '清空所有项目')
  message.info('已清空所有项目')
}

// 导出布局
const exportLayout = () => {
  const layout = gridRef.value?.getAllItems()
  if (layout) {
    console.log('导出布局:', layout)
    navigator.clipboard?.writeText(JSON.stringify(layout, null, 2))
    message.success('布局已复制到剪贴板')
  }
}

// 事件处理函数
const handleLayoutChange = (items: GridItem[]) => {
  addEventLog('layout-change', `布局变更: ${items.length}个项目`)
}

const handleItemClick = (item: GridItem, event: MouseEvent) => {
  selectedItem.value = item
  lastEvent.value = { type: 'click', itemId: item.id }
  addEventLog('click', `点击项目: ${item.id}`)
}

const handleItemDblclick = (item: GridItem, event: MouseEvent) => {
  lastEvent.value = { type: 'dblclick', itemId: item.id }
  addEventLog('dblclick', `双击项目: ${item.id}`)
  message.info(`双击了项目: ${item.props?.title || item.id}`)
}

const handleDragStart = (data: DragEvent) => {
  lastEvent.value = { type: 'drag-start', itemId: data.item.id }
  addEventLog('drag-start', `开始拖拽: ${data.item.id}`)
}

const handleDragEnd = (data: DragEvent) => {
  lastEvent.value = { type: 'drag-end', itemId: data.item.id }
  const detail = `拖拽结束: ${data.item.id} (${data.oldPosition.col},${data.oldPosition.row}) → (${data.newPosition.col},${data.newPosition.row})`
  addEventLog('drag-end', detail)
}

const handleResizeStart = (data: ResizeEvent) => {
  lastEvent.value = { type: 'resize-start', itemId: data.item.id }
  addEventLog('resize-start', `开始调整大小: ${data.item.id}`)
}

const handleResizeEnd = (data: ResizeEvent) => {
  lastEvent.value = { type: 'resize-end', itemId: data.item.id }
  const detail = `调整大小结束: ${data.item.id} ${data.oldSize.colSpan}×${data.oldSize.rowSpan} → ${data.newSize.colSpan}×${data.newSize.rowSpan}`
  addEventLog('resize-end', detail)
}

const handleCollision = (item: GridItem, collisions: GridItem[]) => {
  lastEvent.value = { type: 'collision', itemId: item.id }
  addEventLog('collision', `碰撞检测: ${item.id} 与 ${collisions.map(c => c.id).join(', ')}`)
  message.warning(`检测到碰撞: ${item.id}`)
}

const handleContainerClick = (event: MouseEvent) => {
  selectedItem.value = null
  addEventLog('container-click', '点击容器空白区域')
}

// 工具函数
const addEventLog = (type: string, detail: string) => {
  const time = new Date().toLocaleTimeString()
  eventLog.value.unshift({ type, time, detail })
  // 限制日志条数
  if (eventLog.value.length > 50) {
    eventLog.value = eventLog.value.slice(0, 50)
  }
}

const clearEventLog = () => {
  eventLog.value.splice(0, eventLog.value.length)
  message.info('事件日志已清空')
}

const getEventType = (type: string) => {
  const typeMap: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
    'click': 'info',
    'dblclick': 'info', 
    'drag-start': 'success',
    'drag-end': 'success',
    'resize-start': 'warning',
    'resize-end': 'warning',
    'collision': 'error',
    'add': 'success',
    'clear': 'info',
    'layout-change': 'info'
  }
  return typeMap[type] || 'info'
}
</script>

<script lang="ts">
// Demo组件定义
import { defineComponent, h } from 'vue'

// 注册DemoWidget组件
const DemoWidget = defineComponent({
  name: 'DemoWidget',
  props: {
    item: {
      type: Object as () => GridItem,
      required: true
    }
  },
  setup(props) {
    return () => {
      const { title, type, content, color } = props.item.props || {}
      
      return h('div', { 
        class: 'demo-widget',
        style: {
          height: '100%',
          background: `linear-gradient(135deg, ${color}20, ${color}10)`,
          border: `2px solid ${color}40`,
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center'
        }
      }, [
        h('div', { 
          class: 'widget-title',
          style: { 
            fontWeight: 'bold', 
            color, 
            marginBottom: '8px',
            fontSize: '14px'
          }
        }, title),
        h('div', { 
          class: 'widget-type',
          style: { 
            fontSize: '12px', 
            color: '#666',
            marginBottom: '4px'
          }
        }, `类型: ${type}`),
        h('div', { 
          class: 'widget-content',
          style: { 
            fontSize: '13px', 
            color: '#333',
            textAlign: 'center'
          }
        }, content),
        h('div', {
          class: 'widget-id',
          style: {
            fontSize: '10px',
            color: '#999',
            marginTop: '8px'
          }
        }, props.item.id)
      ])
    }
  }
})

export default defineComponent({
  components: {
    DemoWidget
  }
})
</script>

<style scoped>
.grid-demo-page {
  padding: 16px;
  min-height: 100vh;
  background: var(--n-body-color);
}

.demo-header {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--n-border-color);
}

.control-panel {
  margin-bottom: 16px;
}

.grid-container {
  margin-bottom: 16px;
  min-height: 500px;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
  padding: 16px;
  background: var(--n-card-color);
}

.demo-grid {
  min-height: 400px;
}

.status-panel {
  margin-bottom: 16px;
}

.event-log {
  margin-bottom: 16px;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px solid var(--n-divider-color);
}

.event-time {
  font-size: 12px;
  color: var(--n-text-color-3);
  min-width: 80px;
}

.event-detail {
  font-size: 13px;
  color: var(--n-text-color-2);
  flex: 1;
}

/* Demo组件样式 */
.demo-widget {
  transition: all 0.3s ease;
  cursor: pointer;
}

.demo-widget:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .grid-demo-page {
    padding: 8px;
  }
  
  .grid-container {
    padding: 8px;
  }
}
</style>