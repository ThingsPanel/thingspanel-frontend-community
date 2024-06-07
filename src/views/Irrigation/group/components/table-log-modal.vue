<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import type { PaginationProps } from 'naive-ui';
import { NButton, NSpace } from 'naive-ui';
import { useBoolean, useLoading } from '@sa/hooks';
import { irrigationGroupHistorys } from '@/service/api/irrigation';
import { $t } from '@/locales';
import LogRunModal from './log-rundetail-modal.vue';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 编辑的表格行数据 */
  editData?: any;
}

const { bool: devicesVisible, setTrue: openDevicesModal } = useBoolean();
const { loading, startLoading, endLoading } = useLoading(false);

defineOptions({ name: 'TableActionModal' });

const props = withDefaults(defineProps<Props>(), {
  editData: null
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;

  /** 点击协议 */
  (e: 'success'): void;
}

const emit = defineEmits<Emits>();

interface QueryFormModel {
  group_irrigation_id: string;
  page: number;
  page_size: number;
}

const queryParams = reactive<QueryFormModel>({
  group_irrigation_id: '',
  page: 1,
  page_size: 10
});

const modalVisible = computed({
  get() {
    return props.visible;
  },
  set(visible) {
    emit('update:visible', visible);
  }
});

// eslint-disable-next-line vue/no-dupe-keys
const editData = ref<any>(null);
const tableData = ref<any>([]);

function setTableData(data: any) {
  tableData.value = data;
}

async function getTableData() {
  startLoading();
  queryParams.group_irrigation_id = props.editData?.id || '';
  const { data } = await irrigationGroupHistorys(queryParams);
  endLoading();
  if (data) {
    const list: any = data.list;
    setTableData(list);
  }
}

function openDevicesModalFn(rowId: string) {
  const findItem = tableData.value.find(item => item.id === rowId);
  editData.value = findItem;
  openDevicesModal();
}

const columns: Ref<any> = ref([
  {
    key: 'execute_datetime',
    title: () => $t('page.irrigation.group.log.runTime'),
    align: 'center'
  },
  {
    key: 'operation_type',
    title: () => $t('custom.device_details.operationType'),
    align: 'center'
  },
  {
    key: 'execute_result',
    title: () => $t('page.irrigation.group.log.runResult'),
    align: 'center'
  },
  {
    key: 'execute_detail',
    title: () => $t('page.irrigation.group.log.detail'),
    align: 'center'
  },
  {
    key: 'actions',
    title: () => $t('common.action'),
    align: 'center',
    width: 120,
    render: row => {
      return (
        <NSpace justify={'center'}>
          <NButton type="info" quaternary size={'small'} onClick={() => openDevicesModalFn(row.id)}>
            {$t('page.irrigation.group.runDetail')}
          </NButton>
        </NSpace>
      );
    }
  }
]) as Ref<any>;

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

function init() {
  getTableData();
}

onMounted(async () => {
  init();
});
</script>

<template>
  <NModal
    v-model:show="modalVisible"
    preset="card"
    :title="$t('page.irrigation.group.log.planDetail')"
    class="h-600px w-900px"
  >
    <div class="h-full flex-col">
      <NDataTable
        :columns="columns"
        :data="tableData"
        :loading="loading"
        :pagination="pagination"
        :flex-height="true"
        class="flex-1-hidden"
      />
    </div>
    <LogRunModal v-if="devicesVisible" v-model:visible="devicesVisible" :edit-data="editData" @success="getTableData" />
  </NModal>
</template>

<style scoped></style>
