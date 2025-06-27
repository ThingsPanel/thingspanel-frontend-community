<script setup lang="tsx">
import { reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { useBoolean, useLoading } from '@sa/hooks';
import { ruleEngineStatusLabels } from '@/constants/business';
import { fetchRuleEngineList } from '@/service/api_demo/management';
import { $t } from '@/locales';
import { createLogger } from '@/utils/logger';
import type { ModalType } from './components/table-action-modal.vue';
import TableActionModal from './components/table-action-modal.vue';
const logger = createLogger('Engie');

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();

const tableData = ref<RuleEngine.Rule[]>([]);

function setTableData(data: RuleEngine.Rule[]) {
  tableData.value = data;
}

async function getTableData() {
  startLoading();
  const { data } = (await fetchRuleEngineList()) as any;
  if (data) {
    setTimeout(() => {
      setTableData(data);
      endLoading();
    }, 1000);
  }
}

const columns: Ref<DataTableColumns<RuleEngine.Rule>> = ref([
  {
    key: 'index',
    title: "序号",
    align: 'left',
    minWidth: '140px'
  },
  {
    key: 'name',
    title: "规则名称",
    minWidth: '140px',
    align: 'left'
  },
  {
    key: 'status',
    title: "规则名称",
    minWidth: '140px',
    align: 'left',
    render: row => {
      if (row.status) {
        const tagTypes: Record<RuleEngine.StatusKey, NaiveUI.ThemeColor> = {
          '1': 'success',
          '2': 'warning'
        };
        return <NTag type={tagTypes[row.status]}>{ruleEngineStatusLabels[row.status]}</NTag>;
      }
      return <span></span>;
    }
  },
  {
    key: 'actions',
    title: "操作",
    align: 'left',
    width: '300px',
    render: row => {
      return (
        <NSpace justify={'center'}>
          <NButton size={'small'} ghost type="primary" onClick={() => handleActivate(row.id)}>
            {"启动"}
          </NButton>
          <NButton size={'small'} type="warning" onClick={() => handlePause(row.id)}>
            {"暂停"}
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
]) as Ref<DataTableColumns<RuleEngine.Rule>>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<RuleEngine.Rule | null>(null);

function setEditData(data: RuleEngine.Rule | null) {
  editData.value = data;
}

function handleAddTable() {
  openModal();
  setModalType('add');
}

function handleActivate(rowId: string) {
  logger.info(rowId);
}

function handlePause(rowId: string) {
  logger.info(rowId);
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
  window.$message?.info(`${"点击了删除"}，rowId${"为"}${rowId}`);
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

function init() {
  getTableData();
}

// 初始化
init();
</script>

<template>
  <NCard :title="规则引擎" :bordered="false" class="h-full rounded-8px shadow-sm">
    <template #header-extra>
      <NButton @click="handleAddTable">{{ "创建接入规则" }}</NButton>
      <NButton class="ml-10px">{{ "发布" }}</NButton>
      <!--
 <n-button type="error">
          <icon-ic-round-delete class="mr-4px text-20px" />
          删除
        </n-button>
        <n-button type="success">
          <icon-uil:export class="mr-4px text-20px" />
          导出Excel
        </n-button>
-->
    </template>
    <div class="h-full flex-col">
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
</template>

<style scoped></style>
