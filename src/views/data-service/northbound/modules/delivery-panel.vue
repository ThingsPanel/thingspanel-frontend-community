<script setup lang="ts">
import { h, onMounted, reactive, ref } from 'vue'
import {
  NButton,
  NCard,
  NDataTable,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NTag,
  useMessage
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { $t } from '@/locales'
import { fetchDeliveries, replayDelivery } from '@/service/api/northbound'
import { formatDateTime } from '@/utils/common/datetime'

const message = useMessage()
const loading = ref(false)
const rows = ref<Northbound.Delivery[]>([])
const nextCursor = ref('')
const filters = reactive({ state: null as string | null, deviceId: '' })
const replayVisible = ref(false)
const replayTarget = ref<Northbound.Delivery | null>(null)
const replayForm = reactive({ reason: '', acknowledgeRisk: false })

const stateOptions = [
  { label: $t('page.northbound.pending'), value: 'pending' },
  { label: $t('page.northbound.retryWait'), value: 'retry_wait' },
  { label: $t('page.northbound.delivered'), value: 'delivered' },
  { label: $t('page.northbound.unknown'), value: 'unknown' },
  { label: $t('page.northbound.dead'), value: 'dead' }
]

function stateTag(state: string) {
  const map: Record<string, string> = {
    delivered: 'success',
    pending: 'default',
    leased: 'info',
    retry_wait: 'warning',
    unknown: 'warning',
    dead: 'error'
  }
  return map[state] ?? 'default'
}

const columns: DataTableColumns<Northbound.Delivery> = [
  { title: $t('page.northbound.eventId'), key: 'eventId', width: 220, ellipsis: { tooltip: true } },
  { title: $t('page.northbound.device'), key: 'deviceId', width: 140, ellipsis: { tooltip: true } },
  { title: $t('page.northbound.pipeline'), key: 'pipelineName', width: 160, ellipsis: { tooltip: true } },
  {
    title: $t('page.northbound.state'),
    key: 'state',
    width: 120,
    render(row) {
      return h(NTag, { size: 'small', type: stateTag(row.state) as any }, { default: () => row.state })
    }
  },
  { title: $t('page.northbound.ackLevel'), key: 'ackLevel', width: 150, render: row => row.ackLevel || '-' },
  { title: $t('page.northbound.attempts'), key: 'attempts', width: 90 },
  {
    title: $t('page.northbound.failure'),
    key: 'failureCode',
    width: 200,
    render(row) {
      if (!row.failureCode) return '-'
      return h('span', { class: 'text-12px text-red-500' }, `${row.failureCode}${row.failureDetail ? ` · ${row.failureDetail}` : ''}`)
    }
  },
  { title: $t('page.northbound.updatedAt'), key: 'updatedAt', width: 170, render: row => formatDateTime(row.updatedAt) },
  {
    title: $t('page.northbound.actions'),
    key: 'actions',
    width: 110,
    render(row) {
      // 已送达与在途的记录不允许重放：前者会写出重复业务数据，后者会打断正在进行的发送。
      const disabled = row.state === 'delivered' || row.state === 'leased'
      return h(
        NButton,
        { size: 'tiny', disabled, onClick: () => openReplay(row) },
        { default: () => $t('page.northbound.replay') }
      )
    }
  }
]

async function load(cursor = '') {
  loading.value = true
  try {
    const { data } = await fetchDeliveries({
      state: filters.state ?? undefined,
      deviceId: filters.deviceId || undefined,
      cursor: cursor || undefined,
      limit: 50
    })
    const list = data?.deliveries ?? []
    rows.value = cursor ? [...rows.value, ...list] : list
    nextCursor.value = data?.nextCursor ?? ''
  } finally {
    loading.value = false
  }
}

function search() {
  nextCursor.value = ''
  load()
}

function openReplay(row: Northbound.Delivery) {
  replayTarget.value = row
  replayForm.reason = ''
  replayForm.acknowledgeRisk = false
  replayVisible.value = true
}

async function submitReplay() {
  if (!replayTarget.value) return
  if (!replayForm.reason.trim()) {
    message.warning($t('page.northbound.reasonRequired'))
    return
  }
  const { error } = await replayDelivery(replayTarget.value.id, {
    reason: replayForm.reason.trim(),
    acknowledgeRisk: replayForm.acknowledgeRisk
  })
  if (error) return
  message.success($t('page.northbound.replayQueued'))
  replayVisible.value = false
  await load()
}

onMounted(() => load())
</script>

<template>
  <NCard size="small">
    <template #header>
      <div class="flex items-center justify-between">
        <span>{{ $t('page.northbound.tabDeliveries') }}</span>
        <NSpace>
          <NSelect v-model:value="filters.state" clearable :options="stateOptions" :placeholder="$t('page.northbound.state')" style="width: 150px" size="small" />
          <NInput v-model:value="filters.deviceId" :placeholder="$t('page.northbound.device')" style="width: 180px" size="small" />
          <NButton size="small" @click="search">{{ $t('common.search') }}</NButton>
        </NSpace>
      </div>
    </template>

    <NDataTable :columns="columns" :data="rows" :loading="loading" :row-key="(r: Northbound.Delivery) => r.id" size="small" :max-height="520" virtual-scroll />
    <div v-if="nextCursor" class="mt-8px text-center">
      <NButton size="small" @click="load(nextCursor)">{{ $t('common.loadMore') }}</NButton>
    </div>

    <NModal v-model:show="replayVisible" preset="card" style="width: 520px" :title="$t('page.northbound.replay')">
      <NForm label-placement="top">
        <NFormItem :label="$t('page.northbound.replayReason')">
          <NInput v-model:value="replayForm.reason" type="textarea" :autosize="{ minRows: 2, maxRows: 4 }" />
        </NFormItem>
        <NFormItem v-if="replayTarget?.state === 'unknown'" :label="$t('page.northbound.acknowledgeRisk')">
          <NSpace align="center">
            <input v-model="replayForm.acknowledgeRisk" type="checkbox" />
            <span class="text-12px text-orange-500">{{ $t('page.northbound.acknowledgeRiskHint') }}</span>
          </NSpace>
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="replayVisible = false">{{ $t('common.cancel') }}</NButton>
          <NButton type="primary" @click="submitReplay">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </template>
    </NModal>
  </NCard>
</template>
