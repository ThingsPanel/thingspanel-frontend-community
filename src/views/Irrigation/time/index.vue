<script setup lang="tsx">
import { onMounted, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { NButton, NSpace, useDialog } from 'naive-ui';
import type { CascaderOption, PaginationProps } from 'naive-ui';
import { useBoolean, useLoading } from '@sa/hooks';
import { irrigationControlTypeOption, irrigationPlanStatus, irrigationPlanStatusOption } from '@/constants/business';
import {
  getIrrigationDistricts,
  getIrrigationSpaces,
  getIrrigationTimeList,
  irrigationTimeCancle,
  irrigationTimeDel,
  irrigationTimeDistribute
} from '@/service/api/irrigation';
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
  district_id: string | null;
  device_name: string | null;
  control_type: string | null;
  status: string | null;
  page: number;
  page_size: number;
}

const queryParams = reactive<QueryFormModel>({
  district_id: null,
  device_name: null,
  control_type: null,
  status: null,
  page: 1,
  page_size: 10
});

const tableData = ref<any>([]);

function setTableData(data: any) {
  tableData.value = data;
}

async function getTableData() {
  startLoading();
  const { data } = await getIrrigationTimeList(queryParams);
  if (data) {
    const list: any = data.list;
    setTableData(list);
    endLoading();
  }
}

// 下发
const runDistribute = (rowId: string, status: 2 | 3) => {
  dialog.warning({
    title: $t('common.tip'),
    content: status === 3 ? $t('common.planTheDevice') : $t('common.cancelThePlan'),
    positiveText: $t('device_template.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      if (status === 3) {
        await irrigationTimeDistribute(rowId, { status });
      } else {
        await irrigationTimeCancle({ id: rowId, status });
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
      await irrigationTimeDel(rowId);
      init();
    }
  });
};
const columns: Ref<any> = ref([
  {
    key: 'space_name',
    minWidth: '140px',
    title: () => $t('page.irrigation.areaOrSpace'),
    align: 'center',
    ellipsis: {
      tooltip: true
    },
    render: row => {
      return `${row.space_name}|${row.discrict_name}`;
    }
  },
  {
    key: 'name',
    minWidth: '140px',
    title: () => $t('page.irrigation.time.planName'),
    align: 'center',
    ellipsis: {
      tooltip: true
    }
  },
  {
    key: 'control_type',
    minWidth: '140px',
    title: () => $t('page.irrigation.controlType'),
    align: 'center',
    render: row => {
      return row.control_type === 'A' ? $t('page.irrigation.duration') : $t('page.irrigation.capacity');
    }
  },
  {
    key: 'schedule',
    minWidth: '140px',
    title: () => $t('page.irrigation.time.repeatTime'),
    align: 'center',
    ellipsis: {
      tooltip: true
    },
    render: row => {
      const p = [
        $t('page.irrigation.time.week.monday'),
        $t('page.irrigation.time.week.tuesday'),
        $t('page.irrigation.time.week.wednesday'),
        $t('page.irrigation.time.week.thursday'),
        $t('page.irrigation.time.week.friday'),
        $t('page.irrigation.time.week.saturday'),
        $t('page.irrigation.time.week.sunday')
      ];
      const t = row.schedule.split(',');
      const list: any = [];
      t.forEach(i => {
        list.push(p[Number(i - 1)]);
      });
      return list.join(',');
    }
  },
  {
    key: 'id',
    minWidth: '140px',
    title: () => $t('page.irrigation.time.orderCode'),
    ellipsis: {
      tooltip: true
    },
    align: 'center'
  },
  {
    key: 'irrigation_time',
    minWidth: '140px',
    title: () => $t('page.irrigation.time.irrigationTime'),
    align: 'center'
  },
  {
    key: 'valve_opening',
    minWidth: '140px',
    title: () => $t('page.irrigation.time.doorOpeing'),
    align: 'center'
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
            onClick={() => runDistribute(row.id, 3)}
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
            onClick={() => runDistribute(row.id, 2)}
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

// 编辑表格
function handleEditTable(rowId: string) {
  const findItem = tableData.value.find(item => item.id === rowId);
  if (findItem) {
    setEditData(findItem);
  }
  setModalType('edit');
  openModal();
}

// 日志
function handOpenLogModal(rowId: string) {
  const findItem = tableData.value.find(item => item.id === rowId);
  if (findItem) {
    setEditData(findItem);
  }
  openLogModal();
}

// 分页
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

// 重置表单
function handleReset() {
  Object.assign(queryParams, {
    district_id: null,
    device_name: null,
    control_type: null,
    status: null,
    page: 1
  });
  handleQuery();
}

function init() {
  getTableData();
}

// 初始化
init();
const spaceOptions = ref<any>([]);

// 区域选择请求空间
async function handleSpaceLoad(option: CascaderOption) {
  const { data } = await getIrrigationDistricts({ limit: 100, space_id: option.id });
  data.rows.forEach(i => {
    i.id = `${option.id},${i.id}`;
    i.depth = 2;
    i.isLeaf = true;
  });
  // eslint-disable-next-line require-atomic-updates
  option.children = data.rows;
}

onMounted(async () => {
  const { data } = await getIrrigationSpaces();
  data.rows.forEach(i => {
    i.depth = 1;
    i.isLeaf = false;
  });
  spaceOptions.value = data.rows;
});
</script>

<template>
  <div class="overflow-auto">
    <NCard :title="$t('page.irrigation.time.name')" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <NForm ref="queryFormRef" inline label-placement="left" :model="queryParams">
          <NFormItem :label="$t('page.irrigation.areaOrSpace')" path="district_id">
            <NCascader
              v-model:value="queryParams.district_id"
              :placeholder="$t('common.select')"
              :options="spaceOptions"
              :show-path="true"
              label-field="name"
              value-field="id"
              check-strategy="child"
              :on-load="handleSpaceLoad"
              class="important-w-200px"
              clearable
              remote
            />
          </NFormItem>
          <NFormItem :label="$t('page.irrigation.diviceName')" path="device_name">
            <NInput v-model:value="queryParams.device_name" clearable />
          </NFormItem>
          <NFormItem :label="$t('page.irrigation.controlType')" path="control_type">
            <NSelect
              v-model:value="queryParams.control_type"
              clearable
              class="w-200px"
              :options="irrigationControlTypeOption"
            />
          </NFormItem>
          <NFormItem :label="$t('page.irrigation.planStatus')" path="status">
            <NSelect
              v-model:value="queryParams.status"
              clearable
              class="w-200px"
              :options="irrigationPlanStatusOption"
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
          :flex-height="true"
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
