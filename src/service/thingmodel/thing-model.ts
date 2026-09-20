import type { ListData, ThingModel } from './types'
import { thingmodelClient } from './client'

export const thingModelApi = {
  list: (params: { page?: number; page_size?: number; search?: string } = {}) =>
    thingmodelClient.get<ListData<ThingModel>>('/api/thing-models', params),
  create: (body: ThingModel) => thingmodelClient.post<ThingModel>('/api/thing-models', body),
  get: (id: string) => thingmodelClient.get<ThingModel>(`/api/thing-models/${id}`),
  update: (id: string, body: ThingModel) => thingmodelClient.put<ThingModel>(`/api/thing-models/${id}`, body),
  delete: (id: string) => thingmodelClient.delete<void>(`/api/thing-models/${id}`),
  publish: (id: string, body: { changelog?: string }) => thingmodelClient.post(`/api/thing-models/${id}/publish`, body),
  rollback: (id: string, body: { target_version: number; changelog?: string }) =>
    thingmodelClient.post(`/api/thing-models/${id}/rollback`, body),
  deriveDraft: (id: string, body: { name?: string } = {}) => thingmodelClient.post<ThingModel>(`/api/thing-models/${id}/derive-draft`, body),
  archive: (id: string) => thingmodelClient.post<void>(`/api/thing-models/${id}/archive`),
  versions: (id: string) => thingmodelClient.get<{ items?: any[] }>(`/api/thing-models/${id}/versions`),
  version: (id: string, version: number) => thingmodelClient.get(`/api/thing-models/${id}/versions/${version}`),
  diff: (id: string, from: number, to: number) => thingmodelClient.get(`/api/thing-models/${id}/diff`, { from, to })
}
