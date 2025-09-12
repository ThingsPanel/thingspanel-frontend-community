<script setup lang="tsx">
import { computed, getCurrentInstance, reactive, ref } from 'vue'
import type { Ref } from 'vue'
import { NButton, NPopconfirm, NSpace, NSwitch, NTag } from 'naive-ui'
import type { DataTableColumns, PaginationProps } from 'naive-ui'
// import { userStatusLabels, userStatusOptions } from '@/constants'
import { useBoolean, useLoading } from '@sa/hooks'
import { apiKeyDel, fetchKeyList, updateKey } from '@/service/api'
import { $t } from '@/locales'
import { formatDateTime } from '@/utils/common/datetime'
import TableActionModal from './modules/table-action-modal.vue'
import type { ModalType } from './modules/table-action-modal.vue'
// import ColumnSetting from './components/column-setting.vue'

const { loading, startLoading, endLoading } = useLoading(false)
const { bool: visible, setTrue: openModal } = useBoolean()
type QueryFormModel = Pick<UserManagement.UserKey, 'name' | 'status'> & {
  page: number
  page_size: number
}

const queryParams = reactive<QueryFormModel>({
  name: null,
  status: null,
  page: 1,
  page_size: 10
})

const tableData = ref<UserManagement.UserKey[]>([])

function setTableData(data: UserManagement.UserKey[]) {
  tableData.value = data
  tableData.value.forEach(item => {
    item.show = false
  })
}

async function getTableData() {
  startLoading()
  const { data } = await fetchKeyList(queryParams)
  if (data) {
    const list: UserManagement.UserKey[] = data.list
    setTableData(list)
    endLoading()
  }
}

const columns: Ref<DataTableColumns<UserManagement.UserKey>> = ref([
  {
    key: 'name',
    minWidth: '100px',
    title: () => $t('page.manage.api.apiName'),
    align: 'left'
  },

  {
    key: 'api_key',
    minWidth: '100px',
    title: () => $t('page.manage.api.api_key'),
    align: 'left',
    render: (row: any) => {
      if (row.show === false) {
        return (
          <NSpace justify="space-between">
            <NSpace>
              <span>********</span>
              <svg-icon local-icon="eye" class="text-20px" onClick={() => handleOpenEye(row.id)} />
            </NSpace>
          </NSpace>
        )
      } else if (row.show === true) {
        return (
          <NSpace justify="space-between">
            <NSpace>
              <span>{row.api_key}</span>
              <svg-icon local-icon="eye-close" class="text-20px" onClick={() => handleCloseEye(row.id)} />
              <svg-icon local-icon="copy" class="text-20px" onClick={() => handleCopyKey(row.api_key)} />
            </NSpace>
          </NSpace>
        )
      }
      return <span></span>
    }
  },
  {
    key: 'status',
    title: () => $t('page.manage.api.apiStatus'),
    minWidth: '140px',
    align: 'left',
    render: (row: any) => {
      if (row.status === 0) {
        return <NTag type="error">{$t('page.manage.api.apiStatus1.freeze')}</NTag>
      } else if (row.status === 1) {
        return <NTag type="success">{$t('page.manage.api.apiStatus1.normal')}</NTag>
      }
      return <sapn></sapn>
    }
  },
  {
    key: 'created_at',
    title: () => $t('page.manage.api.created_at'),
    minWidth: '130px',
    align: 'left',
    render: row => {
      return formatDateTime(row.updated_at)
    }
  },
  {
    key: 'actions',
    title: () => $t('common.actions'),
    align: 'left',
    width: '320px',
    render: (row: any) => {
      return (
        <NSpace justify={'start'}>
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
          <NSwitch value={Boolean(row.status === 1)} onChange={() => handleSwitchChange(row.id)} />
        </NSpace>
      )
    }
  }
]) as Ref<DataTableColumns<UserManagement.UserKey>>

const modalType = ref<ModalType>('add')

function setModalType(type: ModalType) {
  modalType.value = type
}

const editData = ref<UserManagement.UserKey | null>(null)

function setEditData(data: UserManagement.UserKey | null) {
  editData.value = data
}

function handleAddTable() {
  openModal()
  setModalType('add')
}

function handleOpenEye(rowId: string) {
  const findItem = tableData.value.find(item => item.id === rowId)
  findItem!.show = true
}
function handleCloseEye(rowId: string) {
  const findItem = tableData.value.find(item => item.id === rowId)
  findItem!.show = false
}
async function handleCopyKey(key: string) {
  let success = false
  let errorMessage = $t('theme.configOperation.copyFail') || '复制失败' // 默认错误信息

  // 优先尝试现代 Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(key)
      success = true
      window.$message?.success($t('theme.configOperation.copySuccess') || '复制成功')
      return // 成功则直接返回
    } catch (err) {
      console.error('navigator.clipboard.writeText failed:', err)
      // 如果失败，检查是否因为非安全环境
      if (window.isSecureContext === false) {
        // 更新错误信息，明确指出 HTTPS 问题
        errorMessage = $t('theme.configOperation.copyFailSecure') || '复制功能需要HTTPS或localhost环境'
      }
      // 不return，继续尝试后备方法
    }
  } else {
    // 如果 Clipboard API 不可用，检查是否因为非安全环境
    if (window.isSecureContext === false) {
      errorMessage = $t('theme.configOperation.copyFailSecure') || '复制功能需要HTTPS或localhost环境'
      console.error('Clipboard API not available, likely due to non-secure context.')
    } else {
      console.error('Clipboard API not available.')
    }
  }

  // 尝试后备方法 document.execCommand('copy')
  if (process.env.NODE_ENV === 'development') {
  }
  const textArea = document.createElement('textarea')
  textArea.value = key
  // 防止在屏幕上显示
  textArea.style.position = 'fixed'
  textArea.style.top = '-9999px'
  textArea.style.left = '-9999px'
  textArea.style.opacity = '0'

  document.body.appendChild(textArea)
  textArea.select()
  textArea.setSelectionRange(0, textArea.value.length) // 确保移动端也能选中

  try {
    success = document.execCommand('copy')
    if (success) {
      window.$message?.success($t('theme.configOperation.copySuccess') || '复制成功')
    } else {
      console.error("document.execCommand('copy') returned false.")
      // 如果 execCommand 也失败了，并且已知是非安全环境，可以给出更具体的提示
      if (window.isSecureContext === false) {
        errorMessage =
          $t('theme.configOperation.copyFailSecureFallback') || '复制失败，请尝试在HTTPS环境下操作或手动复制。'
      }
      window.$message?.error(errorMessage)
    }
  } catch (err) {
    console.error("Error during document.execCommand('copy'):", err)
    // 异常情况，同样提示
    if (window.isSecureContext === false) {
      errorMessage =
        $t('theme.configOperation.copyFailSecureFallback') || '复制失败，请尝试在HTTPS环境下操作或手动复制。'
    }
    window.$message?.error(errorMessage)
  } finally {
    // 无论成功失败，都移除临时元素
    document.body.removeChild(textArea)
  }
}
function handleEditTable(rowId: string) {
  const findItem = tableData.value.find(item => item.id === rowId)
  if (findItem) {
    setEditData(findItem)
  }
  setModalType('edit')
  openModal()
}

async function handleSwitchChange(rowId: string) {
  const findItem = tableData.value.find(item => item.id === rowId)
  if (findItem) {
    const keyStatus = findItem.status === 1 ? 0 : 1
    findItem.status = keyStatus
    await updateKey(findItem)
  }
}

async function handleDeleteTable(rowId: string) {
  const data = await apiKeyDel(rowId)
  if (!data.error) {
    window.$message?.success($t('common.deleteSuccess'))
    getTableData()
  }
}

const pagination: PaginationProps = reactive({
  page: 1,
  pageSize: 10,
  showSizePicker: true,
  pageSizes: [10, 15, 20, 25, 30],
  onChange: (page: number) => {
    pagination.page = page
    queryParams.page = page
    getTableData()
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.page = 1
    queryParams.page = 1
    queryParams.page_size = pageSize
    getTableData()
  }
})

function init() {
  getTableData()
}
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})
// 初始化
init()
</script>

<template>
  <div>
    <n-card>
      <div class="h-full flex-col gap-15px">
        <NSpace>
          <NButton type="primary" @click="handleAddTable">
            <icon-ic-round-plus class="mr-4px text-20px" />
            {{ $t('page.manage.api.addApiKey') }}
          </NButton>
        </NSpace>
        <NDataTable
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
      </div>
    </n-card>
  </div>
</template>

<style scoped></style>
