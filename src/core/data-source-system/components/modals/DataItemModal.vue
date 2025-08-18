<!--
  数据项配置弹窗
  从 DataSourceConfigForm.vue 拆分出来的主弹窗组件
  负责数据项的添加和编辑功能
-->
<template>
  <n-modal
    v-model:show="visible"
    preset="dialog"
    :title="isEditMode ? '编辑数据项' : '添加数据项'"
    style="width: 1400px"
    @after-leave="handleModalClose"
  >
    <n-grid :cols="2" :x-gap="12">
      <!-- 左侧：数据获取区域 -->
      <n-grid-item>
        <DataAcquisitionPanel
          v-model:type="formData.type"
          v-model:name="formData.name"
          v-model:jsonData="formData.jsonData"
          v-model:httpConfig="formData.httpConfig"
          v-model:websocketConfig="formData.websocketConfig"
          @data-updated="handleDataUpdated"
          @validation-changed="handleValidationChanged"
        />
      </n-grid-item>

      <!-- 右侧：数据处理区域 -->
      <n-grid-item>
        <DataProcessingPanel
          v-model:filterPath="formData.filterPath"
          v-model:processScript="formData.processScript"
          :original-data="previewData.original"
          @processed-data-updated="handleProcessedDataUpdated"
        />
      </n-grid-item>
    </n-grid>

    <template #action>
      <n-space :size="12" justify="end">
        <n-button size="medium" @click="handleCancel">取消</n-button>
        <n-button size="medium" type="primary" :disabled="!isFormValid" :loading="submitting" @click="handleConfirm">
          {{ isEditMode ? '保存修改' : '确认添加' }}
        </n-button>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
/**
 * 数据项配置弹窗
 * 重构后的独立弹窗组件，大幅减少主组件代码量
 */

import { ref, reactive, computed, watch, nextTick } from 'vue'
import { NModal, NGrid, NGridItem, NSpace, NButton } from 'naive-ui'

// 导入拆分的子面板组件
import DataAcquisitionPanel from './panels/DataAcquisitionPanel.vue'
import DataProcessingPanel from './panels/DataProcessingPanel.vue'

// 数据项类型定义
export type RawDataItemType = 'json' | 'http' | 'websocket'

// 数据项接口
export interface RawDataItem {
  id: string
  name: string
  type: RawDataItemType
  data: any
  config?: {
    jsonData?: string
    httpConfig?: {
      url: string
      method: string
      headers?: Record<string, string>
    }
    websocketConfig?: {
      url: string
      protocols?: string[]
    }
    filterPath?: string
    processScript?: string
  }
  createdAt: string
  isActive: boolean
}

// HTTP配置接口
interface HttpConfig {
  url: string
  method: string
  headers: string
}

// WebSocket配置接口
interface WebSocketConfig {
  url: string
  protocols: string
}

// 表单数据接口
interface FormData {
  name: string
  type: RawDataItemType
  jsonData: string
  httpConfig: HttpConfig
  websocketConfig: WebSocketConfig
  filterPath: string
  processScript: string
}

// Props 定义
interface Props {
  modelValue: boolean
  editItem?: RawDataItem | null
}

// Emits 定义
interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', item: RawDataItem): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  editItem: null
})

const emit = defineEmits<Emits>()

// ========== 响应式数据 ==========

/** 弹窗显示状态 */
const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

/** 是否为编辑模式 */
const isEditMode = computed(() => !!props.editItem)

/** 提交中状态 */
const submitting = ref(false)

/** 表单数据 */
const formData = reactive<FormData>({
  name: '',
  type: 'json',
  jsonData: '',
  httpConfig: {
    url: '',
    method: 'GET',
    headers: ''
  },
  websocketConfig: {
    url: '',
    protocols: ''
  },
  filterPath: '',
  processScript: ''
})

/** 预览数据 */
const previewData = reactive({
  original: {},
  processed: {}
})

/** 验证状态 */
const validationState = ref({
  nameValid: false,
  dataValid: false,
  configValid: true
})

// ========== 计算属性 ==========

/** 表单是否有效 */
const isFormValid = computed(() => {
  return (
    formData.name.trim() !== '' &&
    validationState.value.nameValid &&
    validationState.value.dataValid &&
    validationState.value.configValid
  )
})

// ========== 监听器 ==========

/** 监听编辑项变化，初始化表单 */
watch(
  () => props.editItem,
  newItem => {
    if (newItem) {
      initializeFormForEdit(newItem)
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

/** 监听弹窗显示状态 */
watch(visible, show => {
  if (show) {
    nextTick(() => {
      if (props.editItem) {
        initializeFormForEdit(props.editItem)
      } else {
        resetForm()
        initializeDefaultData()
      }
    })
  }
})

// ========== 方法 ==========

/**
 * 初始化编辑表单
 */
function initializeFormForEdit(item: RawDataItem): void {
  formData.name = item.name
  formData.type = item.type

  // 根据类型初始化对应的配置
  switch (item.type) {
    case 'json':
      formData.jsonData = item.config?.jsonData || JSON.stringify(item.data, null, 2)
      break
    case 'http':
      if (item.config?.httpConfig) {
        formData.httpConfig = {
          url: item.config.httpConfig.url || '',
          method: item.config.httpConfig.method || 'GET',
          headers: item.config.httpConfig.headers ? JSON.stringify(item.config.httpConfig.headers) : ''
        }
      }
      break
    case 'websocket':
      if (item.config?.websocketConfig) {
        formData.websocketConfig = {
          url: item.config.websocketConfig.url || '',
          protocols: item.config.websocketConfig.protocols ? item.config.websocketConfig.protocols.join(',') : ''
        }
      }
      break
  }

  // 初始化处理配置
  formData.filterPath = item.config?.filterPath || ''
  formData.processScript = item.config?.processScript || ''

  console.log('🔧 [DataItemModal] 初始化编辑表单:', { item, formData })
}

/**
 * 重置表单
 */
function resetForm(): void {
  formData.name = ''
  formData.type = 'json'
  formData.jsonData = ''
  formData.httpConfig = {
    url: '',
    method: 'GET',
    headers: ''
  }
  formData.websocketConfig = {
    url: '',
    protocols: ''
  }
  formData.filterPath = ''
  formData.processScript = ''

  // 重置预览数据
  previewData.original = {}
  previewData.processed = {}

  // 重置验证状态
  validationState.value = {
    nameValid: false,
    dataValid: false,
    configValid: true
  }
}

/**
 * 初始化默认数据
 */
function initializeDefaultData(): void {
  // 设置默认JSON数据
  formData.jsonData = `{
  "name": "张三",
  "age": 25,
  "email": "zhangsan@example.com"
}`

  // 设置默认处理脚本
  formData.processScript = `// 示例：把第一个key变成username
var keys = Object.keys(data);
if (keys.length > 0) {
  var firstKey = keys[0];
  var firstValue = data[firstKey];
  delete data[firstKey];
  data.username = firstValue;
}
return data;`

  // 验证名称
  if (formData.name.trim()) {
    validationState.value.nameValid = true
  }
}

/**
 * 生成新的数据项
 */
function generateNewDataItem(): RawDataItem {
  const now = new Date().toISOString()
  const id = `raw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  // 根据类型生成数据和配置
  let data: any = {}
  let config: any = {
    filterPath: formData.filterPath.trim() || undefined,
    processScript: formData.processScript.trim() || undefined
  }

  switch (formData.type) {
    case 'json':
      try {
        data = formData.jsonData.trim() ? JSON.parse(formData.jsonData) : {}
      } catch {
        data = {}
      }
      config.jsonData = formData.jsonData
      break

    case 'http':
      data = {
        url: formData.httpConfig.url || '',
        method: formData.httpConfig.method || 'GET',
        status: 'ready',
        lastFetch: null
      }
      config.httpConfig = {
        url: formData.httpConfig.url,
        method: formData.httpConfig.method,
        headers: formData.httpConfig.headers ? JSON.parse(formData.httpConfig.headers || '{}') : {}
      }
      break

    case 'websocket':
      data = {
        url: formData.websocketConfig.url || '',
        protocols: formData.websocketConfig.protocols
          ? formData.websocketConfig.protocols.split(',').map(p => p.trim())
          : [],
        readyState: 'connecting',
        lastMessage: null
      }
      config.websocketConfig = {
        url: formData.websocketConfig.url,
        protocols: formData.websocketConfig.protocols
          ? formData.websocketConfig.protocols.split(',').map(p => p.trim())
          : []
      }
      break
  }

  return {
    id,
    name: formData.name.trim(),
    type: formData.type,
    data,
    config,
    createdAt: now,
    isActive: false
  }
}

/**
 * 更新现有数据项
 */
function updateExistingDataItem(item: RawDataItem): RawDataItem {
  const updatedItem = { ...item }

  // 更新基本信息
  updatedItem.name = formData.name.trim()
  updatedItem.type = formData.type

  // 根据类型更新数据和配置
  let data: any = {}
  let config: any = {
    filterPath: formData.filterPath.trim() || undefined,
    processScript: formData.processScript.trim() || undefined
  }

  switch (formData.type) {
    case 'json':
      try {
        data = formData.jsonData.trim() ? JSON.parse(formData.jsonData) : {}
      } catch {
        data = {}
      }
      config.jsonData = formData.jsonData
      break

    case 'http':
      data = {
        url: formData.httpConfig.url || '',
        method: formData.httpConfig.method || 'GET',
        status: 'ready',
        lastFetch: null
      }
      config.httpConfig = {
        url: formData.httpConfig.url,
        method: formData.httpConfig.method,
        headers: formData.httpConfig.headers ? JSON.parse(formData.httpConfig.headers || '{}') : {}
      }
      break

    case 'websocket':
      data = {
        url: formData.websocketConfig.url || '',
        protocols: formData.websocketConfig.protocols
          ? formData.websocketConfig.protocols.split(',').map(p => p.trim())
          : [],
        readyState: 'connecting',
        lastMessage: null
      }
      config.websocketConfig = {
        url: formData.websocketConfig.url,
        protocols: formData.websocketConfig.protocols
          ? formData.websocketConfig.protocols.split(',').map(p => p.trim())
          : []
      }
      break
  }

  updatedItem.data = data
  updatedItem.config = config

  return updatedItem
}

// ========== 事件处理器 ==========

/**
 * 处理数据更新
 */
function handleDataUpdated(data: any): void {
  previewData.original = data
  console.log('📥 [DataItemModal] 原始数据已更新:', data)
}

/**
 * 处理验证状态变化
 */
function handleValidationChanged(validation: any): void {
  validationState.value = { ...validationState.value, ...validation }
  console.log('✅ [DataItemModal] 验证状态已更新:', validationState.value)
}

/**
 * 处理处理后数据更新
 */
function handleProcessedDataUpdated(data: any): void {
  previewData.processed = data
  console.log('⚙️ [DataItemModal] 处理后数据已更新:', data)
}

/**
 * 处理确认
 */
async function handleConfirm(): Promise<void> {
  if (!isFormValid.value) {
    console.warn('⚠️ [DataItemModal] 表单验证未通过')
    return
  }

  submitting.value = true

  try {
    let resultItem: RawDataItem

    if (isEditMode.value && props.editItem) {
      resultItem = updateExistingDataItem(props.editItem)
      console.log('✏️ [DataItemModal] 更新数据项:', resultItem)
    } else {
      resultItem = generateNewDataItem()
      console.log('➕ [DataItemModal] 创建数据项:', resultItem)
    }

    emit('confirm', resultItem)
    visible.value = false
  } catch (error) {
    console.error('❌ [DataItemModal] 处理确认失败:', error)
    window.$message?.error('操作失败：' + (error instanceof Error ? error.message : String(error)))
  } finally {
    submitting.value = false
  }
}

/**
 * 处理取消
 */
function handleCancel(): void {
  emit('cancel')
  visible.value = false
}

/**
 * 处理弹窗关闭
 */
function handleModalClose(): void {
  resetForm()
}
</script>

<style scoped>
/* 弹窗样式优化 */
.data-item-modal {
  /* 自定义样式可以在这里添加 */
}

/* 响应式设计 */
@media (max-width: 1440px) {
  :deep(.n-modal) {
    width: 95vw !important;
    max-width: 1200px;
  }
}

@media (max-width: 768px) {
  :deep(.n-modal) {
    width: 98vw !important;
  }

  :deep(.n-grid) {
    display: flex;
    flex-direction: column;
  }

  :deep(.n-grid-item) {
    width: 100% !important;
  }
}
</style>
