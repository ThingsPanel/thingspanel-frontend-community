<!--
  数据源配置面板
  根据数据源类型提供相应的配置界面
-->
<template>
  <div class="data-source-config-panel">
    <!-- 使用说明 -->
    <div class="usage-section" v-if="requirement.usage">
      <n-alert type="info" :show-icon="false" class="usage-alert">
        <n-text depth="2" class="usage-text">
          <n-icon class="usage-icon"><InfoCircleOutlined /></n-icon>
          {{ requirement.usage }}
        </n-text>
      </n-alert>
    </div>

    <!-- 数据源启用开关 -->
    <div class="enable-section">
      <div class="enable-control">
        <n-switch 
          v-model:value="isEnabled"
          @update:value="handleEnableChange"
        />
        <n-text class="enable-label">
          启用此数据源
        </n-text>
      </div>
    </div>

    <!-- 配置内容 -->
    <div class="config-content" v-if="isEnabled">
      <!-- 数据源类型声明（只读显示，不可选择） -->
      <div class="type-declaration-section">
        <div class="form-item">
          <n-text class="form-label">数据源类型</n-text>
          <n-tag 
            :type="requirement.type === 'array' ? 'info' : 'warning'"
            size="small"
            class="type-tag"
          >
            <template #icon>
              <n-icon>
                <component :is="requirement.type === 'array' ? DatabaseOutlined : SettingOutlined" />
              </n-icon>
            </template>
            {{ requirement.type === 'array' ? '数组数据' : '对象数据' }}
          </n-tag>
          <n-text depth="3" class="type-description">
            {{ requirement.type === 'array' ? '组件需要数组格式的数据源' : '组件需要对象格式的数据源' }}
          </n-text>
          
          <!-- 路径映射说明 -->
          <div class="path-mapping-info" v-if="requirement.defaultConfig?.pathMapping">
            <n-text depth="2" class="mapping-title">路径映射配置</n-text>
            <div class="mapping-list">
              <div 
                v-for="(path, key) in requirement.defaultConfig.pathMapping"
                :key="key"
                class="mapping-item"
              >
                <n-text class="mapping-key">{{ key }}:</n-text>
                <n-text depth="3" class="mapping-path">{{ path }}</n-text>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 数据输入区域 -->
      <div class="data-input-section">
        <div class="form-item">
          <div class="form-label-row">
            <n-text class="form-label">数据源</n-text>
            <n-button-group size="small">
              <n-button 
                v-for="template in dataTemplates"
                :key="template.key"
                :type="currentTemplate === template.key ? 'primary' : 'default'"
                size="tiny"
                @click="loadDataTemplate(template.key)"
              >
                {{ template.label }}
              </n-button>
            </n-button-group>
          </div>
          
          <n-input
            v-model:value="jsonInputValue"
            type="textarea"
            :rows="8"
            placeholder="请输入JSON格式的数据..."
            @blur="handleDataInputChange"
            class="data-input"
          />
          
          <!-- JSON验证状态 -->
          <div class="json-status" v-if="jsonValidationMessage">
            <n-text 
              :type="jsonValidationMessage.type === 'error' ? 'error' : 'success'"
              depth="3"
              class="json-status-text"
            >
              <n-icon class="json-status-icon">
                <component :is="jsonValidationMessage.type === 'error' ? ExclamationCircleOutlined : CheckCircleOutlined" />
              </n-icon>
              {{ jsonValidationMessage.message }}
            </n-text>
          </div>
        </div>
      </div>

      <!-- 数据配置区域 -->
      <div class="data-config-section" v-if="parsedData && effectiveDataType">
        <!-- 数组数据配置 -->
        <ArrayDataConfig
          v-if="effectiveDataType === 'array'"
          :data="parsedData"
          :config="currentArrayConfig"
          @update="handleArrayConfigUpdate"
        />
        
        <!-- 对象数据配置 -->
        <ObjectDataConfig
          v-else-if="effectiveDataType === 'object'"
          :data="parsedData"
          :config="currentObjectConfig"
          @update="handleObjectConfigUpdate"
        />
      </div>

      <!-- 数据预览 -->
      <div class="preview-section" v-if="parsedData">
        <div class="preview-header">
          <n-text class="preview-title">数据预览</n-text>
          <n-tag size="small" :type="previewTagType">
            {{ getDataTypeLabel() }}
          </n-tag>
        </div>
        
        <div class="preview-content">
          <DataPreview 
            :data="parsedData"
            :config="currentConfig"
            :max-items="3"
          />
        </div>
      </div>
    </div>

    <!-- 禁用状态提示 -->
    <div class="disabled-hint" v-else>
      <n-text depth="3" class="disabled-text">
        数据源已禁用，启用后可进行配置
      </n-text>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { 
  NSwitch, NText, NInput, NRadioGroup, NRadio, NSpace, 
  NButton, NButtonGroup, NAlert, NIcon, NTag, useMessage 
} from 'naive-ui'
import { 
  InfoCircleOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  DatabaseOutlined,
  SettingOutlined
} from '@vicons/antd'
import type {
  DataSourceRequirement,
  DataSourceConfig,
  DataSourceType
} from '@/components/visual-editor/core/multi-data-source-types'
import ArrayDataConfig from './ArrayDataConfig.vue'
import ObjectDataConfig from './ObjectDataConfig.vue'
import DataPreview from './DataPreview.vue'

// Props
interface Props {
  requirement: DataSourceRequirement
  config?: DataSourceConfig
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  update: [dataSourceId: string, updates: Partial<DataSourceConfig>]
  'data-change': [dataSourceId: string, data: any]
}>()

// 响应式状态
const message = useMessage()
const isEnabled = ref(props.config?.enabled ?? true)
const jsonInputValue = ref('')
const parsedData = ref<any>()
const jsonValidationMessage = ref<{ type: 'error' | 'success'; message: string }>()
const currentTemplate = ref<string>()
const currentArrayConfig = ref({
  xField: 'timestamp',
  yField: 'value',
  labelField: 'label'
})
const currentObjectConfig = ref({
  selectedFields: [] as string[]
})

// 数据模板
const dataTemplates = computed(() => {
  const templates = []
  
  if (effectiveDataType.value === 'array') {
    templates.push(
      {
        key: 'timeSeriesArray',
        label: '时间序列',
        data: [
          { timestamp: '2024-01-01 10:00', temperature: 22.5, humidity: 65, label: '数据点1' },
          { timestamp: '2024-01-01 11:00', temperature: 23.1, humidity: 62, label: '数据点2' },
          { timestamp: '2024-01-01 12:00', temperature: 24.0, humidity: 60, label: '数据点3' }
        ]
      },
      {
        key: 'simpleArray',
        label: '简单数组',
        data: [
          { name: 'A', value: 100 },
          { name: 'B', value: 150 },
          { name: 'C', value: 200 }
        ]
      }
    )
  }
  
  if (effectiveDataType.value === 'object') {
    templates.push({
      key: 'statsObject',
      label: '统计对象',
      data: {
        totalUsers: 1250,
        activeUsers: 892,
        revenue: 45680,
        growthRate: 12.5,
        lastUpdated: '2024-01-01 12:00:00'
      }
    })
  }
  
  return templates
})

// 计算属性
// 数据源类型由组件明确声明，不再需要用户选择
const effectiveDataType = computed((): DataSourceType => {
  return props.requirement.type
})

const currentConfig = computed(() => {
  if (effectiveDataType.value === 'array') {
    return { arrayConfig: currentArrayConfig.value }
  } else if (effectiveDataType.value === 'object') {
    return { objectConfig: currentObjectConfig.value }
  }
  return {}
})

const previewTagType = computed(() => {
  switch (effectiveDataType.value) {
    case 'array':
      return 'info'
    case 'object':
      return 'success'
    default:
      return 'default'
  }
})

// 获取数据类型标签
const getDataTypeLabel = () => {
  switch (effectiveDataType.value) {
    case 'array':
      return `数组 (${Array.isArray(parsedData.value) ? parsedData.value.length : 0} 项)`
    case 'object':
      return `对象 (${parsedData.value ? Object.keys(parsedData.value).length : 0} 字段)`
    default:
      return '未知类型'
  }
}

// 加载数据模板
const loadDataTemplate = (templateKey: string) => {
  const template = dataTemplates.value.find(t => t.key === templateKey)
  if (template) {
    jsonInputValue.value = JSON.stringify(template.data, null, 2)
    currentTemplate.value = templateKey
    handleDataInputChange()
  }
}

// 处理启用状态变化
const handleEnableChange = (enabled: boolean) => {
  emit('update', props.requirement.id, { enabled })
}

// 已删除数据类型选择功能，类型由组件声明决定

// 处理数据输入变化
const handleDataInputChange = () => {
  validateAndParseJson(jsonInputValue.value)
}

// 验证和解析JSON
const validateAndParseJson = (value: string) => {
  if (!value.trim()) {
    jsonValidationMessage.value = undefined
    parsedData.value = undefined
    return
  }

  try {
    const parsed = JSON.parse(value)
    
    // 验证数据类型匹配
    const isArray = Array.isArray(parsed)
    const isObject = typeof parsed === 'object' && !isArray
    
    if (effectiveDataType.value === 'array' && !isArray) {
      jsonValidationMessage.value = {
        type: 'error',
        message: '数据格式不匹配：期望数组格式'
      }
      return
    }
    
    if (effectiveDataType.value === 'object' && !isObject) {
      jsonValidationMessage.value = {
        type: 'error',
        message: '数据格式不匹配：期望对象格式'
      }
      return
    }
    
    // 验证成功
    parsedData.value = parsed
    jsonValidationMessage.value = {
      type: 'success',
      message: `JSON解析成功，${isArray ? '数组' : '对象'}数据`
    }
    
    // 发射数据变化事件
    emit('data-change', props.requirement.id, parsed)
    
  } catch (error) {
    jsonValidationMessage.value = {
      type: 'error',
      message: `JSON格式错误: ${error}`
    }
    parsedData.value = undefined
  }
}

// 处理数组配置更新
const handleArrayConfigUpdate = (config: any) => {
  currentArrayConfig.value = { ...config }
  
  // 更新数据源配置
  emit('update', props.requirement.id, {
    config: currentConfig.value
  })
}

// 处理对象配置更新
const handleObjectConfigUpdate = (config: any) => {
  currentObjectConfig.value = { ...config }
  
  // 更新数据源配置
  emit('update', props.requirement.id, {
    config: currentConfig.value
  })
}

// 初始化
const initialize = () => {
  if (props.config) {
    isEnabled.value = props.config.enabled
    
    // 加载已有数据
    if (props.config.data) {
      parsedData.value = props.config.data
      jsonInputValue.value = JSON.stringify(props.config.data, null, 2)
      jsonValidationMessage.value = {
        type: 'success',
        message: '已加载保存的数据'
      }
    }
    
    // 加载已有配置
    if (props.config.config?.arrayConfig) {
      currentArrayConfig.value = { ...props.config.config.arrayConfig }
    }
    
    if (props.config.config?.objectConfig) {
      currentObjectConfig.value = { ...props.config.config.objectConfig }
    }
  }
  
  // 数据类型现在由组件声明决定，无需设置
  
  // 从默认配置中加载
  if (props.requirement.defaultConfig?.arrayConfig) {
    currentArrayConfig.value = { ...props.requirement.defaultConfig.arrayConfig }
  }
}

// 监听配置变化
watch(() => props.config, () => {
  initialize()
}, { deep: true })

onMounted(() => {
  initialize()
  console.log('🔧 [DataSourceConfigPanel] 初始化完成:', props.requirement.id)
})
</script>

<style scoped>
.data-source-config-panel {
  padding: 16px;
  border-radius: var(--border-radius);
  background: var(--body-color);
}

.usage-section {
  margin-bottom: 16px;
}

.usage-alert {
  border: none;
  background: rgba(24, 144, 255, 0.06);
  padding: 8px 12px;
}

.usage-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.usage-icon {
  color: var(--info-color);
}

.enable-section {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--divider-color);
}

.enable-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.enable-label {
  font-size: 14px;
  font-weight: 500;
}

.config-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.type-selector-section {
  padding: 12px;
  background: var(--card-color);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
}

.form-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.data-input-section {
  padding: 12px;
  background: var(--card-color);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.data-input {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.json-status {
  margin-top: 4px;
}

.json-status-text {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.json-status-icon {
  font-size: 12px;
}

.data-config-section {
  padding: 12px;
  background: var(--card-color);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.preview-section {
  padding: 12px;
  background: var(--card-color);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.preview-title {
  font-size: 13px;
  font-weight: 500;
}

.preview-content {
  max-height: 200px;
  overflow-y: auto;
}

.disabled-hint {
  padding: 20px;
  text-align: center;
  background: var(--card-color);
  border-radius: var(--border-radius);
  border: 1px dashed var(--border-color);
}

.disabled-text {
  font-size: 13px;
}

/* 深色主题适配 */
[data-theme="dark"] .usage-alert {
  background: rgba(24, 144, 255, 0.1);
}

[data-theme="dark"] .type-selector-section,
[data-theme="dark"] .data-input-section,
[data-theme="dark"] .data-config-section,
[data-theme="dark"] .preview-section {
  background: var(--card-color);
  border-color: var(--border-color-dark);
}

[data-theme="dark"] .disabled-hint {
  border-color: var(--border-color-dark);
}

/* 路径映射信息样式 */
.path-mapping-info {
  margin-top: 12px;
  padding: 8px 12px;
  background-color: var(--code-color);
  border-radius: 6px;
  border-left: 3px solid var(--primary-color);
}

.mapping-title {
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 6px;
}

.mapping-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mapping-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Monaco', 'Consolas', monospace;
  font-size: 11px;
}

.mapping-key {
  color: var(--primary-color);
  font-weight: 500;
  min-width: 80px;
}

.mapping-path {
  color: var(--text-color-3);
  background-color: rgba(var(--primary-color-rgb), 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.type-tag {
  margin-right: 8px;
}

.type-description {
  margin-top: 4px;
  font-size: 12px;
}

.type-declaration-section {
  padding: 12px;
  background: var(--card-color);
  border-radius: var(--border-radius);
  border: 1px solid var(--border-color);
}
</style>