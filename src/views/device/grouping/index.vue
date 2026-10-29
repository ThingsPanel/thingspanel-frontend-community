<script lang="tsx" setup>
import { computed, onMounted, ref, watch } from 'vue'
// Import UI components from Naive UI
import { useRouter } from 'vue-router'
import { NButton, NCard, NDataTable, NEmpty, NIcon, NInput, NPagination } from 'naive-ui'
import { IosSearch } from '@vicons/ionicons4'
import { debounce } from 'lodash'
import {
  createDeviceGroupOperationKey,
  deviceGroupNative,
  DeviceGroupNativeError,
  type DeviceGroup
} from '@/service/api/device-group-native'
import {
  beginDeviceGroupDelete,
  completeDeviceGroupDelete,
  deviceGroupDeleteErrorStatus,
  failDeviceGroupDelete,
  finishDeviceGroupDelete,
  getDeviceGroupDeleteSessionGeneration,
  isCurrentDeviceGroupDeleteSession,
  listDeviceGroupDeleteIntents,
  prepareDeviceGroupDeleteIntent,
  syncDeviceGroupDeleteSession
} from '@/service/api/device-group-delete-state'
import { group_columns } from '@/views/device/modules/all-columns'
import { $t } from '@/locales'
import { useAuthStore } from '@/store/modules/auth'
import { canManageDeviceGroups } from '@/service/api/device-group-editor-state'
import { AddOrEditDevices } from './components'

const the_modal = ref()
const searchValue = ref('')
type DeviceGroupTableRow = DeviceGroup & { created_at: DeviceGroup['createdAt'] }
const data = ref<DeviceGroupTableRow[]>([])
const loading = ref(false)
const currentPage = ref(1)
const pageSize = 10
const totalPages = ref(0)
const totalGroups = ref(0)
const listRequestSequence = ref(0)
const deleteIntentVersion = ref(0)
const pendingDeleteIntents = computed(() => {
  void deleteIntentVersion.value
  return listDeviceGroupDeleteIntents()
})
const authStore = useAuthStore()
const canManageGroups = computed(() => canManageDeviceGroups(authStore.userInfo.roles))
watch(
  [
    () => Boolean(authStore.token),
    () => authStore.userInfo.id || authStore.userInfo.userId || '',
    () => authStore.userInfo.tenantId || authStore.userInfo.tenant_id || ''
  ],
  ([loggedIn, subjectId, tenantId]) => {
    syncDeviceGroupDeleteSession(Boolean(loggedIn), String(subjectId), String(tenantId))
    deleteIntentVersion.value += 1
  },
  { flush: 'sync', immediate: true }
)
const tableThemeOverrides = {
  borderColor: 'var(--border-color)',
  borderRadius: '10px',
  fontSizeMedium: '14px',
  lineHeight: '1.5',
  thColor: 'var(--body-color)',
  thColorHover: 'var(--body-color)',
  thFontWeight: '600',
  thTextColor: 'var(--text-color)',
  tdColor: 'var(--card-color)',
  tdColorHover: 'var(--primary-color-suppl)',
  tdColorSorting: 'var(--primary-color-suppl)',
  tdTextColor: 'var(--text-color)',
  thPaddingMedium: '12px',
  tdPaddingMedium: '13px 12px'
}
const getDevice = async () => {
  const requestSequence = ++listRequestSequence.value
  loading.value = true
  try {
    const res = await deviceGroupNative.list({
      page: currentPage.value,
      pageSize,
      rootOnly: true,
      search: searchValue.value.trim() || undefined
    })
    if (requestSequence !== listRequestSequence.value) return
    data.value = res.items.map(group => ({ ...group, created_at: group.createdAt }))
    totalGroups.value = res.total
    totalPages.value = Math.ceil(res.total / pageSize)
  } catch (error) {
    if (requestSequence === listRequestSequence.value) {
      window.$message?.error(error instanceof Error ? error.message : $t('common.fetchDataFailed'))
    }
  } finally {
    if (requestSequence === listRequestSequence.value) loading.value = false
  }
}

const debouncedSearch = debounce(async () => {
  currentPage.value = 1
  await getDevice()
}, 500)

// 监听输入变化并调用 debounced 函数
const handleInput = () => {
  listRequestSequence.value += 1
  loading.value = false
  debouncedSearch()
}

const handleReset = () => {
  debouncedSearch.cancel()
  searchValue.value = ''
  currentPage.value = 1
  getDevice()
}
const deleteItem = async (rid: string) => {
  if (!canManageGroups.value) {
    window.$message?.error('只有租户管理员可以修改分组。')
    return
  }
  const sessionGeneration = getDeviceGroupDeleteSessionGeneration()
  if (!beginDeviceGroupDelete(rid, sessionGeneration)) return
  let deleted = false
  try {
    const intent = await prepareDeviceGroupDeleteIntent(
      rid,
      async () => (await deviceGroupNative.get(rid)).etag,
      createDeviceGroupOperationKey,
      sessionGeneration
    )
    if (!isCurrentDeviceGroupDeleteSession(sessionGeneration)) return
    await deviceGroupNative.delete(rid, intent.etag, intent.key)
    if (!isCurrentDeviceGroupDeleteSession(sessionGeneration)) return
    completeDeviceGroupDelete(rid, sessionGeneration)
    deleted = true
    window.$message?.success('分组已删除。')
  } catch (error) {
    if (!isCurrentDeviceGroupDeleteSession(sessionGeneration)) return
    const result = failDeviceGroupDelete(rid, deviceGroupDeleteErrorStatus(error), sessionGeneration)
    if (!result.retained && error instanceof DeviceGroupNativeError && (error.status === 409 || error.status === 412)) {
      window.$message?.error('分组已有成员或子组，或已发生变化。请检查分组内容并刷新后重试。')
    } else {
      window.$message?.error(
        result.retained
          ? '删除结果尚未确认。请使用下方“重试同一删除”继续。'
          : error instanceof Error
            ? error.message
            : $t('common.deleteFailed')
      )
    }
  } finally {
    finishDeviceGroupDelete(rid, sessionGeneration)
    deleteIntentVersion.value += 1
  }
  if (deleted && isCurrentDeviceGroupDeleteSession(sessionGeneration)) await getDevice()
}
const router = useRouter()
const viewDetails = (rid: string) => {
  router.push({ name: 'device_grouping-details', query: { id: rid } })
}
// Define columns for the data table
const columns = computed(() => {
  const allColumns = group_columns(viewDetails, deleteItem)
  return canManageGroups.value ? allColumns : allColumns.filter(column => column.key !== 'actions')
})
// Function to show the modal for adding or editing device groups
const showModal = () => {
  if (!canManageGroups.value) return
  if (the_modal.value) {
    the_modal.value.showModal = true
  }
}
onMounted(getDevice) // Fetch device groups on component mount
</script>

<template>
  <div class="h-full overflow-auto">
    <!-- Add or edit device modal component with props for edit mode and data -->
    <AddOrEditDevices ref="the_modal" :is-edit="false" :refresh-data="getDevice" />
    <NCard>
      <div v-if="pendingDeleteIntents.length" class="mb-3">
        <div
          v-for="intent in pendingDeleteIntents"
          :key="intent.groupId"
          class="mb-2 flex items-center justify-between gap-3"
        >
          <span>分组 {{ intent.groupId }} 的删除结果尚未确认。重试会使用原请求编号和版本。</span>
          <NButton size="small" type="warning" @click="deleteItem(intent.groupId)">重试同一删除</NButton>
        </div>
      </div>
      <div class="group-page-header">
        <div class="group-page-heading">
          <h2 class="group-page-title">分组管理</h2>
          <span class="group-page-count">{{ totalGroups }} 个分组</span>
        </div>

        <div class="device-filter-toolbar">
          <div class="device-filter-leading">
            <NButton v-if="canManageGroups" type="primary" @click="showModal">
              {{ $t('custom.groupPage.createGroupButton') }}
            </NButton>
          </div>
          <div class="device-filter-actions">
            <!-- Input for search functionality -->
            <div class="device-filter-field device-filter-field--search">
              <NInput
                v-model:value="searchValue"
                :placeholder="$t('custom.groupPage.deviceGroupPlaceholder')"
                type="text"
                @input="handleInput"
              >
                <template #prefix>
                  <NIcon>
                    <IosSearch />
                  </NIcon>
                </template>
              </NInput>
            </div>
            <NButton quaternary @click="handleReset">{{ $t('generate.reset') }}</NButton>
          </div>
        </div>
      </div>
      <div class="mt-20px">
        <!-- Data table to display device groups -->
        <NDataTable
          class="device-data-table"
          :row-props="
            row => {
              return {
                style: 'cursor: pointer;',
                onClick: () => {
                  viewDetails(row.id)
                }
              }
            }
          "
          :scroll-x="920"
          size="medium"
          :theme-overrides="tableThemeOverrides"
          :bordered="true"
          :bottom-bordered="true"
          :single-column="false"
          :single-line="true"
          :row-key="row => row.id"
          :columns="columns"
          :data="data"
          :loading="loading"
        >
          <template #empty>
            <NEmpty size="small" :description="$t('common.noData')" />
          </template>
        </NDataTable>
        <!-- Pagination component -->
        <div class="flex flex-justify-end">
          <NPagination v-model:page="currentPage" :page-count="totalPages" class="mt-20px" @update:page="getDevice" />
        </div>
      </div>
    </NCard>
  </div>
</template>

<style scoped lang="scss">
.device-filter-toolbar {
  display: flex;
  width: 100%;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}

.group-page-header {
  display: block;
  min-width: 0;
}

.group-page-heading {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: baseline;
  min-width: 0;
  padding-bottom: 12px;
}

.group-page-title {
  margin: 0;
  color: var(--text-color);
  font-size: 20px;
  font-weight: 700;
  line-height: 1.4;
}

.group-page-count {
  color: var(--text-color-3);
  font-size: 14px;
  line-height: 1.5;
}

.device-filter-field {
  min-width: 0;
}

.device-filter-field--search {
  width: 220px;
  min-width: 0;
}

.device-filter-toolbar :deep(.n-input) {
  min-height: 36px;
  border-radius: 8px;
  background: var(--card-color);
}

.device-filter-toolbar :deep(.n-input:hover) {
  border-color: var(--primary-color);
}

.device-filter-actions :deep(.n-button) {
  height: 36px;
  padding: 0 16px;
  border-radius: 8px;
}

.device-filter-actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}

.device-filter-leading {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
}

@media (max-width: 768px) {
  .device-filter-toolbar {
    justify-content: stretch;
  }

  .device-filter-field--search {
    width: 100%;
    min-width: 0;
  }

  .device-filter-leading {
    width: 100%;
  }

  .device-filter-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .device-filter-actions :deep(.n-button) {
    flex: 1 1 auto;
  }
}

@media (max-width: 420px) {
  .device-filter-actions {
    justify-content: stretch;
  }

  .device-filter-actions :deep(.n-button) {
    flex-basis: 100%;
  }
}

.device-data-table {
  min-width: 100%;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--card-color);
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);

  :deep(.n-data-table-th) {
    height: 44px;
    color: var(--text-color);
    background: var(--body-color) !important;
    font-size: 14px;
    font-weight: 600;
    line-height: 1.5;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
  }

  :deep(.n-data-table-th),
  :deep(.n-data-table-td) {
    padding-left: 12px;
    padding-right: 12px;
  }

  :deep(.n-data-table-td) {
    color: var(--text-color);
    background: var(--card-color) !important;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
    transition:
      background-color 180ms ease,
      box-shadow 180ms ease;
  }

  :deep(.n-data-table-tr:not(.n-data-table-tr--summary):hover > .n-data-table-td) {
    background: rgb(239 246 255) !important;
    box-shadow:
      inset 0 1px 0 rgb(191 219 254 / 60%),
      inset 0 -1px 0 rgb(191 219 254 / 60%) !important;
  }

  :deep(.n-data-table-td--last-col),
  :deep(.n-data-table-th--last-col) {
    padding-right: 20px;
  }
}
</style>
