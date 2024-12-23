<!-- eslint-disable require-atomic-updates -->
<script setup lang="tsx">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { NButton, NPopconfirm, NSpace } from 'naive-ui';
import dayjs from 'dayjs';
import { delServiceAccess, getServiceAccess } from '@/service/api/plugin.ts';
import { $t } from '@/locales';
import serviceModal from './components/serviceModal.vue';
import serviceConfigModal from './components/serviceConfigModal.vue';

const route: any = useRoute();
const router: any = useRouter();
const serviceModalRef = ref<any>(null);
const serviceConfigModalRef = ref<any>(null);
const service_plugin_id = ref<any>(route.query.id);
const pageData = ref<any>({
  loading: false,
  tableData: []
});

const queryInfo = ref<any>({
  service_plugin_id: service_plugin_id.value,
  page: 1,
  page_size: 10,
  total: 0,
  pageSizes: [10, 15, 20, 25, 30],
  onChange: (page: number) => {
    queryInfo.value.page = page;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getList();
  },
  onUpdatePageSize: (pageSize: number) => {
    queryInfo.value.page_size = pageSize;
    queryInfo.value.page = 1;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getList();
  }
});

const getList: () => void = async () => {
  const { data }: { data: any } = await getServiceAccess(queryInfo.value);
  pageData.value.tableData = data.list;
  queryInfo.value.itemCount = data.total;
};

const see: (row: any) => void = row => {
  router.push(
    `/device/manage?service_identifier=${route.query.service_identifier}&device_name=${row.name}&service_access_id=${row.id}`
  );
};
const del: (row: any) => void = async row => {
  await delServiceAccess(row);
  getList();
};
const config: (row: any) => void = async row => {
  serviceModalRef.value.openModal(service_plugin_id.value, row);
};
const columns: any = ref([
  {
    title: $t('card.accessPointName'),
    key: 'name',
    minWidth: '200px'
  },
  {
    title: $t('common.creationTime'),
    key: 'create_at',
    render: row => {
      if (row.create_at) {
        return <span>{dayjs(row.create_at).format('YYYY-MM-DD HH:mm:ss')}</span>;
      }
      return <span></span>;
    }
  },
  {
    key: 'actions',
    title: () => $t('common.action'),
    align: 'center',
    width: '250px',
    render: row => {
      return (
        <NSpace justify={'center'}>
          {
            <NButton size={'small'} type="primary" onClick={() => see(row)}>
              $t('card.viewDevice')
            </NButton>
          }
          {
            <NButton size={'small'} type="primary" onClick={() => config(row)}>
              $t('card.modifyConfig')
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
      );
    }
  }
]);

const addData: () => void = () => {
  serviceModalRef.value.openModal(service_plugin_id.value);
};

const isEdit: (val: any, row: any, edit: any) => void = (val, row, edit) => {
  if (edit) {
    serviceConfigModalRef.value.openModal(val, row, edit);
    getList();
  } else {
    serviceConfigModalRef.value.openModal(val, row);
    getList();
  }
};
watch(
  () => queryInfo.value.service_type,
  () => {
    getList();
  },
  { deep: true }
);

getList();
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
    <serviceConfigModal ref="serviceConfigModalRef" @get-list="getList"></serviceConfigModal>
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
