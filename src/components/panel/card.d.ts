export type DeviceSourceItem = {
  cardId?: string
  deviceId?: string
  deviceMetrics?: string
  name?: string
  metricsId?: string
  metricsType?: string // telemetry | attributes | event | command
  metricsDataType?: string // number | string | boolean
  metricsName?: string
  metricsOptions?: any[]
  metricsShow: boolean
  aggregate_function: string
}

export interface ICardData {
  type?: ICardDefine['type']
  cardId?: string
  // 组件自定义配置
  config?: Record<string, any>
  title?: string
  // 基础配置
  basicSettings?: {
    showTitle?: boolean
    title?: string
  }
  layout?: {
    w?: number
    h?: number
    minW?: number
    minH?: number
  }
  // 数据源
  dataSource?: {
    // 系统 或 设备
    origin: 'system' | 'device'
    sourceNum?: number // 不填写即为 1-任意多个，最多9个，如需固定数量，填写整数
    systemSource?: { type?: number; name?: string }[]
    deviceCount?: number
    isSupportTimeRange: boolean // 是否支持指定时间范围
    dataTimeRange: string // 时间范围，custom，last_5m，last_15m，last_30m，last_1h，last_3h，last_6h，last_12h，last_24h，last_3d，last_7d，last_15d，last_30d，last_60d，last_90d，last_6m，last_1y
    isSupportAggregate: boolean // 是否支持聚合
    dataAggregateRange: string // 聚合时间范围
    deviceSource?: DeviceSourceItem[]
  }
}

export interface ICardView {
  x: number
  y: number
  w: number
  h: number
  i: number
  minW?: number
  minH?: number
  data?: ICardData
}

export interface ICardDefine {
  component: any // 卡片组件，一般就是 ./component.vue
  remoteId?: string
  id: string // 卡片唯一标识，按照card_type_cardName命名不会错
  title: string // 卡片标题，英文，后期作为国际化key
  poster: string // 示例图 尺寸193*120
  type: 'builtin' | 'device' | 'plugin' | 'chart' // 卡片类型
  // 不存在就是all
  scene?: 'mobile' | 'pc' | 'all'
  configForm?: any // 卡片配置文件，一般就是 card-config.vue
  // 初始化设置参数（可选）
  preset?: {
    config?: object
    dataSource?: ICardData['dataSource']
    basicSettings?: ICardData['basicSettings']
    iCardViewDefault?: {
      w?: number // 卡片初始占几行，尽量配一下
      h?: number // 卡片初始大几列，尽量配一下
      minW?: number // 卡片最小占几行
      minH?: number // 卡片最小大几列
    }
  }
}

export interface ICardFormIns {
  setCard: (card?: ICardData | null) => void
}

export interface IConfigCtx {
  config: Record<string, any>
  view?: boolean // 预览模式
}

export interface ICardItem {
  getComponent(): any
}

export interface ICardRender {
  addCard(data: ICardData): void
  getCardComponent(cardView: ICardView): ICardItem | null
}
