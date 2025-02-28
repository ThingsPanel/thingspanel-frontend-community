<!-- eslint-disable require-atomic-updates -->
<script setup lang="tsx">
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { NSelect } from 'naive-ui';
import { batchAddServiceMenuList, getSelectServiceMenuList, getServiceListDrop } from '@/service/api/plugin.ts';
import { $t } from '@/locales';
const emit = defineEmits(['getList']);

const router = useRoute();
const service_identifier = ref<any>(router.query.service_identifier);
const serviceModal = ref<any>(false);
const isEdit = ref<any>(false);
const chekeds = ref<any>([]);
const checkedRowKeys = ref<any>([]);
const device_config_id = ref<any>('');
const NTableRef = ref<any>(null);

const pageData = ref<any>({
  loading: false,
  tableData: []
});

const queryInfo = ref<any>({
  voucher: '',
  service_type: router.query.service_type,
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
    title: $t('generate.device-name'),
    key: 'device_name',
    minWidth: '200px'
  },
  {
    title: $t('generate.device-number'),
    key: 'device_number',
    minWidth: '400px'
  },
  {
    title: $t('card.deviceConfigTemplate'),
    key: 'create_at',
    render: row => {
      return (
        <NSelect
          v-model:value={row.device_config_id}
          label-field={'name'}
          value-field={'id'}
          placeholder={$t('card.chooseDeviceType')}
          options={row.options}
        />
      );
    }
  }
]);
const submitSevice: () => void = async () => {
  const params = {
    service_access_id: device_config_id.value,
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
  if (edit) {
    isEdit.value = edit;
    queryInfo.value.voucher = val;
    serviceModal.value = true;
    getLists();
    device_config_id.value = row;
  } else {
    queryInfo.value.voucher = val;
    serviceModal.value = true;
    getLists();
    device_config_id.value = row;
  }
};

const close: () => void = () => {
  serviceModal.value = false;
};

const handleCheck: (rowKeys: any, row: any) => void = (rowKeys, row) => {
  if (row[0] && row[0].device_config_id) {
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
    chekeds.value = chekeds.value.filter((val: any) => val);
  } else {
    window.$message?.error($t('card.templateNotSet'));
    checkedRowKeys.value = [];
  }
};

defineExpose({ openModal });
</script>

<template>
  <n-modal v-model:show="serviceModal" preset="dialog" :title="$t('card.configDevice')" class="device_model">
    <NDataTable
      ref="NTableRef"
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
      <NButton type="primary" class="btn" @click="submitSevice">{{ $t('common.confirm') }}</NButton>
      <NButton @click="close">{{ $t('common.cancel') }}</NButton>
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

<style>
.device_model {
  height: 800px;
  overflow: auto;
  width: 70% !important;
}
</style>
