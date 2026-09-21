<script setup lang="tsx">
import { h, reactive, ref } from 'vue'
import type { Ref } from 'vue'
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui'
import type { DataTableColumns, PaginationProps } from 'naive-ui'
import { useBoolean, useLoading } from '@sa/hooks'
import { routerSysFlagLabels, routerTypeLabels } from '@/constants/business'
import { delElement, fetchElementList } from '@/service/api/route'
import { deepClone } from '@/utils/common/tool'
import { $t } from '@/locales'
import TableActionModal from './components/table-action-modal.vue'
import type { ModalType } from './components/table-action-modal.vue'

const { loading, startLoading, endLoading } = useLoading(false)
const { bool: visible, setTrue: openModal } = useBoolean()
const tableThemeOverrides = {
  borderColor: 'var(--border-color)',
  fontSizeMedium: '14px',
  lineHeight: '1.5',
  thColor: 'var(--body-color)',
  thColorHover: 'var(--body-color)',
  thFontWeight: '400',
  thTextColor: 'var(--text-color)',
  tdColorHover: 'var(--primary-color-suppl)',
  tdTextColor: 'var(--text-color)',
  thPaddingMedium: '12px',
  tdPaddingMedium: '13px 12px'
}

type QueryFormModel = {
  page: number
  page_size: number
}

const queryParams = reactive<QueryFormModel>({
  page: 1,
  page_size: 10
})

const tableData = ref<CustomRoute.Route[]>([])

function setTableData(data: CustomRoute.Route[]) {
  tableData.value = data
}

const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  itemCount: 0,
  pageSizes: [10, 15, 20, 25, 30],
  onChange: (page: number) => {
    pagination.page = page
    queryParams.page = page
    getTableData()
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    queryParams.page = 1
    queryParams.page_size = pageSize
    getTableData()
  }
})

async function getTableData() {
  startLoading()
  const { data } = await fetchElementList(queryParams)
  if (data) {
    const list: Api.Route.MenuRoute[] = data.list
    pagination.itemCount = data.total
    setTableData(list)
    endLoading()
  }
}

const rowKey = (row: CustomRoute.Route) => {
  return row.id
}

const columns: Ref<DataTableColumns<CustomRoute.Route>> = ref([
  {
    key: 'description',
    title: () => $t('page.manage.menu.title'),
    align: 'left',
    minWidth: '140px',
    render: row => {
      if (row.multilingual && row.multilingual !== 'default') {
        return <span>{$t(row.multilingual)}</span>
      }
      return <span>{row.description}</span>
    }
  },

  {
    key: 'param2',
    title: () => $t('page.manage.menu.icon'),
    align: 'left',
    minWidth: '140px',
    render: row => {
      if (row.param2) {
        return <svg-icon icon={row.param2} />
      }
      return <span></span>
    }
  },
  {
    key: 'element_code',
    minWidth: '140px',
    title: () => $t('page.manage.menu.menuName'),
    align: 'left'
  },
  {
    key: 'param1',
    minWidth: '140px',
    title: () => $t('page.manage.menu.routeName'),
    align: 'left'
  },
  // {
  //   key: 'param3',
  //   minWidth: '140px',
  //   title: () => $t('page.manage.menu.componentType'),
  //   align: 'left'
  // },
  {
    key: 'element_type',
    minWidth: '140px',
    title: () => $t('page.manage.menu.menuType'),
    align: 'left',
    render: row => {
      if (row.element_type) {
        const tagTypes: Record<CustomRoute.routerTypeKey, NaiveUI.ThemeColor> = {
          '1': 'success',
          // "2": "error",
          '3': 'warning'
          // "4": "default",
          // "5": "info",
        }
        return <NTag type={tagTypes[row.element_type]}>{routerTypeLabels[row.element_type]}</NTag>
      }
      return <span></span>
    }
  },
  {
    key: 'authority',
    minWidth: '140px',
    title: () => $t('page.manage.menu.authority'),
    align: 'left',
    render: row => {
      if (row.authority && row.authority.length) {
        const tags = row.authority.map((tagKey: string) => {
          return h(
            NTag,
            {
              type: 'success'
            },
            {
              default: () => routerSysFlagLabels[tagKey]
            }
          )
        })
        return tags
      }
      return <span></span>
    }
  },
  {
    key: 'remark',
    minWidth: '140px',
    title: () => $t('common.remark'),
    align: 'left'
  },
  {
    key: 'actions',
    title: () => $t('common.actions'),
    align: 'left',
    minWidth: '140px',
    render: row => {
      return (
        <NSpace>
          <NButton type="primary" size={'small'} onClick={() => handleEditTable(row)}>
            {$t('common.edit')}
          </NButton>
          <NPopconfirm
            negative-text={$t('common.cancel')}
            positive-text={$t('common.confirm')}
            onPositiveClick={() => handleDeleteTable(row.id)}
          >
            {{
              default: () => $t('common.confirm'),
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
]) as Ref<DataTableColumns<CustomRoute.Route>>

const modalType = ref<ModalType>('add')

function setModalType(type: ModalType) {
  modalType.value = type
}

const editData = ref<CustomRoute.Route | null>(null)

function handleAddTable() {
  openModal()
  setModalType('add')
}

function handleEditTable(row: any) {
  editData.value = deepClone(row)
  setModalType('edit')
  openModal()
}

async function handleDeleteTable(rowId: string) {
  const data = await delElement(rowId)
  if (!data.error) {
    window.$message?.success($t('common.deleteSuccess'))
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
    <NCard :title="$t('page.manage.menu.title')" :bordered="false" class="h-full rounded-8px shadow-sm">
      <template #header-extra>
        <NButton type="primary" @click="handleAddTable">
          {{ $t('generate.create') }}
        </NButton>
      </template>
      <div class="h-full flex-col">
        <NDataTable
          size="medium"
          :theme-overrides="tableThemeOverrides"
          :bordered="true"
          :bottom-bordered="true"
          :single-column="false"
          :single-line="true"
          :striped="false"
          :scroll-x="1120"
          :row-key="rowKey"
          :remote="true"
          flex-height
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          class="standard-table flex-1-hidden"
        >
          <template #empty>
            <NEmpty size="small" :description="$t('common.nodata')" />
          </template>
        </NDataTable>
        <TableActionModal
          v-model:visible="visible"
          :type="modalType"
          :edit-data="editData"
          :table-list="tableData"
          @success="getTableData"
        />
      </div>
    </NCard>
  </div>
</template>

<style scoped lang="scss">
.standard-table {
  min-width: 100%;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--card-color);
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);

  :deep(.n-data-table-th),
  :deep(.n-data-table-td) {
    padding-left: 12px;
    padding-right: 12px;
  }

  :deep(.n-data-table-th) {
    height: 44px;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
  }

  :deep(.n-data-table-td) {
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
