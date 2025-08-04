<template>
  <div class="multi-data-test-config">
    <n-form :model="config" label-placement="left" label-width="auto">
      <n-form-item label="标题">
        <n-input
          v-model:value="config.title"
          placeholder="请输入标题"
          @update:value="updateConfig"
        />
      </n-form-item>
      
      <n-form-item label="颜色">
        <n-color-picker
          v-model:value="config.color"
          @update:value="updateConfig"
        />
      </n-form-item>
      
      <n-form-item label="字体大小">
        <n-input-number
          v-model:value="config.fontSize"
          :min="12"
          :max="48"
          placeholder="字体大小"
          @update:value="updateConfig"
        />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NForm, NFormItem, NInput, NColorPicker, NInputNumber } from 'naive-ui'

interface Props {
  modelValue: {
    title?: string
    color?: string
    fontSize?: number
  }
}

interface Emits {
  'update:modelValue': [value: any]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const config = ref({
  title: '多数据测试',
  color: '#1890ff',
  fontSize: 16,
  ...props.modelValue
})

const updateConfig = () => {
  emit('update:modelValue', { ...config.value })
}

watch(() => props.modelValue, (newValue) => {
  config.value = { ...config.value, ...newValue }
}, { deep: true })
</script>

<style scoped>
.multi-data-test-config {
  padding: 16px;
}
</style> 