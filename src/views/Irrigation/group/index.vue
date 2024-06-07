<script setup lang="tsx">
import { reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { NButton, NSpace, useDialog } from 'naive-ui';
import type { PaginationProps } from 'naive-ui';
import { useBoolean, useLoading } from '@sa/hooks';
import {
  getIrrigationGroupList,
  irrigationGroupCancle,
  irrigationGroupDel,
  irrigationGroupExcute
} from '@/service/api';
import {
  irrigationControlType,
  irrigationControlTypeOption,
  irrigationPlanStatus,
  irrigationScheduleType,
  irrigationScheduleTypeOption
} from '@/constants/business';
import { $t } from '@/locales';
import TableActionModal from './components/table-action-modal.vue';
import TableLogModal from './components/table-log-modal.vue';
import type { ModalType } from './components/table-action-modal.vue';
// import ColumnSetting from './components/column-setting.vue'
const dialog = useDialog();
const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const { bool: logVisible, setTrue: openLogModal } = useBoolean();

interface QueryFormModel {
  schedule_type: string | null;
  control_type: string | null;
  page: number;
  page_size: number;
}

const queryParams = reactive<QueryFormModel>({
  schedule_type: null,
  control_type: null,
  page: 1,
  page_size: 10
});

const tableData = ref<any>([]);

function setTableData(data: any) {
  tableData.value = data;
}

async function getTableData() {
  startLoading();
  const { data } = await getIrrigationGroupList(queryParams);
  if (data) {
    const list: any = data.list;
    setTableData(list);
    endLoading();
  }
}

// 下发
const runDistribute = (rowId: string, status: number) => {
  dialog.warning({
    title: $t('common.tip'),
    content: status === 4 ? $t('common.planTheDevice') : $t('common.cancelThePlan'),
    positiveText: $t('device_template.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      if (status === 4) {
        await irrigationGroupExcute(rowId);
      } else {
        await irrigationGroupCancle(rowId);
      }
      init();
    }
  });
};

// 删除
const runDel = (rowId: string) => {
  dialog.warning({
    title: $t('common.tip'),
    content: $t('common.deleteThePlan'),
    positiveText: $t('device_template.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      await irrigationGroupDel(rowId);
      init();
    }
  });
};

const columns: Ref<any> = ref([
  {
    key: 'name',
    minWidth: '140px',
    title: () => $t('page.irrigation.time.planName'),
    align: 'center'
  },
  {
    key: 'schedule_type',
    minWidth: '140px',
    title: () => $t('page.irrigation.group.controlModel'),
    align: 'center',
    render: row => {
      return irrigationScheduleType[row.schedule_type];
    }
  },
  {
    key: 'start_irrigation_datetime',
    minWidth: '140px',
    title: () => $t('page.irrigation.group.startTime'),
    align: 'center'
  },
  {
    key: 'id',
    minWidth: '140px',
    title: () => $t('page.irrigation.time.orderCode'),
    align: 'center',
    ellipsis: {
      tooltip: true
    }
  },
  {
    key: 'valve_opening',
    minWidth: '140px',
    title: () => $t('page.irrigation.time.doorOpeing'),
    align: 'center',
    render: row => {
      return `${row.valve_opening}%`;
    }
  },
  {
    key: 'status',
    minWidth: '140px',
    title: () => $t('page.irrigation.planStatus'),
    align: 'center',
    render: row => {
      return irrigationPlanStatus[row.status];
    }
  },
  {
    key: 'control_type',
    minWidth: '140px',
    title: () => $t('page.irrigation.controlType'),
    align: 'center',
    render: row => {
      return irrigationControlType[row.schedule_type];
    }
  },
  {
    key: 'actions',
    minWidth: '140px',
    title: () => $t('common.action'),
    align: 'center',
    render: row => {
      return (
        <NSpace justify={'center'}>
          <NButton
            v-show={row.status === 'PND' || row.status === 'CNL'}
            quaternary
            type="info"
            size={'small'}
            onClick={() => runDistribute(row.id, 4)}
          >
            {$t('page.irrigation.distribute')}
          </NButton>
          <NButton quaternary type="primary" size={'small'} onClick={() => handleEditTable(row.id)}>
            {$t('common.edit')}
          </NButton>
          <NButton quaternary type="primary" size={'small'} onClick={() => runDel(row.id)}>
            {$t('common.delete')}
          </NButton>
          <NButton quaternary type="primary" size={'small'} onClick={() => handOpenLogModal(row.id)}>
            {$t('page.irrigation.log')}
          </NButton>
          <NButton
            v-show={row.status === 'ISS'}
            quaternary
            type="primary"
            size={'small'}
            onClick={() => runDistribute(row.id, 0)}
          >
            {$t('common.cancel')}
          </NButton>
        </NSpace>
      );
    }
  }
]) as Ref<any>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<any>(null);

function setEditData(data: any) {
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

function handOpenLogModal(rowId: string) {
  const findItem = tableData.value.find(item => item.id === rowId);
  if (findItem) {
    setEditData(findItem);
  }
  openLogModal();
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
  init();
}

function handleReset() {
  Object.assign(queryParams, {
    schedule_type: null,
    control_type: null,
    page: 1
  });
  handleQuery();
}

function init() {
  getTableData();
}

// 初始化
init();
</script>

<template>
  <div class="overflow-auto">
    <NCard :title="$t('page.irrigation.group.name')" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <NForm ref="queryFormRef" inline label-placement="left" :model="queryParams">
          <NFormItem :label="$t('page.irrigation.group.controlModel')" path="status">
            <NSelect
              v-model:value="queryParams.schedule_type"
              clearable
              class="w-200px"
              :options="irrigationScheduleTypeOption"
            />
          </NFormItem>
          <NFormItem :label="$t('page.irrigation.controlType')" path="status">
            <NSelect
              v-model:value="queryParams.control_type"
              clearable
              class="w-200px"
              :options="irrigationControlTypeOption"
            />
          </NFormItem>
          <NFormItem>
            <NButton class="w-72px" type="primary" @click="handleQuery">{{ $t('common.search') }}</NButton>
            <NButton class="ml-20px w-72px" type="primary" @click="handleReset">{{ $t('common.reset') }}</NButton>
          </NFormItem>
        </NForm>
        <NSpace class="pb-12px" justify="space-between">
          <NSpace>
            <NButton type="primary" @click="handleAddTable">
              <IconIcRoundPlus class="mr-4px text-20px" />
              {{ $t('page.irrigation.addIrrigationPlan') }}
            </NButton>
          </NSpace>
        </NSpace>
        <NDataTable
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          class="flex-1-hidden"
        />
        <TableActionModal
          v-if="visible"
          v-model:visible="visible"
          :type="modalType"
          :edit-data="editData"
          @success="getTableData"
        />
        <TableLogModal v-if="logVisible" v-model:visible="logVisible" :edit-data="editData"></TableLogModal>
      </div>
    </NCard>
  </div>
</template>

<style scoped></style>
