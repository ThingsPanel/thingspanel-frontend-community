<!-- eslint-disable require-atomic-updates -->
<script setup lang="tsx">
import { ref } from 'vue';
import dayjs from 'dayjs';
import { getServiceListDrop } from '@/service/api/plugin.ts';
const serviceModal = ref<any>(false);
const pageData = ref<any>({
  loading: false,
  tableData: []
});

const queryInfo = ref<any>({
  voucher: '',
  page: 1,
  page_size: 10,
  total: 0,
  pageSizes: [10, 15, 20, 25, 30],
  onChange: (page: number) => {
    queryInfo.value.page = page;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getList();
  },
  onUpdatePageSize: (pageSize: number) => {
    queryInfo.value.page_size = pageSize;
    queryInfo.value.page = 1;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getList();
  }
});

const getList: () => void = async () => {
  console.log(queryInfo.value, '获取列表数据');
  const { data }: { data: any } = await getServiceListDrop(queryInfo.value);
  pageData.value.tableData = data.list;
  queryInfo.value.itemCount = data.total;
};

const columns: any = ref([
  {
    title: '服务名称',
    key: 'name',
    minWidth: '200px'
  },
  {
    title: '创建时间',
    key: 'create_at',
    render: row => {
      if (row.create_at) {
        return <span>{dayjs(row.create_at).format('YYYY-MM-DD HH:mm:ss')}</span>;
      }
      return <span></span>;
    }
  }
]);
const submitSevice: () => void = async () => {
  console.log('提交');
};
const openModal: (row: any) => void = async row => {
  queryInfo.value.voucher = row;
  serviceModal.value = true;
  console.log(queryInfo.value, '打开弹窗');
  getList();
};

const close: () => void = () => {
  serviceModal.value = false;
};

defineExpose({ openModal });
</script>

<template>
  <n-modal v-model:show="serviceModal" preset="dialog" title="配置设备" class="w">
    <n-space vertical>
      <n-spin>
        <NDataTable
          :remote="true"
          :columns="columns"
          :data="pageData.tableData"
          :loading="pageData.loading"
          :pagination="queryInfo"
          class="flex-1-hidden"
        />
        <div class="footer">
          <NButton type="primary" class="btn" @click="submitSevice">确认</NButton>
          <NButton @click="close">取消</NButton>
        </div>
      </n-spin>
    </n-space>
  </n-modal>
</template>

<style lang="scss" scoped>
.selectType {
  width: 100%;
}
.footer {
  display: flex;
  flex-direction: row-reverse;
  .btn {
    margin-left: 10px;
  }
}
</style>
