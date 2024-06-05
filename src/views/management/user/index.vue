<script setup lang="tsx">
import { computed, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import { NButton, NPopconfirm, NSpace, NTag } from 'naive-ui';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { useBoolean, useLoading } from '@sa/hooks';
import dayjs from 'dayjs';
import { userStatusOptions } from '@/constants/business';
import { delUser, fetchUserList } from '@/service/api/auth';
import { useAuthStore } from '@/store/modules/auth';
import { $t } from '@/locales';
import TableActionModal from './components/table-action-modal.vue';
import EditPasswordModal from './components/edit-password-modal.vue';
import type { ModalType } from './components/table-action-modal.vue';
// import ColumnSetting from './components/column-setting.vue'

const authStore = useAuthStore();
const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal } = useBoolean();
const { bool: editPwdVisible, setTrue: openEditPwdModal } = useBoolean();
const showEmpty = ref(false);

const customUserStatusOptions = computed(() => {
  return userStatusOptions.map(item => {
    const key = item.value === 'N' ? 'page.manage.user.status.normal' : 'page.manage.user.status.freeze';
    return {
      label: $t(key),
      value: item.value
    };
  });
});

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

const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  itemCount: 0,
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

const tableData = ref<UserManagement.User[]>([]);

function setTableData(data: UserManagement.User[]) {
  console.log(data);
  if (data === null) {
    showEmpty.value = true;
  } else {
    showEmpty.value = false;
    tableData.value = data;
  }
}

async function getTableData() {
  startLoading();
  const { data } = await fetchUserList(queryParams);
  if (data) {
    const list: UserManagement.User[] = data.list;
    pagination.itemCount = data.total;
    setTableData(list);
    endLoading();
  }
}

const columns: Ref<DataTableColumns<UserManagement.User>> = ref([
  {
    key: 'email',
    minWidth: '140px',
    title: () => $t('page.manage.user.userEmail'),
    align: 'center'
  },
  {
    key: 'name',
    minWidth: '140px',
    title: () => $t('page.manage.user.userName'),
    align: 'center'
  },
  {
    key: 'phone_number',
    minWidth: '140px',
    title: () => $t('page.manage.user.userPhone'),
    align: 'center'
  },
  {
    key: 'created_at',
    minWidth: '140px',
    title: () => $t('common.creationTime'),
    align: 'center',
    render: row => dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss')
  },
  {
    key: 'status',
    minWidth: '140px',
    title: () => $t('page.manage.user.userStatus'),
    align: 'center',
    render: row => {
      if (row.status) {
        const tagTypes: Record<UserManagement.UserStatusKey, NaiveUI.ThemeColor> = {
          N: 'success',
          F: 'error'
        };
        const key = row.status === 'N' ? 'page.manage.user.status.normal' : 'page.manage.user.status.freeze';
        return <NTag type={tagTypes[row.status]}>{$t(key)}</NTag>;
      }
      return <span></span>;
    }
  },
  // {
  //   key: 'gender',
  //   title: '性别',
  //   align: 'center',
  //   render: row => {
  //     if (row.gender) {
  //       const tagTypes: Record<UserManagement.GenderKey, NaiveUI.ThemeColor> = {
  //         '0': 'success',
  //         '1': 'warning'
  //       }
  //       return <NTag type={tagTypes[row.gender]}>{genderLabels[row.gender]}</NTag>
  //     }

  //     return <span></span>
  //   }
  // },
  {
    key: 'remark',
    minWidth: '140px',
    title: () => $t('common.remark'),
    align: 'center'
  },
  {
    key: 'actions',
    minWidth: '140px',
    title: () => $t('common.action'),
    align: 'center',
    render: row => {
      return (
        <NSpace justify={'center'}>
          <NPopconfirm
            negative-text={$t('common.cancel')}
            positive-text={$t('common.confirm')}
            onPositiveClick={() => handleEnter(row.id)}
          >
            {{
              default: () => $t('common.confirm'),
              trigger: () => (
                <NButton type="warning" size={'small'}>
                  {$t('page.manage.user.enter')}
                </NButton>
              )
            }}
          </NPopconfirm>
          <NButton type="warning" size={'small'} onClick={() => handleEditPwd(row.id)}>
            {$t('page.login.resetPwd.title')}
          </NButton>
          <NButton type="primary" size={'small'} onClick={() => handleEditTable(row.id)}>
            {$t('common.edit')}
          </NButton>
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

/** 切换用户 */
async function handleEnter(rowId: string) {
  await authStore.enter(rowId);
}

function handleEditPwd(rowId: string) {
  const findItem = tableData.value.find(item => item.id === rowId);
  if (findItem) {
    setEditData(findItem);
  }
  openEditPwdModal();
}

function handleEditTable(rowId: string) {
  const findItem = tableData.value.find(item => item.id === rowId);
  if (findItem) {
    setEditData(findItem);
  }
  setModalType('edit');
  openModal();
}

async function handleDeleteTable(rowId: string) {
  const data = await delUser(rowId);
  if (!data.error) {
    window.$message?.success($t('common.deleteSuccess'));
    getTableData();
  }
}

function handleQuery() {
  init();
}

function handleReset() {
  Object.assign(queryParams, {
    email: null,
    name: null,
    status: null,
    page: 1
  });
  handleQuery();
}

function init() {
  getTableData();
}

// 初始化
init();
</script>

<template>
  <div>
    <NCard :title="$t('route.management_user')" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="h-full flex-col">
        <NForm inline label-placement="left" :model="queryParams">
          <NFormItem :label="$t('page.manage.user.userEmail')" path="email">
            <NInput v-model:value="queryParams.email" />
          </NFormItem>
          <NFormItem :label="$t('page.manage.user.userName')" path="name">
            <NInput v-model:value="queryParams.name" />
          </NFormItem>
          <NFormItem :label="$t('page.manage.user.userStatus')" path="status">
            <NSelect v-model:value="queryParams.status" clearable class="w-200px" :options="customUserStatusOptions" />
          </NFormItem>
          <NFormItem>
            <NButton class="w-72px" type="primary" @click="handleQuery">{{ $t('common.search') }}</NButton>
            <NButton class="ml-20px w-72px" type="primary" @click="handleReset">{{ $t('common.reset') }}</NButton>
          </NFormItem>
        </NForm>
        <NSpace class="pb-12px" justify="space-between">
          <NSpace>
            <NButton type="primary" @click="handleAddTable">
              <IconIcRoundPlus class="mr-4px text-20px" />
              {{ $t('common.add') }}
            </NButton>
            <!--
 <n-button type="error">
              <icon-ic-round-delete class="mr-4px text-20px" />
              删除
            </n-button>
            <n-button type="success">
              <icon-uil:export class="mr-4px text-20px" />
              导出Excel
            </n-button>
-->
          </NSpace>
          <!--
 <n-space align="center" :size="18">
            <n-button size="small" type="primary" @click="getTableData">
              <icon-mdi-refresh class="mr-4px text-16px" :class="{ 'animate-spin': loading }" />
              刷新表格
            </n-button>
            <column-setting v-model:columns="columns" />
          </n-space>
-->
        </NSpace>
        <NCard></NCard>

        <NDataTable
          v-if="!showEmpty"
          :row-key="row => row.id"
          :remote="true"
          :columns="columns"
          :data="tableData"
          :loading="loading"
          :pagination="pagination"
          class="flex-1-hidden"
        />
        <div v-if="showEmpty" class="h-500px flex-center flex-col">
          <n-empty :description="$t('common.nodata')"></n-empty>
        </div>
        <TableActionModal v-model:visible="visible" :type="modalType" :edit-data="editData" @success="getTableData" />
        <EditPasswordModal
          v-model:visible="editPwdVisible"
          :edit-data="editData"
          @success="getTableData"
        ></EditPasswordModal>
      </div>
    </NCard>
  </div>
</template>

<style scoped></style>
