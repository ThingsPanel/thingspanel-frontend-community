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
import pwData from './components/pw.json';
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

// 时区选项
const timezoneOptions = [
  { label: 'Asia/Shanghai (北京时间)', value: 'Asia/Shanghai' },
  { label: 'Asia/Tokyo (东京时间)', value: 'Asia/Tokyo' },
  { label: 'Asia/Seoul (首尔时间)', value: 'Asia/Seoul' },
  { label: 'Asia/Singapore (新加坡时间)', value: 'Asia/Singapore' },
  { label: 'Asia/Hong_Kong (香港时间)', value: 'Asia/Hong_Kong' },
  { label: 'Asia/Bangkok (曼谷时间)', value: 'Asia/Bangkok' },
  { label: 'Asia/Dubai (迪拜时间)', value: 'Asia/Dubai' },
  { label: 'Asia/Kolkata (印度时间)', value: 'Asia/Kolkata' },
  { label: 'Europe/London (伦敦时间)', value: 'Europe/London' },
  { label: 'Europe/Paris (巴黎时间)', value: 'Europe/Paris' },
  { label: 'Europe/Berlin (柏林时间)', value: 'Europe/Berlin' },
  { label: 'Europe/Moscow (莫斯科时间)', value: 'Europe/Moscow' },
  { label: 'America/New_York (纽约时间)', value: 'America/New_York' },
  { label: 'America/Los_Angeles (洛杉矶时间)', value: 'America/Los_Angeles' },
  { label: 'America/Chicago (芝加哥时间)', value: 'America/Chicago' },
  { label: 'America/Toronto (多伦多时间)', value: 'America/Toronto' },
  { label: 'Australia/Sydney (悉尼时间)', value: 'Australia/Sydney' },
  { label: 'Australia/Melbourne (墨尔本时间)', value: 'Australia/Melbourne' },
  { label: 'Pacific/Auckland (奥克兰时间)', value: 'Pacific/Auckland' },
  { label: 'UTC (协调世界时)', value: 'UTC' }
];

// 语言选项
const languageOptions = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' }
];

// 转换 pw.json 数据为级联选择器格式
const convertPwDataToCascader = (data: any): any[] => {
  return data.map((province: any) => ({
    value: province.name,
    label: province.name,
    children: province.children?.map((city: any) => ({
      value: city.name,
      label: city.name,
      children: city.children?.map((district: any) => ({
        value: district.name,
        label: district.name
      })) || []
    })) || []
  }));
};

// 省市区数据
const provinceCityData = convertPwDataToCascader(pwData);

// 处理省市区选择变化，将选择的值映射到对应的字段
const handleAddressChange = (value: string[]) => {
  queryParams.address.cascaderValue = value;
  if (value && value.length >= 3) {
    queryParams.address.province = value[0]; // 省份
    queryParams.address.city = value[1];     // 城市
    queryParams.address.district = value[2]; // 区县
  } else {
    queryParams.address.province = null;
    queryParams.address.city = null;
    queryParams.address.district = null;
  }
};

// 级联选择器搜索过滤函数
const filterCascader = (pattern: string, option: any) => {
  return option.label.toLowerCase().includes(pattern.toLowerCase());
};

type QueryFormModel = Pick<UserManagement.User, 'email' | 'name' | 'status'> & {
  page: number;
  page_size: number;
  organization: string | null;
  timezone: string | null;
  default_language: string | null;
  address: {
    province: string | null;
    city: string | null;
    district: string | null;
    detailed_address: string | null;
    cascaderValue: string[] | null; // 新增：存储级联选择器的值
  };
};

const queryParams = reactive<QueryFormModel>({
  email: null,
  name: null,
  status: null,
  page: 1,
  page_size: 10,
  organization: null,
  timezone: null,
  default_language: null,
  address: {
    province: null,
    city: null,
    district: null,
    detailed_address: null,
    cascaderValue: null
  }
});

// 处理省市区级联选择
const handleProvinceChange = (value: string[]) => {
  queryParams.address.city = null;
  queryParams.address.district = null;
}

const handleCityChange = (value: string[]) => {
  queryParams.address.district = null;
}

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
    align: 'left'
  },
  {
    key: 'name',
    minWidth: '140px',
    title: () => $t('page.manage.user.userName'),
    align: 'left'
  },
  {
    key: 'phone_number',
    minWidth: '140px',
    title: () => $t('page.manage.user.userPhone'),
    align: 'left'
  },
  {
    key: 'created_at',
    minWidth: '140px',
    title: () => $t('common.creationTime'),
    align: 'left',
    render: row => dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss')
  },
  {
    key: 'status',
    minWidth: '140px',
    title: () => $t('page.manage.user.userStatus'),
    align: 'left',
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
  {
    key: 'lastVisitTime',
    minWidth: '140px',
    title: () => $t('custom.management.lastAccessTime'),
    align: 'left',
    render: row => dayjs(row.lastVisitTime || row.created_at).format('YYYY-MM-DD HH:mm:ss')
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
    align: 'left'
  },
  {
    key: 'actions',
    width: '300px',
    title: () => $t('common.actions'),
    align: 'left',
    render: row => {
      return (
        <NSpace justify={'start'}>
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
  queryParams.page = 1;
  init();
}

function handleReset() {
  Object.assign(queryParams, {
    email: null,
    name: null,
    status: null,
    page: 1,
    organization: null,
    timezone: null,
    default_language: null,
    address: {
      province: null,
      city: null,
      district: null,
      detailed_address: null,
      cascaderValue: null
    }
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
          <NFormItem :label="'组织'" path="organization">
            <NInput v-model:value="queryParams.organization" placeholder="请输入组织名称" />
          </NFormItem>
          <NFormItem :label="'省市区'" path="address.province">
            <NCascader
              v-model:value="queryParams.address.cascaderValue"
              :options="provinceCityData"
              placeholder="请选择省市区（三级联动）"
              clearable
              class="w-300px"
              :show-path="true"
              :filterable="true"
              :filter="filterCascader"
              @update:value="handleAddressChange"
            />
          </NFormItem>
          <NFormItem :label="'详细地址'" path="address.detailed_address">
            <NInput v-model:value="queryParams.address.detailed_address" placeholder="请输入详细地址" />
          </NFormItem>
          <NFormItem :label="'时区'" path="timezone">
            <NSelect v-model:value="queryParams.timezone" clearable class="w-200px" :options="timezoneOptions" placeholder="请选择时区" />
          </NFormItem>
          <NFormItem :label="'默认语言'" path="default_language">
            <NSelect v-model:value="queryParams.default_language" clearable class="w-200px" :options="languageOptions" placeholder="请选择默认语言" />
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
