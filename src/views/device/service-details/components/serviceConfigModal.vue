<!-- eslint-disable require-atomic-updates -->
<script setup lang="tsx">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { NSelect } from 'naive-ui'
import { batchAddServiceMenuList, getSelectServiceMenuList, getServiceListDrop } from '@/service/api/plugin'
import { $t } from '@/locales'
import AutomaticModeStep from './AutomaticModeStep.vue'

const emit = defineEmits(['getList'])

const router = useRoute()
const service_identifier = ref<any>(router.query.service_identifier)
const serviceModal = ref<any>(false)
const isEdit = ref<any>(false)
const currentStep = ref(1)
const checkedRowKeys = ref<any>([])
const device_config_id = ref<any>('')
const NTableRef = ref<any>(null)
const form = ref<any>({
  mode: 'manual',
  name: ''
})

const pageData = ref<any>({
  loading: false,
  tableData: []
})

const queryInfo = ref<any>({
  voucher: '',
  service_type: router.query.service_type,
  page: 1,
  page_size: 10,
  total: 0,
  pageSizes: [10, 15, 20, 25, 30],
  onChange: (page: number) => {
    queryInfo.value.page = page
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getLists()
  },
  onUpdatePageSize: (pageSize: number) => {
    queryInfo.value.page_size = pageSize
    queryInfo.value.page = 1
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    getLists()
  }
})

const getLists: () => void = async () => {
  pageData.value.loading = true
  const { data }: { data: any } = await getServiceListDrop(queryInfo.value)
  pageData.value.tableData = data.list
  const params: any = {
    device_type: '',
    device_config_name: '',
    protocol_type: service_identifier.value
  }
  const { data: res }: { data: any } = await getSelectServiceMenuList(params)
  if (isEdit.value) {
    checkedRowKeys.value = pageData.value.tableData
      .filter((item: any) => item.is_bind)
      .map((item: any) => item.device_number)
  }
  pageData.value.tableData.forEach((item: any) => {
    item.options = res
  })
  queryInfo.value.itemCount = data.total
  pageData.value.loading = false
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
          options={row.options}
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
  const selectedDeviceNumbers = checkedRowKeys.value.filter(key => key)

  if (!selectedDeviceNumbers || selectedDeviceNumbers.length === 0) {
    window.$message?.warning($t('card.pleaseSelectDevice'))
    return
  }

  // 2. Frontend check for templates on *current page* checked devices
  let templateNotSetOnCurrentPage = false
  const checkedDevicesOnCurrentPageMap = new Map() // Use Map for faster lookup

  pageData.value.tableData.forEach(item => {
    // Store current page data for lookup
    checkedDevicesOnCurrentPageMap.set(item.device_number, item)
    // Check if a currently selected device on this page is missing template
    if (selectedDeviceNumbers.includes(item.device_number) && !item.device_config_id) {
      templateNotSetOnCurrentPage = true
    }
  })

  if (templateNotSetOnCurrentPage) {
    window.$message?.error($t('card.checkedDeviceTemplateNotSet') || '当前页选中的设备中有未设置模板的，请检查。')
    return
  }

  // 3. Build device_list payload, attempting to include name and config_id if available on current page
  const deviceListPayload = selectedDeviceNumbers.map(deviceNumber => {
    const rowData = checkedDevicesOnCurrentPageMap.get(deviceNumber)
    if (rowData) {
      // Device is on the current page, include all details
      return {
        device_number: rowData.device_number,
        device_name: rowData.device_name,
        device_config_id: rowData.device_config_id // This should exist due to check above
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

  console.log('Submitting params:', JSON.stringify(params, null, 2)) // Log formatted parameters

  // 4. Call API and handle result/error
  try {
    const result: any = await batchAddServiceMenuList(params)
    if (result && result.data) {
      window.$message?.success($t('common.operationSuccess'))
      serviceModal.value = false
      emit('getList')
    } else {
      // Log the actual result when API succeeds but operation fails
      console.log('API call succeeded but operation failed:', result)
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
const openModal: (val: any, row: any, edit: any) => void = async (val, row, edit) => {
  if (edit) {
    isEdit.value = edit
    queryInfo.value.voucher = val
    serviceModal.value = true
    // 检查是否为自动模式
    if (row && row.auth_type === 'auto') {
      currentStep.value = 2
      form.value = {
        mode: 'automatic', // 为了兼容AutomaticModeStep组件
        name: row.name
      }
    } else {
      // 手动模式保持不变
      currentStep.value = 1
      getLists()
      device_config_id.value = row
    }
  } else {
    queryInfo.value.voucher = val
    serviceModal.value = true
    getLists()
    device_config_id.value = row
  }
}

const close: () => void = () => {
  serviceModal.value = false
  currentStep.value = 1
}

const handleCheck = (rowKeys: any /*, rows: any, meta: any */) => {
  // 移除即时校验和 chekeds 的处理
  // checkedRowKeys.value 会由 v-model 自动更新
}

defineExpose({ openModal })
</script>

<template>
  <n-modal v-model:show="serviceModal" preset="dialog" :title="$t('card.configDevice')" class="device_model">
    <!-- 自动模式的第二步 -->
    <AutomaticModeStep v-if="currentStep === 2" :access-point-name="form.name" :mode="form.mode" />
    <!-- 手动模式或第一步 -->
    <template v-else>
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
      <div class="footer">
        <NButton type="primary" class="btn" @click="submitSevice">{{ $t('common.confirm') }}</NButton>
        <NButton @click="close">{{ $t('common.cancel') }}</NButton>
      </div>
    </template>
  </n-modal>
</template>

<style lang="scss" scoped>
.selectType {
  width: 100%;
}
.footer {
  display: flex;
  flex-direction: row-reverse;
  margin-top: 20px;
  .btn {
    margin-left: 10px;
  }
}
</style>

<style>
.device_model {
  height: 800px;
  overflow: auto;
  width: 70% !important;
}
</style>
