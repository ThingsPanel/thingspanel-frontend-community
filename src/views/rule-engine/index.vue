<script setup lang="tsx">
import { reactive, ref } from 'vue'
import type { Ref } from 'vue'
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui'
import type { DataTableColumns, PaginationProps } from 'naive-ui'
import { useBoolean, useLoading } from '@sa/hooks'
import { ruleEngineStatusLabels } from '@/constants/business'
import { fetchRuleEngineList } from '@/service/api_demo/management'
import { $t } from '@/locales'
import { createLogger } from '@/utils/logger'
import type { ModalType } from './components/table-action-modal.vue'
import TableActionModal from './components/table-action-modal.vue'
const logger = createLogger('Engie')

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

const tableData = ref<RuleEngine.Rule[]>([])

function setTableData(data: RuleEngine.Rule[]) {
  tableData.value = data
}

async function getTableData() {
  startLoading()
  const { data } = (await fetchRuleEngineList()) as any
  if (data) {
    setTimeout(() => {
      setTableData(data)
      endLoading()
    }, 1000)
  }
}

const columns: Ref<DataTableColumns<RuleEngine.Rule>> = ref([
  {
    key: 'index',
    title: $t('common.index'),
    align: 'left',
    minWidth: '140px'
  },
  {
    key: 'name',
    title: $t('generate.rule-name'),
    minWidth: '140px',
    align: 'left'
  },
  {
    key: 'status',
    title: $t('generate.rule-name'),
    minWidth: '140px',
    align: 'left',
    render: row => {
      if (row.status) {
        const tagTypes: Record<RuleEngine.StatusKey, NaiveUI.ThemeColor> = {
          '1': 'success',
          '2': 'warning'
        }
        return <NTag type={tagTypes[row.status]}>{ruleEngineStatusLabels[row.status]}</NTag>
      }
      return <span></span>
    }
  },
  {
    key: 'actions',
    title: $t('common.actions'),
    align: 'left',
    width: '300px',
    render: row => {
      return (
        <NSpace justify={'center'}>
          <NButton size={'small'} ghost type="primary" onClick={() => handleActivate(row.id)}>
            {$t('generate.startup')}
          </NButton>
          <NButton size={'small'} type="warning" onClick={() => handlePause(row.id)}>
            {$t('generate.suspend')}
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
]) as Ref<DataTableColumns<RuleEngine.Rule>>

const modalType = ref<ModalType>('add')

function setModalType(type: ModalType) {
  modalType.value = type
}

const editData = ref<RuleEngine.Rule | null>(null)

function setEditData(data: RuleEngine.Rule | null) {
  editData.value = data
}

function handleAddTable() {
  openModal()
  setModalType('add')
}

function handleActivate(rowId: string) {
  logger.info(rowId)
}

function handlePause(rowId: string) {
  logger.info(rowId)
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
  window.$message?.info(`${$t('generate.clickDelete')}，rowId${$t('generate.by')}${rowId}`)
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

function init() {
  getTableData()
}

// 初始化
init()
</script>

<template>
  <NCard :title="$t('generate.rule-engine')" :bordered="false" class="h-full rounded-8px shadow-sm">
    <template #header-extra>
      <NButton @click="handleAddTable">{{ $t('generate.create-access-rule') }}</NButton>
      <NButton class="ml-10px">{{ $t('device_template.release') }}</NButton>
      <!--
 <n-button type="error">
          <icon-ic-round-delete class="mr-4px text-20px" />
          删除
        </n-button>
        <n-button type="success">
          <icon-uil:export class="mr-4px text-20px" />
          导出Excel
        </n-button>
-->
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
        :scroll-x="760"
        :row-key="row => row.id"
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
        @get-table-data="getTableData"
      />
    </div>
  </NCard>
</template>

<style scoped lang="scss">
.standard-table {
  min-width: 100%;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--card-color);

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
    transition: background-color 180ms ease, box-shadow 180ms ease;
  }

  :deep(.n-data-table-tr:not(.n-data-table-tr--summary):hover > .n-data-table-td) {
    background: rgb(239 246 255) !important;
    box-shadow: inset 0 1px 0 rgb(191 219 254 / 60%), inset 0 -1px 0 rgb(191 219 254 / 60%) !important;
  }

  :deep(.n-data-table-td--last-col),
  :deep(.n-data-table-th--last-col) {
    padding-right: 20px;
  }
}
</style>
