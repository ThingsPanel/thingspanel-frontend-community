<template>
  <div class="automatic-mode-step-content">
    <n-data-table
      :remote="true"
      :columns="columns"
      :data="pageData.tableData"
      :loading="pageData.loading"
      :pagination="pagination"
      :bordered="true"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { $t } from '@/locales'
import { NDataTable, useMessage } from 'naive-ui'
import { deviceConfig } from '@/service/api/device'

const message = useMessage()
const route = useRoute()

const pageData = ref({
  loading: false,
  tableData: []
})

const pagination = ref({
  page: 1,
  pageSize: 10,
  itemCount: 0,
  pageSizes: [10, 20, 30, 40],
  showSizePicker: true,
  prefix({ itemCount }) {
    return `${$t('common.total')}: ${itemCount}`
  },
  onChange: page => {
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
