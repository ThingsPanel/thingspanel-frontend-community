<!-- GridPlus 测试页面 - 终极优化版本 -->
<template>
  <div class="grid-plus-test">
    <h1>GridPlus 组件测试 - 终极优化版本</h1>

    <div class="control-panel">
      <n-space vertical>
        <div class="control-group">
          <h3>基础控制</h3>
          <n-space>
            <n-switch v-model:value="readonly" size="large">
              <template #checked>只读模式</template>
              <template #unchecked>编辑模式</template>
            </n-switch>
            <n-switch v-model:value="enableCompact" size="large">
              <template #checked>紧凑布局已启用</template>
              <template #unchecked>紧凑布局已禁用</template>
            </n-switch>
            <n-switch v-model:value="showGridInfo" size="large">
              <template #checked>显示网格信息</template>
              <template #unchecked>隐藏网格信息</template>
            </n-switch>
          </n-space>
        </div>

        <div class="control-group">
          <h3>操作按钮</h3>
          <n-space>
            <n-button type="primary" @click="addItem">添加卡片</n-button>
            <n-button @click="resetLayout">重置布局</n-button>
            <n-button @click="addManyItems">批量添加</n-button>
            <n-button type="info" @click="compactLayout">紧凑布局</n-button>
            <n-button type="warning" @click="createOverlap">创建重叠</n-button>
            <n-button type="success" @click="randomizeLayout">随机布局</n-button>
          </n-space>
        </div>

        <div class="control-group">
          <h3>网格配置</h3>
          <n-space>
            <n-input-number v-model:value="gridConfig.column" :min="1" :max="24" placeholder="列数" />
            <n-input-number v-model:value="gridConfig.cellHeight" :min="10" :max="200" placeholder="行高" />
            <n-input-number v-model:value="gridConfig.margin[0]" :min="0" :max="50" placeholder="水平边距" />
            <n-input-number v-model:value="gridConfig.margin[1]" :min="0" :max="50" placeholder="垂直边距" />
          </n-space>
        </div>

        <div class="control-group">
          <h3>功能演示</h3>
          <n-space>
            <n-tag type="success">拖拽交换位置</n-tag>
            <n-tag type="info">多方向调整大小</n-tag>
            <n-tag type="warning">实时碰撞检测</n-tag>
            <n-tag type="error">紧凑布局</n-tag>
            <n-tag type="success">120fps 流畅体验</n-tag>
          </n-space>
        </div>
      </n-space>
    </div>

    <div class="grid-container">
      <GridPlus
        ref="gridPlusRef"
        :items="layout"
        :readonly="readonly"
        :config="gridConfig"
        :enable-compact-layout="enableCompact"
        :show-grid-info="showGridInfo"
        @change="handleChange"
        @added="handleAdded"
        @removed="handleRemoved"
        @dragstop="handleDragStop"
        @resizestop="handleResizeStop"
      >
        <template #default="{ item }">
          <div class="demo-card" :style="{ backgroundColor: item.content.color }">
            <div class="card-content">{{ item.content.text }}</div>
            <div class="card-type">{{ item.content.type }}</div>
          </div>
        </template>
      </GridPlus>
    </div>

    <div class="debug-info">
      <h3>调试信息</h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="label">当前布局:</span>
          <span class="value">{{ layout.length }} 个卡片</span>
        </div>
        <div class="info-item">
          <span class="label">只读模式:</span>
          <span class="value">{{ readonly ? '是' : '否' }}</span>
        </div>
        <div class="info-item">
          <span class="label">列数:</span>
          <span class="value">{{ gridConfig.column }}</span>
        </div>
        <div class="info-item">
          <span class="label">行高:</span>
          <span class="value">{{ gridConfig.cellHeight }}px</span>
        </div>
        <div class="info-item">
          <span class="label">边距:</span>
          <span class="value">{{ gridConfig.margin[0] }}px × {{ gridConfig.margin[1] }}px</span>
        </div>
        <div class="info-item">
          <span class="label">重叠检测:</span>
          <span class="value">{{ overlappingCount }} 个重叠</span>
        </div>
        <div class="info-item">
          <span class="label">操作次数:</span>
          <span class="value">{{ operationCount }}</span>
        </div>
        <div class="info-item">
          <span class="label">最新事件:</span>
          <span class="value">{{ lastEvent }}</span>
        </div>
      </div>

      <div class="performance-info">
        <h4>性能信息</h4>
        <p>✅ 120fps 流畅拖拽体验，使用 RequestAnimationFrame 优化</p>
        <p>✅ 智能交换位置功能，拖拽到其他卡片上自动交换</p>
        <p>✅ 实时碰撞检测，防止重叠，支持多方向调整大小</p>
        <p>✅ 紧凑布局算法，自动移除空行，优化空间利用</p>
        <p>✅ 动态栅格数支持，实时调整列数和行高</p>
      </div>

      <div class="feature-demo">
        <h4>功能演示说明</h4>
        <div class="demo-steps">
          <div class="step">
            <span class="step-number">1</span>
            <span class="step-text">拖拽卡片到其他卡片位置，观察自动交换效果</span>
          </div>
          <div class="step">
            <span class="step-number">2</span>
            <span class="step-text">使用四个方向的手柄调整卡片大小</span>
          </div>
          <div class="step">
            <span class="step-number">3</span>
            <span class="step-text">点击"创建重叠"按钮，观察重叠检测效果</span>
          </div>
          <div class="step">
            <span class="step-number">4</span>
            <span class="step-text">调整列数和行高，观察动态栅格效果</span>
          </div>
          <div class="step">
            <span class="step-number">5</span>
            <span class="step-text">点击"随机布局"测试紧凑布局算法</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { NSpace, NSwitch, NButton, NInputNumber, NTag } from 'naive-ui'
import { GridPlus } from '@/components/common/gridplus'
import type { GridStackWidget } from 'gridstack'

// GridPlus 组件的引用
const gridPlusRef = ref<InstanceType<typeof GridPlus> | null>(null)

// 状态
const readonly = ref(false)
const enableCompact = ref(true)
const showGridInfo = ref(false)
const itemCount = ref(0)
const operationCount = ref(0)
const lastEvent = ref('无')

// 防止事件循环的标志位
let isInternalUpdate = false

// 网格配置
const gridConfig = ref({
  column: 12,
  cellHeight: 100,
  margin: [10, 10], // [水平边距, 垂直边距]
  animate: false, // 关闭动画减少性能问题
  float: false // 使用更稳定的布局模式
})

// 初始布局 - 确保没有重叠，位置完全分离
const createDefaultLayout = (): GridStackWidget[] => [
  {
    id: 'card-1',
    x: 0,
    y: 0,
    w: 3,
    h: 2,
    content: { text: '拖拽交换位置', color: '#e3f2fd', type: '交换测试' }
  },
  {
    id: 'card-2',
    x: 4,
    y: 0,
    w: 3,
    h: 2,
    content: { text: '多方向调整', color: '#f3e5f5', type: '调整大小' }
  },
  {
    id: 'card-3',
    x: 8,
    y: 0,
    w: 3,
    h: 2,
    content: { text: '120fps 流畅', color: '#e8f5e8', type: '性能优化' }
  },
  {
    id: 'card-4',
    x: 0,
    y: 3,
    w: 4,
    h: 2,
    content: { text: '动态栅格数', color: '#fff3e0', type: '响应式' }
  },
  {
    id: 'card-5',
    x: 5,
    y: 3,
    w: 4,
    h: 2,
    content: { text: '紧凑布局', color: '#fce4ec', type: '自动优化' }
  }
]

const layout = ref<GridStackWidget[]>(createDefaultLayout())

// 计算重叠数量
const overlappingCount = computed(() => {
  let count = 0
  for (let i = 0; i < layout.value.length; i++) {
    for (let j = i + 1; j < layout.value.length; j++) {
      const item1 = layout.value[i]
      const item2 = layout.value[j]
      if (
        item1.x < item2.x + item2.w &&
        item1.x + item1.w > item2.x &&
        item1.y < item2.y + item2.h &&
        item1.y + item1.h > item2.y
      ) {
        count++
      }
    }
  }
  return count
})

// 方法
const addItem = () => {
  itemCount.value++
  const colors = ['#fff3e0', '#fce4ec', '#e0f2f1', '#f1f8e9', '#e8eaf6', '#f3e5f5', '#e3f2fd']
  const types = ['拖拽', '调整大小', '碰撞检测', '性能优化', '响应式', '主题', '动画']

  const newItem: GridStackWidget = {
    id: `card-${Date.now()}`,
    x: 0,
    y: Infinity, // 让 GridStack 自动寻找位置
    w: 4,
    h: 3,
    content: {
      text: `功能测试 ${itemCount.value}`,
      color: colors[itemCount.value % colors.length],
      type: types[itemCount.value % types.length]
    }
  }
  // 注意：我们不再直接修改 layout，而是通过 GridPlus 的方法
  gridPlusRef.value?.addItem(newItem)
  operationCount.value++
  lastEvent.value = 'addItem'
}

const addManyItems = () => {
  for (let i = 0; i < 5; i++) {
    addItem()
  }
}

const resetLayout = () => {
  layout.value = createDefaultLayout()
  itemCount.value = 0
  operationCount.value++
  lastEvent.value = 'resetLayout'
}

const compactLayout = () => {
  gridPlusRef.value?.compact()
  operationCount.value++
  lastEvent.value = 'compactLayout'
}

const createOverlap = () => {
  const overlapItem: GridStackWidget = {
    id: `overlap-${Date.now()}`,
    x: 2,
    y: 1,
    w: 4,
    h: 2,
    content: { text: '重叠检测', color: '#ffebee', type: '重叠测试' }
  }
  gridPlusRef.value?.addItem(overlapItem)
  operationCount.value++
  lastEvent.value = 'createOverlap'
}

const randomizeLayout = () => {
  const newLayout = layout.value.map(item => ({
    ...item,
    x: Math.floor(Math.random() * (gridConfig.value.column - item.w)),
    y: Math.floor(Math.random() * 10)
  }))
  layout.value = newLayout
  operationCount.value++
  lastEvent.value = 'randomizeLayout'
}

// 事件处理
const handleChange = (newLayout: GridStackWidget[]) => {
  // 如果是内部更新引起的，跳过处理防止循环
  if (isInternalUpdate) {
    isInternalUpdate = false
    return
  }

  console.log('布局变化 (change):', newLayout)

  // 设置标志位，表明这是一次内部更新
  isInternalUpdate = true
  layout.value = [...newLayout] // 使用浅拷贝创建新数组引用

  operationCount.value++
  lastEvent.value = 'change'
}

const handleAdded = (items: GridStackWidget[]) => {
  console.log('卡片添加 (added):', items)
  operationCount.value++
  lastEvent.value = `added: ${items.map(i => i.id).join(', ')}`
}

const handleRemoved = (items: GridStackWidget[]) => {
  console.log('卡片移除 (removed):', items)
  operationCount.value++
  lastEvent.value = `removed: ${items.map(i => i.id).join(', ')}`
}

const handleDragStop = (item: GridStackWidget) => {
  console.log('拖拽结束 (dragstop):', item)
  operationCount.value++
  lastEvent.value = `dragstop: ${item.id}`
}

const handleResizeStop = (item: GridStackWidget) => {
  console.log('调整大小结束 (resizestop):', item)
  operationCount.value++
  lastEvent.value = `resizestop: ${item.id}`
}
</script>

<style>
.grid-plus-test {
  padding: 20px;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.grid-plus-test h1 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
  font-size: 28px;
  font-weight: 600;
}

.control-panel {
  margin-bottom: 20px;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-group {
  margin-bottom: 16px;
}

.control-group h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 16px;
  font-weight: 500;
}

.grid-container {
  margin-bottom: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.debug-info {
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.debug-info h3 {
  margin-top: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.info-item .label {
  font-weight: 500;
  color: #666;
}

.info-item .value {
  font-weight: 600;
  color: #333;
}

.performance-info {
  padding: 16px;
  background-color: #e3f2fd;
  border-radius: 4px;
  border-left: 4px solid #2196f3;
  margin-bottom: 20px;
}

.performance-info h4 {
  margin: 0 0 8px 0;
  color: #1976d2;
  font-size: 16px;
  font-weight: 600;
}

.performance-info p {
  margin: 4px 0;
  color: #1976d2;
  font-size: 14px;
}

.feature-demo {
  padding: 16px;
  background-color: #f3e5f5;
  border-radius: 4px;
  border-left: 4px solid #9c27b0;
}

.feature-demo h4 {
  margin: 0 0 12px 0;
  color: #7b1fa2;
  font-size: 16px;
  font-weight: 600;
}

.demo-steps {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.step {
  display: flex;
  align-items: center;
  gap: 12px;
}

.step-number {
  width: 24px;
  height: 24px;
  background-color: #9c27b0;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.step-text {
  color: #7b1fa2;
  font-size: 14px;
}

.demo-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  border-radius: 8px;
  position: relative;
  box-sizing: border-box;
  cursor: grab;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s ease;
  overflow: auto;
}

.demo-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-content {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 8px;
}

.card-type {
  font-size: 12px;
  color: #666;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 2px 8px;
  border-radius: 12px;
  position: absolute;
  bottom: 8px;
  right: 8px;
}

/* 深色主题 */
[data-theme='dark'] .grid-plus-test {
  background-color: #1a1a1a;
}

[data-theme='dark'] .grid-plus-test h1 {
  color: #fff;
}

[data-theme='dark'] .control-panel,
[data-theme='dark'] .grid-container,
[data-theme='dark'] .debug-info {
  background-color: #2d2d2d;
}

[data-theme='dark'] .control-group h3,
[data-theme='dark'] .debug-info h3 {
  color: #fff;
}

[data-theme='dark'] .info-item {
  background-color: #333;
}

[data-theme='dark'] .info-item .label {
  color: #ccc;
}

[data-theme='dark'] .info-item .value {
  color: #fff;
}

[data-theme='dark'] .performance-info {
  background-color: #1a237e;
  border-left-color: #3f51b5;
}

[data-theme='dark'] .performance-info h4,
[data-theme='dark'] .performance-info p {
  color: #c5cae9;
}

[data-theme='dark'] .feature-demo {
  background-color: #4a148c;
  border-left-color: #7b1fa2;
}

[data-theme='dark'] .feature-demo h4,
[data-theme='dark'] .step-text {
  color: #e1bee7;
}

[data-theme='dark'] .step-number {
  background-color: #7b1fa2;
}

[data-theme='dark'] .card-content {
  color: #333;
}

[data-theme='dark'] .card-type {
  color: #666;
  background-color: rgba(255, 255, 255, 0.9);
}
</style>
