<!--
  @file CleanDemo.vue
  @description PanelV2-Clean 演示页面
  验证纯净布局管理器的基础功能
-->

<template>
  <div class="clean-demo">
    <!-- 演示页面标题 -->
    <div class="demo-header">
      <h1>PanelV2-Clean 基础布局演示</h1>
      <p>验证纯净布局管理器的四区域布局和响应式功能</p>
    </div>
    
    <!-- 布局配置控制面板 -->
    <div class="demo-controls">
      <div class="control-group">
        <label>
          <input 
            v-model="layoutConfig.toolbar.visible" 
            type="checkbox"
          />
          显示工具栏
        </label>
        
        <label>
          <input 
            v-model="layoutConfig.sidebar.visible"
            type="checkbox"
          />
          显示侧边栏
        </label>
        
        <label>
          <input 
            v-model="layoutConfig.inspector.visible"
            type="checkbox"
          />
          显示检查器
        </label>
        
        <label>
          <input 
            v-model="responsive"
            type="checkbox"
          />
          启用响应式
        </label>
        
        <label>
          <input 
            v-model="animated"
            type="checkbox"
          />
          启用动画
        </label>
      </div>
      
      <div class="control-group">
        <label>
          工具栏高度: 
          <input 
            v-model.number="layoutConfig.toolbar.height"
            type="range"
            min="40"
            max="80"
            step="4"
          />
          {{ layoutConfig.toolbar.height }}px
        </label>
        
        <label>
          侧边栏宽度: 
          <input 
            v-model.number="layoutConfig.sidebar.width"
            type="range"
            min="200"
            max="400"
            step="20"
          />
          {{ layoutConfig.sidebar.width }}px
        </label>
        
        <label>
          检查器宽度: 
          <input 
            v-model.number="layoutConfig.inspector.width"
            type="range"
            min="250"
            max="500"
            step="25"
          />
          {{ layoutConfig.inspector.width }}px
        </label>
      </div>
    </div>
    
    <!-- 主要布局容器 -->
    <div class="demo-layout-container">
      <PureLayoutManager
        ref="layoutManagerRef"
        :config="layoutConfig"
        :responsive="responsive"
        :animated="animated"
        :animation-duration="200"
        @region-resize="handleRegionResize"
        @region-visibility-change="handleRegionVisibilityChange"
        @breakpoint-change="handleBreakpointChange"
        @layout-config-change="handleLayoutConfigChange"
      >
        <!-- 工具栏插槽 -->
        <template #toolbar="{ region, config }">
          <div class="demo-toolbar">
            <div class="toolbar-title">工具栏区域</div>
            <div class="toolbar-info">
              尺寸: {{ region.actualSize.width }} × {{ region.actualSize.height }}
            </div>
            <div class="toolbar-actions">
              <button @click="showMessage('工具栏', '撤销操作')">撤销</button>
              <button @click="showMessage('工具栏', '重做操作')">重做</button>
              <button @click="showMessage('工具栏', '保存文档')">保存</button>
              <button @click="showMessage('工具栏', '导出数据')">导出</button>
            </div>
          </div>
        </template>
        
        <!-- 侧边栏插槽 -->
        <template #sidebar="{ region, config }">
          <div class="demo-sidebar">
            <div class="sidebar-title">侧边栏区域</div>
            <div class="sidebar-info">
              尺寸: {{ region.actualSize.width }} × {{ region.actualSize.height }}
              <br />
              {{ region.collapsed ? '已折叠' : '已展开' }}
              <br />
              {{ region.resizing ? '调整中' : '正常' }}
            </div>
            
            <!-- 模拟组件列表 -->
            <div class="sidebar-content">
              <h4>组件库</h4>
              <div class="component-list">
                <div 
                  v-for="component in mockComponents"
                  :key="component.id"
                  class="component-item"
                  @click="selectComponent(component)"
                >
                  <div class="component-icon">{{ component.icon }}</div>
                  <div class="component-name">{{ component.name }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
        
        <!-- 画布插槽 -->
        <template #canvas="{ region, config }">
          <div class="demo-canvas">
            <div class="canvas-header">
              <div class="canvas-title">画布区域</div>
              <div class="canvas-info">
                尺寸: {{ region.actualSize.width }} × {{ region.actualSize.height }}
                | 当前断点: {{ currentBreakpoint }}
              </div>
            </div>
            
            <div class="canvas-content">
              <!-- 模拟画布网格 -->
              <div class="canvas-grid">
                <div 
                  v-for="i in 24"
                  :key="i"
                  class="grid-cell"
                  :class="{ 'occupied': mockOccupiedCells.includes(i) }"
                  @click="toggleGridCell(i)"
                >
                  {{ i }}
                </div>
              </div>
              
              <!-- 选中组件显示 -->
              <div v-if="selectedComponent" class="selected-component-display">
                <h4>已选中组件</h4>
                <p>{{ selectedComponent.icon }} {{ selectedComponent.name }}</p>
                <p>{{ selectedComponent.description }}</p>
              </div>
            </div>
          </div>
        </template>
        
        <!-- 检查器插槽 -->
        <template #inspector="{ region, config }">
          <div class="demo-inspector">
            <div class="inspector-title">检查器区域</div>
            <div class="inspector-info">
              尺寸: {{ region.actualSize.width }} × {{ region.actualSize.height }}
              <br />
              {{ region.collapsed ? '已折叠' : '已展开' }}
              <br />
              {{ region.resizing ? '调整中' : '正常' }}
            </div>
            
            <!-- 模拟属性配置 -->
            <div class="inspector-content">
              <h4>属性配置</h4>
              <div v-if="selectedComponent" class="property-editor">
                <div class="property-group">
                  <label>组件名称</label>
                  <input v-model="selectedComponent.name" type="text" />
                </div>
                
                <div class="property-group">
                  <label>组件描述</label>
                  <textarea v-model="selectedComponent.description" rows="3" />
                </div>
                
                <div class="property-group">
                  <label>组件图标</label>
                  <input v-model="selectedComponent.icon" type="text" />
                </div>
                
                <div class="property-actions">
                  <button @click="applyChanges">应用更改</button>
                  <button @click="resetProperties">重置属性</button>
                </div>
              </div>
              
              <div v-else class="no-selection">
                请从侧边栏选择一个组件
              </div>
            </div>
          </div>
        </template>
      </PureLayoutManager>
    </div>
    
    <!-- 事件日志 -->
    <div class="demo-event-log">
      <h3>事件日志</h3>
      <div class="event-log-content">
        <div 
          v-for="(log, index) in eventLogs.slice(-10)"
          :key="index"
          class="event-log-item"
        >
          <span class="event-time">{{ log.time }}</span>
          <span class="event-type">{{ log.type }}</span>
          <span class="event-detail">{{ log.detail }}</span>
        </div>
      </div>
      <button @click="clearEventLogs">清空日志</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import PureLayoutManager from '../core/PureLayoutManager.vue'
import type { PureLayoutConfig, LayoutEvents } from '../core/interfaces/PureLayout'

// 布局管理器引用
const layoutManagerRef = ref<InstanceType<typeof PureLayoutManager>>()

// 布局配置
const layoutConfig = reactive<Partial<PureLayoutConfig>>({
  toolbar: {
    visible: true,
    height: 48,
    size: 48,
    position: 'top',
    resizable: false,
    collapsible: false,
    minSize: 40,
    maxSize: 80
  },
  sidebar: {
    visible: true,
    width: 280,
    size: 280,
    position: 'left',
    resizable: true,
    collapsible: true,
    minSize: 200,
    maxSize: 400
  },
  inspector: {
    visible: true,
    width: 320,
    size: 320,
    position: 'right',
    resizable: true,
    collapsible: true,
    minSize: 250,
    maxSize: 500
  },
  canvas: {
    padding: 16,
    background: 'transparent',
    flex: 1
  }
})

// 布局选项
const responsive = ref(true)
const animated = ref(true)

// 当前断点
const currentBreakpoint = ref('desktop')

// 模拟组件数据
const mockComponents = ref([
  { id: 1, name: '文本组件', icon: '📝', description: '显示静态文本内容' },
  { id: 2, name: '图片组件', icon: '🖼️', description: '显示图片内容' },
  { id: 3, name: '图表组件', icon: '📊', description: '显示数据图表' },
  { id: 4, name: '按钮组件', icon: '🔘', description: '可点击的按钮' },
  { id: 5, name: '输入框', icon: '📝', description: '文本输入框' },
  { id: 6, name: '下拉框', icon: '📋', description: '选择下拉框' }
])

// 选中的组件
const selectedComponent = ref<typeof mockComponents.value[0] | null>(null)

// 模拟占用的网格单元
const mockOccupiedCells = ref<number[]>([1, 2, 5, 6, 9, 10])

// 事件日志
const eventLogs = ref<Array<{
  time: string
  type: string
  detail: string
}>>([])

/**
 * 添加事件日志
 */
const addEventLog = (type: string, detail: string) => {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  
  eventLogs.value.push({
    time,
    type,
    detail
  })
  
  // 保持最多50条日志
  if (eventLogs.value.length > 50) {
    eventLogs.value = eventLogs.value.slice(-50)
  }
}

/**
 * 处理区域大小调整事件
 */
const handleRegionResize = (payload: LayoutEvents['region-resize']) => {
  addEventLog('区域调整', `${payload.region}: ${payload.oldSize}px → ${payload.newSize}px`)
}

/**
 * 处理区域可见性变化事件
 */
const handleRegionVisibilityChange = (payload: LayoutEvents['region-visibility-change']) => {
  addEventLog('可见性变化', `${payload.region}: ${payload.visible ? '显示' : '隐藏'}`)
}

/**
 * 处理断点变化事件
 */
const handleBreakpointChange = (payload: LayoutEvents['breakpoint-change']) => {
  currentBreakpoint.value = payload.to
  addEventLog('断点变化', `${payload.from} → ${payload.to} (${payload.containerSize.width}px)`)
}

/**
 * 处理布局配置变化事件
 */
const handleLayoutConfigChange = (payload: LayoutEvents['layout-config-change']) => {
  addEventLog('配置变化', '布局配置已更新')
}

/**
 * 选择组件
 */
const selectComponent = (component: typeof mockComponents.value[0]) => {
  selectedComponent.value = { ...component }
  addEventLog('组件选择', `选中组件: ${component.name}`)
}

/**
 * 切换网格单元状态
 */
const toggleGridCell = (cellIndex: number) => {
  const index = mockOccupiedCells.value.indexOf(cellIndex)
  if (index > -1) {
    mockOccupiedCells.value.splice(index, 1)
    addEventLog('网格操作', `清空单元格 ${cellIndex}`)
  } else {
    mockOccupiedCells.value.push(cellIndex)
    addEventLog('网格操作', `占用单元格 ${cellIndex}`)
  }
}

/**
 * 显示消息
 */
const showMessage = (source: string, action: string) => {
  addEventLog(source, action)
  alert(`${source}: ${action}`)
}

/**
 * 应用更改
 */
const applyChanges = () => {
  addEventLog('属性更新', `应用 ${selectedComponent.value?.name} 的属性更改`)
}

/**
 * 重置属性
 */
const resetProperties = () => {
  if (selectedComponent.value) {
    const original = mockComponents.value.find(c => c.id === selectedComponent.value!.id)
    if (original) {
      Object.assign(selectedComponent.value, original)
      addEventLog('属性重置', `重置 ${original.name} 的属性`)
    }
  }
}

/**
 * 清空事件日志
 */
const clearEventLogs = () => {
  eventLogs.value = []
}

/**
 * 组件挂载
 */
onMounted(() => {
  addEventLog('系统', 'CleanDemo 演示页面已加载')
  
  // 模拟一些初始化事件
  setTimeout(() => {
    addEventLog('系统', '布局管理器初始化完成')
    addEventLog('系统', `当前断点: ${currentBreakpoint.value}`)
  }, 100)
})
</script>

<style scoped>
/* 演示页面整体样式 */
.clean-demo {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 演示标题 */
.demo-header {
  background: #fff;
  padding: 16px 24px;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.demo-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.demo-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

/* 控制面板 */
.demo-controls {
  background: #fff;
  padding: 16px 24px;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}

.control-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.control-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
}

.control-group input[type="checkbox"] {
  transform: scale(1.2);
}

.control-group input[type="range"] {
  width: 80px;
}

/* 布局容器 */
.demo-layout-container {
  flex: 1;
  margin: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

/* 演示区域通用样式 */
.demo-toolbar,
.demo-sidebar,
.demo-canvas,
.demo-inspector {
  height: 100%;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

/* 工具栏样式 */
.demo-toolbar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  flex-direction: row;
  align-items: center;
  gap: 16px;
}

.toolbar-title {
  font-size: 16px;
  font-weight: 600;
}

.toolbar-info {
  font-size: 12px;
  opacity: 0.8;
}

.toolbar-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.toolbar-actions button {
  padding: 6px 12px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.toolbar-actions button:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 侧边栏样式 */
.demo-sidebar {
  background: #fafafa;
  border-right: 1px solid #e8e8e8;
}

.sidebar-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.sidebar-info {
  font-size: 12px;
  color: #666;
  margin-bottom: 16px;
  line-height: 1.4;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
}

.sidebar-content h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.component-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.component-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.component-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 4px rgba(24, 144, 255, 0.1);
}

.component-icon {
  font-size: 18px;
}

.component-name {
  font-size: 14px;
  color: #333;
}

/* 画布样式 */
.demo-canvas {
  background: #f5f5f5;
}

.canvas-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e8e8e8;
}

.canvas-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.canvas-info {
  font-size: 12px;
  color: #666;
}

.canvas-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.canvas-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 8px;
  flex: 1;
}

.grid-cell {
  aspect-ratio: 1;
  background: #fff;
  border: 2px solid #e8e8e8;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.grid-cell:hover {
  border-color: #1890ff;
}

.grid-cell.occupied {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
}

.selected-component-display {
  background: #fff;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

.selected-component-display h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #333;
}

.selected-component-display p {
  margin: 4px 0;
  font-size: 12px;
  color: #666;
}

/* 检查器样式 */
.demo-inspector {
  background: #fafafa;
  border-left: 1px solid #e8e8e8;
}

.inspector-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.inspector-info {
  font-size: 12px;
  color: #666;
  margin-bottom: 16px;
  line-height: 1.4;
}

.inspector-content {
  flex: 1;
  overflow-y: auto;
}

.inspector-content h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.property-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.property-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.property-group label {
  font-size: 12px;
  color: #333;
  font-weight: 500;
}

.property-group input,
.property-group textarea {
  padding: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  font-size: 12px;
}

.property-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.property-actions button {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #1890ff;
  background: #1890ff;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.property-actions button:last-child {
  background: #fff;
  color: #1890ff;
}

.no-selection {
  text-align: center;
  color: #999;
  font-size: 14px;
  padding: 32px 16px;
}

/* 事件日志 */
.demo-event-log {
  background: #fff;
  border-top: 1px solid #e8e8e8;
  padding: 16px 24px;
  max-height: 200px;
  display: flex;
  flex-direction: column;
}

.demo-event-log h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

.event-log-content {
  flex: 1;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.6;
}

.event-log-item {
  display: flex;
  gap: 12px;
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
}

.event-time {
  color: #999;
  min-width: 60px;
}

.event-type {
  color: #1890ff;
  min-width: 80px;
  font-weight: 500;
}

.event-detail {
  color: #333;
  flex: 1;
}

.demo-event-log button {
  margin-top: 12px;
  padding: 6px 12px;
  border: 1px solid #e8e8e8;
  background: #f5f5f5;
  color: #666;
  border-radius: 4px;
  cursor: pointer;
  align-self: flex-start;
}

.demo-event-log button:hover {
  background: #e8e8e8;
}
</style>