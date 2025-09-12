/**
 * ECharts 全局管理器
 * 解决 ECharts 组件重复注册问题
 */

import * as echarts from 'echarts/core'
import {
  BarChart,
  GaugeChart,
  LineChart,
  PictorialBarChart,
  PieChart,
  RadarChart,
  ScatterChart,
  // 添加更多图表类型
  FunnelChart,
  SankeyChart,
  TreeChart,
  TreemapChart,
  GraphChart,
  BoxplotChart,
  CandlestickChart,
  EffectScatterChart,
  HeatmapChart,
  LinesChart,
  MapChart,
  ParallelChart,
  SunburstChart,
  ThemeRiverChart
} from 'echarts/charts'
import {
  TitleComponent,
  LegendComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  ToolboxComponent,
  DataZoomComponent,
  VisualMapComponent,
  TimelineComponent,
  CalendarComponent,
  GraphicComponent,
  // 添加更多组件
  PolarComponent,
  RadarComponent,
  GeoComponent,
  SingleAxisComponent,
  ParallelComponent,
  MarkLineComponent,
  MarkPointComponent,
  MarkAreaComponent,
  BrushComponent,
  AxisPointerComponent
} from 'echarts/components'
import { LabelLayout, UniversalTransition } from 'echarts/features'
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers'

// 全局标识，确保只注册一次
let isEChartsRegistered = false

// 基础必需组件 - 首次加载时注册
const BASIC_COMPONENTS = [
  // 最常用的图表类型
  BarChart,
  LineChart,
  PieChart,

  // 基础组件
  TitleComponent,
  LegendComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,

  // 基础功能
  LabelLayout,
  UniversalTransition,

  // 渲染器
  CanvasRenderer
]

// 扩展组件映射表 - 按需加载
const EXTENDED_COMPONENTS_MAP: Record<string, any[]> = {
  scatter: [ScatterChart],
  gauge: [GaugeChart, PolarComponent],
  radar: [RadarChart, RadarComponent],
  pictorial: [PictorialBarChart],
  funnel: [FunnelChart],
  sankey: [SankeyChart],
  tree: [TreeChart],
  treemap: [TreemapChart],
  graph: [GraphChart],
  boxplot: [BoxplotChart],
  candlestick: [CandlestickChart],
  effectScatter: [EffectScatterChart],
  heatmap: [HeatmapChart],
  lines: [LinesChart],
  map: [MapChart, GeoComponent],
  parallel: [ParallelChart, ParallelComponent, SingleAxisComponent],
  sunburst: [SunburstChart],
  themeRiver: [ThemeRiverChart],
  toolbox: [ToolboxComponent],
  dataZoom: [DataZoomComponent],
  visualMap: [VisualMapComponent],
  timeline: [TimelineComponent],
  calendar: [CalendarComponent],
  graphic: [GraphicComponent],
  markLine: [MarkLineComponent],
  markPoint: [MarkPointComponent],
  markArea: [MarkAreaComponent],
  brush: [BrushComponent],
  axisPointer: [AxisPointerComponent],
  svg: [SVGRenderer]
}

// 已注册的扩展组件
const registeredExtensions = new Set<string>()

/**
 * 初始化 ECharts 基础组件注册
 * 只注册最常用的组件，减少初始内存占用
 */
export function initEChartsComponents() {
  if (isEChartsRegistered) {
    return
  }

  try {
    echarts.use(BASIC_COMPONENTS)

    isEChartsRegistered = true
  } catch (error) {
    // 捕获重复注册错误，但不影响程序执行
    if (error instanceof Error && error.message.includes('exists')) {
      isEChartsRegistered = true
    } else {
      throw error
    }
  }
}

/**
 * 按需注册扩展组件
 * @param componentTypes 需要注册的组件类型数组
 */
export function registerEChartsExtensions(componentTypes: string[]) {
  const newComponents: any[] = []

  componentTypes.forEach(type => {
    if (!registeredExtensions.has(type) && EXTENDED_COMPONENTS_MAP[type]) {
      newComponents.push(...EXTENDED_COMPONENTS_MAP[type])
      registeredExtensions.add(type)
      if (process.env.NODE_ENV === 'development') {
      }
    }
  })

  if (newComponents.length > 0) {
    try {
      echarts.use(newComponents)
      if (process.env.NODE_ENV === 'development') {
      }
    } catch (error) {
      console.error('⚠️ ECharts 扩展组件注册警告:', error)
    }
  }
}

/**
 * 获取 ECharts 实例
 * 确保组件已注册后再创建实例
 */
export function createEChartsInstance(
  dom: HTMLElement,
  theme?: string | object,
  opts?: {
    devicePixelRatio?: number
    renderer?: 'canvas' | 'svg'
    useDirtyRect?: boolean
    useCoarsePointer?: boolean
    pointerSize?: number
    ssr?: boolean
    width?: number
    height?: number
    locale?: string
  }
): echarts.ECharts {
  // 确保组件已注册
  initEChartsComponents()

  // 创建实例
  return echarts.init(dom, theme, opts)
}

/**
 * 安全地使用 ECharts
 * 提供统一的 ECharts 访问接口
 */
export function useEChartsInstance() {
  // 确保组件已注册
  initEChartsComponents()

  return {
    echarts,
    createInstance: createEChartsInstance,
    isRegistered: () => isEChartsRegistered
  }
}

/**
 * 重置注册状态（仅用于测试）
 */
export function resetEChartsRegistration() {
  isEChartsRegistered = false
  if (process.env.NODE_ENV === 'development') {
  }
}

// 移除自动初始化，改为延迟加载
// 注释掉自动初始化以减少启动时的内存占用
// if (typeof window !== 'undefined') {
//   initEChartsComponents()
// }

export default {
  initEChartsComponents,
  createEChartsInstance,
  useEChartsInstance,
  resetEChartsRegistration
}
