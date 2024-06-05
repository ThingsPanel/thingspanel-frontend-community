<script setup lang="tsx">
import { computed, getCurrentInstance, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { NButton, NPopconfirm, NSpace } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
// import { userStatusLabels, userStatusOptions } from '@/constants'
import { useBoolean, useLoading } from '@sa/hooks';
import { delrles, rlesList } from '@/service/api';
import { $t } from '@/locales';
import { formatDateTime } from '@/utils/common/datetime';
import TableActionModal from './modules/table-action-modal.vue';
import EditPermissionModal from './modules/edit-permission-modal.vue';
import EditPasswordModal from './modules/edit-password-modal.vue';
import type { ModalType } from './modules/table-action-modal.vue';
// import ColumnSetting from './components/column-setting.vue'

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const { bool: editPwdVisible } = useBoolean();
const { bool: editPermissionVisible, setTrue: openEditPermissionModal } = useBoolean();

type QueryFormModel = Pick<UserManagement.User, 'email' | 'name' | 'status'> & {
  page: number;
  page_size: number;
};

const queryParams = reactive<QueryFormModel>({
  email: null,
  name: null,
  status: null,
  page: 1,
  page_size: 10
});

const tableData = ref<UserManagement.User[]>([]);

function setTableData(data: UserManagement.User[]) {
  tableData.value = data;
}

async function getTableData() {
  startLoading();
  const { data } = await rlesList(queryParams);
  if (data) {
    const list: UserManagement.User[] = data.list;
    setTableData(list);
    endLoading();
  }
}

const columns: Ref<DataTableColumns<UserManagement.User>> = ref([
  {
    key: 'name',
    minWidth: '100px',
    title: $t('page.manage.role.roleName'),
    align: 'center'
  },
  {
    key: 'description',
    minWidth: '100px',
    title: $t('page.manage.role.roleDesc'),
    align: 'center'
  },
  {
    key: 'created_at',
    title: $t('page.product.update-ota.createTime'),
    minWidth: '180px',
    align: 'center',
    render: row => {
      return formatDateTime(row.created_at);
    }
  },
  {
    key: 'updated_at',
    title: $t('page.product.update-ota.updateDate'),
    minWidth: '180px',
    align: 'center',
    render: row => {
      return formatDateTime(row.updated_at);
    }
  },
  {
    key: 'actions',
    title: $t('common.action'),
    align: 'center',
    minWidth: '140px',
    render: row => {
      return (
        <NSpace justify={'center'}>
          <NButton type="primary" size={'small'} onClick={() => handleEditTable(row.id)}>
            {$t('common.edit')}
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
          <NButton type="primary" size={'small'} onClick={() => handleEditPermission(row.id)}>
            {$t('page.manage.role.editPermission')}
          </NButton>
        </NSpace>
      );
    }
  }
]) as Ref<DataTableColumns<UserManagement.User>>;

const modalType = ref<ModalType>('add');

function setModalType(type: ModalType) {
  modalType.value = type;
}

const editData = ref<UserManagement.User | null>(null);

function setEditData(data: UserManagement.User | null) {
  editData.value = data;
}

function handleAddTable() {
  openModal();
  setModalType('add');
}

// function handleEditPwd(rowId: string) {
//   const findItem = tableData.value.find(item => item.id === rowId);
//   if (findItem) {
//     setEditData(findItem);
//   }
//   openEditPwdModal();
// }

function handleEditTable(rowId: string) {
  const findItem = tableData.value.find(item => item.id === rowId);
  if (findItem) {
    setEditData(findItem);
  }
  setModalType('edit');
  openModal();
}

function handleEditPermission(rowId: string) {
  const findItem = tableData.value.find(item => item.id === rowId);
  if (findItem) {
    setEditData(findItem);
  }
  openEditPermissionModal();
}

async function handleDeleteTable(rowId: string) {
  const data = await delrles(rowId);
  if (!data.error) {
    window.$message?.success($t('common.deleteSuccess'));
    getTableData();
  }
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

// function handleQuery() {
//   init();
// }

// function handleReset() {
//   Object.assign(queryParams, {
//     email: null,
//     name: null,
//     status: null,
//     page: 1
//   });
//   handleQuery();
// }

function init() {
  getTableData();
}
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});
// 初始化
init();
</script>

<template>
  <div>
    <n-card>
      <div class="h-full flex-col gap-15px">
        <NSpace>
          <NButton type="primary" @click="handleAddTable">
            <icon-ic-round-plus class="mr-4px text-20px" />
            {{ $t('page.manage.role.addRole') }}
          </NButton>
        </NSpace>

        <n-data-table
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          class="flex-1-hidden"
        />
        <TableActionModal
          v-model:visible="visible"
          :class="getPlatform ? 'w-90%' : 'w-500px'"
          :type="modalType"
          :edit-data="editData"
          @success="getTableData"
        />
        <EditPermissionModal
          v-model:visible="editPermissionVisible"
          :class="getPlatform ? 'w-90%' : 'w-600px'"
          :edit-data="editData"
        />
        <EditPasswordModal
          v-model:visible="editPwdVisible"
          :class="getPlatform ? 'w-90%' : 'w-500px'"
          :edit-data="editData"
          @success="getTableData"
        ></EditPasswordModal>
      </div>
    </n-card>
  </div>
</template>

<style scoped></style>
