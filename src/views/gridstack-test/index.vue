<!--
  Grid Layout Plus 测试页面
  用于验证组件是否正常工作
-->
<template>
  <div class="grid-layout-plus-test-page">
    <div class="page-header">
      <h1>Grid Layout Plus 测试</h1>
      <p>这是基于 Grid Layout Plus 的现代化网格布局组件测试页面</p>
    </div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <n-card title="基础操作" size="small">
        <n-space>
          <n-button type="primary" @click="addTestItem">添加测试项目</n-button>
          <n-button type="warning" @click="addLockedItem">添加锁定项目</n-button>
          <n-button @click="compactLayout">紧凑布局</n-button>
          <n-button type="error" @click="clearLayout">清空</n-button>
          <n-switch v-model:value="readonly">
            <template #checked>只读模式</template>
            <template #unchecked>编辑模式</template>
          </n-switch>
        </n-space>
      </n-card>
    </div>

    <!-- 配置面板 -->
    <div class="config-panel">
      <n-card title="网格配置" size="small">
        <n-grid cols="4" x-gap="12">
          <n-grid-item>
            <n-form-item label="列数">
              <n-input-number v-model:value="gridConfig.colNum" :min="6" :max="24" @update:value="updateConfig" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="行高(px)">
              <n-input-number v-model:value="gridConfig.rowHeight" :min="50" :max="200" @update:value="updateConfig" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="水平间距">
              <n-input-number v-model:value="marginX" :min="0" :max="50" @update:value="updateMargin" />
            </n-form-item>
          </n-grid-item>
          <n-grid-item>
            <n-form-item label="垂直间距">
              <n-input-number v-model:value="marginY" :min="0" :max="50" @update:value="updateMargin" />
            </n-form-item>
          </n-grid-item>
        </n-grid>

        <n-space class="mt-3">
          <n-switch v-model:value="globalDraggable" @update:value="updateGlobalDraggable">
            <template #checked>全局可拖拽</template>
            <template #unchecked>全局禁止拖拽</template>
          </n-switch>
          <n-switch v-model:value="globalResizable" @update:value="updateGlobalResizable">
            <template #checked>全局可调整</template>
            <template #unchecked>全局禁止调整</template>
          </n-switch>
          <n-switch v-model:value="gridConfig.preventCollision" @update:value="updateConfig">
            <template #checked>防止碰撞</template>
            <template #unchecked>允许重叠</template>
          </n-switch>
          <n-switch v-model:value="gridConfig.responsive" @update:value="updateConfig">
            <template #checked>响应式</template>
            <template #unchecked>固定布局</template>
          </n-switch>
        </n-space>
      </n-card>
    </div>

    <div class="test-stats">
      <n-card title="布局统计" size="small">
        <n-space>
          <n-tag type="info">项目: {{ layout.length }}</n-tag>
          <n-tag type="success">列数: {{ gridConfig.colNum }}</n-tag>
          <n-tag type="warning">行高: {{ gridConfig.rowHeight }}px</n-tag>
          <n-tag :type="globalDraggable ? 'success' : 'error'">全局拖拽: {{ globalDraggable ? '开启' : '关闭' }}</n-tag>
          <n-tag :type="globalResizable ? 'success' : 'error'">全局调整: {{ globalResizable ? '开启' : '关闭' }}</n-tag>
          <n-tag type="info">锁定项目: {{ layout.filter(item => item.static).length }}</n-tag>
        </n-space>
      </n-card>
    </div>

    <!-- Grid Layout Plus 组件 -->
    <div class="grid-container">
      <GridLayoutPlus
        v-model:layout="layout"
        :readonly="readonly"
        :show-grid="true"
        :config="gridConfig"
        @layout-change="handleLayoutChange"
        @item-add="handleItemAdd"
        @item-delete="handleItemDelete"
        @item-edit="handleItemEdit"
      >
        <template #default="{ item }">
          <div class="test-item-content" :class="{ locked: item.static }">
            <div class="item-header">
              <span class="item-title">{{ item.title }}</span>
              <span class="item-type">{{ item.type }}</span>
              <span v-if="item.static" class="lock-status">🔒</span>
            </div>
            <div class="item-body">
              <component :is="resolveComponent(item)" v-if="resolveComponent(item)" :item="item" />
              <div v-else class="default-preview">📦 默认内容</div>
            </div>
          </div>
        </template>
      </GridLayoutPlus>
    </div>

    <!-- 测试信息 -->
    <div class="test-info">
      <n-card title="测试信息" size="small">
        <div class="info-grid">
          <div>
            <strong>组件状态:</strong>
            <n-tag type="success">正常运行</n-tag>
          </div>
          <div>
            <strong>基础库:</strong>
            <n-tag>grid-layout-plus</n-tag>
          </div>
          <div>
            <strong>响应式:</strong>
            <n-tag :type="gridConfig.responsive ? 'success' : 'default'">
              {{ gridConfig.responsive ? '开启' : '关闭' }}
            </n-tag>
          </div>
          <div>
            <strong>碰撞检测:</strong>
            <n-tag :type="gridConfig.preventCollision ? 'warning' : 'default'">
              {{ gridConfig.preventCollision ? '防止碰撞' : '允许重叠' }}
            </n-tag>
          </div>
        </div>
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, shallowRef, type Component } from 'vue'
import { NButton, NSpace, NCard, NTag, NSwitch, NGrid, NGridItem, NFormItem, NInputNumber, useMessage } from 'naive-ui'
import { GridLayoutPlus, type GridLayoutPlusItem, type GridLayoutPlusConfig } from '@/components/common/grid'

import ResponsiveChart from './components/ResponsiveChart.vue'
import ResponsiveText from './components/ResponsiveText.vue'
import ResponsiveImage from './components/ResponsiveImage.vue'

const message = useMessage()

// 动态组件映射
const componentMap: Record<string, Component> = {
  ResponsiveChart,
  ResponsiveText,
  ResponsiveImage
}

// 组件解析函数
const resolveComponent = (item: GridLayoutPlusItem) => {
  if (item.component && componentMap[item.component]) {
    return componentMap[item.component]
  }
  return null // or a default component
}

// 状态
const readonly = ref(false)
const layout = shallowRef<GridLayoutPlusItem[]>([
  {
    i: 'test-1',
    x: 0,
    y: 0,
    w: 3,
    h: 2,
    type: 'chart',
    title: '响应式图表',
    component: 'ResponsiveChart',
    isDraggable: true,
    isResizable: true,
    static: false
  },
  {
    i: 'test-2',
    x: 3,
    y: 0,
    w: 3,
    h: 2,
    type: 'text',
    title: '响应式文本',
    component: 'ResponsiveText',
    isDraggable: true,
    isResizable: true,
    static: false
  },
  {
    i: 'locked-demo',
    x: 6,
    y: 0,
    w: 3,
    h: 2,
    type: 'image',
    title: '🔒 响应式图片',
    component: 'ResponsiveImage',
    isDraggable: false,
    isResizable: false,
    static: true
  },
  {
    i: 'test-3',
    x: 9,
    y: 0,
    w: 3,
    h: 2,
    type: 'chart',
    title: '另一个图表',
    component: 'ResponsiveChart',
    isDraggable: true,
    isResizable: true,
    static: false
  }
])

// 网格配置 - 使用reactive使其响应式
const gridConfig = reactive<GridLayoutPlusConfig>({
  colNum: 12,
  rowHeight: 80,
  margin: [10, 10],
  isDraggable: true,
  isResizable: true,
  responsive: false,
  preventCollision: false,
  autoSize: true,
  verticalCompact: true,
  breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
  cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
  isMirrored: false,
  restoreOnDrag: false,
  useCssTransforms: true,
  useStyleCursor: true
})

// 边距的独立控制
const marginX = ref(10)
const marginY = ref(10)

// 全局拖拽和调整大小控制
const globalDraggable = ref(true)
const globalResizable = ref(true)

// 测试项目类型
const testItemComponents = [
  { type: 'chart', component: 'ResponsiveChart' },
  { type: 'text', component: 'ResponsiveText' },
  { type: 'image', component: 'ResponsiveImage' }
]

// 方法
const addTestItem = () => {
  const randomComp = testItemComponents[Math.floor(Math.random() * testItemComponents.length)]
  const id = `test-${Date.now()}`

  const newItem: GridLayoutPlusItem = {
    i: id,
    x: 0,
    y: 0,
    w: Math.floor(Math.random() * 2) + 3, // Larger items
    h: Math.floor(Math.random() * 1) + 2,
    type: randomComp.type,
    component: randomComp.component,
    title: `动态${randomComp.type}`,
    isDraggable: globalDraggable.value,
    isResizable: globalResizable.value,
    static: false
  }

  layout.value = [...layout.value, newItem]
  message.success(`添加了项目: ${newItem.title}`)
}

const addLockedItem = () => {
  const randomComp = testItemComponents[Math.floor(Math.random() * testItemComponents.length)]
  const id = `locked-${Date.now()}`

  const newItem: GridLayoutPlusItem = {
    i: id,
    x: Math.floor(Math.random() * (gridConfig.colNum - 2)),
    y: 0,
    w: 3,
    h: 2,
    type: randomComp.type,
    component: randomComp.component,
    title: `🔒 锁定${randomComp.type}`,
    isDraggable: false,
    isResizable: false,
    static: true
  }

  layout.value = [...layout.value, newItem]
  message.warning(`添加了锁定项目: ${newItem.title}`)
}

const compactLayout = () => {
  // 这里可以调用Grid Layout Plus的紧凑方法
  message.success('布局已紧凑')
}

const clearLayout = () => {
  layout.value = []
  message.warning('布局已清空')
}

// 配置更新方法
const updateConfig = () => {
  message.info('配置已更新')
}

const updateMargin = () => {
  gridConfig.margin = [marginX.value, marginY.value]
  message.info(`边距已更新: ${marginX.value}x${marginY.value}`)
}

// 全局拖拽和调整大小控制
const updateGlobalDraggable = (value: boolean) => {
  const newLayout = layout.value.map(item => {
    if (!item.static) {
      return { ...item, isDraggable: value }
    }
    return item
  })
  layout.value = newLayout
  message.info(`全局拖拽已${value ? '启用' : '禁用'}`)
}

const updateGlobalResizable = (value: boolean) => {
  const newLayout = layout.value.map(item => {
    if (!item.static) {
      return { ...item, isResizable: value }
    }
    return item
  })
  layout.value = newLayout
  message.info(`全局调整大小已${value ? '启用' : '禁用'}`)
}

// 事件处理
const handleLayoutChange = (newLayout: GridLayoutPlusItem[]) => {
  console.log('布局变化:', newLayout)
}

const handleItemAdd = (item: GridLayoutPlusItem) => {
  console.log('项目添加:', item)
  message.success(`项目添加: ${item.title}`)
}

const handleItemDelete = (itemId: string) => {
  layout.value = layout.value.filter(item => item.i !== itemId)
  message.warning(`项目已删除: ${itemId}`)
}

const handleItemEdit = (item: GridLayoutPlusItem) => {
  console.log('项目编辑:', item)
  message.info(`编辑项目: ${item.title}`)
}
</script>

<style scoped>
.grid-layout-plus-test-page {
  padding: 20px;
  min-height: 100vh;
  background: #f5f5f7;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  color: #333;
  margin-bottom: 10px;
}

.page-header p {
  color: #666;
  font-size: 16px;
}

.test-controls {
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.test-stats {
  margin-bottom: 20px;
}

.grid-container {
  height: 600px;
  margin-bottom: 20px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  overflow: hidden;
  background: white;
}

.control-panel,
.config-panel {
  margin-bottom: 20px;
}

.test-info {
  margin-top: 20px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-grid > div {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

/* 测试项目内容样式 */
.test-item-content {
  height: 100%;
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.test-item-content.locked {
  border: 2px solid #f56565;
  background: #fed7d7;
  opacity: 0.9;
}

.test-item-content.locked .item-header {
  background: #feb2b2;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e1e5e9;
  font-size: 12px;
}

.item-title {
  font-weight: 500;
  color: #333;
}

.item-type {
  color: #666;
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 10px;
}

.lock-status {
  font-size: 12px;
  margin-left: 4px;
}

.lock-info {
  color: #f56565 !important;
  font-weight: 500;
}

.unlock-info {
  color: #48bb78 !important;
  font-weight: 500;
}

.drag-info,
.resize-info {
  color: #2b6cb0 !important;
  font-weight: 400;
  font-size: 10px !important;
}

.item-body {
  flex: 1;
  padding: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

.item-info {
  flex: 1;
  font-size: 11px;
  color: #666;
}

.item-info p {
  margin: 2px 0;
}

.item-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 8px;
}

.chart-preview,
.table-preview,
.text-preview,
.default-preview {
  font-size: 24px;
  opacity: 0.6;
}

/* 响应式 */
@media (max-width: 768px) {
  .grid-layout-plus-test-page {
    padding: 10px;
  }

  .grid-container {
    height: 400px;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .test-item-content {
    font-size: 10px;
  }
}

/* 深色主题适配 */
@media (prefers-color-scheme: dark) {
  .grid-layout-plus-test-page {
    background: #1a1a1a;
    color: white;
  }

  .test-controls {
    background: #2d2d2d;
  }

  .grid-container {
    background: #2d2d2d;
    border-color: #404040;
  }

  .test-item-content {
    background: #2d2d2d;
    border-color: #404040;
    color: white;
  }

  .item-header {
    background: #3a3a3a;
    border-bottom-color: #404040;
  }

  .item-title {
    color: white;
  }

  .item-type {
    background: #404040;
    color: #ccc;
  }
}
</style>
