import { deviceTemplateDetail } from '@/service/api/device'

const templateDetailCache = new Map<string, Promise<any>>()

function normalizeTemplateId(templateId?: string | number | null) {
  if (templateId === undefined || templateId === null) return ''
  return String(templateId).trim()
}

export function clearCachedDeviceTemplateDetail(templateId?: string | number | null) {
  const normalizedTemplateId = normalizeTemplateId(templateId)
  if (!normalizedTemplateId) {
    templateDetailCache.clear()
    return
  }

  templateDetailCache.delete(normalizedTemplateId)
}

export function getCachedDeviceTemplateDetail(templateId?: string | number | null) {
  const normalizedTemplateId = normalizeTemplateId(templateId)
  if (!normalizedTemplateId) {
    return Promise.resolve({ data: null, error: null })
  }

  const cached = templateDetailCache.get(normalizedTemplateId)
  if (cached) return cached

  const request = deviceTemplateDetail({ id: normalizedTemplateId }).catch(error => {
    templateDetailCache.delete(normalizedTemplateId)
    throw error
  })

  templateDetailCache.set(normalizedTemplateId, request)
  return request
}
