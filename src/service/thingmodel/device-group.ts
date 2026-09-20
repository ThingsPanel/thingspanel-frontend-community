import type { Device, DeviceGroup, ListData } from './types'
import { thingmodelClient } from './client'

export const deviceGroupApi = {
  list: (params: { page?: number; page_size?: number; parent_id?: string; query?: string } = {}) =>
    thingmodelClient.get<ListData<DeviceGroup>>('/api/device-groups', params),
  tree: () => thingmodelClient.get<{ items: DeviceGroup[] }>('/api/device-group-tree'),
  get: (id: string) => thingmodelClient.get<DeviceGroup>(`/api/device-groups/${id}`),
  create: (body: DeviceGroup) => thingmodelClient.post<DeviceGroup>('/api/device-groups', body),
  update: (id: string, body: DeviceGroup) => thingmodelClient.put<DeviceGroup>(`/api/device-groups/${id}`, body),
  delete: (id: string) => thingmodelClient.delete<void>(`/api/device-groups/${id}`),
  devices: (id: string, params: { page?: number; page_size?: number } = {}) =>
    thingmodelClient.get<ListData<Device>>(`/api/device-groups/${id}/devices`, params),
  deviceGroups: (deviceId: string) => thingmodelClient.get<{ items: DeviceGroup[] }>(`/api/devices/${deviceId}/device-groups`),
  bind: (groupId: string, deviceId: string) => thingmodelClient.post<void>(`/api/device-groups/${groupId}/devices/${deviceId}`),
  unbind: (groupId: string, deviceId: string) => thingmodelClient.delete<void>(`/api/device-groups/${groupId}/devices/${deviceId}`)
}
