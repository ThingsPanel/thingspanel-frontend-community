import { thingmodelClient } from './client'

export interface CustomControl {
  id?: string
  thing_model_id?: string
  name: string
  description?: string
  content: string
  enable_status: 'enable' | 'disable'
  control_type?: string
}

export interface CustomControlPage {
  items: CustomControl[]
  total: number
  page: number
  page_size: number
}

export const customControlApi = {
  list: (thingModelId: string, page = 1, pageSize = 100) =>
    thingmodelClient.get<CustomControlPage>('/v1/custom-command-controls', {
      thing_model_id: thingModelId,
      page,
      page_size: pageSize
    }),

  create: (payload: CustomControl) =>
    thingmodelClient.post<CustomControl>('/v1/custom-command-controls', payload),

  update: (payload: CustomControl) =>
    thingmodelClient.put<CustomControl>('/v1/custom-command-controls', payload),

  delete: (id: string) =>
    thingmodelClient.delete<void>(`/v1/custom-command-controls/${id}`)
}
