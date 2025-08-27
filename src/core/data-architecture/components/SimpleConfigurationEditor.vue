<!--
  简易配置系统 - 替代复杂UI组件的轻量级配置编辑器
  实现可视化数据源配置，支持JSON/HTTP/Script三种类型
-->
<script setup lang="ts">
/**
 * SimpleConfigurationEditor - 简易配置编辑器
 * 基于SUBTASK-010要求，实现轻量级可视化配置界面
 */

import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { 
  createExecutorChain,
  type DataSourceConfiguration,
  type DataSource,
  type DataItem
} from '../index'

// Props接口 - 匹配现有系统
interface Props {
  /** v-model绑定的配置数据 */
  modelValue: Record<string, any>
  /** 从组件定义获取的数据源需求 */
  dataSources: Record<string, any> | Array<any>
  /** 组件ID */
  componentId: string
  /** 组件类型 */
  componentType: string
  /** 选中的组件ID */
  selectedWidgetId?: string
}

// Emits接口
interface Emits {
  (e: 'update:modelValue', value: Record<string, any>): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  dataSources: () => ([])
})

const emit = defineEmits<Emits>()

// 国际化
const { t } = useI18n()

/**
 * 处理数据源选项 - 兼容数组和对象格式
 */
const dataSourceOptions = computed(() => {
  if (!props.dataSources) return []

  // 处理数组格式
  if (Array.isArray(props.dataSources)) {
    return props.dataSources.map((dataSource, index) => {
      const key = dataSource.key || `dataSource${index + 1}`
      return {
        label: dataSource.name || dataSource.title || `数据源${index + 1}`,
        value: key,
        description: dataSource.description || '',
        type: dataSource.type || dataSource.expectedDataFormat || 'object',
        originalData: dataSource
      }
    })
  }

  // 处理对象格式
  return Object.entries(props.dataSources).map(([key, dataSource]) => ({
    label: dataSource.name || dataSource.title || key,
    value: key,
    description: dataSource.description || '',
    type: dataSource.type || dataSource.expectedDataFormat || 'object',
    originalData: dataSource
  }))
})

/**
 * 获取指定数据源的当前配置
 */
const getCurrentDataSourceConfig = (dataSourceKey: string) => {
  return props.modelValue?.[dataSourceKey] || {
    rawDataList: [],
    finalProcessingType: 'custom-script',
    finalProcessingScript: 'return data'
  }
}

/**
 * 数据源配置状态
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
 * 数据源状态文本
 */
const getDataSourceStatusText = (dataSourceKey: string): string => {
  const status = getDataSourceStatus(dataSourceKey)
  switch (status) {
    case 'success': return '已配置'
    case 'warning': return '部分配置'
    case 'error': return '未配置'
    default: return '未知'
  }
}

/**
 * 处理配置更新
 */
const handleConfigUpdate = (dataSourceKey: string, configJson: string) => {
  try {
    const config = JSON.parse(configJson)
    const updatedModelValue = {
      ...props.modelValue,
      [dataSourceKey]: config
    }
    emit('update:modelValue', updatedModelValue)
  } catch (error) {
    $message.error('JSON格式错误: ' + error.message)
  }
}

// 暴露方法给父组件
defineExpose({
  getCurrentConfig: () => props.modelValue
})

</script>

<template>
  <div class="simple-configuration-editor">
    <!-- 数据源信息提示 -->
    <n-alert type="info" :show-icon="false" class="info-alert" style="margin-bottom: 16px;">
      <template #icon><span>💾</span></template>
      <div>
        <strong>简易数据源配置</strong>
        <p class="alert-description">
          为每个数据源配置数据项和处理方式。当前有 {{ dataSourceOptions.length }} 个数据源需要配置。
        </p>
      </div>
    </n-alert>

    <!-- 数据源折叠面板 -->
    <n-collapse 
      :default-expanded-names="dataSourceOptions.length > 0 ? [dataSourceOptions[0].value] : []" 
      class="data-source-collapse"
    >
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

        <!-- 数据源配置内容 - 简单输入框版本 -->
        <div class="simple-data-source-panel">
          <n-space vertical :size="12">
            
            <!-- 数据源信息显示 -->
            <n-descriptions size="small" :column="2" bordered>
              <n-descriptions-item label="数据源Key">
                {{ dataSourceOption.value }}
              </n-descriptions-item>
              <n-descriptions-item label="数据类型">
                {{ dataSourceOption.type }}
              </n-descriptions-item>
              <n-descriptions-item label="描述" :span="2">
                {{ dataSourceOption.description || '暂无描述' }}
              </n-descriptions-item>
            </n-descriptions>

            <!-- 简单配置输入框 -->
            <n-card title="配置数据" size="small" embedded>
              <n-form label-placement="left" label-width="120px" size="small">
                <n-form-item label="配置内容">
                  <n-input 
                    :value="JSON.stringify(getCurrentDataSourceConfig(dataSourceOption.value), null, 2)"
                    @update:value="(value) => handleConfigUpdate(dataSourceOption.value, value)"
                    type="textarea"
                    :rows="6"
                    placeholder="输入JSON格式的配置数据"
                    show-count
                  />
                </n-form-item>
              </n-form>
            </n-card>

          </n-space>
        </div>
      </n-collapse-item>
    </n-collapse>
    
    <!-- 空状态提示 -->
    <n-empty 
      v-if="dataSourceOptions.length === 0"
      description="没有可配置的数据源"
      size="small"
      style="margin: 40px 0;"
    />
  </div>
</template>

<style scoped>
.simple-configuration-editor {
  width: 100%;
}

.info-alert .alert-description {
  margin: 8px 0 0 0;
  font-size: 13px;
  opacity: 0.8;
}

.data-source-collapse {
  border-radius: 6px;
}

.simple-data-source-panel {
  padding: 4px 0;
}
</style>