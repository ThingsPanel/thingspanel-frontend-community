<script setup lang="tsx">
import { computed, onMounted, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { NButton } from 'naive-ui';
import type { CascaderOption, PaginationProps } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import {
  getIrrigationDistricts,
  getIrrigationSpaces,
  irrigationGroupDeviceList,
  irrigationGroupDeviceTypes
} from '@/service/api';
import { $t } from '@/locales';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 编辑的表格行数据 */
  ids?: any;
}

const props = withDefaults(defineProps<Props>(), {});

const { loading, startLoading, endLoading } = useLoading(false);

interface QueryFormModel {
  deviceName: string;
  deviceNumber: string;
  productType: string;
  districtId: string;
  page: number;
  page_size: number;
}

const queryParams = reactive<QueryFormModel>({
  deviceName: '',
  deviceNumber: '',
  productType: '',
  districtId: '',
  page: 1,
  page_size: 10
});

const tableData = ref<any>([]);

function setTableData(data: any) {
  tableData.value = data;
}

async function getTableData() {
  startLoading();
  const { data } = await irrigationGroupDeviceList(queryParams);
  if (data) {
    const list: any = data.list;
    setTableData(list);
    endLoading();
  }
}

const checkedRowKeys = ref<string[]>([]);
const columns: Ref<any> = ref([
  {
    type: 'selection'
  },
  {
    key: 'name',
    title: () => $t('page.irrigation.group.deviceName'),
    align: 'center'
  },
  {
    key: 'id',
    title: () => $t('page.irrigation.group.deviceCode'),
    align: 'center'
  },
  {
    key: 'spaceAndDistrictName',
    title: () => $t('page.irrigation.group.detail.spaceOrArea'),
    align: 'center'
  },
  {
    key: 'productTyp',
    title: () => $t('page.irrigation.group.deviceType'),
    align: 'center'
  }
]) as Ref<any>;

interface Emits {
  (e: 'update:visible', visible: boolean): void;

  /** 点击协议 */
  (e: 'success', list: any): void;
}

const emit = defineEmits<Emits>();

const modalVisible = computed({
  get() {
    return props.visible;
  },
  set(visible) {
    emit('update:visible', visible);
  }
});

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

function handleReset() {
  Object.assign(queryParams, {
    deviceName: '',
    deviceNumber: '',
    productType: '',
    districtId: '',
    page: 1
  });
  handleQuery();
}

const diveceTypesOption = ref<any>([]);

async function init() {
  getTableData();
  const { data } = await irrigationGroupDeviceTypes();
  data.forEach(i => {
    // eslint-disable-next-line no-sequences,no-unused-expressions
    (i.label = i.translation), (i.value = i.dict_value);
  });
  diveceTypesOption.value = data;
}

const closeModal = () => {
  modalVisible.value = false;
};

const spaceOptions = ref<any>([]);
onMounted(async () => {
  const { data } = await getIrrigationSpaces();
  data.rows.forEach(i => {
    i.depth = 1;
    i.isLeaf = false;
  });
  spaceOptions.value = data.rows;
  checkedRowKeys.value = props.ids || [];
});

// 区域选择请求空间
async function handleSpaceLoad(option_f: CascaderOption) {
  const { data } = await getIrrigationDistricts({
    limit: 100,
    space_id: option_f.id
  });
  data.rows.forEach(i => {
    i.depth = 2;
    i.isLeaf = true;
  });
  // eslint-disable-next-line require-atomic-updates
  option_f.children = data.rows;
  return data.rows;
}

const onSave = () => {
  if (checkedRowKeys.value.length === 0) {
    window.$message?.error($t('common.checkDevice'));
  } else {
    const items = tableData.value.filter(i => checkedRowKeys.value.includes(i.id));
    emit('success', items);
    closeModal();
  }
};
// 初始化
init();
</script>

<template>
  <div class="overflow-auto">
    <NModal
      v-model:show="modalVisible"
      preset="card"
      :title="$t('page.irrigation.group.chooseDevices')"
      class="h-80vh w-1400px"
    >
      <div class="h-full flex-col">
        <NForm ref="queryFormRef" inline label-placement="left" :model="queryParams">
          <NFormItem :label="$t('page.irrigation.group.deviceName')" path="email">
            <NInput v-model:value="queryParams.deviceName" class="important-w-150px" />
          </NFormItem>
          <NFormItem :label="$t('page.irrigation.group.deviceCode')" path="email">
            <NInput v-model:value="queryParams.deviceNumber" class="important-w-150px" />
          </NFormItem>
          <NFormItem :label="$t('page.irrigation.group.detail.spaceOrArea')" path="email">
            <NCascader
              ref="refNCascader"
              v-model:value="queryParams.districtId"
              :placeholder="$t('common.select')"
              :options="spaceOptions"
              :show-path="true"
              label-field="name"
              value-field="id"
              check-strategy="child"
              remote
              :on-load="handleSpaceLoad"
              class="important-w-300px"
            />
          </NFormItem>
          <NFormItem :label="$t('page.irrigation.group.deviceType')" path="email">
            <NSelect v-model:value="queryParams.productType" clearable class="w-150px" :options="diveceTypesOption" />
          </NFormItem>
          <NFormItem>
            <NButton class="w-72px" type="primary" @click="handleQuery">{{ $t('common.search') }}</NButton>
            <NButton class="ml-20px w-72px" type="primary" @click="handleReset">{{ $t('common.reset') }}</NButton>
          </NFormItem>
        </NForm>
        <NDataTable
          v-model:checked-row-keys="checkedRowKeys"
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          :row-key="item => item.id"
          :flex-height="true"
          class="flex-1-hidden"
        />
        <NSpace class="w-full pt-16px" :size="24" justify="end">
          <NButton class="w-72px" @click="closeModal">{{ $t('common.cancel') }}</NButton>
          <NButton class="w-72px" type="primary" @click="onSave">{{ $t('common.confirm') }}</NButton>
        </NSpace>
      </div>
    </NModal>
  </div>
</template>

<style scoped></style>
