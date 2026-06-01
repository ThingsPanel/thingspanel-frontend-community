import type { DeviceTemplate, ListData } from './types'
import { thingmodelClient } from './client'

export const deviceTemplateApi = {
  list: (params: { page?: number; page_size?: number; thing_model_id?: string; status?: string } = {}) =>
    thingmodelClient.get<ListData<DeviceTemplate>>('/api/device-templates', params),
  create: (body: DeviceTemplate) => thingmodelClient.post<DeviceTemplate>('/api/device-templates', body),
  get: (id: string) => thingmodelClient.get<DeviceTemplate>(`/api/device-templates/${id}`),
  update: (id: string, body: DeviceTemplate) => thingmodelClient.put<DeviceTemplate>(`/api/device-templates/${id}`, body),
  delete: (id: string) => thingmodelClient.delete<void>(`/api/device-templates/${id}`),
  publish: (id: string) => thingmodelClient.post<void>(`/api/device-templates/${id}/publish`),
  archive: (id: string) => thingmodelClient.post<void>(`/api/device-templates/${id}/archive`),
  deriveDraft: (id: string) => thingmodelClient.post<DeviceTemplate>(`/api/device-templates/${id}/derive-draft`),
  bindThingModel: (id: string, thing_model_snapshot_id: string) =>
    thingmodelClient.post<DeviceTemplate>(`/api/device-templates/${id}/bind-thing-model`, { thing_model_snapshot_id })
}
