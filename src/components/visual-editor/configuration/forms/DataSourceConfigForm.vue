<template>
  <div class="data-source-config-form">
    <n-collapse :default-expanded-names="[props.dataSources[0]?.key]" accordion>
      <n-collapse-item
        v-for="dataSource in props.dataSources"
        :key="dataSource.key"
        :title="`${dataSource.name || dataSource.key} (${getDataTypeText(dataSource)})`"
        :name="dataSource.key"
      >
        <!-- 数据源配置内容 -->
        <div class="data-source-content">
          <n-space vertical size="medium">
            <!-- 当前数据展示 -->
            <div>
              <n-text strong>当前数据:</n-text>
              <n-code 
                :code="getFormattedData(dataSource.key)" 
                language="json" 
                :show-line-numbers="false"
                style="margin-top: 8px; max-height: 200px; overflow-y: auto"
              />
            </div>
            
            <!-- 修改按钮 -->
            <n-space>
              <n-button type="primary" @click="randomizeData(dataSource.key)">
                随机修改数据
              </n-button>
              <n-button @click="resetData(dataSource.key)">
                重置为默认
              </n-button>
            </n-space>
          </n-space>
        </div>
      </n-collapse-item>
    </n-collapse>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据源配置表单 - 极简重写版本
 * 目标：实现基础数据流闭环
 */

import { ref, reactive, watch, computed, onMounted } from 'vue'
import { NCollapse, NCollapseItem, NSpace, NText, NCode, NButton } from 'naive-ui'
import { configurationManager } from '../ConfigurationManager'

interface DataSource {
  key: string
  name?: string
  description?: string
  fieldMappings?: Record<string, any>
  fieldsToMap?: Array<{ key: string; targetProperty: string }>
}

interface Props {
  selectedWidgetId?: string  // 修改为匹配 ConfigurationPanel 传递的属性名
  dataSources: DataSource[]
}

interface Emits {
  (e: 'update', config: any): void
  (e: 'request-current-data', widgetId: string): void  // 🔥 新增：请求当前数据
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 数据存储
const dataValues = reactive<Record<string, any>>({})

/**
 * 获取数据类型文本描述
 */
const getDataTypeText = (dataSource: DataSource) => {
  // 根据 fieldsToMap 判断期望的数据类型
  if (dataSource.fieldsToMap && dataSource.fieldsToMap.length > 0) {
    const targetProperty = dataSource.fieldsToMap[0].targetProperty
    if (targetProperty.includes('array') || targetProperty.includes('Array')) {
      return '数组'
    }
    if (targetProperty.includes('object') || targetProperty.includes('Object')) {
      return '对象'
    }
  }
  
  // 根据 key 判断
  if (dataSource.key.toLowerCase().includes('array')) return '数组'
  if (dataSource.key.toLowerCase().includes('object')) return '对象'
  
  return '数据'
}

/**
 * 获取默认数据 - 🔥 修复：优先使用组件定义的 defaultValue
 */
const getDefaultData = (dataSourceKey: string) => {
  const dataSource = props.dataSources.find(ds => ds.key === dataSourceKey)
  if (!dataSource) return {}

  // 🔥 修复：优先从 fieldMappings 中获取 defaultValue
  if (dataSource.fieldMappings) {
    // 查找匹配的字段映射
    const targetFieldMapping = Object.values(dataSource.fieldMappings).find(
      (mapping: any) => mapping.targetField === dataSourceKey || mapping.type
    )
    
    if (targetFieldMapping && targetFieldMapping.defaultValue !== undefined) {
      console.log(`🔧 [DEBUG-Config] 使用组件定义的默认值 (${dataSourceKey}):`, targetFieldMapping.defaultValue)
      return targetFieldMapping.defaultValue
    }
  }

  // 根据数据类型返回通用默认数据（后备方案）
  const dataType = getDataTypeText(dataSource)
  
  if (dataType === '数组') {
    return [
      { id: 1, name: '项目A', value: 100, status: 'active' },
      { id: 2, name: '项目B', value: 200, status: 'inactive' },
      { id: 3, name: '项目C', value: 150, status: 'active' }
    ]
  } else {
    return {
      name: '测试数据',
      value: 42,
      status: 'online',
      timestamp: new Date().toISOString(),
      config: {
        enabled: true,
        priority: 'high'
      }
    }
  }
}

/**
 * 格式化显示数据
 */
const getFormattedData = (dataSourceKey: string) => {
  const data = dataValues[dataSourceKey]
  if (!data) return '暂无数据'
  
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

/**
 * 随机修改数据
 */
const randomizeData = (dataSourceKey: string) => {
  const dataSource = props.dataSources.find(ds => ds.key === dataSourceKey)
  if (!dataSource) return

  const dataType = getDataTypeText(dataSource)
  
  if (dataType === '数组') {
    // 修改数组数据
    dataValues[dataSourceKey] = [
      { 
        id: Math.floor(Math.random() * 1000), 
        name: `随机项目${Math.floor(Math.random() * 100)}`, 
        value: Math.floor(Math.random() * 1000), 
        status: Math.random() > 0.5 ? 'active' : 'inactive' 
      },
      { 
        id: Math.floor(Math.random() * 1000), 
        name: `随机项目${Math.floor(Math.random() * 100)}`, 
        value: Math.floor(Math.random() * 1000), 
        status: Math.random() > 0.5 ? 'active' : 'inactive' 
      }
    ]
  } else {
    // 修改对象数据
    dataValues[dataSourceKey] = {
      name: `随机测试${Math.floor(Math.random() * 100)}`,
      value: Math.floor(Math.random() * 1000),
      status: Math.random() > 0.5 ? 'online' : 'offline',
      timestamp: new Date().toISOString(),
      config: {
        enabled: Math.random() > 0.5,
        priority: Math.random() > 0.5 ? 'high' : 'low'
      }
    }
  }
  
  console.log('🔧 [DEBUG-Config] 随机修改数据:', { dataSourceKey, newData: dataValues[dataSourceKey] })
  
  // 立即发送更新
  sendUpdate()
}

/**
 * 重置数据为默认
 */
const resetData = (dataSourceKey: string) => {
  dataValues[dataSourceKey] = getDefaultData(dataSourceKey)
  console.log('🔧 [DEBUG-Config] 重置数据:', { dataSourceKey, data: dataValues[dataSourceKey] })
  sendUpdate()
}

// 上次发送的配置，用于防止重复发送
let lastSentConfig: string | null = null

/**
 * 发送配置更新 - 🔥 修复：只在数据真正变化时发送
 */
const sendUpdate = () => {
  const dataSourceBindings: Record<string, any> = {}
  
  // 构建数据源绑定
  props.dataSources.forEach(dataSource => {
    if (dataValues[dataSource.key]) {
      dataSourceBindings[dataSource.key] = {
        rawData: JSON.stringify(dataValues[dataSource.key])
      }
    }
  })
  
  const config = { dataSourceBindings }
  const configHash = JSON.stringify(config)
  
  // 🔥 关键修复：只在配置真正变化时才发送
  if (configHash !== lastSentConfig) {
    console.log('🔧 [DEBUG-Config] 检测到配置变化，发送更新:', {
      selectedWidgetId: props.selectedWidgetId,
      bindingKeys: Object.keys(dataSourceBindings),
      hasDataChanged: configHash !== lastSentConfig,
      config
    })
    
    lastSentConfig = configHash
    emit('update', config)
  } else {
    console.log('🔧 [DEBUG-Config] 配置未变化，跳过发送:', {
      selectedWidgetId: props.selectedWidgetId,
      bindingKeys: Object.keys(dataSourceBindings)
    })
  }
}

/**
 * 初始化数据 - 🔥 修复：优先使用当前运行时数据
 */
const initializeData = () => {
  console.log('🔧 [DEBUG-Config] 初始化数据源数据:', {
    selectedWidgetId: props.selectedWidgetId,
    dataSourcesCount: props.dataSources.length,
    dataSourceKeys: props.dataSources.map(ds => ds.key)
  })
  
  // 🔥 重置配置缓存，允许新的配置发送
  lastSentConfig = null
  
  // 🔥 核心修复：先请求当前运行时数据
  if (props.selectedWidgetId) {
    console.log('🔄 [DataSourceConfigForm] 请求当前运行时数据:', props.selectedWidgetId)
    emit('request-current-data', props.selectedWidgetId)
    
    // 给父组件一点时间响应，然后再尝试恢复
    setTimeout(() => {
      attemptDataRestore()
    }, 50)
  } else {
    // 没有选中组件，使用默认数据
    useDefaultData()
  }
}

/**
 * 尝试数据恢复（从存储的配置）
 */
const attemptDataRestore = () => {
  let hasRestoredData = false
  
  if (props.selectedWidgetId) {
    try {
      console.log('🔍 [DEBUG-Restore] 开始尝试恢复配置:', props.selectedWidgetId)
      const savedConfig = configurationManager.getConfiguration(props.selectedWidgetId)
      console.log('🔍 [DEBUG-Restore] ConfigurationManager返回的完整配置:', savedConfig)
      
      // 尝试从多种数据结构恢复
      let dataSourceBindings = null
      
      if (savedConfig?.dataSource?.config?.dataSourceBindings) {
        dataSourceBindings = savedConfig.dataSource.config.dataSourceBindings
        console.log('🔧 [DEBUG-Config] 从dataSource.config恢复数据:', dataSourceBindings)
      } else if (savedConfig?.dataSourceBindings) {
        dataSourceBindings = savedConfig.dataSourceBindings
        console.log('🔧 [DEBUG-Config] 从dataSourceBindings直接恢复数据:', dataSourceBindings)
      }
      
      if (dataSourceBindings && Object.keys(dataSourceBindings).length > 0) {
        // 恢复每个数据源的保存数据
        Object.entries(dataSourceBindings).forEach(([key, binding]: [string, any]) => {
          if (binding?.rawData) {
            try {
              dataValues[key] = JSON.parse(binding.rawData)
              hasRestoredData = true
              console.log(`🔧 [DEBUG-Config] 恢复数据源 ${key}:`, dataValues[key])
            } catch (error) {
              console.warn(`⚠️ [DEBUG-Config] 恢复数据源 ${key} 失败:`, error)
            }
          }
        })
      }
    } catch (error) {
      console.warn('⚠️ [DEBUG-Config] 配置恢复失败:', error)
    }
  }
  
  // 如果没有恢复到数据，使用默认数据
  if (!hasRestoredData) {
    useDefaultData()
  }
  
  // 🔥 修复：只在没有恢复到数据时发送初始配置
  // 恢复数据时不发送，避免重复发送相同配置
  if (!hasRestoredData) {
    console.log('🔧 [DEBUG-Config] 使用默认数据，发送初始配置')
    sendUpdate()
  } else {
    console.log('🔧 [DEBUG-Config] 数据已恢复，不发送重复配置')
    // 更新 lastSentConfig 以避免后续重复发送
    const dataSourceBindings: Record<string, any> = {}
    props.dataSources.forEach(dataSource => {
      if (dataValues[dataSource.key]) {
        dataSourceBindings[dataSource.key] = {
          rawData: JSON.stringify(dataValues[dataSource.key])
        }
      }
    })
    lastSentConfig = JSON.stringify({ dataSourceBindings })
  }
}

/**
 * 使用默认数据
 */
const useDefaultData = () => {
  console.log('🔧 [DEBUG-Config] 使用默认数据初始化')
  props.dataSources.forEach(dataSource => {
    dataValues[dataSource.key] = getDefaultData(dataSource.key)
  })
}

// 组件挂载时初始化
onMounted(() => {
  initializeData()
})

// 🔥 监听 selectedWidgetId 变化，重新初始化
watch(() => props.selectedWidgetId, (newId, oldId) => {
  if (newId && newId !== oldId) {
    console.log('🔄 [DataSourceConfigForm] selectedWidgetId 变化，重新初始化:', { oldId, newId })
    initializeData()
  }
}, { immediate: false })

// 监听 props 变化，重新初始化
watch(() => props.dataSources, () => {
  initializeData()
}, { deep: true })
</script>

<style scoped>
.data-source-config-form {
  width: 100%;
}

.data-source-content {
  padding: 16px;
  background: var(--card-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}
</style>