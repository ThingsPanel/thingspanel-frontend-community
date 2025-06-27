<script setup lang="tsx">
import { reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import {
  dataServiceFlagLabels,
  dataServiceSignModeLabels,
  dataServiceStatusLabels,
  dataServiceStatusOptions
} from '@/constants/business';
import { fetchDataServiceList } from '@/service/api_demo/management';
import { $t } from '@/locales';
import { formatDateTime } from '@/utils/common/datetime';
import type { ModalType } from './components/table-action-modal.vue';
import TableActionModal from './components/table-action-modal.vue';
import SecretKeyModal from './components/secret-key-modal.vue';
import { useBoolean, useLoading } from '~/packages/hooks';

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const { bool: secretKeyVisible, setTrue: openSecretKeyModal } = useBoolean();

const queryParams = reactive({
  name: '',
  status: null
});

const tableData = ref<DataService.Data[]>([]);

function setTableData(data: DataService.Data[]) {
  tableData.value = data;
}

async function getTableData() {
  startLoading();
  const { data } = (await fetchDataServiceList()) as any;
  if (data) {
    setTimeout(() => {
      setTableData(data);
      endLoading();
    }, 1000);
  }
}

const columns: Ref<DataTableColumns<DataService.Data>> = ref([
  {
    key: 'index',
    title: "序号",
    align: 'center',
    width: '120px'
  },
  {
    key: 'name',
    title: "名称",
    align: 'left'
  },
  {
    key: 'appKey',
    title: 'app_key',
    align: 'left'
  },
  {
    key: 'signMode',
    title: "签名方式",
    align: 'left',
    render: row => {
      if (row.signMode) {
        return <span>{dataServiceSignModeLabels[row.signMode]}</span>;
      }
      return <span></span>;
    }
  },
  {
    key: 'ip',
    title: "IP白名单",
    align: 'left'
  },
  {
    key: 'flag',
    title: "接口支持标志",
    align: 'left',
    render: row => {
      if (row.flag) {
        return <span>{dataServiceFlagLabels[row.flag]}</span>;
      }
      return <span></span>;
    }
  },
  {
    key: 'desc',
    title: "描述",
    align: 'left'
  },
  {
    key: 'createTime',
    title: "创建时间",
    align: 'left',
    render: row => {
      return formatDateTime(row.createTime);
    }
  },
  {
    key: 'status',
    title: "状态",
    align: 'left',
    render: row => {
      if (row.status) {
        const tagTypes: Record<DataService.StatusKey, NaiveUI.ThemeColor> = {
          '1': 'success',
          '2': 'warning'
        };
        return <NTag type={tagTypes[row.status]}>{dataServiceStatusLabels[row.status]}</NTag>;
      }
      return <span></span>;
    }
  },
  {
    key: 'actions',
    title: "操作",
    align: 'center',
    width: '300px',
    render: row => {
      return (
        <NSpace justify={'center'}>
          <NButton size={'small'} type="primary" onClick={() => handleViewKey(row.id)}>
            {"查看密钥"}
          </NButton>
          <NButton size={'small'} type="primary" onClick={() => handleEditTable(row.id)}>
            {"编辑"}
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDeleteTable(row.id)}>
            {{
              default: () => "确认删除",
              trigger: () => (
                <NButton type="error" size={'small'}>
                  {"删除"}
                </NButton>
              )
            }}
          </NPopconfirm>
        </NSpace>
      );
    }
  }
]) as Ref<DataTableColumns<DataService.Data>>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<DataService.Data | null>(null);

function setEditData(data: DataService.Data | null) {
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

function handleDeleteTable(rowId: string) {
  window.$message?.info(`${"点击了删除"}，rowId为${rowId}`);
}

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

/** 查看密钥 */
const secretKey = ref<string>('');

function handleViewKey(rowId: string) {
  secretKey.value = rowId;
  openSecretKeyModal();
}

function handleQuery() {
  init();
}

function init() {
  getTableData();
}

// 初始化
init();
</script>

<template>
  <div>
    <NCard :title="规则引擎" :bordered="false" class="h-full rounded-8px shadow-sm">
      <template #header-extra>
        <NButton type="primary" @click="handleAddTable">{{ "新增" }}</NButton>
      </template>
      <div class="h-full flex-col">
        <NForm ref="queryFormRef" inline label-placement="left" :model="queryParams">
          <NFormItem :label="规则名称" path="name">
            <NInput v-model:value="queryParams.name" />
          </NFormItem>
          <NFormItem :label="签名方式" path="status">
            <NSelect v-model:value="queryParams.status" clearable class="w-200px" :options="dataServiceStatusOptions" />
          </NFormItem>
          <NFormItem>
            <NButton class="w-72px" type="primary" @click="handleQuery">{{ "搜索" }}</NButton>
          </NFormItem>
        </NForm>
        <NDataTable
          :scroll-x="1088"
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          class="flex-1-hidden"
        />
        <TableActionModal
          v-model:visible="visible"
          :type="modalType"
          :edit-data="editData"
          @get-table-data="getTableData"
        />
      </div>
    </NCard>
    <SecretKeyModal v-model:visible="secretKeyVisible" :secret-key="secretKey"></SecretKeyModal>
  </div>
</template>

<style scoped></style>
