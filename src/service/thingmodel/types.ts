export interface I18nString {
  default: string
  locales?: Record<string, string>
}

export interface PageQuery {
  page?: number
  page_size?: number
}

export interface ListData<T> {
  items: T[]
  page: number
  page_size: number
  total: number
}

export interface ThingModel {
  id?: string
  tenant_id?: string
  name: string
  description_i18n?: I18nString
  category?: string
  status?: string
  current_snapshot_id?: string
  created_at?: string
  updated_at?: string
}

export interface ThingModelItem {
  id?: string
  thing_model_id?: string
  tenant_id?: string
  type: 'PROPERTY' | 'EVENT' | 'COMMAND'
  identifier: string
  name_i18n: I18nString
  description_i18n?: I18nString
  value_type: Record<string, any>
  access: Record<string, any>
  web_chart_config?: Record<string, any>
  app_chart_config?: Record<string, any>
  meta_items?: Record<string, any>[] | any[]
  sort_order?: number
}

export interface DeviceTemplate {
  id?: string
  name: string
  brand?: string
  product_name?: string
  model_number?: string
  thing_model_id: string
  thing_model_snapshot_id: string
  protocol_type?: string
  protocol_config?: Record<string, any>
  voucher_type?: string
  connection_type?: string
  auto_register?: boolean
  online_config?: Record<string, any>
  tags?: string[]
  extras?: Record<string, any>
  description_i18n?: I18nString
  image_url?: string
  status?: string
}

export interface Product {
  id?: string
  name: string
  device_template_id: string
  product_key?: string
  sku?: string
  image_url?: string
  ota_package_id?: string
  description_i18n?: I18nString
}

export interface Device {
  id?: string
  device_template_id: string
  product_id?: string
  sn: string
  voucher?: string
  activate_flag?: string
  parent_device_id?: string
}

export interface MetaItemKey {
  id: string
  key: string
  label_i18n: I18nString
  scope: string
  value_schema: Record<string, any>
  is_builtin: boolean
}

export interface ValidateResponse {
  valid: boolean
  errors?: string[]
}
