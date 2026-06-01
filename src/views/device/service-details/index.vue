<!-- eslint-disable require-atomic-updates -->
<script setup lang="tsx">
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NButton, NPopconfirm, NSpace } from 'naive-ui'
import dayjs from 'dayjs'
import { delServiceAccess, getServiceAccess } from '@/service/api/plugin.ts'
import { $t } from '@/locales'
import serviceModal from './components/serviceModal.vue'
import serviceConfigModal from './components/serviceConfigModal.vue'

const route: any = useRoute()
const router: any = useRouter()
const serviceModalRef = ref<any>(null)
const serviceConfigModalRef = ref<any>(null)
const service_plugin_id = ref<any>(route.query.id)
const pageData = ref<any>({
  loading: false,
  tableData: []
})

const queryInfo = ref<any>({
  service_plugin_id: service_plugin_id.value,
  page: 1,
  pageSize: 10, // camelCase — NDataTable pagination prop
  itemCount: 0, // NDataTable remote pagination total
  pageSizes: [10, 15, 20, 25, 30],
  showSizePicker: true,
  prefix({ itemCount }) {
    return `${$t('common.total')}: ${itemCount}`
  },
  onUpdatePage: (page: number) => {
    // NDataTable fires onUpdatePage, not onChange
    queryInfo.value.page = page
    getList()
  },
  onUpdatePageSize: (pageSize: number) => {
    queryInfo.value.pageSize = pageSize
    queryInfo.value.page = 1
    getList()
  }
})

const getList: () => void = async () => {
  pageData.value.loading = true
  try {
    const { data }: { data: any } = await getServiceAccess({
      service_plugin_id: queryInfo.value.service_plugin_id,
      page: queryInfo.value.page,
      page_size: queryInfo.value.pageSize // backend expects snake_case
    })
    pageData.value.tableData = data?.list ?? []
    queryInfo.value.itemCount = data?.total ?? 0
  } finally {
    pageData.value.loading = false
  }
}

const see = (row: any) => {
  router.push(
    `/device/manage?service_identifier=${route.query.service_identifier}&device_name=${row.name}&service_access_id=${row.id}`
  )
}
const del = async (row: any) => {
  await delServiceAccess(row)
  getList()
}
const config = async (row: any) => {
  serviceModalRef.value.openModal(service_plugin_id.value, row)
}
const reopenAccessPointConfig = (row: any) => {
  serviceModalRef.value.openModal(service_plugin_id.value, row)
}
const columns: any = ref([
  {
    title: $t('card.accessPointName'),
    key: 'name',
    minWidth: '200px'
  },
  {
    title: $t('common.creationTime'),
    key: 'create_at',
    minWidth: '200px',
    render: row => {
      if (row.create_at) {
        return <span>{dayjs(row.create_at).format('YYYY-MM-DD HH:mm:ss')}</span>
      }
      return <span></span>
    }
  },
  {
    key: 'actions',
    title: () => $t('common.actions'),
    align: 'left',
    width: '420px',
    ellipsis: {
      tooltip: {
        width: 420
      }
    },
    render: row => {
      return (
        <NSpace justify={'left'}>
          {
            <NButton size={'small'} type="primary" onClick={() => see(row)}>
              {$t('card.viewDevice')}
            </NButton>
          }
          {
            <NButton size={'small'} type="primary" onClick={() => config(row)}>
              {$t('card.modifyConfig')}
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

const addData = () => {
  serviceModalRef.value.openModal(service_plugin_id.value)
}

const isEdit = (val: any, row: any, edit: any) => {
  serviceConfigModalRef.value.openModal(val, row, edit)
  getList()
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
    <NCard :bordered="false" class="h-full rounded-8px shadow-sm" :title="route.query.service_name || '--'">
      <div class="header">
        <NButton type="primary" @click="addData">{{ $t('card.newAccess') }}</NButton>
      </div>
      <div class="h">
        <NDataTable
          :remote="true"
          :columns="columns"
          :data="pageData.tableData"
          :loading="pageData.loading"
          :pagination="queryInfo"
          class="flex-1-hidden"
        />
      </div>
    </NCard>
    <serviceConfigModal
      ref="serviceConfigModalRef"
      @get-list="getList"
      @go-back="reopenAccessPointConfig"
    ></serviceConfigModal>
    <serviceModal ref="serviceModalRef" @is-edit="isEdit"></serviceModal>
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
</style>
