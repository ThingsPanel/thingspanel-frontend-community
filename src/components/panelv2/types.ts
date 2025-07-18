// src/components/panelv2/types.ts

// --- 基础配置单元 ---
/**
 * @description 定义一个配置项，包含其值和对应的配置器组件标识。
 * 这是实现“配置驱动”的基础。
 */
export interface ConfigItem<T> {
  value: T // 配置的实际值
  inspector: string // 指向 InspectorRegistry 的 key，告诉UI应渲染哪个配置器组件
}

// --- 卡片数据结构 ---
/**
 * @description 代表一个卡片实例。它现在主要由“布局”和“配置”组成。
 */
export interface PanelCard {
  id: string // 唯一实例ID
  type: string // 卡片类型标识，用于在用户实现层决定渲染哪个内容组件
  layout: { x: number; y: number; w: number; h: number } // 布局信息
  // 卡片的具体配置，每个字段都是一个独立的、可配置的单元
  config: {
    [key: string]: ConfigItem<any>
  }
}

// --- 看板状态 ---
/**
 * @description 整个看板的状态树
 */
export interface PanelState {
  cards: PanelCard[]
  selectedItemId?: string | null
  // 看板自身的全局配置
  config: {
    [key: string]: ConfigItem<any>
  }
}

// --- 其他辅助类型 ---

/**
 * @description 代表左侧侧边栏中可拖拽的组件项。
 */
export interface DraggableItem {
  type: string // 组件类型，必须与某个已注册的卡片组件类型对应
  label: string // 在侧边栏中显示的名称
  icon?: string // (可选) 显示的图标
  // 拖拽生成卡片时的默认数据
  defaultData: Omit<PanelCard, 'id' | 'layout'>
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
