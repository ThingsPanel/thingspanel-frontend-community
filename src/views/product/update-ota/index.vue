<script setup lang="tsx">
import { computed, getCurrentInstance, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { NButton, NSpace } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { useBoolean, useLoading } from '@sa/hooks';
import { $t } from '@/locales';
import { getOtaPackageList } from '@/service/product/update-package';
import { getDeviceConfigList } from '@/service/api/device';
import { formatDateTime } from '@/utils/common/datetime';
import DeviceRegister from './components/device-register.vue';
const { loading, startLoading, endLoading } = useLoading(false);

const { bool: editPwdVisible, setTrue: openConfig } = useBoolean();
const queryParams = reactive({
  name: '',
  device_config_id: '',
  page: 1,
  page_size: 10
});
const currentMid = ref();
const tableData = ref<productPackageRecord[]>([]);
function setTableData(data: productPackageRecord[]) {
  tableData.value = data || [];
}
function handleQuery() {
  Object.assign(queryParams, {
    page: 1
  });
  init();
}
function handleReset() {
  Object.assign(queryParams, {
    name: '',
    device_config_id: '',
    page: 1
  });
  handleQuery();
}
const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30],
  onChange: (page: number) => {
    pagination.page = page;
    queryParams.page = page;
    getTableData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    queryParams.page = 1;
    queryParams.page_size = pageSize;
    getTableData();
  }
});

async function getTableData() {
  startLoading();
  const { data } = await getOtaPackageList(queryParams);
  if (data) {
    const list: productPackageRecord[] = data.list;
    setTableData(list);
    pagination.pageCount = Math.ceil(data.total / queryParams.page_size);
  }
  endLoading();
}
const drawerTitle: Ref<string> = ref('');
const editData: any = ref<productPackageRecord>();
async function handleRegisterConfig(record: productPackageRecord) {
  currentMid.value = record.id;
  editData.value = record;
  openConfig();
  drawerTitle.value = `${record.name}-${$t('page.product.list.preRegister')}`;
}
const columns: Ref<DataTableColumns<productPackageRecord>> = ref([
  {
    key: 'name',
    minWidth: '140px',
    title: $t('page.product.update-package.packageName')
  },
  {
    key: 'target_version',
    minWidth: '140px',
    title: $t('page.product.update-package.version')
  },
  {
    key: 'version',
    minWidth: '140px',
    title: $t('page.product.update-package.versionCode')
  },
  {
    key: 'device_config_name',
    minWidth: '140px',
    title: $t('page.product.update-package.deviceConfig')
  },
  {
    key: 'package_type',
    minWidth: '140px',
    title: $t('page.product.update-package.type'),
    render: (row: productPackageRecord) => {
      if (row.package_type === 1) {
        return $t('page.product.update-package.diff');
      } else if (row.package_type === 2) {
        return $t('page.product.update-package.full');
      }
      return '-';
    }
  },
  {
    key: 'module',
    minWidth: '140px',
    title: $t('page.product.update-package.moduleName')
  },
  {
    key: 'created_at',
    minWidth: '140px',
    title: $t('page.product.update-package.createTime'),
    render: row => {
      return formatDateTime(row.created_at);
    }
  },
  {
    key: 'description',
    minWidth: '140px',
    title: $t('page.product.update-package.desc')
  },
  {
    key: 'actions',
    minWidth: '140px',
    title: $t('common.action'),
    align: 'center',
    render: (row: productPackageRecord) => {
      return (
        <NSpace justify={'center'}>
          <NButton size={'small'} type="primary" onClick={() => handleRegisterConfig(row)}>
            {$t('page.product.update-ota.lookTask')}
          </NButton>
        </NSpace>
      );
    }
  }
]) as Ref<DataTableColumns<productPackageRecord>>;

const deviceOptions = ref();

const getList = async (name?: string) => {
  const { data, error } = await getDeviceConfigList({
    page: 1,
    page_size: 99,
    name
  });
  if (!error && data) {
    deviceOptions.value = data?.list || [];
  }
};
function init() {
  getList();
  getTableData();
}
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});

// 初始化
init();
</script>

<template>
  <div>
    <NCard :title="$t('page.product.update-ota.otaTitle')">
      <NForm :inline="!getPlatform" label-placement="left" :model="queryParams">
        <NFormItem :label="$t('page.product.list.deviceConfig')" path="email">
          <NSelect
            v-model:value="queryParams.device_config_id"
            filterable
            :options="deviceOptions"
            label-field="name"
            value-field="id"
            @search="getList"
          />
        </NFormItem>
        <NFormItem :label="$t('page.product.update-package.packageName')" path="name">
          <NInput v-model:value="queryParams.name" />
        </NFormItem>
        <NFormItem>
          <NButton class="w-72px" type="primary" @click="handleQuery">{{ $t('common.search') }}</NButton>
          <NButton class="ml-20px w-72px" type="primary" @click="handleReset">{{ $t('common.reset') }}</NButton>
        </NFormItem>
      </NForm>
      <div class="flex pb-12px" :class="getPlatform ? '' : 'flex-justify-end'">
        <NButton type="primary" @click="getTableData">
          <IconMdiRefresh class="mr-4px text-16px" :class="{ 'animate-spin': loading }" />
          {{ $t('common.refreshTable') }}
        </NButton>
      </div>
      <NDataTable
        remote
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        class="flex-1-hidden"
      />
      <NDrawer v-model:show="editPwdVisible" display-directive="show" width="80%" placement="right">
        <NDrawerContent :title="$t('page.product.update-ota.lookTask')" closable>
          <DeviceRegister :mid="currentMid" :record="editData" />
        </NDrawerContent>
      </NDrawer>
    </NCard>
  </div>
</template>

<style scoped></style>
