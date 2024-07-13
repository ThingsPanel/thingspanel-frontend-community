<!-- eslint-disable require-atomic-updates -->
<script setup lang="tsx">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { NSelect } from 'naive-ui';
import { batchAddServiceMenuList, getSelectServiceMenuList, getServiceListDrop } from '@/service/api/plugin.ts';
const emit = defineEmits(['getList']);

const router = useRoute();
const service_identifier = ref<any>(router.query.service_identifier);
const serviceModal = ref<any>(false);
const isEdit = ref<any>(false);
const chekeds = ref<any>([]);
const checkedRowKeys = ref<any>([]);

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
    getLists();
  },
  onUpdatePageSize: (pageSize: number) => {
    queryInfo.value.page_size = pageSize;
    queryInfo.value.page = 1;
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getLists();
  }
});

const getLists: () => void = async () => {
  pageData.value.loading = true;
  const { data }: { data: any } = await getServiceListDrop(queryInfo.value);
  pageData.value.tableData = data.list;
  const params: any = {
    device_type: '',
    device_config_name: '',
    protocol_type: service_identifier.value
  };
  const { data: res }: { data: any } = await getSelectServiceMenuList(params);
  if (isEdit.value) {
    checkedRowKeys.value = pageData.value.tableData.map((item: any) => {
      return item.is_bind ? item.device_number : null;
    });
  }
  pageData.value.tableData.forEach((item: any) => {
    item.options = res;
  });
  queryInfo.value.itemCount = data.total;
  pageData.value.loading = false;
};

const columns: any = ref([
  {
    type: 'selection',
    disabled(row: any) {
      return row.is_bind;
    }
  },
  {
    title: '设备名称',
    key: 'device_name',
    minWidth: '200px'
  },
  {
    title: '设备编号',
    key: 'device_number',
    minWidth: '400px'
  },
  {
    title: '设备配置模版',
    key: 'create_at',
    render: row => {
      return (
        <NSelect
          v-model:value={row.device_config_id}
          label-field={'name'}
          value-field={'id'}
          placeholder={'请选择设备类型'}
          options={row.options}
        />
      );
    }
  }
]);
const submitSevice: () => void = async () => {
  const params = {
    service_access_id: service_identifier.value,
    device_list: chekeds.value
  };
  const data: any = await batchAddServiceMenuList(params);
  if (data.data) {
    serviceModal.value = false;
    emit('getList');
  } else {
    serviceModal.value = false;
  }
};
const openModal: (val: any, row: any, edit: any) => void = async (val, row, edit) => {
  console.log(row, '提交3');
  if (edit) {
    isEdit.value = edit;
    queryInfo.value.voucher = val;
    serviceModal.value = true;
    getLists();
  } else {
    queryInfo.value.voucher = val;
    serviceModal.value = true;
    getLists();
  }
};

const close: () => void = () => {
  serviceModal.value = false;
};

const handleCheck: (rowKeys: any) => void = rowKeys => {
  chekeds.value = pageData.value.tableData.map((item: any) => {
    let obj: any = null;
    rowKeys.forEach(val => {
      if (item.device_number === val && !item.is_bind) {
        obj = {};
        obj.device_name = item.device_name;
        obj.device_number = item.device_number;
        obj.device_config_id = item.device_config_id;
      }
    });
    return obj;
  });
};

defineExpose({ openModal });
</script>

<template>
  <n-modal v-model:show="serviceModal" preset="dialog" title="配置设备" class="w">
    <NDataTable
      v-model:checked-row-keys="checkedRowKeys"
      :remote="true"
      :columns="columns"
      :data="pageData.tableData"
      :loading="pageData.loading"
      :pagination="queryInfo"
      :row-key="row => row.device_number"
      class="flex-1-hidden"
      @update:checked-row-keys="handleCheck"
    />
    <div class="footer">
      <NButton type="primary" class="btn" @click="submitSevice">确认</NButton>
      <NButton @click="close">取消</NButton>
    </div>
  </n-modal>
</template>

<style lang="scss" scoped>
.selectType {
  width: 100%;
}
.footer {
  display: flex;
  flex-direction: row-reverse;
  margin-top: 20px;
  .btn {
    margin-left: 10px;
  }
}
</style>
