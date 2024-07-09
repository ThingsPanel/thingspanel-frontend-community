<!-- eslint-disable require-atomic-updates -->
<script setup lang="tsx">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { NButton, NPopconfirm, NSpace } from 'naive-ui';
import dayjs from 'dayjs';
import { delServiceAccess, getServiceAccess } from '@/service/api/plugin.ts';
import { $t } from '@/locales';
import serviceConfigModal from './components/serviceConfigModal.vue';
import serviceModal from './components/serviceModal.vue';

const router = useRoute();
const serviceModalRef = ref<any>(null);
const serviceConfigModalRef = ref<any>(null);
const service_plugin_id = ref<any>(router.query.id);
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
  console.log(queryInfo.value, '获取列表数据');
  const { data }: { data: any } = await getServiceAccess(queryInfo.value);
  pageData.value.tableData = data.list;
  queryInfo.value.itemCount = data.total;
};

const edit: (row: any) => void = row => {
  serviceModalRef.value.openModal(row);
};
const del: (row: any) => void = async row => {
  await delServiceAccess(row);
  getList();
};
const config: (row: any) => void = async row => {
  console.log('服务配置');
  serviceConfigModalRef.value.openModal(row);
};
const columns: any = ref([
  {
    title: '服务名称',
    key: 'name',
    minWidth: '200px'
  },
  {
    title: '创建时间',
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
            <NButton size={'small'} type="primary" onClick={() => edit(row)}>
              查看设备
            </NButton>
          }
          {
            <NButton size={'small'} type="primary" onClick={() => config(row)}>
              修改配置
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
  console.log(service_plugin_id.value, '打开弹窗');

  serviceModalRef.value.openModal(service_plugin_id.value);
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
    <NCard :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="header">
        <NButton type="primary" @click="addData">新增接入</NButton>
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
</style>
