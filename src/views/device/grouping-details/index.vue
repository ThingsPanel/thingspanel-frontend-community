<script setup lang="ts">
import { computed, h, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  type DataTableColumns,
  NAlert,
  NButton,
  NDataTable,
  NEmpty,
  NFlex,
  NPopconfirm,
  type PaginationProps,
  useMessage
} from 'naive-ui'
import {
  createDeviceGroupOperationKey,
  deviceGroupNative,
  DeviceGroupNativeError,
  type DeviceGroup,
  type GroupMember
} from '@/service/api/device-group-native'
import {
  createOrReuseDeviceGroupMembershipIntent,
  type DeviceGroupMembershipIntent
} from '@/service/api/device-group-membership-state'
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
import { canManageDeviceGroups } from '@/service/api/device-group-editor-state'
import { AddOrEditDevices } from '@/views/device/grouping/components'
import useLoadingEmpty from '@/hooks/common/use-loading-empty'
import DeviceSelectList from '@/views/device/grouping-details/modules/device-select-list.vue'
import { $t } from '@/locales'
import { formatDateTime } from '@/utils/common/datetime'
import { useRouterPush } from '@/hooks/common/router'
import { useAuthStore } from '@/store/modules/auth'

const group_data = ref<DeviceGroup[]>([])
const device_data = ref<GroupMember[]>([])
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
const groupRowKey = (row: DeviceGroup) => row.id
const deviceRowKey = (row: GroupMember) => row.device.id
const { loading, startLoading, endLoading } = useLoadingEmpty(false)
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const canManageGroups = computed(() => canManageDeviceGroups(authStore.userInfo.roles))
const currentId = ref(String(route.query.id ?? ''))
let routeRequestGeneration = 0
let detailsRequestGeneration = 0
const isEdit = ref(true)
const the_modal1 = ref()
const the_modal2 = ref()
const editData = ref({ id: '', parent_id: '', name: '', description: '' })
const addChildData = reactive({ id: '', parent_id: currentId.value, name: '', description: '' })
const details_data = ref<DeviceGroup | null>(null)
const membersVersion = ref<number | null>(null)
const memberLoadError = ref('')
const memberLoading = ref(false)
const memberMutationInFlight = ref(false)
const membershipConflict = ref(false)
const pendingMemberIntent = ref<DeviceGroupMembershipIntent | null>(null)
const deleteIntentVersion = ref(0)
const pendingDeleteIntents = computed(() => {
  void deleteIntentVersion.value
  return listDeviceGroupDeleteIntents()
})
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
const message = useMessage()
const queryParams = reactive({ parentId: '', page: 1, pageSize: 10 })
const { routerPush } = useRouterPush()
const detailPath = computed(() => details_data.value?.path.map(item => item.name).join(' / ') || '-')

const loadGroupDetails = async (id: string, generation = routeRequestGeneration) => {
  if (!id) return
  const requestGeneration = ++detailsRequestGeneration
  const isCurrentRequest = () =>
    generation === routeRequestGeneration && requestGeneration === detailsRequestGeneration && currentId.value === id
  queryParams.parentId = id
  startLoading()
  try {
    const [detail, children] = await Promise.all([
      deviceGroupNative.get(id),
      deviceGroupNative.list({ parentId: id, page: queryParams.page, pageSize: queryParams.pageSize })
    ])
    if (!isCurrentRequest()) return
    details_data.value = detail.group
    editData.value = {
      id: detail.group.id,
      parent_id: detail.group.parentId ?? '',
      name: detail.group.name,
      description: detail.group.description ?? ''
    }
    group_data.value = children.items
    group_pagination.itemCount = children.total
  } catch (error) {
    if (isCurrentRequest()) {
      details_data.value = null
      group_data.value = []
      device_data.value = []
      membersVersion.value = null
      memberLoadError.value = error instanceof Error ? error.message : $t('common.fetchDataFailed')
      message.error(error instanceof Error ? error.message : $t('common.fetchDataFailed'))
    }
  } finally {
    if (isCurrentRequest()) endLoading()
  }
}

const group_pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30],
  onChange: (page: number) => {
    group_pagination.page = page
    queryParams.page = page
    loadGroupDetails(currentId.value)
  },
  onUpdatePageSize: (pageSize: number) => {
    group_pagination.pageSize = pageSize
    group_pagination.page = 1
    queryParams.page = 1
    queryParams.pageSize = pageSize
    loadGroupDetails(currentId.value)
  }
})
const viewDetails = (id: string) => router.push({ name: 'device_grouping-details', query: { id } })
const deleteItem = async (id: string) => {
  if (!canManageGroups.value) return
  const sessionGeneration = getDeviceGroupDeleteSessionGeneration()
  if (!beginDeviceGroupDelete(id, sessionGeneration)) return
  let deleted = false
  try {
    const intent = await prepareDeviceGroupDeleteIntent(
      id,
      async () => (await deviceGroupNative.get(id)).etag,
      createDeviceGroupOperationKey,
      sessionGeneration
    )
    if (!isCurrentDeviceGroupDeleteSession(sessionGeneration)) return
    await deviceGroupNative.delete(id, intent.etag, intent.key)
    if (!isCurrentDeviceGroupDeleteSession(sessionGeneration)) return
    completeDeviceGroupDelete(id, sessionGeneration)
    deleted = true
    message.success('分组已删除。')
  } catch (error) {
    if (!isCurrentDeviceGroupDeleteSession(sessionGeneration)) return
    const result = failDeviceGroupDelete(id, deviceGroupDeleteErrorStatus(error), sessionGeneration)
    if (!result.retained && error instanceof DeviceGroupNativeError && (error.status === 409 || error.status === 412)) {
      message.error('分组已有成员或子组，或已发生变化。请检查分组内容并刷新后重试。')
    } else {
      message.error(
        result.retained
          ? '删除结果尚未确认。请使用上方“重试同一删除”继续。'
          : error instanceof Error
            ? error.message
            : $t('common.deleteFailed')
      )
    }
  } finally {
    finishDeviceGroupDelete(id, sessionGeneration)
    deleteIntentVersion.value += 1
  }
  if (deleted && isCurrentDeviceGroupDeleteSession(sessionGeneration)) await loadGroupDetails(currentId.value)
}
const group_column: DataTableColumns<DeviceGroup> = [
  { title: () => $t('custom.groupPage.groupName'), key: 'name', minWidth: 140 },
  {
    title: () => $t('custom.groupPage.description'),
    key: 'description',
    minWidth: 140,
    render: row => row.description || '-'
  },
  {
    title: () => $t('custom.groupPage.createdAt'),
    key: 'createdAt',
    minWidth: 180,
    render: row => formatDateTime(row.createdAt)
  },
  {
    title: () => $t('custom.groupPage.actions'),
    key: 'actions',
    width: 200,
    render: row =>
      h(
        NFlex,
        { justify: 'start' },
        {
          default: () => [
            h(
              NButton,
              { type: 'primary', size: 'small', onClick: () => viewDetails(row.id) },
              { default: () => $t('custom.groupPage.view') }
            ),
            canManageGroups.value
              ? h(
                  NPopconfirm,
                  { onPositiveClick: () => deleteItem(row.id) },
                  {
                    default: () => $t('common.confirmDelete'),
                    trigger: () => h(NButton, { type: 'error', size: 'small' }, { default: () => $t('common.delete') })
                  }
                )
              : null
          ]
        }
      )
  }
]
const showGroupModal = () => {
  if (!canManageGroups.value) return
  isEdit.value = true
  if (the_modal2.value) the_modal2.value.showModal = true
}
const showGroupDeviceModal = ref(false)
const handleChildChange = (newValue: boolean) => {
  showGroupDeviceModal.value = newValue
}
const showGroupModalChild = () => {
  if (!canManageGroups.value) return
  addChildData.parent_id = currentId.value
  if (the_modal1.value) the_modal1.value.showModal = true
}
const memberQuery = reactive({ page: 1, pageSize: 5 })
const devicePagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 5,
  onChange: (page: number) => {
    devicePagination.page = page
    memberQuery.page = page
    getMemberList(currentId.value)
  }
})
let memberRequestGeneration = 0
const getMemberList = async (id: string, routeGeneration = routeRequestGeneration) => {
  const requestGeneration = ++memberRequestGeneration
  const version = details_data.value?.resourceVersion
  if (version === undefined) {
    device_data.value = []
    membersVersion.value = null
    memberLoadError.value = '未能读取当前分组版本，无法查询成员。'
    memberLoading.value = false
    return
  }
  const isCurrentRequest = () =>
    routeGeneration === routeRequestGeneration &&
    requestGeneration === memberRequestGeneration &&
    currentId.value === id
  memberLoading.value = true
  memberLoadError.value = ''
  try {
    const result = await deviceGroupNative.members(id, {
      page: memberQuery.page,
      pageSize: memberQuery.pageSize,
      includeDescendants: false
    })
    if (!isCurrentRequest()) return
    device_data.value = result.items
    membersVersion.value = version
    devicePagination.itemCount = result.total
    devicePagination.pageCount = Math.max(1, Math.ceil(result.total / memberQuery.pageSize))
    const lastPage = Math.max(1, Math.ceil(result.total / memberQuery.pageSize))
    if (memberQuery.page > lastPage) {
      memberQuery.page = lastPage
      devicePagination.page = lastPage
      await getMemberList(id, routeGeneration)
    }
  } catch (error) {
    if (isCurrentRequest()) {
      device_data.value = []
      memberLoadError.value = error instanceof Error ? error.message : $t('common.fetchDataFailed')
    }
  } finally {
    if (isCurrentRequest()) memberLoading.value = false
  }
}
const onMemberPageSizeChange = (pageSize: number) => {
  memberQuery.pageSize = pageSize
  memberQuery.page = 1
  devicePagination.page = 1
  void getMemberList(currentId.value)
}
const refresh_data = (newValue: boolean) => {
  if (newValue) void refreshMembershipState(currentId.value)
}
const handleMembershipVersionReloaded = (group: DeviceGroup) => {
  if (group.id === currentId.value) details_data.value = group
}
const viewDeviceDetails = (id: string) => router.push({ name: 'device_details', query: { d_id: id } })
const refreshMembershipState = async (id: string, routeGeneration = routeRequestGeneration) => {
  await loadGroupDetails(id, routeGeneration)
  if (routeGeneration !== routeRequestGeneration || currentId.value !== id) return
  await getMemberList(id, routeGeneration)
}
const requestMembershipVersionReload = () => {
  if (!membershipConflict.value || !currentId.value) return
  const id = currentId.value
  const generation = routeRequestGeneration
  window.$dialog?.warning({
    title: '分组已发生变化',
    content: '重新加载最新版本后才能继续操作。确认后会刷新分组版本和成员列表。',
    positiveText: '重新加载最新版本',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const latest = await deviceGroupNative.get(id)
        if (generation !== routeRequestGeneration || currentId.value !== id) return
        details_data.value = latest.group
        editData.value = {
          id: latest.group.id,
          parent_id: latest.group.parentId ?? '',
          name: latest.group.name,
          description: latest.group.description ?? ''
        }
        await getMemberList(id, generation)
        if (generation !== routeRequestGeneration || currentId.value !== id || memberLoadError.value) return
        pendingMemberIntent.value = null
        membershipConflict.value = false
      } catch (error) {
        message.error(error instanceof Error ? error.message : $t('common.fetchDataFailed'))
      }
    }
  })
}
const removeDeviceMember = async (
  member: GroupMember,
  groupId: string,
  routeGeneration: number,
  expectedGroupVersion: number | null
) => {
  if (
    !canManageGroups.value ||
    !member.directMembership ||
    membershipConflict.value ||
    memberMutationInFlight.value ||
    expectedGroupVersion === null ||
    routeGeneration !== routeRequestGeneration ||
    currentId.value !== groupId
  )
    return
  const intent = createOrReuseDeviceGroupMembershipIntent(
    pendingMemberIntent.value,
    'remove',
    groupId,
    expectedGroupVersion,
    [member.device.id]
  )
  pendingMemberIntent.value = intent
  memberMutationInFlight.value = true
  try {
    await deviceGroupNative.removeMembers(intent.groupId, intent.body, intent.key)
    if (routeGeneration !== routeRequestGeneration || currentId.value !== intent.groupId) return
    pendingMemberIntent.value = null
    await refreshMembershipState(intent.groupId, routeGeneration)
  } catch (error) {
    if (routeGeneration !== routeRequestGeneration || currentId.value !== intent.groupId) return
    if (error instanceof DeviceGroupNativeError && (error.status === 409 || error.status === 412)) {
      membershipConflict.value = true
      message.error('分组已发生变化。请确认重新加载最新版本后再操作。')
    } else {
      message.error(error instanceof Error ? error.message : $t('common.deleteFailed'))
    }
  } finally {
    if (routeGeneration === routeRequestGeneration && currentId.value === intent.groupId) {
      memberMutationInFlight.value = false
    }
  }
}
const deviceColumns: DataTableColumns<GroupMember> = [
  { title: () => $t('custom.devicePage.deviceName'), key: 'name', render: row => row.device.name || '-' },
  {
    title: () => $t('custom.devicePage.deviceNumber'),
    key: 'deviceNumber',
    render: row => row.device.deviceNumber || '-'
  },
  { title: () => '设备类型', key: 'deviceKind', render: row => row.device.deviceKind },
  { title: () => '管理状态', key: 'administrativeState', render: row => row.device.administrativeState },
  {
    title: () => $t('custom.groupPage.actions'),
    key: 'actions',
    render: row => {
      const groupId = currentId.value
      const routeGeneration = routeRequestGeneration
      const expectedGroupVersion = membersVersion.value
      return h(
        NFlex,
        { justify: 'start' },
        {
          default: () => [
            h(
              NButton,
              { type: 'primary', size: 'small', onClick: () => viewDeviceDetails(row.device.id) },
              { default: () => '查看' }
            ),
            canManageGroups.value && row.directMembership && !membershipConflict.value
              ? h(
                  NPopconfirm,
                  { onPositiveClick: () => removeDeviceMember(row, groupId, routeGeneration, expectedGroupVersion) },
                  {
                    default: () => $t('common.confirmDelete'),
                    trigger: () =>
                      h(
                        NButton,
                        { type: 'error', size: 'small', disabled: memberMutationInFlight.value },
                        { default: () => '移出分组' }
                      )
                  }
                )
              : null
          ]
        }
      )
    }
  }
]
const reload = async (id: string) => {
  const generation = ++routeRequestGeneration
  memberMutationInFlight.value = false
  details_data.value = null
  group_data.value = []
  device_data.value = []
  membersVersion.value = null
  memberLoadError.value = ''
  memberLoading.value = false
  membershipConflict.value = false
  pendingMemberIntent.value = null
  group_pagination.page = 1
  queryParams.page = 1
  memberQuery.page = 1
  devicePagination.page = 1
  await loadGroupDetails(id, generation)
  await getMemberList(id, generation)
}
onMounted(() => {
  if (currentId.value) void reload(currentId.value)
})
const goToParentGroup = () => {
  const parentId = details_data.value?.parentId
  if (parentId) routerPush({ name: 'device_grouping-details', query: { id: parentId } })
  else console.error('无法导航到父级分组，当前分组为顶级或父级不可见。')
}
const goToGroupListRoot = () => routerPush({ name: 'device_grouping' })
watch(
  () => route.query.id,
  newId => {
    const id = String(newId ?? '')
    if (id !== currentId.value) showGroupDeviceModal.value = false
    currentId.value = id
    if (id) void reload(id)
    else {
      routeRequestGeneration += 1
      detailsRequestGeneration += 1
      memberRequestGeneration += 1
      details_data.value = null
      group_data.value = []
      device_data.value = []
      membersVersion.value = null
      memberLoadError.value = ''
      memberLoading.value = false
      membershipConflict.value = false
      pendingMemberIntent.value = null
      showGroupDeviceModal.value = false
    }
  }
)
</script>

<template>
  <div>
    <div v-if="pendingDeleteIntents.length" class="mb-3">
      <NAlert v-for="intent in pendingDeleteIntents" :key="intent.groupId" type="warning" class="mb-2">
        分组 {{ intent.groupId }} 的删除结果尚未确认。重试会使用原请求编号和版本。
        <NButton size="small" type="warning" class="ml-3" @click="deleteItem(intent.groupId)">重试同一删除</NButton>
      </NAlert>
    </div>
    <NSpace vertical :size="16">
      <NCard :title="details_data?.name || ''">
        <template #header-extra>
          <NSpace>
            <NButton v-if="details_data?.parentId" type="primary" @click="goToParentGroup">
              <template #icon>
                <svg-icon icon="material-symbols:arrow-upward" />
              </template>
              {{ $t('custom.grouping_details.parentLevel') }}
            </NButton>
            <NButton @click="goToGroupListRoot">
              {{ $t('custom.grouping_details.allGroups') }}
            </NButton>
          </NSpace>
        </template>
        <NTabs type="line" animated>
          <NTabPane :name="$t('custom.grouping_details.subGroup')" :tab="$t('custom.grouping_details.subGroup')">
            <NSpace>
              <NButton v-if="canManageGroups" type="primary" @click="showGroupModalChild">
                {{ $t('custom.grouping_details.addSubGroup') }}
              </NButton>
            </NSpace>
            <NSpace class="mt4">
              <NDataTable
                class="device-data-table h-auto"
                :columns="group_column"
                :data="group_data"
                :loading="loading"
                size="medium"
                :theme-overrides="tableThemeOverrides"
                :bordered="true"
                :bottom-bordered="true"
                :single-column="false"
                :single-line="true"
                :scroll-x="920"
                :row-key="groupRowKey"
                remote
                :pagination="group_pagination"
              >
                <template #empty>
                  <NEmpty size="small" :description="$t('common.noData')" />
                </template>
              </NDataTable>
            </NSpace>
            <AddOrEditDevices
              ref="the_modal1"
              :is-edit="false"
              :edit-data="addChildData"
              is-pid-no-edit
              :refresh-data="
                () => {
                  loadGroupDetails(currentId as string)
                }
              "
            />
          </NTabPane>

          <NTabPane name="device" :tab="$t('custom.grouping_details.device')">
            <NSpace class="mb6">
              <NButton
                v-if="canManageGroups"
                type="primary"
                :disabled="!details_data || membershipConflict"
                @click="showGroupDeviceModal = true"
              >
                {{ $t('custom.grouping_details.addDeviceToGroup') }}
              </NButton>
            </NSpace>
            <NAlert v-if="membershipConflict" class="mb-4" type="warning" :show-icon="false">
              <NFlex justify="space-between" align="center">
                <div>
                  <span>分组成员已被其他操作修改。确认重新加载最新版本后才能继续。</span>
                  <div v-if="memberLoadError" class="mt-2">{{ memberLoadError }}</div>
                </div>
                <NButton type="warning" size="small" @click="requestMembershipVersionReload">重新加载最新版本</NButton>
              </NFlex>
            </NAlert>
            <NAlert v-else-if="memberLoadError" class="mb-4" type="error" :show-icon="false">
              {{ memberLoadError }}
            </NAlert>

            <NDataTable
              class="device-data-table h-auto"
              :columns="deviceColumns"
              :data="device_data"
              :loading="memberLoading"
              size="medium"
              :theme-overrides="tableThemeOverrides"
              :bordered="true"
              :bottom-bordered="true"
              :single-column="false"
              :single-line="true"
              :scroll-x="920"
              :row-key="deviceRowKey"
            >
              <template #empty>
                <NEmpty size="small" :description="memberLoadError || $t('common.noData')" />
              </template>
            </NDataTable>
            <NFlex justify="end" class="mt-4">
              <NPagination
                v-model:page="devicePagination.page"
                v-model:page-size="devicePagination.pageSize"
                :page-count="devicePagination.pageCount"
                @update:page="devicePagination.onChange"
                @update:page-size="onMemberPageSizeChange"
              />
            </NFlex>
          </NTabPane>

          <NTabPane name="$t('common.edit')" :tab="$t('custom.grouping_details.setting')">
            <NButton v-if="canManageGroups" type="primary" @click="showGroupModal">
              {{ $t('custom.grouping_details.edit') }}
            </NButton>
            <NDescriptions label-class="min-w-100px" label-placement="top" bordered :column="3">
              <NDescriptionsItem :label="$t('custom.grouping_details.groupLevel')">
                {{ detailPath }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('custom.grouping_details.description')">
                {{ details_data?.description || '-' }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('custom.grouping_details.createTime')">
                {{ details_data ? formatDateTime(details_data.createdAt) : '-' }}
              </NDescriptionsItem>
            </NDescriptions>
            <AddOrEditDevices
              ref="the_modal2"
              :is-edit="true"
              :edit-data="editData"
              :refresh-data="
                () => {
                  loadGroupDetails(currentId as string)
                }
              "
            />
          </NTabPane>
        </NTabs>
      </NCard>
    </NSpace>

    <NModal v-model:show="showGroupDeviceModal">
      <NCard
        style="width: 800px"
        :title="$t('custom.grouping_details.addDeviceToGroup')"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <DeviceSelectList
          :group-id="currentId"
          :group-version="details_data?.resourceVersion ?? 0"
          :active="showGroupDeviceModal"
          @closed_modal="handleChildChange"
          @refresh_data="refresh_data"
          @version_reloaded="handleMembershipVersionReloaded"
        />
      </NCard>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
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
    font-weight: 400;
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
