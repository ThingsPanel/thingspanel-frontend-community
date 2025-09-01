<script setup lang="ts">
import { ref } from 'vue'
import { NButton, NSpace } from 'naive-ui'
import DeviceDispatchSelector from '@/components/device-selectors/DeviceDispatchSelector.vue'
import { $t } from '@/locales'

// Emits 接口
interface Emits {
  (e: 'add', params: any[]): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

// 用于存储 DeviceDispatchSelector 的选择结果
const selection = ref({
  deviceId: '',
  deviceName: '',
  dataType: '',
  metricsId: '',
  metricsName: ''
})

// 添加按钮处理函数
const handleAdd = () => {
  // 校验是否已选择完整的设备和指标信息
  if (!selection.value.deviceId || !selection.value.dataType || !selection.value.metricsId) {
    window.$message.warning($t('generate.pleaseSelectDeviceAndMetrics'))
    return
  }

  // 将选择结果转换为 DynamicParameterEditor 所需的参数格式
  const newParam = {
    id: `device:${selection.value.deviceId}:${selection.value.metricsId}`, // 使用唯一标识符
    key: selection.value.metricsId,
    value: '', // 初始值可以为空
    type: 'device', // 标记参数类型为设备
    source: {
      deviceId: selection.value.deviceId,
      deviceName: selection.value.deviceName,
      dataType: selection.value.dataType,
      metricsId: selection.value.metricsId,
      metricsName: selection.value.metricsName
    },
    isEditing: false // 默认非编辑状态
  }

  // 通过 emit 事件将新参数传递给父组件
  emit('add', [newParam])
}

// 取消按钮处理函数
const handleCancel = () => {
  emit('cancel')
}
</script>

<template>
  <div class="add-parameter-from-device">
    <div class="p-4">
      <DeviceDispatchSelector v-model:value="selection" />
    </div>
    <n-space justify="end" class="p-4 border-t">
      <n-button @click="handleCancel">{{ $t('common.cancel') }}</n-button>
      <n-button type="primary" @click="handleAdd">{{ $t('common.add') }}</n-button>
    </n-space>
  </div>
</template>

<style scoped>
.add-parameter-from-device {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.p-4 {
  padding: 16px;
}
.border-t {
  border-top: 1px solid #e5e7eb;
}
</style>
