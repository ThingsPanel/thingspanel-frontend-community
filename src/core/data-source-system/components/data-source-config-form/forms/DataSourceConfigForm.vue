<!--
  数据源配置表单 - 重新实现版本
  只保留数据获取部分和折叠面板实现
-->
<template>
  <div class="data-source-config-form">
    <!-- 数据源信息提示 -->
    <n-alert type="info" :show-icon="false" class="info-alert">
      <template #icon><span>💾</span></template>
      <div>
        <strong>数据源配置</strong>
        <p class="alert-description">
          为每个数据源配置数据项和处理方式。当前有 {{ dataSourceCount }} 个数据源需要配置。
        </p>
      </div>
    </n-alert>

    <!-- 数据源折叠面板 -->
    <n-collapse :default-expanded-names="defaultExpandedNames" class="data-source-collapse">
      <n-collapse-item
        v-for="dataSourceOption in dataSourceOptions"
        :key="dataSourceOption.value"
        :title="dataSourceOption.label"
        :name="dataSourceOption.value"
      >
        <template #header-extra>
          <n-tag :type="getDataSourceStatus(dataSourceOption.value)" size="small">
            {{ getDataSourceStatusText(dataSourceOption.value) }}
          </n-tag>
        </template>

        <!-- 数据源配置内容 -->
        <DataSourcePanel
          :data-source-key="dataSourceOption.value"
          :data-source-config="getCurrentDataSourceConfig(dataSourceOption.value)"
          :data-source-info="dataSourceOption"
          @update:config="handleDataSourceConfigUpdate"
        />
      </n-collapse-item>
    </n-collapse>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据源配置表单 - 重新实现版本
 * 只保留核心的数据获取和折叠面板功能
 */
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

// 导入拆分的子组件
import DataSourcePanel from '../sections/DataSourcePanel.vue'

// 类型定义
interface DataSourceConfigFormProps {
  modelValue: Record<string, any>
  dataSources: Record<string, any> | Array<any>
  componentId: string
  componentType: string
  autoSave?: boolean
  enableValidation?: boolean
}

interface DataSourceConfigFormEmits {
  'update:modelValue': [value: Record<string, any>]
}

// Props和Emits
const props = withDefaults(defineProps<DataSourceConfigFormProps>(), {
  autoSave: true,
  enableValidation: true
})

const emit = defineEmits<DataSourceConfigFormEmits>()

// 国际化
const { t } = useI18n()

// ========== 数据获取和处理 ==========

/**
 * 数据源选项计算属性 - 处理数组和对象格式
 */
const dataSourceOptions = computed(() => {
  if (!props.dataSources) return []

  // 处理数组格式的dataSources
  if (Array.isArray(props.dataSources)) {
    return props.dataSources.map((dataSource, index) => {
      const key = dataSource.key || `dataSource${index + 1}`
      return {
        label: dataSource.name || dataSource.title || `数据源${index + 1}`,
        value: key,
        description: dataSource.description || '',
        type: dataSource.type || dataSource.expectedDataFormat || 'object'
      }
    })
  }

  // 处理对象格式的dataSources
  return Object.keys(props.dataSources).map(key => {
    const dataSource = props.dataSources[key]
    return {
      label: dataSource.name || dataSource.title || key,
      value: key,
      description: dataSource.description || '',
      type: dataSource.type || 'object'
    }
  })
})

/**
 * 数据源数量
 */
const dataSourceCount = computed(() => dataSourceOptions.value.length)

/**
 * 默认展开的折叠面板
 */
const defaultExpandedNames = computed(() => {
  // 默认展开第一个数据源
  return dataSourceOptions.value.length > 0 ? [dataSourceOptions.value[0].value] : []
})

// ========== 数据源配置管理 ==========

/**
 * 获取指定数据源的当前配置
 */
const getCurrentDataSourceConfig = (dataSourceKey: string) => {
  return (
    props.modelValue?.[dataSourceKey] || {
      rawDataList: [],
      finalProcessingType: 'custom-script',
      finalProcessingScript: ''
    }
  )
}

/**
 * 获取数据源配置状态
 */
const getDataSourceStatus = (dataSourceKey: string): 'success' | 'warning' | 'error' => {
  const config = props.modelValue?.[dataSourceKey]
  if (!config) return 'error'

  const hasData = config.rawDataList && config.rawDataList.length > 0
  const hasProcessing = config.finalProcessingType && config.finalProcessingScript

  if (hasData && hasProcessing) return 'success'
  if (hasData || hasProcessing) return 'warning'
  return 'error'
}

/**
 * 获取数据源状态文本
 */
const getDataSourceStatusText = (dataSourceKey: string): string => {
  const status = getDataSourceStatus(dataSourceKey)
  switch (status) {
    case 'success':
      return '已配置'
    case 'warning':
      return '部分配置'
    case 'error':
      return '未配置'
    default:
      return '未知'
  }
}

/**
 * 处理数据源配置更新
 */
const handleDataSourceConfigUpdate = (dataSourceKey: string, config: any) => {
  const updatedModelValue = {
    ...props.modelValue,
    [dataSourceKey]: config
  }
  emit('update:modelValue', updatedModelValue)
}

// 暴露给父组件的方法
defineExpose({
  dataSourceOptions,
  getCurrentDataSourceConfig,
  getDataSourceStatus
})
</script>

<style scoped>
.data-source-config-form {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.info-alert {
  margin-bottom: 20px;
}

.alert-description {
  margin: 8px 0 0 0;
  font-size: 13px;
  line-height: 1.4;
  color: var(--text-color-2);
}

.data-source-collapse {
  margin-top: 16px;
}

/* 折叠面板样式优化 */
:deep(.n-collapse-item) {
  margin-bottom: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

:deep(.n-collapse-item__header) {
  padding: 16px 20px;
  background-color: var(--card-color);
  border-bottom: 1px solid var(--border-color);
  font-weight: 500;
}

:deep(.n-collapse-item__content) {
  padding: 20px;
  background-color: var(--body-color);
}

/* 状态标签样式 */
:deep(.n-tag) {
  font-size: 12px;
  font-weight: 500;
}

/* 主题适配 */
[data-theme='dark'] :deep(.n-collapse-item) {
  border-color: var(--border-color);
}

[data-theme='dark'] :deep(.n-collapse-item__header) {
  background-color: var(--card-color);
  border-bottom-color: var(--border-color);
}

[data-theme='dark'] :deep(.n-collapse-item__content) {
  background-color: var(--body-color);
}
</style>
