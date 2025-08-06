<template>
  <n-form-item label="数据类型" required>
    <n-select
      v-model:value="selectedDataType"
      :options="dataTypeOptions"
      placeholder="请选择数据类型"
      @update:value="onDataTypeSelect"
    />
  </n-form-item>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NFormItem, NSelect } from 'naive-ui'

interface Props {
  modelValue?: string
}

interface Emits {
  'update:modelValue': [value: string]
  'data-type-change': [dataType: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedDataType = ref(props.modelValue || 'telemetry')

// 数据类型选项
const dataTypeOptions = [
  { label: '遥测数据', value: 'telemetry', description: '设备传感器数据，支持历史查询' },
  { label: '属性数据', value: 'attributes', description: '设备属性配置数据' },
  { label: '事件数据', value: 'event', description: '设备事件记录' },
  { label: '命令数据', value: 'command', description: '设备命令执行记录' }
]

// 数据类型选择处理
const onDataTypeSelect = (dataType: string) => {
  console.log('🔧 DataTypeSelector - 数据类型选择:', dataType)

  emit('update:modelValue', dataType)
  emit('data-type-change', dataType)
}

// 监听外部modelValue变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && newValue !== selectedDataType.value) {
      selectedDataType.value = newValue
    }
  },
  { immediate: true }
)
</script>
