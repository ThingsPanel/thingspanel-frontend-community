<script setup lang="tsx">
import { computed, getCurrentInstance, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { NButton } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import moment from 'moment';
import { getSystemLogList } from '@/service/api/system-management-user';
import { $t } from '@/locales';
import { formatDateTime } from '@/utils/common/datetime';
import { useLoading } from '~/packages/hooks';

const { loading, startLoading, endLoading } = useLoading(false);

const range = ref<[number, number]>([moment().subtract(1, 'months').valueOf(), moment().valueOf()]);

const queryParams = reactive({
  username: '',
  selected_time: null,
  start_time: '',
  end_time: ''
});
const total = ref(0);

const tableData = ref<Api.SystemManage.SystemLogList[]>([]);

function setTableData(data: Api.SystemManage.SystemLogList[] | []) {
  tableData.value = data || [];
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

const getTableData = async () => {
  startLoading();
  const prams = {
    page: pagination.page || 1,
    page_size: pagination.pageSize || 10,
    username: queryParams.username,
    start_time: queryParams.start_time,
    end_time: queryParams.end_time
  };
  const res = await getSystemLogList(prams);
  console.log(res);
  if (res?.data) {
    setTableData(res?.data.list || []);
    total.value = res.data.total || 0;
  }
  endLoading();
};

const columns: Ref<DataTableColumns<DataService.Data>> = ref([
  {
    key: 'created_at',
    title: $t('common.time'),
    minWidth: '140px',
    align: 'left',
    render: (row: any) => {
      return formatDateTime(row.created_at);
    }
  },
  {
    key: 'ip',
    minWidth: '140px',
    title: 'IP',
    align: 'left'
  },
  {
    key: 'path',
    title: $t('common.requestPath'),
    minWidth: '140px',
    align: 'left'
  },
  {
    key: 'name',
    minWidth: '140px',
    title: $t('common.requestMethod'),
    align: 'left'
  },
  {
    key: 'latency',
    title: $t('common.requestTime'),
    minWidth: '140px',
    align: 'left'
  },
  {
    key: 'username',
    title: $t('generate.username'),
    minWidth: '140px',
    align: 'left'
  }
]) as Ref<DataTableColumns<DataService.Data>>;

function handleQuery() {
  getTableData();
}
function pickerChange() {
  if (range.value && range.value.length > 0) {
    queryParams.start_time = moment(range.value[0]).format('YYYY-MM-DDTHH:mm:ssZ');
    queryParams.end_time = moment(range.value[1]).format('YYYY-MM-DDTHH:mm:ssZ');
  } else {
    queryParams.start_time = '';
    queryParams.end_time = '';
  }
}
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});
getTableData();
</script>

<template>
  <div>
    <NCard :title="$t('generate.system-log')">
      <NForm class="m-b-20px" :inline="!getPlatform" label-placement="left" :model="queryParams">
        <NFormItem class="max-w-200px" :label="$t('generate.username')" path="name">
          <NInput v-model:value="queryParams.username" />
        </NFormItem>
        <NFormItem path="selected_time">
          <NDatePicker
            v-model:value="range"
            type="datetimerange"
            clearable
            separator="-"
            @update:value="pickerChange"
          />
        </NFormItem>
        <NButton class="w-72px" type="primary" @click="handleQuery">{{ $t('generate.query') }}</NButton>
      </NForm>
      <NDataTable :columns="columns" :data="tableData" :loading="loading" class="flex-1-hidden" />
      <div class="pagination-box">
        <NPagination v-model:page="pagination.page" :item-count="total" @update:page="getTableData" />
      </div>
    </NCard>
  </div>
</template>

<style scoped>
.pagination-box {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
