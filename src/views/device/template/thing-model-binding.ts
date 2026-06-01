import type { ThingModelItem } from '@/service/thingmodel/types'

export interface LegacyThingModelBinding {
  thingModelId: string
  thingModelSnapshotId?: string
  snapshotVersion?: number | null
}

interface SnapshotContentItem {
  type?: string
  identifier?: string
  name_i18n?: Record<string, any>
  description_i18n?: Record<string, any>
  value_type?: Record<string, any>
  access?: Record<string, any>
  web_chart_config?: Record<string, any>
  app_chart_config?: Record<string, any>
  meta_items?: Record<string, any>[]
  sort_order?: number
}

interface SnapshotContent {
  items?: SnapshotContentItem[]
}

function parseJsonObject<T>(raw?: string | null): T | null {
  if (!raw || typeof raw !== 'string') return null

  try {
    const parsed = JSON.parse(raw) as T
    if (parsed && typeof parsed === 'object') {
      return parsed
    }
  } catch {
    // ignore malformed legacy payloads
  }

  return null
}

export function parseLegacyThingModelBinding(raw?: string | null): LegacyThingModelBinding | null {
  const parsed = parseJsonObject<LegacyThingModelBinding>(raw)
  if (!parsed?.thingModelId) return null

  return {
    thingModelId: parsed.thingModelId,
    thingModelSnapshotId: parsed.thingModelSnapshotId,
    snapshotVersion: parsed.snapshotVersion ?? null
  }
}

export function serializeLegacyThingModelBinding(binding: LegacyThingModelBinding | null): string {
  if (!binding?.thingModelId) return ''

  return JSON.stringify({
    thingModelId: binding.thingModelId,
    thingModelSnapshotId: binding.thingModelSnapshotId || undefined,
    snapshotVersion: binding.snapshotVersion ?? undefined
  })
}

export function extractLegacyThingModelBinding(template: { remark?: string | null } | null | undefined) {
  return parseLegacyThingModelBinding(template?.remark)
}

export function getPropertyStorePolicy(item: Pick<ThingModelItem, 'meta_items'>) {
  const metaItems = Array.isArray(item.meta_items) ? item.meta_items : []
  const storePolicyMeta = metaItems.find(meta => meta?.key === 'store_policy')

  if (typeof storePolicyMeta?.value === 'string' && storePolicyMeta.value.trim()) {
    return storePolicyMeta.value
  }

  return 'latest_only'
}

export function partitionThingModelItems(items: ThingModelItem[]) {
  const telemetry: ThingModelItem[] = []
  const attributes: ThingModelItem[] = []
  const events: ThingModelItem[] = []
  const commands: ThingModelItem[] = []

  items.forEach(item => {
    if (item.type === 'PROPERTY') {
      if (getPropertyStorePolicy(item) === 'history') {
        telemetry.push(item)
      } else {
        attributes.push(item)
      }
      return
    }

    if (item.type === 'EVENT') {
      events.push(item)
      return
    }

    if (item.type === 'COMMAND') {
      commands.push(item)
    }
  })

  return { telemetry, attributes, events, commands }
}

export function itemsFromSnapshotContent(content: unknown, thingModelId: string): ThingModelItem[] {
  if (!content) return []

  const parsed = typeof content === 'string' ? parseJsonObject<SnapshotContent>(content) : (content as SnapshotContent)
  const items = Array.isArray(parsed?.items) ? parsed.items : []

  return items.map((item, index) => ({
    id: `${thingModelId}:${item.identifier || index}`,
    thing_model_id: thingModelId,
    type: (item.type as ThingModelItem['type']) || 'PROPERTY',
    identifier: item.identifier || `item_${index}`,
    name_i18n: ((item.name_i18n as any) || { default: item.identifier || `item_${index}` }) as any,
    description_i18n: item.description_i18n as any,
    value_type: item.value_type || {},
    access: item.access || {},
    web_chart_config: item.web_chart_config,
    app_chart_config: item.app_chart_config,
    meta_items: item.meta_items || [],
    sort_order: item.sort_order || index
  }))
}
