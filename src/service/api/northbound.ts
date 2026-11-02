import { request } from '../request'
import { northboundRequest } from '../request/northbound'

/** 连接器列表（真实探活结果） */
export async function fetchConnectors() {
  return northboundRequest.get<{ connectors: Northbound.Connector[] }>('/connectors')
}

/** 总览：等待数与拒绝数分开 */
export async function fetchOverview() {
  return northboundRequest.get<Northbound.Overview>('/overview')
}

/** 目标连接 */
export async function fetchConnections() {
  return northboundRequest.get<{ connections: Northbound.Connection[] }>('/connections')
}

export async function createConnection(body: {
  name: string
  connectorId: string
  config: Record<string, any>
  secrets?: Record<string, string>
}) {
  return northboundRequest.post<Northbound.Connection>('/connections', body)
}

export async function updateConnection(
  id: string,
  body: { name: string; config: Record<string, any>; secrets?: Record<string, string>; expectedRevision: number }
) {
  return northboundRequest.put<Northbound.Connection>(`/connections/${id}`, body)
}

export async function deleteConnection(id: string) {
  return northboundRequest.delete(`/connections/${id}`)
}

/** 真实打开目标；返回逐项检查结果 */
export async function testConnection(id: string, body: { config?: any; secrets?: Record<string, string> } = {}) {
  return northboundRequest.post<Northbound.ConnectionTest>(`/connections/${id}/test`, body)
}

/** 转发任务 */
export async function fetchPipelines() {
  return northboundRequest.get<{ pipelines: Northbound.Pipeline[] }>('/pipelines')
}

export async function createPipeline(body: {
  name: string
  connectionId: string
  filter: Record<string, any>
  transform: Record<string, any>
  serialization: Record<string, any>
}) {
  return northboundRequest.post<Northbound.Pipeline>('/pipelines', body)
}

export async function updatePipeline(
  id: string,
  body: {
    name: string
    connectionId: string
    filter: Record<string, any>
    transform: Record<string, any>
    serialization: Record<string, any>
    expectedRevision: number
  }
) {
  return northboundRequest.put<Northbound.Pipeline>(`/pipelines/${id}`, body)
}

export async function deletePipeline(id: string) {
  return northboundRequest.delete(`/pipelines/${id}`)
}

/** 预览：不发出去，只按当前版本算一遍 */
export async function previewPipeline(id: string, sample: Record<string, any>) {
  return northboundRequest.post<Northbound.PreviewResult>(`/pipelines/${id}/preview`, { sample })
}

/** 测试发送：走真实投递路径，事件 ID 带 test- 前缀 */
export async function testSendPipeline(id: string, sample: Record<string, any>) {
  return northboundRequest.post<{
    accepted: boolean
    deliveryId?: string
    state?: string
    eventId?: string
    message?: string
  }>(`/pipelines/${id}/test-send`, { sample })
}

export async function setPipelineState(id: string, action: 'activate' | 'pause' | 'disable') {
  return northboundRequest.post<Northbound.Pipeline>(`/pipelines/${id}/${action}`, {})
}

/** 投递记录 */
export async function fetchDeliveries(params: {
  pipelineId?: string
  state?: string
  deviceId?: string
  cursor?: string
  limit?: number
}) {
  return northboundRequest.get<{ deliveries: Northbound.Delivery[]; nextCursor?: string }>('/deliveries', { params })
}

/** 重放：未知结果必须显式确认风险 */
export async function replayDelivery(id: string, body: { reason: string; acknowledgeRisk?: boolean }) {
  return northboundRequest.post<{ deliveryId: string; state: string; message?: string }>(
    `/deliveries/${id}/replay`,
    body
  )
}

/** 社区侧源端状态（本机 Outbox / relay），走社区后端而不是北向服务 */
export async function fetchSourceStatus() {
  return request.get<Northbound.SourceStatus>('/northbound-source/status')
}
