// src/components/panelv2/types.ts

// 导入新的配置类型系统
export * from './types/config'

// --- 兼容老版本的配置单元（逐步迁移） ---
/**
 * @description 定义一个配置项，包含其值和对应的配置器组件标识。
 * @deprecated 逐步迁移到新的ConfigItem
 */
export interface LegacyConfigItem<T> {
  value: T
  inspector: string
  label?: string
  description?: string
}

// --- 卡片数据结构 ---
/**
 * @description 代表一个卡片实例，支持分层配置
 */
export interface PanelCard {
  id: string // 唯一实例ID
  type: string // 卡片类型标识

  // 新的分层配置结构
  config: {
    base: NodeBaseConfig // 基础配置（位置、状态、外观）
    interaction: NodeInteractionConfig // 交互配置
    content: NodeContentConfig // 内容配置（由渲染器定义）
  }

  // 布局信息（从config.base.layout同步）
  layout: NodeLayout
}

// --- 看板状态 ---
/**
 * @description 整个看板的状态树，支持分层配置
 */
export interface PanelState {
  cards: PanelCard[]
  selectedItemId?: string | null

  // 看板全局配置
  config: PanelConfig
}

// --- 其他辅助类型 ---

/**
 * @description 代表左侧侧边栏中可拖拽的组件项。
 */
export interface DraggableItem {
  type: string // 组件类型
  label: string // 显示名称
  icon?: string // 图标
  category?: string // 分类

  // 拖拽生成卡片时的默认数据
  defaultData: {
    type: string
    config: {
      base: Partial<NodeBaseConfig>
      interaction: Partial<NodeInteractionConfig>
      content: NodeContentConfig
    }
    layout: NodeLayout
  }
}

/**
 * @description 定义工具栏中每个按钮的行为和外观。
 */
export interface ToolbarAction {
  id: string // 唯一ID
  icon: string // 按钮图标
  tooltip: string // 鼠标悬浮提示
  action: (state: any) => void // 点击后执行的操作，接收 Pinia store 实例
}

/**
 * @description 为动态组件注册表定义的通用类型。
 */
export type ComponentRegistry<T> = {
  [key: string]: T
}
