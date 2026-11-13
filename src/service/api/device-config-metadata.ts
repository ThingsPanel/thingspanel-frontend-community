import axios from 'axios'
import { request } from '@/service/request'

const strongTag = /^"dc1-[a-f0-9]{64}"$/
export const templateVersionUnavailable = '模板版本信息加载失败，请重新加载后重试'

/** Per-request header capture, retaining the existing authentication/JSON stack. */
export async function readDeviceConfigMetadata(id: string) {
  let etag: string | null = null
  const defaults = axios.defaults.transformResponse
  const transforms = Array.isArray(defaults) ? defaults : defaults ? [defaults] : []
  const response = await request.get<any>(`device_config/${encodeURIComponent(id)}`, {
    transformResponse: function (data, headers, status) {
      // The workspace request package and app can use different Axios versions;
      // invoke defaults with the actual request context without casting configs.
      for (const transform of transforms) data = Reflect.apply(transform, this, [data, headers, status])
      const tag = headers?.etag
      if (typeof tag === 'string' && strongTag.test(tag)) etag = tag
      return data
    }
  })
  return { ...response, etag: response.error || response.data?.id !== id ? null : etag }
}

export async function saveDeviceConfigMetadata(data: { id: string; [field: string]: unknown }, etag: string | null) {
  if (!etag || !strongTag.test(etag)) return { data: null, error: new Error(templateVersionUnavailable) }
  try {
    return await request.put<any>('/device_config', data, { headers: { 'If-Match': etag }, silentError: true })
  } catch (error) {
    // The shared flat transport rejects with { data: null, error }. Keep this
    // metadata API's result contract for every editor without changing transport.
    return { data: null, error: unwrapTemplateRequestError(error) }
  }
}

function unwrapTemplateRequestError(error: unknown): unknown {
  if (error && typeof error === 'object' && 'error' in error) return error.error
  return error
}

export function templateSaveError(error: unknown): string {
  const actual = unwrapTemplateRequestError(error)
  type Failure = { status?: number; data?: { data?: { reason?: string } } }
  const failure = actual as (Failure & { response?: Failure }) | null | undefined
  const response = failure?.response || failure
  if (response?.status === 412 || response?.data?.data?.reason === 'template_revision_conflict') {
    return '模板已被其他操作修改，请重新加载后再保存'
  }
  if (actual instanceof Error && actual.message === templateVersionUnavailable) return templateVersionUnavailable
  return '模板保存失败，请稍后重试'
}
