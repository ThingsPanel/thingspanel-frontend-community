<!--
  @file Phase 1B 数据传递层测试页面
  @description 验证PanelV2-Clean数据管道、生命周期管理和状态管理的正确性
  重点测试样式层和数据传递层的集成
-->

<template>
  <div class="phase1b-test-page">
    <!-- 页面标题 -->
    <div class="test-header">
      <h1>Phase 1B - 数据传递层测试</h1>
      <p>验证数据管道、生命周期管理和状态管理的集成</p>
    </div>

    <!-- 主要测试区域 -->
    <div class="test-main">
      <!-- 左侧：数据操作区 -->
      <div class="test-operations">
        <h3>数据操作测试</h3>
        
        <!-- 节点操作 -->
        <div class="operation-group">
          <h4>节点操作</h4>
          <div class="operation-buttons">
            <button class="btn-primary" @click="addTestNode">添加节点</button>
            <button class="btn-secondary" :disabled="!selectedNodeId" @click="updateSelectedNode">更新节点</button>
            <button class="btn-danger" :disabled="!selectedNodeId" @click="removeSelectedNode">删除节点</button>
          </div>
        </div>

        <!-- 批量操作 -->
        <div class="operation-group">
          <h4>批量操作</h4>
          <div class="operation-buttons">
            <button class="btn-primary" @click="addMultipleNodes">批量添加</button>
            <button class="btn-danger" @click="clearAllNodes">清空所有</button>
          </div>
        </div>

        <!-- 历史操作 -->
        <div class="operation-group">
          <h4>历史操作</h4>
          <div class="operation-buttons">
            <button class="btn-secondary" :disabled="!canUndo" @click="undoOperation">撤销</button>
            <button class="btn-secondary" :disabled="!canRedo" @click="redoOperation">重做</button>
          </div>
        </div>

        <!-- 数据管道统计 -->
        <div class="stats-group">
          <h4>数据管道统计</h4>
          <div class="stats-display">
            <div class="stat-item">
              <span class="stat-label">历史记录:</span>
              <span class="stat-value">{{ pipelineStats.historySize }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">验证器:</span>
              <span class="stat-value">{{ pipelineStats.validatorCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">批量中:</span>
              <span class="stat-value">{{ pipelineStats.batchInProgress ? '是' : '否' }}</span>
            </div>
          </div>
        </div>

        <!-- 生命周期统计 -->
        <div class="stats-group">
          <h4>生命周期统计</h4>
          <div class="stats-display">
            <div class="stat-item">
              <span class="stat-label">总阶段:</span>
              <span class="stat-value">{{ lifecycleStats.totalPhases }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">总钩子:</span>
              <span class="stat-value">{{ lifecycleStats.totalHooks }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">错误数:</span>
              <span class="stat-value">{{ lifecycleStats.errors }}</span>
            </div>
          </div>
        </div>

        <!-- 工具引擎统计 -->
        <div class="stats-group">
          <h4>工具引擎统计</h4>
          <div class="stats-display">
            <div class="stat-item">
              <span class="stat-label">保存次数:</span>
              <span class="stat-value">{{ toolEngineStats.totalSaves }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">清空次数:</span>
              <span class="stat-value">{{ toolEngineStats.totalClears }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">撤销次数:</span>
              <span class="stat-value">{{ toolEngineStats.totalUndos }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">重做次数:</span>
              <span class="stat-value">{{ toolEngineStats.totalRedos }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">历史记录:</span>
              <span class="stat-value">{{ toolEngineStats.historySize }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间：布局展示区 -->
      <div class="test-layout">
        <PureLayoutManager
          ref="layoutRef"
          :config="layoutConfig"
          :responsive="true"
          :animated="true"
          @region-resize="handleLayoutEvent"
          @region-visibility-change="handleLayoutEvent"
        >
          <!-- 工具栏 -->
          <template #toolbar>
            <div class="test-toolbar">
              <!-- 基础工具组 -->
              <div class="toolbar-group">
                <button class="toolbar-btn primary" @click="showMessage('工具栏', '新建文档')">
                  <span class="btn-icon">📄</span>
                  <span class="btn-text">新建</span>
                </button>
                <button class="toolbar-btn" @click="showMessage('工具栏', '打开文档')">
                  <span class="btn-icon">📂</span>
                  <span class="btn-text">打开</span>
                </button>
                <button class="toolbar-btn" @click="savePanel">
                  <span class="btn-icon">💾</span>
                  <span class="btn-text">保存</span>
                </button>
              </div>

              <!-- 分隔线 -->
              <div class="toolbar-divider"></div>

              <!-- 编辑工具组 -->
              <div class="toolbar-group">
                <button class="toolbar-btn" :disabled="!canUndo" @click="undoOperation">
                  <span class="btn-icon">↶</span>
                  <span class="btn-text">撤销</span>
                </button>
                <button class="toolbar-btn" :disabled="!canRedo" @click="redoOperation">
                  <span class="btn-icon">↷</span>
                  <span class="btn-text">重做</span>
                </button>
              </div>

              <!-- 分隔线 -->
              <div class="toolbar-divider"></div>

              <!-- 节点工具组 -->
              <div class="toolbar-group">
                <button class="toolbar-btn success" @click="addTestNode">
                  <span class="btn-icon">➕</span>
                  <span class="btn-text">添加</span>
                </button>
                <button class="toolbar-btn warning" :disabled="!selectedNodeId" @click="updateSelectedNode">
                  <span class="btn-icon">✏️</span>
                  <span class="btn-text">编辑</span>
                </button>
                <button class="toolbar-btn danger" :disabled="!selectedNodeId" @click="removeSelectedNode">
                  <span class="btn-icon">🗑️</span>
                  <span class="btn-text">删除</span>
                </button>
              </div>

              <!-- 状态信息区 -->
              <div class="toolbar-status">
                <span class="status-item">节点: {{ nodeCount }}</span>
                <span class="status-item">选中: {{ selectedNodeId ? '1' : '0' }}</span>
                <span class="status-item" :class="{ 'dirty': isDirty }">
                  {{ isDirty ? '已修改' : '干净' }}
                </span>
              </div>

              <!-- 更多工具收缩按钮 -->
              <div class="toolbar-more">
                <button 
                  class="toolbar-btn more-btn" 
                  :class="{ 'active': showMoreTools }"
                  @click="showMoreTools = !showMoreTools"
                >
                  <span class="btn-icon">⋯</span>
                </button>
                
                <!-- 更多工具下拉面板 -->
                <div v-if="showMoreTools" class="more-tools-panel">
                  <button class="more-tool-item" @click="showMessage('工具栏', '导出数据')">
                    <span class="tool-icon">📤</span>
                    <span class="tool-text">导出</span>
                  </button>
                  <button class="more-tool-item" @click="showMessage('工具栏', '导入数据')">
                    <span class="tool-icon">📥</span>
                    <span class="tool-text">导入</span>
                  </button>
                  <button class="more-tool-item" @click="showMessage('工具栏', '分享链接')">
                    <span class="tool-icon">🔗</span>
                    <span class="tool-text">分享</span>
                  </button>
                  <button class="more-tool-item" @click="showMessage('工具栏', '设置选项')">
                    <span class="tool-icon">⚙️</span>
                    <span class="tool-text">设置</span>
                  </button>
                </div>
              </div>
            </div>
          </template>

          <!-- 侧边栏 -->
          <template #sidebar>
            <ComponentListRenderer 
              :config="{ showSearch: true, showStats: true, compact: false }"
              @component-drag-start="handleComponentDragStart"
              @component-click="handleComponentClick"
            />
          </template>

          <!-- 画布 -->
          <template #canvas>
            <div 
              class="test-canvas"
              @dragover="handleCanvasDragOver"
              @drop="handleCanvasDrop"
              @dragenter="handleCanvasDragEnter"
              @dragleave="handleCanvasDragLeave"
            >
              <!-- 拖拽提示层 -->
              <div 
                v-show="isDragOverCanvas"
                class="drag-overlay"
              >
                <div class="drag-hint">
                  <div class="drag-icon">📦</div>
                  <div class="drag-text">释放以添加组件</div>
                </div>
              </div>

              <div class="canvas-grid" :style="{ minHeight: canvasMinHeight + 'px' }">
                <div 
                  v-for="node in nodes"
                  :key="node.id"
                  class="canvas-node"
                  :class="{ 'selected': selectedNodeId === node.id }"
                  :style="getNodeStyle(node)"
                  @click="selectNode(node.id)"
                >
                  <div class="node-header">
                    <span class="node-title">{{ node.name }}</span>
                    <span class="node-type-badge">{{ node.type }}</span>
                  </div>
                  <div class="node-content">
                    <div class="node-meta">
                      <div>类型: {{ node.type }}</div>
                      <div>创建: {{ formatTime(node.meta.createTime) }}</div>
                      <div>更新: {{ formatTime(node.meta.updateTime) }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 检查器 -->
          <template #inspector>
            <div class="test-inspector">
              <h4>属性配置器</h4>
              
              <!-- 选中节点的属性编辑 -->
              <div v-if="selectedNodeId && selectedNode" class="property-editor">
                <div class="property-section">
                  <h5>基础属性</h5>
                  <div class="property-item">
                    <label>节点名称</label>
                    <input 
                      v-model="selectedNode.name" 
                      type="text"
                      class="property-input" 
                      @input="updateNodeProperty('name', selectedNode.name)"
                    />
                  </div>
                  <div class="property-item">
                    <label>节点类型</label>
                    <select 
                      v-model="selectedNode.type"
                      class="property-select"
                      @change="updateNodeProperty('type', selectedNode.type)"
                    >
                      <option value="text">文本</option>
                      <option value="image">图片</option>
                      <option value="chart">图表</option>
                      <option value="button">按钮</option>
                      <option value="input">输入框</option>
                    </select>
                  </div>
                </div>

                <div class="property-section">
                  <h5>布局属性</h5>
                  <div class="property-grid">
                    <div class="property-item">
                      <label>X 位置</label>
                      <input 
                        v-model.number="selectedNode.layout.x" 
                        type="number"
                        min="0" 
                        max="10" 
                        class="property-input small"
                        @input="updateNodeProperty('layout', selectedNode.layout)"
                      />
                    </div>
                    <div class="property-item">
                      <label>Y 位置</label>
                      <input 
                        v-model.number="selectedNode.layout.y" 
                        type="number"
                        min="0" 
                        max="10" 
                        class="property-input small"
                        @input="updateNodeProperty('layout', selectedNode.layout)"
                      />
                    </div>
                    <div class="property-item">
                      <label>宽度</label>
                      <input 
                        v-model.number="selectedNode.layout.w" 
                        type="number"
                        min="1" 
                        max="6" 
                        class="property-input small"
                        @input="updateNodeProperty('layout', selectedNode.layout)"
                      />
                    </div>
                    <div class="property-item">
                      <label>高度</label>
                      <input 
                        v-model.number="selectedNode.layout.h" 
                        type="number"
                        min="1" 
                        max="4" 
                        class="property-input small"
                        @input="updateNodeProperty('layout', selectedNode.layout)"
                      />
                    </div>
                  </div>
                </div>

                <div class="property-section">
                  <h5>样式属性</h5>
                  <div class="property-item">
                    <label>背景颜色</label>
                    <input 
                      v-model="selectedNode.style.background.color" 
                      type="color"
                      class="property-color" 
                      @input="updateNodeProperty('style', selectedNode.style)"
                    />
                  </div>
                  <div class="property-item">
                    <label>透明度</label>
                    <input 
                      v-model.number="selectedNode.config.base.appearance.opacity" 
                      type="range"
                      min="0" 
                      max="1" 
                      step="0.1" 
                      class="property-range"
                      @input="updateNodeProperty('config', selectedNode.config)"
                    />
                    <span class="range-value">{{ selectedNode.config.base.appearance.opacity.toFixed(1) }}</span>
                  </div>
                </div>

                <div class="property-actions">
                  <button class="btn-small secondary" @click="resetNodeProperties">重置属性</button>
                  <button class="btn-small primary" @click="duplicateNode">复制节点</button>
                </div>
              </div>

              <!-- 无选中节点时的提示 -->
              <div v-else class="no-selection">
                <div class="no-selection-icon">🎯</div>
                <div class="no-selection-text">请从左侧或画布选择一个节点</div>
                <div class="no-selection-hint">选中后可在此编辑属性</div>
              </div>

              <!-- Store状态统计 -->
              <div class="stats-section">
                <h5>状态统计</h5>
                <div class="store-stats">
                  <div class="stat-item">
                    <span class="stat-label">总操作:</span>
                    <span class="stat-value">{{ storeStats.totalOperations }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">节点数:</span>
                    <span class="stat-value">{{ storeStats.nodesCount }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">选中数:</span>
                    <span class="stat-value">{{ storeStats.selectedCount }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">历史大小:</span>
                    <span class="stat-value">{{ storeStats.historySize }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">可撤销:</span>
                    <span class="stat-value">{{ storeStats.canUndo ? '是' : '否' }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">可重做:</span>
                    <span class="stat-value">{{ storeStats.canRedo ? '是' : '否' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </PureLayoutManager>
      </div>

      <!-- 右侧：事件日志 -->
      <div class="test-events">
        <h3>事件日志</h3>
        <div class="event-controls">
          <button class="btn-small" @click="clearEventLog">清空日志</button>
          <label>
            <input v-model="autoScroll" type="checkbox">
            自动滚动
          </label>
        </div>
        <div ref="eventLogRef" class="event-log">
          <div 
            v-for="(event, index) in eventLog.slice(-50)"
            :key="index"
            class="event-item"
            :class="`event-${event.type}`"
          >
            <span class="event-time">{{ event.time }}</span>
            <span class="event-source">{{ event.source }}</span>
            <span class="event-message">{{ event.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { nanoid } from 'nanoid'
import PureLayoutManager from '../../components/panelv2-clean/core/PureLayoutManager.vue'
import ComponentListRenderer from '../../components/panelv2-clean/renderers/ComponentListRenderer.vue'
import { usePanelCleanStore } from '../../components/panelv2-clean/core/PanelCleanStore'
import { globalDataPipeline } from '../../components/panelv2-clean/core/PureDataPipeline'
import { globalLifecycleManager } from '../../components/panelv2-clean/core/LifecycleManager'
import { globalEventBus } from '../../components/panelv2-clean/core/EventBus'
import { globalNodeRegistryEngine } from '../../components/panelv2-clean/engines/NodeRegistryEngine'
import { globalDataEngine } from '../../components/panelv2-clean/engines/DataEngine'
import { globalToolEngine } from '../../components/panelv2-clean/engines/ToolEngine'
import { allMockComponents } from '../../components/panelv2-clean/core/MockComponents'
import { LifecyclePhase } from '../../components/panelv2-clean/core/interfaces/Lifecycle'
import type { NodeData } from '../../components/panelv2-clean/types/core'
import type { ComponentDefinition } from '../../components/panelv2-clean/types/core'

// Store实例
const store = usePanelCleanStore()

// 引用
const layoutRef = ref()
const eventLogRef = ref()

// 响应式数据
const selectedNodeId = ref<string | null>(null)
const autoScroll = ref(true)
const showMoreTools = ref(false)
const isDragOverCanvas = ref(false)
const dragOverTimeout = ref<number | null>(null)
const pipelineStats = ref({ historySize: 0, validatorCount: 0, transformerCount: 0, batchInProgress: false })
const lifecycleStats = ref({ totalPhases: 0, totalHooks: 0, phaseExecutions: {}, averageExecutionTime: {}, errors: 0 })
const toolEngineStats = ref({ totalSaves: 0, totalClears: 0, totalUndos: 0, totalRedos: 0, historySize: 0, lastOperationTime: Date.now() })
const eventLog = ref<Array<{ time: string, source: string, message: string, type: string }>>([])

// 计算属性
const nodes = computed(() => store.panelData.nodes)
const nodeCount = computed(() => nodes.value.length)
const isDirty = computed(() => globalToolEngine.state.isDirty())
const canUndo = computed(() => globalToolEngine.history.canUndo())
const canRedo = computed(() => globalToolEngine.history.canRedo())
const storeStats = computed(() => store.getStats())

// 选中的节点对象（可编辑）
const selectedNode = computed(() => {
  if (!selectedNodeId.value) return null
  return nodes.value.find(node => node.id === selectedNodeId.value) || null
})

// 画布最小高度（确保有足够空间触发纵向滚动）
const canvasMinHeight = computed(() => {
  // 基础高度 + 节点高度计算
  let minHeight = 800 // 基础最小高度
  
  // 计算节点最大Y位置
  if (nodes.value.length > 0) {
    const maxY = Math.max(...nodes.value.map(node => 
      (node.layout.y + node.layout.h) * 48 + node.layout.y * 8
    ))
    minHeight = Math.max(minHeight, maxY + 200) // 添加底部边距
  }
  
  return minHeight
})

// 布局配置
const layoutConfig = {
  toolbar: { visible: true, height: 48, resizable: false, collapsible: false },
  sidebar: { visible: true, width: 280, resizable: true, collapsible: true },
  inspector: { visible: true, width: 320, resizable: true, collapsible: true },
  canvas: { padding: 16, background: 'transparent', flex: 1 }
}

/**
 * 添加事件日志
 */
const addEventLog = (source: string, message: string, type: string = 'info') => {
  const now = new Date()
  const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
  
  eventLog.value.push({ time, source, message, type })
  
  // 自动滚动到底部
  if (autoScroll.value) {
    nextTick(() => {
      if (eventLogRef.value) {
        eventLogRef.value.scrollTop = eventLogRef.value.scrollHeight
      }
    })
  }
}

/**
 * 添加测试节点
 */
const addTestNode = async () => {
  try {
    const nodeTypes = ['text', 'image', 'chart', 'button']
    const randomType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)]
    
    await store.addNode({
      name: `测试${randomType}${Date.now()}`,
      type: randomType,
      layout: {
        x: Math.floor(Math.random() * 8),
        y: Math.floor(Math.random() * 6),
        w: 2 + Math.floor(Math.random() * 3),
        h: 2 + Math.floor(Math.random() * 2)
      }
    })
    
    addEventLog('Store', `成功添加 ${randomType} 节点`, 'success')
  } catch (error) {
    addEventLog('Store', `添加节点失败: ${error}`, 'error')
  }
}

/**
 * 更新选中节点
 */
const updateSelectedNode = async () => {
  if (!selectedNodeId.value) return
  
  try {
    await store.updateNode(selectedNodeId.value, {
      name: `更新节点_${Date.now()}`,
      layout: {
        x: Math.floor(Math.random() * 8),
        y: Math.floor(Math.random() * 6),
        w: 2 + Math.floor(Math.random() * 3),
        h: 2 + Math.floor(Math.random() * 2)
      }
    })
    
    addEventLog('Store', `成功更新节点: ${selectedNodeId.value}`, 'success')
  } catch (error) {
    addEventLog('Store', `更新节点失败: ${error}`, 'error')
  }
}

/**
 * 删除选中节点
 */
const removeSelectedNode = async () => {
  if (!selectedNodeId.value) return
  
  try {
    const nodeIdToDelete = selectedNodeId.value
    await store.removeNode(nodeIdToDelete)
    selectedNodeId.value = null
    addEventLog('Store', `成功删除节点: ${nodeIdToDelete}`, 'success')
  } catch (error) {
    addEventLog('Store', `删除节点失败: ${error}`, 'error')
  }
}

/**
 * 批量添加节点
 */
const addMultipleNodes = async () => {
  try {
    const operations = []
    for (let i = 0; i < 3; i++) {
      operations.push({
        id: nanoid(),
        type: 'ADD' as const,
        payload: {
          name: `批量节点_${i + 1}`,
          type: 'batch',
          layout: { x: i * 2, y: 0, w: 2, h: 2 }
        },
        target: { type: 'node' as const, id: nanoid() }
      })
    }
    
    await globalDataPipeline.executeBatch(operations)
    addEventLog('Pipeline', '批量操作执行成功', 'success')
  } catch (error) {
    addEventLog('Pipeline', `批量操作失败: ${error}`, 'error')
  }
}

/**
 * 清空所有节点
 */
const clearAllNodes = async () => {
  try {
    await globalToolEngine.cleaner.clearAll()
    selectedNodeId.value = null
    addEventLog('ToolEngine', '已清空所有节点', 'warning')
  } catch (error) {
    addEventLog('ToolEngine', `清空节点失败: ${error}`, 'error')
  }
}

/**
 * 保存面板
 */
const savePanel = async () => {
  try {
    const result = await globalToolEngine.saver.save()
    if (result.success) {
      addEventLog('ToolEngine', `保存成功: ${result.version}`, 'success')
    } else {
      addEventLog('ToolEngine', `保存失败: ${result.error}`, 'error')
    }
  } catch (error) {
    addEventLog('ToolEngine', `保存异常: ${error}`, 'error')  
  }
}

/**
 * 显示消息（用于演示工具栏按钮）
 */
const showMessage = (source: string, message: string) => {
  addEventLog(source, message, 'info')
}

/**
 * 撤销操作
 */
const undoOperation = async () => {
  const success = await globalToolEngine.history.undo()
  if (success) {
    addEventLog('ToolEngine', '撤销操作成功', 'info')
  } else {
    addEventLog('ToolEngine', '撤销操作失败', 'error')
  }
}

/**
 * 重做操作
 */
const redoOperation = async () => {
  const success = await globalToolEngine.history.redo()
  if (success) {
    addEventLog('ToolEngine', '重做操作成功', 'info')
  } else {
    addEventLog('ToolEngine', '重做操作失败', 'error')
  }
}

/**
 * 选择节点
 */
const selectNode = async (nodeId: string) => {
  selectedNodeId.value = nodeId
  await store.selectNodes([nodeId])
  addEventLog('Store', `选中节点: ${nodeId}`, 'info')
}

/**
 * 获取节点样式
 */
const getNodeStyle = (node: NodeData) => {
  const { x, y, w, h } = node.layout
  return {
    left: `${x * 60 + x * 8}px`,
    top: `${y * 40 + y * 8}px`,
    width: `${w * 60 + (w - 1) * 8}px`,
    height: `${h * 40 + (h - 1) * 8}px`
  }
}

/**
 * 格式化时间
 */
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

/**
 * 处理布局事件
 */
const handleLayoutEvent = (event: any) => {
  addEventLog('Layout', `布局事件触发`, 'layout')
}

/**
 * 更新节点属性（从配置区响应到画布）
 */
const updateNodeProperty = async (property: string, value: any) => {
  if (!selectedNodeId.value) return
  
  try {
    const updates: any = {}
    updates[property] = value
    
    await store.updateNode(selectedNodeId.value, updates)
    addEventLog('Inspector', `属性更新: ${property}`, 'success')
  } catch (error) {
    addEventLog('Inspector', `属性更新失败: ${error}`, 'error')
  }
}

/**
 * 重置节点属性
 */
const resetNodeProperties = async () => {
  if (!selectedNodeId.value || !selectedNode.value) return
  
  try {
    await store.updateNode(selectedNodeId.value, {
      name: `重置节点_${Date.now()}`,
      layout: { x: 0, y: 0, w: 2, h: 2 },
      style: { background: { color: '#ffffff' } }
    })
    addEventLog('Inspector', '节点属性已重置', 'info')
  } catch (error) {
    addEventLog('Inspector', `重置失败: ${error}`, 'error')
  }
}

/**
 * 复制节点
 */
const duplicateNode = async () => {
  if (!selectedNode.value) return
  
  try {
    const duplicated = {
      ...selectedNode.value,
      name: `${selectedNode.value.name}_副本`,
      layout: {
        ...selectedNode.value.layout,
        x: selectedNode.value.layout.x + 1,
        y: selectedNode.value.layout.y + 1
      }
    }
    
    await store.addNode(duplicated)
    addEventLog('Inspector', '节点已复制', 'success')
  } catch (error) {
    addEventLog('Inspector', `复制失败: ${error}`, 'error')
  }
}

/**
 * 清空事件日志
 */
const clearEventLog = () => {
  eventLog.value = []
}

// ==================== 拖拽处理方法 ====================

/**
 * 处理组件拖拽开始
 */
const handleComponentDragStart = (component: ComponentDefinition, event: DragEvent) => {
  addEventLog('Drag', `开始拖拽组件: ${component.name}`, 'info')
}

/**
 * 处理组件点击
 */
const handleComponentClick = (component: ComponentDefinition) => {
  addEventLog('Component', `点击组件: ${component.name}`, 'info')
}

/**
 * 处理画布拖拽进入
 */
const handleCanvasDragEnter = (event: DragEvent) => {
  event.preventDefault()
  isDragOverCanvas.value = true
  
  // 清除之前的超时
  if (dragOverTimeout.value) {
    clearTimeout(dragOverTimeout.value)
    dragOverTimeout.value = null
  }
}

/**
 * 处理画布拖拽悬停
 */
const handleCanvasDragOver = (event: DragEvent) => {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'copy'
}

/**
 * 处理画布拖拽离开
 */
const handleCanvasDragLeave = (event: DragEvent) => {
  // 使用超时来避免在元素间快速移动时频繁切换状态
  dragOverTimeout.value = setTimeout(() => {
    isDragOverCanvas.value = false
  }, 100) as any
}

/**
 * 处理画布拖拽放置
 */
const handleCanvasDrop = async (event: DragEvent) => {
  event.preventDefault()
  isDragOverCanvas.value = false
  
  // 清除超时
  if (dragOverTimeout.value) {
    clearTimeout(dragOverTimeout.value)
    dragOverTimeout.value = null
  }

  try {
    // 解析拖拽数据
    const dragDataStr = event.dataTransfer?.getData('application/json')
    if (!dragDataStr) {
      addEventLog('Canvas', '拖拽数据为空', 'error')
      return
    }

    const dragData = JSON.parse(dragDataStr)
    if (dragData.type !== 'component' || !dragData.componentDef) {
      addEventLog('Canvas', '无效的拖拽数据类型', 'error')
      return
    }

    // 计算放置位置
    const dropPosition = calculateDropPosition(event)
    addEventLog('Canvas', `计算放置位置: (${dropPosition.x}, ${dropPosition.y})`, 'info')

    // 从ComponentDefinition创建NodeData
    const nodeData = await createNodeFromComponent(dragData.componentDef, dropPosition)
    
    // 添加到Store
    await store.addNode(nodeData)
    
    addEventLog('Canvas', `成功添加组件: ${dragData.componentDef.name}`, 'success')
    
  } catch (error) {
    console.error('处理拖拽放置失败:', error)
    addEventLog('Canvas', `拖拽放置失败: ${error}`, 'error')
  }
}

/**
 * 计算拖拽放置位置
 */
const calculateDropPosition = (event: DragEvent): { x: number, y: number } => {
  const canvas = event.currentTarget as HTMLElement
  const rect = canvas.getBoundingClientRect()
  
  // 计算相对于画布的位置
  const offsetX = event.clientX - rect.left - 16 // 减去padding
  const offsetY = event.clientY - rect.top - 16
  
  // 转换为网格坐标（68px宽度包含8px间距）
  const gridX = Math.floor(offsetX / 68)
  const gridY = Math.floor(offsetY / 48)
  
  // 确保在合理范围内
  return {
    x: Math.max(0, Math.min(gridX, 10)),
    y: Math.max(0, gridY)
  }
}

/**
 * 从ComponentDefinition创建NodeData
 */
const createNodeFromComponent = async (componentDef: ComponentDefinition, position: { x: number, y: number }): Promise<Partial<NodeData>> => {
  return {
    name: componentDef.name,
    type: componentDef.type,
    layout: {
      ...componentDef.defaults.layout,
      x: position.x,
      y: position.y
    },
    config: {
      ...componentDef.defaults.config,
      content: {
        ...componentDef.defaults.config.content,
        // 添加组件定义引用
        _componentType: componentDef.type
      }
    },
    style: componentDef.defaults.style
  }
}

/**
 * 更新统计信息
 */
const updateStats = () => {
  pipelineStats.value = globalDataPipeline.getStats()
  lifecycleStats.value = globalLifecycleManager.getStats()
  toolEngineStats.value = globalToolEngine.getStats()
}

// 监听Store变化
watch(() => store.panelData.nodes.length, () => {
  updateStats()
})

// 组件挂载时的初始化
onMounted(async () => {
  try {
    addEventLog('System', 'Phase 1B 测试页面开始加载', 'system')
    
    // Step 1: 初始化组件注册引擎（数据准备阶段）
    addEventLog('System', '开始注册组件到NodeRegistryEngine', 'system')
    await globalNodeRegistryEngine.manager.batchRegister(allMockComponents)
    addEventLog('System', `组件注册完成: ${globalNodeRegistryEngine.getStats().totalComponents}个组件`, 'success')
    
    // Step 2: 使用DataEngine准备所有必需数据（数据驱动阶段）
    addEventLog('System', '开始DataEngine数据准备流程', 'system')
    const preparationResult = await globalDataEngine.preparation.prepareAll()
    addEventLog('System', `数据准备完成: ${preparationResult.componentListData.totalComponents}个组件, 面板ID: ${preparationResult.panelData.id}`, 'success')
    
    // Step 3: 初始化事件监听（UI交互阶段）
    addEventLog('System', '注册生命周期和事件监听', 'system')
    
    // 注册生命周期钩子来记录事件
    globalLifecycleManager.registerHook(LifecyclePhase.NODE_ADDED, (context) => {
      addEventLog('Lifecycle', `节点已添加: ${context.targetId}`, 'lifecycle')
    }, { registrar: 'test-page' })

    globalLifecycleManager.registerHook(LifecyclePhase.NODE_UPDATED, (context) => {
      addEventLog('Lifecycle', `节点已更新: ${context.targetId}`, 'lifecycle')
    }, { registrar: 'test-page' })

    globalLifecycleManager.registerHook(LifecyclePhase.NODE_REMOVED, (context) => {
      addEventLog('Lifecycle', `节点已删除: ${context.targetId}`, 'lifecycle')
    }, { registrar: 'test-page' })

    // 注册数据管道事件监听
    globalDataPipeline.on('data-changed', (change) => {
      addEventLog('Pipeline', `数据变更: ${change.type} - ${change.targetId}`, 'pipeline')
    })

    globalDataPipeline.on('batch-start', (event) => {
      addEventLog('Pipeline', `批量操作开始: ${event.batchId}`, 'pipeline')
    })

    globalDataPipeline.on('batch-end', (event) => {
      addEventLog('Pipeline', `批量操作结束: ${event.batchId}, 变更数: ${event.changes.length}`, 'pipeline')
    })

    // 注册全局事件总线监听
    globalEventBus.on('selection-changed', (event) => {
      addEventLog('EventBus', `选择变更: ${event.currentSelection.length} 个节点`, 'event')
    })

    // 注册DataEngine事件监听
    globalDataEngine.events.onPreparationStateChange((state) => {
      addEventLog('DataEngine', `准备状态变更: ${state.phase} (${state.progress}%)`, 'pipeline')
    })

    // 注册ToolEngine事件监听
    globalToolEngine.events.onSave((result) => {
      if (result.success) {
        addEventLog('ToolEngine', `保存完成: ${result.version}`, 'success')
      } else {
        addEventLog('ToolEngine', `保存失败: ${result.error}`, 'error')
      }
      updateStats()
    })

    globalToolEngine.events.onClear((type) => {
      addEventLog('ToolEngine', `清空操作: ${type}`, 'warning')
      updateStats()
    })

    globalToolEngine.events.onHistoryChange((entry, action) => {
      addEventLog('ToolEngine', `历史操作: ${action} - ${entry.description}`, 'info')
      updateStats()
    })

    globalToolEngine.events.onStateChange((state) => {
      addEventLog('ToolEngine', `状态变更: ${state.isDirty ? '脏' : '干净'}`, 'info')
    })

    // Step 4: 完成初始化
    updateStats()
    addEventLog('System', 'Phase 1B 测试页面初始化完成 - 数据驱动架构就绪', 'success')
    
  } catch (error) {
    console.error('测试页面初始化失败:', error)
    addEventLog('System', `初始化失败: ${error}`, 'error')
  }

  // 清理函数（组件卸载时）
  return () => {
    globalLifecycleManager.unregisterAllHooks('test-page')
  }
})
</script>

<style scoped>
.phase1b-test-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f0f2f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.test-header {
  background: #fff;
  padding: 16px 24px;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.test-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #333;
}

.test-header p {
  margin: 0;
  color: #666;
  font-size: 14px;
}

.test-main {
  flex: 1;
  display: flex;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
}

.test-operations {
  width: 280px;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow-y: auto;
}

.test-operations h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #333;
}

.operation-group, .stats-group {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.operation-group h4, .stats-group h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.operation-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn-primary, .btn-secondary, .btn-danger, .btn-small {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.btn-primary {
  background: #1890ff;
  color: white;
}

.btn-primary:hover {
  background: #40a9ff;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e8e8e8;
}

.btn-danger {
  background: #ff4d4f;
  color: white;
}

.btn-danger:hover {
  background: #ff7875;
}

.btn-small {
  padding: 4px 8px;
  background: #f0f0f0;
  color: #666;
  font-size: 11px;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.stats-display, .store-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.stat-label {
  color: #666;
}

.stat-value {
  color: #333;
  font-weight: 500;
}

.test-layout {
  flex: 1;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  overflow: hidden;
}

.test-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 0 16px;
  font-size: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  height: 100%;
  overflow-x: auto;
  overflow-y: hidden;
}

.toolbar-group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.toolbar-divider {
  width: 1px;
  height: 24px;
  background: rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-btn.primary {
  background: rgba(24, 144, 255, 0.8);
  border-color: rgba(24, 144, 255, 0.9);
}

.toolbar-btn.success {
  background: rgba(82, 196, 26, 0.8);
  border-color: rgba(82, 196, 26, 0.9);
}

.toolbar-btn.warning {
  background: rgba(250, 173, 20, 0.8);
  border-color: rgba(250, 173, 20, 0.9);
}

.toolbar-btn.danger {
  background: rgba(255, 77, 79, 0.8);
  border-color: rgba(255, 77, 79, 0.9);
}

.btn-icon {
  font-size: 12px;
  line-height: 1;
}

.btn-text {
  font-size: 11px;
  line-height: 1;
}

.toolbar-status {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.status-item {
  font-size: 11px;
  opacity: 0.9;
  white-space: nowrap;
}

.status-item.dirty {
  color: #faad14;
  font-weight: 500;
}

.toolbar-more {
  position: relative;
  flex-shrink: 0;
}

.more-btn {
  padding: 6px 8px !important;
}

.more-btn.active {
  background: rgba(255, 255, 255, 0.2);
}

.more-tools-panel {
  position: absolute;
  top: 100%;
  right: 0;
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  min-width: 120px;
  padding: 4px 0;
}

.more-tool-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: none;
  background: none;
  color: #333;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.more-tool-item:hover {
  background: #f5f5f5;
}

.tool-icon {
  font-size: 14px;
}

.tool-text {
  font-size: 12px;
}

.test-sidebar {
  padding: 16px;
  height: 100%;
  background: #fafafa;
  border-right: 1px solid #e8e8e8;
}

.test-sidebar h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.node-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.node-item {
  padding: 12px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.node-item:hover {
  border-color: #1890ff;
}

.node-item.selected {
  border-color: #1890ff;
  background: #e6f7ff;
}

.node-info .node-name {
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.node-info .node-type {
  font-size: 11px;
  color: #666;
  margin-top: 2px;
}

.test-canvas {
  padding: 16px;
  height: 100%;
  background: #f5f5f5;
  position: relative;
  overflow-x: hidden;
  overflow-y: auto;
}

/* 拖拽提示层 */
.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(24, 144, 255, 0.1);
  border: 2px dashed #1890ff;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  pointer-events: none;
}

.drag-hint {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.drag-icon {
  font-size: 32px;
  line-height: 1;
}

.drag-text {
  font-size: 14px;
  color: #1890ff;
  font-weight: 500;
}

.canvas-grid {
  position: relative;
  width: 100%;
  background-image: 
    linear-gradient(to right, #e8e8e8 1px, transparent 1px),
    linear-gradient(to bottom, #e8e8e8 1px, transparent 1px);
  background-size: 68px 48px;
}

.canvas-node {
  position: absolute;
  background: #fff;
  border: 2px solid #e8e8e8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  overflow: hidden;
}

.canvas-node:hover {
  border-color: #1890ff;
  box-shadow: 0 4px 8px rgba(24, 144, 255, 0.2);
}

.canvas-node.selected {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.node-header {
  padding: 8px 12px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.node-title {
  font-size: 12px;
  font-weight: 500;
  color: #333;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-type-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: #f0f0f0;
  color: #666;
  border-radius: 10px;
  white-space: nowrap;
  margin-left: 8px;
}

.node-content {
  padding: 8px 12px;
}

.node-meta {
  font-size: 10px;
  color: #666;
  line-height: 1.4;
}

.test-inspector {
  padding: 16px;
  height: 100%;
  background: #fafafa;
  border-left: 1px solid #e8e8e8;
  overflow-y: auto;
}

.test-inspector h4, .test-inspector h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #333;
}

.property-editor {
  margin-bottom: 24px;
}

.property-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.property-section h5 {
  font-size: 13px;
  color: #666;
  font-weight: 500;
  margin-bottom: 12px;
}

.property-item {
  margin-bottom: 12px;
}

.property-item label {
  display: block;
  font-size: 12px;
  color: #333;
  margin-bottom: 4px;
  font-weight: 500;
}

.property-input, .property-select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #e8e8e8;
  border-radius: 3px;
  font-size: 12px;
  background: white;
}

.property-input.small {
  width: 60px;
}

.property-color {
  width: 40px;
  height: 28px;
  padding: 2px;
  border: 1px solid #e8e8e8;
  border-radius: 3px;
  cursor: pointer;
}

.property-range {
  width: calc(100% - 40px);
  margin-right: 8px;
}

.range-value {
  font-size: 11px;
  color: #666;
  min-width: 30px;
  text-align: right;
}

.property-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.property-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.property-actions .btn-small {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid #e8e8e8;
  background: #f5f5f5;
  color: #666;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
}

.property-actions .btn-small.primary {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
}

.property-actions .btn-small.secondary {
  background: #f0f0f0;
  border-color: #d9d9d9;
  color: #666;
}

.no-selection {
  text-align: center;
  padding: 40px 16px;
  color: #999;
}

.no-selection-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.no-selection-text {
  font-size: 14px;
  margin-bottom: 4px;
  color: #666;
}

.no-selection-hint {
  font-size: 12px;
  color: #999;
}

.stats-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.test-events {
  width: 300px;
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
}

.test-events h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #333;
}

.event-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.event-controls label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #666;
}

.event-log {
  flex: 1;
  overflow-y: auto;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  line-height: 1.4;
}

.event-item {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #f5f5f5;
}

.event-time {
  color: #999;
  min-width: 50px;
}

.event-source {
  color: #666;
  min-width: 60px;
  font-weight: 500;
}

.event-message {
  color: #333;
  flex: 1;
}

.event-success .event-source { color: #52c41a; }
.event-error .event-source { color: #ff4d4f; }
.event-warning .event-source { color: #faad14; }
.event-lifecycle .event-source { color: #722ed1; }
.event-pipeline .event-source { color: #1890ff; }
.event-event .event-source { color: #13c2c2; }
.event-layout .event-source { color: #eb2f96; }
.event-system .event-source { color: #595959; }
</style>