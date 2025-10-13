<template>
  <div class="canvas-editor-test-page">
    <NMessageProvider>
    <!-- 头部控制栏 -->
    <div class="control-bar">
      <n-space>
        <n-button type="primary" @click="initializeSystem" :loading="isInitializing">
          {{ isInitialized ? '重新初始化' : '初始化Canvas编辑器' }}
        </n-button>

        <n-button @click="createTestNode" :disabled="!isInitialized">
          创建测试节点
        </n-button>

        <n-button @click="testBasicOperations" :disabled="!isInitialized">
          测试基本操作
        </n-button>

        <n-button @click="showSystemInfo" :disabled="!isInitialized">
          显示系统信息
        </n-button>

        <n-button @click="clearCanvas" :disabled="!isInitialized">
          清空Canvas
        </n-button>

        <n-button @click="cleanupSystem" :disabled="!isInitialized" type="error">
          清理系统
        </n-button>
      </n-space>
    </div>

    <!-- Canvas容器 -->
    <div class="canvas-container">
      <div
        id="canvas-container"
        ref="canvasContainer"
        class="canvas-wrapper"
        v-show="isInitialized"
      >
        <!-- Canvas将在这里动态创建 -->
      </div>
      <div class="canvas-placeholder" v-if="!isInitialized">
        <n-empty description="Canvas未初始化">
          <template #extra>
            <n-button @click="initializeSystem">开始初始化</n-button>
          </template>
        </n-empty>
      </div>
    </div>

    <!-- 状态信息面板 -->
    <div class="status-panel">
      <n-collapse>
        <n-collapse-item title="系统日志" name="logs">
          <div class="log-container">
            <div
              v-for="(log, index) in logs"
              :key="index"
              :class="['log-entry', `log-${log.type}`]"
            >
              <span class="log-time">{{ formatTime(log.timestamp) }}</span>
              <span class="log-message">{{ log.message }}</span>
            </div>
            <div v-if="logs.length === 0" class="no-logs">
              暂无日志信息...
            </div>
          </div>
        </n-collapse-item>

        <n-collapse-item title="Canvas引擎状态" name="canvas-status" v-if="canvasStatus">
          <n-descriptions bordered :column="2">
            <n-descriptions-item label="初始化状态">
              <n-tag :type="canvasStatus.isInitialized ? 'success' : 'error'">
                {{ canvasStatus.isInitialized ? '已初始化' : '未初始化' }}
              </n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="Canvas ID">{{ canvasStatus.canvasId }}</n-descriptions-item>
            <n-descriptions-item label="节点数量">{{ canvasStatus.nodeCount }}</n-descriptions-item>
            <n-descriptions-item label="当前模式">{{ canvasStatus.currentMode }}</n-descriptions-item>
            <n-descriptions-item label="缩放级别">{{ canvasStatus.zoom?.toFixed(2) || '0.00' }}</n-descriptions-item>
            <n-descriptions-item label="平移位置">
              x: {{ canvasStatus.pan?.x?.toFixed(0) || '0' }}, y: {{ canvasStatus.pan?.y?.toFixed(0) || '0' }}
            </n-descriptions-item>
          </n-descriptions>
        </n-collapse-item>

        <n-collapse-item title="测试结果" name="test-results" v-if="testResults.length > 0">
          <div class="test-results-container">
            <div
              v-for="(result, index) in testResults"
              :key="index"
              :class="['test-result', result.success ? 'success' : 'error']"
            >
              <span class="test-name">{{ result.name }}</span>
              <span class="test-status">{{ result.success ? '✅ 成功' : '❌ 失败' }}</span>
              <span class="test-message" v-if="result.message">{{ result.message }}</span>
            </div>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>
    </NMessageProvider>
  </div>
</template>

<script setup lang="ts">
/**
 * Canvas编辑器简化测试页面
 *
 * 直接使用Canvas引擎进行基本功能测试，避免复杂的动态导入
 */

import { ref, onMounted, onBeforeUnmount, nextTick, onErrorCaptured } from 'vue'
import { NMessageProvider, useMessage } from 'naive-ui'

interface LogEntry {
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  timestamp: number
}

interface TestResult {
  name: string
  success: boolean
  message?: string
}

interface CanvasEngineState {
  isInitialized: boolean
  canvasId: string
  nodeCount: number
  selectedNodeIds: string[]
  currentMode: string
  zoom: number
  pan: { x: number, y: number }
  performanceMetrics: any
  collaborationUsers: any[]
  pendingConflicts: any[]
}

// 响应式状态
const message = useMessage()
const canvasContainer = ref<HTMLElement>()
const isInitialized = ref(false)
const isInitializing = ref(false)

// 系统状态
const canvasStatus = ref<CanvasEngineState | null>(null)
const logs = ref<LogEntry[]>([])
const testResults = ref<TestResult[]>([])

// Canvas引擎实例
let canvasEngine: any = null
let configManager: any = null

/**
 * 添加日志
 */
function addLog(type: LogEntry['type'], message: string) {

  logs.value.unshift({
    type,
    message,
    timestamp: Date.now()
  })

  // 限制日志数量
  if (logs.value.length > 100) {
    logs.value = logs.value.slice(0, 100)
  }
}

/**
 * 添加测试结果
 */
function addTestResult(name: string, success: boolean, message?: string) {
  testResults.value.push({ name, success, message })
}

/**
 * 格式化时间
 */
function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 初始化Canvas编辑器系统（简化版本）
 */
async function initializeSystem() {
  if (isInitializing.value) return

  isInitializing.value = true
  addLog('info', '开始初始化Canvas编辑器系统（简化版本）...')

  try {
    // 确保DOM完全准备好
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 100))

    const container = document.getElementById('canvas-container')
    if (!container) {
      throw new Error('Canvas容器未找到')
    }
    addLog('info', 'Canvas容器检查通过')

    // 直接使用简化的Canvas控制器
    addLog('info', '正在加载简化Canvas控制器...')
    try {
      const { default: SimpleCanvasController } = await import('@/iot-visualization-platform/core/canvas-engine/simple-canvas-controller')

      addLog('success', '简化Canvas控制器加载成功')

      // 创建简化Canvas控制器
      canvasEngine = new SimpleCanvasController('canvas-container')

      // 设置事件监听
      canvasEngine.on('node:added', (data: any) => {
        addLog('success', `节点已添加: ${data.node.id}`)
        updateSystemStatus()
      })

      canvasEngine.on('node:removed', (data: any) => {
        addLog('success', `节点已移除: ${data.nodeId}`)
        updateSystemStatus()
      })

      canvasEngine.on('selection:changed', (data: any) => {
        addLog('info', `选择已更改: ${data.selectedNodeIds.length} 个节点`)
        updateSystemStatus()
      })

      canvasEngine.on('zoom:changed', (data: any) => {
        addLog('info', `缩放已更改: ${(data.zoom * 100).toFixed(0)}%`)
      })

      canvasEngine.on('pan:changed', (data: any) => {
        addLog('info', `平移已更改: (${data.pan.x.toFixed(0)}, ${data.pan.y.toFixed(0)})`)
      })

      // 创建一些示例节点
      canvasEngine.createNode({
        id: 'node-1',
        type: 'chart',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        title: '温度图表',
        color: '#e3f2fd'
      })

      canvasEngine.createNode({
        id: 'node-2',
        type: 'indicator',
        x: 350,
        y: 100,
        width: 150,
        height: 100,
        title: '湿度指示器',
        color: '#f3e5f5'
      })

      canvasEngine.createNode({
        id: 'node-3',
        type: 'control',
        x: 550,
        y: 100,
        width: 120,
        height: 80,
        title: '开关控制',
        color: '#e8f5e8'
      })

      isInitialized.value = true
      addLog('success', 'Canvas编辑器系统初始化完成!')
      message.success('Canvas编辑器系统初始化成功!')

      // 更新状态信息
      updateSystemStatus()

    } catch (importError) {
      addLog('error', `简化Canvas控制器加载失败: ${importError.message}`)

      // 如果无法导入模块，创建基础Canvas测试
      addLog('info', '尝试创建基础Canvas测试...')
      await createBasicCanvasTest()
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addLog('error', `初始化失败: ${errorMessage}`)
    message.error(`初始化失败: ${errorMessage}`)
    console.error('Canvas编辑器初始化详细错误:', error)
  } finally {
    isInitializing.value = false
  }
}

/**
 * 创建基础Canvas测试（fallback）
 */
async function createBasicCanvasTest() {
  try {
    addLog('info', '创建基础HTML Canvas测试...')

    const container = document.getElementById('canvas-container')
    if (!container) return

    // 清空容器
    container.innerHTML = ''

    // 创建Canvas元素
    const canvas = document.createElement('canvas')
    canvas.width = 1000
    canvas.height = 600
    canvas.style.border = '1px solid #ccc'
    canvas.style.backgroundColor = '#f8f9fa'

    container.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('无法获取Canvas 2D上下文')
    }

    // 绘制测试内容
    ctx.fillStyle = '#3b82f6'
    ctx.font = '24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Canvas编辑器测试', canvas.width / 2, 100)

    ctx.fillStyle = '#10b981'
    ctx.font = '16px Arial'
    ctx.fillText('基础Canvas已创建，等待更多功能...', canvas.width / 2, 140)

    // 绘制一些测试图形
    ctx.fillStyle = '#ef4444'
    ctx.fillRect(100, 200, 150, 100)

    ctx.fillStyle = '#f59e0b'
    ctx.beginPath()
    ctx.arc(400, 250, 50, 0, 2 * Math.PI)
    ctx.fill()

    ctx.fillStyle = '#8b5cf6'
    ctx.fillRect(600, 200, 200, 80)

    isInitialized.value = true
    addLog('success', '基础Canvas测试创建完成')
    message.success('基础Canvas测试创建成功!')

    // 模拟状态
    canvasStatus.value = {
      isInitialized: true,
      canvasId: 'basic-canvas',
      nodeCount: 3,
      selectedNodeIds: [],
      currentMode: 'select',
      zoom: 1,
      pan: { x: 0, y: 0 },
      performanceMetrics: {},
      collaborationUsers: [],
      pendingConflicts: []
    }

  } catch (error) {
    addLog('error', `基础Canvas创建失败: ${error.message}`)
    throw error
  }
}

/**
 * 创建测试节点
 */
async function createTestNode() {
  if (!canvasEngine) {
    addLog('warning', 'Canvas引擎未初始化')
    return
  }

  try {
    addLog('info', '创建测试节点...')

    const nodeConfig = {
      id: `test-node-${Date.now()}`,
      type: 'test-component',
      x: Math.random() * 400 + 100,
      y: Math.random() * 300 + 100,
      width: 180,
      height: 120,
      title: `测试节点 ${Math.floor(Math.random() * 100)}`,
      color: `hsl(${Math.random() * 360}, 70%, 90%)`
    }

    const node = canvasEngine.createNode(nodeConfig)
    addLog('success', `测试节点创建成功: ${node.id}`)
    addTestResult('创建测试节点', true, `节点ID: ${node.id}`)
  } catch (error) {
    addLog('error', `创建测试节点异常: ${error.message}`)
    addTestResult('创建测试节点', false, error.message)
  }
}

/**
 * 测试基本操作
 */
async function testBasicOperations() {
  if (!canvasEngine) {
    addLog('warning', 'Canvas引擎未初始化')
    addTestResult('基本操作测试', false, 'Canvas引擎未初始化')
    return
  }

  addLog('info', '开始测试基本操作...')

  try {
    // 测试缩放
    canvasEngine.setZoom(1.5)
    addTestResult('缩放测试', true, '缩放到1.5倍')
    await new Promise(resolve => setTimeout(resolve, 500))

    // 测试平移
    canvasEngine.setPan(50, 50)
    addTestResult('平移测试', true, '平移到(50, 50)')
    await new Promise(resolve => setTimeout(resolve, 500))

    // 测试适应内容
    canvasEngine.fitToContent()
    addTestResult('适应内容测试', true, '已适应到所有节点')
    await new Promise(resolve => setTimeout(resolve, 500))

    // 获取所有节点
    const nodes = canvasEngine.getNodes()
    addTestResult('获取节点列表', true, `节点数量: ${nodes.length}`)

    // 测试选择第一个节点
    if (nodes.length > 0) {
      canvasEngine.selectNode(nodes[0].id)
      addTestResult('节点选择测试', true, `选择节点: ${nodes[0].title}`)
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    // 测试清空选择
    canvasEngine.clearSelection()
    addTestResult('清空选择测试', true, '已清空所有选择')

    addLog('success', '基本操作测试完成')
    updateSystemStatus()
  } catch (error) {
    addLog('error', `基本操作测试失败: ${error.message}`)
    addTestResult('基本操作测试', false, error.message)
  }
}

/**
 * 显示系统信息
 */
function showSystemInfo() {
  addLog('info', '显示系统信息')

  if (canvasEngine) {
    try {
      const state = canvasEngine.getState()
      addLog('info', `Canvas状态: 节点数${state.nodeCount}, 缩放${state.zoom?.toFixed(2) || '1.00'}`)
      addLog('info', `当前模式: ${state.currentMode}, 选中节点: ${state.selectedNodeIds?.length || 0}`)
    } catch (error) {
      addLog('warning', `获取状态失败: ${error.message}`)
    }
  }

  if (configManager) {
    try {
      const stats = configManager.getEngineStats()
      addLog('info', `Config Engine: 配置数${stats.totalConfigurations}, 版本数${stats.totalVersions}`)
    } catch (error) {
      addLog('warning', `获取Config Engine统计失败: ${error.message}`)
    }
  }

  message.info('系统信息已显示在日志中')
}

/**
 * 清空Canvas
 */
function clearCanvas() {
  addLog('info', '清空Canvas内容')

  if (canvasEngine && typeof canvasEngine.clear === 'function') {
    try {
      canvasEngine.clear()
      addLog('success', 'Canvas已清空')
      updateSystemStatus()
    } catch (error) {
      addLog('error', `清空Canvas失败: ${error.message}`)
    }
  } else {
    // 基础Canvas模式
    const container = document.getElementById('canvas-container')
    const canvas = container?.querySelector('canvas')
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx?.clearRect(0, 0, canvas.width, canvas.height)
      addLog('success', '基础Canvas已清空')
    }
  }

  message.success('Canvas已清空')
}

/**
 * 更新系统状态
 */
function updateSystemStatus() {
  if (!canvasEngine) return

  try {
    const state = canvasEngine.getState()
    canvasStatus.value = state
  } catch (error) {
    console.warn('获取系统状态失败:', error)
  }
}

/**
 * 清理系统
 */
async function cleanupSystem() {
  addLog('info', '开始清理系统...')

  try {
    if (canvasEngine) {
      canvasEngine.destroy()
      canvasEngine = null
      addLog('info', 'Canvas引擎已清理')
    }

    if (configManager) {
      await configManager.shutdown()
      configManager = null
      addLog('info', 'Config Engine已清理')
    }

    // 清空容器
    const container = document.getElementById('canvas-container')
    if (container) {
      container.innerHTML = ''
    }

    isInitialized.value = false
    canvasStatus.value = null
    testResults.value = []

    addLog('success', '系统清理完成')
    message.success('系统已清理')
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addLog('error', `清理失败: ${errorMessage}`)
    message.error(`清理失败: ${errorMessage}`)
  }
}

/**
 * 组件挂载时的初始化
 */
onMounted(async () => {
  addLog('info', 'Canvas编辑器测试页面已加载')
  addLog('info', '页面路径: /iot-visualization-platform')
  addLog('info', '请点击"初始化Canvas编辑器"按钮开始测试')

  // 确保Canvas容器准备好
  await nextTick()
  const container = document.getElementById('canvas-container')
  if (container) {
    addLog('info', 'Canvas容器已准备就绪')
  } else {
    addLog('warning', 'Canvas容器未找到，可能需要等待DOM渲染完成')
  }
})

/**
 * 组件卸载前的清理
 */
onBeforeUnmount(async () => {
  if (canvasEngine) {
    try {
      canvasEngine.destroy()
      addLog('info', '页面卸载时清理完成')
    } catch (error) {
      console.warn('组件卸载时清理失败:', error)
    }
  }
})

/**
 * 错误捕获
 */
onErrorCaptured((error, instance, info) => {
  addLog('error', `组件渲染错误: ${error.message}`)
  console.error('Vue组件错误:', error, instance, info)

  // 尝试恢复
  if (error.message.includes('insertBefore') || error.message.includes('Cannot read properties of null')) {
    addLog('warning', '检测到DOM操作错误，尝试重新初始化...')
    setTimeout(() => {
      if (!isInitialized.value) {
        initializeSystem()
      }
    }, 1000)
  }

  return false // 不阻止错误传播到全局处理器
})
</script>

<style scoped>
.canvas-editor-test-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 16px;
  gap: 16px;
  background-color: var(--n-color);
}

.control-bar {
  flex-shrink: 0;
  padding: 16px;
  background-color: var(--n-card-color);
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.canvas-container {
  flex: 1;
  min-height: 500px;
  background-color: var(--n-card-color);
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.canvas-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.status-panel {
  flex-shrink: 0;
  max-height: 400px;
  background-color: var(--n-card-color);
  border-radius: 8px;
  border: 1px solid var(--n-border-color);
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.log-container {
  max-height: 200px;
  overflow-y: auto;
  background-color: var(--n-code-color, #f5f5f5);
  padding: 12px;
  border-radius: 4px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.4;
  border: 1px solid var(--n-border-color);
}

.log-entry {
  display: flex;
  margin-bottom: 4px;
  align-items: flex-start;
  gap: 8px;
}

.log-time {
  flex-shrink: 0;
  color: var(--n-text-color-3);
  font-weight: 500;
  min-width: 70px;
  font-size: 11px;
}

.log-message {
  flex: 1;
  word-break: break-word;
}

.log-info .log-message {
  color: var(--n-text-color-2);
}

.log-success .log-message {
  color: var(--n-success-color);
  font-weight: 500;
}

.log-warning .log-message {
  color: var(--n-warning-color);
  font-weight: 500;
}

.log-error .log-message {
  color: var(--n-error-color);
  font-weight: 500;
}

.no-logs {
  color: var(--n-text-color-3);
  font-style: italic;
  text-align: center;
  padding: 20px;
}

.test-results-container {
  max-height: 200px;
  overflow-y: auto;
  background-color: var(--n-code-color, #f5f5f5);
  padding: 12px;
  border-radius: 4px;
  border: 1px solid var(--n-border-color);
}

.test-result {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  margin-bottom: 4px;
  border-radius: 4px;
  font-size: 13px;
}

.test-result.success {
  background-color: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.test-result.error {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.test-name {
  font-weight: 500;
  min-width: 100px;
}

.test-status {
  font-weight: bold;
}

.test-message {
  color: var(--n-text-color-3);
  font-size: 12px;
}

/* Canvas样式 */
:deep(#canvas-container canvas) {
  border: 1px solid var(--n-border-color);
  background-color: #fafafa;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .canvas-editor-test-page {
    padding: 8px;
    gap: 8px;
  }

  .control-bar {
    padding: 12px;
  }

  .canvas-container {
    min-height: 300px;
  }

  .status-panel {
    max-height: 300px;
    padding: 12px;
  }
}

/* 滚动条样式 */
.log-container::-webkit-scrollbar,
.test-results-container::-webkit-scrollbar {
  width: 6px;
}

.log-container::-webkit-scrollbar-track,
.test-results-container::-webkit-scrollbar-track {
  background: var(--n-scrollbar-color);
  border-radius: 3px;
}

.log-container::-webkit-scrollbar-thumb,
.test-results-container::-webkit-scrollbar-thumb {
  background: var(--n-scrollbar-color-hover);
  border-radius: 3px;
}

.log-container::-webkit-scrollbar-thumb:hover,
.test-results-container::-webkit-scrollbar-thumb:hover {
  background: var(--n-primary-color);
}

/* 加载状态样式 */
.control-bar :deep(.n-button--loading) {
  pointer-events: none;
}
</style>