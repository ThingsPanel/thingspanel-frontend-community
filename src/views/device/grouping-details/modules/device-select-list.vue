<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { DataTableColumns, DataTableRowKey, PaginationProps } from 'naive-ui'
import { NButton, NDataTable, NEmpty, NFlex, useMessage } from 'naive-ui'
import { canManageDeviceGroups } from '@/service/api/device-group-editor-state'
import { deviceGroupNative, DeviceGroupNativeError } from '@/service/api/device-group-native'
import {
  createOrReuseDeviceGroupMembershipIntent,
  isCurrentDeviceGroupMembershipSession,
  type DeviceGroupMembershipIntent
} from '@/service/api/device-group-membership-state'
import { deviceNative, type DevicePage } from '@/service/api/device-native'
import { $t } from '@/locales'
import { useAuthStore } from '@/store/modules/auth'

// eslint-disable-next-line vue/define-emits-declaration
const emit = defineEmits(['closed_modal', 'refresh_data', 'version_reloaded'])

interface Props {
  // eslint-disable-next-line vue/prop-name-casing
  groupId: string
  groupVersion: number
  active: boolean
}

const props = defineProps<Props>()
type NativeDevice = DevicePage['items'][number]
const authStore = useAuthStore()
const canManageGroups = computed(() => canManageDeviceGroups(authStore.userInfo.roles))
const message = useMessage()
const data = ref<NativeDevice[]>([])
const checkedRowKeysRef = ref<DataTableRowKey[]>([])
const searchKeyword = ref('')
const loadError = ref('')
const operationError = ref('')
const loading = ref(false)
const submitting = ref(false)
const conflict = ref(false)
const versionAtOpen = ref<number | null>(null)
const pendingIntent = ref<DeviceGroupMembershipIntent | null>(null)
let requestGeneration = 0
let sessionGeneration = 0
let sessionGroupId = ''
const isCurrentSession = (captured: { groupId: string; generation: number }) =>
  isCurrentDeviceGroupMembershipSession(captured, props.active, props.groupId, sessionGeneration)
const queryParams = reactive<{ page: number; pageSize: number; search?: string }>({ page: 1, pageSize: 5 })
const tableThemeOverrides = {
  borderColor: 'var(--border-color)',
  borderRadius: '10px',
  fontSizeMedium: '14px',
  lineHeight: '1.5',
  thColor: 'var(--body-color)',
  thColorHover: 'var(--body-color)',
  thFontWeight: '400',
  thTextColor: 'var(--text-color)',
  tdColor: 'var(--card-color)',
  tdColorHover: 'var(--primary-color-suppl)',
  tdColorSorting: 'var(--primary-color-suppl)',
  tdTextColor: 'var(--text-color)',
  thPaddingMedium: '12px',
  tdPaddingMedium: '13px 12px'
}

const loadDeviceList = async (): Promise<boolean> => {
  if (!props.active || !props.groupId) return false
  const generation = ++requestGeneration
  const groupId = props.groupId
  const isCurrentRequest = () => generation === requestGeneration && props.active && props.groupId === groupId
  loading.value = true
  loadError.value = ''
  try {
    const page = await deviceNative.list({
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      search: searchKeyword.value.trim() || undefined
    })
    if (!isCurrentRequest()) return false
    data.value = page.items
    pagination.itemCount = page.total
    pagination.pageCount = Math.max(1, Math.ceil(page.total / queryParams.pageSize))
    return true
  } catch (error) {
    if (isCurrentRequest()) {
      data.value = []
      loadError.value = error instanceof Error ? error.message : $t('common.fetchDataFailed')
    }
    return false
  } finally {
    if (isCurrentRequest()) loading.value = false
  }
}

const pagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 5,
  onChange: (page: number) => {
    if (submitting.value) return
    pagination.page = page
    queryParams.page = page
    void loadDeviceList()
  }
})
const rowKey = (row: NativeDevice) => row.id
const handleCheck = (rowKeys: DataTableRowKey[]) => {
  if (submitting.value) return
  const uniqueKeys = [...new Set(rowKeys)]
  if (uniqueKeys.length > 100) message.warning('一次最多可选择100台设备。')
  checkedRowKeysRef.value = uniqueKeys.slice(0, 100)
}
const deviceColumns: DataTableColumns<NativeDevice> = [
  { type: 'selection', disabled: () => submitting.value },
  { title: () => $t('custom.devicePage.deviceName'), key: 'name', render: row => row.name || '-' },
  { title: () => $t('custom.devicePage.deviceNumber'), key: 'deviceNumber', render: row => row.deviceNumber || '-' },
  { title: () => '设备类型', key: 'deviceKind', render: row => row.deviceKind },
  { title: () => '管理状态', key: 'administrativeState', render: row => row.administrativeState }
]
const handleSearch = () => {
  if (submitting.value) return
  pagination.page = 1
  queryParams.page = 1
  checkedRowKeysRef.value = []
  void loadDeviceList()
}
const handleReset = () => {
  if (submitting.value) return
  searchKeyword.value = ''
  handleSearch()
}
const closeModal = () => {
  sessionGeneration += 1
  submitting.value = false
  // eslint-disable-next-line vue/custom-event-name-casing
  emit('closed_modal', false)
}
const reload = () => {
  // eslint-disable-next-line vue/custom-event-name-casing
  emit('refresh_data', true)
}
const submit_data = async () => {
  if (!canManageGroups.value || loading.value || submitting.value || conflict.value || loadError.value) return
  if (versionAtOpen.value === null) {
    operationError.value = '未能读取当前分组版本，请关闭弹窗后重试。'
    return
  }
  const ids = checkedRowKeysRef.value.filter((id): id is string => typeof id === 'string')
  if (ids.length === 0) {
    message.warning('请选择至少一台设备。')
    return
  }
  let intent: DeviceGroupMembershipIntent
  try {
    intent = createOrReuseDeviceGroupMembershipIntent(
      pendingIntent.value,
      'add',
      props.groupId,
      versionAtOpen.value,
      ids
    )
  } catch (error) {
    operationError.value = error instanceof Error ? error.message : $t('common.saveFailed')
    return
  }
  pendingIntent.value = intent
  operationError.value = ''
  const session = { groupId: props.groupId, generation: sessionGeneration }
  submitting.value = true
  try {
    await deviceGroupNative.addMembers(intent.groupId, intent.body, intent.key)
    if (!isCurrentSession(session)) return
    pendingIntent.value = null
    checkedRowKeysRef.value = []
    conflict.value = false
    submitting.value = false
    reload()
    closeModal()
  } catch (error) {
    if (!isCurrentSession(session)) return
    if (error instanceof DeviceGroupNativeError && (error.status === 409 || error.status === 412)) {
      conflict.value = true
      operationError.value = '分组已发生变化。当前选择已保留；确认重新加载最新版本后才能继续。'
    } else {
      operationError.value = error instanceof Error ? error.message : $t('common.saveFailed')
    }
  } finally {
    if (isCurrentSession(session)) submitting.value = false
  }
}
const requestReloadLatestVersion = () => {
  if (!conflict.value || !props.active || submitting.value) return
  const groupId = props.groupId
  const session = { groupId, generation: sessionGeneration }
  const generation = requestGeneration
  window.$dialog?.warning({
    title: '分组已发生变化',
    content: '确认后会读取最新分组版本并刷新当前设备列表；现有搜索和设备选择会保留，不会自动提交。',
    positiveText: '重新加载最新版本',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const latest = await deviceGroupNative.get(groupId)
        if (!isCurrentSession(session) || requestGeneration !== generation) return
        versionAtOpen.value = latest.group.resourceVersion
        conflict.value = false
        pendingIntent.value = null
        operationError.value = ''
        emit('version_reloaded', latest.group)
        // Notify the page to refresh its displayed group version, without submitting again.
        reload()
        await loadDeviceList()
      } catch (error) {
        if (!isCurrentSession(session)) return
        operationError.value = error instanceof Error ? error.message : $t('common.fetchDataFailed')
      }
    }
  })
}
watch(
  () => props.active,
  active => {
    sessionGeneration += 1
    if (!active) {
      submitting.value = false
      return
    }
    submitting.value = false
    const canReusePending =
      pendingIntent.value?.groupId === props.groupId &&
      pendingIntent.value.body.expectedGroupVersion === props.groupVersion
    if (sessionGroupId !== props.groupId) {
      checkedRowKeysRef.value = []
      pendingIntent.value = null
      conflict.value = false
    } else if (!canReusePending && !conflict.value) {
      checkedRowKeysRef.value = []
    }
    sessionGroupId = props.groupId
    versionAtOpen.value = props.groupVersion > 0 ? props.groupVersion : null
    pagination.page = 1
    queryParams.page = 1
    void loadDeviceList()
  },
  { flush: 'sync', immediate: true }
)
watch(
  () => props.groupId,
  groupId => {
    sessionGeneration += 1
    if (!props.active || !groupId) return
    submitting.value = false
    sessionGroupId = groupId
    versionAtOpen.value = props.groupVersion > 0 ? props.groupVersion : null
    checkedRowKeysRef.value = []
    pendingIntent.value = null
    conflict.value = false
    pagination.page = 1
    queryParams.page = 1
    void loadDeviceList()
  },
  { flush: 'sync' }
)
</script>

<template>
  <NFlex justify="space-between" align="center" class="mb-4">
    <NInput
      v-model:value.trim="searchKeyword"
      :disabled="submitting"
      clearable
      :placeholder="$t('custom.devicePage.deviceNameOrNumber')"
      style="max-width: 320px"
      @keyup.enter="handleSearch"
    >
      <template #prefix>
        <SvgIcon icon="material-symbols:search" />
      </template>
    </NInput>
    <NFlex align="center">
      <NButton type="primary" :disabled="submitting" @click="handleSearch">{{ $t('common.search') }}</NButton>
      <NButton quaternary :disabled="submitting" @click="handleReset">{{ $t('common.reset') }}</NButton>
    </NFlex>
  </NFlex>
  <NAlert v-if="conflict" class="mb-4" type="warning" :show-icon="false">
    <NFlex justify="space-between" align="center">
      <span>{{ operationError }}</span>
      <NButton type="warning" size="small" :disabled="submitting" @click="requestReloadLatestVersion">
        重新加载最新版本
      </NButton>
    </NFlex>
  </NAlert>
  <NAlert v-else-if="operationError || loadError" class="mb-4" type="error" :show-icon="false">
    {{ operationError || loadError }}
  </NAlert>
  <NDataTable
    :loading="loading || submitting"
    size="medium"
    :theme-overrides="tableThemeOverrides"
    :bordered="true"
    :bottom-bordered="true"
    :single-column="false"
    :single-line="true"
    :scroll-x="920"
    :columns="deviceColumns"
    :data="data"
    :row-key="rowKey"
    :checked-row-keys="checkedRowKeysRef"
    class="h-auto"
    @update:checked-row-keys="handleCheck"
  >
    <template #empty>
      <NEmpty size="small" :description="loadError || $t('common.noData')" />
    </template>
  </NDataTable>
  <NFlex justify="end" class="mt-4">
    <NPagination
      v-model:page="pagination.page"
      v-model:page-size="pagination.pageSize"
      :page-count="pagination.pageCount"
      :disabled="submitting"
      @update:page="pagination.onChange"
    />
  </NFlex>
  <NFlex justify="end" class="mt-5" align="center">
    <NFlex align="center">
      <div class="text-16px">
        {{ $t('generate.selected') }}
        <span class="text-blue-4">{{ checkedRowKeysRef.length }}</span>
        {{ $t('generate.number-of-devices') }}
      </div>
      <NButton type="info" @click="closeModal">{{ $t('custom.grouping_details.cancel') }}</NButton>
      <NButton
        type="primary"
        :disabled="
          !canManageGroups ||
          loading ||
          conflict ||
          Boolean(loadError) ||
          submitting ||
          versionAtOpen === null ||
          checkedRowKeysRef.length === 0
        "
        @click="submit_data"
      >
        {{ $t('custom.grouping_details.confirm') }}
      </NButton>
    </NFlex>
  </NFlex>
</template>

<style scoped></style>
