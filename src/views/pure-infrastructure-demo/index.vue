<!--
  @file 纯净基础设施演示页面
  @description 完整展示 PureInfrastructure 的四区域布局和功能
  基于重构后的第一层架构，验证所有核心功能
-->

<template>
  <div class="pure-infrastructure-demo">
    <!-- 初始化状态显示 -->
    <div v-if="!infrastructureReady" class="loading-state">
      <div class="loading-content">
        <div v-if="!initializationStatus.includes('失败')" class="loading-spinner"></div>
        <div v-else class="error-icon">❌</div>
        <h2>{{ initializationStatus.includes('失败') ? '初始化失败' : '正在初始化纯净基础设施' }}</h2>
        <p>{{ initializationStatus }}</p>
        <button v-if="initializationStatus.includes('失败')" @click="retryInitialization" class="retry-btn">
          🔄 重试初始化
        </button>
      </div>
    </div>

    <!-- 主演示区域 - 始终存在但可能被隐藏 -->
    <div class="demo-container" ref="demoContainer" :style="{ display: infrastructureReady ? 'block' : 'none' }">
      <!-- 这里将由 PureInfrastructure 接管并渲染四区域布局 -->
    </div>

    <!-- 调试面板 -->
    <div v-if="showDebugPanel" class="debug-panel">
      <div class="debug-header">
        <h3>🔧 架构调试面板</h3>
        <button @click="showDebugPanel = false" class="debug-close">✕</button>
      </div>

      <div class="debug-content">
        <!-- 基础设施状态 -->
        <div class="debug-section">
          <h4>基础设施状态</h4>
          <div class="debug-stats">
            <div class="stat-item">
              <span class="stat-label">布局区域:</span>
              <span class="stat-value">{{ infrastructureStats.layoutRegions }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">数据流:</span>
              <span class="stat-value">{{ infrastructureStats.dataFlows }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">扩展组件:</span>
              <span class="stat-value">{{ infrastructureStats.registeredExtensions }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">活跃工具:</span>
              <span class="stat-value">{{ infrastructureStats.activeTools }}</span>
            </div>
          </div>
        </div>

        <!-- 区域状态 -->
        <div class="debug-section">
          <h4>区域状态</h4>
          <div class="region-status">
            <div v-for="region in regions" :key="region" class="region-item">
              <span class="region-name">{{ regionNames[region] }}:</span>
              <span class="region-state" :class="{ 'active': regionStates[region].active }">
                {{ regionStates[region].active ? '✓ 活跃' : '○ 待机' }}
              </span>
            </div>
          </div>
        </div>

        <!-- 事件日志 -->
        <div class="debug-section">
          <h4>事件日志 <button @click="clearEventLog" class="clear-btn">清空</button></h4>
          <div class="event-log">
            <div v-for="event in eventLog.slice(-10)" :key="event.id" class="event-item">
              <span class="event-time">{{ formatTime(event.timestamp) }}</span>
              <span class="event-source">{{ event.source }}</span>
              <span class="event-message">{{ event.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 悬浮调试按钮 -->
    <button
      v-if="!showDebugPanel"
      @click="showDebugPanel = true"
      class="debug-toggle"
      title="打开调试面板"
    >
      🔧
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, computed } from 'vue'
import { globalPureInfrastructure } from '../../components/panelv2-clean/core/PureInfrastructure'
import { globalNodeRegistryEngine } from '../../components/panelv2-clean/engines/NodeRegistryEngine'
import { globalDataEngine } from '../../components/panelv2-clean/engines/DataEngine'
import { initializeEngineAdapters, globalEngineAdapterManager } from '../../components/panelv2-clean/engines/EngineAdapterManager'
import { allMockComponents } from '../../components/panelv2-clean/core/MockComponents'
import { usePanelCleanStore } from '../../components/panelv2-clean/core/PanelCleanStore'
import { nanoid } from 'nanoid'

// 基础状态
const infrastructureReady = ref(false)
const initializationStatus = ref('准备初始化...')
const demoContainer = ref<HTMLElement>()
const showDebugPanel = ref(false)

// 统计信息
const infrastructureStats = reactive({
  layoutRegions: 0,
  dataFlows: 0,
  registeredExtensions: 0,
  activeTools: 0,
  lastActivity: Date.now()
})

// 区域状态
const regions = ['toolbar', 'sidebar', 'canvas', 'inspector'] as const
const regionNames = {
  toolbar: '工具栏',
  sidebar: '组件列表',
  canvas: '画布区域',
  inspector: '属性面板'
}

const regionStates = reactive({
  toolbar: { active: false, renderer: null },
  sidebar: { active: false, renderer: null },
  canvas: { active: false, renderer: null },
  inspector: { active: false, renderer: null }
})

// 事件日志
const eventLog = ref<Array<{
  id: string
  timestamp: number
  source: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}>>([])

// 真实的Store状态管理
const store = usePanelCleanStore()

// 从Store获取组件数据
const canvasComponents = computed(() => store.panelData.nodes)
const selectedNodes = computed(() => store.selectedNodes)
const currentComponentData = ref<any>(null)
const originalComponentData = ref<any>(null)

/**
 * 添加组件到Store
 */
async function addComponentToStore(componentData: any): Promise<void> {
  try {
    // 确保位置有合理的默认值
    const defaultX = componentData.position?.x || 100
    const defaultY = componentData.position?.y || 100
    const defaultWidth = componentData.size?.width || 200
    const defaultHeight = componentData.size?.height || 150
    
    const nodeData = {
      id: componentData.id || nanoid(),
      type: componentData.type || 'unknown',
      name: componentData.name || '未知组件',
      layout: {
        // 转换为网格单位，确保最小值
        x: Math.max(0, Math.floor(defaultX / 50)),
        y: Math.max(0, Math.floor(defaultY / 50)),
        w: Math.max(2, Math.floor(defaultWidth / 50)), // 最小宽度2格
        h: Math.max(1, Math.floor(defaultHeight / 50))  // 最小高度1格
      },
      config: {
        content: {
          icon: componentData.icon || '🧩',
          description: componentData.definition?.description || ''
        }
      }
    }
    
    console.log('addComponentToStore: 准备添加组件', nodeData)
    
    await store.addNode(nodeData)
    console.log('Store: 添加组件到Store成功', nodeData.id, nodeData.layout)
    addEventLog('Store', `添加组件: ${nodeData.name}`, 'success')
  } catch (error) {
    console.error('Store: 添加组件失败', error)
    addEventLog('Store', '添加组件失败', 'error')
  }
}

/**
 * 从Store移除组件
 */
async function removeComponentFromStore(componentId: string): Promise<void> {
  try {
    await store.removeNode(componentId)
    console.log('Store: 从Store移除组件', componentId)
    addEventLog('Store', `移除组件: ${componentId}`, 'info')
  } catch (error) {
    console.error('Store: 移除组件失败', error)
    addEventLog('Store', '移除组件失败', 'error')
  }
}

/**
 * 更新Store中的组件
 */
async function updateComponentInStore(componentId: string, updates: any): Promise<void> {
  try {
    await store.updateNode(componentId, updates)
    console.log('Store: 更新Store中的组件', componentId, updates)
    addEventLog('Store', `更新组件: ${componentId}`, 'info')
  } catch (error) {
    console.error('Store: 更新组件失败', error)
    addEventLog('Store', '更新组件失败', 'error')
  }
}

/**
 * 获取所有组件数据（用于导出）
 */
function getAllComponentsData(): any[] {
  return store.panelData.nodes
}

// 防抖工具
const debounceTimers = new Map<string, number>()

/**
 * 设置导入导出数据源
 */
function setupImportExportDataSource(): void {
  // 创建数据源接口实现
  const dataSource = {
    async getPanelData(): Promise<any> {
      console.log('DataSource: 获取面板数据从Store')
      return store.panelData
    },
    
    async setPanelData(data: any): Promise<void> {
      console.log('DataSource: 设置面板数据到Store', data)
      
      try {
        // 清空现有数据
        store.clearAll()
        
        // 添加导入的节点
        if (data.nodes && Array.isArray(data.nodes)) {
          for (const node of data.nodes) {
            await store.addNode(node)
          }
          console.log(`DataSource: 成功导入${data.nodes.length}个节点`)
        }
        
        // 更新面板信息
        if (data.meta) {
          // 这里可以更新面板元信息
          console.log('DataSource: 更新面板元信息')
        }
        
      } catch (error) {
        console.error('DataSource: 设置面板数据失败', error)
        throw error
      }
    }
  }
  
  // 设置数据源到Porter
  globalPureInfrastructure.porter.setDataSource(dataSource)
  console.log('setupImportExportDataSource: 数据源已连接Store到Porter')
}

// 导入事件监听器标志，防止重复设置
let importEventListenerSetup = false

/**
 * 设置导入事件监听
 */
function setupImportEventListener(): void {
  if (importEventListenerSetup) {
    console.log('setupImportEventListener: 导入事件监听器已设置，跳过')
    return
  }
  
  // 监听导入成功事件
  window.addEventListener('panel-data-imported', (event: any) => {
    console.log('监听到导入事件:', event.detail)
    
    if (event.detail.success) {
      // 重新渲染画布以反映导入的数据
      setTimeout(() => {
        renderCanvasFromStore()
        updateComponentCount()
        
        // 清空属性面板选中
        currentComponentData.value = null
        updateInspectorData(null)
        
        addEventLog('Import', '导入数据已显示在画布上', 'success')
      }, 100) // 短暂延迟确保Store更新完成
    }
  })
  
  importEventListenerSetup = true
  console.log('setupImportEventListener: 导入事件监听器已设置')
}

// 事件监听器标志，防止重复设置
let toolEventListenersSetup = false
let toolbarInitialized = false

/**
 * 设置工具操作成功事件监听
 */
function setupToolSuccessEventListeners(): void {
  if (toolEventListenersSetup) {
    console.log('setupToolSuccessEventListeners: 事件监听器已设置，跳过')
    return
  }
  
  // 监听导出成功事件
  window.addEventListener('tool-export-success', (event: any) => {
    addEventLog('Export', event.detail.message, 'success')
  })
  
  // 监听导入成功事件
  window.addEventListener('tool-import-success', (event: any) => {
    addEventLog('Import', event.detail.message, 'success')
  })
  
  // 监听导出错误事件
  window.addEventListener('tool-export-error', (event: any) => {
    addEventLog('Export', event.detail.message, 'error')
  })
  
  // 监听导入错误事件
  window.addEventListener('tool-import-error', (event: any) => {
    addEventLog('Import', event.detail.message, 'error')
  })
  
  toolEventListenersSetup = true
  console.log('setupToolSuccessEventListeners: 工具事件监听器已设置')
}

function debounce(key: string, fn: () => void, delay: number = 300): void {
  if (debounceTimers.has(key)) {
    clearTimeout(debounceTimers.get(key))
  }
  
  const timer = setTimeout(() => {
    fn()
    debounceTimers.delete(key)
  }, delay)
  
  debounceTimers.set(key, timer)
}

/**
 * 重试初始化
 */
async function retryInitialization(): Promise<void> {
  // 重置状态
  infrastructureReady.value = false
  initializationStatus.value = '准备重新初始化...'

  // 重置所有初始化标志
  toolEventListenersSetup = false
  toolbarInitialized = false
  importEventListenerSetup = false

  // 清理之前的状态
  if (globalPureInfrastructure && typeof globalPureInfrastructure.destroy === 'function') {
    try {
      globalPureInfrastructure.destroy()
    } catch (error) {
      console.warn('清理之前的基础设施时出错:', error)
    }
  }

  // 稍等片刻后重新初始化
  await new Promise(resolve => setTimeout(resolve, 500))
  await initializeInfrastructure()
}

/**
 * 初始化基础设施
 */
async function initializeInfrastructure(): Promise<void> {
  try {
    addEventLog('System', '开始初始化纯净基础设施', 'info')
    initializationStatus.value = '检查容器状态...'

    // 简化的容器检查 - 只检查一次
    if (!demoContainer.value) {
      console.error('容器引用未找到:', demoContainer.value)
      throw new Error('演示容器引用未初始化')
    }

    console.log('容器准备就绪:', demoContainer.value)

    // 1. 初始化基础设施
    initializationStatus.value = '初始化基础设施核心...'
    await globalPureInfrastructure.initialize(demoContainer.value)
    addEventLog('Infrastructure', '基础设施核心初始化完成', 'success')
    
    // 1.5. 设置导入导出数据源
    initializationStatus.value = '设置数据源...'
    setupImportExportDataSource()
    addEventLog('Infrastructure', '导入导出数据源已设置', 'success')

    // 2. 注册区域渲染器
    initializationStatus.value = '注册区域渲染器...'
    await registerRegionRenderers()
    addEventLog('Renderers', '区域渲染器注册完成', 'success')

    // 3. 准备数据源
    initializationStatus.value = '准备数据源...'
    await prepareDataSources()
    addEventLog('Data', '数据源准备完成', 'success')

    // 4. 设置事件监听
    initializationStatus.value = '设置事件监听...'
    setupEventListeners()
    addEventLog('Events', '事件监听器设置完成', 'success')

    // 5. 完成初始化
    infrastructureReady.value = true
    updateStats()
    addEventLog('System', '纯净基础设施初始化完成', 'success')
    
    // 6. 设置导入事件监听
    setupImportEventListener()
    
    // 7. 设置工具操作成功事件监听
    setupToolSuccessEventListeners()

  } catch (error) {
    console.error('初始化失败:', error)
    addEventLog('System', `初始化失败: ${error}`, 'error')

    // 在错误情况下，显示一个更友好的错误信息
    initializationStatus.value = `初始化失败: ${error.message || error}`
  }
}

/**
 * 注册区域渲染器
 */
async function registerRegionRenderers(): Promise<void> {
  // 确保引擎适配器已初始化
  await initializeEngineAdapters()

  // 获取适配器实例
  const adapters = globalEngineAdapterManager.getAdapters()

  // 工具栏渲染器 - 使用 ToolEngineAdapter
  globalPureInfrastructure.registerRegionRenderer('toolbar', {
    type: 'toolbar',
    render: (container: HTMLElement, data: any) => {
      console.log('工具栏渲染器: 开始渲染')
      const tools = adapters.tool.getTools()

      // 检查是否已经渲染过
      if (container.querySelector('.demo-toolbar')) {
        console.log('工具栏渲染器: 已存在，跳过重复渲染')
        return
      }

      container.innerHTML = `
        <div class="demo-toolbar">
          <div class="toolbar-section">
            <h3>🛠️ 智能工具栏</h3>
            ${tools.map(tool => `
              <button
                class="toolbar-btn ${tool.enabled ? '' : 'disabled'}"
                data-action="${tool.action}"
                ${tool.enabled ? '' : 'disabled'}
                title="${tool.name} ${tool.shortcut ? `(${tool.shortcut})` : ''}">
                ${tool.icon} ${tool.name}
              </button>
            `).join('')}
          </div>
          <div class="toolbar-section">
            <span class="toolbar-status">基于 ToolEngineAdapter</span>
          </div>
        </div>
      `

      // 绑定工具栏事件
      setupToolbarEvents(container, adapters.tool)
      regionStates.toolbar.active = true
      console.log('工具栏渲染器: 渲染完成')
    },
    update: (data: any) => {
      console.log('工具栏数据更新:', data)
    },
    destroy: () => {
      regionStates.toolbar.active = false
    }
  })

  // 侧边栏渲染器 - 使用 NodeRegistryEngineAdapter
  globalPureInfrastructure.registerRegionRenderer('sidebar', {
    type: 'sidebar',
    render: (container: HTMLElement, data: any) => {
      // 使用适配的组件列表渲染器
      adapters.node.render(container, data)

      // 添加自定义样式包装
      const existingContent = container.innerHTML
      container.innerHTML = `
        <div class="demo-sidebar">
          <div class="sidebar-header">
            <h3>📦 智能组件库</h3>
            <p class="sidebar-subtitle">基于 NodeRegistryEngineAdapter</p>
          </div>
          <div class="sidebar-content">
            ${existingContent}
          </div>
        </div>
      `

      regionStates.sidebar.active = true
    },
    update: (data: any) => {
      console.log('侧边栏数据更新:', data)
      adapters.node.update(data)
    },
    destroy: () => {
      regionStates.sidebar.active = false
      adapters.node.destroy()
    }
  })

  // 画布渲染器
  globalPureInfrastructure.registerRegionRenderer('canvas', {
    type: 'canvas',
    render: (container: HTMLElement, data: any) => {
      container.innerHTML = `
        <div class="demo-canvas">
          <div class="canvas-header">
            <h3>🎨 设计画布</h3>
            <div class="canvas-tools">
              <button class="canvas-btn">🔍 缩放</button>
              <button class="canvas-btn">📐 网格</button>
              <button class="canvas-btn">📏 标尺</button>
              <span class="canvas-status">组件数: <span id="component-count">0</span></span>
            </div>
          </div>
          <div class="canvas-workspace" id="canvas-workspace">
            <div class="canvas-placeholder" id="canvas-placeholder">
              <p>从左侧拖拽组件到此处开始设计</p>
              <div class="placeholder-icon">🎯</div>
            </div>
          </div>
        </div>
      `

      // 设置画布拖拽功能
      setupCanvasDragAndDrop(container)
      regionStates.canvas.active = true
      // 注意：不需要setupCanvasInteractions，避免重复事件监听
    },
    update: (data: any) => {
      console.log('画布数据更新:', data)
    },
    destroy: () => {
      regionStates.canvas.active = false
    }
  })

  // 属性面板渲染器
  globalPureInfrastructure.registerRegionRenderer('inspector', {
    type: 'inspector',
    render: (container: HTMLElement, data: any) => {
      container.innerHTML = `
        <div class="demo-inspector">
          <div class="inspector-header">
            <h3>⚙️ 智能属性面板</h3>
            <p class="inspector-subtitle">基于 DataEngineAdapter</p>
          </div>
          <div class="property-sections">
            <div class="property-section">
              <h4>基础属性</h4>
              <div class="property-group">
                <label>组件名称:</label>
                <input type="text" id="comp-name" value="未选择组件" disabled placeholder="选择组件查看属性">
              </div>
              <div class="property-group">
                <label>组件类型:</label>
                <input type="text" id="comp-type" value="" disabled placeholder="组件类型">
              </div>
              <div class="property-group">
                <label>组件ID:</label>
                <input type="text" id="comp-id" value="" disabled placeholder="自动生成">
              </div>
            </div>
            <div class="property-section">
              <h4>位置属性</h4>
              <div class="property-group">
                <label>位置坐标:</label>
                <div class="position-inputs">
                  <input type="number" id="pos-x" placeholder="X" disabled min="0">
                  <input type="number" id="pos-y" placeholder="Y" disabled min="0">
                </div>
              </div>
              <div class="property-group">
                <label>尺寸大小:</label>
                <div class="position-inputs">
                  <input type="number" id="size-w" placeholder="宽度" disabled min="50">
                  <input type="number" id="size-h" placeholder="高度" disabled min="50">
                </div>
              </div>
            </div>
            <div class="property-section">
              <h4>样式属性</h4>
              <div class="property-group">
                <label>背景颜色:</label>
                <input type="color" id="bg-color" value="#ffffff" disabled>
              </div>
              <div class="property-group">
                <label>边框颜色:</label>
                <input type="color" id="border-color" value="#e0e0e0" disabled>
              </div>
              <div class="property-group">
                <label>透明度:</label>
                <input type="range" id="opacity" min="0" max="100" value="100" disabled>
                <span class="range-value">100%</span>
              </div>
            </div>
            <div class="property-section" id="custom-props" style="display: none;">
              <h4>自定义属性</h4>
              <div id="custom-props-container">
                <!-- 动态生成的自定义属性 -->
              </div>
            </div>
            <div class="property-actions">
              <button class="action-btn primary" id="apply-changes" disabled>应用更改</button>
              <button class="action-btn secondary" id="reset-changes" disabled>重置</button>
              <button class="action-btn danger" id="delete-component" disabled>删除组件</button>
            </div>
          </div>
        </div>
      `

      regionStates.inspector.active = true
      setupInspectorEvents(container)
    },
    update: (data: any) => {
      console.log('属性面板数据更新:', data)
      updateInspectorData(data)
    },
    destroy: () => {
      regionStates.inspector.active = false
    }
  })
}

/**
 * 准备数据源
 */
async function prepareDataSources(): Promise<void> {
  // 注册组件数据源
  globalPureInfrastructure.pipeline.registerSource('component-library', {
    getData: async () => {
      return await globalDataEngine.preparation.prepareComponentListData()
    }
  })

  // 注册面板数据源
  globalPureInfrastructure.pipeline.registerSource('panel-state', {
    getData: async () => {
      return await globalDataEngine.preparation.preparePanelData()
    }
  })

  // 设置区域数据源
  globalPureInfrastructure.setupRegionDataSource('sidebar', {
    getData: async () => ({
      categories: ['基础组件', '高级组件'],
      components: allMockComponents.slice(0, 5)
    })
  })
}

/**
 * 设置事件监听
 */
function setupEventListeners(): void {
  // 监听基础设施事件
  globalPureInfrastructure.eventBus.on('tool-action', (event) => {
    addEventLog('Tool', `工具动作: ${event.action}`, 'info')
  })

  globalPureInfrastructure.pipeline.onDataChange((event) => {
    addEventLog('Pipeline', `数据变更: ${event.type}`, 'info')
    updateStats()
  })

  // Phase 3: 添加真实的撤销重做功能事件监听
  window.addEventListener('tool-undo-request', async () => {
    try {
      console.log('setupEventListeners: 处理撤销请求')
      await store.undo()
      
      // 重新渲染画布以反映撤销后的状态
      renderCanvasFromStore()
      updateComponentCount()
      
      // 清空属性面板选中（因为撤销可能影响选中的组件）
      currentComponentData.value = null
      updateInspectorData(null)
      
      addEventLog('Store', '撤销操作已执行', 'success')
    } catch (error) {
      console.error('执行撤销操作失败:', error)
      addEventLog('Store', '撤销操作失败', 'error')
    }
  })

  window.addEventListener('tool-redo-request', async () => {
    try {
      console.log('setupEventListeners: 处理重做请求')
      await store.redo()
      
      // 重新渲染画布以反映重做后的状态
      renderCanvasFromStore()
      updateComponentCount()
      
      // 清空属性面板选中（因为重做可能影响选中的组件）
      currentComponentData.value = null
      updateInspectorData(null)
      
      addEventLog('Store', '重做操作已执行', 'success')
    } catch (error) {
      console.error('执行重做操作失败:', error)
      addEventLog('Store', '重做操作失败', 'error')
    }
  })

  window.addEventListener('tool-save-request', async () => {
    try {
      console.log('setupEventListeners: 处理保存请求')
      
      // 检查Store是否有save方法，如果没有就模拟保存
      if (typeof store.save === 'function') {
        await store.save()
        addEventLog('Store', '保存操作已执行', 'success')
      } else {
        // 模拟保存操作 - 标记为已保存状态
        console.log('setupEventListeners: Store没有save方法，模拟保存操作')
        const currentData = store.panelData
        console.log('模拟保存的数据:', {
          nodeCount: currentData.nodes.length,
          panelMeta: currentData.meta
        })
        addEventLog('Store', '模拟保存操作已执行', 'success')
      }
    } catch (error) {
      console.error('执行保存操作失败:', error)
      addEventLog('Store', '保存操作失败', 'error')
    }
  })

  window.addEventListener('tool-clear-request', async () => {
    try {
      console.log('setupEventListeners: 处理清空请求')
      
      if (confirm('确定要清空所有组件吗？此操作不可撤销。')) {
        // 通过Store清空所有组件
        store.clearAll()
        
        // 重新渲染画布
        renderCanvasFromStore()
        updateComponentCount()
        
        // 清空属性面板
        currentComponentData.value = null
        updateInspectorData(null)
        
        addEventLog('Store', '清空操作已执行', 'warning')
      }
    } catch (error) {
      console.error('执行清空操作失败:', error)
      addEventLog('Store', '清空操作失败', 'error')
    }
  })

  // 设置键盘快捷键支持
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 's':
          e.preventDefault()
          globalPureInfrastructure.eventBus.emit('tool-action', { action: 'file.save' })
          break
        case 'z':
          e.preventDefault()
          if (e.shiftKey) {
            globalPureInfrastructure.eventBus.emit('tool-action', { action: 'edit.redo' })
          } else {
            globalPureInfrastructure.eventBus.emit('tool-action', { action: 'edit.undo' })
          }
          break
        case 'y':
          e.preventDefault()
          globalPureInfrastructure.eventBus.emit('tool-action', { action: 'edit.redo' })
          break
      }
    }
  })
}

/**
 * 设置属性面板事件
 */
function setupInspectorEvents(container: HTMLElement): void {
  const applyBtn = container.querySelector('#apply-changes') as HTMLButtonElement
  const resetBtn = container.querySelector('#reset-changes') as HTMLButtonElement
  const deleteBtn = container.querySelector('#delete-component') as HTMLButtonElement
  const opacityRange = container.querySelector('#opacity') as HTMLInputElement
  const opacityValue = container.querySelector('.range-value') as HTMLSpanElement

  // 透明度滑动条事件
  if (opacityRange && opacityValue) {
    opacityRange.addEventListener('input', () => {
      opacityValue.textContent = `${opacityRange.value}%`
      if (!applyBtn.disabled) {
        // 标记有更改
        markInspectorDirty(true)
      }
    })
  }

  // 所有输入框的更改监听
  const inputs = container.querySelectorAll('input[type="text"], input[type="number"], input[type="color"]')
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      if (!input.hasAttribute('disabled')) {
        markInspectorDirty(true)
      }
    })
  })

  // 应用更改按钮
  if (applyBtn) {
    applyBtn.addEventListener('click', async () => {
      try {
        await applyInspectorChanges()
        markInspectorDirty(false)
        addEventLog('Inspector', '属性更改已应用', 'success')
      } catch (error) {
        addEventLog('Inspector', '应用更改失败', 'error')
        console.error('应用属性更改失败:', error)
      }
    })
  }

  // 重置按钮
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetInspectorChanges()
      markInspectorDirty(false)
      addEventLog('Inspector', '属性已重置', 'info')
    })
  }

  // 删除组件按钮
  if (deleteBtn) {
    deleteBtn.addEventListener('click', () => {
      if (confirm('确定要删除选中的组件吗？')) {
        deleteSelectedComponent()
        addEventLog('Inspector', '组件已删除', 'warning')
      }
    })
  }
}

/**
 * 标记属性面板的脏状态
 */
function markInspectorDirty(isDirty: boolean): void {
  const inspector = globalPureInfrastructure.getRegion('inspector')
  const applyBtn = inspector.querySelector('#apply-changes') as HTMLButtonElement
  const resetBtn = inspector.querySelector('#reset-changes') as HTMLButtonElement

  if (applyBtn && resetBtn) {
    applyBtn.disabled = !isDirty
    resetBtn.disabled = !isDirty

    if (isDirty) {
      applyBtn.classList.add('dirty')
      resetBtn.classList.add('dirty')
    } else {
      applyBtn.classList.remove('dirty')
      resetBtn.classList.remove('dirty')
    }
  }
}

/**
 * 应用属性面板的更改
 */
async function applyInspectorChanges(): Promise<void> {
  if (!currentComponentData.value) return

  try {
    const inspector = globalPureInfrastructure.getRegion('inspector')

    // 收集属性值
    const posX = parseInt((inspector.querySelector('#pos-x') as HTMLInputElement)?.value) || 0
    const posY = parseInt((inspector.querySelector('#pos-y') as HTMLInputElement)?.value) || 0
    const sizeW = parseInt((inspector.querySelector('#size-w') as HTMLInputElement)?.value) || 200
    const sizeH = parseInt((inspector.querySelector('#size-h') as HTMLInputElement)?.value) || 150
    const newName = (inspector.querySelector('#comp-name') as HTMLInputElement)?.value

    // 生成Store更新数据
    const storeUpdates = {
      name: newName,
      layout: {
        x: Math.floor(posX / 50), // 转换为网格单位
        y: Math.floor(posY / 50),
        w: Math.max(1, Math.floor(sizeW / 50)),
        h: Math.max(1, Math.floor(sizeH / 50))
      },
      config: {
        content: {
          ...currentComponentData.value.definition?.config?.content,
          backgroundColor: (inspector.querySelector('#bg-color') as HTMLInputElement)?.value,
          borderColor: (inspector.querySelector('#border-color') as HTMLInputElement)?.value,
          opacity: parseInt((inspector.querySelector('#opacity') as HTMLInputElement)?.value) / 100
        }
      }
    }

    // 通过Store更新
    await updateComponentInStore(currentComponentData.value.id, storeUpdates)
    
    // 重新渲染画布以反映更改
    renderCanvasFromStore()
    
    // 更新当前数据引用
    const updatedNode = store.panelData.nodes.find(n => n.id === currentComponentData.value.id)
    if (updatedNode) {
      const newData = {
        id: updatedNode.id,
        name: updatedNode.name,
        type: updatedNode.type,
        position: {
          x: (updatedNode.layout?.x || 0) * 50,
          y: (updatedNode.layout?.y || 0) * 50
        },
        size: {
          width: (updatedNode.layout?.w || 4) * 50,
          height: (updatedNode.layout?.h || 2) * 50
        },
        definition: updatedNode
      }
      
      currentComponentData.value = newData
      originalComponentData.value = { ...newData }
    }
    
    addEventLog('Inspector', '属性更改已应用到Store', 'success')
    
  } catch (error) {
    console.error('应用属性更改失败:', error)
    addEventLog('Inspector', '应用属性更改失败', 'error')
  }
}

/**
 * 重置属性面板的更改
 */
function resetInspectorChanges(): void {
  if (originalComponentData.value) {
    updateInspectorData(originalComponentData.value)
    currentComponentData.value = { ...originalComponentData.value }
  }
}

/**
 * 删除选中的组件 - 通过Store管理
 */
async function deleteSelectedComponent(): Promise<void> {
  if (!currentComponentData.value) return

  try {
    const componentId = currentComponentData.value.id
    
    // 通过Store删除
    await removeComponentFromStore(componentId)
    
    // 重新渲染画布
    renderCanvasFromStore()
    
    // 清空属性面板
    updateInspectorData(null)
    currentComponentData.value = null
    originalComponentData.value = null
    
    // 更新组件计数
    updateComponentCount()
    
    addEventLog('Inspector', `组件已删除: ${componentId}`, 'warning')
    
  } catch (error) {
    console.error('删除组件失败:', error)
    addEventLog('Inspector', '删除组件失败', 'error')
  }
}
/**
 * 设置画布拖拽和放置功能
 */
function setupCanvasDragAndDrop(container: HTMLElement): void {
  const workspace = container.querySelector('#canvas-workspace') as HTMLElement

  if (!workspace) {
    console.warn('Canvas workspace not found')
    return
  }

  // 设置拖拽区域
  workspace.addEventListener('dragover', (e) => {
    e.preventDefault()
    e.dataTransfer!.dropEffect = 'copy'
    workspace.classList.add('drag-over')
  })

  workspace.addEventListener('dragleave', (e) => {
    // 只有当鼠标真正离开workspace时才移除样式
    if (!workspace.contains(e.relatedTarget as Node)) {
      workspace.classList.remove('drag-over')
    }
  })

  workspace.addEventListener('drop', async (e) => {
    e.preventDefault()
    workspace.classList.remove('drag-over')

    try {
      const jsonData = e.dataTransfer?.getData('application/json')
      if (jsonData) {
        const componentData = JSON.parse(jsonData)
        console.log('Canvas: 接收到拖拽数据', componentData)

        // 计算放置位置
        const rect = workspace.getBoundingClientRect()
        const position = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        }

        await addComponentToCanvas(componentData, position)
        addEventLog('Canvas', `添加组件: ${componentData.definition?.name || componentData.id}`, 'success')
      }
    } catch (error) {
      console.error('Canvas: 处理拖拽数据失败', error)
      addEventLog('Canvas', '添加组件失败', 'error')
    }
  })

  console.log('Canvas: 拖拽功能已设置')
}

function setupToolbarEvents(container: HTMLElement, toolAdapter: any): void {
  if (toolbarInitialized) {
    console.log('setupToolbarEvents: 工具栏已初始化，跳过事件绑定')
    return
  }
  
  const toolButtons = container.querySelectorAll('.toolbar-btn')
  console.log('setupToolbarEvents: 开始设置工具栏事件，共', toolButtons.length, '个按钮')

  toolButtons.forEach((button, index) => {
    const action = button.getAttribute('data-action')
    
    // 创建事件处理函数 - 使用命名函数便于调试
    const handleToolbarClick = async (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      
      const clickedAction = (e.target as HTMLElement).getAttribute('data-action')
      if (clickedAction && !(e.target as HTMLElement).hasAttribute('disabled')) {
        console.log(`setupToolbarEvents: 点击工具栏按钮 ${clickedAction}`)
        
        // 防抖处理 - 防止重复点击
        debounce(`toolbar-${clickedAction}`, async () => {
          try {
            console.log(`setupToolbarEvents: 执行工具动作 ${clickedAction}`)
            await toolAdapter.handleAction(clickedAction, {})
            addEventLog('Toolbar', `执行工具动作: ${clickedAction}`, 'success')

            // 触发事件通知
            globalPureInfrastructure.eventBus.emit('tool-action', { action: clickedAction })
            
            console.log(`setupToolbarEvents: 工具动作 ${clickedAction} 执行完成`)
          } catch (error) {
            addEventLog('Toolbar', `工具动作失败: ${clickedAction}`, 'error')
            console.error(`工具动作执行失败 ${clickedAction}:`, error)
          }
        }, 1000) // 增加防抖时间到1000ms
      }
    }
    
    // 添加新的监听器
    button.addEventListener('click', handleToolbarClick)
    console.log(`setupToolbarEvents: 为按钮 ${action} (${index}) 绑定事件监听器`)
  })
  
  toolbarInitialized = true
  console.log('setupToolbarEvents: 工具栏事件监听器设置完成')
}

/**
 * 设置画布交互
 */
function setupCanvasInteractions(container: HTMLElement): void {
  const workspace = container.querySelector('#canvas-workspace') as HTMLElement

  if (workspace) {
    workspace.addEventListener('dragover', (e) => {
      e.preventDefault()
      workspace.classList.add('drag-over')
    })

    workspace.addEventListener('dragleave', () => {
      workspace.classList.remove('drag-over')
    })

    workspace.addEventListener('drop', async (e) => {
      e.preventDefault()
      workspace.classList.remove('drag-over')

      // 尝试从适配器获取完整组件数据
      let componentData = null
      try {
        const jsonData = e.dataTransfer?.getData('application/json')
        if (jsonData) {
          componentData = JSON.parse(jsonData)
          await addComponentToCanvas(componentData, { x: e.offsetX, y: e.offsetY })
          addEventLog('Canvas', `添加组件: ${componentData.definition?.name || componentData.id}`, 'success')
        }
      } catch (error) {
        // 回退到简单的文本数据
        const componentName = e.dataTransfer?.getData('text/plain')
        if (componentName) {
          await addComponentToCanvas({ id: 'text', name: componentName }, { x: e.offsetX, y: e.offsetY })
          addEventLog('Canvas', `添加组件: ${componentName}`, 'success')
        }
      }
    })
  }
}

/**
 * 添加组件到画布 - 现在通过Store管理
 */
async function addComponentToCanvas(componentData: any, position: { x: number, y: number }): Promise<void> {
  try {
    // 处理组件数据
    const componentName = componentData.definition?.name || componentData.name || componentData.id || '未知组件'
    const componentType = componentData.type || 'unknown'
    const componentIcon = componentData.definition?.icon || componentData.icon || '🧩'
    const componentId = componentData.id || nanoid()

    // 创建组件数据对象
    const fullComponentData = {
      id: componentId,
      name: componentName,
      type: componentType,
      icon: componentIcon,
      position: position,
      size: { width: 200, height: 150 },
      definition: componentData.definition,
      createdAt: Date.now()
    }

    // 添加到Store
    await addComponentToStore(fullComponentData)
    
    // 更新UI显示
    renderCanvasFromStore()
    
    // 更新组件计数
    updateComponentCount()
    
  } catch (error) {
    console.error('添加组件到画布失败:', error)
    addEventLog('Canvas', '添加组件失败', 'error')
  }
}

/**
 * 从Store渲染画布
 */
function renderCanvasFromStore(): void {
  const workspace = document.querySelector('#canvas-workspace') as HTMLElement
  if (!workspace) return

  // 移除占位符
  const placeholder = workspace.querySelector('.canvas-placeholder')
  if (placeholder) {
    placeholder.remove()
  }

  // 清空现有组件
  const existingComponents = workspace.querySelectorAll('.canvas-component')
  existingComponents.forEach(comp => comp.remove())

  // 从Store重新渲染所有组件
  console.log('renderCanvasFromStore: 准备渲染', canvasComponents.value.length, '个组件')
  
  if (canvasComponents.value.length === 0) {
    // 如果没有组件，显示占位符
    const placeholder = document.createElement('div')
    placeholder.className = 'canvas-placeholder'
    placeholder.id = 'canvas-placeholder'
    placeholder.innerHTML = `
      <p>从左侧拖拽组件到此处开始设计</p>
      <div class="placeholder-icon">🎯</div>
    `
    workspace.appendChild(placeholder)
    console.log('renderCanvasFromStore: 显示占位符')
  } else {
    canvasComponents.value.forEach(node => {
      renderSingleComponent(node, workspace)
    })
    console.log('renderCanvasFromStore: 渲染完成')
  }
}

/**
 * 渲染单个组件
 */
function renderSingleComponent(nodeData: any, workspace: HTMLElement): void {
  console.log('renderSingleComponent: 开始渲染组件', nodeData.id, nodeData.layout)
  
  // 检查workspace是否存在
  if (!workspace) {
    console.error('renderSingleComponent: workspace不存在')
    return
  }
  
  const component = document.createElement('div')
  component.className = 'canvas-component'
  component.setAttribute('data-component-id', nodeData.id)
  component.setAttribute('data-component-type', nodeData.type)
  
  // 计算位置（从网格单位转换为像素） - 确保有最小值
  const gridX = Math.max(nodeData.layout?.x || 0, 0)
  const gridY = Math.max(nodeData.layout?.y || 0, 0) 
  const gridW = Math.max(nodeData.layout?.w || 4, 2) // 最小宽度2格
  const gridH = Math.max(nodeData.layout?.h || 2, 1) // 最小高度1格
  
  const pixelX = gridX * 50 + 20 // 增加20px边距，避免贴边
  const pixelY = gridY * 50 + 80 // 增加80px上边距，避免被工具栏遮挡
  const pixelW = gridW * 50
  const pixelH = gridH * 50
  
  console.log('renderSingleComponent: 网格位置', { gridX, gridY, gridW, gridH })
  console.log('renderSingleComponent: 像素位置', { pixelX, pixelY, pixelW, pixelH })
  
  // 设置位置和尺寸
  component.style.position = 'absolute'
  component.style.left = `${pixelX}px`
  component.style.top = `${pixelY}px`
  component.style.width = `${pixelW}px`
  component.style.height = `${pixelH}px`
  component.style.zIndex = '10'
  component.style.boxSizing = 'border-box'
  
  const componentIcon = nodeData.config?.content?.icon || '🧩'
  const componentName = nodeData.name || '未知组件'
  const componentType = nodeData.type || 'unknown'
  
  component.innerHTML = `
    <div class="component-header">
      <span class="component-icon">${componentIcon}</span>
      <span class="component-name">${componentName}</span>
      <span class="component-type">${componentType}</span>
      <button class="component-delete" onclick="removeComponentFromUI(this.parentElement.parentElement)">×</button>
    </div>
    <div class="component-content">
      <p>组件内容区域</p>
      ${nodeData.config?.content?.description ? `<small>${nodeData.config.content.description}</small>` : ''}
    </div>
  `

  // 添加点击选择功能
  component.addEventListener('click', () => {
    selectComponentInUI(nodeData.id, nodeData)
  })

  workspace.appendChild(component)
  
  // 验证组件是否成功添加
  const addedComponent = workspace.querySelector(`[data-component-id="${nodeData.id}"]`)
  if (addedComponent) {
    console.log('renderSingleComponent: 组件成功添加到DOM', nodeData.id)
    // 验证样式
    const computedStyle = window.getComputedStyle(addedComponent)
    console.log('renderSingleComponent: 组件样式验证', {
      position: computedStyle.position,
      left: computedStyle.left,
      top: computedStyle.top,
      width: computedStyle.width,
      height: computedStyle.height,
      display: computedStyle.display,
      visibility: computedStyle.visibility
    })
  } else {
    console.error('renderSingleComponent: 组件添加到DOM失败', nodeData.id)
  }
}

/**
 * 在UI中选中组件
 */
function selectComponentInUI(componentId: string, nodeData: any): void {
  const workspace = document.querySelector('#canvas-workspace') as HTMLElement
  if (!workspace) return

  // 移除其他选中状态
  workspace.querySelectorAll('.canvas-component.selected').forEach(el => {
    el.classList.remove('selected')
  })

  // 选中当前组件
  const componentElement = workspace.querySelector(`[data-component-id="${componentId}"]`)
  if (componentElement) {
    componentElement.classList.add('selected')
  }

  // 更新Store选中状态
  store.selectNodes([componentId])

  // 更新属性面板
  updateInspectorData({
    id: nodeData.id,
    name: nodeData.name,
    type: nodeData.type,
    position: {
      x: (nodeData.layout?.x || 0) * 50,
      y: (nodeData.layout?.y || 0) * 50
    },
    size: {
      width: (nodeData.layout?.w || 4) * 50,
      height: (nodeData.layout?.h || 2) * 50
    },
    definition: nodeData
  })

  addEventLog('Canvas', `选中组件: ${nodeData.name}`, 'info')
}

/**
 * 从UI移除组件
 */
async function removeComponentFromUI(element: HTMLElement): Promise<void> {
  const componentId = element.getAttribute('data-component-id')
  if (!componentId) return

  try {
    // 从Store移除
    await removeComponentFromStore(componentId)
    
    // 重新渲染画布
    renderCanvasFromStore()
    
    // 更新组件计数
    updateComponentCount()
    
    // 如果这个组件当前被选中，清空属性面板
    if (currentComponentData.value?.id === componentId) {
      currentComponentData.value = null
      updateInspectorData(null)
    }
  } catch (error) {
    console.error('移除组件失败:', error)
  }
}

// 暴露到全局作用域以供onclick使用
;(window as any).removeComponentFromUI = removeComponentFromUI

// 旧的removeComponent函数保留作为备用，但不再使用
function removeComponent(element: HTMLElement): void {
  console.warn('removeComponent: 请使用 removeComponentFromUI 代替')
  removeComponentFromUI(element)
}

// 暴露到全局作用域以供onclick使用
;(window as any).removeComponent = removeComponent

/**
 * 更新组件计数显示
 */
function updateComponentCount(): void {
  const countElement = document.querySelector('#component-count') as HTMLElement
  if (countElement) {
    // 从Store获取组件数量
    const count = canvasComponents.value.length
    countElement.textContent = count.toString()
    console.log('updateComponentCount: 更新组件计数', count)
  } else {
    console.warn('updateComponentCount: 未找到component-count元素')
  }
}

/**
 * 更新属性面板数据
 */
function updateInspectorData(data: any): void {
  const inspector = globalPureInfrastructure.getRegion('inspector')

  // 如果没有数据，清空表单
  if (!data) {
    clearInspectorForm(inspector)
    return
  }

  // 更新当前数据引用
  currentComponentData.value = { ...data }
  originalComponentData.value = { ...data }

  // 基础属性
  const nameInput = inspector.querySelector('#comp-name') as HTMLInputElement
  const typeInput = inspector.querySelector('#comp-type') as HTMLInputElement
  const idInput = inspector.querySelector('#comp-id') as HTMLInputElement

  if (nameInput) {
    nameInput.value = data.name || '未知组件'
    nameInput.disabled = false
  }
  if (typeInput) {
    typeInput.value = data.type || 'unknown'
    typeInput.disabled = false
  }
  if (idInput) {
    idInput.value = data.id || Date.now().toString()
    idInput.disabled = false
  }

  // 位置属性
  const posXInput = inspector.querySelector('#pos-x') as HTMLInputElement
  const posYInput = inspector.querySelector('#pos-y') as HTMLInputElement
  const sizeWInput = inspector.querySelector('#size-w') as HTMLInputElement
  const sizeHInput = inspector.querySelector('#size-h') as HTMLInputElement

  if (posXInput && data.position) {
    posXInput.value = data.position.x?.toString() || '0'
    posXInput.disabled = false
  }
  if (posYInput && data.position) {
    posYInput.value = data.position.y?.toString() || '0'
    posYInput.disabled = false
  }
  if (sizeWInput && data.size) {
    sizeWInput.value = data.size.width?.toString() || '200'
    sizeWInput.disabled = false
  }
  if (sizeHInput && data.size) {
    sizeHInput.value = data.size.height?.toString() || '150'
    sizeHInput.disabled = false
  }

  // 样式属性
  const bgColorInput = inspector.querySelector('#bg-color') as HTMLInputElement
  const borderColorInput = inspector.querySelector('#border-color') as HTMLInputElement
  const opacityInput = inspector.querySelector('#opacity') as HTMLInputElement
  const opacityValue = inspector.querySelector('.range-value') as HTMLSpanElement

  if (bgColorInput) {
    bgColorInput.value = data.style?.backgroundColor || '#ffffff'
    bgColorInput.disabled = false
  }
  if (borderColorInput) {
    borderColorInput.value = data.style?.borderColor || '#e0e0e0'
    borderColorInput.disabled = false
  }
  if (opacityInput) {
    const opacity = Math.round((data.style?.opacity || 1) * 100)
    opacityInput.value = opacity.toString()
    opacityInput.disabled = false
    if (opacityValue) {
      opacityValue.textContent = `${opacity}%`
    }
  }

  // 自定义属性
  if (data.definition?.customProperties) {
    renderCustomProperties(data.definition.customProperties)
  }

  // 启用操作按钮
  const deleteBtn = inspector.querySelector('#delete-component') as HTMLButtonElement
  if (deleteBtn) {
    deleteBtn.disabled = false
  }

  // 重置脏状态
  markInspectorDirty(false)
}

/**
 * 清空属性面板表单
 */
function clearInspectorForm(inspector: HTMLElement): void {
  // 清空所有输入框
  const inputs = inspector.querySelectorAll('input')
  inputs.forEach(input => {
    if (input.type === 'text' || input.type === 'number') {
      input.value = input.type === 'text' ? '未选择组件' : ''
    } else if (input.type === 'color') {
      input.value = input.id === 'bg-color' ? '#ffffff' : '#e0e0e0'
    } else if (input.type === 'range') {
      input.value = '100'
    }
    input.disabled = true
  })

  // 重置透明度显示
  const opacityValue = inspector.querySelector('.range-value') as HTMLSpanElement
  if (opacityValue) {
    opacityValue.textContent = '100%'
  }

  // 禁用所有按钮
  const buttons = inspector.querySelectorAll('button')
  buttons.forEach(button => {
    button.disabled = true
    button.classList.remove('dirty')
  })

  // 隐藏自定义属性
  const customProps = inspector.querySelector('#custom-props') as HTMLElement
  if (customProps) {
    customProps.style.display = 'none'
  }

  // 清除数据引用
  currentComponentData.value = null
  originalComponentData.value = null
}

/**
 * 渲染自定义属性
 */
function renderCustomProperties(customProps: any[]): void {
  const customSection = document.querySelector('#custom-props') as HTMLElement
  const container = document.querySelector('#custom-props-container') as HTMLElement

  if (!customSection || !container) return

  if (customProps && customProps.length > 0) {
    container.innerHTML = customProps.map(prop => `
      <div class="property-group">
        <label>${prop.label || prop.name}:</label>
        <input
          type="${prop.type || 'text'}"
          id="custom-${prop.name}"
          value="${prop.value || ''}"
          placeholder="${prop.placeholder || ''}"
          ${prop.disabled ? 'disabled' : ''}
        >
      </div>
    `).join('')

    customSection.style.display = 'block'

    // 绑定自定义属性的事件
    const customInputs = container.querySelectorAll('input')
    customInputs.forEach(input => {
      input.addEventListener('input', () => {
        if (!input.hasAttribute('disabled')) {
          markInspectorDirty(true)
        }
      })
    })
  } else {
    customSection.style.display = 'none'
  }
}

/**
 * 更新统计信息
 */
function updateStats(): void {
  const stats = globalPureInfrastructure.getStats()
  Object.assign(infrastructureStats, stats)
}

/**
 * 添加事件日志
 */
function addEventLog(source: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
  eventLog.value.push({
    id: Date.now().toString(),
    timestamp: Date.now(),
    source,
    message,
    type
  })

  // 限制日志数量
  if (eventLog.value.length > 100) {
    eventLog.value = eventLog.value.slice(-50)
  }
}

/**
 * 清空事件日志
 */
function clearEventLog(): void {
  eventLog.value = []
  addEventLog('System', '事件日志已清空', 'info')
}

/**
 * 格式化时间
 */
function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString()
}

// 生命周期
onMounted(async () => {
  console.log('PureInfrastructure Demo: 组件已挂载')

  // 确保DOM完全渲染后再初始化
  // 使用多重 nextTick 和延迟确保容器已经准备好
  await nextTick()
  await nextTick()

  // 额外的短暂延迟确保布局完成
  await new Promise(resolve => setTimeout(resolve, 100))

  console.log('PureInfrastructure Demo: 开始初始化')
  await initializeInfrastructure()
})

onUnmounted(() => {
  // 重置所有初始化标志
  toolEventListenersSetup = false
  toolbarInitialized = false
  importEventListenerSetup = false

  // 清理全局引用
  delete (window as any).demoActions

  // 销毁基础设施
  if (globalPureInfrastructure && typeof globalPureInfrastructure.destroy === 'function') {
    globalPureInfrastructure.destroy()
  }
})
</script>

<style scoped>
.pure-infrastructure-demo {
  width: 100%;
  height: 100vh;
  position: relative;
  background: #f5f5f5;
}

/* 加载状态 */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.loading-content {
  text-align: center;
  max-width: 400px;
  padding: 40px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.error-icon {
  font-size: 50px;
  margin: 0 auto 20px;
  display: block;
}

.retry-btn {
  margin-top: 20px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.5);
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.retry-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: white;
  transform: translateY(-1px);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 演示容器 */
.demo-container {
  width: 100%;
  height: 100%;
}

/* 调试面板 */
.debug-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 350px;
  max-height: 80vh;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  overflow: hidden;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #2c3e50;
  color: white;
}

.debug-header h3 {
  margin: 0;
  font-size: 14px;
}

.debug-close {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
}

.debug-content {
  max-height: 60vh;
  overflow-y: auto;
  padding: 16px;
}

.debug-section {
  margin-bottom: 20px;
}

.debug-section h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  color: #2c3e50;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.debug-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 8px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 12px;
}

.stat-label {
  color: #666;
}

.stat-value {
  font-weight: bold;
  color: #2c3e50;
}

.region-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.region-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 12px;
}

.region-name {
  color: #666;
}

.region-state {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  background: #e9ecef;
  color: #666;
}

.region-state.active {
  background: #d4edda;
  color: #155724;
}

.event-log {
  max-height: 200px;
  overflow-y: auto;
  background: #f8f9fa;
  border-radius: 4px;
  padding: 8px;
}

.event-item {
  display: grid;
  grid-template-columns: 60px 80px 1fr;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #e9ecef;
  font-size: 11px;
}

.event-time {
  color: #666;
}

.event-source {
  color: #007bff;
  font-weight: bold;
}

.event-message {
  color: #2c3e50;
}

.clear-btn {
  font-size: 10px;
  padding: 2px 6px;
  margin-left: 8px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
}

/* 调试切换按钮 */
.debug-toggle {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #007bff;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
  z-index: 9999;
  transition: all 0.3s ease;
}

.debug-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 16px rgba(0, 123, 255, 0.4);
}

/* 区域样式 */
:deep(.demo-toolbar) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  color: white;
}

:deep(.toolbar-section) {
  display: flex;
  align-items: center;
  gap: 15px;
}

:deep(.toolbar-btn) {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: all 0.2s;
}

:deep(.toolbar-btn:hover) {
  background: rgba(255, 255, 255, 0.3);
}

:deep(.toolbar-btn.disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

:deep(.demo-sidebar) {
  height: 100%;
  background: white;
  border-right: 1px solid #e0e0e0;
}

:deep(.sidebar-header) {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

:deep(.sidebar-subtitle) {
  font-size: 12px;
  color: #666;
  margin: 5px 0 0 0;
  font-style: italic;
}

:deep(.sidebar-content) {
  padding: 10px;
}

/* 适配器组件样式 */
:deep(.adapted-component-list) {
  height: 100%;
}

:deep(.component-search) {
  padding: 10px;
  border-bottom: 1px solid #e0e0e0;
}

:deep(.component-categories) {
  padding: 10px;
  max-height: calc(100% - 120px);
  overflow-y: auto;
}

:deep(.category-section) {
  margin-bottom: 20px;
}

:deep(.category-header) {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 10px;
}

:deep(.category-icon) {
  font-size: 16px;
}

:deep(.category-name) {
  font-weight: 600;
  color: #333;
  margin: 0;
  flex: 1;
}

:deep(.component-count) {
  font-size: 12px;
  color: #999;
}

:deep(.category-components) {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

:deep(.component-item) {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s;
  user-select: none;
}

:deep(.component-item:hover) {
  background: #e9ecef;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.component-item:active) {
  cursor: grabbing;
}

:deep(.component-icon) {
  font-size: 18px;
  width: 20px;
  text-align: center;
}

:deep(.component-info) {
  flex: 1;
}

:deep(.component-name) {
  font-weight: 500;
  color: #333;
  font-size: 14px;
  line-height: 1.2;
}

:deep(.component-desc) {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}


:deep(.demo-canvas) {
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
}

:deep(.canvas-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

:deep(.canvas-tools) {
  display: flex;
  gap: 10px;
}

:deep(.canvas-btn) {
  padding: 8px 12px;
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

:deep(.canvas-btn:hover) {
  background: #e9ecef;
}

:deep(.canvas-workspace) {
  flex: 1;
  position: relative;
  background: #fafafa;
  background-image: radial-gradient(circle, #e0e0e0 1px, transparent 1px);
  background-size: 20px 20px;
  min-height: 400px;
}

:deep(.canvas-placeholder) {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #999;
}

:deep(.placeholder-icon) {
  font-size: 48px;
  margin-top: 10px;
}

:deep(.canvas-workspace.drag-over) {
  background-color: rgba(0, 123, 255, 0.1);
}

:deep(.canvas-component) {
  position: absolute;
  width: 200px;
  min-height: 150px;
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: move;
  transition: all 0.2s;
}

:deep(.canvas-component:hover) {
  border-color: #007bff;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

:deep(.canvas-component.selected) {
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.2);
}

:deep(.component-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e0;
  border-radius: 6px 6px 0 0;
  gap: 8px;
}

:deep(.component-header .component-icon) {
  font-size: 16px;
}

:deep(.component-header .component-name) {
  font-weight: 500;
  flex: 1;
}

:deep(.component-header .component-type) {
  font-size: 11px;
  color: #666;
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 3px;
}

:deep(.component-delete) {
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 12px;
}

:deep(.component-content) {
  padding: 20px;
  text-align: center;
  color: #666;
}

:deep(.demo-inspector) {
  height: 100%;
  background: white;
  border-left: 1px solid #e0e0e0;
}

:deep(.inspector-header) {
  padding: 20px;
  border-bottom: 1px solid #e0e0e0;
}

:deep(.property-sections) {
  padding: 20px;
}

:deep(.property-section) {
  margin-bottom: 20px;
}

:deep(.property-section h4) {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.property-group) {
  margin-bottom: 16px;
}

:deep(.property-group label) {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #555;
  font-weight: 500;
}

:deep(.property-group input) {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-sizing: border-box;
  font-size: 13px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

:deep(.property-group input:focus) {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

:deep(.property-group input:disabled) {
  background-color: #f8f9fa;
  color: #6c757d;
  cursor: not-allowed;
}

:deep(.property-group input[type="color"]) {
  height: 42px;
  padding: 4px;
  cursor: pointer;
}

:deep(.property-group input[type="range"]) {
  margin-bottom: 8px;
}

:deep(.range-value) {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

:deep(.position-inputs) {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

:deep(.property-actions) {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

:deep(.action-btn) {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

:deep(.action-btn:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

:deep(.action-btn.primary) {
  background: #007bff;
  color: white;
}

:deep(.action-btn.primary:hover:not(:disabled)) {
  background: #0056b3;
  transform: translateY(-1px);
}

:deep(.action-btn.primary.dirty) {
  background: #28a745;
  animation: pulse 2s infinite;
}

:deep(.action-btn.secondary) {
  background: #6c757d;
  color: white;
}

:deep(.action-btn.secondary:hover:not(:disabled)) {
  background: #545b62;
}

:deep(.action-btn.danger) {
  background: #dc3545;
  color: white;
}

:deep(.action-btn.danger:hover:not(:disabled)) {
  background: #c82333;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(40, 167, 69, 0); }
  100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
}
</style>
