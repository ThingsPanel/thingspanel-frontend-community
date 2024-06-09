<script setup lang="tsx">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { irrigationTimeHistorys } from '@/service/api/irrigation';
import { $t } from '@/locales';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 编辑的表格行数据 */
  editData?: any;
}

const { loading } = useLoading(false);

const props = withDefaults(defineProps<Props>(), {
  editData: null
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;
}

const emit = defineEmits<Emits>();

interface QueryFormModel {
  page: number;
  page_size: number;
  scheduled_irrigation_id: string;
}

const queryParams = reactive<QueryFormModel>({
  scheduled_irrigation_id: '',
  page: 1,
  page_size: 10
});

onMounted(() => {
  queryParams.scheduled_irrigation_id = props.editData?.id;
  getTableData();
});

const modalVisible = computed({
  get() {
    return props.visible;
  },
  set(visible) {
    emit('update:visible', visible);
  }
});

const tableData = ref<any>([]);

async function getTableData() {
  const { data } = await irrigationTimeHistorys(queryParams);
  tableData.value = data.list;
}

const columns: Ref<DataTableColumns<UserManagement.User>> = ref([
  {
    key: 'command_datetime',
    title: () => $t('page.irrigation.time.log.commandIssuanceTime'),
    align: 'center'
  },
  {
    key: 'command',
    title: () => $t('page.irrigation.time.log.instructionContent'),
    align: 'center'
  },
  {
    key: 'execution_result',
    title: () => $t('page.irrigation.time.log.result'),
    align: 'center'
  },
  {
    key: 'operation_type',
    title: () => $t('custom.device_details.operationType'),
    align: 'center'
  },
  {
    key: 'execute_process',
    title: () => $t('page.irrigation.time.log.detail'),
    align: 'center'
  }
]) as Ref<DataTableColumns<UserManagement.User>>;

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

// 初始化
watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      queryParams.scheduled_irrigation_id = props.editData?.id;
      getTableData();
    }
  }
);
</script>

<template>
  <NModal
    v-model:show="modalVisible"
    preset="card"
    :title="$t('page.irrigation.time.log.name')"
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
  </NModal>
</template>

<style scoped></style>
