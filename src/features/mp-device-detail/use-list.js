// Derived from ThingsPanel/app 74e0509; mini-program H5 owns this copy.
import { onBeforeUnmount, ref } from 'vue'

// 接口没有数据时并不保证返回空数组：可能是 null、缺省 list 字段，甚至直接返回数组。
// 这些都按「空列表」处理，只有 list 明确存在却不是数组时才算格式异常。
function readPageList(data) {
  if (data == null) return []
  if (Array.isArray(data)) return data
  if (typeof data !== 'object') return null
  if (Array.isArray(data.list)) return data.list
  if (data.list == null) return []
  return null
}

export function useDeviceList(fetchPage) {
  const items = ref([])
  const loading = ref(false)
  const error = ref('')
  const total = ref(0)
  let page = 0
  let version = 0
  let disposed = false
  onBeforeUnmount(() => {
    disposed = true
    version += 1
  })
  async function load(reset = false) {
    if (disposed) return
    if (loading.value && !reset) return
    const current = ++version
    const nextPage = reset ? 1 : page + 1
    if (reset) {
      items.value = []
      total.value = 0
      page = 0
    }
    loading.value = true
    error.value = ''
    try {
      const data = await fetchPage(nextPage)
      if (current !== version) return
      const list = readPageList(data)
      if (!list) throw new Error('服务返回的列表格式异常')
      items.value = reset ? list : items.value.concat(list)
      total.value = Number(data?.total ?? list.length) || 0
      page = nextPage
    } catch (cause) {
      if (current === version) error.value = cause.message || '加载失败，请重试'
    } finally {
      if (current === version) loading.value = false
    }
  }
  function invalidate() {
    version += 1
    loading.value = false
  }
  return { items, loading, error, total, load, invalidate }
}
