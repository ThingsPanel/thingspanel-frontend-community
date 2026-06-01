<!-- eslint-disable require-atomic-updates -->
<script setup lang="tsx">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { NAlert, NSelect } from 'naive-ui'
import { batchAddServiceMenuList, getSelectServiceMenuList, getServiceListDrop } from '@/service/api/plugin'
import { deviceConfigMenu } from '@/service/api/device'
import { $t } from '@/locales'

const emit = defineEmits(['getList', 'go-back'])

const router = useRoute()
const service_identifier = ref<any>(router.query.service_identifier)
const serviceModal = ref<any>(false)
const isEdit = ref<any>(false)
const checkedRowKeys = ref<any>([])
const selectedDeviceDrafts = ref<Map<string, any>>(new Map())
const boundDeviceKeys = ref<Set<string>>(new Set())
const device_config_id = ref<any>('')
const NTableRef = ref<any>(null)
const accessPointContext = ref<{
  voucher: string
  row: any
  edit: boolean
} | null>(null)

const pageData = ref<any>({
  loading: false,
  tableData: []
})

const normalizeTemplateOptions = (options: unknown) => {
  if (!Array.isArray(options)) return []
  return options.filter((option: any) => option && typeof option === 'object' && option.id && option.name)
}

const modalTitle = computed(() => {
  const accessPointName = accessPointContext.value?.row?.name
  if (accessPointName) {
    return `配置 ${accessPointName} 接入点的设备`
  }
  return '配置接入点设备'
})

const queryInfo = ref<any>({
  voucher: '',
  service_type: router.query.service_type,
  page: 1,
  pageSize: 10,
  total: 0,
  itemCount: 0,
  pageSizes: [10, 15, 20, 25, 30],
  showSizePicker: true,
  prefix({ itemCount }) {
    return `${$t('common.total')}: ${itemCount}`
  },
  onUpdatePage: (page: number) => {
    queryInfo.value.page = page
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getLists()
  },
  onUpdatePageSize: (pageSize: number) => {
    queryInfo.value.pageSize = pageSize
    queryInfo.value.page = 1
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getLists()
  }
})

const getLists: () => void = async () => {
  pageData.value.loading = true
  try {
    // Fetch device list and config templates in parallel so tableData is
    // only written once — with options already populated. This prevents
    // NSelect from rendering with undefined options between the two awaits,
    // which caused `createValOptMap` null-pointer crashes on page change.
    const [{ data }, { data: res }] = await Promise.all([
      getServiceListDrop({
        voucher: queryInfo.value.voucher,
        service_type: queryInfo.value.service_type,
        page: queryInfo.value.page,
        page_size: queryInfo.value.pageSize
      }),
      (async () => {
        const protocolScoped = await getSelectServiceMenuList({
          device_type: '',
          device_config_name: '',
          protocol_type: service_identifier.value
        })
        const protocolScopedOptions = normalizeTemplateOptions(protocolScoped?.data)
        if (protocolScopedOptions.length > 0) {
          return { data: protocolScopedOptions }
        }
        const fallback = await deviceConfigMenu({
          name: ''
        })
        return { data: normalizeTemplateOptions(fallback?.data) }
      })()
    ])

    const list: any[] = Array.isArray(data?.list) ? data.list : []
    const options = normalizeTemplateOptions(res)

    list.forEach((item: any) => {
      item.options = options
      if (item.is_bind) {
        boundDeviceKeys.value.add(item.device_number)
        selectedDeviceDrafts.value.set(item.device_number, { ...item })
      }
      const cached = selectedDeviceDrafts.value.get(item.device_number)
      if (cached) {
        if (cached.device_config_id) {
          item.device_config_id = cached.device_config_id
        }
        selectedDeviceDrafts.value.set(item.device_number, { ...cached, ...item })
      }
    })

    // Single atomic write — Vue triggers one re-render with complete data.
    pageData.value.tableData = list
    checkedRowKeys.value = Array.from(
      new Set([...boundDeviceKeys.value, ...checkedRowKeys.value, ...selectedDeviceDrafts.value.keys()])
    )
    queryInfo.value.itemCount = Number(data?.total || 0)
    queryInfo.value.total = Number(data?.total || 0)
  } catch (error: any) {
    pageData.value.tableData = []
    queryInfo.value.itemCount = 0
    queryInfo.value.total = 0
    const message =
      error?.response?.data?.message || error?.message || '获取三方设备列表失败，请检查接入点配置或上游连接'
    window.$message?.error(message)
  } finally {
    pageData.value.loading = false
  }
}

const columns: any = ref([
  {
    type: 'selection',
    disabled(row: any) {
      return row.is_bind
    }
  },
  {
    title: $t('generate.device-name'),
    key: 'device_name',
    minWidth: '200px'
  },
  {
    title: $t('generate.device-number'),
    key: 'device_number',
    minWidth: '400px'
  },
  {
    title: $t('card.deviceConfigTemplate'),
    key: 'create_at',
    render: row => {
      return (
        <NSelect
          v-model:value={row.device_config_id}
          label-field={'name'}
          value-field={'id'}
          placeholder={$t('card.chooseDeviceType')}
          options={normalizeTemplateOptions(row.options)}
          clearable
          onUpdateValue={value => {
            row.device_config_id = value
            const cached = selectedDeviceDrafts.value.get(row.device_number)
            if (cached) {
              selectedDeviceDrafts.value.set(row.device_number, { ...cached, device_config_id: value })
            } else if (row.is_bind || checkedRowKeys.value.includes(row.device_number)) {
              selectedDeviceDrafts.value.set(row.device_number, { ...row, device_config_id: value })
            }
          }}
        />
      )
    }
  }
])
const submitSevice: () => void = async () => {
  // 0. Check service_access_id
  if (!device_config_id.value) {
    window.$message?.error($t('card.serviceAccessIdNotSet') || '服务访问ID未设置，无法提交')
    return
  }

  // 1. Get all selected device numbers
  const selectedDeviceNumbers = checkedRowKeys.value.filter(
    key => key && !boundDeviceKeys.value.has(String(key))
  )

  if (!selectedDeviceNumbers || selectedDeviceNumbers.length === 0) {
    window.$message?.success('接入点配置已保存')
    serviceModal.value = false
    emit('getList')
    return
  }

  const checkedDevicesOnCurrentPageMap = new Map() // Use Map for faster lookup

  pageData.value.tableData.forEach(item => {
    // Store current page data for lookup
    checkedDevicesOnCurrentPageMap.set(item.device_number, item)
  })

  // 3. Build device_list payload, attempting to include name and config_id if available on current page
  const deviceListPayload = selectedDeviceNumbers.map(deviceNumber => {
    const rowData = checkedDevicesOnCurrentPageMap.get(deviceNumber) || selectedDeviceDrafts.value.get(deviceNumber)
    if (rowData) {
      // Device is on the current page, include all details
      return {
        device_number: rowData.device_number,
        device_name: rowData.device_name,
        description: rowData.description,
        device_config_id: rowData.device_config_id || undefined,
        protocol_config: safeParseJSON(rowData.protocol_config),
        additional_info: safeParseJSON(rowData.additional_info)
      }
    } else {
      // Device was selected on another page, only send number
      // Backend MUST handle this case (missing name/config_id)
      return {
        device_number: deviceNumber
        // device_name: null, // Or omit entirely
        // device_config_id: null // Or omit entirely
      }
    }
  })

  const params = {
    service_access_id: device_config_id.value,
    device_list: deviceListPayload
  }

  // 4. Call API and handle result/error
  try {
    const result: any = await batchAddServiceMenuList(params)
    if (result && result.data) {
      window.$message?.success($t('common.operationSuccess'))
      serviceModal.value = false
      emit('getList')
    } else {
      // Only show error if a specific message is available from the result
      if (result?.message) {
        window.$message?.error(result.message)
      }
      // If no specific message, do nothing (suppress common.operationFailed)
    }
  } catch (error: any) {
    console.error('Error submitting service config:', error) // Keep this log

    // Attempt to get a specific error message
    let errorMessage = '' // Initialize as empty
    if (error?.response?.data?.message) {
      errorMessage = error.response.data.message
    } else if (error?.message) {
      errorMessage = error.message
    } else {
      // Fallback to template error if available, otherwise leave empty
      errorMessage = $t('card.someDevicesNotSetTemplate') // Use template error as primary fallback
      if (!errorMessage) {
        // If even template error key doesn't exist, truly empty
        errorMessage = ''
      }
    }

    // Only show error message if we found a specific one or the template fallback
    if (errorMessage) {
      window.$message?.error(errorMessage)
    }
    // If errorMessage is still empty, do nothing (suppress common.operationFailed)
  }
}
const openModal = async (val: any, row: any, edit: any) => {
  selectedDeviceDrafts.value = new Map()
  boundDeviceKeys.value = new Set()
  checkedRowKeys.value = []
  queryInfo.value.page = 1
  accessPointContext.value = {
    voucher: val,
    row,
    edit: !!edit
  }
  if (edit) {
    isEdit.value = edit
    queryInfo.value.voucher = val
    serviceModal.value = true
    getLists()
    device_config_id.value = row?.id || row
  } else {
    queryInfo.value.voucher = val
    serviceModal.value = true
    getLists()
    device_config_id.value = row?.id || row
  }
}

const close: () => void = () => {
  serviceModal.value = false
  isEdit.value = false
  checkedRowKeys.value = []
  selectedDeviceDrafts.value = new Map()
  boundDeviceKeys.value = new Set()
  pageData.value.tableData = []
  accessPointContext.value = null
}

const backToAccessPointConfig = () => {
  const context = accessPointContext.value
  serviceModal.value = false
  if (!context) return
  emit('go-back', {
    ...context.row,
    voucher: context.voucher
  })
}

const handleCheck = (rowKeys: any /*, rows: any, meta: any */) => {
  const selected = new Set<string>(Array.isArray(rowKeys) ? rowKeys : [])
  pageData.value.tableData.forEach((row: any) => {
    if (row.is_bind) {
      boundDeviceKeys.value.add(row.device_number)
      selectedDeviceDrafts.value.set(row.device_number, { ...row })
      return
    }
    if (selected.has(row.device_number)) {
      selectedDeviceDrafts.value.set(row.device_number, { ...row })
    } else {
      selectedDeviceDrafts.value.delete(row.device_number)
    }
  })
  checkedRowKeys.value = Array.from(new Set([...boundDeviceKeys.value, ...selectedDeviceDrafts.value.keys()]))
}

defineExpose({ openModal })

const safeParseJSON = (value: any) => {
  if (!value || typeof value !== 'string') return undefined
  try {
    return JSON.parse(value)
  } catch {
    return undefined
  }
}
</script>

<template>
  <n-modal v-model:show="serviceModal" preset="dialog" :title="modalTitle" class="device_model">
    <div class="service-config-shell">
      <NAlert type="info" class="mb-12px">
        设备模板现在是可选的。不选模板也可以绑定设备并查看原始遥测数据；选择模板后会带出中文名称、单位、图表和自定义面板。
      </NAlert>
      <div class="table-area">
        <NDataTable
          ref="NTableRef"
          v-model:checked-row-keys="checkedRowKeys"
          :remote="true"
          :columns="columns"
          :data="pageData.tableData"
          :loading="pageData.loading"
          :pagination="queryInfo"
          :row-key="row => row.device_number"
          class="flex-1-hidden"
          @update:checked-row-keys="handleCheck"
        />
      </div>
      <div class="footer">
        <NButton type="primary" class="btn" @click="submitSevice">{{ $t('common.confirm') }}</NButton>
        <NButton v-if="isEdit" @click="backToAccessPointConfig">上一步</NButton>
        <NButton @click="close">{{ $t('common.cancel') }}</NButton>
      </div>
    </div>
  </n-modal>
</template>

<style lang="scss" scoped>
.service-config-shell {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 220px);
  min-height: 0;
}

.table-area {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.selectType {
  width: 100%;
}
.footer {
  display: flex;
  flex-direction: row-reverse;
  gap: 10px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--n-border-color);
  background: var(--n-color);
  position: sticky;
  bottom: 0;
  z-index: 1;
  .btn {
    margin-left: 0;
  }
}
</style>

<style>
.device_model {
  width: 70% !important;
}

.device_model .n-dialog {
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
}

.device_model .n-dialog__content {
  overflow: hidden;
}
</style>
