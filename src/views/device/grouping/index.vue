<script lang="tsx" setup>
import { onMounted, ref } from 'vue'
// Import UI components from Naive UI
import { useRouter } from 'vue-router'
import { NButton, NDataTable, NEmpty, NFlex, NPagination } from 'naive-ui'
import { IosSearch } from '@vicons/ionicons4'
import { debounce } from 'lodash'
import { deleteDeviceGroup, getDeviceGroup } from '@/service/api/device'
import { group_columns } from '@/views/device/modules/all-columns'
import { $t } from '@/locales'
import { AddOrEditDevices } from './components'

const the_modal = ref()
const searchValue = ref('')
const isRequestPending = ref(false)
const data = ref([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(0) // 假设总页数为 5，实际应从后端获取
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
const getDevice = async () => {
  loading.value = true
  const res = await getDeviceGroup({
    page: currentPage.value,
    page_size: 10,
    parent_id: 0
  })
  data.value = res.data.list
  totalPages.value = Math.ceil(res.data.total / 10)
  loading.value = false
}
// 使用 lodash 的 debounce 函数来延迟搜索请求的发送
const debouncedSearch = debounce(async () => {
  if (isRequestPending.value) {
    return // 如果当前有请求正在进行，则不执行新的请求
  }

  isRequestPending.value = true
  loading.value = true
  const res = await getDeviceGroup({
    page: currentPage.value,
    page_size: 10,
    parent_id: 0,
    name: searchValue.value.trim() || undefined
  })
  data.value = res.data.list
  totalPages.value = Math.ceil(res.data.total / 10)
  loading.value = false
  // eslint-disable-next-line require-atomic-updates
  isRequestPending.value = false
}, 500) // 设置延迟为 500 毫秒

// 监听输入变化并调用 debounced 函数
const handleInput = () => {
  debouncedSearch()
}
// Async function to fetch device groups from the backend
// Function to delete a device group
const deleteItem = async (rid: string) => {
  await deleteDeviceGroup({ id: rid })
  await getDevice()
}
const router = useRouter()
const viewDetails = (rid: string) => {
  router.push({ name: 'device_grouping-details', query: { id: rid } })
}
// Define columns for the data table
const columns = group_columns(viewDetails, deleteItem)
// Function to show the modal for adding or editing device groups
const showModal = () => {
  if (the_modal.value) {
    the_modal.value.showModal = true
  }
}
onMounted(getDevice) // Fetch device groups on component mount
</script>

<template>
  <div class="h-full overflow-auto">
    <!-- Add or edit device modal component with props for edit mode and data -->
    <AddOrEditDevices ref="the_modal" :is-edit="false" :refresh-data="getDevice" />
    <NCard>
      <NFlex justify="start">
        <!-- Button to trigger modal for creating a new device group -->
        <NButton type="primary" @click="showModal">{{ $t('custom.groupPage.createGroupButton') }}</NButton>
        <!-- Input for search functionality -->
        <NInput
          v-model:value="searchValue"
          :disabled="isRequestPending"
          autosize
          :placeholder="$t('custom.groupPage.deviceGroupPlaceholder')"
          class="min-w-240px"
          type="text"
          @input="handleInput"
        >
          <template #prefix>
            <NIcon>
              <IosSearch />
            </NIcon>
          </template>
        </NInput>
      </NFlex>
      <div class="mt-20px">
        <!-- Data table to display device groups -->
        <NDataTable
          class="device-data-table"
          :row-props="
            row => {
              return {
                style: 'cursor: pointer;',
                onClick: () => {
                  viewDetails(row.id)
                }
              }
            }
          "
          :scroll-x="920"
          size="medium"
          :theme-overrides="tableThemeOverrides"
          :bordered="true"
          :bottom-bordered="true"
          :single-column="false"
          :single-line="true"
          :row-key="row => row.id"
          :columns="columns"
          :data="data"
          :loading="loading"
        >
          <template #empty>
            <NEmpty size="small" :description="$t('common.noData')" />
          </template>
        </NDataTable>
        <!-- Pagination component -->
        <div class="flex flex-justify-end">
          <NPagination v-model:page="currentPage" :page-count="totalPages" class="mt-20px" @update:page="getDevice" />
        </div>
      </div>
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

  :deep(.n-data-table-td--last-col),
  :deep(.n-data-table-th--last-col) {
    padding-right: 20px;
  }
}
</style>
