<template>
  <div class="multi-data-test-config">
    <n-form label-placement="left" label-width="80px" size="small">
      <n-form-item label="标题">
        <n-input
          v-model:value="config.title"
          placeholder="显示标题"
          @update:value="updateConfig"
        />
      </n-form-item>
      
      <n-form-item label="颜色">
        <n-input
          v-model:value="config.color"
          placeholder="显示颜色"
          @update:value="updateConfig"
        />
      </n-form-item>
      
      <n-form-item label="字体大小">
        <n-input-number
          v-model:value="config.fontSize"
          :min="12"
          :max="32"
          placeholder="字体大小"
          @update:value="updateConfig"
        />
      </n-form-item>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NForm, NFormItem, NInput, NInputNumber } from 'naive-ui'

interface Props {
  modelValue: {
    title?: string
    color?: string
    fontSize?: number
  }
}

interface Emits {
  'update:modelValue': [value: Props['modelValue']]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const config = ref({
  title: props.modelValue?.title || '多数据测试',
  color: props.modelValue?.color || '#1890ff',
  fontSize: props.modelValue?.fontSize || 16
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
  padding: 8px;
}
</style> 