/**
 * Canvas渲染器数据适配器
 * 负责将外部面板数据转换为Canvas渲染器可用的格式
 */

// ==================== 类型定义 ====================

/** 外部面板数据接口 - 与GridStack共享 */
export interface ExternalPanelData {
  /** 面板ID */
  panelId: string
  /** 面板名称 */
  panelName: string
  /** 面板描述 */
  description?: string
  /** 布局配置 */
  layout: {
    /** 画布宽度 */
    width?: number
    /** 画布高度 */
    height?: number
    /** 背景颜色 */
    backgroundColor?: string
    /** 网格大小 */
    gridSize?: number
    /** 是否显示网格 */
    showGrid?: boolean
  }
  /** 组件列表 */
  components: ExternalComponent[]
  /** 元数据 */
  metadata?: {
    version: string
    createdAt: string
    updatedAt: string
    author?: string
  }
}

/** 外部组件数据接口 */
export interface ExternalComponent {
  /** 组件唯一标识 */
  id: string
  /** 组件名称 */
  name: string
  /** 组件类型 */
  type: string
  /** 关联设备ID */
  deviceId?: string
  /** 位置信息 */
  position: {
    /** X坐标 */
    x: number
    /** Y坐标 */
    y: number
  }
  /** 尺寸信息 */
  size: {
    /** 宽度 */
    width: number
    /** 高度 */
    height: number
  }
  /** 组件配置 */
  config: Record<string, any>
  /** 组件数据 */
  data?: Record<string, any>
  /** 样式配置 */
  style?: {
    /** 背景颜色 */
    backgroundColor?: string
    /** 边框颜色 */
    borderColor?: string
    /** 边框宽度 */
    borderWidth?: number
    /** 圆角半径 */
    borderRadius?: number
    /** 透明度 */
    opacity?: number
    /** 阴影 */
    boxShadow?: string
  }
}

/** Canvas项目接口 */
export interface CanvasItem {
  /** 项目唯一标识 */
  id: string
  /** 项目类型 */
  type: string
  /** 显示名称 */
  name: string
  /** 位置信息 */
  position: {
    x: number
    y: number
  }
  /** 尺寸信息 */
  size: {
    width: number
    height: number
  }
  /** 样式配置 */
  style: {
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
    borderRadius?: number
    opacity?: number
    boxShadow?: string
  }
  /** 组件配置 */
  config: Record<string, any>
  /** 组件数据 */
  data: Record<string, any>
  /** 关联设备ID */
  deviceId?: string
  /** 是否可拖拽 */
  draggable: boolean
  /** 是否可调整大小 */
  resizable: boolean
  /** 是否选中 */
  selected: boolean
  /** 层级 */
  zIndex: number
}

/** 数据验证结果 */
export interface ValidationResult {
  /** 是否有效 */
  isValid: boolean
  /** 错误信息 */
  errors: string[]
  /** 警告信息 */
  warnings: string[]
}

/** 数据统计信息 */
export interface DataStatistics {
  /** 组件总数 */
  componentCount: number
  /** 设备总数 */
  deviceCount: number
  /** 组件类型分布 */
  componentTypes: Record<string, number>
  /** 画布尺寸 */
  canvasSize: {
    width: number
    height: number
  }
}

// ==================== Canvas数据适配器类 ====================

/**
 * Canvas数据适配器
 * 提供外部数据与Canvas渲染器之间的转换功能
 */
export class CanvasAdapter {
  /**
   * 验证外部面板数据
   * @param data 外部面板数据
   * @returns 验证结果
   */
  static validateExternalData(data: ExternalPanelData): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 基础字段验证
    if (!data.panelId) {
      errors.push('面板ID不能为空')
    }
    if (!data.panelName) {
      errors.push('面板名称不能为空')
    }
    if (!data.layout) {
      errors.push('布局配置不能为空')
    }
    if (!Array.isArray(data.components)) {
      errors.push('组件列表必须是数组')
    }

    // 组件验证
    if (data.components) {
      data.components.forEach((component, index) => {
        if (!component.id) {
          errors.push(`组件[${index}]: ID不能为空`)
        }
        if (!component.name) {
          warnings.push(`组件[${index}]: 名称为空`)
        }
        if (!component.type) {
          errors.push(`组件[${index}]: 类型不能为空`)
        }
        if (
          !component.position ||
          typeof component.position.x !== 'number' ||
          typeof component.position.y !== 'number'
        ) {
          errors.push(`组件[${index}]: 位置信息无效`)
        }
        if (!component.size || typeof component.size.width !== 'number' || typeof component.size.height !== 'number') {
          errors.push(`组件[${index}]: 尺寸信息无效`)
        }
        if (component.size && (component.size.width <= 0 || component.size.height <= 0)) {
          errors.push(`组件[${index}]: 尺寸必须大于0`)
        }
      })
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 获取数据统计信息
   * @param data 外部面板数据
   * @returns 统计信息
   */
  static getDataStatistics(data: ExternalPanelData): DataStatistics {
    const componentTypes: Record<string, number> = {}
    const deviceIds = new Set<string>()

    // 统计组件类型和设备
    data.components.forEach(component => {
      // 统计组件类型
      componentTypes[component.type] = (componentTypes[component.type] || 0) + 1

      // 统计设备
      if (component.deviceId) {
        deviceIds.add(component.deviceId)
      }
    })

    // 计算画布尺寸
    let maxX = 0
    let maxY = 0
    data.components.forEach(component => {
      const rightEdge = component.position.x + component.size.width
      const bottomEdge = component.position.y + component.size.height
      maxX = Math.max(maxX, rightEdge)
      maxY = Math.max(maxY, bottomEdge)
    })

    return {
      componentCount: data.components.length,
      deviceCount: deviceIds.size,
      componentTypes,
      canvasSize: {
        width: Math.max(maxX, data.layout.width || 1200),
        height: Math.max(maxY, data.layout.height || 800)
      }
    }
  }

  /**
   * 将外部面板数据转换为Canvas项目列表
   * @param data 外部面板数据
   * @returns Canvas项目列表
   */
  static convertPanelToCanvasItems(data: ExternalPanelData): CanvasItem[] {
    // 验证数据
    const validation = this.validateExternalData(data)
    if (!validation.isValid) {
      throw new Error(`数据验证失败: ${validation.errors.join(', ')}`)
    }

    // 转换组件
    return data.components.map((component, index) => {
      return this.convertToCanvasItem(component, index)
    })
  }

  /**
   * 将外部组件转换为Canvas项目
   * @param component 外部组件
   * @param index 组件索引
   * @returns Canvas项目
   */
  static convertToCanvasItem(component: ExternalComponent, index: number = 0): CanvasItem {
    // 默认样式
    const defaultStyle = {
      backgroundColor: '#ffffff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      borderRadius: 4,
      opacity: 1,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }

    // 根据组件类型设置不同的默认样式
    const typeStyles: Record<string, Partial<typeof defaultStyle>> = {
      sensor: {
        backgroundColor: '#f0f9ff',
        borderColor: '#0ea5e9'
      },
      chart: {
        backgroundColor: '#fefce8',
        borderColor: '#eab308'
      },
      control: {
        backgroundColor: '#f0fdf4',
        borderColor: '#22c55e'
      },
      indicator: {
        backgroundColor: '#fdf2f8',
        borderColor: '#ec4899'
      }
    }

    const typeStyle = typeStyles[component.type] || {}

    return {
      id: component.id,
      type: component.type,
      name: component.name,
      position: {
        x: component.position.x,
        y: component.position.y
      },
      size: {
        width: component.size.width,
        height: component.size.height
      },
      style: {
        ...defaultStyle,
        ...typeStyle,
        ...component.style
      },
      config: component.config || {},
      data: component.data || {},
      deviceId: component.deviceId,
      draggable: true,
      resizable: true,
      selected: false,
      zIndex: index + 1
    }
  }

  /**
   * 将Canvas项目转换为外部组件格式
   * @param item Canvas项目
   * @returns 外部组件
   */
  static convertFromCanvasItem(item: CanvasItem): ExternalComponent {
    return {
      id: item.id,
      name: item.name,
      type: item.type,
      deviceId: item.deviceId,
      position: {
        x: item.position.x,
        y: item.position.y
      },
      size: {
        width: item.size.width,
        height: item.size.height
      },
      config: item.config,
      data: item.data,
      style: item.style
    }
  }

  /**
   * 解析面板数据
   * @param rawData 原始数据
   * @returns 解析后的面板数据
   */
  static parsePanelData(rawData: any): ExternalPanelData {
    try {
      // 如果是字符串，尝试解析JSON
      if (typeof rawData === 'string') {
        rawData = JSON.parse(rawData)
      }

      // 确保必要字段存在
      const panelData: ExternalPanelData = {
        panelId: rawData.panelId || 'unknown',
        panelName: rawData.panelName || '未命名面板',
        description: rawData.description,
        layout: {
          width: rawData.layout?.width || 1200,
          height: rawData.layout?.height || 800,
          backgroundColor: rawData.layout?.backgroundColor || '#f8fafc',
          gridSize: rawData.layout?.gridSize || 20,
          showGrid: rawData.layout?.showGrid !== false
        },
        components: Array.isArray(rawData.components) ? rawData.components : [],
        metadata: rawData.metadata
      }

      return panelData
    } catch (error) {
      throw new Error(`面板数据解析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 创建空的面板数据
   * @param panelId 面板ID
   * @param panelName 面板名称
   * @returns 空的面板数据
   */
  static createEmptyPanelData(panelId: string, panelName: string = '新建面板'): ExternalPanelData {
    return {
      panelId,
      panelName,
      description: '',
      layout: {
        width: 1200,
        height: 800,
        backgroundColor: '#f8fafc',
        gridSize: 20,
        showGrid: true
      },
      components: [],
      metadata: {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
  }
}

// 导出默认实例
export default CanvasAdapter
