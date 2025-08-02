<template>
  <div class="optimized-grid-demo-page">
    <!-- 页面头部 -->
    <div class="demo-header">
      <n-page-header title="优化版 DraggableResizableGrid" subtitle="性能优化版本 - 解决拖拽卡顿问题">
        <template #extra>
          <n-space>
            <n-button type="primary" @click="addRandomItem">
              <template #icon>
                <n-icon><div class="i-mdi-plus" /></n-icon>
              </template>
              添加项目
            </n-button>
            <n-button @click="addMultipleItems">
              <template #icon>
                <n-icon><div class="i-mdi-plus-box-multiple" /></n-icon>
              </template>
              批量添加(10个)
            </n-button>
            <n-button @click="clearAllItems">
              <template #icon>
                <n-icon><div class="i-mdi-delete-sweep" /></n-icon>
              </template>
              清空所有
            </n-button>
            <n-button @click="toggleVersion">
              <template #icon>
                <n-icon><div class="i-mdi-swap-horizontal" /></n-icon>
              </template>
              切换到{{ useOptimized ? '原版' : '优化版' }}
            </n-button>
          </n-space>
        </template>
      </n-page-header>
    </div>

    <!-- 性能对比面板 -->
    <div class="performance-panel">
      <n-card title="性能对比" size="small">
        <n-grid :cols="4" :x-gap="12">
          <n-gi>
            <n-statistic label="当前版本" :value="useOptimized ? '优化版' : '原版'" />
          </n-gi>
          <n-gi>
            <n-statistic label="项目数量" :value="gridItems.length" />
          </n-gi>
          <n-gi>
            <n-statistic label="FPS" :value="currentFPS" />
          </n-gi>
          <n-gi>
            <n-statistic label="内存使用" :value="memoryUsage" suffix="MB" />
          </n-gi>
        </n-grid>
        
        <div class="mt-3">
          <n-alert v-if="useOptimized" type="success" title="优化版特性">
            ✅ 原生拖拽实现，无第三方库依赖<br>
            ✅ 节流防抖优化，减少计算频率<br>
            ✅ 硬件加速，GPU渲染优化<br>
            ✅ 事件监听优化，减少内存泄漏
          </n-alert>
          <n-alert v-else type="warning" title="原版问题">
            ⚠️ 依赖vue-draggable-resizable库<br>
            ⚠️ 频繁计算导致性能问题<br>
            ⚠️ 拖拽时卡顿明显<br>
            ⚠️ 大量项目时响应缓慢
          </n-alert>
        </div>
      </n-card>
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
          <n-switch v-model:value="enablePerformanceMonitor">
            <template #checked>性能监控</template>
            <template #unchecked>关闭监控</template>
          </n-switch>
        </n-space>
      </n-card>
    </div>

    <!-- 网格容器 -->
    <div class="grid-container">
      <!-- 优化版组件 -->
      <OptimizedDraggableResizableGrid
        v-if="useOptimized"
        ref="gridRef"
        :items="gridItems"
        :config="gridConfig"
        container-class="demo-grid optimized"
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
      </OptimizedDraggableResizableGrid>
      
      <!-- 原版组件 -->
      <DraggableResizableGrid
        v-else
        ref="gridRef"
        :items="gridItems"
        :config="gridConfig"
        container-class="demo-grid original"
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

    <!-- 性能监控面板 -->
    <div v-if="enablePerformanceMonitor" class="performance-monitor">
      <n-card title="实时性能监控" size="small">
        <div class="performance-charts">
          <div class="fps-chart">
            <h4>FPS 变化</h4>
            <div class="chart-container">
              <canvas ref="fpsChartRef" width="300" height="100"></canvas>
            </div>
          </div>
          <div class="memory-chart">
            <h4>内存使用</h4>
            <div class="chart-container">
              <canvas ref="memoryChartRef" width="300" height="100"></canvas>
            </div>
          </div>
        </div>
      </n-card>
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
              <n-descriptions-item label="渲染时间">{{ renderTime }}ms</n-descriptions-item>
              <n-descriptions-item label="事件数量">{{ eventCount }}</n-descriptions-item>
            </n-descriptions>
            
            <div class="mt-3">
              <n-tag v-if="lastEvent" :type="getEventType(lastEvent.type)" size="small">
                {{ lastEvent.type }}: {{ lastEvent.itemId }}
              </n-tag>
            </div>
          </n-card>
        </n-gi>
        <n-gi>
          <n-card title="性能建议" size="small">
            <div class="performance-tips">
              <div v-for="tip in performanceTips" :key="tip.type" class="tip-item">
                <n-tag :type="tip.level" size="small">{{ tip.title }}</n-tag>
                <span class="tip-content">{{ tip.content }}</span>
              </div>
            </div>
          </n-card>
        </n-gi>
      </n-grid>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useMessage } from 'naive-ui'
import { 
  DraggableResizableGrid, 
  OptimizedDraggableResizableGrid 
} from '@/components/common/grid'
import type { GridItem, GridConfig, DragEvent, ResizeEvent } from '@/components/common/grid'

const message = useMessage()

// 版本切换
const useOptimized = ref(true)

// 网格引用
const gridRef = ref<any>()

// 性能监控
const enablePerformanceMonitor = ref(true)
const currentFPS = ref(60)
const memoryUsage = ref(0)
const renderTime = ref(0)
const eventCount = ref(0)
const fpsChartRef = ref<HTMLCanvasElement>()
const memoryChartRef = ref<HTMLCanvasElement>()

// 网格配置
const gridConfig = reactive<Partial<GridConfig>>({
  columns: 12,
  rowHeight: 100,
  gap: 10,
  showGrid: true,
  readonly: false,
  collision: 'allow', // 优化版默认允许重叠以提高性能
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
  }
])

// 状态数据
const selectedItem = ref<GridItem | null>(null)
const lastEvent = ref<{ type: string; itemId: string } | null>(null)

// 计算属性
const currentRows = computed(() => {
  if (gridItems.value.length === 0) return 0
  return Math.max(...gridItems.value.map(item => item.gridRow + item.gridRowSpan - 1))
})

const containerHeight = computed(() => {
  return currentRows.value * gridConfig.rowHeight! + (currentRows.value - 1) * gridConfig.gap!
})

// 性能建议
const performanceTips = computed(() => {
  const tips = []
  
  if (gridItems.value.length > 20) {
    tips.push({
      type: 'items',
      level: 'warning',
      title: '项目数量',
      content: '项目过多可能影响性能，建议使用虚拟滚动'
    })
  }
  
  if (currentFPS.value < 30) {
    tips.push({
      type: 'fps',
      level: 'error',
      title: 'FPS过低',
      content: '帧率过低，建议减少项目数量或优化渲染'
    })
  }
  
  if (memoryUsage.value > 100) {
    tips.push({
      type: 'memory',
      level: 'warning',
      title: '内存使用',
      content: '内存使用较高，注意清理无用对象'
    })
  }
  
  if (tips.length === 0) {
    tips.push({
      type: 'good',
      level: 'success',
      title: '性能良好',
      content: '当前性能表现良好'
    })
  }
  
  return tips
})

// 切换版本
const toggleVersion = () => {
  useOptimized.value = !useOptimized.value
  message.info(`已切换到${useOptimized.value ? '优化版' : '原版'}组件`)
}

// 添加随机项目
const addRandomItem = () => {
  const colors = ['#18a058', '#2080f0', '#f0a020', '#d03050', '#722ed1', '#eb2f96']
  const types = ['text', 'chart', 'indicator', 'image']
  
  const newItem: GridItem = {
    id: `demo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
    message.success(`添加项目成功: ${addedItem.id}`)
  } else {
    // 直接添加到数组
    gridItems.value.push(newItem)
    message.success(`添加项目成功: ${newItem.id}`)
  }
}

// 批量添加项目
const addMultipleItems = () => {
  const startTime = performance.now()
  
  for (let i = 0; i < 10; i++) {
    addRandomItem()
  }
  
  const endTime = performance.now()
  renderTime.value = Math.round(endTime - startTime)
  
  message.success(`批量添加10个项目完成，耗时: ${renderTime.value}ms`)
}

// 清空所有项目
const clearAllItems = () => {
  gridRef.value?.clearItems()
  selectedItem.value = null
  eventCount.value = 0
  message.info('已清空所有项目')
}

// 事件处理函数
const handleLayoutChange = (items: GridItem[]) => {
  eventCount.value++
}

const handleItemClick = (item: GridItem, event: MouseEvent) => {
  selectedItem.value = item
  lastEvent.value = { type: 'click', itemId: item.id }
  eventCount.value++
}

const handleItemDblclick = (item: GridItem, event: MouseEvent) => {
  lastEvent.value = { type: 'dblclick', itemId: item.id }
  eventCount.value++
  message.info(`双击了项目: ${item.props?.title || item.id}`)
}

const handleDragStart = (data: DragEvent) => {
  lastEvent.value = { type: 'drag-start', itemId: data.item.id }
  eventCount.value++
}

const handleDragEnd = (data: DragEvent) => {
  lastEvent.value = { type: 'drag-end', itemId: data.item.id }
  eventCount.value++
}

const handleResizeStart = (data: ResizeEvent) => {
  lastEvent.value = { type: 'resize-start', itemId: data.item.id }
  eventCount.value++
}

const handleResizeEnd = (data: ResizeEvent) => {
  lastEvent.value = { type: 'resize-end', itemId: data.item.id }
  eventCount.value++
}

const handleCollision = (item: GridItem, collisions: GridItem[]) => {
  lastEvent.value = { type: 'collision', itemId: item.id }
  eventCount.value++
}

const handleContainerClick = (event: MouseEvent) => {
  selectedItem.value = null
  eventCount.value++
}

// 工具函数
const getEventType = (type: string) => {
  const typeMap: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
    'click': 'info',
    'dblclick': 'info', 
    'drag-start': 'success',
    'drag-end': 'success',
    'resize-start': 'warning',
    'resize-end': 'warning',
    'collision': 'error'
  }
  return typeMap[type] || 'info'
}

// 性能监控
let fpsCounter = 0
let lastTime = performance.now()
let fpsHistory: number[] = []
let memoryHistory: number[] = []

const updatePerformanceMetrics = () => {
  if (!enablePerformanceMonitor.value) return
  
  // FPS计算
  fpsCounter++
  const currentTime = performance.now()
  if (currentTime - lastTime >= 1000) {
    currentFPS.value = Math.round((fpsCounter * 1000) / (currentTime - lastTime))
    fpsHistory.push(currentFPS.value)
    if (fpsHistory.length > 60) fpsHistory.shift()
    
    fpsCounter = 0
    lastTime = currentTime
  }
  
  // 内存使用（估算）
  if ((performance as any).memory) {
    memoryUsage.value = Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)
    memoryHistory.push(memoryUsage.value)
    if (memoryHistory.length > 60) memoryHistory.shift()
  }
  
  // 更新图表
  updateCharts()
  
  requestAnimationFrame(updatePerformanceMetrics)
}

// 更新图表
const updateCharts = () => {
  if (!fpsChartRef.value || !memoryChartRef.value) return
  
  // FPS图表
  const fpsCtx = fpsChartRef.value.getContext('2d')
  if (fpsCtx) {
    fpsCtx.clearRect(0, 0, 300, 100)
    fpsCtx.strokeStyle = '#18a058'
    fpsCtx.lineWidth = 2
    fpsCtx.beginPath()
    
    fpsHistory.forEach((fps, index) => {
      const x = (index / fpsHistory.length) * 300
      const y = 100 - (fps / 60) * 100
      if (index === 0) {
        fpsCtx.moveTo(x, y)
      } else {
        fpsCtx.lineTo(x, y)
      }
    })
    
    fpsCtx.stroke()
  }
  
  // 内存图表
  const memoryCtx = memoryChartRef.value.getContext('2d')
  if (memoryCtx) {
    memoryCtx.clearRect(0, 0, 300, 100)
    memoryCtx.strokeStyle = '#2080f0'
    memoryCtx.lineWidth = 2
    memoryCtx.beginPath()
    
    const maxMemory = Math.max(...memoryHistory, 50)
    
    memoryHistory.forEach((memory, index) => {
      const x = (index / memoryHistory.length) * 300
      const y = 100 - (memory / maxMemory) * 100
      if (index === 0) {
        memoryCtx.moveTo(x, y)
      } else {
        memoryCtx.lineTo(x, y)
      }
    })
    
    memoryCtx.stroke()
  }
}

// 生命周期
onMounted(() => {
  updatePerformanceMetrics()
})

onUnmounted(() => {
  // 清理
})
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
.optimized-grid-demo-page {
  padding: 16px;
  min-height: 100vh;
  background: var(--n-body-color);
}

.demo-header {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--n-border-color);
}

.performance-panel {
  margin-bottom: 16px;
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

.demo-grid.optimized {
  border: 2px solid #18a058;
}

.demo-grid.original {
  border: 2px solid #f0a020;
}

.performance-monitor {
  margin-bottom: 16px;
}

.performance-charts {
  display: flex;
  gap: 20px;
}

.fps-chart,
.memory-chart {
  flex: 1;
}

.chart-container {
  border: 1px solid var(--n-border-color);
  border-radius: 4px;
  padding: 8px;
  background: var(--n-card-color);
}

.status-panel {
  margin-bottom: 16px;
}

.performance-tips {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tip-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tip-content {
  font-size: 12px;
  color: var(--n-text-color-2);
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
  .optimized-grid-demo-page {
    padding: 8px;
  }
  
  .grid-container {
    padding: 8px;
  }
  
  .performance-charts {
    flex-direction: column;
  }
}
</style>