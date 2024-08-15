<script setup lang="tsx">
import { reactive, ref } from 'vue';
import type { Ref } from 'vue';
import type { PaginationProps } from 'naive-ui';
import { NButton, NPopconfirm } from 'naive-ui';
import moment from 'moment';
import { expectMessageDelete, expectMessageList } from '@/service/api';
import { $t } from '@/locales';
const props = defineProps<{
  id: string;
}>();

const tableData = ref([]);
const statusOptions = ref([
  { label: $t('page.expect.pending'), value: 'pending' },
  { label: $t('page.expect.send'), value: 'sent' },
  { label: $t('page.expect.expired'), value: 'expired' }
]);
const typeOptions = ref([
  { label: $t('custom.device_details.telemetry'), value: 'telemetry' },
  { label: $t('custom.device_details.stats'), value: 'attribute' },
  { label: $t('page.expect.command'), value: 'command' }
]);

const query = reactive({
  status: 'pending',
  type: null,
  label: null,
  page: 1,
  page_size: 10
});
const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30],
  itemCount: 0,
  onChange: (page: number) => {
    pagination.page = page;
    query.page = page;
    getTableData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    query.page_size = pageSize;
    getTableData();
  }
});
async function getTableData() {
  const { data, error } = await expectMessageList({
    device_id: props.id,
    send_type: query.type,
    ...query
  });
  if (!error) {
    const list: any = data.list || [];
    tableData.value = list;
    pagination.itemCount = data.total || 0;
  }
}

const handleDeleteTable = async id => {
  const { error } = await expectMessageDelete(id);
  if (!error) {
    window.$message?.success($t('common.deleteSuccess'));
    getTableData();
  }
};
const columns: Ref<any> = ref([
  {
    key: 'created_at',
    minWidth: '200px',
    title: () => $t('page.expect.createTime'),
    render: row => {
      return row.created_at ? moment(row.created_at).format('YYYY-MM-DD hh:mm:ss') : '';
    }
  },
  {
    key: 'send_type',
    minWidth: '100px',
    title: () => $t('page.expect.commandType'),
    render: row => {
      return typeOptions.value.find(v => v.value === row.send_type)?.label;
    }
  },
  {
    key: 'label',
    minWidth: '100px',
    title: () => $t('page.expect.label')
  },
  {
    key: 'payload',
    minWidth: '200px',
    title: () => $t('page.expect.commandContent')
  },
  {
    key: 'expiry_time',
    minWidth: '200px',
    title: () => $t('page.expect.expireTime'),
    render: row => {
      return row.expiry_time ? moment(row.expiry_time).format('YYYY-MM-DD hh:mm:ss') : '';
    }
  },
  {
    key: 'status',
    minWidth: '100px',
    title: () => $t('page.expect.status'),
    render: row => {
      return statusOptions.value.find(v => v.value === row.status)?.label;
    }
  },
  {
    key: 'message',
    minWidth: '140px',
    title: () => $t('page.expect.statusInfo')
  },
  {
    key: 'send_time',
    minWidth: '200px',
    title: () => $t('page.expect.dealTime'),
    render: row => {
      return row.send_time ? moment(row.send_time).format('YYYY-MM-DD hh:mm:ss') : '';
    }
  },
  {
    title: $t('common.action'),
    key: 'created_at',
    minWidth: '100px',
    render: row => {
      return (
        <NPopconfirm
          negative-text={$t('common.cancel')}
          positive-text={$t('common.confirm')}
          onPositiveClick={() => handleDeleteTable(row.id)}
        >
          {{
            default: () => $t('common.confirm'),
            trigger: () => (
              <NButton type="error" size={'small'}>
                {$t('common.delete')}
              </NButton>
            )
          }}
        </NPopconfirm>
      );
    }
  }
]) as Ref<any>;

const handleSearch = () => {
  pagination.page = 1;
  getTableData();
};
handleSearch();
const handleReset = () => {
  query.status = 'pending';
  query.type = null;
  query.label = null;
  query.page = 1;
  query.page_size = 10;
  handleSearch();
};
</script>

<template>
  <div class="flex flex-col gap-15px rounded-lg">
    <div class="row flex items-end justify-between gap-4">
      <NForm class="flex-wrap" inline label-placement="left" label-align="right" label-width="120">
        <NFormItem>
          <NSelect
            v-model:value="query.status"
            :options="statusOptions"
            :placeholder="$t('page.expect.send')"
            class="input-style w-200px"
            clearable
            @update:value="handleSearch"
          />
        </NFormItem>
        <NFormItem>
          <NSelect
            v-model:value="query.type"
            :options="typeOptions"
            :placeholder="$t('page.expect.selectCommandTypePlease')"
            class="input-style w-200px"
            clearable
            @update:value="handleSearch"
          />
        </NFormItem>
        <NFormItem>
          <NInput
            v-model:value="query.label"
            :placeholder="$t('page.expect.inputLabelPlease')"
            class="input-style w-200px"
            @input="handleSearch"
          />
        </NFormItem>
        <NFormItem>
          <NButton class="ml-20px w-72px" type="primary" @click="handleReset">{{ $t('common.reset') }}</NButton>
        </NFormItem>
      </NForm>
    </div>
  </div>
  <n-data-table :columns="columns" :data="tableData" :pagination="pagination" :remote="true" />
</template>
