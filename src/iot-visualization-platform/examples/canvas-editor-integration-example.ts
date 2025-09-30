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

    try {
      // 1. 首先初始化Config Engine
      await this.initializeConfigEngine()

      // 2. 然后初始化Canvas Engine
      await this.initializeCanvasEngine()

      // 3. 设置事件监听
      this.setupEventListeners()

      // 4. 创建示例节点
      await this.createExampleNodes()

    } catch (error) {
      console.error('❌ Canvas编辑器初始化失败:', error)
    }
  }

  /**
   * 初始化Config Engine
   */
  private async initializeConfigEngine(): Promise<void> {

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

  }

  /**
   * 初始化Canvas Engine
   */
  private async initializeCanvasEngine(): Promise<void> {

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

  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.canvasEngine || !this.configManager) return


    // Canvas引擎事件监听
    this.canvasEngine.on('initialized', (data) => {
    })

    this.canvasEngine.on('node:sync:completed', (event) => {
    })

    this.canvasEngine.on('state:sync:completed', (data) => {
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
      }
    })

    // Config Engine事件监听
    this.configManager.on('configuration:updated', (data) => {
    })

    this.configManager.on('validation:failed', (data) => {
      console.warn('配置验证失败:', data)
    })

    this.configManager.on('version:created', (data) => {
    })

  }

  /**
   * 创建示例节点
   */
  private async createExampleNodes(): Promise<void> {
    if (!this.canvasEngine) return


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
      } else {
        console.error('❌ 开关控制节点创建失败:', switchResult.error)
      }

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


    try {
      // 1. 选择节点
      const selectResult = this.canvasEngine.selectNode('chart-node-1')

      await this.sleep(1000)

      // 2. 更新节点配置
      const updateConfig: Partial<WidgetConfiguration> = {
        title: '温度趋势图 (已更新)',
        style: {
          backgroundColor: '#fef3c7',
          borderColor: '#f59e0b',
          borderWidth: 2
        }
      }

      const updateResult = await this.canvasEngine.updateNodeConfiguration('chart-node-1', updateConfig)

      await this.sleep(1000)

      // 3. 设置缩放
      const zoomResult = this.canvasEngine.setZoom(1.5, { x: 400, y: 300 })

      await this.sleep(1000)

      // 4. 多选节点
      const multiSelectResult = this.canvasEngine.selectNodes(['chart-node-1', 'indicator-node-1'])

      await this.sleep(1000)

      // 5. 对齐节点
      const alignResult = this.canvasEngine.alignSelectedNodes('top')

      await this.sleep(1000)

      // 6. 适应内容
      const fitResult = this.canvasEngine.fitToContent()

      await this.sleep(1000)

      // 7. 创建状态快照
      const snapshotResult = this.canvasEngine.createSnapshot()
      if (snapshotResult.success && snapshotResult.data) {
      } else {
      }

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


    try {
      // 1. 通过Config Engine创建配置
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


      await this.sleep(2000)

      // 2. 通过Config Engine更新配置
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

      }

      await this.sleep(2000)

      // 3. 创建配置版本
      const versionResult = await this.configManager.createVersion('保存Canvas编辑状态', '示例用户')
      if (versionResult) {
      }

      await this.sleep(1000)

      // 4. 导出配置
      const exportResult = await this.configManager.exportConfigurations(['chart-node-1', 'indicator-node-1', 'gauge-node-1'], {
        format: 'json',
        includeMetadata: true,
        includeVersionHistory: false
      })

      if (exportResult.success) {
      }

      // 5. 强制同步演示
      const syncResult = await this.canvasEngine.forceSyncFromConfig()

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


    try {
      // 执行一些操作

      await this.canvasEngine.updateNodeConfiguration('chart-node-1', {
        title: '操作步骤1 - 更新标题'
      })
      await this.sleep(500)

      await this.canvasEngine.setZoom(0.8)
      await this.sleep(500)

      await this.canvasEngine.selectNode('indicator-node-1')
      await this.sleep(500)

      // 撤销操作
      const undoResult1 = await this.canvasEngine.undo()
      await this.sleep(1000)

      const undoResult2 = await this.canvasEngine.undo()
      await this.sleep(1000)

      // 重做操作
      const redoResult1 = await this.canvasEngine.redo()
      await this.sleep(1000)

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


    // Canvas引擎状态
    const canvasState = this.canvasEngine.getState()


    // Config Engine状态
    const configStats = this.configManager.getEngineStats()
  }

  /**
   * 清理资源
   */
  public async cleanup(): Promise<void> {

    if (this.canvasEngine) {
      this.canvasEngine.destroy()
      this.canvasEngine = null
    }

    if (this.configManager) {
      await this.configManager.shutdown()
      this.configManager = null
    }

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

  const example = new CanvasEditorIntegrationExample()

  try {
    // 1. 初始化系统
    await example.initializeCanvasEditor()

    await new Promise(resolve => setTimeout(resolve, 3000))

    // 2. 演示基本操作
    await example.demonstrateBasicOperations()

    await new Promise(resolve => setTimeout(resolve, 2000))

    // 3. 演示Config Engine集成
    await example.demonstrateConfigEngineIntegration()

    await new Promise(resolve => setTimeout(resolve, 2000))

    // 4. 演示撤销重做
    await example.demonstrateUndoRedo()

    // 5. 显示系统状态
    example.getSystemStatus()

    // 6. 清理资源
    await example.cleanup()

  } catch (error) {
    console.error('❌ 示例运行失败:', error)
    await example.cleanup()
  }
}

export default CanvasEditorIntegrationExample