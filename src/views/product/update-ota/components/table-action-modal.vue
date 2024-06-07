<script setup lang="tsx">
/** @description: 批量选择设备 */
import { computed, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { NButton } from 'naive-ui';
import type { DataTableColumns, DataTableRowKey, PaginationProps } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { $t } from '@/locales';
import { getPreProductList } from '~/src/service/product/list';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit';
  /** 编辑的表格行数据 */
  editData?: productPackageRecord | null;
  selectedKeys: string[];
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'TableActionModal' });

const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null,
  selectedKeys: () => []
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;

  /** 点击协议 */
  (e: 'update:selectedKeys', data: any[]): void;
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

// (e: 'update:selectedKeys', selectedKeys: string[]): void;
const selectedKeys = computed({
  get: () => {
    return props.selectedKeys;
  },
  set: keys => {
    emit('update:selectedKeys', keys);
  }
});

const title = computed(() => {
  const titles: Record<ModalType, string> = {
    add: $t('page.product.update-ota.batchSelectDevice'), // 设备配置
    edit: $t('page.product.list.editProduct')
  };
  return titles[props.type];
});

const formModel = reactive<productAdd>(createDefaultFormModel() as productAdd);

function createDefaultFormModel() {
  return {
    name: '',
    device_type: undefined,
    additional_info: undefined,
    description: undefined,
    image_url: undefined,
    product_model: undefined,
    product_type: undefined,
    remark: undefined,
    device_config_id: undefined,
    product_key: undefined
  };
}

function handleUpdateFormModel(model: Partial<otaRecord>) {
  Object.assign(formModel, model);
}

function handleUpdateFormModelByModalType() {
  const handlers: Record<ModalType, () => void> = {
    add: () => {
      const defaultFormModel = createDefaultFormModel();
      handleUpdateFormModel(defaultFormModel);
    },
    edit: () => {
      handleUpdateFormModel(props.editData as productAdd);
    }
  };

  handlers[props.type]();
}

const backupData = ref([]);
watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      handleUpdateFormModelByModalType();
    } else {
      backupData.value = JSON.parse(JSON.stringify(props.selectedKeys));
    }
  }
);
const { loading, startLoading, endLoading } = useLoading(false);

const queryParams = reactive({
  name: '',
  current_version: '',
  page: 1,
  activate_flag: 'active',
  is_enabled: 'enabled',
  device_config_id: props?.editData?.device_config_id,
  page_size: 10
});
const tableData = ref<productPackageRecord[]>([]);

function setTableData(data: productPackageRecord[]) {
  tableData.value = data;
}

function handleQuery() {
  Object.assign(queryParams, {
    page: 1
  });
  init();
}

function handleReset() {
  Object.assign(queryParams, {
    name: '',
    current_version: '',
    page: 1
  });
  handleQuery();
}

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

async function getTableData() {
  startLoading();
  const { data } = await getPreProductList(queryParams);
  if (data) {
    const list: productPackageRecord[] = data.list;
    setTableData(list);
    pagination.pageCount = Math.ceil(data.total / queryParams.page_size);
    endLoading();
  }
}

const columns: Ref<DataTableColumns<productPackageRecord>> = ref([
  {
    type: 'selection',
    minWidth: '140px',
    checked: (row: productPackageRecord) => {
      return props.selectedKeys.includes(row.id);
    }
  },
  {
    key: 'name',
    minWidth: '140px',
    title: $t('page.product.update-ota.deviceName')
  },
  {
    key: 'current_version',
    minWidth: '140px',
    title: $t('page.product.update-package.versionText')
  },
  {
    key: 'device_number',
    minWidth: '140px',
    title: $t('page.product.list.deviceNumber')
  }
]) as Ref<DataTableColumns<productPackageRecord>>;

function init() {
  getTableData();
}

// 初始化
init();
const rowKey = (row: productPackageRecord) => row.id;

function handleCheck(rowKeys: DataTableRowKey[]) {
  emit('update:selectedKeys', rowKeys);
}

const closeModal = () => {
  emit('update:selectedKeys', backupData.value);
  modalVisible.value = false;
};
const onSubmit = () => {
  modalVisible.value = false;
};
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" :title="title">
    <div class="h-700px overflow-hidden">
      <NCard :bordered="false" class="h-full rounded-8px shadow-sm">
        <div class="h-full flex-col">
          <NForm inline label-placement="left" :model="queryParams">
            <NFormItem :label="$t('page.product.update-package.versionText')" path="versionText">
              <NInput
                v-model:value="queryParams.current_version"
                :placeholder="$t('common.input') + $t('page.product.update-package.versionText')"
              />
            </NFormItem>
            <NFormItem :label="$t('page.product.update-ota.deviceName')" path="deviceName">
              <NInput
                v-model:value="queryParams.name"
                :placeholder="$t('common.input') + $t('page.product.update-ota.deviceName')"
              />
            </NFormItem>
            <NFormItem>
              <NButton class="w-72px" type="primary" @click="handleQuery">{{ $t('common.search') }}</NButton>
              <NButton class="ml-20px w-72px" type="primary" @click="handleReset">{{ $t('common.reset') }}</NButton>
            </NFormItem>
          </NForm>
          <NDataTable
            :row-key="rowKey"
            remote
            :columns="columns"
            :data="tableData"
            :loading="loading"
            :pagination="pagination"
            :checked-row-keys="selectedKeys"
            flex-height
            class="flex-1-hidden"
            @update:checked-row-keys="handleCheck"
          />
          <NSpace class="mt-10px pb-12px" justify="space-between">
            <NSpace>
              {{ $t('page.product.update-ota.selected') }}{{ selectedKeys.length
              }}{{ $t('page.product.update-ota.selectedNumber') }}
            </NSpace>
            <NSpace align="center" :size="18">
              <NButton @click="closeModal">
                {{ $t('common.cancel') }}
              </NButton>
              <NButton type="primary" @click="onSubmit">
                {{ $t('common.confirm') }}
              </NButton>
            </NSpace>
          </NSpace>
        </div>
      </NCard>
    </div>
  </NModal>
</template>

<style scoped></style>
