<!--
  数据获取面板
  从 DataItemModal 拆分的左侧面板，负责数据源配置
  包含 JSON、HTTP、WebSocket 三种数据类型的配置
-->
<template>
  <n-space vertical :size="4">
    <n-text strong style="font-size: 13px; color: var(--primary-color)">📥 数据获取</n-text>

    <!-- 基本信息 -->
    <n-grid :cols="2" :x-gap="6">
      <n-grid-item>
        <n-form-item label="名称" size="small" :label-width="50">
          <n-input v-model:value="localName" placeholder="用户数据" clearable size="small" @input="handleNameChange" />
        </n-form-item>
      </n-grid-item>
      <n-grid-item>
        <n-form-item label="类型" size="small" :label-width="50">
          <n-space :size="4">
            <n-tag
              v-for="dataType in dataTypes"
              :key="dataType.value"
              :type="localType === dataType.value ? 'primary' : 'default'"
              :bordered="localType !== dataType.value"
              checkable
              :checked="localType === dataType.value"
              style="cursor: pointer; user-select: none"
              size="small"
              @click="handleTypeChange(dataType.value)"
            >
              {{ dataType.label }}
            </n-tag>
          </n-space>
        </n-form-item>
      </n-grid-item>
    </n-grid>

    <!-- 数据录入区域 -->
    <n-card size="small" :bordered="false" style="background: var(--hover-color); margin: 2px 0">
      <template #header>
        <n-text depth="2" style="font-size: 11px">数据录入</n-text>
      </template>

      <!-- JSON数据输入 -->
      <JsonDataInput
        v-if="localType === 'json'"
        v-model:value="localJsonData"
        @change="handleJsonDataChange"
        @validation-changed="handleJsonValidationChanged"
      />

      <!-- HTTP数据输入 -->
      <HttpDataInput
        v-else-if="localType === 'http'"
        v-model:value="localHttpConfig"
        @change="handleHttpConfigChange"
        @validation-changed="handleHttpValidationChanged"
      />

      <!-- WebSocket数据输入 -->
      <WebSocketDataInput
        v-else-if="localType === 'websocket'"
        v-model:value="localWebsocketConfig"
        @change="handleWebsocketConfigChange"
        @validation-changed="handleWebsocketValidationChanged"
      />
    </n-card>

    <!-- 原始数据预览区域 -->
    <n-card size="small" :bordered="false" style="background: var(--hover-color); margin: 2px 0">
      <template #header>
        <n-space justify="space-between" align="center">
          <n-text depth="2" style="font-size: 11px">原始数据预览</n-text>
          <n-tag :type="previewStatus.type" size="small" style="font-size: 10px">
            {{ previewStatus.text }}
          </n-tag>
        </n-space>
      </template>
      <n-code
        :code="previewData"
        language="json"
        style="max-height: 220px; overflow-y: auto; font-size: 10px"
        :show-line-numbers="false"
      />
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
/**
 * 数据获取面板
 * 负责 JSON、HTTP、WebSocket 数据源的配置和预览
 */

import { ref, computed, watch, nextTick } from 'vue'
import { NSpace, NText, NGrid, NGridItem, NFormItem, NInput, NTag, NCard, NCode } from 'naive-ui'

// 导入子组件
import JsonDataInput from './inputs/JsonDataInput.vue'
import HttpDataInput from './inputs/HttpDataInput.vue'
import WebSocketDataInput from './inputs/WebSocketDataInput.vue'

// 数据类型定义
export type RawDataItemType = 'json' | 'http' | 'websocket'

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

// Props 定义
interface Props {
  type: RawDataItemType
  name: string
  jsonData: string
  httpConfig: HttpConfig
  websocketConfig: WebSocketConfig
}

// Emits 定义
interface Emits {
  (e: 'update:type', value: RawDataItemType): void
  (e: 'update:name', value: string): void
  (e: 'update:jsonData', value: string): void
  (e: 'update:httpConfig', value: HttpConfig): void
  (e: 'update:websocketConfig', value: WebSocketConfig): void
  (e: 'dataUpdated', data: any): void
  (e: 'validationChanged', validation: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ========== 响应式数据 ==========

/** 数据类型选项 */
const dataTypes = [
  { value: 'json' as const, label: 'JSON' },
  { value: 'http' as const, label: 'HTTP' },
  { value: 'websocket' as const, label: 'WebSocket' }
]

/** 本地数据绑定 */
const localType = computed({
  get: () => props.type,
  set: value => emit('update:type', value)
})

const localName = computed({
  get: () => props.name,
  set: value => emit('update:name', value)
})

const localJsonData = computed({
  get: () => props.jsonData,
  set: value => emit('update:jsonData', value)
})

const localHttpConfig = computed({
  get: () => props.httpConfig,
  set: value => emit('update:httpConfig', value)
})

const localWebsocketConfig = computed({
  get: () => props.websocketConfig,
  set: value => emit('update:websocketConfig', value)
})

/** 预览数据 */
const previewData = ref('{}')

/** 预览状态 */
const previewStatus = ref({
  type: 'default' as const,
  text: '等待数据',
  message: ''
})

/** 验证状态 */
const validationState = ref({
  nameValid: false,
  dataValid: false,
  configValid: true
})

// ========== 监听器 ==========

/** 监听数据变化，更新预览 */
watch(
  [localType, localJsonData, localHttpConfig, localWebsocketConfig],
  () => {
    updatePreview()
  },
  { immediate: true, deep: true }
)

/** 监听名称变化 */
watch(localName, newName => {
  validationState.value.nameValid = newName.trim().length > 0
  emitValidationChanged()
})

// ========== 方法 ==========

/**
 * 更新数据预览
 */
function updatePreview(): void {
  try {
    let data: any = {}
    let isValid = false

    switch (localType.value) {
      case 'json':
        if (localJsonData.value.trim()) {
          try {
            data = JSON.parse(localJsonData.value)
            isValid = true
            previewStatus.value = { type: 'success', text: 'JSON有效', message: '数据解析成功' }
          } catch (error) {
            data = { error: 'JSON格式错误' }
            previewStatus.value = { type: 'error', text: 'JSON无效', message: 'JSON格式不正确' }
          }
        } else {
          data = {}
          previewStatus.value = { type: 'warning', text: '空数据', message: '请输入JSON数据' }
        }
        break

      case 'http':
        data = {
          type: 'http',
          url: localHttpConfig.value.url || '',
          method: localHttpConfig.value.method || 'GET',
          status: 'ready',
          message: 'HTTP配置已就绪'
        }
        isValid = !!localHttpConfig.value.url
        previewStatus.value = isValid
          ? { type: 'info', text: 'HTTP就绪', message: '请求配置已准备' }
          : { type: 'warning', text: 'URL缺失', message: '请输入请求URL' }
        break

      case 'websocket':
        data = {
          type: 'websocket',
          url: localWebsocketConfig.value.url || '',
          protocols: localWebsocketConfig.value.protocols
            ? localWebsocketConfig.value.protocols.split(',').map(p => p.trim())
            : [],
          status: 'ready',
          message: 'WebSocket配置已就绪'
        }
        isValid = !!localWebsocketConfig.value.url
        previewStatus.value = isValid
          ? { type: 'info', text: 'WebSocket就绪', message: '连接配置已准备' }
          : { type: 'warning', text: 'URL缺失', message: '请输入WebSocket URL' }
        break
    }

    previewData.value = JSON.stringify(data, null, 2)
    validationState.value.dataValid = isValid

    // 发送数据更新事件
    emit('dataUpdated', data)
    emitValidationChanged()
  } catch (error) {
    console.error('❌ [DataAcquisitionPanel] 预览更新失败:', error)
    previewData.value = '{"error": "预览失败"}'
    previewStatus.value = { type: 'error', text: '预览错误', message: '数据预览失败' }
    validationState.value.dataValid = false
    emitValidationChanged()
  }
}

/**
 * 发送验证状态变化
 */
function emitValidationChanged(): void {
  emit('validationChanged', {
    nameValid: validationState.value.nameValid,
    dataValid: validationState.value.dataValid,
    configValid: validationState.value.configValid
  })
}

// ========== 事件处理器 ==========

/**
 * 处理名称变化
 */
function handleNameChange(): void {
  // 名称变化已通过computed处理
}

/**
 * 处理类型变化
 */
function handleTypeChange(newType: RawDataItemType): void {
  if (newType !== localType.value) {
    localType.value = newType

    // 切换类型时重置验证状态
    validationState.value.dataValid = false
    validationState.value.configValid = true

    nextTick(() => {
      updatePreview()
    })
  }
}

/**
 * 处理JSON数据变化
 */
function handleJsonDataChange(): void {
  // JSON数据变化已通过computed处理，会触发watch
}

/**
 * 处理JSON验证变化
 */
function handleJsonValidationChanged(validation: any): void {
  validationState.value.dataValid = validation.isValid
  validationState.value.configValid = validation.isValid
  emitValidationChanged()
}

/**
 * 处理HTTP配置变化
 */
function handleHttpConfigChange(): void {
  // HTTP配置变化已通过computed处理，会触发watch
}

/**
 * 处理HTTP验证变化
 */
function handleHttpValidationChanged(validation: any): void {
  validationState.value.dataValid = validation.isValid
  validationState.value.configValid = validation.isValid
  emitValidationChanged()
}

/**
 * 处理WebSocket配置变化
 */
function handleWebsocketConfigChange(): void {
  // WebSocket配置变化已通过computed处理，会触发watch
}

/**
 * 处理WebSocket验证变化
 */
function handleWebsocketValidationChanged(validation: any): void {
  validationState.value.dataValid = validation.isValid
  validationState.value.configValid = validation.isValid
  emitValidationChanged()
}

// ========== 初始化 ==========

// 组件挂载时更新预览
nextTick(() => {
  updatePreview()
})
</script>

<style scoped>
/* 数据获取面板样式 */
.data-acquisition-panel {
  width: 100%;
}

/* 类型标签样式 */
.type-tags :deep(.n-tag) {
  transition: all 0.2s ease;
}

.type-tags :deep(.n-tag:hover) {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 输入组件容器 */
.input-container {
  min-height: 200px;
  display: flex;
  flex-direction: column;
}

/* 预览区域样式 */
.preview-area {
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.n-grid) {
    display: flex;
    flex-direction: column;
  }

  :deep(.n-grid-item) {
    width: 100% !important;
    margin-bottom: 8px;
  }

  .type-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
}

/* 明暗主题适配 */
[data-theme='dark'] .preview-area {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme='light'] .preview-area {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.08);
}
</style>
