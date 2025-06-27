<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NPopconfirm, NTag } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { fetchGetUserList } from '@/service/api';
import { useAppStore } from '@/store/modules/app';
import { useTable } from '@/hooks/common/table';
import { $t } from '@/locales';
import { enableStatusRecord, userGenderRecord } from '@/constants/business';
import UserOperateDrawer, { type OperateType } from './modules/user-operate-drawer.vue';
import UserSearch from './modules/user-search.vue';

const appStore = useAppStore();
const { bool: drawerVisible, setTrue: openDrawer } = useBoolean();

const { columns, filteredColumns, data, loading, pagination, getData, searchParams, resetSearchParams } = useTable<
  Api.SystemManage.User,
  typeof fetchGetUserList,
  'index' | 'operate'
>({
  apiFn: fetchGetUserList,
  apiParams: {
    current: 1,
    size: 10,
    // if you want to use the searchParams in Form, you need to define the following properties, and the value is null
    // the value can not be undefined, otherwise the property in Form will not be reactive
    status: null,
    userName: null,
    userGender: null,
    nickName: null,
    userPhone: null,
    userEmail: null
  },
  transformer: res => {
    const { records = [], current = 1, size = 10, total = 0 } = res.data || {};

    return {
      data: records,
      pageNum: current,
      pageSize: size,
      total
    };
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      minWidth: '140px'
    },
    {
      key: 'index',
      title: "序号",
      render: (_, index): string => getIndex(index),
      align: 'center',
      minWidth: '140px'
    },
    {
      key: 'userName',
      title: "姓名",
      align: 'center',
      minWidth: 100
    },
    {
      key: 'userGender',
      title: "性别",
      align: 'center',
      minWidth: '140px',
      render: row => {
        if (row.userGender === null) {
          return null;
        }

        const tagMap: Record<Api.SystemManage.UserGender, NaiveUI.ThemeColor> = {
          1: 'primary',
          2: 'error'
        };

        const label = "动态文本";

        return <NTag type={tagMap[row.userGender]}>{label}</NTag>;
      }
    },
    {
      key: 'nickName',
      title: "昵称",
      align: 'center',
      minWidth: 100
    },
    {
      key: 'userPhone',
      title: "手机号",
      align: 'center',
      minWidth: '140px'
    },
    {
      key: 'userEmail',
      title: "邮箱",
      align: 'center',
      minWidth: 200
    },
    {
      key: 'status',
      title: "租户状态",
      align: 'center',
      minWidth: '140px',
      render: row => {
        if (row.status === null) {
          return null;
        }

        const tagMap: Record<Api.Common.EnableStatus, NaiveUI.ThemeColor> = {
          1: 'success',
          2: 'warning'
        };

        const label = "动态文本";

        return <NTag type={tagMap[row.status]}>{label}</NTag>;
      }
    },
    {
      key: 'operate',
      title: "操作",
      align: 'center',
      minWidth: '140px',
      render: row => (
        <div class="flex-center gap-8px">
          <NButton type="primary" ghost size="small" onClick={() => handleEdit(row.id)}>
            {"编辑"}
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
            {{
              default: () => "确认删除",
              trigger: () => (
                <NButton type="error" ghost size="small">
                  {"删除"}
                </NButton>
              )
            }}
          </NPopconfirm>
        </div>
      )
    }
  ]
});

const operateType = ref<OperateType>('add');

function handleAdd() {
  operateType.value = 'add';
  openDrawer();
}

const checkedRowKeys = ref<string[]>([]);

async function handleBatchDelete() {
  // requestTs
  // window.$message?.success("删除成功");

  checkedRowKeys.value = [];

  getData();
}

/** the editing row data */
const editingData = ref<Api.SystemManage.User | null>(null);

function handleEdit(id: number) {
  operateType.value = 'edit';
  editingData.value = data.value.find(item => item.id === id) || null;
  openDrawer();
}
// eslint-disable-next-line
async function handleDelete(id: number) {
  // requestTs
  // window.$message?.success("删除成功");

  getData();
}

function getIndex(index: number) {
  const { page = 0, pageSize = 10 } = pagination;

  return String((page - 1) * pageSize + index + 1);
}
</script>

<template>
  <div class="flex-vertical-stretch gap-16px overflow-hidden <sm:overflow-auto">
    <UserSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getData" />
    <NCard :title="用户列表" :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
      <template #header-extra>
        <TableHeaderOperation
          v-model:columns="filteredColumns"
          :disabled-delete="checkedRowKeys.length === 0"
          :loading="loading"
          @add="handleAdd"
          @delete="handleBatchDelete"
          @refresh="getData"
        />
      </template>
      <NDataTable
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        size="small"
        :flex-height="!appStore.isMobile"
        :scroll-x="962"
        :loading="loading"
        :pagination="pagination"
        :row-key="item => item.id"
        class="flex-1-hidden"
      />
      <UserOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getData"
      />
    </NCard>
  </div>
</template>

<style scoped></style>
