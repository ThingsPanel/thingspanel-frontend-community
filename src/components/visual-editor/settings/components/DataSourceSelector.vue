<template>
  <div class="data-source-selector">
    <div v-if="componentDataSources.length > 0">
      <n-collapse :default-expanded-names="expandedNames">
        <n-collapse-item
          v-for="componentDataSource in componentDataSources"
          :key="componentDataSource.name"
          :name="componentDataSource.name"
          :title="componentDataSource.name"
        >
          <template #header-extra>
            <n-tag :type="componentDataSource.required ? 'error' : 'default'" size="tiny">
              {{ componentDataSource.required ? '必需' : '可选' }}
            </n-tag>
          </template>

          <div class="data-source-content">
            <n-form-item label="类型" label-width="50px" size="small">
              <n-select
                v-model:value="dataSourceConfigs[componentDataSource.name].type"
                :options="dataSourceTypeOptions"
                placeholder="选择类型"
                size="small"
                @update:value="updateDataSourceConfig(componentDataSource.name)"
              />
            </n-form-item>

            <div v-if="dataSourceConfigs[componentDataSource.name].type" class="config-component">
              <component
                :is="getDataSourceConfigComponent(dataSourceConfigs[componentDataSource.name].type)"
                v-model="dataSourceConfigs[componentDataSource.name].config"
                @update:modelValue="updateDataSourceConfig(componentDataSource.name)"
              />
            </div>
          </div>
        </n-collapse-item>
      </n-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NCollapse, NCollapseItem, NTag, NFormItem, NSelect } from 'naive-ui'
import { dataSourceRegistry } from '../../core/data-source-registry'
import type { DataSource, ComponentDataSourceDefinition } from '../../types/data-source'
import { DataSourceType } from '../../types/data-source'

interface Props {
  modelValue: DataSource | null
  componentDataSources: ComponentDataSourceDefinition[]
}

interface Emits {
  'update:modelValue': [value: DataSource | null]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 默认展开的数据源名称
const expandedNames = computed(() => {
  return props.componentDataSources.map(ds => ds.name)
})

// 数据源类型选项
const dataSourceTypeOptions = [
  { label: '静态数据', value: 'static' },
  { label: '设备数据', value: 'device' },
  { label: 'HTTP API', value: 'http' }
]

// 每个组件数据源的配置
const dataSourceConfigs = ref<
  Record<
    string,
    {
      type: DataSourceType
      config: any
    }
  >
>({})

// 初始化配置
const initializeConfigs = () => {
  props.componentDataSources.forEach(ds => {
    if (!dataSourceConfigs.value[ds.name]) {
      // 根据mappingKeys生成数据路径映射
      const dataPaths = ds.mappingKeys?.map(key => ({
        key: '', // 由具体的数据源配置组件设置
        target: key, // 使用mappingKeys中的键
        description: `映射到${key}`
      })) || [
        {
          key: '',
          target: ds.name, // 如果没有mappingKeys，使用数据源名称
          description: `映射到${ds.name}`
        }
      ]

      dataSourceConfigs.value[ds.name] = {
        type: DataSourceType.STATIC, // 默认使用静态数据源
        config: {
          data: {},
          dataPaths
        }
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
  const componentDataSource = props.componentDataSources.find(ds => ds.name === dataSourceName)

  if (!componentDataSource) return

  console.log('🔧 DataSourceSelector - 更新数据源配置:', {
    dataSourceName,
    config,
    componentDataSource
  })

  // 构建数据源配置
  const dataSource: DataSource = {
    type: config.type as DataSourceType,
    enabled: true,
    name: dataSourceName, // 使用组件定义的name
    description: `为${dataSourceName}提供数据`,
    ...config.config // 包含dataPaths和其他配置
  }

  console.log('🔧 DataSourceSelector - 构建的数据源:', dataSource)
  emit('update:modelValue', dataSource)
}

// 监听组件数据源变化，初始化配置
watch(
  () => props.componentDataSources,
  newDataSources => {
    if (newDataSources && newDataSources.length > 0) {
      initializeConfigs()
    }
  },
  { immediate: true }
)

// 监听外部数据源变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue) {
      // 从外部数据源更新内部配置
      console.log('🔧 DataSourceSelector - 外部数据源更新:', newValue)
    }
  },
  { deep: true }
)

onMounted(() => {
  initializeConfigs()
})
</script>

<style scoped>
.data-source-selector {
  padding: 4px;
}

.data-source-content {
  padding: 4px 0;
}

.config-component {
  margin-top: 8px;
}

:deep(.n-collapse-item__header) {
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
}

:deep(.n-collapse-item__content) {
  padding: 8px 12px;
}

:deep(.n-collapse-item__header-extra) {
  margin-left: 8px;
}
</style>
