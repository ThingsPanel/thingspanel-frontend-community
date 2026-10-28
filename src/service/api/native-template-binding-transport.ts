import type { ModelSummary, PageModelSummary } from './thingmodel-native-transport'

export type ThingModelListPage = (options: { page: number; pageSize: number }) => Promise<PageModelSummary>

/** Fetch every page and apply publication filtering locally for API versions without filter support. */
export async function fetchPublishedThingModels(
  listPage: ThingModelListPage,
  pageSize = 100
): Promise<ModelSummary[]> {
  const items: ModelSummary[] = []
  let page = 1
  while (true) {
    const result = await listPage({ page, pageSize })
    items.push(...result.items)
    const effectivePageSize = result.pageSize || pageSize
    if (!result.items.length || page * effectivePageSize >= result.total) break
    page += 1
  }
  return items.filter(item => item.lifecycle === 'PUBLISHED' && item.publishedRevision != null)
}
