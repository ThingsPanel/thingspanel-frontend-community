<script setup lang="tsx">
/* ————————————————————————————————————————————— 产品预注册列表 ——————————————————————————————————————————————— */
import { computed, getCurrentInstance, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { NButton } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { useBoolean, useLoading } from '@sa/hooks';
import { $t } from '@/locales';
import { exportDevice, getPreProductList } from '@/service/product/list';
import { formatDateTime } from '@/utils/common/datetime';
import TableDeviceModal from './table-device-modal.vue';
import type { ModalType } from './table-action-modal.vue';
import ColumnSetting from './column-setting.vue';
const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const props: DeviceRegisterProps = defineProps({
  pid: {
    type: String,
    required: true
  }
});
const queryParams = reactive({
  batch_number: '',
  device_number: '',
  activate_flag: '',
  product_id: props.pid,
  page: 1,
  page_size: 10
});
watch(
  props,
  () => {
    queryParams.product_id = props.pid;
    getTableData();
  },
  { deep: true }
);
const tableData = ref<PreproductDeviceRecord[]>([]);
function setTableData(data: PreproductDeviceRecord[]) {
  tableData.value = data;
}
const exportFile = async () => {
  const { data } = await exportDevice({
    ...queryParams,
    page: undefined,
    page_size: undefined
  });
  data && window.open(data);
};

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
    batch_number: '',
    device_number: '',
    activate_flag: '',
    page: 1
  });
  handleQuery();
}
async function getTableData() {
  startLoading();
  const { data } = await getPreProductList(queryParams);
  if (data) {
    const list: PreproductDeviceRecord[] = data.list;
    setTableData(list);
    pagination.pageCount = Math.ceil(data.total / queryParams.page_size);
    endLoading();
  }
}

const columns: Ref<DataTableColumns<PreproductDeviceRecord>> = ref([
  {
    key: 'device_number',
    minWidth: '140px',
    title: $t('page.product.list.deviceNumber')
  },
  {
    key: 'batch_number',
    minWidth: '140px',
    title: $t('page.product.list.batchNumber')
  },
  {
    key: 'current_version',
    minWidth: '140px',
    title: $t('page.product.list.firmwareVersion')
  },
  {
    key: 'activate_flag',
    minWidth: '140px',
    title: $t('page.product.list.activeStatus'),
    render: row => {
      if (row.activate_flag === 'inactive' || row.activate_flag === 'N') {
        return $t('page.product.list.noActive');
      } else if (row.activate_flag === 'active') {
        return $t('page.product.list.active');
      }
      return '-';
    }
  },
  {
    key: 'activate_at',
    minWidth: '140px',
    title: $t('page.product.list.activeDate'),
    render: row => {
      return row.activate_at ? formatDateTime(row.activate_at) : '-';
    }
  }
]) as Ref<DataTableColumns<PreproductDeviceRecord>>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<PreproductDeviceRecord | null>(null);

function handleAddTable() {
  editData.value = null;
  openModal();
  setModalType('add');
}

// function handleEditPwd(rowId: string) {
// 	const findItem = tableData.value.find((item) => item.id === rowId);
// 	if (findItem) {
// 		setEditData(findItem);
// 	}
// 	openEditPwdModal();
// }

function init() {
  getTableData();
}
watch(
  visible,
  () => {
    if (!visible.value) {
      getTableData();
    }
  },
  { deep: true }
);
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});
// 初始化
init();
const activeOptions = [
  {
    label: $t('page.product.list.active'),
    value: 'active'
  },
  {
    label: $t('page.product.list.noActive'),
    value: 'inactive'
  }
];
</script>

<template>
  <div class="flex-col overflow-y-auto">
    <NCard>
      <NForm :inline="!getPlatform" label-placement="left" :model="queryParams">
        <NFormItem :label="$t('page.product.list.batchNumber')" path="batchNumber">
          <NInput v-model:value="queryParams.batch_number" />
        </NFormItem>
        <NFormItem :label="$t('page.product.list.deviceNumber')" path="deviceNumber">
          <NInput v-model:value="queryParams.device_number" />
        </NFormItem>
        <!-- 激活状态 -->
        <NFormItem :label="$t('page.product.list.activeStatus')" path="activate_flag">
          <NSelect
            v-model:value="queryParams.activate_flag"
            class="w-150px"
            :placeholder="$t('common.select') + $t('page.product.list.activeStatus')"
            :options="activeOptions"
          />
        </NFormItem>
        <NFormItem>
          <NButton class="w-72px" type="primary" @click="handleQuery">{{ $t('common.search') }}</NButton>
          <NButton class="ml-20px w-72px" type="primary" @click="handleReset">{{ $t('common.reset') }}</NButton>
        </NFormItem>
      </NForm>
      <div class="m-b-20px flex flex-wrap items-center gap-15px">
        <div class="flex flex-1 gap-15px">
          <NButton type="primary" @click="handleAddTable">
            <template #icon>
              <IconIcRoundPlus class="mr-4px text-20px" />
            </template>
            <!-- 创建批次 -->
            {{ $t('page.product.list.batchAdd') }}
          </NButton>
          <NButton type="primary" @click="exportFile">
            <template #icon>
              <IconAntDesignExportOutlined class="mr-4px text-20px" />
            </template>

            {{ $t('common.export') }}
          </NButton>
        </div>
        <div class="flex items-center gap-15px">
          <NButton type="primary" @click="getTableData">
            <IconMdiRefresh class="mr-4px text-16px" :class="{ 'animate-spin': loading }" />
            {{ $t('common.refreshTable') }}
          </NButton>
          <ColumnSetting v-model:columns="columns" />
        </div>
      </div>

      <div class="flex flex-1 overflow-y-auto">
        <NDataTable
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          remote
          class="flex-1-hidden"
        />
        <TableDeviceModal
          v-model:visible="visible"
          :pid="props.pid"
          :type="modalType"
          :edit-data="(editData as unknown as deviceAddType)"
          @success="getTableData"
        />
      </div>
    </NCard>
  </div>
</template>

<style scoped></style>
