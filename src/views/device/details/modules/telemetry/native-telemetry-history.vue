<script setup lang="ts">
import { ref, watch } from 'vue'
import { deviceRuntimeNative, type Reading } from '@/service/api/device-runtime-native'
const props = defineProps<{ id: string }>()
const identifier = ref('')
const range = ref<[number, number]>([Date.now() - 3600000, Date.now()])
const rows = ref<Reading[]>([])
const total = ref(0)
const page = ref(1)
const loading = ref(false)
const error = ref('')
let sequence = 0
async function query(next = 1) {
  const request = ++sequence
  rows.value = []
  total.value = 0
  error.value = ''
  loading.value = false
  if (!identifier.value.trim()) {
    error.value = '请输入遥测标识符'
    return
  }
  if (!range.value || range.value[1] <= range.value[0] || range.value[1] - range.value[0] > 86400000) {
    error.value = '请选择不超过 24 小时的有效时间范围'
    return
  }
  loading.value = true
  try {
    const result = await deviceRuntimeNative.listReadings(props.id, {
      kind: 'telemetry',
      identifier: identifier.value.trim(),
      from: new Date(range.value[0]).toISOString(),
      to: new Date(range.value[1]).toISOString(),
      page: next,
      pageSize: 20
    })
    if (request !== sequence) return
    rows.value = result.items
    total.value = result.total
    page.value = next
  } catch (e) {
    if (request === sequence) error.value = e instanceof Error ? e.message : '历史查询失败'
  } finally {
    if (request === sequence) loading.value = false
  }
}
watch(
  () => props.id,
  () => {
    sequence++
    rows.value = []
    total.value = 0
    error.value = ''
    loading.value = false
    loading.value = false
  }
)
const columns = [
  { title: '时间', key: 'observedAt', render: (r: Reading) => new Date(r.observedAt).toLocaleString() },
  { title: '标识符', key: 'identifier' },
  { title: '值', key: 'value', render: (r: Reading) => JSON.stringify(r.value) ?? '—' }
]
</script>
<template>
  <n-card title="遥测历史" class="mb-4">
    <n-space class="mb-4" wrap>
      <n-input v-model:value="identifier" placeholder="遥测标识符" clearable />
      <n-date-picker v-model:value="range" type="datetimerange" />
      <n-button type="primary" :loading="loading" @click="query(1)">查询</n-button>
    </n-space>
    <n-alert v-if="error" type="error" class="mb-4">{{ error }}</n-alert>
    <n-data-table :columns="columns" :data="rows" :loading="loading" :row-key="(r: Reading) => r.sampleId" />
    <n-pagination v-if="total" class="mt-4" :page="page" :page-size="20" :item-count="total" @update:page="query" />
  </n-card>
</template>
