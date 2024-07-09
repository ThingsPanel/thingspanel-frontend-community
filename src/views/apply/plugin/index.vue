<!-- eslint-disable require-atomic-updates -->
<script setup lang="tsx">
import { ref, watch } from 'vue';
import { NButton, NPopconfirm, NSpace } from 'naive-ui';
import { delRegisterService, getServiceLists } from '@/service/api/plugin.ts';
import { $t } from '@/locales';
import serviceConfigModal from './components/serviceConfigModal.vue';
import serviceModal from './components/serviceModal.vue';
const serviceModalRef = ref<any>(null);
const serviceConfigModalRef = ref<any>(null);

const pageData = ref<any>({
  loading: false,
  tableData: [],
  options: [
    {
      label: '全部',
      value: ''
    },
    {
      label: '接入协议',
      value: 1
    },
    {
      label: '接入服务',
      value: 2
    }
  ]
});

const queryInfo = ref<any>({
  page: 1,
  page_size: 10,
  service_type: '',
  total: 0,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30],
  itemCount: 0,
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
  const { data }: { data: any } = await getServiceLists(queryInfo.value);
  pageData.value.tableData = data.list;
  queryInfo.value.itemCount = data.total;
  console.log(pageData.value.tableData, data, '获取列表数据');
};

const edit: (row: any) => void = row => {
  serviceModalRef.value.openModal(row);
};
const del: (row: any) => void = async row => {
  await delRegisterService(row);
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
    title: '类别',
    key: 'service_type',
    minWidth: '140px',
    align: 'center',
    render: row => {
      if (row.service_type) {
        return <span>{row.service_type === 1 ? '接入协议' : '接入服务'}</span>;
      }
      return <span></span>;
    }
  },
  {
    title: '描述',
    key: 'description'
  },
  {
    title: '版本',
    key: 'version'
  },
  {
    title: '状态',
    key: 'service_heartbeat',
    minWidth: '140px',
    align: 'center',
    render: row => {
      if (row.service_heartbeat) {
        return <span>{row.service_heartbeat === 1 ? '运行中' : '已停止'}</span>;
      }
      return <span></span>;
    }
  },
  {
    key: 'actions',
    title: () => $t('common.action'),
    align: 'center',
    minWidth: '220px',
    render: row => {
      return (
        <NSpace justify={'center'}>
          {
            <NButton size={'small'} type="primary" onClick={() => edit(row)}>
              {$t('common.edit')}
            </NButton>
          }
          {
            <NButton size={'small'} type="primary" onClick={() => config(row)}>
              {$t('common.serviceConfi')}
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
  serviceModalRef.value.openModal();
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
    <NCard :title="$t('route.apply_service')" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="header">
        <n-select
          v-model:value="queryInfo.service_type"
          class="selectType"
          placeholder="选择歌曲"
          :options="pageData.options"
        />
        <NButton type="primary" @click="addData">添加新服务</NButton>
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
