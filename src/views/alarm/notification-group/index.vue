<script setup lang="tsx">
import { computed, getCurrentInstance, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Ref } from 'vue'
import { NButton, NEmpty, NPopconfirm, NSpace, NSwitch } from 'naive-ui'
import type { DataTableColumns, PaginationProps } from 'naive-ui'
import {
  deleteNotificationGroup,
  getNotificationGroupDetail,
  getNotificationGroupList,
  putNotificationGroup
} from '@/service/api/notification'
import { notificationOptions } from '@/constants/business'
import { $t } from '@/locales'
import { tableThemeOverrides } from '@/utils/table-theme'
import type { ModalType } from './components/table-action-modal.vue'
import TableActionModal from './components/table-action-modal.vue'
import NotificationGroups from './NotificationGroups.vue'
import NotificationInstances from '~/src/views/management/notification/NotificationInstances.vue'
import NotificationAvailablePlugins from './NotificationAvailablePlugins.vue'
import { useBoolean, useLoading } from '~/packages/hooks'

const { loading, startLoading, endLoading } = useLoading(false)
const { locale } = useI18n()
const tx = (zh: string, en: string) => (locale.value.toLowerCase().startsWith('zh') ? zh : en)
const { bool: visible, setTrue: openModal } = useBoolean()
const tableData = ref<Api.Alarm.NotificationGroupList[]>([])
const total = ref(0)
const rowKey = (row: Api.Alarm.NotificationGroupList) => row.id
const isNativeAlertAlias = (row: Api.Alarm.NotificationGroupList) => row.notification_type === 'ENCORE'

function setTableData(data: Api.Alarm.NotificationGroupList[]) {
  tableData.value = data
}

const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30],
  onChange: (page: number) => {
    pagination.page = page
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
  }
})

const getTableData = async () => {
  startLoading()
  const prams = {
    page: pagination.page || 1,
    page_size: pagination.pageSize || 10
  }
  const res = await getNotificationGroupList(prams)
  if (res?.data) {
    setTableData(res?.data.list || [])
    total.value = res.data.total || 0
  }
  endLoading()
}

const handleSwitchChange = async (row, value) => {
  if (isNativeAlertAlias(row)) return
  row.status = value ? 'OPEN' : 'CLOSE'
  const id = row?.id || ''
  delete row.id
  await putNotificationGroup(row, id)
  getTableData()
}
const handleDeleteTable = async (rowId: string) => {
  if (tableData.value.some(row => row.id === rowId && isNativeAlertAlias(row))) return
  await deleteNotificationGroup({ id: rowId })

  window.$message?.info($t('generate.notificationGroup'))
  getTableData()
}
const editData = ref<Api.Alarm.NotificationGroupList | null>(null)
const handleEditTable = async (rowId: string) => {
  if (tableData.value.some(row => row.id === rowId && isNativeAlertAlias(row))) return
  const res = await getNotificationGroupDetail({ id: rowId })
  if (res?.data) {
    editData.value = res.data
    setModalType('edit')
    openModal()
  }
}
const columns = ref([
  {
    key: 'name',
    title: $t('generate.notification-group-name'),
    minWidth: '140px',
    align: 'left'
  },
  {
    key: 'notification_type',
    title: $t('generate.notification-type'),
    align: 'left',
    minWidth: '140px',
    render: (row: any) => {
      if (isNativeAlertAlias(row)) return tx('ENCORE · 新版通知组入口', 'ENCORE · New notification group entry')
      const notificationType = notificationOptions.find(option => option.value === row.notification_type)?.label || ''
      return notificationType
    }
  },
  {
    key: 'status',
    title: $t('generate.status'),
    align: 'left',
    minWidth: '140px',
    render: (row: any) => {
      return (
        <NSwitch
          value={row.status === 'OPEN'}
          disabled={isNativeAlertAlias(row)}
          onChange={value => handleSwitchChange(row, value)}
        />
      )
    }
  },
  {
    key: 'actions',
    title: $t('common.actions'),
    align: 'left',
    width: '200px',
    render: (row: any) => {
      if (isNativeAlertAlias(row)) {
        return (
          <span class="text-xs text-secondary">{tx('请在新版通知组中维护', 'Manage in new notification groups')}</span>
        )
      }
      return (
        <NSpace justify={'start'}>
          <NButton size={'small'} type="primary" onClick={() => handleEditTable(row.id)}>
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
        </NSpace>
      )
    }
  }
]) as Ref<DataTableColumns<DataService.Data>>

const modalType = ref<ModalType>('add')
const groupTab = ref('accounts')

function setModalType(type: ModalType) {
  modalType.value = type
}

function handleAddTable() {
  openModal()
  setModalType('add')
}

const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})
watch(
  groupTab,
  tab => {
    if (tab === 'legacy-groups') void getTableData()
  },
  { immediate: true }
)
</script>

<template>
  <div>
    <NTabs v-model:value="groupTab" type="line">
      <NTabPane name="accounts" :tab="tx('通知账号', 'Notification accounts')">
        <NAlert type="info" class="mb-12px">
          {{
            tx(
              '使用顺序：先查看“可用通知插件”，再创建通知账号和新版通知组，点击“用于社区告警”，最后在告警规则中选择该入口。旧版通知组继续由旧告警流程使用。',
              'To get started, review available plugins, create a notification account and group, publish it for community alerts, then select its entry in an alert rule. Legacy groups remain with the existing alert flow.'
            )
          }}
        </NAlert>
        <NotificationInstances />
      </NTabPane>
      <NTabPane name="available-plugins" :tab="tx('可用通知插件', 'Available plugins')">
        <NotificationAvailablePlugins />
      </NTabPane>
      <NTabPane name="native-groups" :tab="tx('新版通知组', 'New notification groups')">
        <NotificationGroups />
      </NTabPane>
      <NTabPane name="legacy-groups" :tab="tx('旧通知组（旧系统）', 'Legacy groups')">
        <NAlert type="info" class="mb-12px">
          {{
            tx(
              '旧 APP 通知组继续由旧告警流程和旧通知配置管理；请在此旧入口继续维护。新 Encore 组请使用“新版通知组”，两个入口不会自动转换。',
              'Legacy APP groups remain managed by the existing alert flow and notification config. Maintain them here; use Encore groups for new groups. The two entries do not convert groups automatically.'
            )
          }}
        </NAlert>
        <NCard>
          <div class="notification-group-header">
            <div class="notification-group-title">{{ $t('generate.notification-group') }}</div>
            <div class="notification-group-toolbar">
              <NButton type="primary" @click="handleAddTable">{{ $t('common.createNotificationGroup') }}</NButton>
            </div>
          </div>
          <div class="h-full flex-col">
            <NDataTable
              class="thingspanel-data-table"
              size="medium"
              :theme-overrides="tableThemeOverrides"
              :bordered="true"
              :bottom-bordered="true"
              :single-column="false"
              :single-line="true"
              :striped="false"
              :scroll-x="880"
              :row-key="rowKey"
              :columns="columns"
              :data="tableData"
              :loading="loading"
            >
              <template #empty>
                <NEmpty size="small" :description="$t('common.noData')" />
              </template>
            </NDataTable>
            <div class="pagination-box">
              <NPagination v-model:page="pagination.page" :item-count="total" @update:page="getTableData" />
            </div>
            <TableActionModal
              v-model:visible="visible"
              :class="getPlatform ? 'w-90%' : 'w-600px'"
              :type="modalType"
              :edit-data="editData"
              @get-table-data="getTableData"
            />
          </div>
        </NCard>
      </NTabPane>
    </NTabs>
  </div>
</template>

<style scoped>
.notification-group-header {
  display: block;
  margin-bottom: 20px;
}

.notification-group-title {
  color: var(--text-color);
  font-size: 20px;
  font-weight: 700;
  line-height: 28px;
}

.notification-group-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  min-height: 36px;
  margin-top: 12px;
}

.pagination-box {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}
</style>
