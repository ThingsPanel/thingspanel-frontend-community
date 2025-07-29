// Mock data for PanelV2 testing
// PanelV2 测试用假数据

import type { CanvasItem, ComponentLibraryItem, CanvasState } from '../types/canvas'

/** 组件库假数据 */
export const mockComponentLibrary: ComponentLibraryItem[] = [
  {
    id: 'chart-bar',
    name: '柱状图',
    type: 'chart',
    icon: 'i-material-symbols:bar-chart',
    color: '#3b82f6',
    description: '用于展示数据的柱状图表',
    defaultSize: { width: 200, height: 150 },
    minSize: { width: 150, height: 100 },
    maxSize: { width: 600, height: 400 },
    defaultConfig: {
      title: '柱状图',
      showLegend: true,
      xAxisLabel: 'X轴',
      yAxisLabel: 'Y轴'
    }
  },
  {
    id: 'chart-line',
    name: '折线图',
    type: 'chart',
    icon: 'i-material-symbols:show-chart',
    color: '#10b981',
    description: '用于展示趋势的折线图表',
    defaultSize: { width: 220, height: 140 },
    minSize: { width: 160, height: 100 },
    maxSize: { width: 500, height: 350 },
    defaultConfig: {
      title: '折线图',
      smooth: true,
      showPoints: true
    }
  },
  {
    id: 'chart-pie',
    name: '饼图',
    type: 'chart',
    icon: 'i-material-symbols:pie-chart',
    color: '#f59e0b',
    description: '用于展示比例的饼图',
    defaultSize: { width: 180, height: 180 },
    minSize: { width: 120, height: 120 },
    maxSize: { width: 300, height: 300 },
    defaultConfig: {
      title: '饼图',
      showLabels: true,
      showValues: true
    }
  },
  {
    id: 'data-table',
    name: '数据表格',
    type: 'data',
    icon: 'i-material-symbols:table',
    color: '#8b5cf6',
    description: '展示表格形式的数据',
    defaultSize: { width: 300, height: 200 },
    minSize: { width: 200, height: 120 },
    maxSize: { width: 800, height: 600 },
    defaultConfig: {
      title: '数据表格',
      showHeader: true,
      pagination: true,
      pageSize: 10
    }
  },
  {
    id: 'text-display',
    name: '文本显示',
    type: 'display',
    icon: 'i-material-symbols:text-fields',
    color: '#ef4444',
    description: '显示文本内容',
    defaultSize: { width: 200, height: 60 },
    minSize: { width: 100, height: 40 },
    maxSize: { width: 400, height: 200 },
    defaultConfig: {
      content: '文本内容',
      fontSize: 14,
      fontWeight: 'normal',
      textAlign: 'left'
    }
  },
  {
    id: 'image-card',
    name: '图片卡片',
    type: 'media',
    icon: 'i-material-symbols:image',
    color: '#06b6d4',
    description: '展示图片内容',
    defaultSize: { width: 200, height: 150 },
    minSize: { width: 100, height: 75 },
    maxSize: { width: 400, height: 300 },
    defaultConfig: {
      src: '/placeholder-image.jpg',
      alt: '图片说明',
      fit: 'cover'
    }
  },
  {
    id: 'progress-bar',
    name: '进度条',
    type: 'display',
    icon: 'i-material-symbols:progress-activity',
    color: '#84cc16',
    description: '显示进度状态',
    defaultSize: { width: 200, height: 40 },
    minSize: { width: 100, height: 20 },
    maxSize: { width: 400, height: 80 },
    defaultConfig: {
      value: 60,
      max: 100,
      showText: true,
      color: '#3b82f6'
    }
  },
  {
    id: 'gauge-chart',
    name: '仪表盘',
    type: 'chart',
    icon: 'i-material-symbols:speed',
    color: '#f97316',
    description: '仪表盘样式的数据展示',
    defaultSize: { width: 160, height: 160 },
    minSize: { width: 120, height: 120 },
    maxSize: { width: 240, height: 240 },
    defaultConfig: {
      title: '仪表盘',
      value: 75,
      min: 0,
      max: 100,
      unit: '%'
    }
  }
]

/** 画布项目假数据 */
export const mockCanvasItems: CanvasItem[] = [
  {
    id: 'item-1',
    type: 'chart-bar',
    position: { x: 50, y: 50 },
    size: { width: 200, height: 150 },
    config: {
      title: '销售数据',
      showLegend: true,
      xAxisLabel: '月份',
      yAxisLabel: '销售额'
    },
    title: '销售数据柱状图'
  },
  {
    id: 'item-2',
    type: 'chart-line',
    position: { x: 300, y: 50 },
    size: { width: 220, height: 140 },
    config: {
      title: '用户增长',
      smooth: true,
      showPoints: true
    },
    title: '用户增长趋势'
  },
  {
    id: 'item-3',
    type: 'text-display',
    position: { x: 50, y: 250 },
    size: { width: 200, height: 60 },
    config: {
      content: '总用户数: 1,234',
      fontSize: 16,
      fontWeight: 'bold',
      textAlign: 'center'
    },
    title: '用户统计'
  },
  {
    id: 'item-4',
    type: 'chart-pie',
    position: { x: 300, y: 220 },
    size: { width: 180, height: 180 },
    config: {
      title: '流量来源',
      showLabels: true,
      showValues: true
    },
    title: '流量来源分布'
  },
  {
    id: 'item-5',
    type: 'progress-bar',
    position: { x: 550, y: 50 },
    size: { width: 200, height: 40 },
    config: {
      value: 75,
      max: 100,
      showText: true,
      color: '#10b981'
    },
    title: '项目进度'
  }
]

/** 默认画布状态 */
export const mockCanvasState: CanvasState = {
  items: [...mockCanvasItems],
  selectedIds: [],
  mode: 'edit',
  grid: {
    enabled: true,
    size: 10,
    snap: true
  },
  canvasSize: { width: 1200, height: 800 },
  zoom: 1
}

/** 生成随机画布项目 */
export function generateRandomCanvasItem(componentId: string): CanvasItem {
  const component = mockComponentLibrary.find(comp => comp.id === componentId)
  if (!component) {
    throw new Error(`Component ${componentId} not found in library`)
  }

  const randomId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const randomX = Math.floor(Math.random() * 600)
  const randomY = Math.floor(Math.random() * 400)

  return {
    id: randomId,
    type: componentId,
    position: { x: randomX, y: randomY },
    size: { ...component.defaultSize },
    config: { ...component.defaultConfig },
    title: component.name,
    minSize: { ...component.minSize },
    maxSize: component.maxSize ? { ...component.maxSize } : undefined
  }
}

/** 获取组件库项目 */
export function getComponentById(id: string): ComponentLibraryItem | undefined {
  return mockComponentLibrary.find(comp => comp.id === id)
}

/** 按类型过滤组件库 */
export function getComponentsByType(type: ComponentLibraryItem['type']): ComponentLibraryItem[] {
  return mockComponentLibrary.filter(comp => comp.type === type)
}

/** 搜索组件库 */
export function searchComponents(keyword: string): ComponentLibraryItem[] {
  const lowerKeyword = keyword.toLowerCase()
  return mockComponentLibrary.filter(comp => 
    comp.name.toLowerCase().includes(lowerKeyword) ||
    comp.description?.toLowerCase().includes(lowerKeyword)
  )
}

/** 生成测试数据 */
export function generateTestCanvasItems(count: number = 3): CanvasItem[] {
  const items: CanvasItem[] = []
  const availableTypes = mockComponentLibrary.map(comp => comp.id)
  
  for (let i = 0; i < count; i++) {
    const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)]
    items.push(generateRandomCanvasItem(randomType))
  }
  
  return items
}