<script setup lang="tsx">
import { computed, getCurrentInstance, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { NButton, NSpace } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { useBoolean, useLoading } from '@sa/hooks';
import { $t } from '@/locales';
import { formatDateTime } from '@/utils/common/datetime';
import { getStaticUrl } from '@/utils/common/tool';
import { getOtaTaskList } from '@/service/product/update-ota';
import TableDeviceModal from './table-device-modal.vue';
import TableDetailModal from './table-detail-modal.vue';
import type { ModalType } from './table-action-modal.vue';
import ColumnSetting from './column-setting.vue';
const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const { bool: visibleTable, setTrue: openTable } = useBoolean();
const props: any = defineProps({
  mid: {
    type: Number,
    required: true
  },
  record: {
    type: Object,
    required: true
  }
});

const queryParams = reactive({
  deviceNumber: '',
  batchNumber: '',
  page: 1,
  page_size: 10
});

const activeTab = ref('mission');
const tableData = ref<productDeviceRecord[]>([]);

function setTableData(data: productDeviceRecord[]) {
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

async function getTableData() {
  startLoading();
  const { data } = await getOtaTaskList({
    ...queryParams,
    ota_upgrade_package_id: props.mid
  });
  if (data) {
    const list: productDeviceRecord[] = data.list;
    setTableData(list);
    pagination.pageCount = Math.ceil(data.total / queryParams.page_size);
    endLoading();
  }
}

const columns: Ref<DataTableColumns<productDeviceRecord>> = ref([
  // 任务名称
  {
    key: 'name',
    minWidth: '140px',
    title: $t('page.product.update-ota.taskName')
  },
  // 设备数量
  {
    key: 'device_count',
    minWidth: '140px',
    title: $t('page.product.update-ota.deviceNum')
  },
  // 描述
  {
    key: 'description',
    minWidth: '140px',
    title: $t('page.product.update-ota.desc')
  },
  // 创建日期
  {
    key: 'created_at',
    minWidth: '140px',
    title: $t('page.product.update-ota.createTime'),
    render: (row: any) => {
      return formatDateTime(row.created_at);
    }
  },
  {
    key: 'actions',
    minWidth: '140px',
    title: $t('common.action'),
    align: 'center',
    render: (row: any) => {
      return (
        <NSpace justify={'center'}>
          <NButton size={'small'} type="primary" onClick={() => handleEditTable(row)}>
            {$t('page.product.update-ota.taskDetail')}
          </NButton>
        </NSpace>
      );
    }
  }
]) as Ref<DataTableColumns<productDeviceRecord>>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

/** 添加升级任务 */
function handleAddTable() {
  // editData.value = null;
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
const rowData = ref<UpgradeTaskDetail | null>(null);
function handleEditTable(row) {
  rowData.value = row;
  setModalType('edit');
  openTable();
}

function init() {
  getTableData();
}

// 初始化
init();

const downloadPackage = () => {
  const url = getStaticUrl(props.record.package_url);
  if (url) {
    window.open(url);
  }
};

const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});
</script>

<template>
  <div class="h-full overflow-hidden">
    <NCard class="h-full">
      <div class="h-full flex-col">
        <NTabs v-model:value="activeTab" type="line" animated>
          <NTabPane name="mission" :tab="$t('page.product.update-ota.taskList')"></NTabPane>
          <NTabPane name="info" :tab="$t('page.product.update-ota.packageInfo')"></NTabPane>
        </NTabs>
        <NSpace v-if="activeTab === 'mission'" class="pb-12px" justify="space-between">
          <NSpace>
            <NButton type="primary" @click="handleAddTable">
              <IconIcRoundPlus class="mr-4px text-20px" />
              {{ $t('page.product.update-ota.updateTask') }}
            </NButton>
          </NSpace>
          <NSpace align="center" :size="18">
            <NButton size="small" type="primary" @click="getTableData">
              <IconMdiRefresh class="mr-4px text-16px" :class="{ 'animate-spin': loading }" />
              {{ $t('common.refreshTable') }}
            </NButton>
            <ColumnSetting v-model:columns="columns" />
          </NSpace>
        </NSpace>
        <NDataTable
          v-if="activeTab === 'mission'"
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          remote
          flex-height
          class="flex-1-hidden"
        />
        <div v-if="activeTab === 'info'">
          <NForm label-placement="left" :model="props.record">
            <NGrid :cols="24" :x-gap="18">
              <NFormItemGridItem
                :span="24"
                :label="`${$t('page.product.update-package.signMode')}：`"
                path="signature_type"
              >
                {{ props.record.signature_type || '-' }}
              </NFormItemGridItem>
            </NGrid>
            <NGrid :cols="24" :x-gap="18">
              <NFormItemGridItem :span="24" :label="`${$t('page.product.update-ota.packageSign')}：`" path="signature">
                <NSpace class="w-full" :size="24" align="center">
                  {{ props.record.signature || '-' }}
                  <NButton class="w-72px" type="primary" @click="downloadPackage">
                    {{ $t('page.product.update-ota.download') }}
                  </NButton>
                </NSpace>
              </NFormItemGridItem>
            </NGrid>
            <NGrid :cols="24" :x-gap="24">
              <NFormItemGridItem
                :span="24"
                :label="`${$t('page.product.update-ota.customMessage')}：`"
                path="additional_info"
              >
                {{ props.record.additional_info || '-' }}
              </NFormItemGridItem>
            </NGrid>
          </NForm>
        </div>
        <TableDeviceModal
          v-model:visible="visible"
          :edit-data="props.record"
          :type="modalType"
          :pid="props.record.id"
          @success="getTableData"
        />
        <TableDetailModal
          v-model:visible="visibleTable"
          :class="getPlatform ? 'w-90%' : ' w-1200px'"
          :type="modalType"
          :edit-data="rowData"
        />
      </div>
    </NCard>
  </div>
</template>

<style scoped></style>
