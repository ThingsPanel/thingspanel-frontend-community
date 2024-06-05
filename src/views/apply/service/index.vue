<script setup lang="tsx">
import { reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { NButton, NPopconfirm, NSpace } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { useBoolean, useLoading } from '@sa/hooks';
import { serviceManagementDeviceTypeLabels } from '@/constants/business';
import { delProtocolPlugin, fetchProtocolPluginList } from '@/service/api';
import { $t } from '@/locales';
import type { ModalType } from './components/table-action-modal.vue';
import TableActionModal from './components/table-action-modal.vue';

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();

const tableData = ref<ServiceManagement.Service[]>([]);

function setTableData(data: ServiceManagement.Service[]) {
  tableData.value = data;
}

type QueryFormModel = {
  page: number;
  page_size: number;
};

const queryParams = reactive<QueryFormModel>({
  page: 1,
  page_size: 10
});
const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30],
  onChange: (page: number) => {
    pagination.page = page;
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
  }
});

async function getTableData() {
  startLoading();
  const { data } = await fetchProtocolPluginList(queryParams);
  if (data) {
    const list: Api.ApiApplyManagement.Service[] = data.list;
    pagination.itemCount = data.total;
    setTableData(list);
    endLoading();
  }
}

const columns: Ref<DataTableColumns<ServiceManagement.Service>> = ref([
  {
    key: 'name',
    minWidth: '140px',
    title: () => $t('page.apply.service.form.serviceName'),
    align: 'left'
  },
  {
    key: 'device_type',
    minWidth: '140px',
    title: () => $t('page.apply.service.form.deviceType'),
    align: 'left',
    render: row => {
      if (row.device_type) {
        return <span>{serviceManagementDeviceTypeLabels[row.device_type]}</span>;
      }
      return <span></span>;
    }
  },
  {
    key: 'protocol_type',
    minWidth: '140px',
    title: () => $t('page.apply.service.form.protocolType'),
    align: 'left'
  },
  {
    key: 'access_address',
    minWidth: '140px',
    title: () => $t('page.apply.service.form.accessAddress'),
    align: 'left'
  },
  {
    key: 'http_address',
    minWidth: '140px',
    title: () => $t('page.apply.service.form.httpAddress'),
    align: 'left'
  },
  {
    key: 'sub_topic_prefix',
    minWidth: '140px',
    title: () => $t('page.apply.service.form.subTopicPrefix'),
    align: 'left'
  },
  {
    key: 'description',
    minWidth: '140px',
    title: () => $t('common.description'),
    align: 'left'
  },
  {
    key: 'actions',
    title: () => $t('common.action'),
    align: 'center',
    minWidth: '140px',
    render: row => {
      return (
        <NSpace justify={'center'}>
          {
            <NButton size={'small'} type="primary" onClick={() => handleEditTable(row.id)}>
              {$t('common.edit')}
            </NButton>
          }
          <NPopconfirm
            negative-text={$t('common.cancel')}
            positive-text={$t('common.confirm')}
            onPositiveClick={() => handleDeleteTable(row.id)}
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
]) as Ref<DataTableColumns<ServiceManagement.Service>>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<ServiceManagement.Service | null>(null);

function setEditData(data: ServiceManagement.Service | null) {
  editData.value = data;
}

function handleAddTable() {
  openModal();
  setModalType('add');
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
  const data = await delProtocolPlugin(rowId);
  if (!data.error) {
    // window.$message?.success($t('common.deleteSuccess'));
    await getTableData();
  }
}

function init() {
  getTableData();
}

// 初始化
init();
</script>

<template>
  <div>
    <NCard :title="$t('route.apply_service')" :bordered="false" class="h-full rounded-8px shadow-sm">
      <template #header-extra>
        <NButton type="primary" @click="handleAddTable">
          {{ $t('common.add') }}
        </NButton>
      </template>
      <div class="h-full flex-col">
        <NDataTable
          :remote="true"
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          class="flex-1-hidden"
        />
        <TableActionModal v-model:visible="visible" :type="modalType" :edit-data="editData" @success="getTableData" />
      </div>
    </NCard>
  </div>
</template>

<style scoped></style>
