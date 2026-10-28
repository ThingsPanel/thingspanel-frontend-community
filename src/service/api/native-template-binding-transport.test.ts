import assert from 'node:assert/strict'
import { test } from 'node:test'
import { fetchPublishedThingModels } from './native-template-binding-transport'
import type { ModelSummary } from './thingmodel-native-transport'

function model(modelID: string, lifecycle: ModelSummary['lifecycle'], publishedRevision: number | null): ModelSummary {
  return { modelID, name: modelID, lifecycle, draftRevision: 1, publishedRevision, updatedAt: '2026-10-18T00:00:00Z' }
}

test('fetches all pages and keeps only models with a published revision', async () => {
  const calls: Array<{ page: number; pageSize: number }> = []
  const pages: Record<number, ModelSummary[]> = {
    1: Array.from({ length: 100 }, (_, index) => model(`draft-${index}`, 'DRAFT', null)),
    2: [model('published-101', 'PUBLISHED', 3), model('published-without-revision', 'PUBLISHED', null), model('archived', 'ARCHIVED', 1)]
  }

  const result = await fetchPublishedThingModels(async options => {
    calls.push(options)
    return { items: pages[options.page] ?? [], page: options.page, pageSize: options.pageSize, total: 103 }
  })

  assert.deepEqual(calls, [{ page: 1, pageSize: 100 }, { page: 2, pageSize: 100 }])
  assert.deepEqual(result.map(item => item.modelID), ['published-101'])
})

test('stops on an empty page even when total is stale', async () => {
  const calls: number[] = []
  const result = await fetchPublishedThingModels(async ({ page, pageSize }) => {
    calls.push(page)
    return { items: page === 1 ? [model('ready', 'PUBLISHED', 1)] : [], page, pageSize, total: 500 }
  }, 1)

  assert.deepEqual(calls, [1, 2])
  assert.deepEqual(result.map(item => item.modelID), ['ready'])
})
