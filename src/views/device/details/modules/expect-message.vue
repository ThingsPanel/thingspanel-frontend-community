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
  { label: "待发送", value: 'pending' },
  { label: "已发送", value: 'sent' },
  { label: "失效", value: 'expired' }
]);
const typeOptions = ref([
  { label: "遥测", value: 'telemetry' },
  { label: "属性", value: 'attribute' },
  { label: "命令", value: 'command' }
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
    window.$message?.success("删除成功");
    getTableData();
  }
};
const columns: Ref<any> = ref([
  {
    key: 'created_at',
    minWidth: '200px',
    title: () => "创建时间",
    render: row => {
      return row.created_at ? moment(row.created_at).format('YYYY-MM-DD hh:mm:ss') : '';
    }
  },
  {
    key: 'send_type',
    minWidth: '100px',
    title: () => "指令类型",
    render: row => {
      return typeOptions.value.find(v => v.value === row.send_type)?.label;
    }
  },
  {
    key: 'label',
    minWidth: '100px',
    title: () => "标签"
  },
  {
    key: 'payload',
    minWidth: '200px',
    title: () => "指令内容"
  },
  {
    key: 'expiry_time',
    minWidth: '200px',
    title: () => "过期时间",
    render: row => {
      return row.expiry_time ? moment(row.expiry_time).format('YYYY-MM-DD hh:mm:ss') : '';
    }
  },
  {
    key: 'status',
    minWidth: '100px',
    title: () => "状态",
    render: row => {
      return statusOptions.value.find(v => v.value === row.status)?.label;
    }
  },
  {
    key: 'message',
    minWidth: '140px',
    title: () => "状态信息"
  },
  {
    key: 'send_time',
    minWidth: '200px',
    title: () => "处理时间",
    render: row => {
      return row.send_time ? moment(row.send_time).format('YYYY-MM-DD hh:mm:ss') : '';
    }
  },
  {
    title: "操作",
    key: 'created_at',
    minWidth: '100px',
    render: row => {
      return (
        <NPopconfirm
          negative-text={"取消"}
          positive-text={"确认"}
          onPositiveClick={() => handleDeleteTable(row.id)}
        >
          {{
            default: () => "确认",
            trigger: () => (
              <NButton type="error" size={'small'}>
                {"删除"}
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
            :placeholder="已发送"
            class="input-style w-200px"
            clearable
            @update:value="handleSearch"
          />
        </NFormItem>
        <NFormItem>
          <NSelect
            v-model:value="query.type"
            :options="typeOptions"
            :placeholder="请选择指令类型"
            class="input-style w-200px"
            clearable
            @update:value="handleSearch"
          />
        </NFormItem>
        <NFormItem>
          <NInput
            v-model:value="query.label"
            :placeholder="请输入标签"
            class="input-style w-200px"
            @input="handleSearch"
          />
        </NFormItem>
        <NFormItem>
          <NButton class="ml-20px w-72px" type="primary" @click="handleReset">{{ "重置" }}</NButton>
        </NFormItem>
      </NForm>
    </div>
  </div>
  <n-data-table :columns="columns" :data="tableData" :pagination="pagination" :remote="true" />
</template>
