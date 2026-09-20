<script setup lang="tsx">
import { onMounted, ref } from 'vue'
import { NButton, NPopconfirm, NSpace } from 'naive-ui'
import type { DataTableColumn } from 'naive-ui'
import useLoadingEmpty from '@/hooks/common/use-loading-empty'
import { getRandomInteger } from '@/utils/common/number'
import { $t } from '@/locales'

interface DataSource {
  name: string
  age: number
  address: string
}

const { loading, startLoading, endLoading, empty, setEmpty } = useLoadingEmpty()
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

const columns: DataTableColumn<DataSource>[] = [
  {
    title: 'Name',
    key: 'name',
    align: 'center'
  },
  {
    title: 'Age',
    key: 'age',
    align: 'center'
  },
  {
    title: 'Address',
    key: 'address',
    align: 'center'
  },
  {
    key: 'action',
    title: 'Action',
    align: 'center',
    render: row => {
      return (
        <NSpace justify={'center'}>
          <NButton
            size={'small'}
            onClick={() => {
              handleEdit(row.name)
            }}
          >
            $t('common.edit')
          </NButton>
          <NPopconfirm
            onPositiveClick={() => {
              handleDelete(row.name)
            }}
          >
            {{
              default: () => $t('common.confirmDelete'),
              trigger: () => <NButton size={'small'}>$t('common.delete')</NButton>
            }}
          </NPopconfirm>
        </NSpace>
      )
    }
  }
]

const dataSource = ref<DataSource[]>([])

function createDataSource(): DataSource[] {
  return Array(100)
    .fill(1)
    .map((_item, index) => {
      return {
        name: `Name${index}`,
        age: getRandomInteger(30, 20),
        address: $t('card.china')
      }
    })
}

function getDataSource() {
  startLoading()
  setTimeout(() => {
    dataSource.value = createDataSource()
    endLoading()
    setEmpty(!dataSource.value.length)
  }, 1000)
}

function getEmptyDataSource() {
  startLoading()
  setTimeout(() => {
    dataSource.value = []
    endLoading()
    setEmpty(!dataSource.value.length)
  }, 1000)
}

function handleEdit(_name: string) {
  //
}

function handleDelete(_name: string) {
  //
}

onMounted(() => {
  getDataSource()
})
</script>

<template>
  <div class="h-full overflow-hidden">
    <NCard :title="$t('generate.table')">
      <NSpace :vertical="true">
        <NSpace>
          <NButton @click="getDataSource">{{ $t('generate.has-data') }}</NButton>
          <NButton @click="getEmptyDataSource">{{ $t('generate.no-data') }}</NButton>
        </NSpace>
        <LoadingEmptyWrapper class="h-480px" :loading="loading" :empty="empty">
          <NDataTable
            size="medium"
            :theme-overrides="tableThemeOverrides"
            :bordered="true"
            :bottom-bordered="true"
            :single-column="false"
            :single-line="true"
            :striped="false"
            :scroll-x="720"
            :row-key="row => row.name"
            :flex-height="true"
            :columns="columns"
            :data="dataSource"
            class="standard-table h-480px"
          >
            <template #empty>
              <NEmpty size="small" :description="$t('common.nodata')" />
            </template>
          </NDataTable>
        </LoadingEmptyWrapper>
      </NSpace>
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
