<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NAlert, NButton, NDataTable, NSpace, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { h } from 'vue'
import { $t } from '@/locales'
import { SystemApiError, systemApi } from '@/service/api/system'
import type { BackupItem } from '@/service/api/system'
import { useSystemManageStore } from '@/store/modules/system-manage'
import { formatBytes } from '@/utils/system-format'

defineOptions({ name: 'BackupPanel' })

const store = useSystemManageStore()
const rows = ref<BackupItem[]>([])
const loading = ref(false)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    rows.value = await systemApi.listBackups()
  } catch (e) {
    error.value = e instanceof Error ? e.message : $t('system-manage.common.failed')
  } finally {
    loading.value = false
  }
}

function describe(e: unknown): string {
  if (e instanceof SystemApiError && e.detailCode === 'system_busy') return $t('system-manage.common.busy')
  return e instanceof Error ? e.message : $t('system-manage.common.failed')
}

function createBackup() {
  window.$dialog?.info({
    title: $t('system-manage.backup.create'),
    content: $t('system-manage.backup.createConfirm'),
    positiveText: $t('system-manage.common.confirm'),
    negativeText: $t('system-manage.common.cancel'),
    async onPositiveClick() {
      try {
        const { operation } = await systemApi.createBackup()
        store.startOperation(operation)
      } catch (e) {
        if (!(e instanceof SystemApiError && e.maintenance)) error.value = describe(e)
      }
    }
  })
}

function restore(row: BackupItem) {
  window.$dialog?.warning({
    title: $t('system-manage.backup.restore'),
    content: $t('system-manage.backup.restoreConfirm', { name: row.name }),
    positiveText: $t('system-manage.backup.restore'),
    negativeText: $t('system-manage.common.cancel'),
    async onPositiveClick() {
      try {
        const { operation } = await systemApi.restoreBackup(row.name)
        store.startOperation(operation)
      } catch (e) {
        if (!(e instanceof SystemApiError && e.maintenance)) error.value = describe(e)
      }
    }
  })
}

function remove(row: BackupItem) {
  window.$dialog?.error({
    title: $t('system-manage.backup.delete'),
    content: $t('system-manage.backup.deleteConfirm', { name: row.name }),
    positiveText: $t('system-manage.backup.delete'),
    negativeText: $t('system-manage.common.cancel'),
    async onPositiveClick() {
      try {
        await systemApi.deleteBackup(row.name)
        window.$message?.success($t('system-manage.backup.deleted'))
        await load()
      } catch (e) {
        error.value = describe(e)
      }
    }
  })
}

function triggerLabel(trigger: string) {
  const key = trigger.replace(/-/g, '_')
  return ['manual', 'scheduled', 'upgrade', 'pre_upgrade', 'pre_restore'].includes(key)
    ? $t(`system-manage.backup.triggers.${key}`)
    : trigger
}

const columns = (): DataTableColumns<BackupItem> => [
  { title: $t('system-manage.backup.time'), key: 'created_at', render: r => new Date(r.created_at).toLocaleString() },
  { title: $t('system-manage.backup.version'), key: 'platform_version' },
  { title: $t('system-manage.backup.size'), key: 'size', render: r => formatBytes(r.size) },
  { title: $t('system-manage.backup.trigger'), key: 'trigger', render: r => triggerLabel(r.trigger) },
  {
    title: $t('system-manage.backup.history'),
    key: 'history',
    render: r => (r.history ? $t('system-manage.backup.yes') : $t('system-manage.backup.no'))
  },
  {
    title: $t('system-manage.backup.valid'),
    key: 'valid',
    render: r =>
      h(NTag, { type: r.valid ? 'success' : 'error', size: 'small' }, () =>
        r.valid ? $t('system-manage.backup.yes') : $t('system-manage.backup.invalid')
      )
  },
  {
    title: $t('system-manage.backup.actions'),
    key: 'actions',
    render: r =>
      h(NSpace, null, () => [
        h(NButton, { size: 'small', type: 'warning', disabled: !r.valid, onClick: () => restore(r) }, () =>
          $t('system-manage.backup.restore')
        ),
        h(NButton, { size: 'small', type: 'error', ghost: true, onClick: () => remove(r) }, () =>
          $t('system-manage.backup.delete')
        )
      ])
  }
]

onMounted(load)
</script>

<template>
  <NSpace vertical :size="12">
    <NSpace justify="space-between">
      <b>{{ $t('system-manage.backup.title') }}</b>
      <NButton type="primary" data-test="backup-create" @click="createBackup">
        {{ $t('system-manage.backup.create') }}
      </NButton>
    </NSpace>
    <NAlert v-if="error" type="error" closable @close="error = ''">{{ error }}</NAlert>
    <NDataTable
      :columns="columns()"
      :data="rows"
      :loading="loading"
      :bordered="false"
      :row-key="(r: BackupItem) => r.name"
    />
    <div v-if="!loading && rows.length === 0 && !error" class="opacity-60">{{ $t('system-manage.backup.empty') }}</div>
  </NSpace>
</template>
