<script setup lang="tsx">
import { onMounted, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { useRouter } from 'vue-router';
import { NButton, NPopconfirm, NSpace } from 'naive-ui';
import { childDeviceSelectList, childDeviceTableList, removeChildDevice } from '@/service/api/device';
// import { useRouterPush } from '@/hooks/common/router';
import { $t } from '@/locales';

const router = useRouter();
// const { routerPushByKey } = useRouterPush();
const props = defineProps<{
  id: string;
}>();
const showAddDialog = ref(false);
const showSetDialog = ref(false);
const showDeleteDialog = ref(false);
const deviceSetName = ref();
const deviceSetId = ref();
const tableData = ref([]);
const total = ref(0);
const log_page = ref(1);
const sOptions = ref<any[]>([]);
const loading = ref(false);
const rowKey = (row: any) => row.id;
const handleCheck = () => {
  // 处理选中逻辑
};
const pagination = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 20, 30, 40],
  onChange: (page: number) => {
    pagination.page = page;
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
  }
});
const getData = async () => {
  const res = await childDeviceTableList({
    page: log_page.value,
    page_size: 5,
    id: props.id
  });
  tableData.value = res.data.list || [];
  total.value = res.data.total;
};
const deleteDevice = async id => {
  const { error } = await removeChildDevice({
    sub_device_id: id
  });
  if (!error) {
    showDeleteDialog.value = false;
    log_page.value = 1;
    tableData.value = [];
    getData();
  }
};

const handleLook = (id: string) => {
  router.push({ path: 'details-child', query: { d_id: id } });
  // routerPushByKey('device_details-child', {
  //   query: { d_id: id }
  // }).catch(error => {
  //   console.log('error----', error);
  // });
};

const handleSetAddress = async (id, subDeviceAddr) => {
  deviceSetId.value = id;
  showSetDialog.value = true;
  deviceSetName.value = subDeviceAddr;
};

const columns: Ref<any> = ref([
  {
    title: $t('custom.devicePage.deviceName'),
    minWidth: '140px',
    key: 'name'
  },
  {
    title: $t('custom.devicePage.subDeviceAddress'),
    minWidth: '140px',
    key: 'subDeviceAddr'
  },
  {
    title: $t('common.actions'),
    key: '',
    minWidth: '140px',
    render: row => {
      return (
        <NSpace>
          <NButton type="primary" size="small" onClick={() => handleLook(row.id)}>
            {$t('generate.view')}
          </NButton>
          <NButton type="success" size="small" onClick={() => handleSetAddress(row.id, row.subDeviceAddr)}>
            {$t('generate.setSubDevices')}
          </NButton>
          <NPopconfirm
            negative-text={$t('common.cancel')}
            positive-text={$t('common.confirm')}
            onPositiveClick={() => deleteDevice(row.id)}
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
]) as Ref<any>;

const getDeviceList = async () => {
  const res = await childDeviceSelectList();
  if (res.data.length !== 0) {
    sOptions.value = [];
    const tempSOptions = res.data?.map(item => {
      return { label: item.name, value: item.id };
    });
    sOptions.value = sOptions.value.concat(tempSOptions);
  }
};

const addDevice = () => {
  showAddDialog.value = true;
  getDeviceList();
};

getData();

onMounted(() => {});
</script>

<template>
  <div class="device-analysis">
    <n-card class="w-full">
      <NButton type="primary" @click="addDevice">{{ $t('generate.add-sub-device') }}</NButton>
      <div class="analysis-container">
        <div class="analysis-content">
          <div class="analysis-table">
            <n-data-table
              :columns="columns"
              :data="tableData"
              :pagination="pagination"
              :loading="loading"
              :row-key="rowKey"
              @update:checked-row-keys="handleCheck"
            />
          </div>
          <div class="mt-4 w-full flex justify-end">
            <n-pagination
              :item-count="total"
              :page-size="5"
              @update:page="
                page => {
                  log_page = page;
                  log_page = page;
                  getData();
                }
              "
            />
          </div>
        </div>
      </div>
    </n-card>
  </div>
</template>

<style scoped>
.device-analysis {
  width: 100%;
}

.analysis-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  margin-top: 16px;
}

.analysis-content {
  flex: 1;
  overflow: auto;
}

.analysis-table {
  width: 100%;
}
</style>
