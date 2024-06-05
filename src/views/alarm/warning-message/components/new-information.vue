<!--
 * @Descripttion:
 * @version:
 * @Author: zhaoqi
 * @Date: 2024-03-17 16:22:54
 * @LastEditors: zhaoqi
 * @LastEditTime: 2024-03-20 19:48:13
-->
<script setup lang="tsx">
import { computed, getCurrentInstance, h, reactive, ref } from 'vue';
import type { Ref } from 'vue';
import type { DataTableColumns, PaginationProps } from 'naive-ui';
import { NButton, NPopconfirm, useMessage } from 'naive-ui';
import { getNotificationGroupList } from '@/service/api/notification';
import { delInfo, editInfo, warningMessageList } from '@/service/api/alarm';
import { $t } from '@/locales';
import type { ModalType } from './pop-up.vue';
import popUp from './pop-up.vue';
import { useBoolean } from '~/packages/hooks';

const rowKey = (row: DeviceManagement.DeviceData) => row.id;
const { bool: visible, setTrue: openModal } = useBoolean();
const modalType = ref<ModalType>('add');
const params = {
  ID: '',
  enabled: 'Y'
};
const deleteId = ref('');

function setModalType(type: ModalType) {
  modalType.value = type;
}

function addWarningMessageBut() {
  openModal();
  setModalType('add');
}

function newEdit() {
  list();
}

/** 表格案例处理事件 */
const editData = ref<Api.Alarm.NotificationGroupList | null>(null);

function handleEditPwd(row, type) {
  // type:edit编辑，enable停用启用
  if (type === 'edit') {
    editData.value = row;
    setModalType('edit');
    openModal();
  } else if (type === 'enable') {
    const enableds = row.enabled === 'Y' ? 'N' : 'Y';
    params.ID = row.id;
    params.enabled = enableds;
    editInfos();
  }
}

const loading = ref(false);
const message = useMessage();
const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30],
  onChange: (page: number) => {
    pagination.page = page;
    list();
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize;
    pagination.page = 1;
    list();
  }
});

interface ColumnsData {
  name: string;
  description: string;
  alarm_level: string;
  notification_group_id: string;
  enabled: string;

  [key: string]: any;
}

const tableData = ref<ColumnsData[]>([]);

/** 告警信息列表 */
async function list() {
  loading.value = true;
  const innerparams = { page: pagination.page, page_size: pagination.pageSize };
  const { data } = await warningMessageList(innerparams);

  if (data) {
    setTimeout(() => {
      loading.value = false;
      tableData.value = data.list;
      const operatorBtn: { btnName: string; type: string; color: string }[] = [
        {
          btnName: $t('common.edit'),
          type: 'edit',
          color: 'info'
        },
        {
          btnName: $t('page.manage.common.status.disable'),
          type: 'enable',
          color: 'warning'
        },
        {
          btnName: $t('common.delete'),
          type: 'delete',
          color: 'error'
        }
      ];
      const operatorBtns: { btnName: string; type: string; color: string }[] = [
        { btnName: $t('common.edit'), type: 'edit', color: 'info' },
        { btnName: $t('page.manage.common.status.enable'), type: 'enable', color: 'success' },
        { btnName: $t('common.delete'), type: 'delete', color: 'error' }
      ];
      // eslint-disable-next-line array-callback-return
      tableData.value.map(item => {
        if (item.enabled === 'Y') {
          item.operatorBtn = operatorBtn;
        } else {
          item.operatorBtn = operatorBtns;
        }
      });
      pagination.itemCount = data.total;
    }, 1000);
  }
}

/** 获取通知组 */
const getTableData = async () => {
  const prams = {
    page: 100,
    page_size: 100
  };
  const res = await getNotificationGroupList(prams);
  console.log('通知组', res);
};
getTableData();
const columns: Ref<DataTableColumns<ColumnsData>> = ref([
  {
    key: 'name',
    title: $t('generate.alarm-name'),
    align: 'center',
    minWidth: '140px',
    ellipsis: {
      tooltip: true
    }
  },
  {
    key: 'description',
    title: $t('generate.alarm-description'),
    align: 'center',
    minWidth: '180px',
    ellipsis: {
      tooltip: true
    }
  },
  {
    key: 'alarm_level',
    title: $t('common.alarm_level'),
    align: 'center',
    minWidth: '100px',
    render(row) {
      if (row.alarm_level === 'H') {
        return $t('common.high');
      } else if (row.alarm_level === 'M') {
        return $t('common.middle');
      }
      return $t('common.low');
    }
  },

  {
    key: 'notification_group_name',
    title: $t('generate.notification-group'),
    align: 'center',
    minWidth: '140px',
    ellipsis: {
      tooltip: true
    }
  },
  {
    key: 'enabled',
    title: $t('generate.runstate'),
    align: 'center',
    minWidth: '100px',
    render(row) {
      if (row.enabled === 'Y') {
        return $t('page.manage.common.status.enable');
      }
      return $t('page.manage.common.status.disable');
    }
  },

  {
    key: 'actions',
    minWidth: '140px',
    title: $t('common.action'),
    align: 'center',
    render: (row: any) => {
      const operatorBtn = row.operatorBtn.map(item => {
        if (item.type === 'delete') {
          return h(
            <NPopconfirm onPositiveClick={() => handleDeleteTable(row)}>
              {{
                default: () => $t('common.confirmDelete'),
                trigger: () => (
                  <NButton type={item.color} size={'small'}>
                    {item.btnName}
                  </NButton>
                )
              }}
            </NPopconfirm>
          );
        }
        return h(
          <NButton type={item.color} size={'small'}>
            {item.btnName}
          </NButton>,
          { onClick: () => handleEditPwd(row, item.type) }
        );
      });
      return <div class="flex">{operatorBtn}</div>;
    }
  }
]) as Ref<DataTableColumns<ColumnsData>>;

list();

/** 删除 */
function handleDeleteTable(rowId) {
  deleteId.value = rowId.id;
  deleteInfo();
}

/** 编辑:启动停止 */

async function editInfos() {
  const { data } = await editInfo(params);
  if (data) {
    params.enabled === 'Y' ? message.success($t('common.startSuccess')) : message.success($t('common.stopSuccess'));

    list();
  } else {
    params.enabled === 'Y' ? message.error($t('common.startFail')) : message.error($t('common.stopFail'));
  }
}

/** 删除告警 */

async function deleteInfo() {
  const { data } = await delInfo(deleteId.value);
  console.log('删除', data);
  if (!data) {
    message.success($t('common.deleteSuccess'));
  } else {
    message.error($t('common.deleteFail'));
  }
  list();
}

const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});
</script>

<template>
  <div class="p-y-12px">
    <NButton type="primary" @click="addWarningMessageBut">
      <IconIcRoundPlus class="mr-4px text-20px" />
      {{ $t('generate.addAlarm') }}
    </NButton>
  </div>
  <div class="h-full flex-col">
    <NDataTable
      remote
      :loading="loading"
      :row-key="rowKey"
      :columns="columns"
      :data="tableData"
      :pagination="pagination"
      class="w-full"
    />
  </div>

  <popUp
    v-model:visible="visible"
    :class="getPlatform ? 'w-90%' : 'w-600px'"
    :type="modalType"
    :edit-data="editData"
    @new-edit="newEdit"
  />
</template>

<style scoped>
:deep(.n-button) {
  cursor: pointer;
  margin-left: 10px;
}
</style>
