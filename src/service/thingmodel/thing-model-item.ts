import type { ListData, ThingModelItem } from './types'
import { thingmodelClient } from './client'

export const thingModelItemApi = {
  list: (thingModelId: string, params: { page?: number; page_size?: number; type?: string } = {}) =>
    thingmodelClient.get<ListData<ThingModelItem>>(`/api/thing-models/${thingModelId}/items`, params),
  create: (thingModelId: string, body: ThingModelItem) =>
    thingmodelClient.post<ThingModelItem>(`/api/thing-models/${thingModelId}/items`, body),
  batchCreate: (thingModelId: string, body: { items: ThingModelItem[] }) =>
    thingmodelClient.post<ThingModelItem[]>(`/api/thing-models/${thingModelId}/items/batch`, body),
  get: (thingModelId: string, id: string) => thingmodelClient.get<ThingModelItem>(`/api/thing-models/${thingModelId}/items/${id}`),
  update: (thingModelId: string, id: string, body: ThingModelItem) =>
    thingmodelClient.put<ThingModelItem>(`/api/thing-models/${thingModelId}/items/${id}`, body),
  delete: (thingModelId: string, id: string) => thingmodelClient.delete<void>(`/api/thing-models/${thingModelId}/items/${id}`)
}
