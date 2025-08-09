<template>
  <n-form-item label="设备选择" required>
    <n-select
      v-model:value="selectedDeviceId"
      :options="deviceOptions"
      placeholder="请选择设备"
      filterable
      :loading="loading"
      @update:value="onDeviceSelect"
    />
  </n-form-item>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { NFormItem, NSelect } from 'naive-ui'
import { deviceListForPanel } from '@/service/api/panel'

interface Props {
  modelValue?: string
  deviceName?: string
}

interface Emits {
  'update:modelValue': [value: string]
  'update:deviceName': [value: string]
  'device-change': [deviceInfo: { id: string; name: string }]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const loading = ref(false)
const deviceList = ref<any[]>([])
const selectedDeviceId = ref(props.modelValue || '')

// 设备选项
const deviceOptions = computed(() => {
  return deviceList.value.map(device => ({
    label: device.name,
    value: device.id,
    name: device.name
  }))
})

// 获取设备列表
const getDeviceList = async () => {
  try {
    loading.value = true
    const response = await deviceListForPanel({ page: 1, page_size: 1000 })
    if (response && response.data) {
      deviceList.value = response.data.list || response.data || []
      console.log('🔧 DeviceSelector - 设备列表获取成功:', deviceList.value.length)
    }
  } catch (error) {
    console.error('设备列表获取失败:', error)
    deviceList.value = []
  } finally {
    loading.value = false
  }
}

// 设备选择处理
const onDeviceSelect = (deviceId: string, option: any) => {
  console.log('🔧 DeviceSelector - 设备选择:', deviceId, option)

  const selectedDevice = deviceList.value.find(device => device.id === deviceId)
  const deviceName = selectedDevice?.name || option?.name || ''

  emit('update:modelValue', deviceId)
  emit('update:deviceName', deviceName)
  emit('device-change', { id: deviceId, name: deviceName })
}

// 组件挂载时获取设备列表
onMounted(() => {
  getDeviceList()
})

// 监听外部modelValue变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue !== selectedDeviceId.value) {
      selectedDeviceId.value = newValue || ''
    }
  },
  { immediate: true }
)
</script>
