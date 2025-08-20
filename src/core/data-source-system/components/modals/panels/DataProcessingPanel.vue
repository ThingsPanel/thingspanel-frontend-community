<!--
  数据处理面板
  从 DataItemModal 拆分的右侧面板，负责数据过滤和脚本处理
  包含过滤路径、处理脚本、处理结果预览
-->
<template>
  <n-space vertical :size="4">
    <n-text strong style="font-size: 13px; color: var(--success-color)">⚙️ 数据处理</n-text>

    <!-- 处理配置区域 -->
    <n-card size="small" :bordered="false" style="background: var(--hover-color); margin: 2px 0">
      <template #header>
        <n-text depth="2" style="font-size: 11px">处理配置</n-text>
      </template>

      <n-space vertical :size="3">
        <!-- 过滤路径 -->
        <n-form-item label="过滤路径" size="small" :label-width="60" style="margin-bottom: 2px">
          <n-input
            v-model:value="localFilterPath"
            placeholder="$.data.list"
            clearable
            size="small"
            @input="handleFilterPathChange"
          />
        </n-form-item>

        <!-- 处理脚本 -->
        <n-form-item size="small" :label-width="60" style="margin-bottom: 0">
          <template #label>
            <n-space :size="2" align="center">
              <span style="font-size: 11px">处理脚本</span>
              <n-tooltip placement="top" trigger="hover">
                <template #trigger>
                  <n-icon size="10" style="color: var(--info-color); cursor: help">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                      <path
                        d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                      <path
                        d="M12 17h.01"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </n-icon>
                </template>
                <div style="max-width: 260px">
                  <div style="font-weight: 600; margin-bottom: 4px; font-size: 11px">📝 脚本编写指南</div>
                  <div style="font-size: 10px; line-height: 1.2">
                    <p style="margin: 2px 0">
                      <strong>可用变量：</strong>
                      <br />
                      • data - 输入数据
                    </p>
                    <p style="margin: 2px 0">
                      <strong>常用操作：</strong>
                      <br />
                      • 修改字段：data.newField = data.oldField
                      <br />
                      • 删除字段：delete data.fieldName
                      <br />
                      • 返回结果：return data
                    </p>
                    <p style="margin: 2px 0">
                      <strong>注意：</strong>
                      使用 var 定义变量
                    </p>
                  </div>
                </div>
              </n-tooltip>
            </n-space>
          </template>

          <!-- JavaScript编辑器组件 -->
          <div style="width: 100%">
            <JavaScriptEditor
              v-model:value="localProcessScript"
              :height="200"
              @change="handleScriptChange"
              @validation-changed="handleScriptValidationChanged"
            />
          </div>
        </n-form-item>
      </n-space>
    </n-card>

    <!-- 处理结果区域 -->
    <n-card size="small" :bordered="false" style="background: var(--hover-color); margin: 2px 0">
      <template #header>
        <n-space justify="space-between" align="center" style="margin: 0">
          <n-text depth="2" style="font-size: 11px">处理结果</n-text>
          <n-tag :type="processingStatus.type" size="small" style="font-size: 10px">
            {{ processingStatus.text }}
          </n-tag>
        </n-space>
      </template>

      <n-space vertical :size="2">
        <n-code
          :code="processedDataPreview"
          language="json"
          style="max-height: 250px; overflow-y: auto; font-size: 10px"
          :show-line-numbers="false"
        />

        <!-- 处理状态消息 -->
        <div v-if="processingStatus.message" style="margin-top: 2px">
          <n-text depth="3" style="font-size: 10px">
            {{ processingStatus.message }}
          </n-text>
        </div>
      </n-space>
    </n-card>
  </n-space>
</template>

<script setup lang="ts">
/**
 * 数据处理面板
 * 负责数据过滤路径配置、JavaScript脚本处理和结果预览
 */

import { ref, computed, watch, nextTick } from 'vue'
import { NSpace, NText, NCard, NFormItem, NInput, NTooltip, NIcon, NCode, NTag } from 'naive-ui'

// 导入编辑器组件
import JavaScriptEditor from '../editors/JavaScriptEditor.vue'

// 导入脚本引擎
import { defaultScriptEngine } from '@/core/script-engine'

// Props 定义
interface Props {
  filterPath: string
  processScript: string
  originalData: any
}

// Emits 定义
interface Emits {
  (e: 'update:filterPath', value: string): void
  (e: 'update:processScript', value: string): void
  (e: 'processedDataUpdated', data: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ========== 响应式数据 ==========

/** 本地数据绑定 */
const localFilterPath = computed({
  get: () => props.filterPath,
  set: value => emit('update:filterPath', value)
})

const localProcessScript = computed({
  get: () => props.processScript,
  set: value => emit('update:processScript', value)
})

/** 处理后的数据预览 */
const processedDataPreview = ref('{}')

/** 处理状态 */
const processingStatus = ref({
  type: 'default' as const,
  text: '等待处理',
  message: ''
})

/** 脚本验证状态 */
const scriptValidation = ref({
  isValid: true,
  error: ''
})

// ========== 监听器 ==========

/** 监听原始数据、过滤路径、处理脚本变化 */
watch(
  [() => props.originalData, localFilterPath, localProcessScript],
  () => {
    processData()
  },
  { immediate: true, deep: true }
)

// ========== 方法 ==========

/**
 * 处理数据
 */
async function processData(): Promise<void> {
  try {
    let processedData = props.originalData || {}

    // 1. 应用数据过滤
    if (localFilterPath.value?.trim()) {
      try {
        processedData = applyDataFilter(processedData, localFilterPath.value)
        console.log('🔍 [DataProcessingPanel] 过滤后数据:', processedData)
      } catch (error) {
        console.warn('⚠️ [DataProcessingPanel] 数据过滤失败:', error)
        processingStatus.value = {
          type: 'warning',
          text: '过滤警告',
          message: '过滤路径可能有误，使用原始数据'
        }
      }
    }

    // 2. 应用处理脚本
    if (localProcessScript.value?.trim() && scriptValidation.value.isValid) {
      try {
        processedData = await applyProcessScript(processedData, localProcessScript.value)
        processingStatus.value = {
          type: 'success',
          text: '处理成功',
          message: '数据已处理完成'
        }
        console.log('⚙️ [DataProcessingPanel] 脚本处理后数据:', processedData)
      } catch (error) {
        console.error('❌ [DataProcessingPanel] 脚本处理失败:', error)
        processingStatus.value = {
          type: 'error',
          text: '脚本错误',
          message: '脚本执行失败：' + (error instanceof Error ? error.message : String(error))
        }
      }
    } else if (!localProcessScript.value?.trim()) {
      processingStatus.value = {
        type: 'info',
        text: '无脚本',
        message: '未设置处理脚本，使用过滤后数据'
      }
    } else if (!scriptValidation.value.isValid) {
      processingStatus.value = {
        type: 'error',
        text: '脚本无效',
        message: scriptValidation.value.error
      }
    }

    processedDataPreview.value = JSON.stringify(processedData, null, 2)

    // 发送处理后数据
    emit('processedDataUpdated', processedData)
  } catch (error) {
    console.error('❌ [DataProcessingPanel] 数据处理失败:', error)
    processingStatus.value = {
      type: 'error',
      text: '处理错误',
      message: '数据处理失败'
    }
    processedDataPreview.value = '{"error": "处理失败"}'
    emit('processedDataUpdated', null)
  }
}

/**
 * 应用数据过滤路径
 */
function applyDataFilter(data: any, filterPath: string): any {
  if (!filterPath || filterPath.trim() === '') return data

  try {
    // 简单的JSONPath实现
    let current = data
    let cleanPath = filterPath.replace(/^\$\.?/, '').trim()

    if (!cleanPath) return data

    // 按点分割，但要处理数组索引
    const parts = cleanPath.split(/\.|\[|\]/).filter(part => part !== '')

    for (const part of parts) {
      if (current === null || current === undefined) return null

      // 处理数组索引
      if (/^\d+$/.test(part)) {
        const index = parseInt(part)
        if (Array.isArray(current) && index >= 0 && index < current.length) {
          current = current[index]
        } else {
          return null
        }
      } else {
        // 处理对象属性
        if (typeof current === 'object' && current !== null && part in current) {
          current = current[part]
        } else {
          return null
        }
      }
    }

    return current
  } catch (error) {
    console.warn('🔧 [DataProcessingPanel] 过滤路径解析失败:', error)
    return data // 失败时返回原数据
  }
}

/**
 * 应用处理脚本
 */
async function applyProcessScript(data: any, script: string): Promise<any> {
  if (!script || script.trim() === '') return data

  try {
    console.log('🔧 [DataProcessingPanel] 执行脚本:', script.substring(0, 100))

    // 创建数据的深拷贝，避免修改原始数据
    const dataCopy = JSON.parse(JSON.stringify(data))

    // 使用脚本引擎执行
    const result = await defaultScriptEngine.execute(script, { data: dataCopy })

    if (result.success) {
      console.log('✅ [DataProcessingPanel] 脚本执行成功')
      return result.data
    } else {
      console.error('❌ [DataProcessingPanel] 脚本执行失败:', result.error)
      throw new Error(result.error)
    }
  } catch (error) {
    console.error('❌ [DataProcessingPanel] 脚本执行异常:', error)
    throw error
  }
}

// ========== 事件处理器 ==========

/**
 * 处理过滤路径变化
 */
function handleFilterPathChange(): void {
  // 过滤路径变化已通过computed处理，会触发watch
}

/**
 * 处理脚本变化
 */
function handleScriptChange(): void {
  // 脚本变化已通过computed处理，会触发watch
}

/**
 * 处理脚本验证变化
 */
function handleScriptValidationChanged(validation: { isValid: boolean; error: string }): void {
  scriptValidation.value = validation

  // 如果脚本无效，立即更新状态
  if (!validation.isValid) {
    processingStatus.value = {
      type: 'error',
      text: '脚本无效',
      message: validation.error
    }
  } else {
    // 脚本有效，重新处理数据
    nextTick(() => {
      processData()
    })
  }
}

// ========== 初始化 ==========

// 组件挂载时处理数据
nextTick(() => {
  processData()
})
</script>

<style scoped>
/* 数据处理面板样式 */
.data-processing-panel {
  width: 100%;
}

/* 表单项样式优化 */
.processing-form :deep(.n-form-item) {
  margin-bottom: 8px;
}

.processing-form :deep(.n-form-item-label) {
  font-size: 11px;
  color: var(--text-color-2);
}

/* 工具提示样式 */
.script-tooltip {
  max-width: 300px;
}

.script-tooltip .tooltip-title {
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-color);
}

.script-tooltip .tooltip-content {
  font-size: 11px;
  line-height: 1.4;
  color: var(--text-color-2);
}

/* 结果预览区域 */
.result-preview {
  background: var(--card-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

/* 状态标签样式 */
.status-tag {
  font-size: 10px;
  padding: 2px 6px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .processing-form :deep(.n-form-item) {
    margin-bottom: 12px;
  }

  .processing-form :deep(.n-form-item-label) {
    font-size: 12px;
  }

  .script-tooltip {
    max-width: 250px;
  }
}

/* 明暗主题适配 */
[data-theme='dark'] .result-preview {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme='light'] .result-preview {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.08);
}
</style>
