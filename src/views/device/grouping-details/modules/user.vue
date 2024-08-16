<script setup lang="ts">
import { onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import type { PaginationProps } from 'naive-ui';
import { useDialog, useMessage } from 'naive-ui';
import { $t } from '@/locales';
import { assignUserToGroupDevice, deleteUserToGroupDevice, getDeviceGroupUserList } from '@/service/api/device.ts';
import { getUserList } from '@/service/api/notification.ts';

const dialog = useDialog();
const message = useMessage();
const router = useRouter();

const props = defineProps<{
  id: string;
}>();

const columns: any = [
  {
    type: 'selection'
  },
  {
    key: 'name',
    minWidth: '100px',
    title: $t('common.userName')
  },
  {
    key: 'email',
    minWidth: '100px',
    title: $t('common.loginName')
  },
  {
    minWidth: '100px',
    title: $t('common.lastLoginTime')
  }
];

const state = reactive({
  tableData: [],
  loading: false,
  total: 0,
  showModal: false,
  selectedUser: null,
  userList: [],
  selectedList: []
});

const getTableData = () => {
  getDeviceGroupUserList(props.id).then(res => {
    console.log(res);
    state.tableData = res.data || [];
  });
};

const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  itemCount: 0,
  pageSizes: [10, 15, 20, 25, 30],
  onChange: (page: number) => {
    pagination.page = page;
    getTableData();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    getTableData();
  }
});

onMounted(() => {
  getTableData();
  getUserList({
    page: 1,
    page_size: 100
  }).then(res => {
    state.userList = res.data?.list || [];
  });
});

const toAddUser = () => {
  state.showModal = true;
  state.selectedUser = null;
};

const closeDialog = () => {
  state.showModal = false;
  state.selectedUser = null;
};

function handleCheck(rowKeys: any) {
  state.selectedList = rowKeys;
}

const toAdd = () => {
  assignUserToGroupDevice({
    user_ids: [state.selectedUser],
    group_ids: [props.id]
  }).then(_ => {
    state.showModal = false;
    getTableData();
    message.success($t('common.addSuccess'));
  });
};

const toCreate = () => {
  router.push('/management/ordinary-user');
};

const toDelete = () => {
  dialog.warning({
    title: $t('common.removeRelatedUser'),
    content: $t('common.confirmRemove'),
    positiveText: $t('device_template.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      deleteUserToGroupDevice({
        user_ids: state.selectedList,
        group_ids: [props.id]
      }).then(_ => {
        getTableData();
        message.success($t('common.deleteSuccess'));
      });
    }
  });
};
</script>

<template>
  <NCard>
    <div class="h-500px flex-center flex-col">
      <div class="flex-start mb-4 w-full">
        <NButton type="primary" @click="toAddUser()">{{ $t('common.addRelatedUser') }}</NButton>
        <NButton class="ml-2" type="error" :disabled="!state.selectedList.length" @click="toDelete">
          {{ $t('common.removeRelatedUser') }}
        </NButton>
      </div>
      <NDataTable
        :columns="columns"
        :data="state.tableData"
        :loading="state.loading"
        class="flex-1-hidden"
        :row-key="row => row.id"
        @update:checked-row-keys="handleCheck"
      />
      <!--
 <div class="pagination-box">
        <NPagination v-model:page="pagination.page" :item-count="state.total" @update:page="getTableData" />
      </div> 
-->
      <!-- <n-empty :description="$t('common.nodata')"></n-empty> -->
    </div>
    <NModal v-model:show="state.showModal">
      <NCard
        class="add-dialog"
        :title="$t('common.addRelatedUser')"
        :bordered="false"
        size="huge"
        role="dialog"
        aria-modal="true"
      >
        <n-alert type="info">{{ $t('common.addUserToDeviceInfo') }}</n-alert>
        <div class="mb-2 mt-4">{{ $t('generate.select-user') }}</div>
        <NSelect
          v-model:value="state.selectedUser"
          class="flex-1"
          :options="state.userList"
          :placeholder="$t('common.select')"
          label-field="name"
          value-field="id"
        />
        <template #footer>
          <div class="footer-action">
            <NButton type="default" @click="toCreate()">{{ $t('common.createUser') }}</NButton>
            <div>
              <NButton type="default" @click="closeDialog()">{{ $t('common.cancel') }}</NButton>
              <NButton class="ml-2" type="primary" :disabled="!state.selectedUser" @click="toAdd()">
                {{ $t('generate.add') }}
              </NButton>
            </div>
          </div>
        </template>
      </NCard>
    </NModal>
  </NCard>
</template>

<style scoped>
.add-dialog {
  width: 600px;
}

.footer-action {
  display: flex;
  justify-content: space-between;
}
</style>
