<script setup lang="tsx">
import { ref } from 'vue'
import { NButton, NEmpty, NPopconfirm, NTag } from 'naive-ui'
import { useBoolean } from '@sa/hooks'
import { fetchGetUserList } from '@/service/api'
import { useAppStore } from '@/store/modules/app'
import { useTable } from '@/hooks/common/table'
import { $t } from '@/locales'
import { enableStatusRecord, userGenderRecord } from '@/constants/business'
import UserOperateDrawer, { type OperateType } from './modules/user-operate-drawer.vue'
import UserSearch from './modules/user-search.vue'

const appStore = useAppStore()
const tableThemeOverrides = {
  borderColor: 'var(--border-color)',
  borderRadius: '10px',
  fontSizeMedium: '14px',
  lineHeight: '1.5',
  thColor: 'var(--body-color)',
  thColorHover: 'var(--body-color)',
  thFontWeight: '400',
  thTextColor: 'var(--text-color)',
  tdColor: 'var(--card-color)',
  tdColorHover: 'var(--primary-color-suppl)',
  tdColorSorting: 'var(--primary-color-suppl)',
  tdTextColor: 'var(--text-color)',
  thPaddingMedium: '12px',
  tdPaddingMedium: '13px 12px'
}
const { bool: drawerVisible, setTrue: openDrawer } = useBoolean()

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
    const { records = [], current = 1, size = 10, total = 0 } = res.data || {}

    return {
      data: records,
      pageNum: current,
      pageSize: size,
      total
    }
  },
  columns: () => [
    {
      type: 'selection',
      align: 'center',
      minWidth: '140px'
    },
    {
      key: 'index',
      title: $t('common.index'),
      render: (_, index): string => getIndex(index),
      align: 'center',
      minWidth: '140px'
    },
    {
      key: 'userName',
      title: $t('page.manage.user.userName'),
      align: 'center',
      minWidth: 100
    },
    {
      key: 'userGender',
      title: $t('page.manage.user.userGender'),
      align: 'center',
      minWidth: '140px',
      render: row => {
        if (row.userGender === null) {
          return null
        }

        const tagMap: Record<Api.SystemManage.UserGender, NaiveUI.ThemeColor> = {
          1: 'primary',
          2: 'error'
        }

        const label = $t(userGenderRecord[row.userGender])

        return <NTag type={tagMap[row.userGender]}>{label}</NTag>
      }
    },
    {
      key: 'nickName',
      title: $t('page.manage.user.nickName'),
      align: 'center',
      minWidth: 100
    },
    {
      key: 'userPhone',
      title: $t('page.manage.user.userPhone'),
      align: 'center',
      minWidth: '140px'
    },
    {
      key: 'userEmail',
      title: $t('page.manage.user.userEmail'),
      align: 'center',
      minWidth: 200
    },
    {
      key: 'status',
      title: $t('page.manage.user.userStatus'),
      align: 'center',
      minWidth: '140px',
      render: row => {
        if (row.status === null) {
          return null
        }

        const tagMap: Record<Api.Common.EnableStatus, NaiveUI.ThemeColor> = {
          1: 'success',
          2: 'warning'
        }

        const label = $t(enableStatusRecord[row.status])

        return <NTag type={tagMap[row.status]}>{label}</NTag>
      }
    },
    {
      key: 'operate',
      title: $t('common.actions'),
      align: 'center',
      minWidth: '140px',
      render: row => (
        <div class="flex-center gap-8px">
          <NButton type="primary" ghost size="small" onClick={() => handleEdit(row.id)}>
            {$t('common.edit')}
          </NButton>
          <NPopconfirm onPositiveClick={() => handleDelete(row.id)}>
            {{
              default: () => $t('common.confirmDelete'),
              trigger: () => (
                <NButton type="error" ghost size="small">
                  {$t('common.delete')}
                </NButton>
              )
            }}
          </NPopconfirm>
        </div>
      )
    }
  ]
})

const operateType = ref<OperateType>('add')

function handleAdd() {
  operateType.value = 'add'
  openDrawer()
}

const checkedRowKeys = ref<string[]>([])

async function handleBatchDelete() {
  // requestTs
  // window.$message?.success($t('common.deleteSuccess'));

  checkedRowKeys.value = []

  getData()
}

/** the editing row data */
const editingData = ref<Api.SystemManage.User | null>(null)

function handleEdit(id: number) {
  operateType.value = 'edit'
  editingData.value = data.value.find(item => item.id === id) || null
  openDrawer()
}
// eslint-disable-next-line
async function handleDelete(id: number) {
  // requestTs
  // window.$message?.success($t('common.deleteSuccess'));

  getData()
}

function getIndex(index: number) {
  const { page = 0, pageSize = 10 } = pagination

  return String((page - 1) * pageSize + index + 1)
}
</script>

<template>
  <div class="flex-vertical-stretch gap-16px overflow-hidden <sm:overflow-auto">
    <UserSearch v-model:model="searchParams" @reset="resetSearchParams" @search="getData" />
    <NCard :title="$t('page.manage.user.title')" :bordered="false" size="small" class="sm:flex-1-hidden card-wrapper">
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
        class="device-data-table flex-1-hidden"
        v-model:checked-row-keys="checkedRowKeys"
        :columns="columns"
        :data="data"
        size="medium"
        :theme-overrides="tableThemeOverrides"
        :bordered="true"
        :bottom-bordered="true"
        :single-column="false"
        :single-line="true"
        :striped="false"
        :flex-height="!appStore.isMobile"
        :scroll-x="962"
        :loading="loading"
        :pagination="pagination"
        :row-key="item => item.id"
      >
        <template #empty>
          <NEmpty size="small" :description="$t('common.noData')" />
        </template>
      </NDataTable>
      <UserOperateDrawer
        v-model:visible="drawerVisible"
        :operate-type="operateType"
        :row-data="editingData"
        @submitted="getData"
      />
    </NCard>
  </div>
</template>

<style scoped lang="scss">
.device-data-table {
  min-width: 100%;
  overflow: hidden;
  border: 1px solid var(--border-color);
  border-radius: 10px;
  background: var(--card-color);
  box-shadow: 0 1px 2px rgb(15 23 42 / 4%);

  :deep(.n-data-table-th) {
    height: 44px;
    color: var(--text-color);
    background: var(--body-color) !important;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
  }

  :deep(.n-data-table-th),
  :deep(.n-data-table-td) {
    padding-left: 12px;
    padding-right: 12px;
  }

  :deep(.n-data-table-td) {
    color: var(--text-color);
    background: var(--card-color) !important;
    font-size: 14px;
    font-weight: 400;
    line-height: 1.5;
    border-bottom: 1px solid rgb(226 232 240 / 85%) !important;
    transition:
      background-color 180ms ease,
      box-shadow 180ms ease;
  }

  :deep(.n-data-table-tr:not(.n-data-table-tr--summary):hover > .n-data-table-td) {
    background: rgb(239 246 255) !important;
    box-shadow:
      inset 0 1px 0 rgb(191 219 254 / 60%),
      inset 0 -1px 0 rgb(191 219 254 / 60%) !important;
  }
}
</style>
