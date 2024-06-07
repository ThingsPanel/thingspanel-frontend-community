<script setup lang="tsx">
import { computed, getCurrentInstance, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { NButton, NPopconfirm, NSpace } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import moment from 'moment';
import { useBoolean, useLoading } from '@sa/hooks';
import { $t } from '@/locales';
import { deleteProduct, getProductList } from '@/service/product/list';
import { dictQuery } from '@/service/api/setting';
import TableActionModal from './components/table-action-modal.vue';
import type { ModalType } from './components/table-action-modal.vue';
import ColumnSetting from './components/column-setting.vue';
import DeviceRegister from './components/device-register.vue';

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const { bool: editPwdVisible, setTrue: openConfig } = useBoolean();
const editData = ref<productRecord | null>(null);
const formRef = ref<any>();
const productOptions = ref<any>([]);

const queryParams = reactive<QueryFormModel>({
  name: '',
  product_type: '',
  product_model: '',
  page: 1,
  page_size: 10
});

const tableData = ref<productRecord[]>([]);
function setTableData(data: productRecord[]) {
  tableData.value = data;
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

const cpType = async (name?: string) => {
  const res: any = await dictQuery({
    page: 1,
    page_size: 10,
    dict_code: 'PRODUCT_TYPE',
    name
  });
  productOptions.value = res.data || [];
};

async function getTableData() {
  startLoading();
  const { data } = await getProductList(queryParams);
  if (data) {
    const list: productRecord[] = data.list;
    setTableData(list);
    pagination.pageCount = Math.ceil(data.total / queryParams.page_size);
    endLoading();
  }
}

const drawerTitle: Ref<string> = ref('');
async function handleRegisterConfig(record: productRecord) {
  openConfig();
  editData.value = record;
  drawerTitle.value = `${record.name}-${$t('page.product.list.preRegister')}`;
}

const columns: Ref<DataTableColumns<productRecord>> = ref([
  {
    key: 'name',
    minWidth: '140px',
    title: $t('page.product.list.productName')
  },
  {
    key: 'product_type',
    minWidth: '140px',
    title: $t('page.product.list.deviceType'),
    render: row => {
      return productOptions.value.filter((item: any) => item.dict_value === row.product_type)[0]?.translation;
    }
  },
  {
    key: 'product_model',
    minWidth: '140px',
    title: $t('page.product.list.productNumber')
  },
  {
    key: 'device_config_name',
    minWidth: '140px',
    title: $t('page.product.list.deviceConfig')
  },
  {
    key: 'description',
    minWidth: '140px',
    title: $t('page.product.list.productDesc')
  },
  {
    key: 'created_at',
    minWidth: '140px',
    title: $t('page.product.list.createTime'),
    render: row => {
      return moment(row.created_at).format('YYYY-MM-DD hh:mm:ss');
    }
  },
  {
    key: 'actions',
    minWidth: '140px',
    title: $t('page.product.list.operate'),
    align: 'center',
    render: row => {
      return (
        <NSpace justify={'center'}>
          <NButton size={'small'} type="primary" onClick={() => handleEditTable(row.id)}>
            {$t('common.edit')}
          </NButton>
          <NButton size={'small'} type="primary" onClick={() => handleRegisterConfig(row)}>
            {$t('page.product.list.register')}
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDeleteTable(row.id)}>
            {{
              default: () => $t('common.confirmDelete'),
              trigger: () => (
                <NButton type="error" size={'small'}>
                  {$t('common.delete')}
                </NButton>
              )
            }}
          </NPopconfirm>
        </NSpace>
      );
    }
  }
]) as Ref<DataTableColumns<productRecord>>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}
function clear() {
  queryParams.name = '';
  queryParams.product_type = '';
  queryParams.product_model = '';
  getTableData();
}

function setEditData(data: productRecord | null) {
  editData.value = data;
}

function handleAddTable() {
  setEditData(null);
  openModal();
  setModalType('add');
}

// function handleEditPwd(rowId: string) {
// 	const findItem = tableData.value.find((item) => item.id === rowId);
// 	if (findItem) {
// 		setEditData(findItem);
// 	}
// 	openEditPwdModal();
// }

function handleEditTable(rowId: string) {
  const findItem = tableData.value.find(item => item.id === rowId);
  if (findItem) {
    setEditData(findItem);
  }
  setModalType('edit');
  openModal();
}

async function handleDeleteTable(rowId: string) {
  const data = await deleteProduct(rowId);
  if (!data.error) {
    // window.$message?.success($t('common.deleteSuccess'));
    getTableData();
  }
}

function init() {
  getTableData();
}
watch(
  visible,
  () => {
    if (!visible.value) {
      getTableData();
    }
  },
  { deep: true }
);

const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});
// 初始化
init();
cpType();
</script>

<template>
  <div>
    <n-card :title="$t('page.product.list.productList')">
      <div class="h-full flex-col">
        <NForm ref="formRef" inline :label-width="90" :model="queryParams" label-placement="left">
          <NFormItem :class="getPlatform ? '100%' : 'w-50%'" :label="$t('page.product.list.productName')" path="name">
            <NInput v-model:value="queryParams.name" />
          </NFormItem>
          <NFormItem
            :class="getPlatform ? '100%' : 'w-50%'"
            :label="$t('page.product.list.deviceType')"
            path="product_type"
          >
            <NSelect
              v-model:value="queryParams.product_type"
              filterable
              :options="productOptions"
              label-field="translation"
              value-field="dict_value"
              @search="getProductList"
            />
          </NFormItem>
          <NFormItem
            :class="getPlatform ? '100%' : 'w-50%'"
            :label="$t('page.product.list.productNumber')"
            path="product_model"
          >
            <NInput v-model:value="queryParams.product_model" />
          </NFormItem>
          <NFormItem>
            <NButton type="primary" @click="getTableData">
              {{ $t('page.product.list.query') }}
            </NButton>
          </NFormItem>
          <NFormItem :class="getPlatform ? '100%' : 'w-50%'" path="product_model">
            <NButton type="primary" @click="clear">
              {{ $t('page.product.list.Reset') }}
            </NButton>
          </NFormItem>
        </NForm>
        <NSpace class="pb-12px" justify="space-between">
          <NSpace>
            <NButton type="primary" @click="handleAddTable">
              <IconIcRoundPlus class="mr-4px text-20px" />
              {{ $t('common.add') }}
            </NButton>
          </NSpace>
          <NSpace align="center" :size="18">
            <NButton type="primary" @click="getTableData">
              <IconMdiRefresh class="mr-4px text-16px" :class="{ 'animate-spin': loading }" />
              {{ $t('common.refreshTable') }}
            </NButton>
            <ColumnSetting v-model:columns="columns" />
          </NSpace>
        </NSpace>
        <NDataTable
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          remote
          class="flex-1-hidden"
        />
      </div>
    </n-card>
    <TableActionModal
      v-model:visible="visible"
      :class="getPlatform ? 'w-90%' : 'w-700px'"
      :type="modalType"
      :edit-data="editData"
      @success="getTableData"
    />
    <NDrawer
      v-model:show="editPwdVisible"
      :style="{ width: getPlatform ? 'w-90%' : 'w-50%' }"
      display-directive="show"
      placement="right"
    >
      <NDrawerContent :title="drawerTitle" closable>
        <DeviceRegister :pid="(editData?.id as unknown as string)" />
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style scoped></style>
