import type { ListData, Product } from './types'
import { thingmodelClient } from './client'

export const productApi = {
  list: (params: { page?: number; page_size?: number } = {}) => thingmodelClient.get<ListData<Product>>('/api/products', params),
  create: (body: Product) => thingmodelClient.post<Product>('/api/products', body),
  get: (id: string) => thingmodelClient.get<Product>(`/api/products/${id}`),
  update: (id: string, body: Product) => thingmodelClient.put<Product>(`/api/products/${id}`, body),
  delete: (id: string) => thingmodelClient.delete<void>(`/api/products/${id}`)
}
