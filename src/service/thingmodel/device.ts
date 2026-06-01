import type { Device, ListData } from './types'
import { thingmodelClient } from './client'

export const deviceApi = {
  list: (params: { page?: number; page_size?: number; sn?: string } = {}) => thingmodelClient.get<ListData<Device>>('/api/devices', params),
  create: (body: Device) => thingmodelClient.post<Device>('/api/devices', body),
  get: (id: string) => thingmodelClient.get<Device>(`/api/devices/${id}`),
  update: (id: string, body: Device) => thingmodelClient.put<Device>(`/api/devices/${id}`, body),
  delete: (id: string) => thingmodelClient.delete<void>(`/api/devices/${id}`),
  latest: async (id: string) => {
    const resp = await thingmodelClient.get<{ values?: Record<string, any> }>(`/api/devices/${id}/latest`)
    return resp.values || {}
  },
  actuate: (id: string, body: { msgId?: string; identifier: string; params: Record<string, any> }) =>
    thingmodelClient.post(`/api/devices/${id}/actuate`, body)
}
