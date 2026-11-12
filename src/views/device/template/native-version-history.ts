import { reactive } from 'vue'
import type {
  PageVersionSummary,
  SnapshotDetail,
  VersionSummary
} from '../../../service/api/thingmodel-native-transport'

type HistoryAPI = {
  versions(id: string, options: { page: number; pageSize: number }): Promise<PageVersionSummary>
  version(id: string, revision: number): Promise<SnapshotDetail>
}

export function createVersionHistory(api: HistoryAPI) {
  const state = reactive({
    loading: false,
    failure: null as 'list' | 'snapshot' | null,
    versions: [] as VersionSummary[],
    selectedVersion: null as number | null,
    snapshot: null as SnapshotDetail | null,
    page: 1,
    pageSize: 100,
    total: 0
  })
  let modelID = ''
  let generation = 0
  let selection = 0
  async function selectVersion(version: number | null) {
    const session = generation
    const request = ++selection
    const id = modelID
    state.selectedVersion = version
    state.snapshot = null
    state.failure = null
    if (version === null || !id) {
      state.loading = false
      return
    }
    state.loading = true
    try {
      const snapshot = await api.version(id, version)
      if (session === generation && request === selection) state.snapshot = snapshot
    } catch (error) {
      console.error('读取物模型历史快照失败:', error)
      if (session === generation && request === selection) state.failure = 'snapshot'
    } finally {
      if (session === generation && request === selection) state.loading = false
    }
  }
  async function loadPage(page: number) {
    if (!modelID) return
    const session = ++generation
    ++selection
    const id = modelID
    state.page = page
    state.loading = true
    state.failure = null
    state.versions = []
    state.selectedVersion = null
    state.snapshot = null
    try {
      const result = await api.versions(id, { page, pageSize: state.pageSize })
      if (session !== generation) return
      state.total = result.total
      state.versions = [...result.items].sort((a, b) => b.publishedRevision - a.publishedRevision)
      if (state.versions.length) await selectVersion(state.versions[0].publishedRevision)
    } catch (error) {
      console.error('读取物模型历史列表失败:', error)
      if (session === generation) state.failure = 'list'
    } finally {
      if (session === generation && state.selectedVersion === null) state.loading = false
    }
  }
  function close() {
    ++generation
    ++selection
    modelID = ''
    state.loading = false
    state.failure = null
    state.versions = []
    state.snapshot = null
    state.selectedVersion = null
    state.total = 0
  }
  function open(id: string) {
    close()
    modelID = id
    return loadPage(1)
  }
  const retry = () => (state.failure === 'list' ? loadPage(state.page) : selectVersion(state.selectedVersion))
  return { state, open, close, loadPage, selectVersion, retry }
}
