<script setup lang="tsx">
import { reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { useBoolean, useLoading } from '@sa/hooks';
import { ruleEngineStatusLabels } from '@/constants/business';
import { fetchRuleEngineList } from '@/service/api_demo/management';
import { $t } from '@/locales';
import type { ModalType } from './components/table-action-modal.vue';
import TableActionModal from './components/table-action-modal.vue';

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
    title: $t('common.index'),
    align: 'center',
    minWidth: '140px'
  },
  {
    key: 'name',
    title: $t('generate.rule-name'),
    minWidth: '140px',
    align: 'left'
  },
  {
    key: 'status',
    title: $t('generate.rule-name'),
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
    title: $t('common.action'),
    align: 'center',
    minWidth: '140px',
    render: row => {
      return (
        <NSpace justify={'center'}>
          <NButton size={'small'} ghost type="primary" onClick={() => handleActivate(row.id)}>
            {$t('generate.startup')}
          </NButton>
          <NButton size={'small'} type="warning" onClick={() => handlePause(row.id)}>
            {$t('generate.suspend')}
          </NButton>
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
  console.log(rowId);
}

function handlePause(rowId: string) {
  console.log(rowId);
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
  window.$message?.info(`${$t('generate.clickDelete')}，rowId${$t('generate.by')}${rowId}`);
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
  <NCard :title="$t('generate.rule-engine')" :bordered="false" class="h-full rounded-8px shadow-sm">
    <template #header-extra>
      <NButton @click="handleAddTable">{{ $t('generate.create-access-rule') }}</NButton>
      <NButton class="ml-10px">{{ $t('device_template.release') }}</NButton>
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
