<!--
  V6重构版本：纯粹的UI渲染器
  SimpleDataMappingForm - 完全由definition驱动的动态配置表单
-->

<template>
  <div class="simple-data-mapping-form-v6">
    <!-- V6: 专注于数据源配置，移除静态参数 -->
    <n-collapse :default-expanded-names="getDefaultExpandedNames()">
      <!-- 数据源配置区域 -->
      <n-collapse-item
        v-for="(dataSource, index) in definition.dataSources"
        :key="dataSource.key"
        :title="`${dataSource.label}`"
        :name="`dataSource-${index}`"
      >
        <div class="data-source-section">
          <n-space vertical size="large">
            <!-- 数据源描述 -->
            <n-alert v-if="dataSource.description" type="info" size="small">
              {{ dataSource.description }}
            </n-alert>

            <!-- JSON 数据输入区域 -->
            <div class="json-input-section">
              <n-text strong>原始数据输入</n-text>
              <n-divider style="margin: 8px 0" />

              <div class="json-input-container">
                <div class="input-header">
                  <n-space>
                    <n-button size="tiny" @click="formatJson(dataSource.key)">
                      <template #icon>
                        <n-icon><CodeOutline /></n-icon>
                      </template>
                      格式化
                    </n-button>
                    <n-button size="tiny" @click="loadSampleData(dataSource.key)">
                      <template #icon>
                        <n-icon><AddOutline /></n-icon>
                      </template>
                      示例数据
                    </n-button>
                    <n-tag :type="isValidJson(dataSource.key) ? 'success' : 'error'" size="small">
                      {{ isValidJson(dataSource.key) ? 'JSON有效' : 'JSON无效' }}
                    </n-tag>
                  </n-space>
                </div>

                <n-input
                  :value="getRawData(dataSource.key)"
                  type="textarea"
                  :rows="6"
                  placeholder="请输入JSON数据..."
                  class="json-input"
                  @update:value="updateRawData(dataSource.key, $event)"
                />
              </div>
            </div>

            <!-- 字段映射区域 -->
            <div v-if="dataSource.fieldsToMap" class="field-mappings-section">
              <n-text strong>字段映射配置</n-text>
              <n-divider style="margin: 8px 0" />

              <n-form label-placement="left" label-width="120px" size="small">
                <n-form-item v-for="field in dataSource.fieldsToMap" :key="field.key" :label="field.label">
                  <n-input
                    :value="getFieldMapping(dataSource.key, field.key)"
                    :placeholder="field.placeholder || `JSONPath for ${field.label}`"
                    @update:value="updateFieldMapping(dataSource.key, field.key, $event)"
                  />

                  <!-- 字段描述 -->
                  <template v-if="field.description" #feedback>
                    <n-text depth="3" style="font-size: 12px">{{ field.description }}</n-text>
                  </template>
                </n-form-item>
              </n-form>

              <!-- 映射预览 -->
              <div v-if="hasValidJsonData(dataSource.key)" class="mapping-preview">
                <n-text strong style="font-size: 12px">映射预览</n-text>
                <n-divider style="margin: 6px 0" />
                <div class="preview-items">
                  <div v-for="field in dataSource.fieldsToMap" :key="field.key" class="preview-item">
                    <span class="preview-label">{{ field.label }}:</span>
                    <n-tag :type="getMappingPreviewType(dataSource.key, field.key)" size="small">
                      {{ getMappingPreview(dataSource.key, field.key) }}
                    </n-tag>
                  </div>
                </div>
              </div>
            </div>
          </n-space>
        </div>
      </n-collapse-item>
    </n-collapse>
  </div>
</template>

<script setup lang="ts">
/**
 * V6版本：纯粹的UI渲染器
 * 完全由definition驱动的动态配置表单，无内部状态管理
 */

import { computed, reactive, watch } from 'vue'
import {
  NCollapse,
  NCollapseItem,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSwitch,
  NColorPicker,
  NSelect,
  NSpace,
  NText,
  NAlert,
  NDivider,
  NButton,
  NIcon,
  NTag,
  useMessage
} from 'naive-ui'
import { CodeOutline, AddOutline } from '@vicons/ionicons5'

// V6标准接口定义
interface V6ComponentDefinition {
  staticParams?: Array<{
    key: string
    label: string
    type: string
    defaultValue?: any
    description?: string
    placeholder?: string
    min?: number
    max?: number
    options?: Array<{ label: string; value: any }>
  }>
  dataSources?: Array<{
    key: string
    label: string
    description?: string
    fieldsToMap?: Array<{
      key: string
      label: string
      targetProperty: string
      description?: string
      placeholder?: string
      required?: boolean
    }>
  }>
}

interface V6ConfigData {
  staticParams?: Record<string, any>
  dataSourceBindings?: Record<
    string,
    {
      sourceType: string
      rawData: string
      fieldMappings: Record<string, string>
    }
  >
}

interface Props {
  /** V6组件定义对象 */
  definition: V6ComponentDefinition
  /** V6配置数据对象 */
  modelValue: V6ConfigData
}

interface Emits {
  (e: 'update:modelValue', value: V6ConfigData): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const message = useMessage()

// V6: 本地响应式状态，避免Proxy问题
const localConfig = reactive({
  dataSourceBindings: {}
} as { dataSourceBindings: Record<string, any> })

// 监听props变化，同步到本地状态
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && typeof newValue === 'object') {
      console.log('📥 [V6Form] 同步外部配置到本地:', newValue)
      Object.assign(localConfig, newValue)
      // 确保dataSourceBindings存在
      if (!localConfig.dataSourceBindings) {
        localConfig.dataSourceBindings = {}
      }
    }
  },
  { immediate: true, deep: true }
)

// 监听本地状态变化，同步到外部
watch(
  localConfig,
  newValue => {
    console.log('📤 [V6Form] 同步本地配置到外部:', newValue)
    emit('update:modelValue', { ...newValue })
  },
  { deep: true }
)

// V6: 移除静态参数相关函数 - 专注于数据源配置

// ========== 数据源输入绑定 ==========
// V6: 简化数据绑定，使用标准的:value和@update:value模式

// ========== 数据源相关函数 ==========

const getRawData = (dataSourceKey: string): string => {
  const data = localConfig.dataSourceBindings?.[dataSourceKey]?.rawData || ''
  console.log('📖 [V6Form] 读取原始数据:', dataSourceKey, data)
  return data
}

const updateRawData = (dataSourceKey: string, rawData: string) => {
  console.log('🔄 [V6Form] 更新原始数据:', dataSourceKey, rawData)

  // 直接更新本地响应式状态
  if (!localConfig.dataSourceBindings[dataSourceKey]) {
    localConfig.dataSourceBindings[dataSourceKey] = { fieldMappings: {} }
  }

  localConfig.dataSourceBindings[dataSourceKey].sourceType = 'static'
  localConfig.dataSourceBindings[dataSourceKey].rawData = rawData

  console.log('🔄 [V6Form] 本地配置已更新:', localConfig)
}

const getFieldMapping = (dataSourceKey: string, fieldKey: string): string => {
  return localConfig.dataSourceBindings?.[dataSourceKey]?.fieldMappings?.[fieldKey] || ''
}

const updateFieldMapping = (dataSourceKey: string, fieldKey: string, mapping: string) => {
  // 直接更新本地响应式状态
  if (!localConfig.dataSourceBindings[dataSourceKey]) {
    localConfig.dataSourceBindings[dataSourceKey] = {
      sourceType: 'static',
      rawData: '',
      fieldMappings: {}
    }
  }

  if (!localConfig.dataSourceBindings[dataSourceKey].fieldMappings) {
    localConfig.dataSourceBindings[dataSourceKey].fieldMappings = {}
  }

  localConfig.dataSourceBindings[dataSourceKey].fieldMappings[fieldKey] = mapping
}

// ========== JSON处理相关函数 ==========

const isValidJson = (dataSourceKey: string): boolean => {
  const rawData = getRawData(dataSourceKey)
  if (!rawData.trim()) return false

  try {
    JSON.parse(rawData)
    return true
  } catch {
    return false
  }
}

const hasValidJsonData = (dataSourceKey: string): boolean => {
  return isValidJson(dataSourceKey) && getRawData(dataSourceKey).trim().length > 0
}

const formatJson = (dataSourceKey: string) => {
  const rawData = getRawData(dataSourceKey)
  if (!rawData.trim()) return

  try {
    const parsed = JSON.parse(rawData)
    const formatted = JSON.stringify(parsed, null, 2)
    updateRawData(dataSourceKey, formatted)
    message.success('JSON格式化成功')
  } catch {
    message.error('JSON格式错误，无法格式化')
  }
}

const loadSampleData = (dataSourceKey: string) => {
  console.log('🔄 [V6Form] 加载示例数据:', dataSourceKey)

  // 根据数据源类型加载不同的示例数据
  const dataSource = props.definition.dataSources?.find(ds => ds.key === dataSourceKey)

  let sampleData
  if (dataSource?.key === 'arrayDataSource' || dataSource?.label?.includes('数组')) {
    sampleData = [
      { name: '设备1', value: 25.6, status: 'online', id: 'dev001' },
      { name: '设备2', value: 30.2, status: 'offline', id: 'dev002' },
      { name: '设备3', value: 28.1, status: 'online', id: 'dev003' }
    ]
  } else if (dataSource?.key === 'objectDataSource' || dataSource?.label?.includes('对象')) {
    sampleData = {
      user: { name: '张三', age: 25, role: 'admin' },
      device: { id: 'dev001', temp: 23.5, humidity: 65 },
      location: { city: '北京', area: '朝阳区', building: 'A座' }
    }
  } else {
    sampleData = [
      { name: '项目1', value: 100, status: 'active' },
      { name: '项目2', value: 200, status: 'inactive' }
    ]
  }

  const formattedData = JSON.stringify(sampleData, null, 2)
  console.log('🔄 [V6Form] 格式化示例数据:', formattedData)

  updateRawData(dataSourceKey, formattedData)
  message.success('已加载示例数据')
}

// ========== 映射预览相关函数 ==========

const getMappingPreview = (dataSourceKey: string, fieldKey: string): string => {
  if (!hasValidJsonData(dataSourceKey)) return '无数据'

  const rawData = getRawData(dataSourceKey)
  const mapping = getFieldMapping(dataSourceKey, fieldKey)

  if (!mapping) return '未配置'

  try {
    const data = JSON.parse(rawData)
    const value = evaluateJsonPath(data, mapping)

    if (value === null || value === undefined) return '路径无效'

    return typeof value === 'object' ? JSON.stringify(value) : String(value)
  } catch {
    return '解析错误'
  }
}

const getMappingPreviewType = (dataSourceKey: string, fieldKey: string): string => {
  const preview = getMappingPreview(dataSourceKey, fieldKey)
  if (preview === '无数据' || preview === '未配置') return 'default'
  if (preview === '路径无效' || preview === '解析错误') return 'error'
  return 'success'
}

// 简化的JSONPath解析器
const evaluateJsonPath = (data: any, path: string): any => {
  if (!path || path === '$') return data

  try {
    // 处理简单的路径，如 $.name, [0].name, user.name 等
    let cleanPath = path.replace(/^\$\.?/, '').replace(/\[(\d+)\]/g, '.$1')
    if (cleanPath.startsWith('.')) cleanPath = cleanPath.slice(1)

    const keys = cleanPath.split('.')
    let current = data

    for (const key of keys) {
      if (key === '') continue
      if (current === null || current === undefined) return null

      if (/^\d+$/.test(key)) {
        const index = parseInt(key)
        current = Array.isArray(current) ? current[index] : current[key]
      } else {
        current = current[key]
      }

      if (current === undefined) return null
    }

    return current
  } catch {
    return null
  }
}

// ========== 工具函数 ==========

const getDefaultExpandedNames = () => {
  const names = []

  // V6: 只展开数据源配置
  if (props.definition.dataSources?.length > 0) {
    names.push('dataSource-0')
  }

  return names
}
</script>

<style scoped>
.simple-data-mapping-form-v6 {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.static-params-section {
  padding: 0 4px;
}

.data-source-section {
  padding: 4px;
}

.json-input-section {
  background: var(--hover-color);
  padding: 12px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.json-input-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.json-input {
  font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
  font-size: 12px;
}

.field-mappings-section {
  background: var(--card-color);
  padding: 12px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.mapping-preview {
  margin-top: 12px;
  padding: 8px;
  background: var(--hover-color);
  border-radius: 4px;
  border: 1px solid var(--divider-color);
}

.preview-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.preview-label {
  min-width: 80px;
  color: var(--text-color-2);
  font-weight: 500;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .input-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .preview-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .preview-label {
    min-width: auto;
  }
}
</style>
