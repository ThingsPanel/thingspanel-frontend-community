<script setup lang="tsx">
import { reactive, ref } from 'vue'
import type { Ref } from 'vue'
import { NButton, NEmpty, NPopconfirm, NSpace } from 'naive-ui'
import type { DataTableColumns, PaginationProps } from 'naive-ui'
import { useBoolean, useLoading } from '@sa/hooks'
import { serviceManagementDeviceTypeLabels } from '@/constants/business'
import { delProtocolPlugin, fetchProtocolPluginList } from '@/service/api'
import { $t } from '@/locales'
import type { ModalType } from './components/table-action-modal.vue'
import TableActionModal from './components/table-action-modal.vue'

const { loading, startLoading, endLoading } = useLoading(false)
const { bool: visible, setTrue: openModal } = useBoolean()

const tableData = ref<ServiceManagement.Service[]>([])
const rowKey = (row: ServiceManagement.Service) => row.id

function setTableData(data: ServiceManagement.Service[]) {
  tableData.value = data
}

type QueryFormModel = {
  page: number
  page_size: number
}

const queryParams = reactive<QueryFormModel>({
  page: 1,
  page_size: 10
})
const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30],
  onChange: (page: number) => {
    pagination.page = page
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
  }
})

async function getTableData() {
  startLoading()
  const { data } = await fetchProtocolPluginList(queryParams)
  if (data) {
    const list: Api.ApiApplyManagement.Service[] = data.list
    pagination.itemCount = data.total
    setTableData(list)
    endLoading()
  }
}

const columns: Ref<DataTableColumns<ServiceManagement.Service>> = ref([
  {
    key: 'name',
    minWidth: '140px',
    title: () => $t('page.apply.service.form.serviceName'),
    align: 'left'
  },
  {
    key: 'device_type',
    minWidth: '140px',
    title: () => $t('page.apply.service.form.deviceType'),
    align: 'left',
    render: row => {
      if (row.device_type) {
        return <span>{serviceManagementDeviceTypeLabels[row.device_type]}</span>
      }
      return <span></span>
    }
  },
  {
    key: 'protocol_type',
    minWidth: '140px',
    title: () => $t('page.apply.service.form.protocolType'),
    align: 'left'
  },
  {
    key: 'access_address',
    minWidth: '140px',
    title: () => $t('page.apply.service.form.accessAddress'),
    align: 'left'
  },
  {
    key: 'http_address',
    minWidth: '140px',
    title: () => $t('page.apply.service.form.httpAddress'),
    align: 'left'
  },
  {
    key: 'sub_topic_prefix',
    minWidth: '140px',
    title: () => $t('page.apply.service.form.subTopicPrefix'),
    align: 'left'
  },
  {
    key: 'description',
    minWidth: '140px',
    title: () => $t('common.description'),
    align: 'left'
  },
  {
    key: 'actions',
    title: () => $t('common.actions'),
    align: 'center',
    minWidth: '140px',
    render: row => {
      return (
        <NSpace justify={'center'}>
          {
            <NButton size={'small'} type="primary" onClick={() => handleEditTable(row.id)}>
              {$t('common.edit')}
            </NButton>
          }
          <NPopconfirm
            negative-text={$t('common.cancel')}
            positive-text={$t('common.confirm')}
            onPositiveClick={() => handleDeleteTable(row.id)}
          >
            {{
              default: () => $t('common.confirmDelete'),
              trigger: () => (
                <NButton type="error" size={'small'}>
                  {$t('common.delete')}
                </NButton>
              )
            }}
          </NPopconfirm>
        </NSpace>
      )
    }
  }
]) as Ref<DataTableColumns<ServiceManagement.Service>>

const modalType = ref<ModalType>('add')

function setModalType(type: ModalType) {
  modalType.value = type
}

const editData = ref<ServiceManagement.Service | null>(null)

function setEditData(data: ServiceManagement.Service | null) {
  editData.value = data
}

function handleAddTable() {
  openModal()
  setModalType('add')
}

function handleEditTable(rowId: string) {
  const findItem = tableData.value.find(item => item.id === rowId)
  if (findItem) {
    setEditData(findItem)
  }
  setModalType('edit')
  openModal()
}

async function handleDeleteTable(rowId: string) {
  const data = await delProtocolPlugin(rowId)
  if (!data.error) {
    // window.$message?.success($t('common.deleteSuccess'));
    await getTableData()
  }
}

function init() {
  getTableData()
}

// 初始化
init()
</script>

<template>
  <div>
    <NCard :title="$t('route.apply_service')" :bordered="false" class="h-full rounded-8px shadow-sm">
      <template #header-extra>
        <NButton type="primary" @click="handleAddTable">
          {{ $t('common.add') }}
        </NButton>
      </template>
      <div class="h-full flex-col">
        <NDataTable
          class="table-standard flex-1-hidden"
          size="medium"
          :bordered="true"
          :bottom-bordered="true"
          :single-column="false"
          :single-line="true"
          :striped="false"
          :scroll-x="1320"
          :row-key="rowKey"
          :flex-height="true"
          :remote="true"
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
        >
          <template #empty>
            <NEmpty size="small" :description="$t('common.noData')" />
          </template>
        </NDataTable>
        <TableActionModal v-model:visible="visible" :type="modalType" :edit-data="editData" @success="getTableData" />
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.table-standard {
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--card-color);

  :deep(.n-data-table-th),
  :deep(.n-data-table-td) {
    padding-left: 12px;
    padding-right: 12px;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
  }

  :deep(.n-data-table-th) {
    height: 44px;
    color: var(--text-color);
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
  }

  :deep(.n-data-table-td) {
    color: var(--text-color);
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
