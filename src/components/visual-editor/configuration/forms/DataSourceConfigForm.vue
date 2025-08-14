<template>
  <div class="data-source-config-form">
    <n-collapse :default-expanded-names="defaultExpandedNames" accordion>
      <n-collapse-item
        v-for="dataSource in dataSources"
        :key="dataSource.key"
        :title="dataSource.label || dataSource.key"
        :name="dataSource.key"
      >
        <template #header-extra>
          <n-space size="small">
            <!-- 数据源类型切换 -->
            <n-tag
              :type="dataSourceTypes[dataSource.key] === 'json' ? 'primary' : 'default'"
              size="small"
              style="cursor: pointer"
              @click.stop="switchDataSourceType(dataSource.key, 'json')"
            >
              JSON
            </n-tag>
            <n-tag
              :type="dataSourceTypes[dataSource.key] === 'http' ? 'primary' : 'default'"
              size="small"
              style="cursor: pointer"
              @click.stop="switchDataSourceType(dataSource.key, 'http')"
            >
              HTTP
            </n-tag>
          </n-space>
        </template>

        <!-- 数据源配置内容 -->
        <div class="data-source-content">
          <!-- JSON 数据配置 -->
          <div v-if="dataSourceTypes[dataSource.key] === 'json'" class="json-config">
            <n-form-item>
              <template #label>
                <n-space size="small" align="center">
                  <span>{{ dataSource.label }} 数据</span>
                  <n-tooltip>
                    <template #trigger>
                      <n-icon size="14" style="color: var(--text-color-3); cursor: help">
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                          <path
                            d="m9,9a3,3 0 1,1 6,0c0,2 -3,3 -3,3"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                          <path
                            d="m12,17.02v.01"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          />
                        </svg>
                      </n-icon>
                    </template>
                    <div style="max-width: 200px; font-size: 12px">
                      <div>
                        <strong>数据传递:</strong>
                        JSON数据 → 组件
                        <code>{{ dataSource.key }}</code>
                        属性
                      </div>
                      <div style="margin-top: 4px">
                        <strong>格式建议:</strong>
                        {{ getFormatTip(dataSource.key) }}
                      </div>
                    </div>
                  </n-tooltip>
                </n-space>
              </template>
              <n-input
                :value="getJsonValue(dataSource.key)"
                type="textarea"
                placeholder="请输入JSON格式数据"
                :rows="6"
                @update:value="value => updateJsonValue(dataSource.key, value)"
              />
            </n-form-item>
            <n-space size="small">
              <n-button size="tiny" @click="formatJsonValue(dataSource.key)">格式化</n-button>
              <n-button size="tiny" @click="loadSampleData(dataSource.key)">示例数据</n-button>
            </n-space>
            
            <!-- 数据过滤器 -->
            <DataFilterInput
              v-model="filterPaths[dataSource.key]"
              :source-data="getParsedJsonValue(dataSource.key)"
              @filter-change="(filteredData) => handleFilterResult(dataSource.key, filteredData)"
            />
          </div>

          <!-- HTTP 数据配置（暂时简化） -->
          <div v-else-if="dataSourceTypes[dataSource.key] === 'http'" class="http-config">
            <n-alert type="info" size="small">HTTP 数据源配置功能开发中...</n-alert>
          </div>
        </div>
      </n-collapse-item>
    </n-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, inject, computed } from 'vue'
import {
  NCollapse,
  NCollapseItem,
  NSpace,
  NTag,
  NFormItem,
  NInput,
  NButton,
  NAlert,
  NTooltip,
  NIcon,
  useMessage
} from 'naive-ui'
import { configurationManager } from '../ConfigurationManager'
import DataFilterInput from './DataFilterInput.vue'

interface DataSource {
  key: string
  type: string
  label?: string
}

interface Props {
  dataSources: DataSource[]
  selectedWidgetId?: string // 新增：当前选中的组件ID，用于回显数据
}

interface Emits {
  (e: string, value: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const message = useMessage()

// 计算默认展开的数据源名称（默认展开第一个）
const defaultExpandedNames = computed(() => {
  return props.dataSources.length > 0 ? [props.dataSources[0].key] : []
})

// 每个数据源的类型状态 (json/http)
const dataSourceTypes = reactive<Record<string, 'json' | 'http'>>({})

// 每个数据源的 JSON 数据
const jsonValues = reactive<Record<string, string>>({})

// 每个数据源的过滤路径
const filterPaths = reactive<Record<string, string>>({})

// 获取默认数据
function getDefaultData(dataSourceKey: string) {
  if (dataSourceKey.includes('array') || dataSourceKey.includes('list')) {
    return [
      { name: '项目1', value: 100 },
      { name: '项目2', value: 200 },
      { name: '项目3', value: 150 }
    ]
  } else {
    return {
      name: '示例数据',
      status: 'active',
      value: 42
    }
  }
}

// 应用数据过滤器
const applyDataFilter = (data: any, path: string): any => {
  // 如果路径为空或者是 $，返回完整数据
  if (!path || path === '$') {
    return data
  }
  
  try {
    // 简单的 JSONPath 实现
    let current = data
    
    // 移除开头的 $ 符号
    const cleanPath = path.startsWith('$') ? path.substring(1) : path
    
    if (cleanPath === '') {
      return current
    }
    
    // 按点分割路径
    const parts = cleanPath.split('.').filter(part => part !== '')
    
    for (const part of parts) {
      if (current === null || current === undefined) {
        console.warn(`[DataSourceConfigForm] 路径 "${part}" 处数据为空`)
        return null
      }
      
      // 处理数组索引
      if (part.includes('[') && part.includes(']')) {
        const [field, indexPart] = part.split('[')
        const index = parseInt(indexPart.replace(']', ''), 10)
        
        if (field) {
          current = current[field]
        }
        
        if (Array.isArray(current) && index >= 0 && index < current.length) {
          current = current[index]
        } else {
          console.warn(`[DataSourceConfigForm] 数组索引 ${index} 无效`)
          return null
        }
      } else {
        // 普通字段访问
        if (typeof current === 'object' && current !== null && part in current) {
          current = current[part]
        } else {
          console.warn(`[DataSourceConfigForm] 字段 "${part}" 不存在`)
          return null
        }
      }
    }
    
    return current
  } catch (error) {
    console.warn(`[DataSourceConfigForm] 路径解析错误:`, error)
    return data // 出错时返回原始数据
  }
}

// 更新 JSON 值（现在主要用于保存数据，过滤由 DataFilterInput 组件处理）
const updateJsonValue = (key: string, value: string) => {
  jsonValues[key] = value
  console.log(`📝 [DataSourceConfigForm] 更新数据源 ${key} JSON 数据`)
  
  // 不再直接发射，让 DataFilterInput 组件处理过滤和发射
}

// 初始化数据源状态
const initializeDataSources = () => {
  console.log('🚀 [DataSourceConfigForm] 初始化数据源状态')
  props.dataSources.forEach(dataSource => {
    dataSourceTypes[dataSource.key] = 'json' // 默认为 JSON
    jsonValues[dataSource.key] = JSON.stringify(getDefaultData(dataSource.key), null, 2)
    filterPaths[dataSource.key] = '' // 默认无过滤路径
  })
}

// 从 ConfigurationManager 加载已保存的数据
const loadSavedDataFromManager = () => {
  if (!props.selectedWidgetId) {
    console.log('🔄 [DataSourceConfigForm] 无组件ID，使用默认数据')
    initializeDataSources()
    // 发射默认数据
    props.dataSources.forEach(dataSource => {
      updateJsonValue(dataSource.key, jsonValues[dataSource.key])
    })
    return
  }

  console.log('🔄 [DataSourceConfigForm] 从 ConfigurationManager 加载数据:', props.selectedWidgetId)

  const config = configurationManager.getConfiguration(props.selectedWidgetId)
  let hasLoadedData = false

  if (config?.dataSource?.type === 'data-source-bindings' && config.dataSource.config?.dataSourceBindings) {
    console.log('✅ [DataSourceConfigForm] 找到已保存的数据源配置:', config.dataSource.config.dataSourceBindings)

    // 先初始化基础结构
    initializeDataSources()

    // 恢复已保存的数据
    Object.entries(config.dataSource.config.dataSourceBindings).forEach(([key, binding]: [string, any]) => {
      if (binding.rawData && jsonValues[key] !== undefined) {
        jsonValues[key] = binding.rawData
        // 恢复过滤路径
        filterPaths[key] = binding.filterPath || ''
        console.log(`✅ [DataSourceConfigForm] 恢复数据源 ${key}:`, binding.rawData.substring(0, 100))
        console.log(`✅ [DataSourceConfigForm] 恢复过滤路径 ${key}:`, binding.filterPath || '(无过滤)')
        hasLoadedData = true
      }
    })

    if (hasLoadedData) {
      // 恢复数据后立即发射给组件
      Object.entries(config.dataSource.config.dataSourceBindings).forEach(([key, binding]: [string, any]) => {
        if (binding.rawData && jsonValues[key] !== undefined) {
          updateJsonValue(key, binding.rawData)
        }
      })
    }
  }

  if (!hasLoadedData) {
    console.log('🔄 [DataSourceConfigForm] 没有已保存的数据，使用默认数据')
    initializeDataSources()
    // 发射默认数据
    props.dataSources.forEach(dataSource => {
      updateJsonValue(dataSource.key, jsonValues[dataSource.key])
    })
  }
}

// 监听选中的组件变化，自动加载对应的配置
watch(
  () => props.selectedWidgetId,
  newWidgetId => {
    console.log('🔄 [DataSourceConfigForm] 组件切换，重新加载数据:', newWidgetId)
    loadSavedDataFromManager()
  },
  { immediate: true }
)

// 切换数据源类型
const switchDataSourceType = (key: string, type: 'json' | 'http') => {
  dataSourceTypes[key] = type
  console.log(`🔄 数据源 ${key} 切换到 ${type}`)

  if (type === 'json') {
    // 切换到 JSON 时，立即发射当前数据
    updateJsonValue(key, jsonValues[key])
  }
}

// 获取 JSON 值
const getJsonValue = (key: string) => {
  return jsonValues[key] || '{}'
}

// 获取格式提示
const getFormatTip = (key: string) => {
  const isArrayType = key.includes('array') || key.includes('list')
  return isArrayType ? '数组格式: [{key: value}, ...]' : '对象格式: {key1: value1, key2: value2}'
}

// 格式化 JSON 值
const formatJsonValue = (key: string) => {
  try {
    const parsed = JSON.parse(jsonValues[key])
    jsonValues[key] = JSON.stringify(parsed, null, 2)
    message.success('JSON 格式化成功')
    // 格式化后重新发射数据
    updateJsonValue(key, jsonValues[key])
  } catch (error) {
    message.error('JSON 格式错误，无法格式化')
  }
}

// 加载示例数据
const loadSampleData = (key: string) => {
  const sampleData = getDefaultData(key)
  jsonValues[key] = JSON.stringify(sampleData, null, 2)
  message.success('示例数据加载成功')
  // 加载示例数据后立即发射
  updateJsonValue(key, jsonValues[key])
}

// 处理过滤路径变化
const handleFilterPathChange = (key: string, path: string) => {
  filterPaths[key] = path
  console.log(`🔧 [DataSourceConfigForm] 数据源 ${key} 过滤路径变更为: "${path}"`)
  
  // 重新应用过滤器并发射数据
  if (jsonValues[key]) {
    updateJsonValue(key, jsonValues[key])
  }
}

// 获取解析后的 JSON 值用于预览
const getParsedJsonValue = (key: string): any => {
  try {
    const jsonStr = jsonValues[key] || '{}'
    return JSON.parse(jsonStr)
  } catch (error) {
    return null
  }
}

// 处理过滤结果
const handleFilterResult = (key: string, filteredData: any) => {
  console.log(`🔧 [DataSourceConfigForm] 数据源 ${key} 过滤结果:`, filteredData)
  
  // 直接发射过滤后的数据
  const eventName = `update:${key}`
  emit(eventName, filteredData)
}

// 递归更新问题已通过 restoreSavedValues 方法解决，不再需要监听 initialData
// 组件挂载时不再自动发射初始数据，等待 ConfigurationPanel 恢复已保存数据或手动初始化
</script>

<style scoped>
.data-source-config-form {
  padding: 8px;
}

.data-source-content {
  padding: 12px 0;
}

.json-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.http-config {
  padding: 8px 0;
}

/* 折叠面板样式调整 */
:deep(.n-collapse-item__header) {
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 500;
}

:deep(.n-collapse-item__content-wrapper) {
  padding: 0 12px 12px 12px;
}

/* 标签按钮样式 */
.n-tag {
  transition: all 0.2s ease;
}

.n-tag:hover {
  opacity: 0.8;
}

/* 表单项样式 */
:deep(.n-form-item .n-form-item-label) {
  font-size: 12px;
  color: var(--text-color-2);
}

:deep(.n-input) {
  font-size: 12px;
}

:deep(.n-input__textarea-el) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  line-height: 1.4;
}
</style>
