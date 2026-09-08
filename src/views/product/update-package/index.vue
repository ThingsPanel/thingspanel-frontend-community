<script setup lang="tsx">
import { computed, getCurrentInstance, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { NButton, NPopconfirm, NSpace } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { useBoolean, useLoading } from '@sa/hooks';
import { $t } from '@/locales';
import { deleteOtaPackage, getOtaPackageList } from '@/service/product/update-package';
import { getDeviceConfigList } from '@/service/api/device';
import { formatDateTime } from '@/utils/common/datetime';
import TablePackageModal from './components/table-package-modal.vue';
import type { ModalType } from './components/table-package-modal.vue';
import ColumnSetting from './components/column-setting.vue';

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();

const queryParams = reactive({
  name: '',
  device_config_id: '',
  page: 1,
  page_size: 10
});
watch(
  visible,
  () => {
    if (!visible) {
      getTableData();
    }
  },
  { deep: true }
);
const tableData = ref<productPackageRecord[]>([]);

function setTableData(data: productPackageRecord[]) {
  tableData.value = data;
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

async function getTableData() {
  startLoading();
  const { data } = await getOtaPackageList(queryParams);
  if (data) {
    const list: productPackageRecord[] = data.list;
    setTableData(list);
    pagination.pageCount = Math.ceil(data.total / queryParams.page_size);
    endLoading();
  }
}

const columns: Ref<DataTableColumns<productPackageRecord>> = ref([
  {
    key: 'name',
    minWidth: '100px',
    title: $t('page.product.update-package.packageName')
  },
  {
    key: 'target_version',
    minWidth: '140px',
    title: $t('page.product.update-package.version')
  },
  {
    key: 'version',
    minWidth: '110px',
    title: $t('page.product.update-package.versionCode')
  },
  {
    key: 'device_config_name',
    minWidth: '140px',
    title: $t('page.product.update-package.deviceConfig')
  },
  {
    key: 'package_type',
    minWidth: '110px',
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
    title: $t('common.action'),
    align: 'center',
    minWidth: '140px',
    render: row => {
      return (
        <NSpace justify={'center'}>
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
      );
    }
  }
]) as Ref<DataTableColumns<productPackageRecord>>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<productPackageRecord | null>(null);

function setEditData(data: productPackageRecord | null) {
  editData.value = data;
}

function handleAddTable() {
  setEditData(null);
  setModalType('add');
  openModal();
}

function handleEditTable(rowId: string) {
  const findItem = tableData.value.find(item => item.id === rowId);
  if (findItem) {
    setEditData(findItem);
  }
  setModalType('edit');
  openModal();
}

async function handleDeleteTable(rowId: string) {
  const data = await deleteOtaPackage(rowId);
  if (!data.error) {
    // window.$message?.success($t('common.deleteSuccess'));
    getTableData();
  }
}

const deviceOptions = ref();
const getList = async (name?: string) => {
  const { data, error } = await getDeviceConfigList({
    page: 1,
    page_size: 99,
    name
  });
  if (!error && data) {
    deviceOptions.value = data?.list?.map(item => {
      return { label: item.name, value: item.id };
    });
  }
};
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});
function init() {
  getList();
  getTableData();
}

// 初始化
init();
</script>

<template>
  <div>
    <NCard :title="$t('page.product.update-package.packageList')">
      <NForm :inline="!getPlatform" label-placement="left" :model="queryParams">
        <NFormItem :label="$t('page.product.list.deviceConfig')" path="email">
          <NSelect v-model:value="queryParams.device_config_id" filterable :options="deviceOptions" @search="getList" />
        </NFormItem>
        <NFormItem :label="$t('page.product.update-package.packageName')" path="name">
          <NInput v-model:value="queryParams.name" />
        </NFormItem>
        <NFormItem>
          <NButton class="w-72px" type="primary" @click="handleQuery">{{ $t('common.search') }}</NButton>
          <NButton class="ml-20px w-72px" type="primary" @click="handleReset">{{ $t('common.reset') }}</NButton>
        </NFormItem>
      </NForm>
      <div class="flex flex-wrap items-center gap-15px pb-12px">
        <div class="flex-1">
          <NButton type="primary" @click="handleAddTable">
            <IconIcRoundPlus class="mr-4px text-20px" />
            {{ $t('common.add') }}
          </NButton>
        </div>
        <div class="flex flex-1 items-center gap-15px" :class="getPlatform ? '' : 'flex-justify-end'">
          <NButton type="primary" @click="getTableData">
            <IconMdiRefresh class="text-16px" :class="{ 'animate-spin': loading }" />
            {{ $t('common.refreshTable') }}
          </NButton>
          <ColumnSetting v-model:columns="columns" />
        </div>
      </div>
      <NDataTable
        remote
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        class="flex-1-hidden"
      />
      <TablePackageModal
        v-model:visible="visible"
        :class="getPlatform ? 'w-90%' : 'w-800px'"
        :type="modalType"
        :edit-data="editData"
        @success="getTableData"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
