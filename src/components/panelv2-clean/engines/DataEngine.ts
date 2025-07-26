/**
 * @file DataEngine 数据引擎实现
 * @description 负责数据准备、管理和同步的具体实现
 * 遵循数据驱动哲学：渲染前数据先行准备
 */

import { reactive, ref } from 'vue'
import { nanoid } from 'nanoid'
import { globalNodeRegistryEngine } from './NodeRegistryEngine'
import type {
  DataEngine as IDataEngine,
  PanelDataPreparationState,
  ComponentListData,
  PanelDataInitial,
  DataPreparationResult
} from './interfaces/DataEngine'
import type { ComponentCategoryTab } from '../renderers/interfaces/ComponentListRenderer'

/**
 * 数据引擎实现类
 */
export class DataEngine implements IDataEngine {
  /** 准备状态 */
  private preparationState = ref<PanelDataPreparationState>({
    ready: false,
    phase: 'initializing',
    progress: 0,
    startTime: Date.now()
  })

  /** 组件列表数据 */
  private componentListData = ref<ComponentListData | null>(null)

  /** 面板数据 */
  private panelData = ref<PanelDataInitial | null>(null)

  /** 事件监听器 */
  private eventListeners = new Map<string, Set<(...args: any[]) => void>>()

  /** 自动同步状态 */
  private autoSyncEnabled = false

  constructor() {
    console.log('DataEngine: 数据引擎已初始化')
  }

  // ==================== 数据准备器 ====================

  /** 数据准备器 */
  preparation = {
    /**
     * 准备所有必需数据
     */
    prepareAll: async (): Promise<DataPreparationResult> => {
      console.log('DataEngine: 开始准备所有数据')

      // 初始化准备状态
      this.preparationState.value = {
        ready: false,
        phase: 'initializing',
        progress: 0,
        startTime: Date.now()
      }
      this.emitEvent('preparation-state-change', this.preparationState.value)

      try {
        // 阶段1: 准备组件列表数据
        this.preparationState.value.phase = 'loading-components'
        this.preparationState.value.progress = 20
        this.emitEvent('preparation-state-change', this.preparationState.value)

        const componentListData = await this.preparation.prepareComponentListData()

        // 阶段2: 准备面板数据
        this.preparationState.value.phase = 'preparing-panel'
        this.preparationState.value.progress = 60
        this.emitEvent('preparation-state-change', this.preparationState.value)

        const panelData = await this.preparation.preparePanelData()

        // 完成准备
        this.preparationState.value.phase = 'ready'
        this.preparationState.value.progress = 100
        this.preparationState.value.ready = true
        this.preparationState.value.endTime = Date.now()
        this.emitEvent('preparation-state-change', this.preparationState.value)

        const result: DataPreparationResult = {
          componentListData,
          panelData,
          state: this.preparationState.value
        }

        console.log('DataEngine: 数据准备完成', result)
        return result
      } catch (error) {
        console.error('DataEngine: 数据准备失败', error)

        this.preparationState.value.phase = 'error'
        this.preparationState.value.error = error instanceof Error ? error.message : '未知错误'
        this.emitEvent('preparation-state-change', this.preparationState.value)

        throw error
      }
    },

    /**
     * 准备组件列表数据
     */
    prepareComponentListData: async (): Promise<ComponentListData> => {
      console.log('DataEngine: 准备组件列表数据')

      // 获取所有注册的组件
      const allComponents = globalNodeRegistryEngine.manager.getAllComponents()

      // 按分类分组组件
      const categoryMap = new Map<string, typeof allComponents>()

      allComponents.forEach(component => {
        const categoryId = component.category || 'basic'
        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, [])
        }
        categoryMap.get(categoryId)!.push(component)
      })

      // 创建分类Tab数据
      const categoryTabs: ComponentCategoryTab[] = []
      const categoryDefinitions = [
        { id: 'basic', name: '基础', icon: '🧩', order: 1 },
        { id: 'chart', name: '图表', icon: '📊', order: 2 },
        { id: 'form', name: '表单', icon: '📝', order: 3 },
        { id: 'layout', name: '布局', icon: '📐', order: 4 },
        { id: 'advanced', name: '高级', icon: '⚡', order: 5 },
        { id: 'custom', name: '自定义', icon: '🎨', order: 6 }
      ]

      categoryDefinitions.forEach(categoryDef => {
        const components = categoryMap.get(categoryDef.id) || []
        if (components.length > 0) {
          categoryTabs.push({
            id: categoryDef.id,
            name: categoryDef.name,
            icon: categoryDef.icon,
            components: components.sort((a, b) => a.name.localeCompare(b.name)),
            order: categoryDef.order
          })
        }
      })

      const componentListData: ComponentListData = {
        categoryTabs: categoryTabs.sort((a, b) => a.order - b.order),
        defaultActiveCategory: categoryTabs.length > 0 ? categoryTabs[0].id : 'basic',
        totalComponents: allComponents.length,
        version: this.generateDataVersion(),
        lastUpdated: Date.now()
      }

      // 保存到内部状态
      this.componentListData.value = componentListData
      this.emitEvent('component-list-data-change', componentListData)

      console.log('DataEngine: 组件列表数据准备完成', componentListData)
      return componentListData
    },

    /**
     * 准备面板数据
     */
    preparePanelData: async (): Promise<PanelDataInitial> => {
      console.log('DataEngine: 准备面板数据')

      const panelData: PanelDataInitial = {
        id: nanoid(),
        name: '新建面板',
        description: 'PanelV2-Clean 空白面板',
        nodes: [], // 初始为空
        config: {
          canvas: {
            width: 1200,
            height: 800,
            background: '#f5f5f5',
            grid: true
          },
          renderer: {
            type: 'gridstack',
            config: {
              columns: 12,
              cellHeight: 60,
              margin: 8,
              animate: true,
              float: false
            }
          }
        },
        version: this.generateDataVersion(),
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      // 保存到内部状态
      this.panelData.value = panelData
      this.emitEvent('panel-data-change', panelData)

      console.log('DataEngine: 面板数据准备完成', panelData)
      return panelData
    },

    /**
     * 获取准备状态
     */
    getPreparationState: (): PanelDataPreparationState => {
      return this.preparationState.value
    },

    /**
     * 重置准备状态
     */
    resetPreparation: (): void => {
      this.preparationState.value = {
        ready: false,
        phase: 'initializing',
        progress: 0,
        startTime: Date.now()
      }
      this.componentListData.value = null
      this.panelData.value = null
      console.log('DataEngine: 准备状态已重置')
    }
  }

  // ==================== 数据管理器 ====================

  /** 数据管理器 */
  manager = {
    /**
     * 获取组件列表数据
     */
    getComponentListData: (): ComponentListData | null => {
      return this.componentListData.value
    },

    /**
     * 获取面板数据
     */
    getPanelData: (): PanelDataInitial | null => {
      return this.panelData.value
    },

    /**
     * 更新组件列表数据
     */
    updateComponentListData: (data: Partial<ComponentListData>): void => {
      if (this.componentListData.value) {
        this.componentListData.value = {
          ...this.componentListData.value,
          ...data,
          lastUpdated: Date.now()
        }
        this.emitEvent('component-list-data-change', this.componentListData.value)
      }
    },

    /**
     * 更新面板数据
     */
    updatePanelData: (data: Partial<PanelDataInitial>): void => {
      if (this.panelData.value) {
        this.panelData.value = {
          ...this.panelData.value,
          ...data,
          updatedAt: Date.now()
        }
        this.emitEvent('panel-data-change', this.panelData.value)
      }
    },

    /**
     * 清除所有数据
     */
    clearAll: (): void => {
      this.componentListData.value = null
      this.panelData.value = null
      this.preparation.resetPreparation()
      console.log('DataEngine: 所有数据已清除')
    }
  }

  // ==================== 数据验证器 ====================

  /** 数据验证器 */
  validator = {
    /**
     * 验证组件列表数据
     */
    validateComponentListData: (data: ComponentListData) => {
      const errors: string[] = []

      if (!data.categoryTabs || !Array.isArray(data.categoryTabs)) {
        errors.push('categoryTabs必须是数组')
      }

      if (typeof data.totalComponents !== 'number') {
        errors.push('totalComponents必须是数字')
      }

      if (!data.version || typeof data.version !== 'string') {
        errors.push('version必须是字符串')
      }

      return {
        valid: errors.length === 0,
        errors
      }
    },

    /**
     * 验证面板数据
     */
    validatePanelData: (data: PanelDataInitial) => {
      const errors: string[] = []

      if (!data.id || typeof data.id !== 'string') {
        errors.push('id必须是字符串')
      }

      if (!data.name || typeof data.name !== 'string') {
        errors.push('name必须是字符串')
      }

      if (!data.nodes || !Array.isArray(data.nodes)) {
        errors.push('nodes必须是数组')
      }

      if (!data.config || typeof data.config !== 'object') {
        errors.push('config必须是对象')
      }

      return {
        valid: errors.length === 0,
        errors
      }
    }
  }

  // ==================== 数据同步器 ====================

  /** 数据同步器 */
  synchronizer = {
    /**
     * 同步组件注册变更
     */
    syncComponentRegistryChanges: async (): Promise<void> => {
      console.log('DataEngine: 同步组件注册变更')
      await this.preparation.prepareComponentListData()
    },

    /**
     * 同步面板状态变更
     */
    syncPanelStateChanges: async (): Promise<void> => {
      console.log('DataEngine: 同步面板状态变更')
      // 这里可以实现面板状态的同步逻辑
    },

    /**
     * 启用自动同步
     */
    enableAutoSync: (): void => {
      if (!this.autoSyncEnabled) {
        this.autoSyncEnabled = true
        console.log('DataEngine: 自动同步已启用')
        // TODO: 实现自动同步逻辑
      }
    },

    /**
     * 禁用自动同步
     */
    disableAutoSync: (): void => {
      if (this.autoSyncEnabled) {
        this.autoSyncEnabled = false
        console.log('DataEngine: 自动同步已禁用')
      }
    }
  }

  // ==================== 事件管理 ====================

  /** 事件管理 */
  events = {
    /**
     * 监听数据准备事件
     */
    onPreparationStateChange: (callback: (state: PanelDataPreparationState) => void): void => {
      this.addEventListener('preparation-state-change', callback)
    },

    /**
     * 监听组件列表数据变更
     */
    onComponentListDataChange: (callback: (data: ComponentListData) => void): void => {
      this.addEventListener('component-list-data-change', callback)
    },

    /**
     * 监听面板数据变更
     */
    onPanelDataChange: (callback: (data: PanelDataInitial) => void): void => {
      this.addEventListener('panel-data-change', callback)
    },

    /**
     * 移除事件监听
     */
    off: (event: string, callback: (...args: any[]) => void): void => {
      this.removeEventListener(event, callback)
    }
  }

  // ==================== 私有方法 ====================

  /**
   * 生成数据版本号
   */
  private generateDataVersion(): string {
    return `v${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 添加事件监听
   */
  private addEventListener(event: string, callback: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(callback)
  }

  /**
   * 移除事件监听
   */
  private removeEventListener(event: string, callback: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  /**
   * 触发事件
   */
  private emitEvent(event: string, payload: any): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(payload)
        } catch (error) {
          console.error(`DataEngine: 事件回调错误 [${event}]`, error)
        }
      })
    }
  }
}

/**
 * 创建数据引擎实例
 */
export const createDataEngine = (): DataEngine => {
  try {
    console.log('createDataEngine: 开始创建实例')
    const instance = new DataEngine()
    console.log('createDataEngine: 实例创建成功')
    return instance
  } catch (error) {
    console.error('createDataEngine: 创建实例失败', error)
    throw error
  }
}

/**
 * 全局数据引擎实例（延迟初始化）
 */
let _globalDataEngine: DataEngine | null = null

export const globalDataEngine = new Proxy({} as DataEngine, {
  get(target, prop) {
    if (!_globalDataEngine) {
      console.log('globalDataEngine Proxy: 延迟初始化')
      _globalDataEngine = createDataEngine()
    }
    return _globalDataEngine[prop as keyof DataEngine]
  }
})
