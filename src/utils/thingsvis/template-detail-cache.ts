import { deviceTemplateDetail } from '@/service/api/device'

const templateDetailCache = new Map<string, Promise<any>>()

function normalizeTemplateId(templateId?: string | number) {
  return String(templateId || '').trim()
}

export function clearCachedDeviceTemplateDetail(templateId?: string | number) {
  const normalizedTemplateId = normalizeTemplateId(templateId)
  if (!normalizedTemplateId) return
  templateDetailCache.delete(normalizedTemplateId)
}

export function getCachedDeviceTemplateDetail(templateId?: string | number) {
  const normalizedTemplateId = normalizeTemplateId(templateId)
  if (!normalizedTemplateId) {
    return Promise.resolve(null)
  }

  const cached = templateDetailCache.get(normalizedTemplateId)
  if (cached) return cached

  const request = deviceTemplateDetail({ id: normalizedTemplateId })
    .catch(error => {
      templateDetailCache.delete(normalizedTemplateId)
      throw error
    })

  templateDetailCache.set(normalizedTemplateId, request)
  return request
}
