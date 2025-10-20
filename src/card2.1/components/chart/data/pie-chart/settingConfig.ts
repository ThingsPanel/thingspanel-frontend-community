/**
 * 饼图组件配置接口
 */
export interface PieChartCustomize {
  // 图表配置
  title?: string // 图表标题
  showLegend?: boolean // 显示图例
  legendPosition?: 'top' | 'bottom' | 'left' | 'right' // 图例位置

  // 饼图样式配置
  radius?: [string, string] // 饼图半径 [内半径, 外半径]
  isDonut?: boolean // 是否为环形图
  roseType?: boolean | 'radius' | 'area' // 南丁格尔玫瑰图类型

  // 标签配置
  showLabel?: boolean // 显示标签
  labelPosition?: 'outside' | 'inside' | 'center' // 标签位置
  showLabelLine?: boolean // 显示标签引导线

  // 颜色配置
  colorScheme?: 'default' | 'warm' | 'cool' | 'pastel' | 'custom' // 颜色方案
  customColors?: string[] // 自定义颜色数组

  // 交互配置
  enableHighlight?: boolean // 启用高亮效果
  selectedMode?: boolean | 'single' | 'multiple' // 选中模式
  selectedOffset?: number // 选中扇区的偏移距离

  // 数据显示配置
  showPercentage?: boolean // 显示百分比
  minAngle?: number // 最小扇区角度

  // 动画配置
  animationDuration?: number // 动画时长
}
