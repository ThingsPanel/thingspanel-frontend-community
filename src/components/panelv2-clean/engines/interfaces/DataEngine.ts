/**
 * @file DataEngine 接口定义
 * @description 数据引擎接口 - 负责数据准备、管理和同步
 * 遵循数据驱动哲学，确保渲染前数据就绪
 */

import type { ComponentDefinition } from '../../types/core'
import type { ComponentCategoryTab } from '../interfaces/ComponentListRenderer'

/**
 * 面板数据准备状态
 */
export interface PanelDataPreparationState {
  /** 是否已准备就绪 */
  ready: boolean
  /** 准备阶段 */
  phase: 'initializing' | 'loading-components' | 'preparing-panel' | 'ready' | 'error'
  /** 准备进度 (0-100) */
  progress: number
  /** 错误信息 */
  error?: string
  /** 准备开始时间 */
  startTime: number
  /** 准备完成时间 */
  endTime?: number
}

/**
 * 组件列表数据结构
 */
export interface ComponentListData {
  /** 分类Tab数据 */
  categoryTabs: ComponentCategoryTab[]
  /** 默认激活分类 */
  defaultActiveCategory: string
  /** 总组件数 */
  totalComponents: number
  /** 数据版本（用于缓存失效） */
  version: string
  /** 最后更新时间 */
  lastUpdated: number
}

/**
 * 面板数据结构（初始状态）
 */
export interface PanelDataInitial {
  /** 面板ID */
  id: string
  /** 面板名称 */
  name: string
  /** 面板描述 */
  description?: string
  /** 节点数据（初始为空） */
  nodes: any[]
  /** 面板配置 */
  config: {
    /** 画布配置 */
    canvas: {
      width: number
      height: number
      background: string
      grid: boolean
    }
    /** 渲染器配置 */
    renderer: {
      type: 'gridstack'
      config: Record<string, any>
    }
  }
  /** 数据版本 */
  version: string
  /** 创建时间 */
  createdAt: number
  /** 更新时间 */
  updatedAt: number
}

/**
 * 数据准备结果
 */
export interface DataPreparationResult {
  /** 组件列表数据 */
  componentListData: ComponentListData
  /** 面板初始数据 */
  panelData: PanelDataInitial
  /** 准备状态 */
  state: PanelDataPreparationState
}

/**
 * 数据引擎接口
 */
export interface DataEngine {
  /**
   * 数据准备器
   */
  preparation: {
    /**
     * 准备所有必需数据
     */
    prepareAll(): Promise<DataPreparationResult>

    /**
     * 准备组件列表数据
     */
    prepareComponentListData(): Promise<ComponentListData>

    /**
     * 准备面板数据
     */
    preparePanelData(): Promise<PanelDataInitial>

    /**
     * 获取准备状态
     */
    getPreparationState(): PanelDataPreparationState

    /**
     * 重置准备状态
     */
    resetPreparation(): void
  }

  /**
   * 数据管理器
   */
  manager: {
    /**
     * 获取组件列表数据
     */
    getComponentListData(): ComponentListData | null

    /**
     * 获取面板数据
     */
    getPanelData(): PanelDataInitial | null

    /**
     * 更新组件列表数据
     */
    updateComponentListData(data: Partial<ComponentListData>): void

    /**
     * 更新面板数据
     */
    updatePanelData(data: Partial<PanelDataInitial>): void

    /**
     * 清除所有数据
     */
    clearAll(): void
  }

  /**
   * 数据验证器
   */
  validator: {
    /**
     * 验证组件列表数据
     */
    validateComponentListData(data: ComponentListData): {
      valid: boolean
      errors: string[]
    }

    /**
     * 验证面板数据
     */
    validatePanelData(data: PanelDataInitial): {
      valid: boolean
      errors: string[]
    }
  }

  /**
   * 数据同步器
   */
  synchronizer: {
    /**
     * 同步组件注册变更
     */
    syncComponentRegistryChanges(): Promise<void>

    /**
     * 同步面板状态变更
     */
    syncPanelStateChanges(): Promise<void>

    /**
     * 启用自动同步
     */
    enableAutoSync(): void

    /**
     * 禁用自动同步
     */
    disableAutoSync(): void
  }

  /**
   * 事件管理
   */
  events: {
    /**
     * 监听数据准备事件
     */
    onPreparationStateChange(callback: (state: PanelDataPreparationState) => void): void

    /**
     * 监听组件列表数据变更
     */
    onComponentListDataChange(callback: (data: ComponentListData) => void): void

    /**
     * 监听面板数据变更
     */
    onPanelDataChange(callback: (data: PanelDataInitial) => void): void

    /**
     * 移除事件监听
     */
    off(event: string, callback: (...args: any[]) => void): void
  }
}
