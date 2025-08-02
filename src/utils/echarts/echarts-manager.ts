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

/**
 * 初始化 ECharts 组件注册
 * 全局只注册一次，避免重复注册错误
 */
export function initEChartsComponents() {
  if (isEChartsRegistered) {
    console.log('🎯 ECharts 组件已注册，跳过重复注册')
    return
  }

  try {
    console.log('🚀 开始注册 ECharts 组件...')

    echarts.use([
      // 图表类型
      BarChart,
      LineChart,
      PieChart,
      ScatterChart,
      PictorialBarChart,
      RadarChart,
      GaugeChart,
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
      ThemeRiverChart,

      // 组件
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
      PolarComponent,
      RadarComponent,
      GeoComponent,
      SingleAxisComponent,
      ParallelComponent,
      MarkLineComponent,
      MarkPointComponent,
      MarkAreaComponent,
      BrushComponent,
      AxisPointerComponent,

      // 功能
      LabelLayout,
      UniversalTransition,

      // 渲染器
      CanvasRenderer,
      SVGRenderer
    ])

    isEChartsRegistered = true
    console.log('✅ ECharts 组件注册完成')
  } catch (error) {
    // 捕获重复注册错误，但不影响程序执行
    if (error instanceof Error && error.message.includes('exists')) {
      console.warn('⚠️ 检测到 ECharts 组件重复注册，已跳过:', error.message)
      isEChartsRegistered = true
    } else {
      console.error('❌ ECharts 组件注册失败:', error)
      throw error
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
  console.log('🔄 ECharts 注册状态已重置')
}

// 自动初始化（在模块加载时）
if (typeof window !== 'undefined') {
  // 在浏览器环境中自动初始化
  initEChartsComponents()
}

export default {
  initEChartsComponents,
  createEChartsInstance,
  useEChartsInstance,
  resetEChartsRegistration
}
