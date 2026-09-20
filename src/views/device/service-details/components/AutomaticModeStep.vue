<template>
  <div class="automatic-mode-step-content">
    <n-data-table
      :remote="true"
      :columns="columns"
      :data="pageData.tableData"
      :loading="pageData.loading"
      :pagination="pagination"
      size="medium"
      :theme-overrides="tableThemeOverrides"
      :bottom-bordered="true"
      :single-column="false"
      :single-line="true"
      :scroll-x="720"
      :row-key="deviceConfigRowKey"
      :flex-height="true"
      :bordered="true"
    >
      <template #empty>
        <NEmpty size="small" :description="$t('common.noData')" />
      </template>
    </n-data-table>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { $t } from '@/locales'
import { NDataTable, NEmpty, useMessage } from 'naive-ui'
import { deviceConfig } from '@/service/api/device'

const message = useMessage()
const route = useRoute()

const pageData = ref({
  loading: false,
  tableData: []
})

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

const deviceConfigRowKey = (row: any) => row.id

const pagination = ref({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  pageSizes: [10, 20, 30, 40],
  showSizePicker: true,
  prefix({ itemCount }) {
    return `${$t('common.total')}: ${itemCount}`
  },
  onUpdatePage: page => {
    pagination.value.page = page
    loadDeviceConfigs()
  },
  onUpdatePageSize: pageSize => {
    pagination.value.pageSize = pageSize
    pagination.value.page = 1
    loadDeviceConfigs()
  }
})

const columns = ref([
  {
    title: $t('card.deviceTemplate'),
    key: 'name',
    align: 'center' as const
  },
  {
    title: $t('card.templateKey'),
    key: 'id',
    align: 'center' as const
  },
  {
    title: $t('card.templateSecret'),
    key: 'template_secret',
    align: 'center' as const,
    render(row) {
      return row.template_secret ? '******' : $t('card.templateNotConfigured')
    }
  }
])

const loadDeviceConfigs = async () => {
  pageData.value.loading = true
  try {
    const { data } = await deviceConfig({
      page: pagination.value.page,
      page_size: pagination.value.pageSize,
      protocol_type: route.query.service_identifier
    })

    if (data && data.list) {
      pageData.value.tableData = data.list
      pagination.value.itemCount = data.total
    } else {
      pageData.value.tableData = []
      pagination.value.itemCount = 0
    }
  } catch (error) {
    console.error($t('card.loadDeviceConfigFailed'), error)
    message.error($t('common.loadFailed'))
  } finally {
    pageData.value.loading = false
  }
}

onMounted(() => {
  loadDeviceConfigs()
})
</script>

<style scoped lang="scss">
.automatic-mode-step-content {
  padding: 20px;
  height: 100%;
}
</style>
