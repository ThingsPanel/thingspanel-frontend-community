<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import type { PaginationProps } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { irrigationRotationHistorysDetail } from '@/service/api/irrigation';
import { $t } from '@/locales';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit';
  /** 编辑的表格行数据 */
  editData?: any;
}

const { loading, startLoading, endLoading } = useLoading(false);
export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'TableActionModal' });

const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;
}

const emit = defineEmits<Emits>();

interface QueryFormModel {
  id: string;
  page: number;
  page_size: number;
}

const queryParams = reactive<QueryFormModel>({
  id: '',
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

const tableData = ref<any>([]);

function setTableData(data: any) {
  tableData.value = data;
}

async function getTableData() {
  startLoading();
  queryParams.id = props.editData?.id || '';
  const { data } = await irrigationRotationHistorysDetail(queryParams);
  endLoading();
  if (data) {
    const list: any = data.list;
    setTableData(list);
  }
}

const columns: Ref<any> = ref([
  {
    key: 'command_datetime',
    title: () => $t('page.irrigation.group.detail.commandIssuanceTime'),
    ellipsis: {
      tooltip: true
    },
    align: 'center'
  },
  {
    key: 'space_and_district',
    title: () => $t('page.irrigation.group.detail.spaceOrArea'),
    ellipsis: {
      tooltip: true
    },
    align: 'center'
  },
  {
    key: 'device_name',
    title: () => $t('page.irrigation.group.deviceName'),
    ellipsis: {
      tooltip: true
    },
    align: 'center'
  },
  {
    key: 'command_id',
    title: () => $t('page.irrigation.group.orderNumber'),
    ellipsis: {
      tooltip: true
    },
    align: 'center'
  },
  {
    key: 'command',
    title: () => $t('page.irrigation.group.detail.orderContent'),
    ellipsis: {
      tooltip: true
    },
    align: 'center'
  },
  {
    key: 'result',
    title: () => $t('page.irrigation.group.detail.result'),
    ellipsis: {
      tooltip: true
    },
    align: 'center'
  },
  {
    key: 'execute_detail',
    title: () => $t('page.irrigation.group.detail.detail'),
    ellipsis: {
      tooltip: true
    },
    align: 'center'
  },
  {
    key: 'operation_type',
    title: () => $t('custom.device_details.operationType'),
    align: 'center'
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
onMounted(() => {
  getTableData();
});
</script>

<template>
  <NModal
    v-model:show="modalVisible"
    preset="card"
    :title="$t('page.irrigation.group.runDetail')"
    class="h-600px w-1400px"
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
