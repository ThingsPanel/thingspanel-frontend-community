<script setup lang="ts">
/**
 * 简化版设备参数添加组件
 * 使用最简单的表单而不是复杂的设备选择器
 */
import { ref } from 'vue'
import { NButton, NSpace, NInput, NFormItem, NForm, NText } from 'naive-ui'
import { $t } from '@/locales'

// Emits 接口
interface Emits {
  (e: 'add', params: any[]): void
  (e: 'cancel'): void
}

const emit = defineEmits<Emits>()

// 简化的表单数据
const formData = ref({
  paramKey: '',
  paramValue: '',
  deviceName: ''
})

// 添加按钮处理函数
const handleAdd = () => {
  // 简单校验
  if (!formData.value.paramKey.trim()) {
    window.$message?.warning('请输入参数名')
    return
  }

  // 创建简单的参数对象
  const newParam = {
    key: formData.value.paramKey.trim(),
    value: formData.value.paramValue.trim() || `{${formData.value.paramKey.trim()}}`,
    type: 'device',
    source: {
      deviceName: formData.value.deviceName.trim() || '设备',
      paramKey: formData.value.paramKey.trim()
    }
  }

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
      <n-text depth="3" style="margin-bottom: 16px; display: block">简化版设备参数添加 - 直接输入参数信息</n-text>

      <n-form size="small" label-placement="left" label-width="80">
        <n-form-item label="参数名" required>
          <n-input v-model:value="formData.paramKey" placeholder="如: deviceId, temperature 等" clearable />
        </n-form-item>

        <n-form-item label="参数值">
          <n-input v-model:value="formData.paramValue" placeholder="留空将自动生成 {参数名} 格式" clearable />
        </n-form-item>

        <n-form-item label="设备名">
          <n-input v-model:value="formData.deviceName" placeholder="可选，用于描述" clearable />
        </n-form-item>
      </n-form>
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