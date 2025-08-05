<template>
  <n-form-item label="API接口类型" required>
    <n-select
      v-model:value="selectedApiType"
      :options="apiTypeOptions"
      placeholder="请选择API接口类型"
      @update:value="onApiTypeSelect"
    >
      <template #header>
        <div class="api-selector-header">
          <span class="header-title">选择需要使用的设备API接口</span>
        </div>
      </template>
      <template #option="{ option }">
        <div class="api-option">
          <div class="api-info">
            <span class="api-name">{{ option.label }}</span>
            <span class="api-complexity">{{ option.complexity }}</span>
          </div>
          <div class="api-description">{{ option.description }}</div>
          <div class="api-parameters">
            <span class="param-label">参数：</span>
            <span class="param-list">{{ option.parametersText }}</span>
          </div>
        </div>
      </template>
    </n-select>
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
  'api-change': [apiType: string]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedApiType = ref(props.modelValue || '')

// API接口类型选项（基于chart-card中的实际使用）
const apiTypeOptions = [
  // 简单接口（2个参数）
  {
    label: '遥测当前值',
    value: 'telemetryDataCurrentKeys',
    description: '获取设备遥测数据的当前值',
    complexity: '简单',
    category: 'read',
    parametersText: 'device_id, keys',
    parameters: ['device_id', 'keys']
  },
  {
    label: '指定属性值',
    value: 'getAttributeDatasKey',
    description: '获取设备指定属性的值',
    complexity: '简单',
    category: 'read',
    parametersText: 'device_id, key',
    parameters: ['device_id', 'key']
  },

  // 中等接口（1个参数）
  {
    label: '属性数据集',
    value: 'getAttributeDataSet',
    description: '获取设备所有属性数据',
    complexity: '中等',
    category: 'read',
    parametersText: 'device_id',
    parameters: ['device_id']
  },

  // 复杂接口（5个参数）
  {
    label: '遥测历史数据',
    value: 'telemetryDataHistoryList',
    description: '获取设备遥测数据的历史记录（最复杂）',
    complexity: '复杂',
    category: 'read',
    parametersText: 'device_id, key, time_range, aggregate_function, aggregate_window',
    parameters: ['device_id', 'key', 'time_range', 'aggregate_function', 'aggregate_window']
  },

  // 发送接口（3个参数）
  {
    label: '发送遥测数据',
    value: 'telemetryDataPub',
    description: '向设备发送遥测数据',
    complexity: '发送',
    category: 'write',
    parametersText: 'device_id, key, value',
    parameters: ['device_id', 'key', 'value']
  },
  {
    label: '发送属性数据',
    value: 'attributeDataPub',
    description: '向设备发送属性数据',
    complexity: '发送',
    category: 'write',
    parametersText: 'device_id, key, value',
    parameters: ['device_id', 'key', 'value']
  },
  {
    label: '发送命令数据',
    value: 'commandDataPub',
    description: '向设备发送命令',
    complexity: '发送',
    category: 'write',
    parametersText: 'device_id, key, value',
    parameters: ['device_id', 'key', 'value']
  }
]

// API类型选择处理
const onApiTypeSelect = (apiType: string) => {
  console.log('🔧 ApiTypeSelector - API类型选择:', apiType)

  const selectedOption = apiTypeOptions.find(option => option.value === apiType)
  if (selectedOption) {
    console.log('🔧 ApiTypeSelector - 选择的API详情:', selectedOption)
  }

  emit('update:modelValue', apiType)
  emit('api-change', apiType)
}

// 监听外部modelValue变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && newValue !== selectedApiType.value) {
      selectedApiType.value = newValue
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.api-selector-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  background: #fafafa;
}

.header-title {
  font-weight: 500;
  color: #333;
}

.api-option {
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.api-option:last-child {
  border-bottom: none;
}

.api-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.api-name {
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.api-complexity {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 12px;
  background: #f0f9ff;
  color: #0369a1;
}

.api-complexity[data-complexity='复杂'] {
  background: #fef3c7;
  color: #d97706;
}

.api-complexity[data-complexity='发送'] {
  background: #fee2e2;
  color: #dc2626;
}

.api-description {
  color: #666;
  font-size: 13px;
  margin-bottom: 6px;
}

.api-parameters {
  display: flex;
  align-items: center;
  gap: 4px;
}

.param-label {
  font-size: 12px;
  color: #888;
  font-weight: 500;
}

.param-list {
  font-size: 12px;
  color: #0369a1;
  font-family: 'Courier New', monospace;
  background: #f8fafc;
  padding: 2px 6px;
  border-radius: 3px;
}
</style>
