<template>
  <div class="medium-parameter-form">
    <n-alert type="info" show-icon>这是中等复杂度表单，只需要1个参数：设备ID</n-alert>

    <!-- 设备选择 -->
    <n-form-item label="设备" required>
      <n-select
        v-model:value="parameters.device_id"
        :options="deviceOptions"
        placeholder="请选择设备"
        filterable
        :loading="deviceLoading"
        @update:value="onDeviceChange"
      />
      <template #feedback>
        <div class="field-tip">
          {{ props.apiType === 'getAttributeDataSet' ? '获取设备的所有属性数据' : '选择要操作的设备' }}
        </div>
      </template>
    </n-form-item>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NFormItem, NSelect, NAlert } from 'naive-ui'
import { deviceListForPanel } from '@/service/api/panel'

interface Props {
  apiType?: string
  modelValue?: Record<string, any>
}

interface Emits {
  'update:modelValue': [value: Record<string, any>]
  'parameters-change': [parameters: Record<string, any>]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const parameters = ref<Record<string, any>>(props.modelValue || {})
const deviceLoading = ref(false)
const deviceList = ref<any[]>([])

// 设备选项
const deviceOptions = computed(() => {
  return deviceList.value.map(device => ({
    label: device.name,
    value: device.id
  }))
})

// 获取设备列表
const getDeviceList = async () => {
  try {
    deviceLoading.value = true
    const response = await deviceListForPanel({ page: 1, page_size: 1000 })
    if (response && response.data) {
      deviceList.value = response.data.list || response.data || []
      console.log('🔧 MediumParameterForm - 设备列表获取成功:', deviceList.value.length)
    }
  } catch (error) {
    console.error('设备列表获取失败:', error)
    deviceList.value = []
  } finally {
    deviceLoading.value = false
  }
}

// 设备变化处理
const onDeviceChange = (deviceId: string) => {
  console.log('🔧 MediumParameterForm - 设备变化:', deviceId)
  emitChange()
}

// 发出变化事件
const emitChange = () => {
  emit('update:modelValue', { ...parameters.value })
  emit('parameters-change', { ...parameters.value })
}

// 监听外部modelValue变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      parameters.value = { ...newValue }
    }
  },
  { deep: true, immediate: true }
)

// 组件挂载时获取设备列表
onMounted(() => {
  getDeviceList()
})
</script>

<style scoped>
.medium-parameter-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-tip {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}
</style>
