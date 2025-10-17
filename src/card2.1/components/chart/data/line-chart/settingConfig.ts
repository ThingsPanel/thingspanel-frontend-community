/**
 * 折线图组件配置接口
 */
export interface LineChartCustomize {
  // 图表配置
  title?: string // 图表标题
  showLegend?: boolean // 显示图例
  smooth?: boolean // 平滑曲线
  showArea?: boolean // 显示面积

  // 坐标轴配置
  xAxisLabel?: string // X轴标签
  yAxisLabel?: string // Y轴标签
  showGrid?: boolean // 显示网格

  // 颜色配置
  lineColor?: string // 线条颜色
  areaColor?: string // 面积颜色

  // 数据点配置
  showDataPoints?: boolean // 显示数据点
  dataPointSize?: number // 数据点大小

  // 动画配置
  animationDuration?: number // 动画时长
}
