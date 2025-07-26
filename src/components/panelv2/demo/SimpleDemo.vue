<template>
  <div class="dual-renderer-demo">
    <!-- 演示头部 -->
    <div class="demo-header">
      <div class="demo-title">
        <h2>PanelV2 双渲染器架构演示</h2>
        <p>同一套数据，多种渲染方式 - 展示可插拔渲染器设计</p>
      </div>
      
      <!-- 双层渲染器切换按钮 -->
      <div class="dual-renderer-switcher">
        <div class="renderer-group">
          <label>卡片渲染器 ({{ availableCardRenderers.length }}):</label>
          <!-- 强制显示按钮，不依赖动态数据 -->
          <button 
            :class="['renderer-btn', { active: currentCardRendererId === 'normal' }]"
            @click="switchCardRenderer('normal')"
          >
            <i class="fa fa-square"></i>
            普通渲染
          </button>
          <button 
            :class="['renderer-btn', { active: currentCardRendererId === '3d' }]"
            @click="switchCardRenderer('3d')"
          >
            <i class="fa fa-cube"></i>
            3D渲染
          </button>
        </div>
        <div class="renderer-group">
          <label>看板渲染器 ({{ availablePanelRenderers.length }}):</label>
          <!-- 强制显示按钮，不依赖动态数据 -->
          <button 
            :class="['renderer-btn', { active: currentPanelRendererId === 'grid' }]"
            @click="switchPanelRenderer('grid')"
          >
            <i class="fa fa-th"></i>
            网格布局
          </button>
          <button 
            :class="['renderer-btn', { active: currentPanelRendererId === 'canvas' }]"
            @click="switchPanelRenderer('canvas')"
          >
            <i class="fa fa-paint-brush"></i>
            画布布局
          </button>
        </div>
      </div>
      
      <!-- 控制按钮 -->
      <div class="demo-controls">
        <button class="control-btn" @click="addSampleData">
          <i class="fa fa-plus"></i>
          添加示例数据
        </button>
        <button class="control-btn secondary" @click="clearData">
          <i class="fa fa-trash"></i>
          清空数据
        </button>
      </div>
    </div>
    
    <!-- 主要内容区域 -->
    <div class="demo-content">
      <!-- 左侧：组件库和数据展示 -->
      <div class="demo-sidebar">
        <div class="sidebar-section">
          <h4>组件库</h4>
          <div class="component-list">
            <div 
              v-for="template in componentTemplates" 
              :key="template.id"
              :class="['component-item', { dragging: isDragging }]"
              :data-template-id="template.id"
            >
              <i :class="template.icon"></i>
              {{ template.name }}
            </div>
          </div>
        </div>
        <div class="sidebar-section">
          <h4>当前卡片 ({{ sampleCards.length }})</h4>
          <div class="card-list">
            <div 
              v-for="card in sampleCards" 
              :key="card.id"
              :class="['card-item', { selected: selectedCardId === card.id }]"
              @click="handleCardSelect(card.id)"
            >
              {{ card.title }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- 中间：渲染区域 -->
      <div class="demo-canvas">
        <div class="canvas-header">
          <div class="renderer-status">
            <h3>当前组合</h3>
            <div class="combination-display">
              <span class="renderer-chip card-renderer">
                <i :class="getCardRendererIcon(currentCardRendererId)"></i>
                {{ currentRenderers?.cardRenderer?.name || '未知' }}
              </span>
              <span class="plus">+</span>
              <span class="renderer-chip panel-renderer">
                <i :class="getPanelRendererIcon(currentPanelRendererId)"></i>
                {{ currentRenderers?.panelRenderer?.name || '未知' }}
              </span>
            </div>
            <small>拖拽的组件将使用当前选中的卡片渲染器进行渲染</small>
          </div>
        </div>
        <div 
          ref="canvasContainer" 
          class="canvas-container"
          :class="{ 'drag-over': isDragging }"
        >
          <!-- 双层渲染器将在这里渲染内容 -->
          <div v-show="sampleCards.length === 0" class="empty-canvas">
            <div class="empty-hint">
              <i class="fa fa-mouse-pointer"></i>
              <p>从左侧组件库拖拽组件到这里开始设计</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 右侧：配置面板 -->
      <div class="demo-inspector">
        <div class="inspector-tabs">
          <div class="tab-buttons">
            <button 
              :class="['tab-btn', { active: activeTab === 'card' }]"
              @click="switchToConfigTab('card')"
            >
              选中卡片
            </button>
            <button 
              :class="['tab-btn', { active: activeTab === 'panel' }]"
              @click="switchToConfigTab('panel')"
            >
              看板配置
            </button>
            <button 
              v-if="selectedCard"
              :class="['tab-btn', { active: activeTab === 'selection' }]"
              @click="activeTab = 'selection'"
            >
              选中项
            </button>
          </div>
          
          <div class="tab-content">
            <!-- 选中卡片配置 -->
            <div v-show="activeTab === 'card'" class="config-panel">
              <div v-if="selectedCard" ref="cardConfigContainer" class="config-form-wrapper"></div>
              <div v-else class="no-selection-hint">
                <p>请先选中一个卡片来配置其样式</p>
                <small>点击画布中的任意卡片即可选中</small>
              </div>
            </div>
            
            <!-- 看板渲染器配置 -->
            <div v-show="activeTab === 'panel'" class="config-panel">
              <div ref="panelConfigContainer" class="config-form-wrapper"></div>
            </div>
            
            <!-- 选中卡片信息 -->
            <div v-show="activeTab === 'selection'" v-if="selectedCard" class="config-panel">
              <h4>选中卡片信息</h4>
              <div class="selected-card-info">
                <div class="info-item">
                  <label>ID:</label>
                  <span>{{ selectedCard.id }}</span>
                </div>
                <div class="info-item">
                  <label>标题:</label>
                  <span>{{ selectedCard.title }}</span>
                </div>
                <div class="info-item">
                  <label>值:</label>
                  <span>{{ selectedCard.value }}</span>
                </div>
                <div class="info-item">
                  <label>类型:</label>
                  <span>{{ selectedCard.type }}</span>
                </div>
                <div class="info-item">
                  <label>布局:</label>
                  <span>{{ selectedCard.layout.x }},{{ selectedCard.layout.y }} ({{ selectedCard.layout.w }}×{{ selectedCard.layout.h }})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import Sidebar from '../sidebar/Sidebar.vue'
import RedesignedInspector from '../inspector/RedesignedInspector.vue'
import { DualRenderEngine, type ComponentTemplate, type DragCallbacks } from '../renderers/DualRenderEngine'
import { NormalCardRenderer } from '../renderers/card-renderers/NormalCardRenderer'
import { Card3DRenderer } from '../renderers/card-renderers/Card3DRenderer'
import { GridPanelRenderer } from '../renderers/panel-renderers/GridPanelRenderer'
import { CanvasPanelRenderer } from '../renderers/panel-renderers/CanvasPanelRenderer'
import type { CardData } from '../renderers/card-renderers/CardRenderer'

// 双层渲染引擎
const dualEngine = new DualRenderEngine()
const canvasContainer = ref<HTMLElement>()
const cardConfigContainer = ref<HTMLElement>()
const panelConfigContainer = ref<HTMLElement>()

// 状态管理
const currentCardRendererId = ref('normal')
const currentPanelRendererId = ref('grid')
const selectedCardId = ref<string>()
const currentConfig = ref<any>({})
const activeTab = ref('card')

// 示例数据
const sampleCards = ref<CardData[]>([])
const componentTemplates = ref<ComponentTemplate[]>([])
const isDragging = ref(false)

// 计算属性
const availableCardRenderers = computed(() => dualEngine.getCardRenderers())
const availablePanelRenderers = computed(() => dualEngine.getPanelRenderers())
const currentRenderers = computed(() => dualEngine.getCurrentRenderers())
const selectedCard = computed(() => 
  sampleCards.value.find(card => card.id === selectedCardId.value) || null
)

// 初始化
onMounted(async () => {
  // 注册卡片渲染器
  dualEngine.registerCardRenderer(new NormalCardRenderer())
  dualEngine.registerCardRenderer(new Card3DRenderer())
  
  // 注册看板渲染器
  dualEngine.registerPanelRenderer(new GridPanelRenderer())
  dualEngine.registerPanelRenderer(new CanvasPanelRenderer())
  
  // 设置选中回调
  dualEngine.setSelectionChangeCallback((cardId) => {
    selectedCardId.value = cardId || undefined
  })

  // 设置拖拽回调
  const dragCallbacks: DragCallbacks = {
    onDragStart: (template) => {
      console.log('开始拖拽:', template.name)
      // 立即设置拖拽状态，避免异步问题
      isDragging.value = true
    },
    onDragEnd: () => {
      console.log('拖拽结束')
      // 使用微任务延迟重置状态，确保DOM操作完成
      Promise.resolve().then(() => {
        isDragging.value = false
      })
    },
    onDrop: (template, position) => {
      console.log('放置组件:', template.name, '在位置:', position)
      // 确保在下一个tick中更新数据
      nextTick(() => {
        sampleCards.value = dualEngine.getCardData()
      })
    }
  }
  dualEngine.setDragCallbacks(dragCallbacks)

  // 获取组件模板
  componentTemplates.value = dualEngine.getComponentTemplates()
  
  // 初始化默认渲染器
  await nextTick()
  if (canvasContainer.value) {
    initializeRenderers()
    setupComponentDrag()
    updateConfigForms()
  }
})

// 初始化渲染器
const initializeRenderers = () => {
  if (!canvasContainer.value) return
  
  try {
    dualEngine.init(canvasContainer.value, {
      cardRendererId: currentCardRendererId.value,
      panelRendererId: currentPanelRendererId.value
    })
    currentConfig.value = dualEngine.getCurrentConfig()
    console.log('双层渲染引擎初始化完成')
  } catch (error) {
    console.error('初始化渲染器失败:', error)
  }
}

// 切换卡片渲染器
const switchCardRenderer = (rendererId: string) => {
  currentCardRendererId.value = rendererId
  dualEngine.switchCardRenderer(rendererId)
  currentConfig.value = dualEngine.getCurrentConfig()
  updateConfigForms()
}

// 切换看板渲染器
const switchPanelRenderer = (rendererId: string) => {
  if (!canvasContainer.value) {
    console.error('Canvas container not available')
    return
  }
  
  console.log('切换看板渲染器:', rendererId, '从:', currentPanelRendererId.value)
  currentPanelRendererId.value = rendererId
  
  try {
    dualEngine.switchPanelRenderer(rendererId, canvasContainer.value)
    currentConfig.value = dualEngine.getCurrentConfig()
    updateConfigForms()
    console.log('看板渲染器切换成功')
  } catch (error) {
    console.error('切换看板渲染器失败:', error)
  }
}

// 更新配置表单
const updateConfigForms = () => {
  nextTick(() => {
    console.log('更新配置表单...', {
      cardContainer: !!cardConfigContainer.value,
      panelContainer: !!panelConfigContainer.value,
      selectedCard: selectedCardId.value
    })
    
    // 只有在选中卡片时才创建卡片配置表单
    if (cardConfigContainer.value && selectedCardId.value && activeTab.value === 'card') {
      const cardForm = dualEngine.createSelectedCardConfigForm(cardConfigContainer.value, selectedCardId.value)
      console.log('选中卡片配置表单创建:', !!cardForm)
    }
    
    if (panelConfigContainer.value && activeTab.value === 'panel') {
      const panelForm = dualEngine.createPanelRendererConfigForm(panelConfigContainer.value)
      console.log('看板配置表单创建:', !!panelForm)
    }
  })
}

// 设置组件拖拽功能
const setupComponentDrag = () => {
  nextTick(() => {
    const componentItems = document.querySelectorAll('.component-item')
    componentItems.forEach((item, index) => {
      const template = componentTemplates.value[index]
      if (template) {
        dualEngine.enableComponentDrag(item as HTMLElement, template.id)
      }
    })
  })
}

// 获取渲染器图标
const getCardRendererIcon = (rendererId: string) => {
  const iconMap: Record<string, string> = {
    'normal': 'fa fa-square',
    '3d': 'fa fa-cube'
  }
  return iconMap[rendererId] || 'fa fa-square'
}

const getPanelRendererIcon = (rendererId: string) => {
  const iconMap: Record<string, string> = {
    'grid': 'fa fa-th',
    'canvas': 'fa fa-paint-brush'
  }
  return iconMap[rendererId] || 'fa fa-th'
}

// 处理卡片选择
const handleCardSelect = (cardId: string) => {
  selectedCardId.value = cardId
  dualEngine.selectCard(cardId)
  
  // 如果当前在卡片配置标签页，立即更新配置表单
  if (activeTab.value === 'card') {
    updateConfigForms()
  }
}

// 切换配置标签页
const switchToConfigTab = (tab: 'card' | 'panel') => {
  console.log('切换配置标签页:', tab)
  activeTab.value = tab
  
  // 确保配置表单在标签页切换时重新创建
  nextTick(() => {
    if (tab === 'card' && cardConfigContainer.value && selectedCardId.value) {
      const cardForm = dualEngine.createSelectedCardConfigForm(cardConfigContainer.value, selectedCardId.value)
      console.log('重新创建选中卡片配置表单:', !!cardForm)
    } else if (tab === 'panel' && panelConfigContainer.value) {
      const panelForm = dualEngine.createPanelRendererConfigForm(panelConfigContainer.value)
      console.log('重新创建看板配置表单:', !!panelForm)
    }
  })
}

// 更新渲染器配置
const handleUpdateConfig = (type: 'card' | 'panel', config: any) => {
  if (type === 'card') {
    dualEngine.updateCardRendererConfig(config)
  } else {
    dualEngine.updatePanelRendererConfig(config)
  }
  currentConfig.value = dualEngine.getCurrentConfig()
  console.log(`更新${type === 'card' ? '卡片' : '看板'}渲染器配置:`, config)
}

// 添加示例数据
const addSampleData = () => {
  const newCards: CardData[] = [
    {
      id: 'card-1',
      title: '温度传感器',
      value: 23.5,
      type: 'sensor',
      layout: { x: 0, y: 0, w: 2, h: 2 }
    },
    {
      id: 'card-2', 
      title: '湿度传感器',
      value: 67,
      type: 'sensor',
      layout: { x: 2, y: 0, w: 2, h: 2 }
    },
    {
      id: 'card-3',
      title: '设备状态', 
      value: 'Online',
      type: 'status',
      layout: { x: 4, y: 0, w: 2, h: 2 }
    },
    {
      id: 'card-4',
      title: '用户数量',
      value: 1247,
      type: 'counter',
      layout: { x: 0, y: 2, w: 3, h: 2 }
    },
    {
      id: 'card-5',
      title: 'CPU使用率',
      value: 45.8,
      type: 'meter',
      layout: { x: 3, y: 2, w: 3, h: 2 }
    }
  ]
  
  sampleCards.value = newCards
  dualEngine.setCardData(newCards)
  console.log('添加了', newCards.length, '个示例卡片')
}

// 清空数据
const clearData = () => {
  sampleCards.value = []
  selectedCardId.value = undefined
  dualEngine.clearAll()
  console.log('已清空所有数据')
}
</script>

<style scoped>
.dual-renderer-demo {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.demo-header {
  background: white;
  border-bottom: 1px solid #e8e8e8;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.demo-title h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  color: #333;
}

.demo-title p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.dual-renderer-switcher {
  display: flex;
  gap: 24px;
  margin-left: auto;
}

.renderer-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.renderer-group label {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.renderer-btn {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
}

.renderer-btn:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.renderer-btn.active {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
}

.demo-controls {
  display: flex;
  gap: 8px;
}

.control-btn {
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #333;
  transition: all 0.2s;
}

.control-btn:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.control-btn.secondary {
  color: #999;
}

.control-btn.secondary:hover {
  border-color: #ff4d4f;
  color: #ff4d4f;
}

.demo-content {
  flex: 1;
  display: flex;
  min-height: 0;
}

.demo-sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e8e8e8;
}

.demo-canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  margin: 0 1px;
}

.canvas-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.renderer-status h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.combination-display {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.renderer-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.renderer-chip.card-renderer {
  background: #e6f7ff;
  color: #1890ff;
}

.renderer-chip.panel-renderer {
  background: #f6ffed;
  color: #52c41a;
}

.plus {
  color: #999;
  font-weight: bold;
}

.renderer-status small {
  color: #999;
  font-size: 10px;
  display: block;
  margin-top: 4px;
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: auto;
  background: #fafafa;
  border: 2px dashed transparent;
  transition: border-color 0.2s;
}

.canvas-container.drag-over {
  border-color: #40a9ff;
  background-color: #f0f8ff;
}

.demo-inspector {
  width: 320px;
  background: white;
  border-left: 1px solid #e8e8e8;
  padding: 16px;
  overflow-y: auto;
}

.sidebar-section {
  margin-bottom: 24px;
}

.sidebar-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
  padding: 0 16px;
}

.component-list {
  padding: 0 16px;
}

.component-item {
  padding: 8px 12px;
  margin-bottom: 4px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  cursor: move;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
  background: #fafafa;
  transition: all 0.2s;
}

.component-item:hover {
  border-color: #40a9ff;
  background: #f0f8ff;
}

.component-item.dragging {
  opacity: 0.5;
  transform: scale(0.95);
}

.card-list {
  padding: 0 16px;
}

.card-item {
  padding: 6px 12px;
  margin-bottom: 2px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  transition: all 0.2s;
}

.card-item:hover {
  background: #f0f0f0;
}

.card-item.selected {
  background: #e6f7ff;
  color: #1890ff;
}

.tab-buttons {
  display: flex;
  border-bottom: 1px solid #e8e8e8;
  margin-bottom: 16px;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 12px;
  color: #666;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
}

.tab-btn:hover {
  color: #40a9ff;
}

.tab-content {
  flex: 1;
}

.config-panel {
  height: 100%;
}

.config-form-wrapper {
  /* 配置表单容器样式由ConfigFormGenerator控制 */
}

.inspector-tabs h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  color: #333;
}

.config-section {
  margin-bottom: 20px;
}

.config-section h5 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.config-section pre {
  background: #f8f8f8;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 8px;
  font-size: 10px;
  line-height: 1.4;
  margin: 0;
  max-height: 120px;
  overflow-y: auto;
}

.selected-card-info {
  background: #f8f8f8;
  border-radius: 6px;
  padding: 12px;
}

.no-selection-hint {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.no-selection-hint p {
  margin: 0 0 8px 0;
  font-size: 14px;
}

.no-selection-hint small {
  font-size: 11px;
  opacity: 0.8;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #eee;
}

.info-item:last-child {
  margin-bottom: 0;
  border-bottom: none;
}

.info-item label {
  font-size: 11px;
  color: #666;
  font-weight: 500;
}

.info-item span {
  font-size: 11px;
  color: #333;
  font-family: monospace;
}

.empty-canvas {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #999;
  pointer-events: none;
}

.empty-hint i {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-hint p {
  margin: 0;
  font-size: 14px;
  opacity: 0.8;
}
</style>