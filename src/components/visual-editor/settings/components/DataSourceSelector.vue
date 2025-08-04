<template>
  <div class="data-source-selector">
    <!-- 只有当组件定义了数据源时才显示 -->
    <div v-if="componentDataSources.length > 0">
      <n-divider title-placement="left">数据源配置</n-divider>
      
      <!-- 为每个组件数据源显示配置 -->
      <div v-for="componentDataSource in componentDataSources" :key="componentDataSource.name" class="data-source-item">
        <n-card :title="componentDataSource.name" size="small">
          <template #header-extra>
            <n-tag :type="componentDataSource.required ? 'error' : 'default'" size="small">
              {{ componentDataSource.required ? '必需' : '可选' }}
            </n-tag>
          </template>
          
          <div class="data-source-content">
            <p class="description">{{ componentDataSource.description }}</p>
            
            <!-- 数据源类型选择 -->
            <n-form-item label="数据源类型">
              <n-select
                v-model:value="dataSourceConfigs[componentDataSource.name].type"
                :options="dataSourceTypeOptions"
                placeholder="选择数据源类型"
                @update:value="updateDataSourceConfig(componentDataSource.name)"
              />
            </n-form-item>
            
            <!-- 根据类型显示对应的配置组件 -->
            <div v-if="dataSourceConfigs[componentDataSource.name].type && dataSourceConfigs[componentDataSource.name].type !== 'none'">
              <component
                :is="getDataSourceConfigComponent(dataSourceConfigs[componentDataSource.name].type)"
                v-model="dataSourceConfigs[componentDataSource.name].config"
                @update:modelValue="updateDataSourceConfig(componentDataSource.name)"
              />
            </div>
          </div>
        </n-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NDivider, NCard, NTag, NFormItem, NSelect } from 'naive-ui'
import { dataSourceRegistry } from '../../core/data-source-registry'
import type { DataSourceType, DataSource, ComponentDataSourceDefinition } from '../../types/data-source'

interface Props {
  modelValue: DataSource | null
  componentDataSources: ComponentDataSourceDefinition[]
}

interface Emits {
  'update:modelValue': [value: DataSource | null]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 数据源类型选项
const dataSourceTypeOptions = [
  { label: '不使用数据源', value: 'none' },
  { label: '静态数据', value: 'static' },
  { label: '设备数据', value: 'device' },
  { label: 'HTTP API', value: 'http' }
]

// 每个组件数据源的配置
const dataSourceConfigs = ref<Record<string, {
  type: DataSourceType | 'none'
  config: any
}>>({})

// 初始化配置
const initializeConfigs = () => {
  props.componentDataSources.forEach(ds => {
    if (!dataSourceConfigs.value[ds.name]) {
      dataSourceConfigs.value[ds.name] = {
        type: 'none',
        config: null
      }
    }
  })
}

// 获取数据源配置组件
const getDataSourceConfigComponent = (type: DataSourceType) => {
  const configComponent = dataSourceRegistry.get(type)
  return configComponent?.component
}

// 更新数据源配置
const updateDataSourceConfig = (dataSourceName: string) => {
  const config = dataSourceConfigs.value[dataSourceName]
  
  if (config.type === 'none') {
    // 如果所有数据源都是 none，则设置为 null
    const allNone = Object.values(dataSourceConfigs.value).every(c => c.type === 'none')
    if (allNone) {
      emit('update:modelValue', null)
      return
    }
  }
  
  // 构建数据源配置
  const dataSource: DataSource = {
    type: config.type as DataSourceType,
    enabled: true,
    name: `${dataSourceName}数据源`,
    description: `为${dataSourceName}提供数据`,
    dataPaths: [{
      key: '', // 这里需要根据实际数据源来设置
      target: dataSourceName,
      description: `映射到${dataSourceName}`
    }],
    ...config.config
  }
  
  emit('update:modelValue', dataSource)
}

// 监听组件数据源定义变化
watch(() => props.componentDataSources, () => {
  initializeConfigs()
}, { immediate: true, deep: true })

// 监听外部数据源变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // 从外部数据源更新内部配置
    console.log('🔧 DataSourceSelector - 外部数据源更新:', newValue)
  }
}, { deep: true })

onMounted(() => {
  initializeConfigs()
})
</script>

<style scoped>
.data-source-selector {
  padding: 16px;
}

.data-source-item {
  margin-bottom: 16px;
}

.data-source-content {
  padding: 8px 0;
}

.description {
  color: #666;
  font-size: 12px;
  margin-bottom: 12px;
}
</style> 