<!--
  GridPlus 高性能网格组件测试页面
  包含完整的功能测试、性能对比和演示
-->
<template>
  <div class="gridplus-test-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <n-page-header @back="$router.go(-1)">
        <template #title>
          <n-text class="page-title">
            <n-icon :component="GridOutline" />
            GridPlus 高性能网格测试
          </n-text>
        </template>
        <template #subtitle>
          <n-text depth="2">
            测试虚拟滚动、懒加载、骨架屏等高级功能
          </n-text>
        </template>
      </n-page-header>
    </div>

    <!-- 控制面板 -->
    <n-card class="control-panel" :bordered="false">
      <template #header>
        <n-text strong>测试控制</n-text>
      </template>
      
      <n-space vertical :size="16">
        <!-- 基本配置 -->
        <n-space align="center" :wrap="false">
          <n-text strong style="min-width: 80px">数据规模:</n-text>
          <n-select
            v-model:value="selectedDataSize"
            :options="dataSizeOptions"
            style="width: 120px"
            @update:value="handleDataSizeChange"
          />
          
          <n-text strong style="min-width: 60px">模式:</n-text>
          <n-radio-group v-model:value="testMode" @update:value="handleModeChange">
            <n-radio value="normal">常规</n-radio>
            <n-radio value="virtual">虚拟滚动</n-radio>
            <n-radio value="lazy">懒加载</n-radio>
            <n-radio value="full">完整功能</n-radio>
          </n-radio-group>
          
          <n-button
            type="primary"
            :loading="isGenerating"
            @click="generateTestData"
          >
            <template #icon>
              <n-icon :component="RefreshOutline" />
            </template>
            重新生成
          </n-button>
        </n-space>

        <!-- 高级配置 -->
        <n-collapse>
          <n-collapse-item title="高级配置" name="advanced">
            <n-space vertical :size="12">
              <n-space align="center">
                <n-checkbox v-model:checked="config.enableVirtualScroll">
                  启用虚拟滚动
                </n-checkbox>
                <n-checkbox v-model:checked="config.enableLazyLoad">
                  启用懒加载
                </n-checkbox>
                <n-checkbox v-model:checked="config.enablePerformanceMonitoring">
                  启用性能监控
                </n-checkbox>
              </n-space>
              
              <n-space align="center">
                <n-text>虚拟滚动缓冲:</n-text>
                <n-input-number 
                  v-model:value="config.virtualScrollBuffer" 
                  :min="1" 
                  :max="10"
                  style="width: 80px"
                />
                
                <n-text>懒加载阈值:</n-text>
                <n-input-number 
                  v-model:value="config.lazyLoadThreshold" 
                  :min="0" 
                  :max="500"
                  style="width: 100px"
                />
              </n-space>
            </n-space>
          </n-collapse-item>
        </n-collapse>
      </n-space>
    </n-card>

    <!-- 性能指标面板 -->
    <n-card class="metrics-panel" :bordered="false">
      <template #header>
        <n-space align="center">
          <n-text strong>实时性能指标</n-text>
          <n-tag :type="getPerformanceType(performanceMetrics.fps)">
            FPS: {{ performanceMetrics.fps }}
          </n-tag>
        </n-space>
      </template>
      
      <n-space vertical :size="12">
        <!-- 性能指标网格 -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">内存使用</div>
            <div class="metric-value">{{ performanceMetrics.memoryUsage.toFixed(1) }}MB</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-label">渲染时间</div>
            <div class="metric-value">{{ performanceMetrics.renderTime.toFixed(1) }}ms</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-label">DOM节点</div>
            <div class="metric-value">{{ performanceMetrics.domNodeCount }}</div>
          </div>
          
          <div class="metric-card">
            <div class="metric-label">可见项目</div>
            <div class="metric-value">{{ performanceMetrics.visibleItemCount }}/{{ performanceMetrics.totalItemCount }}</div>
          </div>
        </div>

        <!-- 懒加载统计 -->
        <div v-if="config.enableLazyLoad" class="lazy-load-stats">
          <n-text strong>懒加载统计:</n-text>
          <n-space>
            <n-tag type="success">已加载: {{ lazyLoadStats.loadedItems }}</n-tag>
            <n-tag type="warning">加载中: {{ lazyLoadStats.loadingItems }}</n-tag>
            <n-tag type="error">失败: {{ lazyLoadStats.errorItems }}</n-tag>
          </n-space>
        </div>
      </n-space>
    </n-card>

    <!-- 网格容器 -->
    <n-card class="grid-container" :bordered="false">
      <template #header>
        <n-space justify="space-between">
          <n-text strong>GridPlus 演示</n-text>
          <n-space>
            <n-button size="small" @click="addRandomItem">
              <template #icon>
                <n-icon :component="AddOutline" />
              </template>
              添加项目
            </n-button>
            <n-button size="small" @click="clearAllItems">
              <template #icon>
                <n-icon :component="TrashOutline" />
              </template>
              清空
            </n-button>
            <n-button size="small" @click="exportData">
              <template #icon>
                <n-icon :component="DownloadOutline" />
              </template>
              导出数据
            </n-button>
          </n-space>
        </n-space>
      </template>

      <!-- GridPlus 组件 -->
      <div class="grid-wrapper">
        <GridPlusContainer
          ref="gridPlusRef"
          v-model:layout="testLayout"
          :readonly="false"
          :config="gridConfig"
          :enable-virtual-scroll="config.enableVirtualScroll"
          :enable-lazy-load="config.enableLazyLoad"
          :enable-performance-monitoring="config.enablePerformanceMonitoring"
          :skeleton-config="skeletonConfig"
          @performance-metrics="handlePerformanceMetrics"
          @performance-warning="handlePerformanceWarning"
          @virtual-scroll-change="handleVirtualScrollChange"
          @lazy-load-state-change="handleLazyLoadStateChange"
        >
          <template #default="{ item }">
            <!-- 自定义项目内容 -->
            <div class="custom-grid-item" :class="getItemClass(item)">
              <div class="item-header">
                <n-text strong>{{ item.title || item.type || '测试项目' }}</n-text>
                <n-button-group size="tiny">
                  <n-button @click="editItem(item)">
                    <template #icon>
                      <n-icon :component="CreateOutline" />
                    </template>
                  </n-button>
                  <n-button type="error" @click="deleteItem(item.i)">
                    <template #icon>
                      <n-icon :component="TrashOutline" />
                    </template>
                  </n-button>
                </n-button-group>
              </div>
              
              <div class="item-content">
                <!-- 根据项目类型显示不同内容 -->
                <div v-if="item.type === 'chart'" class="chart-placeholder">
                  <n-icon size="32" :component="BarChartOutline" />
                  <n-text>图表组件</n-text>
                </div>
                
                <div v-else-if="item.type === 'table'" class="table-placeholder">
                  <n-icon size="32" :component="GridOutline" />
                  <n-text>表格组件</n-text>
                </div>
                
                <div v-else-if="item.type === 'image'" class="image-placeholder">
                  <n-icon size="32" :component="ImageOutline" />
                  <n-text>图片组件</n-text>
                  <div v-if="config.enableLazyLoad" class="lazy-load-indicator">
                    <n-tag size="small" :type="getLazyLoadType(item.i)">
                      {{ getLazyLoadState(item.i) }}
                    </n-tag>
                  </div>
                </div>
                
                <div v-else class="default-placeholder">
                  <n-text depth="2">ID: {{ item.i }}</n-text>
                  <n-text depth="2">位置: ({{ item.x }}, {{ item.y }})</n-text>
                  <n-text depth="2">尺寸: {{ item.w }}×{{ item.h }}</n-text>
                </div>
              </div>
            </div>
          </template>
        </GridPlusContainer>
      </div>
    </n-card>

    <!-- 性能对比 -->
    <n-card class="comparison-panel" :bordered="false">
      <template #header>
        <n-text strong>性能对比</n-text>
      </template>
      
      <div class="comparison-grid">
        <div class="comparison-item">
          <n-statistic label="常规模式 FPS" :value="comparisonData.normal.fps" />
        </div>
        <div class="comparison-item">
          <n-statistic label="虚拟滚动 FPS" :value="comparisonData.virtual.fps" />
        </div>
        <div class="comparison-item">
          <n-statistic label="内存节省" :value="getMemorySavings()" suffix="%" />
        </div>
        <div class="comparison-item">
          <n-statistic label="渲染节省" :value="getRenderSavings()" suffix="%" />
        </div>
      </div>
    </n-card>

    <!-- 项目编辑对话框 -->
    <n-modal v-model:show="showEditModal" preset="dialog" title="编辑项目">
      <template #default>
        <n-form v-if="editingItem" :model="editingItem" label-placement="left" label-width="80px">
          <n-form-item label="标题">
            <n-input v-model:value="editingItem.title" />
          </n-form-item>
          <n-form-item label="类型">
            <n-select
              v-model:value="editingItem.type"
              :options="itemTypeOptions"
            />
          </n-form-item>
          <n-form-item label="宽度">
            <n-input-number v-model:value="editingItem.w" :min="1" :max="12" />
          </n-form-item>
          <n-form-item label="高度">
            <n-input-number v-model:value="editingItem.h" :min="1" :max="10" />
          </n-form-item>
          <n-form-item label="优先级">
            <n-input-number v-model:value="editingItem.priority" :min="1" :max="10" />
          </n-form-item>
        </n-form>
      </template>
      <template #action>
        <n-space>
          <n-button @click="showEditModal = false">取消</n-button>
          <n-button type="primary" @click="saveEditingItem">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * GridPlus 测试页面
 * 提供完整的功能演示和性能测试
 */
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useMessage } from 'naive-ui'
import {
  NPageHeader,
  NCard,
  NSpace,
  NText,
  NButton,
  NButtonGroup,
  NSelect,
  NRadioGroup,
  NRadio,
  NCheckbox,
  NInputNumber,
  NCollapse,
  NCollapseItem,
  NTag,
  NStatistic,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NIcon
} from 'naive-ui'
import {
  GridOutline,
  RefreshOutline,
  AddOutline,
  TrashOutline,
  DownloadOutline,
  CreateOutline,
  BarChartOutline,
  ImageOutline
} from '@vicons/ionicons5'

// 导入 GridPlus 组件（需要先创建）
import GridPlusContainer from '@/components/common/gridplus/GridPlusContainer.vue'
import type { 
  GridPlusItem,
  PerformanceMetrics,
  PerformanceWarning,
  LazyLoadStats
} from '@/components/common/gridplus/types/gridplus-types'

// ============= 响应式数据 =============

/** 消息通知 */
const message = useMessage()

/** GridPlus 组件引用 */
const gridPlusRef = ref()

/** 测试布局数据 */
const testLayout = ref<GridPlusItem[]>([])

/** 是否正在生成数据 */
const isGenerating = ref(false)

/** 选择的数据规模 */
const selectedDataSize = ref(100)

/** 测试模式 */
const testMode = ref<'normal' | 'virtual' | 'lazy' | 'full'>('normal')

/** 配置项 */
const config = reactive({
  enableVirtualScroll: false,
  enableLazyLoad: false,
  enablePerformanceMonitoring: true,
  virtualScrollBuffer: 3,
  lazyLoadThreshold: 100
})

/** 性能指标 */
const performanceMetrics = ref<PerformanceMetrics>({
  fps: 60,
  memoryUsage: 0,
  renderTime: 0,
  layoutTime: 0,
  domNodeCount: 0,
  visibleItemCount: 0,
  totalItemCount: 0,
  timestamp: Date.now()
})

/** 懒加载统计 */
const lazyLoadStats = ref<LazyLoadStats>({
  totalItems: 0,
  loadedItems: 0,
  loadingItems: 0,
  errorItems: 0,
  averageLoadTime: 0,
  cacheHitRate: 0,
  memoryUsage: 0
})

/** 性能对比数据 */
const comparisonData = reactive({
  normal: { fps: 0, memory: 0, renderTime: 0 },
  virtual: { fps: 0, memory: 0, renderTime: 0 }
})

/** 项目编辑相关 */
const showEditModal = ref(false)
const editingItem = ref<GridPlusItem | null>(null)

// ============= 选项配置 =============

/** 数据规模选项 */
const dataSizeOptions = [
  { label: '小规模 (50项)', value: 50 },
  { label: '中规模 (100项)', value: 100 },
  { label: '大规模 (500项)', value: 500 },
  { label: '超大规模 (1000项)', value: 1000 },
  { label: '极限测试 (5000项)', value: 5000 }
]

/** 项目类型选项 */
const itemTypeOptions = [
  { label: '图表', value: 'chart' },
  { label: '表格', value: 'table' },
  { label: '图片', value: 'image' },
  { label: '文本', value: 'text' },
  { label: '默认', value: 'default' }
]

// ============= 计算属性 =============

/** 网格配置 */
const gridConfig = computed(() => ({
  colNum: 12,
  rowHeight: 100,
  margin: [10, 10],
  enableVirtualScroll: config.enableVirtualScroll,
  enableLazyLoad: config.enableLazyLoad,
  enablePerformanceMonitoring: config.enablePerformanceMonitoring,
  virtualScrollBuffer: config.virtualScrollBuffer,
  lazyLoadThreshold: config.lazyLoadThreshold
}))

/** 骨架屏配置 */
const skeletonConfig = computed(() => ({
  enabled: config.enableLazyLoad,
  animation: 'wave',
  colors: {
    base: '#f0f0f0',
    highlight: '#f5f5f5'
  },
  minDisplayTime: 300
}))

// ============= 方法实现 =============

/**
 * 生成测试数据
 */
const generateTestData = async () => {
  isGenerating.value = true
  
  try {
    const items: GridPlusItem[] = []
    const itemTypes = ['chart', 'table', 'image', 'text', 'default']
    
    for (let i = 0; i < selectedDataSize.value; i++) {
      const type = itemTypes[Math.floor(Math.random() * itemTypes.length)]
      
      items.push({
        i: `test-item-${i}`,
        x: Math.floor(Math.random() * 10),
        y: Math.floor(i / 6) * 2,
        w: Math.floor(Math.random() * 3) + 2,
        h: Math.floor(Math.random() * 2) + 2,
        type,
        title: `${type}组件 ${i + 1}`,
        priority: Math.floor(Math.random() * 10) + 1,
        lazyLoad: config.enableLazyLoad && type === 'image',
        lazyLoadState: config.enableLazyLoad ? 'idle' : undefined
      })
    }
    
    // 模拟生成延迟
    await new Promise(resolve => setTimeout(resolve, 500))
    
    testLayout.value = items
    
    message.success(`成功生成 ${selectedDataSize.value} 个测试项目`)
    
  } catch (error) {
    console.error('生成测试数据失败:', error)
    message.error('生成测试数据失败')
  } finally {
    isGenerating.value = false
  }
}

/**
 * 处理数据规模变化
 */
const handleDataSizeChange = (value: number) => {
  selectedDataSize.value = value
  nextTick(() => {
    generateTestData()
  })
}

/**
 * 处理模式变化
 */
const handleModeChange = (mode: string) => {
  switch (mode) {
    case 'normal':
      config.enableVirtualScroll = false
      config.enableLazyLoad = false
      break
    case 'virtual':
      config.enableVirtualScroll = true
      config.enableLazyLoad = false
      break
    case 'lazy':
      config.enableVirtualScroll = false
      config.enableLazyLoad = true
      break
    case 'full':
      config.enableVirtualScroll = true
      config.enableLazyLoad = true
      break
  }
}

/**
 * 添加随机项目
 */
const addRandomItem = () => {
  const types = ['chart', 'table', 'image', 'text']
  const type = types[Math.floor(Math.random() * types.length)]
  
  if (gridPlusRef.value) {
    const newItem = gridPlusRef.value.addItem(type, {
      title: `新${type}项目`,
      priority: 5
    })
    message.success(`添加了新项目: ${newItem.i}`)
  }
}

/**
 * 清空所有项目
 */
const clearAllItems = () => {
  if (gridPlusRef.value) {
    gridPlusRef.value.clearLayout()
    message.info('已清空所有项目')
  }
}

/**
 * 导出数据
 */
const exportData = () => {
  const data = {
    layout: testLayout.value,
    config: config,
    metrics: performanceMetrics.value,
    timestamp: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gridplus-test-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  message.success('数据已导出')
}

/**
 * 编辑项目
 */
const editItem = (item: GridPlusItem) => {
  editingItem.value = { ...item }
  showEditModal.value = true
}

/**
 * 保存编辑的项目
 */
const saveEditingItem = () => {
  if (editingItem.value && gridPlusRef.value) {
    gridPlusRef.value.updateItem(editingItem.value.i, editingItem.value)
    showEditModal.value = false
    message.success('项目已更新')
  }
}

/**
 * 删除项目
 */
const deleteItem = (itemId: string) => {
  if (gridPlusRef.value) {
    gridPlusRef.value.removeItem(itemId)
    message.success('项目已删除')
  }
}

/**
 * 获取项目CSS类
 */
const getItemClass = (item: GridPlusItem) => {
  return [
    `item-type-${item.type || 'default'}`,
    item.static ? 'item-static' : 'item-draggable'
  ]
}

/**
 * 获取性能类型
 */
const getPerformanceType = (fps: number) => {
  if (fps >= 50) return 'success'
  if (fps >= 30) return 'warning'
  return 'error'
}

/**
 * 获取懒加载状态
 */
const getLazyLoadState = (itemId: string) => {
  if (gridPlusRef.value) {
    return gridPlusRef.value.getItemState(itemId) || 'idle'
  }
  return 'idle'
}

/**
 * 获取懒加载类型
 */
const getLazyLoadType = (itemId: string) => {
  const state = getLazyLoadState(itemId)
  switch (state) {
    case 'loaded': return 'success'
    case 'loading': return 'info'
    case 'error': return 'error'
    default: return 'default'
  }
}

/**
 * 获取内存节省百分比
 */
const getMemorySavings = () => {
  const normal = comparisonData.normal.memory
  const virtual = comparisonData.virtual.memory
  if (normal === 0) return 0
  return Math.round(((normal - virtual) / normal) * 100)
}

/**
 * 获取渲染节省百分比
 */
const getRenderSavings = () => {
  const normal = comparisonData.normal.renderTime
  const virtual = comparisonData.virtual.renderTime
  if (normal === 0) return 0
  return Math.round(((normal - virtual) / normal) * 100)
}

// ============= 事件处理 =============

/**
 * 处理性能指标更新
 */
const handlePerformanceMetrics = (metrics: PerformanceMetrics) => {
  performanceMetrics.value = metrics
  
  // 记录对比数据
  if (config.enableVirtualScroll) {
    comparisonData.virtual.fps = metrics.fps
    comparisonData.virtual.memory = metrics.memoryUsage
    comparisonData.virtual.renderTime = metrics.renderTime
  } else {
    comparisonData.normal.fps = metrics.fps
    comparisonData.normal.memory = metrics.memoryUsage
    comparisonData.normal.renderTime = metrics.renderTime
  }
}

/**
 * 处理性能警告
 */
const handlePerformanceWarning = (warning: PerformanceWarning) => {
  message.warning(warning.message, {
    duration: 5000,
    closable: true
  })
}

/**
 * 处理虚拟滚动变化
 */
const handleVirtualScrollChange = (data: any) => {
  console.log('虚拟滚动变化:', data)
}

/**
 * 处理懒加载状态变化
 */
const handleLazyLoadStateChange = (itemId: string, state: string) => {
  console.log('懒加载状态变化:', itemId, state)
}

// ============= 生命周期 =============

onMounted(() => {
  // 初始生成测试数据
  generateTestData()
})
</script>

<style scoped>
.gridplus-test-page {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  margin-bottom: 16px;
}

.page-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 24px;
  font-weight: bold;
}

.control-panel,
.metrics-panel,
.grid-container,
.comparison-panel {
  width: 100%;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;
}

.metric-card {
  padding: 16px;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  text-align: center;
}

.metric-label {
  font-size: 12px;
  color: var(--text-color-2);
  margin-bottom: 8px;
}

.metric-value {
  font-size: 20px;
  font-weight: bold;
  color: var(--primary-color);
  font-family: 'Courier New', monospace;
}

.lazy-load-stats {
  padding: 12px;
  background: var(--body-color);
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.grid-wrapper {
  height: 600px;
  overflow: auto;
  border: 1px solid var(--border-color);
  border-radius: 8px;
}

.custom-grid-item {
  height: 100%;
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: var(--box-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.2s ease;
}

.custom-grid-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.item-header {
  padding: 8px 12px;
  background: var(--body-color);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
}

.chart-placeholder,
.table-placeholder,
.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-color-2);
}

.default-placeholder {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lazy-load-indicator {
  margin-top: 8px;
}

.comparison-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.comparison-item {
  text-align: center;
}

/* 项目类型样式 */
.item-type-chart {
  border-left: 4px solid var(--info-color);
}

.item-type-table {
  border-left: 4px solid var(--success-color);
}

.item-type-image {
  border-left: 4px solid var(--warning-color);
}

.item-type-text {
  border-left: 4px solid var(--primary-color);
}

.item-static {
  opacity: 0.8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gridplus-test-page {
    padding: 8px;
  }
  
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .comparison-grid {
    grid-template-columns: 1fr;
  }
  
  .grid-wrapper {
    height: 400px;
  }
}
</style>