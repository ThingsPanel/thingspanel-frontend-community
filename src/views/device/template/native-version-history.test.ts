import assert from 'node:assert/strict'
import test from 'node:test'
import { createVersionHistory } from './native-version-history'
import type { PageVersionSummary, SnapshotDetail } from '../../../service/api/thingmodel-native-transport'

const page = (p: number): PageVersionSummary =>
  ({ page: p, pageSize: 100, total: 101, items: [{ publishedRevision: p === 1 ? 101 : 1 }] }) as PageVersionSummary
const snapshot = (revision: number) => ({ publishedRevision: revision }) as SnapshotDetail
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => {
    resolve = done
  })
  return { promise, resolve }
}
test('version older than the first 100 is selectable', async () => {
  const requested: number[] = []
  const history = createVersionHistory({
    versions: async (_, options) => {
      requested.push(options.page)
      return page(options.page)
    },
    version: async (_, version) => snapshot(version)
  })
  await history.open('model')
  await history.loadPage(2)
  assert.deepEqual(requested, [1, 2])
  assert.equal(history.state.snapshot?.publishedRevision, 1)
})
test('late list response cannot overwrite a newer model or reopen a closed modal', async () => {
  const old = deferred<PageVersionSummary>()
  const history = createVersionHistory({
    versions: async id => (id === 'old' ? old.promise : page(2)),
    version: async (_, version) => snapshot(version)
  })
  const first = history.open('old')
  await history.open('new')
  old.resolve(page(1))
  await first
  assert.equal(history.state.selectedVersion, 1)
  const late = deferred<PageVersionSummary>()
  const closed = createVersionHistory({
    versions: () => late.promise,
    version: async (_, version) => snapshot(version)
  })
  const pending = closed.open('model')
  closed.close()
  late.resolve(page(1))
  await pending
  assert.equal(closed.state.versions.length, 0)
  assert.equal(closed.state.loading, false)
})
test('late snapshot cannot replace the selected page or clear its loading state', async () => {
  const old = deferred<SnapshotDetail>()
  const history = createVersionHistory({
    versions: async (_, options) => page(options.page),
    version: async (_, version) => (version === 101 ? old.promise : snapshot(version))
  })
  const first = history.open('model')
  await new Promise(resolve => setImmediate(resolve))
  await history.loadPage(2)
  old.resolve(snapshot(101))
  await first
  assert.equal(history.state.snapshot?.publishedRevision, 1)
  history.close()
  assert.equal(history.state.snapshot, null)
})
test('initial snapshot finishing does not clear a newer selection loading indicator', async () => {
  const initial = deferred<SnapshotDetail>()
  const next = deferred<SnapshotDetail>()
  const history = createVersionHistory({
    versions: async () => page(1),
    version: async (_, version) => (version === 101 ? initial.promise : next.promise)
  })
  const opening = history.open('model')
  await new Promise(resolve => setImmediate(resolve))
  const selecting = history.selectVersion(100)
  initial.resolve(snapshot(101))
  await opening
  assert.equal(history.state.loading, true)
  assert.equal(history.state.snapshot, null)
  next.resolve(snapshot(100))
  await selecting
  assert.equal(history.state.loading, false)
  assert.equal((history.state.snapshot as SnapshotDetail | null)?.publishedRevision, 100)
})
