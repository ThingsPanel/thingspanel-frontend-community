<!-- eslint-disable require-atomic-updates -->
<script setup lang="tsx">
import { ref, watch } from 'vue'
import { NButton, NEmpty, NPopconfirm, NSpace, NTag } from 'naive-ui'
import { delRegisterService, getServices } from '@/service/api/plugin'
import { $t } from '@/locales'
import serviceConfigModal from './components/serviceConfigModal.vue'
import serviceModal from './components/serviceModal.vue'
const serviceModalRef = ref<any>(null)
const serviceConfigModalRef = ref<any>(null)
const rowKey = (row: { id: string }) => row.id

const pageData = ref<any>({
  loading: false,
  tableData: [],
  options: [
    {
      label: $t('generate.all'),
      value: ''
    },
    {
      label: $t('card.accessProtocol'),
      value: 1
    },
    {
      label: $t('card.accessService'),
      value: 2
    }
  ]
})

const queryInfo = ref<any>({
  page: 1,
  page_size: 10,
  service_type: '',
  total: 0,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30],
  itemCount: 0,
  onChange: (page: number) => {
    queryInfo.value.page = page
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getList()
  },
  onUpdatePageSize: (pageSize: number) => {
    queryInfo.value.page_size = pageSize
    queryInfo.value.page = 1
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getList()
  }
})

const getList: () => void = async () => {
  const { data }: { data: any } = await getServices(queryInfo.value)
  pageData.value.tableData = data.list
  queryInfo.value.itemCount = data.total
}

const edit: (row: any) => void = row => {
  serviceModalRef.value.openModal(row)
}
const del: (row: any) => void = async row => {
  await delRegisterService(row)
  getList()
}
const config: (row: any) => void = async row => {
  serviceConfigModalRef.value.openModal(row)
}
const columns: any = ref([
  {
    title: $t('card.pluginName'),
    key: 'name',
    minWidth: '200px'
  },
  {
    title: $t('card.type'),
    key: 'service_type',
    minWidth: '140px',
    align: 'center',
    render: row => {
      if (row.service_type) {
        return <span>{row.service_type === 1 ? $t('card.accessProtocol') : $t('card.accessService')}</span>
      }
      return <span></span>
    }
  },
  {
    title: $t('card.description'),
    key: 'description'
  },
  {
    title: $t('card.version'),
    key: 'version'
  },
  {
    title: $t('generate.status'),
    key: 'service_heartbeat',
    minWidth: '140px',
    align: 'center',
    render: row => {
      if (row.service_heartbeat) {
        return (
          <NTag type={row.service_heartbeat === 1 ? 'success' : 'error'}>
            {row.service_heartbeat === 1 ? $t('card.running') : $t('card.stopped')}
          </NTag>
        )
      }
      return <span></span>
    }
  },
  {
    key: 'actions',
    title: () => $t('common.actions'),
    align: 'left',
    minWidth: '220px',
    render: row => {
      return (
        <NSpace justify={'start'}>
          {
            <NButton size={'small'} type="primary" onClick={() => edit(row)}>
              {$t('common.edit')}
            </NButton>
          }
          {
            <NButton size={'small'} type="primary" onClick={() => config(row)}>
              {$t('common.pluginConfig')}
            </NButton>
          }
          <NPopconfirm
            negative-text={$t('common.cancel')}
            positive-text={$t('common.confirm')}
            onPositiveClick={() => del(row.id)}
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
])

const addData: () => void = () => {
  serviceModalRef.value.openModal()
}

watch(
  () => queryInfo.value.service_type,
  () => {
    getList()
  },
  { deep: true }
)

getList()
</script>

<template>
  <div>
    <NCard :title="$t('route.apply_in')" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="header">
        <n-select
          v-model:value="queryInfo.service_type"
          class="selectType"
          :placeholder="$t('card.selectSong')"
          :options="pageData.options"
        />
        <NButton type="primary" @click="addData">{{ $t('card.addNewPlugin') }}</NButton>
      </div>
      <div class="h">
        <NDataTable
          class="table-standard flex-1-hidden"
          size="medium"
          :bordered="true"
          :bottom-bordered="true"
          :single-column="false"
          :single-line="true"
          :striped="false"
          :scroll-x="1160"
          :row-key="rowKey"
          :remote="true"
          :columns="columns"
          :data="pageData.tableData"
          :loading="pageData.loading"
          :pagination="queryInfo"
        >
          <template #empty>
            <NEmpty size="small" :description="$t('common.noData')" />
          </template>
        </NDataTable>
      </div>
    </NCard>
    <serviceModal ref="serviceModalRef" @get-list="getList"></serviceModal>
    <serviceConfigModal ref="serviceConfigModalRef" @get-list="getList"></serviceConfigModal>
  </div>
</template>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  .selectType {
    width: 100px;
  }
}
:deep(.n-data-table__pagination) {
  height: 80px;
}
.h {
  height: max-content;
}

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
