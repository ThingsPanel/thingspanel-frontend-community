<template>
  <div class="data-source-selector">
    <n-form label-placement="left" label-width="auto" size="small">
      <n-form-item label="启用数据源">
        <n-switch 
          v-model:value="enabled" 
          @update:value="handleEnableChange"
        />
      </n-form-item>
      
      <template v-if="enabled">
        <n-form-item label="数据源类型">
          <n-select
            v-model:value="selectedType"
            :options="dataSourceTypeOptions"
            placeholder="选择数据源类型"
            @update:value="handleTypeChange"
          />
        </n-form-item>
        
        <div v-if="selectedType && selectedType !== DataSourceType.NONE" class="config-container">
          <component 
            :is="configComponent"
            v-if="configComponent"
            v-model="currentDataSource"
            @update:modelValue="handleDataSourceChange"
          />
        </div>
      </template>
    </n-form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NForm, NFormItem, NSelect, NSwitch } from 'naive-ui'
import { DataSourceType, type DataSource } from '../../types/data-source'
import { dataSourceRegistry } from '../../core/data-source-registry'
import StaticDataSourceConfig from '../data-sources/StaticDataSourceConfig.vue'
import DeviceDataSourceConfig from '../data-sources/DeviceDataSourceConfig.vue'

interface Props {
  modelValue: DataSource | null
}

interface Emits {
  'update:modelValue': [value: DataSource | null]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const enabled = ref(false)
const selectedType = ref<DataSourceType>(DataSourceType.NONE)
const currentDataSource = ref<DataSource | null>(null)

// 数据源类型选项
const dataSourceTypeOptions = [
  {
    label: '静态数据',
    value: DataSourceType.STATIC,
    description: '使用JSON格式的静态数据'
  },
  {
    label: '设备数据',
    value: DataSourceType.DEVICE,
    description: '从设备获取实时数据'
  },
  {
    label: 'HTTP请求',
    value: DataSourceType.HTTP,
    description: '通过HTTP请求获取数据'
  }
]

// 配置组件
const configComponent = computed(() => {
  if (!selectedType.value || selectedType.value === DataSourceType.NONE) {
    return null
  }
  
  const config = dataSourceRegistry.get(selectedType.value)
  return config?.component || null
})

// 处理启用状态变化
const handleEnableChange = (value: boolean) => {
  if (!value) {
    // 禁用数据源
    selectedType.value = DataSourceType.NONE
    currentDataSource.value = null
    emit('update:modelValue', null)
  } else {
    // 启用数据源，默认选择静态数据源
    selectedType.value = DataSourceType.STATIC
    handleTypeChange(DataSourceType.STATIC)
  }
}

// 处理类型变化
const handleTypeChange = (type: DataSourceType) => {
  if (type === DataSourceType.NONE) {
    currentDataSource.value = null
    emit('update:modelValue', null)
    return
  }
  
  // 创建新的数据源配置
  const config = dataSourceRegistry.get(type)
  if (config) {
    currentDataSource.value = {
      type,
      enabled: true,
      name: config.name,
      description: config.description,
      ...config.defaultConfig
    } as DataSource
  }
}

// 处理数据源配置变化
const handleDataSourceChange = (value: DataSource) => {
  currentDataSource.value = value
  emit('update:modelValue', value)
  
  // 触发重新订阅
  console.log('🔧 DataSourceSelector - 数据源配置变化:', {
    type: value.type,
    dataPath: value.dataPath,
    enabled: value.enabled
  })
}

// 监听外部变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    enabled.value = true
    selectedType.value = newValue.type
    currentDataSource.value = { ...newValue }
  } else {
    enabled.value = false
    selectedType.value = DataSourceType.NONE
    currentDataSource.value = null
  }
}, { immediate: true, deep: true })
</script>

<style scoped>
.data-source-selector {
  padding: 8px 0;
}

.config-container {
  margin-top: 16px;
  padding: 12px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background-color: #fafafa;
}
</style> 