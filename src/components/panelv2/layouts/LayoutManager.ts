// src/components/panelv2/layouts/LayoutManager.ts

import type { PanelCard } from '../types'

export interface LayoutEngine {
  name: string
  initialize: (container: HTMLElement, options?: any) => any
  addCard: (card: PanelCard, position?: any) => void
  removeCard: (cardId: string) => void
  updateCard: (cardId: string, updates: Partial<PanelCard>) => void
  updateLayout: (cardId: string, layout: PanelCard['layout']) => void
  destroy: () => void
  resize: () => void
}

export interface LayoutPreset {
  id: string
  name: string
  description?: string
  gridColumns: number
  cellHeight: number
  margins: [number, number]
  responsive?: boolean
  breakpoints?: {
    [key: string]: {
      columns: number
      cellHeight?: number
    }
  }
}

export class LayoutManager {
  private currentEngine: LayoutEngine | null = null
  private engines: Map<string, LayoutEngine> = new Map()
  private presets: Map<string, LayoutPreset> = new Map()

  constructor() {
    this.initializePresets()
  }

  // 注册布局引擎
  registerEngine(name: string, engine: LayoutEngine) {
    this.engines.set(name, engine)
  }

  // 获取布局引擎
  getEngine(name: string): LayoutEngine | undefined {
    return this.engines.get(name)
  }

  // 设置当前布局引擎
  setCurrentEngine(name: string, container: HTMLElement, options?: any) {
    // 清理当前引擎
    if (this.currentEngine) {
      this.currentEngine.destroy()
    }

    const engine = this.engines.get(name)
    if (engine) {
      this.currentEngine = engine
      engine.initialize(container, options)
    }
  }

  // 获取当前引擎
  getCurrentEngine(): LayoutEngine | null {
    return this.currentEngine
  }

  // 注册布局预设
  registerPreset(preset: LayoutPreset) {
    this.presets.set(preset.id, preset)
  }

  // 获取布局预设
  getPreset(id: string): LayoutPreset | undefined {
    return this.presets.get(id)
  }

  // 获取所有预设
  getAllPresets(): LayoutPreset[] {
    return Array.from(this.presets.values())
  }

  // 应用预设
  applyPreset(presetId: string, container: HTMLElement) {
    const preset = this.presets.get(presetId)
    if (!preset || !this.currentEngine) return

    const options = {
      column: preset.gridColumns,
      cellHeight: `${preset.cellHeight}px`,
      margin: preset.margins,
      float: true,
      animate: true,
      ...(preset.responsive && {
        columnOpts: preset.breakpoints
      })
    }

    this.currentEngine.initialize(container, options)
  }

  // 初始化预设
  private initializePresets() {
    // 默认网格布局
    this.registerPreset({
      id: 'default-grid',
      name: '默认网格',
      description: '12列自适应网格布局',
      gridColumns: 12,
      cellHeight: 70,
      margins: [10, 10]
    })

    // 紧凑布局
    this.registerPreset({
      id: 'compact',
      name: '紧凑布局',
      description: '16列紧凑网格布局',
      gridColumns: 16,
      cellHeight: 50,
      margins: [5, 5]
    })

    // 宽松布局
    this.registerPreset({
      id: 'spacious',
      name: '宽松布局',
      description: '8列宽松网格布局',
      gridColumns: 8,
      cellHeight: 90,
      margins: [20, 20]
    })

    // 移动端布局
    this.registerPreset({
      id: 'mobile',
      name: '移动端布局',
      description: '适合移动设备的单列布局',
      gridColumns: 1,
      cellHeight: 120,
      margins: [10, 10]
    })

    // 响应式布局
    this.registerPreset({
      id: 'responsive',
      name: '响应式布局',
      description: '根据屏幕尺寸自动调整的响应式布局',
      gridColumns: 12,
      cellHeight: 70,
      margins: [10, 10],
      responsive: true,
      breakpoints: {
        lg: { columns: 12 },
        md: { columns: 8 },
        sm: { columns: 4 },
        xs: { columns: 1, cellHeight: 100 }
      }
    })

    // 仪表盘布局
    this.registerPreset({
      id: 'dashboard',
      name: '仪表盘布局',
      description: '适合数据展示的仪表盘布局',
      gridColumns: 24,
      cellHeight: 40,
      margins: [8, 8]
    })
  }

  // 获取推荐布局
  getRecommendedLayout(screenWidth: number, cardCount: number): string {
    if (screenWidth < 768) {
      return 'mobile'
    } else if (screenWidth < 1200) {
      return 'compact'
    } else if (cardCount > 20) {
      return 'dashboard'
    } else {
      return 'default-grid'
    }
  }

  // 清理资源
  destroy() {
    if (this.currentEngine) {
      this.currentEngine.destroy()
      this.currentEngine = null
    }
    this.engines.clear()
    this.presets.clear()
  }
}
