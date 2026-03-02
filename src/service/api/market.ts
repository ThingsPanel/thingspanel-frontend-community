import { request } from '../request'

/** 市场登录 */
export const marketLogin = async (data: { username: string; password: string }) => {
  return await request.post<{ token: string }>('/device/template/market/login', data)
}

/** 发布模板到市场 */
export const publishToMarket = async (data: { device_template_id: string; market_token: string }) => {
  return await request.post<{ market_template_id: string }>('/device/template/market/publish', data)
}

/** 获取市场模板列表（通过后端代理） */
export const getMarketTemplates = async (params: {
  keyword?: string
  category?: string
  sort_by?: string
  page: number
  page_size: number
}) => {
  return await request.get<any>('/device/template/market/list', { params })
}

/** 获取市场模板详情 */
export const getMarketTemplateDetail = async (marketId: string) => {
  return await request.get<any>(`/device/template/market/detail/${marketId}`)
}

/** 从市场安装模板 */
export const installFromMarket = async (data: {
  market_template_id: string
  version?: string
  market_token: string
}) => {
  return await request.post<any>('/device/template/market/install', data)
}
