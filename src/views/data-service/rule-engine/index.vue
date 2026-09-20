<script setup lang="tsx">
import { reactive, ref } from 'vue'
import type { Ref } from 'vue'
import { NButton, NEmpty, NPopconfirm, NSpace, NTag } from 'naive-ui'
import type { DataTableColumns, PaginationProps } from 'naive-ui'
import {
  dataServiceFlagLabels,
  dataServiceSignModeLabels,
  dataServiceStatusLabels,
  dataServiceStatusOptions
} from '@/constants/business'
import { fetchDataServiceList } from '@/service/api_demo/management'
import { $t } from '@/locales'
import { formatDateTime } from '@/utils/common/datetime'
import { tableThemeOverrides } from '@/utils/table-theme'
import type { ModalType } from './components/table-action-modal.vue'
import TableActionModal from './components/table-action-modal.vue'
import SecretKeyModal from './components/secret-key-modal.vue'
import { useBoolean, useLoading } from '~/packages/hooks'

const { loading, startLoading, endLoading } = useLoading(false)
const { bool: visible, setTrue: openModal } = useBoolean()
const { bool: secretKeyVisible, setTrue: openSecretKeyModal } = useBoolean()

const queryParams = reactive({
  name: '',
  status: null
})

const tableData = ref<DataService.Data[]>([])
const rowKey = (row: DataService.Data) => row.id

function setTableData(data: DataService.Data[]) {
  tableData.value = data
}

async function getTableData() {
  startLoading()
  const { data } = (await fetchDataServiceList()) as any
  if (data) {
    setTimeout(() => {
      setTableData(data)
      endLoading()
    }, 1000)
  }
}

const columns: Ref<DataTableColumns<DataService.Data>> = ref([
  {
    key: 'index',
    title: $t('common.index'),
    align: 'center',
    width: '120px'
  },
  {
    key: 'name',
    title: $t('page.manage.menu.form.name'),
    align: 'left'
  },
  {
    key: 'appKey',
    title: 'app_key',
    align: 'left'
  },
  {
    key: 'signMode',
    title: $t('generate.signature-method'),
    align: 'left',
    render: row => {
      if (row.signMode) {
        return <span>{dataServiceSignModeLabels[row.signMode]}</span>
      }
      return <span></span>
    }
  },
  {
    key: 'ip',
    title: $t('generate.ip2'),
    align: 'left'
  },
  {
    key: 'flag',
    title: $t('generate.api-support-flag'),
    align: 'left',
    render: row => {
      if (row.flag) {
        return <span>{dataServiceFlagLabels[row.flag]}</span>
      }
      return <span></span>
    }
  },
  {
    key: 'desc',
    title: $t('custom.groupPage.description'),
    align: 'left'
  },
  {
    key: 'createTime',
    title: $t('common.creationTime'),
    align: 'left',
    render: row => {
      return formatDateTime(row.createTime)
    }
  },
  {
    key: 'status',
    title: $t('generate.status'),
    align: 'left',
    render: row => {
      if (row.status) {
        const tagTypes: Record<DataService.StatusKey, NaiveUI.ThemeColor> = {
          '1': 'success',
          '2': 'warning'
        }
        return <NTag type={tagTypes[row.status]}>{dataServiceStatusLabels[row.status]}</NTag>
      }
      return <span></span>
    }
  },
  {
    key: 'actions',
    title: $t('common.actions'),
    align: 'center',
    width: '300px',
    render: row => {
      return (
        <NSpace justify={'center'}>
          <NButton size={'small'} type="primary" onClick={() => handleViewKey(row.id)}>
            {$t('generate.view-key')}
          </NButton>
          <NButton size={'small'} type="primary" onClick={() => handleEditTable(row.id)}>
            {$t('common.edit')}
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDeleteTable(row.id)}>
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
]) as Ref<DataTableColumns<DataService.Data>>

const modalType = ref<ModalType>('add')

function setModalType(type: ModalType) {
  modalType.value = type
}

const editData = ref<DataService.Data | null>(null)

function setEditData(data: DataService.Data | null) {
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

function handleDeleteTable(rowId: string) {
  window.$message?.info(`${$t('generate.clickDelete')}，rowId为${rowId}`)
}

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

/** 查看密钥 */
const secretKey = ref<string>('')

function handleViewKey(rowId: string) {
  secretKey.value = rowId
  openSecretKeyModal()
}

function handleQuery() {
  init()
}

function init() {
  getTableData()
}

// 初始化
init()
</script>

<template>
  <div>
    <NCard :title="$t('generate.rule-engine')" :bordered="false" class="h-full rounded-8px shadow-sm">
      <template #header-extra>
        <NButton type="primary" @click="handleAddTable">{{ $t('device_template.add') }}</NButton>
      </template>
      <div class="h-full flex-col">
        <NForm ref="queryFormRef" inline label-placement="left" :model="queryParams">
          <NFormItem :label="$t('generate.rule-name')" path="name">
            <NInput v-model:value="queryParams.name" />
          </NFormItem>
          <NFormItem :label="$t('generate.signature-method')" path="status">
            <NSelect v-model:value="queryParams.status" clearable class="w-200px" :options="dataServiceStatusOptions" />
          </NFormItem>
          <NFormItem>
            <NButton class="w-72px" type="primary" @click="handleQuery">{{ $t('common.search') }}</NButton>
          </NFormItem>
        </NForm>
        <NDataTable
          class="table-standard flex-1-hidden"
          size="medium"
          :theme-overrides="tableThemeOverrides"
          :bordered="true"
          :bottom-bordered="true"
          :single-column="false"
          :single-line="true"
          :striped="false"
          :scroll-x="1088"
          :row-key="rowKey"
          :flex-height="true"
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
        >
          <template #empty>
            <NEmpty size="small" :description="$t('common.noData')" />
          </template>
        </NDataTable>
        <TableActionModal
          v-model:visible="visible"
          :type="modalType"
          :edit-data="editData"
          @get-table-data="getTableData"
        />
      </div>
    </NCard>
    <SecretKeyModal v-model:visible="secretKeyVisible" :secret-key="secretKey"></SecretKeyModal>
  </div>
</template>

<style scoped>
.table-standard {
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--card-color);
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);

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
    background: var(--body-color) !important;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
  }

  :deep(.n-data-table-td) {
    color: var(--text-color);
    background: var(--card-color) !important;
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
