<template>
  <div class="simple-data-mapping-form">
    <!-- V5动态化配置面板 -->
    <n-collapse :default-expanded-names="getDefaultExpandedNames()">
      <!-- 静态参数配置区域 -->
      <n-collapse-item
        v-if="effectiveDefinition.staticParams && effectiveDefinition.staticParams.length > 0"
        title="静态参数"
        name="static"
      >
        <div class="static-params-section">
          <n-form label-placement="left" label-width="120px" size="small">
            <!-- 遍历静态参数定义，生成对应的表单项 -->
            <n-form-item v-for="param in effectiveDefinition.staticParams" :key="param.key" :label="param.name">
              <!-- 根据参数类型渲染不同的表单控件 -->
              <component
                :is="getFormComponentForParam(param)"
                :value="getStaticParamValue(param.key)"
                v-bind="getFormComponentProps(param)"
                @update:value="updateStaticParam(param.key, $event)"
              />

              <!-- 参数描述 -->
              <template v-if="param.description" #feedback>
                <n-text depth="3" style="font-size: 12px">{{ param.description }}</n-text>
              </template>
            </n-form-item>
          </n-form>
        </div>
      </n-collapse-item>

      <!-- 数据源配置区域 -->
      <n-collapse-item
        v-for="(dataSourceReq, index) in effectiveDefinition.dataSources"
        :key="dataSourceReq.key"
        :title="`数据源 ${index + 1}: ${dataSourceReq.name}`"
        :name="`dataSource-${index}`"
      >
        <div class="data-source-section">
          <n-space vertical>
            <!-- 数据源描述 -->
            <n-alert v-if="dataSourceReq.description" type="info" size="small">
              {{ dataSourceReq.description }}
            </n-alert>

            <!-- 数据源选择器 -->
            <n-form-item label="数据源类型">
              <n-select
                :value="getDataSourceBinding(dataSourceReq.key)?.dataSourceType || 'static'"
                :options="getSupportedDataSourceOptions(dataSourceReq)"
                placeholder="请选择数据源类型"
                @update:value="updateDataSourceType(dataSourceReq.key, $event)"
              />
            </n-form-item>

            <!-- 字段映射配置 -->
            <div v-if="dataSourceReq.fieldMappings" class="field-mappings">
              <n-text strong>字段映射配置</n-text>
              <n-divider style="margin: 8px 0" />

              <n-form label-placement="left" label-width="100px" size="small">
                <n-form-item
                  v-for="(mapping, fieldKey) in dataSourceReq.fieldMappings"
                  :key="fieldKey"
                  :label="mapping.targetField"
                >
                  <n-input
                    :value="getFieldMapping(dataSourceReq.key, fieldKey)"
                    :placeholder="`映射到: ${mapping.targetField}${mapping.required ? ' (必填)' : ''}`"
                    @update:value="updateFieldMapping(dataSourceReq.key, fieldKey, $event)"
                  />
                  <template v-if="mapping.defaultValue !== undefined" #feedback>
                    <n-text depth="3" style="font-size: 12px">
                      默认值: {{ JSON.stringify(mapping.defaultValue) }}
                    </n-text>
                  </template>
                </n-form-item>
              </n-form>
            </div>
          </n-space>
        </div>
      </n-collapse-item>

      <!-- 向后兼容：如果没有新的定义结构，显示旧的JSON输入界面 -->
      <n-collapse-item
        v-if="!effectiveDefinition.staticParams && !effectiveDefinition.dataSources && componentRequirements"
        title="JSON数据输入（兼容模式）"
        name="legacy"
      >
        <LegacyJsonInputSection
          v-model:arrayData="arrayJsonData"
          v-model:objectData="objectJsonData"
          @array-change="handleArrayDataChange"
          @object-change="handleObjectDataChange"
        />
      </n-collapse-item>
    </n-collapse>

    <!-- V5应用配置按钮 -->
    <div class="actions-section">
      <n-space>
        <n-button type="primary" :loading="applying" @click="applyConfiguration">
          <template #icon>
            <n-icon><CheckmarkOutline /></n-icon>
          </template>
          应用配置到组件
        </n-button>

        <n-button @click="resetConfiguration">
          <template #icon>
            <n-icon><RefreshOutline /></n-icon>
          </template>
          重置配置
        </n-button>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 简洁的数据映射配置表单
 * 专门为数据映射测试组件设计的简洁配置界面
 */

import { ref, computed, reactive, watch } from 'vue'
import {
  NCard,
  NInput,
  NButton,
  NSpace,
  NIcon,
  NText,
  NTag,
  NCollapse,
  NCollapseItem,
  NForm,
  NFormItem,
  NInputNumber,
  NSwitch,
  NSelect,
  NAlert,
  NDivider,
  useMessage
} from 'naive-ui'
import {
  ListOutline,
  CodeWorkingOutline,
  DocumentTextOutline,
  CheckmarkOutline,
  RefreshOutline
} from '@vicons/ionicons5'

interface Props {
  // V5重构：接收完整的组件定义而不是零散的props
  definition?: any // 完整的组件定义，包含staticParams和dataSources
  modelValue?: any // 完整的组件配置对象
  // 向后兼容的字段
  componentRequirements?: any
  selectedWidget?: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'config-update', config: any): void
  (e: 'preview-update', preview: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const message = useMessage()

// V5重构：获取有效的组件定义（向后兼容）
const effectiveDefinition = computed(() => {
  // 优先使用新的definition，fallback到componentRequirements
  return props.definition || props.componentRequirements || {}
})

// V5重构：配置对象的响应式代理
const configuration = computed({
  get: () => props.modelValue || {},
  set: value => {
    emit('update:modelValue', value)
  }
})

// 初始化配置结构
const initializeConfiguration = () => {
  const config = configuration.value
  if (!config.staticParams) {
    config.staticParams = {}
  }
  if (!config.dataSourceBindings) {
    config.dataSourceBindings = {}
  }
  configuration.value = { ...config }
}

// V5新增函数：动态配置相关
const getDefaultExpandedNames = () => {
  const names = []
  if (effectiveDefinition.value.staticParams?.length > 0) {
    names.push('static')
  }
  if (effectiveDefinition.value.dataSources?.length > 0) {
    names.push('dataSource-0')
  }
  if (!effectiveDefinition.value.staticParams && !effectiveDefinition.value.dataSources) {
    names.push('legacy')
  }
  return names
}

// 静态参数相关函数
const getStaticParamValue = (key: string) => {
  return (
    configuration.value.staticParams?.[key] ??
    effectiveDefinition.value.staticParams?.find(p => p.key === key)?.defaultValue
  )
}

const updateStaticParam = (key: string, value: any) => {
  const config = { ...configuration.value }
  if (!config.staticParams) {
    config.staticParams = {}
  }
  config.staticParams[key] = value
  configuration.value = config
  emit('config-update', config)
}

const getFormComponentForParam = (param: any) => {
  switch (param.type) {
    case 'string':
      return param.ui?.component === 'textarea' ? 'n-input' : 'n-input'
    case 'number':
      return 'n-input-number'
    case 'boolean':
      return 'n-switch'
    default:
      return 'n-input'
  }
}

const getFormComponentProps = (param: any) => {
  const props: any = {
    placeholder: param.ui?.placeholder || `请输入${param.name}`,
    size: 'small'
  }

  if (param.type === 'string' && param.ui?.component === 'textarea') {
    props.type = 'textarea'
    props.rows = 3
  }

  if (param.type === 'number') {
    props.min = param.validation?.min
    props.max = param.validation?.max
  }

  if (param.validation?.options) {
    // 如果有选项，使用选择器
    return {
      ...props,
      options: param.validation.options.map(opt => ({
        label: opt.label,
        value: opt.value
      }))
    }
  }

  return props
}

// 数据源相关函数
const getDataSourceBinding = (key: string) => {
  const currentConfig = configuration.value || {}

  // 确保配置对象结构完整
  if (!currentConfig.dataSourceBindings) {
    currentConfig.dataSourceBindings = {}
  }

  if (!currentConfig.dataSourceBindings[key]) {
    currentConfig.dataSourceBindings[key] = {
      dataSourceId: '',
      dataSourceType: 'static',
      fieldMappings: {}
    }
  }

  // 更新配置
  configuration.value = currentConfig

  // 返回绑定对象，确保不为 undefined
  return (
    currentConfig.dataSourceBindings[key] || {
      dataSourceId: '',
      dataSourceType: 'static',
      fieldMappings: {}
    }
  )
}

const updateDataSourceType = (key: string, type: string) => {
  const config = { ...configuration.value }
  if (!config.dataSourceBindings) {
    config.dataSourceBindings = {}
  }
  if (!config.dataSourceBindings[key]) {
    config.dataSourceBindings[key] = { dataSourceId: '', fieldMappings: {} }
  }
  config.dataSourceBindings[key].dataSourceType = type
  configuration.value = config
  emit('config-update', config)
}

const getSupportedDataSourceOptions = (dataSourceReq: any) => {
  const defaultOptions = [
    { label: '静态数据', value: 'static' },
    { label: 'API接口', value: 'api' },
    { label: 'WebSocket', value: 'websocket' }
  ]

  if (dataSourceReq.supportedTypes?.length > 0) {
    return defaultOptions.filter(opt => dataSourceReq.supportedTypes.includes(opt.value))
  }

  return defaultOptions
}

const getFieldMapping = (dataSourceKey: string, fieldKey: string) => {
  return configuration.value.dataSourceBindings?.[dataSourceKey]?.fieldMappings?.[fieldKey] || ''
}

const updateFieldMapping = (dataSourceKey: string, fieldKey: string, value: string) => {
  const config = { ...configuration.value }
  if (!config.dataSourceBindings) {
    config.dataSourceBindings = {}
  }
  if (!config.dataSourceBindings[dataSourceKey]) {
    config.dataSourceBindings[dataSourceKey] = { dataSourceId: '', fieldMappings: {} }
  }
  if (!config.dataSourceBindings[dataSourceKey].fieldMappings) {
    config.dataSourceBindings[dataSourceKey].fieldMappings = {}
  }
  config.dataSourceBindings[dataSourceKey].fieldMappings[fieldKey] = value
  configuration.value = config
  emit('config-update', config)
}

// 响应式数据（保持向后兼容）
const arrayJsonData = ref('')
const objectJsonData = ref('')
const applying = ref(false)

const pathMappings = reactive({
  arrayMappings: {
    field1Path: '',
    field2Path: '',
    field3Path: ''
  },
  objectMappings: {
    fieldAPath: '',
    fieldBPath: '',
    fieldCPath: ''
  }
})

// 解析后的JSON数据
const parsedArrayData = ref<any>(null)
const parsedObjectData = ref<any>(null)

// 计算属性
const arrayDataValid = computed(() => {
  if (!arrayJsonData.value.trim()) return false
  try {
    const parsed = JSON.parse(arrayJsonData.value)
    return Array.isArray(parsed)
  } catch {
    return false
  }
})

const objectDataValid = computed(() => {
  if (!objectJsonData.value.trim()) return false
  try {
    const parsed = JSON.parse(objectJsonData.value)
    return typeof parsed === 'object' && !Array.isArray(parsed)
  } catch {
    return false
  }
})

const canApplyConfig = computed(() => {
  return arrayDataValid.value && objectDataValid.value
})

// JSON路径解析函数
const getValueByPath = (obj: any, path: string): any => {
  if (!path || !obj) return null

  try {
    // 处理数组路径 [0].name -> 0.name
    let cleanPath = path.replace(/\[(\d+)\]/g, '$1')
    if (cleanPath.startsWith('.')) cleanPath = cleanPath.slice(1)

    const keys = cleanPath.split('.')
    let current = obj

    for (const key of keys) {
      if (key === '') continue
      if (current === null || current === undefined) return null

      // 如果是数字，尝试作为数组索引
      if (/^\d+$/.test(key)) {
        const index = parseInt(key)
        current = Array.isArray(current) ? current[index] : current[key]
      } else {
        current = current[key]
      }

      if (current === undefined) return null
    }

    return current
  } catch (error) {
    console.warn('路径解析失败:', path, error)
    return null
  }
}

// 预览值获取
const getPreviewValue = (dataType: 'array' | 'object', fieldKey: string): string => {
  let data, path

  if (dataType === 'array') {
    data = parsedArrayData.value
    path = pathMappings.arrayMappings[`${fieldKey}Path` as keyof typeof pathMappings.arrayMappings]
  } else {
    data = parsedObjectData.value
    path = pathMappings.objectMappings[`${fieldKey}Path` as keyof typeof pathMappings.objectMappings]
  }

  if (!data || !path) return '未配置'

  const value = getValueByPath(data, path)
  if (value === null || value === undefined) return '路径无效'

  return typeof value === 'object' ? JSON.stringify(value) : String(value)
}

const getPreviewType = (dataType: 'array' | 'object', fieldKey: string) => {
  const previewValue = getPreviewValue(dataType, fieldKey)
  if (previewValue === '未配置') return 'default'
  if (previewValue === '路径无效') return 'error'
  return 'success'
}

// 事件处理
const handleArrayDataChange = () => {
  if (arrayDataValid.value) {
    try {
      parsedArrayData.value = JSON.parse(arrayJsonData.value)
    } catch {
      parsedArrayData.value = null
    }
  } else {
    parsedArrayData.value = null
  }
}

const handleObjectDataChange = () => {
  if (objectDataValid.value) {
    try {
      parsedObjectData.value = JSON.parse(objectJsonData.value)
    } catch {
      parsedObjectData.value = null
    }
  } else {
    parsedObjectData.value = null
  }
}

const handleMappingChange = () => {
  // 实时更新预览
  emitPreviewUpdate()
}

const formatArrayJson = () => {
  if (arrayDataValid.value) {
    try {
      const parsed = JSON.parse(arrayJsonData.value)
      arrayJsonData.value = JSON.stringify(parsed, null, 2)
    } catch {
      message.error('JSON格式错误，无法格式化')
    }
  }
}

const formatObjectJson = () => {
  if (objectDataValid.value) {
    try {
      const parsed = JSON.parse(objectJsonData.value)
      objectJsonData.value = JSON.stringify(parsed, null, 2)
    } catch {
      message.error('JSON格式错误，无法格式化')
    }
  }
}

const loadArraySample = () => {
  arrayJsonData.value = JSON.stringify(
    [
      { name: '设备1', value: 25.6, status: 'online', id: 'dev001' },
      { name: '设备2', value: 30.2, status: 'offline', id: 'dev002' },
      { name: '设备3', value: 28.1, status: 'online', id: 'dev003' }
    ],
    null,
    2
  )
  handleArrayDataChange()
}

const loadObjectSample = () => {
  objectJsonData.value = JSON.stringify(
    {
      user: { name: '张三', age: 25, role: 'admin' },
      device: { id: 'dev001', temp: 23.5, humidity: 65 },
      location: { city: '北京', area: '朝阳区', building: 'A座' }
    },
    null,
    2
  )
  handleObjectDataChange()
}

// V5更新：应用配置函数
const applyConfiguration = async () => {
  applying.value = true
  try {
    // 发送新的配置结构
    emit('config-update', configuration.value)
    message.success('配置已应用到组件')
  } catch (error) {
    message.error('应用配置失败')
  } finally {
    applying.value = false
  }
}

// V5更新：重置配置函数
const resetConfiguration = () => {
  const resetConfig = {
    staticParams: {},
    dataSourceBindings: {}
  }

  // 重置静态参数为默认值
  if (effectiveDefinition.value.staticParams) {
    effectiveDefinition.value.staticParams.forEach(param => {
      resetConfig.staticParams[param.key] = param.defaultValue
    })
  }

  // 重置数据源绑定
  if (effectiveDefinition.value.dataSources) {
    effectiveDefinition.value.dataSources.forEach(dataSource => {
      resetConfig.dataSourceBindings[dataSource.key] = {
        dataSourceId: '',
        dataSourceType: 'static',
        fieldMappings: {}
      }
    })
  }

  configuration.value = resetConfig

  // 向后兼容：重置旧数据
  arrayJsonData.value = ''
  objectJsonData.value = ''
  if (pathMappings) {
    Object.assign(pathMappings.arrayMappings, {
      field1Path: '',
      field2Path: '',
      field3Path: ''
    })
    Object.assign(pathMappings.objectMappings, {
      fieldAPath: '',
      fieldBPath: '',
      fieldCPath: ''
    })
  }

  message.info('配置已重置')
}

const emitPreviewUpdate = () => {
  const preview = {
    arrayMappedValues: {
      field1: getPreviewValue('array', 'field1'),
      field2: getPreviewValue('array', 'field2'),
      field3: getPreviewValue('array', 'field3')
    },
    objectMappedValues: {
      fieldA: getPreviewValue('object', 'fieldA'),
      fieldB: getPreviewValue('object', 'fieldB'),
      fieldC: getPreviewValue('object', 'fieldC')
    }
  }

  emit('preview-update', preview)
}

// 监听外部数据变化，初始化表单
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && typeof newValue === 'object') {
      console.log('🔄 [SimpleDataMappingForm] 接收到外部数据:', newValue)

      // 恢复JSON数据
      if (newValue.arrayDataSource) {
        arrayJsonData.value = JSON.stringify(newValue.arrayDataSource, null, 2)
        parsedArrayData.value = newValue.arrayDataSource
      }

      if (newValue.objectDataSource) {
        objectJsonData.value = JSON.stringify(newValue.objectDataSource, null, 2)
        parsedObjectData.value = newValue.objectDataSource
      }

      // 恢复路径映射
      if (newValue.arrayMappings) {
        Object.assign(pathMappings.arrayMappings, newValue.arrayMappings)
      }

      if (newValue.objectMappings) {
        Object.assign(pathMappings.objectMappings, newValue.objectMappings)
      }

      console.log('✅ [SimpleDataMappingForm] 表单数据已恢复')
    }
  },
  { immediate: true, deep: true }
)

// V5重构：初始化配置结构
initializeConfiguration()

// 监听数据变化
watch([parsedArrayData, parsedObjectData, pathMappings], emitPreviewUpdate, { deep: true })

// 监听配置变化，同步更新
watch(
  configuration,
  newConfig => {
    emit('config-update', newConfig)
  },
  { deep: true }
)
</script>

<style scoped>
.simple-data-mapping-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.requirements-card {
  border: 1px solid var(--border-color);
}

.requirements-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
}

.requirements-summary {
  font-size: 12px;
  color: var(--text-color-2);
}

.json-card,
.mapping-card {
  border: 1px solid var(--border-color);
}

.json-input-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mapping-groups {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.mapping-group {
  padding: 12px;
  background: var(--hover-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.group-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
  margin: 0 0 12px 0;
}

.mapping-fields {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mapping-item {
  display: grid;
  grid-template-columns: 60px 1fr 120px;
  gap: 8px;
  align-items: center;
}

.field-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color-2);
  text-align: right;
}

.preview-value {
  font-size: 11px;
}

.preview-value .n-tag {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.actions-section {
  padding-top: 8px;
  border-top: 1px solid var(--divider-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mapping-item {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .field-label {
    text-align: left;
  }

  .preview-value {
    justify-self: start;
  }
}
</style>
