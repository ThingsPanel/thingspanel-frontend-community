<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { type DataTableColumns, NButton, NDataTable, NEmpty, type PaginationProps, useMessage } from 'naive-ui'
import {
  deleteDeviceGroup,
  deleteDeviceGroupRelation,
  deviceGroupDetail,
  deviceListByGroup,
  getDeviceGroup
} from '@/service/api/device'
import { AddOrEditDevices } from '@/views/device/grouping/components'
import { createNoSelectDeviceColumns, group_columns } from '@/views/device/modules/all-columns'
import useLoadingEmpty from '@/hooks/common/use-loading-empty'
import DeviceSelectList from '@/views/device/grouping-details/modules/device-select-list.vue'
import { $t } from '@/locales'
import { formatDateTime } from '@/utils/common/datetime'
import { useRouterPush } from '@/hooks/common/router'

const group_data = ref([])
const device_data = ref<DeviceManagement.DeviceData[]>([])

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

const groupRowKey = (row: any) => row.id
const deviceRowKey = (row: DeviceManagement.DeviceData) => row.id

const { loading, startLoading, endLoading } = useLoadingEmpty(false)
const route = useRoute()

const currentId = ref(route.query.id)
const isEdit = ref(true)
const the_modal1 = ref()
const the_modal2 = ref()

const editData = ref({ id: '', parent_id: '', name: '', description: '' })

const addChildData = reactive({
  id: '',
  parent_id: currentId.value as string,
  name: '',
  description: ''
})
const details_data = ref({
  detail: {
    created_at: '',
    description: '',
    id: '',
    name: '',
    parent_id: '',
    remark: '',
    tenant_id: '',
    tier: 0,
    updated_at: ''
  },
  tier: {
    group_path: ''
  }
})
const message = useMessage()

const queryParams = reactive<{
  parent_id: string
  page: number
  page_size: number
}>({
  parent_id: '',
  page: 1,
  page_size: 10
})

const { routerPush } = useRouterPush()

const getDetails = async (tid: string) => {
  if (!currentId.value) {
    message.error('00')
  } else {
    queryParams.parent_id = tid
    startLoading()
    const { data, error } = await deviceGroupDetail({ id: tid })

    if (!error && data) {
      details_data.value = data
      editData.value.id = data.detail.id
      editData.value.description = data.detail.description
      editData.value.name = data.detail.name
      editData.value.parent_id = data.detail.parent_id
    }

    const res2 = await getDeviceGroup(queryParams)
    group_data.value = res2.data.list
    group_pagination.itemCount = res2.data.total

    endLoading()
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
    getDetails(currentId.value as string)
    getDeviceList(currentId.value as string)
  },
  onUpdatePageSize: (pageSize: number) => {
    group_pagination.pageSize = pageSize
    group_pagination.page = 1
    queryParams.page = 1
    queryParams.page_size = pageSize
    getDetails(currentId.value as string)
    getDeviceList(currentId.value as string)
  }
})
const router = useRouter()
const viewDetails = (rid: string) => {
  router.push({ name: 'device_grouping-details', query: { id: rid } })
}
// Function to delete a device group
const deleteItem = async (rid: string) => {
  await deleteDeviceGroup({ id: rid })
  await getDetails(currentId.value as string)
}
const group_column = group_columns(viewDetails, deleteItem)
const showGroupModal = () => {
  isEdit.value = true
  if (the_modal2.value) {
    the_modal2.value.showModal = true
  }
}

const showGroupDeviceModal = ref(false)
const handleChildChange = (newValue: boolean) => {
  showGroupDeviceModal.value = newValue
}
const showGroupModalChild = () => {
  addChildData.parent_id = currentId.value as string
  if (the_modal1.value) {
    the_modal1.value.showModal = true
  }
}

const queryParams2 = reactive<{
  group_id: string
  page: number
  page_size: number
}>({
  group_id: currentId.value as string,
  page: 1,
  page_size: 5
})
const getDeviceList = async (id: string) => {
  const res = await deviceListByGroup({ ...queryParams2, group_id: id })
  if (res.data?.list) {
    device_data.value = res.data?.list
  } else {
    device_data.value = []
  }
  if (res?.data?.total) {
    devicePagination.pageCount = Math.ceil(res?.data?.total / 5)
  }
}
const refresh_data = (newValue: boolean) => {
  if (newValue) {
    getDeviceList(currentId.value as string)
  }
}
const devicePagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 5,
  onChange: (page: number) => {
    devicePagination.page = page
    queryParams2.page = page
    getDeviceList(currentId.value as string)
  }
})
const viewDeviceDetails = (rid: string) => {
  router.push({ name: 'device_details', query: { d_id: rid } })
}
const deleteDeviceItem = async (rid: string) => {
  await deleteDeviceGroupRelation({
    device_id: rid,
    group_id: currentId.value
  })
  await getDeviceList(currentId.value as string)
}
const deviceColumns: DataTableColumns<DeviceManagement.DeviceData> = createNoSelectDeviceColumns(
  viewDeviceDetails,
  deleteDeviceItem
)
onMounted(async () => {
  await getDetails(currentId.value as string)
  await getDeviceList(currentId.value as string)
})
const reload = async (nid: string) => {
  await getDetails(nid)
  await getDeviceList(nid)
}

/**
 * 导航到父级分组详情页
 */
const goToParentGroup = () => {
  if (details_data.value.detail.parent_id && details_data.value.detail.parent_id !== '0') {
    routerPush({ name: 'device_grouping-details', query: { id: details_data.value.detail.parent_id } })
  } else {
    console.error('无法导航到父级分组，parent_id 无效或为顶级:', details_data.value.detail.parent_id)
  }
}

/**
 * 导航到顶层分组列表页
 */
const goToGroupListRoot = () => {
  routerPush({ name: 'device_grouping' })
}

watch(
  () => route.query.id,
  newId => {
    if (newId) {
      currentId.value = newId
      reload(newId as string)
    }
  }
)
</script>

<template>
  <div>
    <NSpace vertical :size="16">
      <NCard :title="details_data.detail.name">
        <template #header-extra>
          <NSpace>
            <NButton v-if="details_data.detail.parent_id !== '0'" type="primary" @click="goToParentGroup">
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
              <NButton type="primary" @click="showGroupModalChild">
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
                  getDetails(currentId as string)
                }
              "
            />
          </NTabPane>

          <NTabPane name="device" :tab="$t('custom.grouping_details.device')">
            <NSpace class="mb6">
              <NButton type="primary" @click="showGroupDeviceModal = true">
                {{ $t('custom.grouping_details.addDeviceToGroup') }}
              </NButton>
            </NSpace>

            <NDataTable
              class="device-data-table h-auto"
              :columns="deviceColumns"
              :data="device_data"
              :loading="loading"
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
                <NEmpty size="small" :description="$t('common.noData')" />
              </template>
            </NDataTable>
            <NFlex justify="end" class="mt-4">
              <NPagination
                v-model:page="devicePagination.page"
                v-model:page-size="devicePagination.pageSize"
                :page-count="devicePagination.pageCount"
                @update:page="devicePagination.onChange"
              />
            </NFlex>
          </NTabPane>

          <NTabPane name="$t('common.edit')" :tab="$t('custom.grouping_details.setting')">
            <NButton type="primary" @click="showGroupModal">{{ $t('custom.grouping_details.edit') }}</NButton>
            <NDescriptions label-class="min-w-100px" label-placement="top" bordered :column="3">
              <NDescriptionsItem :label="$t('custom.grouping_details.groupLevel')">
                {{ details_data.tier.group_path }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('custom.grouping_details.description')">
                {{ details_data.detail.description }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('custom.grouping_details.createTime')">
                {{ formatDateTime(details_data.detail.created_at) }}
              </NDescriptionsItem>
            </NDescriptions>
            <AddOrEditDevices
              ref="the_modal2"
              :is-edit="true"
              :edit-data="editData"
              :refresh-data="
                () => {
                  getDetails(currentId as string)
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
          :group_id="currentId as string"
          @closed_modal="handleChildChange"
          @refresh_data="refresh_data"
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
