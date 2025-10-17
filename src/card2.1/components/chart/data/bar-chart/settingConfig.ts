/**
 * 柱状图组件配置接口
 */
export interface BarChartCustomize {
  // 图表配置
  title?: string // 图表标题
  showLegend?: boolean // 显示图例
  barWidth?: string // 柱宽度（可以是数字或百分比）
  showLabel?: boolean // 显示标签

  // 坐标轴配置
  xAxisLabel?: string // X轴标签
  yAxisLabel?: string // Y轴标签
  showGrid?: boolean // 显示网格

  // 颜色配置
  barColor?: string // 柱条颜色
  barGradient?: boolean // 使用渐变色
  barGradientColor?: string // 渐变终止颜色

  // 动画配置
  animationDuration?: number // 动画时长
  animationDelay?: number // 动画延迟
}
