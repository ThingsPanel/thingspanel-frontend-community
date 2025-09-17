/**
 * Canvas编辑器集成使用示例
 *
 * 展示如何使用完整的Canvas引擎系统，包括：
 * 1. Canvas引擎初始化
 * 2. Config Engine集成
 * 3. 节点创建和操作
 * 4. 事件监听和状态同步
 * 5. 协作功能使用
 *
 * 这个示例演示了基于你实现的Config Engine基础上的Canvas编辑器完整用法。
 *
 * @author Claude
 * @version 1.0.0
 */

import { CanvasEngine, createCanvasEngine } from '../core/canvas-engine'
import { EnhancedConfigurationStateManager } from '../core/config-engine/enhanced-config-state-manager'
import { CanvasEventType } from '../core/canvas-engine/canvas-event-state-manager'
import type {
  CanvasEngineConfig,
  EditorNodeConfiguration,
  WidgetConfiguration,
  CanvasEngineResult
} from '../core/canvas-engine'

/**
 * Canvas编辑器集成示例类
 */
export class CanvasEditorIntegrationExample {
  private canvasEngine: CanvasEngine | null = null
  private configManager: EnhancedConfigurationStateManager | null = null
  private canvasId = 'demo-canvas'
  private containerId = 'canvas-container'

  /**
   * 初始化完整的Canvas编辑器系统
   */
  public async initializeCanvasEditor(): Promise<void> {
    console.log('🚀 开始初始化Canvas编辑器系统...')

    try {
      // 1. 首先初始化Config Engine
      await this.initializeConfigEngine()

      // 2. 然后初始化Canvas Engine
      await this.initializeCanvasEngine()

      // 3. 设置事件监听
      this.setupEventListeners()

      // 4. 创建示例节点
      await this.createExampleNodes()

      console.log('✅ Canvas编辑器系统初始化完成!')
    } catch (error) {
      console.error('❌ Canvas编辑器初始化失败:', error)
    }
  }

  /**
   * 初始化Config Engine
   */
  private async initializeConfigEngine(): Promise<void> {
    console.log('📊 初始化Config Engine...')

    // 创建Config Engine实例
    this.configManager = new EnhancedConfigurationStateManager({
      enableVersionControl: true,
      enableValidation: true,
      enableEventSystem: true,
      enablePersistence: true,
      enableAnalytics: true,
      maxHistorySize: 100
    })

    // 初始化Config Engine
    await this.configManager.initialize()

    console.log('✅ Config Engine初始化完成')
  }

  /**
   * 初始化Canvas Engine
   */
  private async initializeCanvasEngine(): Promise<void> {
    console.log('🎨 初始化Canvas Engine...')

    // Canvas引擎配置
    const canvasConfig: CanvasEngineConfig = {
      canvasConfig: {
        width: 1200,
        height: 800,
        backgroundColor: '#f8f9fa',
        enableGrid: true,
        gridSize: 20,
        enableSnapping: true,
        snapThreshold: 10,
        enableZoom: true,
        minZoom: 0.1,
        maxZoom: 10,
        enablePan: true,
        enableSelection: true,
        enableMultiSelection: true
      },
      interactionConfig: {
        enableKeyboardShortcuts: true,
        enableContextMenu: true,
        enableDragAndDrop: true,
        enableResize: true,
        enableRotation: true,
        doubleClickTimeout: 300,
        dragThreshold: 5
      },
      configSyncOptions: {
        realTimeSync: true,
        syncDelay: 200,
        enableValidation: true,
        enableBatchUpdate: true,
        batchInterval: 100,
        enableUndoRedo: true,
        maxUndoSteps: 50
      },
      stateSyncOptions: {
        enableRealTimeSync: true,
        syncInterval: 1000,
        enableConflictDetection: true,
        enablePersistence: true,
        persistencePrefix: 'canvas-demo',
        enableCollaboration: false, // 示例中暂不启用协作
        maxStateHistory: 30,
        enablePerformanceMonitoring: true
      },
      enableAutoIntegration: true,
      performanceOptions: {
        enableVirtualization: true,
        maxRenderObjects: 500,
        renderThrottleMs: 16
      }
    }

    // 创建Canvas引擎实例
    this.canvasEngine = createCanvasEngine(this.canvasId, this.containerId, canvasConfig)

    // 初始化Canvas引擎（传入Config Manager实现集成）
    const result = await this.canvasEngine.initialize(this.configManager!)

    if (!result.success) {
      throw new Error(`Canvas引擎初始化失败: ${result.error}`)
    }

    console.log('✅ Canvas Engine初始化完成')
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.canvasEngine || !this.configManager) return

    console.log('👂 设置事件监听器...')

    // Canvas引擎事件监听
    this.canvasEngine.on('initialized', (data) => {
      console.log('Canvas引擎已初始化:', data)
    })

    this.canvasEngine.on('node:sync:completed', (event) => {
      console.log('节点同步完成:', event)
    })

    this.canvasEngine.on('state:sync:completed', (data) => {
      console.log('状态同步完成:', data)
    })

    this.canvasEngine.on('sync:error', (error) => {
      console.warn('同步错误:', error)
    })

    this.canvasEngine.on('state:conflict:detected', (data) => {
      console.warn('检测到状态冲突:', data)
    })

    this.canvasEngine.on('performance:metrics:updated', (data) => {
      const metrics = data.metadata?.metrics
      if (metrics) {
        console.log('性能指标更新:', {
          渲染时间: `${metrics.renderTime.toFixed(2)}ms`,
          事件处理时间: `${metrics.eventProcessingTime.toFixed(2)}ms`,
          同步时间: `${metrics.syncTime.toFixed(2)}ms`,
          节点数量: metrics.nodeCount,
          事件队列大小: metrics.eventQueueSize
        })
      }
    })

    // Config Engine事件监听
    this.configManager.on('configuration:updated', (data) => {
      console.log('配置更新:', data)
    })

    this.configManager.on('validation:failed', (data) => {
      console.warn('配置验证失败:', data)
    })

    this.configManager.on('version:created', (data) => {
      console.log('新版本创建:', data)
    })

    console.log('✅ 事件监听器设置完成')
  }

  /**
   * 创建示例节点
   */
  private async createExampleNodes(): Promise<void> {
    if (!this.canvasEngine) return

    console.log('🎯 创建示例节点...')

    try {
      // 创建图表节点
      const chartNodeConfig: EditorNodeConfiguration = {
        id: 'chart-node-1',
        type: 'line-chart',
        canvasId: this.canvasId,
        position: { x: 100, y: 100 },
        size: { width: 300, height: 200 },
        configuration: {
          type: 'line-chart',
          title: '温度趋势图',
          dataSource: {
            type: 'api',
            url: '/api/temperature-data',
            refreshInterval: 5000
          },
          chartOptions: {
            xAxis: { type: 'time' },
            yAxis: { type: 'value', unit: '°C' },
            series: [{
              name: '温度',
              type: 'line',
              color: '#3b82f6',
              smooth: true
            }]
          },
          style: {
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            borderRadius: 8,
            padding: 16
          },
          layout: {
            position: { x: 100, y: 100 },
            size: { width: 300, height: 200 },
            zIndex: 1,
            visible: true,
            locked: false
          }
        }
      }

      const chartResult = await this.canvasEngine.createNode(chartNodeConfig)
      if (chartResult.success) {
        console.log('✅ 图表节点创建成功:', chartResult.data?.id)
      } else {
        console.error('❌ 图表节点创建失败:', chartResult.error)
      }

      // 创建数字指示器节点
      const indicatorNodeConfig: EditorNodeConfiguration = {
        id: 'indicator-node-1',
        type: 'digital-indicator',
        canvasId: this.canvasId,
        position: { x: 450, y: 100 },
        size: { width: 150, height: 80 },
        configuration: {
          type: 'digital-indicator',
          title: '当前温度',
          dataSource: {
            type: 'websocket',
            url: 'ws://localhost:8080/temperature',
            field: 'current_temperature'
          },
          displayOptions: {
            fontSize: 24,
            fontWeight: 'bold',
            color: '#1f2937',
            unit: '°C',
            precision: 1
          },
          thresholds: [
            { min: -Infinity, max: 0, color: '#3b82f6', label: '低温' },
            { min: 0, max: 25, color: '#10b981', label: '正常' },
            { min: 25, max: 35, color: '#f59e0b', label: '偏高' },
            { min: 35, max: Infinity, color: '#ef4444', label: '高温' }
          ],
          style: {
            backgroundColor: '#f3f4f6',
            borderColor: '#d1d5db',
            borderWidth: 1,
            borderRadius: 6,
            padding: 12
          },
          layout: {
            position: { x: 450, y: 100 },
            size: { width: 150, height: 80 },
            zIndex: 1,
            visible: true,
            locked: false
          }
        }
      }

      const indicatorResult = await this.canvasEngine.createNode(indicatorNodeConfig)
      if (indicatorResult.success) {
        console.log('✅ 数字指示器节点创建成功:', indicatorResult.data?.id)
      } else {
        console.error('❌ 数字指示器节点创建失败:', indicatorResult.error)
      }

      // 创建开关控制节点
      const switchNodeConfig: EditorNodeConfiguration = {
        id: 'switch-node-1',
        type: 'switch-control',
        canvasId: this.canvasId,
        position: { x: 650, y: 100 },
        size: { width: 120, height: 60 },
        configuration: {
          type: 'switch-control',
          title: '风扇开关',
          dataSource: {
            type: 'device-control',
            deviceId: 'fan-001',
            property: 'power_status'
          },
          controlOptions: {
            labels: { on: '开启', off: '关闭' },
            colors: { on: '#10b981', off: '#6b7280' },
            size: 'medium',
            disabled: false
          },
          style: {
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            borderRadius: 6,
            padding: 8
          },
          layout: {
            position: { x: 650, y: 100 },
            size: { width: 120, height: 60 },
            zIndex: 1,
            visible: true,
            locked: false
          }
        }
      }

      const switchResult = await this.canvasEngine.createNode(switchNodeConfig)
      if (switchResult.success) {
        console.log('✅ 开关控制节点创建成功:', switchResult.data?.id)
      } else {
        console.error('❌ 开关控制节点创建失败:', switchResult.error)
      }

      console.log('✅ 示例节点创建完成')
    } catch (error) {
      console.error('❌ 创建示例节点失败:', error)
    }
  }

  /**
   * 演示基本操作
   */
  public async demonstrateBasicOperations(): Promise<void> {
    if (!this.canvasEngine) {
      console.error('Canvas引擎未初始化')
      return
    }

    console.log('🎮 开始演示基本操作...')

    try {
      // 1. 选择节点
      console.log('1. 选择图表节点...')
      const selectResult = this.canvasEngine.selectNode('chart-node-1')
      console.log('选择结果:', selectResult.success ? '成功' : selectResult.error)

      await this.sleep(1000)

      // 2. 更新节点配置
      console.log('2. 更新节点配置...')
      const updateConfig: Partial<WidgetConfiguration> = {
        title: '温度趋势图 (已更新)',
        style: {
          backgroundColor: '#fef3c7',
          borderColor: '#f59e0b',
          borderWidth: 2
        }
      }

      const updateResult = await this.canvasEngine.updateNodeConfiguration('chart-node-1', updateConfig)
      console.log('更新结果:', updateResult.success ? '成功' : updateResult.error)

      await this.sleep(1000)

      // 3. 设置缩放
      console.log('3. 设置缩放到1.5倍...')
      const zoomResult = this.canvasEngine.setZoom(1.5, { x: 400, y: 300 })
      console.log('缩放结果:', zoomResult.success ? '成功' : zoomResult.error)

      await this.sleep(1000)

      // 4. 多选节点
      console.log('4. 多选节点...')
      const multiSelectResult = this.canvasEngine.selectNodes(['chart-node-1', 'indicator-node-1'])
      console.log('多选结果:', multiSelectResult.success ? '成功' : multiSelectResult.error)

      await this.sleep(1000)

      // 5. 对齐节点
      console.log('5. 对齐选中节点...')
      const alignResult = this.canvasEngine.alignSelectedNodes('top')
      console.log('对齐结果:', alignResult.success ? '成功' : alignResult.error)

      await this.sleep(1000)

      // 6. 适应内容
      console.log('6. 适应Canvas内容...')
      const fitResult = this.canvasEngine.fitToContent()
      console.log('适应结果:', fitResult.success ? '成功' : fitResult.error)

      await this.sleep(1000)

      // 7. 创建状态快照
      console.log('7. 创建状态快照...')
      const snapshotResult = this.canvasEngine.createSnapshot()
      if (snapshotResult.success && snapshotResult.data) {
        console.log('快照创建成功:', {
          id: snapshotResult.data.id,
          版本: snapshotResult.data.version,
          节点数量: snapshotResult.data.nodes.size,
          时间戳: new Date(snapshotResult.data.timestamp).toLocaleString()
        })
      } else {
        console.log('快照创建失败:', snapshotResult.error)
      }

      console.log('✅ 基本操作演示完成!')
    } catch (error) {
      console.error('❌ 操作演示失败:', error)
    }
  }

  /**
   * 演示Config Engine集成功能
   */
  public async demonstrateConfigEngineIntegration(): Promise<void> {
    if (!this.configManager || !this.canvasEngine) {
      console.error('必要组件未初始化')
      return
    }

    console.log('🔗 开始演示Config Engine集成功能...')

    try {
      // 1. 通过Config Engine创建配置
      console.log('1. 通过Config Engine创建新节点配置...')
      const newNodeConfig: WidgetConfiguration = {
        type: 'gauge-chart',
        title: '湿度计',
        dataSource: {
          type: 'api',
          url: '/api/humidity-data',
          refreshInterval: 3000
        },
        chartOptions: {
          min: 0,
          max: 100,
          unit: '%',
          thresholds: [
            { min: 0, max: 30, color: '#ef4444', label: '干燥' },
            { min: 30, max: 70, color: '#10b981', label: '适宜' },
            { min: 70, max: 100, color: '#3b82f6', label: '潮湿' }
          ]
        },
        style: {
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb',
          borderWidth: 1,
          borderRadius: 8
        },
        layout: {
          position: { x: 100, y: 350 },
          size: { width: 200, height: 200 },
          zIndex: 1,
          visible: true,
          locked: false
        }
      }

      // 通过Config Engine设置配置（这会自动同步到Canvas）
      const configResult = await this.configManager.setConfiguration('gauge-node-1', newNodeConfig, {
        description: '创建湿度计组件',
        author: '示例用户',
        source: 'canvas-integration-demo'
      })

      console.log('配置设置结果:', configResult ? '成功' : '失败')

      await this.sleep(2000)

      // 2. 通过Config Engine更新配置
      console.log('2. 通过Config Engine更新现有配置...')
      const existingConfig = await this.configManager.getConfiguration('chart-node-1')
      if (existingConfig) {
        const updatedConfig = {
          ...existingConfig,
          title: '温度趋势图 (Config Engine更新)',
          chartOptions: {
            ...existingConfig.chartOptions,
            animation: true,
            tooltip: { enabled: true }
          }
        }

        const updateConfigResult = await this.configManager.setConfiguration('chart-node-1', updatedConfig, {
          description: '通过Config Engine更新图表配置',
          author: '示例用户',
          source: 'config-engine-direct'
        })

        console.log('配置更新结果:', updateConfigResult ? '成功' : '失败')
      }

      await this.sleep(2000)

      // 3. 创建配置版本
      console.log('3. 创建配置版本...')
      const versionResult = await this.configManager.createVersion('保存Canvas编辑状态', '示例用户')
      if (versionResult) {
        console.log('版本创建成功:', versionResult)
      }

      await this.sleep(1000)

      // 4. 导出配置
      console.log('4. 导出所有配置...')
      const exportResult = await this.configManager.exportConfigurations(['chart-node-1', 'indicator-node-1', 'gauge-node-1'], {
        format: 'json',
        includeMetadata: true,
        includeVersionHistory: false
      })

      if (exportResult.success) {
        console.log('配置导出成功, 数据长度:', exportResult.data?.length || 0)
        console.log('导出的配置预览:', JSON.parse(exportResult.data || '{}').configurations)
      }

      // 5. 强制同步演示
      console.log('5. 强制从Config Engine同步到Canvas...')
      const syncResult = await this.canvasEngine.forceSyncFromConfig()
      console.log('强制同步结果:', syncResult.success ? '成功' : syncResult.error)

      console.log('✅ Config Engine集成演示完成!')
    } catch (error) {
      console.error('❌ Config Engine集成演示失败:', error)
    }
  }

  /**
   * 演示撤销重做功能
   */
  public async demonstrateUndoRedo(): Promise<void> {
    if (!this.canvasEngine) {
      console.error('Canvas引擎未初始化')
      return
    }

    console.log('↩️ 开始演示撤销重做功能...')

    try {
      // 执行一些操作
      console.log('1. 执行一些操作作为撤销基础...')

      await this.canvasEngine.updateNodeConfiguration('chart-node-1', {
        title: '操作步骤1 - 更新标题'
      })
      await this.sleep(500)

      await this.canvasEngine.setZoom(0.8)
      await this.sleep(500)

      await this.canvasEngine.selectNode('indicator-node-1')
      await this.sleep(500)

      // 撤销操作
      console.log('2. 执行撤销操作...')
      const undoResult1 = await this.canvasEngine.undo()
      console.log('第1次撤销结果:', undoResult1.success ? '成功' : undoResult1.error)
      await this.sleep(1000)

      const undoResult2 = await this.canvasEngine.undo()
      console.log('第2次撤销结果:', undoResult2.success ? '成功' : undoResult2.error)
      await this.sleep(1000)

      // 重做操作
      console.log('3. 执行重做操作...')
      const redoResult1 = await this.canvasEngine.redo()
      console.log('第1次重做结果:', redoResult1.success ? '成功' : redoResult1.error)
      await this.sleep(1000)

      console.log('✅ 撤销重做演示完成!')
    } catch (error) {
      console.error('❌ 撤销重做演示失败:', error)
    }
  }

  /**
   * 获取系统状态信息
   */
  public getSystemStatus(): void {
    if (!this.canvasEngine || !this.configManager) {
      console.error('系统组件未完全初始化')
      return
    }

    console.log('📊 系统状态信息:')

    // Canvas引擎状态
    const canvasState = this.canvasEngine.getState()
    console.log('Canvas引擎状态:', {
      初始化状态: canvasState.isInitialized ? '已初始化' : '未初始化',
      Canvas ID: canvasState.canvasId,
      节点数量: canvasState.nodeCount,
      选中节点: canvasState.selectedNodeIds,
      当前模式: canvasState.currentMode,
      缩放级别: canvasState.zoom,
      平移位置: canvasState.pan,
      协作用户数: canvasState.collaborationUsers.length,
      待处理冲突: canvasState.pendingConflicts.length
    })

    console.log('性能指标:', {
      渲染时间: `${canvasState.performanceMetrics.renderTime.toFixed(2)}ms`,
      事件处理时间: `${canvasState.performanceMetrics.eventProcessingTime.toFixed(2)}ms`,
      同步时间: `${canvasState.performanceMetrics.syncTime.toFixed(2)}ms`,
      事件队列大小: canvasState.performanceMetrics.eventQueueSize
    })

    // Config Engine状态
    const configStats = this.configManager.getEngineStats()
    console.log('Config Engine统计:', {
      总配置数: configStats.totalConfigurations,
      历史版本数: configStats.totalVersions,
      缓存大小: configStats.cacheSize,
      验证通过率: `${(configStats.validationSuccessRate * 100).toFixed(1)}%`,
      API调用统计: configStats.apiCallStats
    })
  }

  /**
   * 清理资源
   */
  public async cleanup(): Promise<void> {
    console.log('🧹 开始清理资源...')

    if (this.canvasEngine) {
      this.canvasEngine.destroy()
      this.canvasEngine = null
      console.log('✅ Canvas引擎已清理')
    }

    if (this.configManager) {
      await this.configManager.shutdown()
      this.configManager = null
      console.log('✅ Config Engine已清理')
    }

    console.log('✅ 资源清理完成')
  }

  /**
   * 工具方法：延时
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * 运行完整的Canvas编辑器集成示例
 */
export async function runCanvasEditorIntegrationExample(): Promise<void> {
  console.log('🎪 Canvas编辑器集成完整示例开始...')
  console.log('='.repeat(60))

  const example = new CanvasEditorIntegrationExample()

  try {
    // 1. 初始化系统
    await example.initializeCanvasEditor()

    console.log('\n' + '⏱️  等待3秒让系统稳定...'.padEnd(60, ' '))
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 2. 演示基本操作
    console.log('\n' + '='.repeat(60))
    await example.demonstrateBasicOperations()

    console.log('\n' + '⏱️  等待2秒...'.padEnd(60, ' '))
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 3. 演示Config Engine集成
    console.log('\n' + '='.repeat(60))
    await example.demonstrateConfigEngineIntegration()

    console.log('\n' + '⏱️  等待2秒...'.padEnd(60, ' '))
    await new Promise(resolve => setTimeout(resolve, 2000))

    // 4. 演示撤销重做
    console.log('\n' + '='.repeat(60))
    await example.demonstrateUndoRedo()

    // 5. 显示系统状态
    console.log('\n' + '='.repeat(60))
    example.getSystemStatus()

    // 6. 清理资源
    console.log('\n' + '='.repeat(60))
    await example.cleanup()

    console.log('\n' + '🎉 Canvas编辑器集成示例运行完成!')
    console.log('='.repeat(60))
  } catch (error) {
    console.error('❌ 示例运行失败:', error)
    await example.cleanup()
  }
}

export default CanvasEditorIntegrationExample