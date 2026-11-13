<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NEmpty,
  NInput,
  NPagination,
  NSpin,
  NTree,
  type TreeOption
} from 'naive-ui'
import { getDeviceGroup, deviceListByGroup } from '@/service/api/device'

type Group = { id: string; parent_id?: string; name: string }
type Member = { id: string; name: string; device_number: string; device_config_name?: string }
const groups = ref<Group[]>([])
const members = ref<Member[]>([])
const selected = ref<string[]>([])
const search = ref('')
const loading = ref(false)
const memberLoading = ref(false)
const error = ref('')
const memberError = ref('')
const page = ref(1)
const total = ref(0)
let sequence = 0
const selectedName = computed(() => groups.value.find(g => g.id === selected.value[0])?.name || '')
const tree = computed(() => {
  const nodes = new Map<string, TreeOption>()
  for (const g of groups.value) nodes.set(g.id, { key: g.id, label: g.name || g.id, children: [] })
  const roots: TreeOption[] = []
  for (const g of groups.value) {
    const node = nodes.get(g.id)!
    const seen = new Set([g.id])
    let parent = g.parent_id
    let cycle = false
    while (parent && nodes.has(parent)) {
      if (seen.has(parent)) {
        cycle = true
        break
      }
      seen.add(parent)
      parent = groups.value.find(item => item.id === parent)?.parent_id
    }
    if (!cycle && g.parent_id && nodes.has(g.parent_id)) nodes.get(g.parent_id)!.children!.push(node)
    else roots.push(node)
  }
  return roots
})
const columns = [
  { title: '设备名称', key: 'name', ellipsis: { tooltip: true } },
  { title: '设备编号', key: 'device_number', ellipsis: { tooltip: true } },
  { title: '原设备模板', key: 'device_config_name', ellipsis: { tooltip: true } }
]
async function loadGroups() {
  loading.value = true
  error.value = ''
  try {
    const all: Group[] = []
    let expected = 0
    for (let p = 1; ; p++) {
      const response = await getDeviceGroup({ page: p, page_size: 100 })
      if (response.error || !response.data || !Array.isArray(response.data.list)) throw new Error('无法读取原有分组')
      const rows = response.data.list as Group[]
      expected = Number(response.data.total)
      if (!Number.isFinite(expected)) throw new Error('分组数量返回异常')
      for (const row of rows) if (!all.some(g => g.id === row.id)) all.push(row)
      if (all.length >= expected) break
      if (!rows.length || p >= 1000) throw new Error('原有分组未完整返回，请刷新重试')
    }
    groups.value = all
  } catch (e) {
    error.value = e instanceof Error ? e.message : '读取失败'
  } finally {
    loading.value = false
  }
}
async function loadMembers() {
  const request = ++sequence
  members.value = []
  total.value = 0
  memberError.value = ''
  if (!selected.value[0]) return
  memberLoading.value = true
  try {
    const response = await deviceListByGroup({ group_id: selected.value[0], page: page.value, page_size: 20 })
    if (request !== sequence) return
    if (response.error || !response.data || !Array.isArray(response.data.list)) throw new Error('无法读取分组成员')
    members.value = response.data.list
    total.value = Number(response.data.total)
  } catch (e) {
    if (request === sequence) memberError.value = e instanceof Error ? e.message : '读取失败'
  } finally {
    if (request === sequence) memberLoading.value = false
  }
}
function select(keys: Array<string | number>) {
  selected.value = keys.map(String)
  page.value = 1
  void loadMembers()
}
onMounted(loadGroups)
</script>
<template>
  <NCard>
    <div class="legacy-header">
      <strong>原有分组 · {{ groups.length }}</strong>
      <NButton @click="loadGroups">刷新</NButton>
    </div>
    <NAlert type="info" :show-icon="false" class="mb-4">原有分组与设备只读查看，尚未迁入新版管理。</NAlert>
    <NAlert v-if="error" type="error" class="mb-4">{{ error }}</NAlert>
    <div class="legacy-layout">
      <NSpin :show="loading">
        <NInput v-model:value="search" placeholder="搜索原有分组" clearable aria-label="搜索原有分组" class="mb-3" />
        <NTree :data="tree" :pattern="search" :selected-keys="selected" block-line @update:selected-keys="select" />
        <NEmpty v-if="!loading && !groups.length && !error" description="暂无原有分组" />
      </NSpin>
      <section class="legacy-members">
        <template v-if="selected.length">
          <h3>
            {{ selectedName }}
            <span>· {{ total }} 台设备</span>
          </h3>
          <NAlert v-if="memberError" type="error" class="mb-3">{{ memberError }}</NAlert>
          <NDataTable
            :columns="columns"
            :data="members"
            :loading="memberLoading"
            :row-key="(row: Member) => row.id"
            :scroll-x="560"
          />
          <NPagination
            v-model:page="page"
            :item-count="total"
            :page-size="20"
            class="mt-4"
            @update:page="loadMembers"
          />
        </template>
        <NEmpty v-else description="选择分组查看原有设备" />
      </section>
    </div>
  </NCard>
</template>
<style scoped>
.legacy-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.legacy-layout {
  display: grid;
  grid-template-columns: minmax(220px, 28%) minmax(0, 1fr);
  gap: 24px;
}
.legacy-members {
  min-width: 0;
}
.legacy-members h3 {
  margin: 0 0 16px;
}
.legacy-members h3 span {
  font-weight: 400;
  color: var(--text-color-3);
}
@media (max-width: 768px) {
  .legacy-layout {
    grid-template-columns: 1fr;
  }
}
</style>
