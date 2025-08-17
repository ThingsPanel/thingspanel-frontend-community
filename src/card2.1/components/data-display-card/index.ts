import type { ComponentDefinition } from '../../core/types'
import DataDisplayCard from './DataDisplayCard.vue'
import DataDisplayConfig from './config/DataDisplayConfig.vue'

const dataDisplayCardDefinition: ComponentDefinition = {
  type: 'data-display-card',
  name: '数据展示卡片',
  description: '用于展示关键数据指标、趋势和操作的卡片组件',
  category: 'display',
  mainCategory: '展示',
  subCategory: '数据',
  author: 'Claude',
  permission: '不限',
  icon: 'stats-chart-outline',
  component: DataDisplayCard,

  // 🔥 注册配置组件
  configComponent: DataDisplayConfig,

  config: {
    style: {
      width: 320,
      height: 240
    },
    // 组件默认配置
    title: '数据展示卡片',
    subtitle: '副标题',
    description: '这是一个功能丰富的数据展示卡片',
    showTitle: true,
    showSubtitle: false,
    showDescription: true,

    // 图标配置
    showIcon: true,
    iconType: 'stats-chart',
    iconSize: 24,
    iconColor: '#18a058',

    // 数值配置
    mainValue: '8,765',
    mainUnit: '次访问',
    valueFormat: 'number',

    // 趋势配置
    showTrend: true,
    trendDirection: 'up',
    trendText: '较昨日 +12.5%',
    trendColor: '#18a058',

    // 数据列表
    showDataList: true,
    dataList: [
      { label: '今日新增', value: '145', unit: '次', color: '#18a058' },
      { label: '本周累计', value: '2,341', unit: '次', color: '#2080f0' },
      { label: '活跃用户', value: '1,876', unit: '人', color: '#f0a020' }
    ],

    // 样式配置
    backgroundColor: '#ffffff',
    borderColor: '#e0e0e6',
    borderWidth: 1,
    borderRadius: 8,
    textColor: '#333333',
    titleColor: '#1a1a1a',
    subtitleColor: '#666666',
    padding: 16,
    minHeight: 200,

    // 布局配置
    layout: 'vertical',
    contentAlign: 'left',

    // 操作配置
    showActions: false,
    actions: [],
    actionSize: 'small'
  }
}

export default dataDisplayCardDefinition
