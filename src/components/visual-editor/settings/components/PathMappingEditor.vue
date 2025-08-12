<template>
  <div class="path-mapping-editor">
    <!-- 编辑器头部 -->
    <div class="editor-header">
      <div class="header-info">
        <n-icon size="16" class="header-icon">
          <LinkOutline />
        </n-icon>
        <span class="header-title">字段映射配置</span>
        <n-tag v-if="mappingRules.length > 0" type="info" size="small">{{ mappingRules.length }} 个映射</n-tag>
      </div>

      <n-space size="small">
        <n-button
          size="small"
          :disabled="!sourceData || mappingRules.length === 0"
          type="primary"
          ghost
          @click="previewMapping"
        >
          <template #icon>
            <n-icon><EyeOutline /></n-icon>
          </template>
          预览结果
        </n-button>
        <n-button size="small" type="primary" @click="addMappingRule">
          <template #icon>
            <n-icon><AddOutline /></n-icon>
          </template>
          添加映射
        </n-button>
      </n-space>
    </div>

    <!-- 目标字段信息显示 -->
    <div v-if="targetFields && targetFields.length > 0" class="target-fields-info">
      <div class="info-header">
        <n-icon size="14"><LocationOutline /></n-icon>
        <span class="info-title">目标字段要求</span>
      </div>
      <div class="fields-grid">
        <div v-for="field in targetFields" :key="field.name" class="target-field-item">
          <div class="field-header">
            <span class="field-name">{{ field.name }}</span>
            <n-tag size="tiny" :type="getFieldTypeColor(field.type)">
              {{ field.type }}
            </n-tag>
            <n-tag v-if="field.required" type="error" size="tiny">必填</n-tag>
          </div>
          <n-text depth="3" class="field-description">{{ field.description }}</n-text>
        </div>
      </div>
    </div>

    <!-- 映射规则列表 -->
    <div class="mapping-rules-section">
      <div v-if="mappingRules.length === 0" class="empty-state">
        <n-empty size="small" description="暂无映射规则">
          <template #icon>
            <LinkOutline />
          </template>
          <template #extra>
            <n-button size="small" type="primary" @click="addMappingRule">创建第一个映射</n-button>
          </template>
        </n-empty>
      </div>

      <div v-else class="rules-list">
        <div
          v-for="(rule, index) in mappingRules"
          :key="rule.id || index"
          class="mapping-rule-item"
          :class="{ 'rule-disabled': !rule.enabled }"
        >
          <!-- 规则头部 -->
          <div class="rule-header">
            <div class="rule-info">
              <n-space align="center" size="small">
                <n-switch v-model:value="rule.enabled" size="small" @update:value="() => updateMappingRule(index)" />
                <span class="rule-title">映射规则 {{ index + 1 }}</span>
                <n-tag v-if="getValidationStatus(rule).isValid === false" type="error" size="tiny">无效</n-tag>
                <n-tag v-else-if="getValidationStatus(rule).isValid === true" type="success" size="tiny">有效</n-tag>
              </n-space>
            </div>

            <n-space size="small">
              <n-button size="tiny" :disabled="!sourceData || !rule.enabled" ghost @click="testMappingRule(index)">
                <template #icon>
                  <n-icon size="12"><PlayOutline /></n-icon>
                </template>
                测试
              </n-button>
              <n-button size="tiny" type="error" ghost @click="removeMappingRule(index)">
                <template #icon>
                  <n-icon size="12"><TrashOutline /></n-icon>
                </template>
              </n-button>
            </n-space>
          </div>

          <!-- 规则配置内容 -->
          <div class="rule-content">
            <div class="rule-form">
              <!-- 目标字段选择 -->
              <div class="form-row">
                <div class="form-item">
                  <label class="form-label">目标字段</label>
                  <n-select
                    v-model:value="rule.targetField"
                    :options="targetFieldOptions"
                    placeholder="选择目标字段"
                    class="field-select"
                    @update:value="() => updateMappingRule(index)"
                  />
                </div>
              </div>

              <!-- 源数据路径 -->
              <div class="form-row">
                <div class="form-item full-width">
                  <label class="form-label">
                    源数据路径
                    <n-tooltip trigger="hover" placement="top">
                      <template #trigger>
                        <n-icon size="12" class="help-icon"><HelpOutline /></n-icon>
                      </template>
                      <div class="tooltip-content">
                        <p>支持复杂路径解析，例如：</p>
                        <ul>
                          <li>
                            <code>name</code>
                            - 直接属性
                          </li>
                          <li>
                            <code>user.profile.name</code>
                            - 嵌套对象
                          </li>
                          <li>
                            <code>items[0].value</code>
                            - 数组元素
                          </li>
                          <li>
                            <code>data[0].sensors[1].reading</code>
                            - 复杂嵌套
                          </li>
                        </ul>
                      </div>
                    </n-tooltip>
                  </label>
                  <n-input
                    v-model:value="rule.sourcePath"
                    placeholder="例如：data[0].sensor.value 或 user.profile.name"
                    :status="getPathValidationStatus(rule.sourcePath)"
                    class="path-input"
                    @update:value="() => updateMappingRule(index)"
                  />
                  <div v-if="!isValidPath(rule.sourcePath) && rule.sourcePath" class="path-error">
                    <n-text depth="3" class="error-text">路径格式无效</n-text>
                  </div>
                </div>
              </div>

              <!-- 默认值和转换器 -->
              <div class="form-row">
                <div class="form-item">
                  <label class="form-label">默认值</label>
                  <n-input
                    v-model:value="rule.defaultValue"
                    placeholder="字段不存在时的默认值"
                    size="small"
                    @update:value="() => updateMappingRule(index)"
                  />
                </div>
                <div class="form-item">
                  <label class="form-label">
                    数据转换
                    <n-tooltip trigger="hover" placement="top">
                      <template #trigger>
                        <n-icon size="12" class="help-icon"><HelpOutline /></n-icon>
                      </template>
                      <div class="tooltip-content">
                        <p>
                          JavaScript表达式，使用
                          <code>value</code>
                          变量：
                        </p>
                        <ul>
                          <li>
                            <code>value * 100</code>
                            - 数值乘以100
                          </li>
                          <li>
                            <code>value.toUpperCase()</code>
                            - 转大写
                          </li>
                          <li>
                            <code>new Date(value).toLocaleDateString()</code>
                            - 格式化日期
                          </li>
                        </ul>
                      </div>
                    </n-tooltip>
                  </label>
                  <n-input
                    v-model:value="rule.transformer"
                    placeholder="例如：value * 100"
                    size="small"
                    @update:value="() => updateMappingRule(index)"
                  />
                </div>
              </div>
            </div>

            <!-- 测试结果显示 -->
            <div v-if="rule.testResult" class="test-result">
              <div class="result-header">
                <n-icon size="12"><FlaskOutline /></n-icon>
                <span class="result-title">测试结果</span>
              </div>
              <div class="result-content">
                <div class="result-item">
                  <span class="result-label">提取值:</span>
                  <n-text class="result-value" :depth="rule.testResult.success ? 1 : 3">
                    {{ formatTestValue(rule.testResult.extractedValue) }}
                  </n-text>
                </div>
                <div v-if="rule.transformer" class="result-item">
                  <span class="result-label">转换后:</span>
                  <n-text class="result-value" :depth="rule.testResult.transformSuccess ? 1 : 3">
                    {{ formatTestValue(rule.testResult.transformedValue) }}
                  </n-text>
                </div>
                <div class="result-item">
                  <span class="result-label">最终值:</span>
                  <n-text class="result-value">
                    {{ formatTestValue(rule.testResult.finalValue) }}
                  </n-text>
                </div>
                <div v-if="rule.testResult.error" class="result-error">
                  <n-text depth="3" class="error-text">错误: {{ rule.testResult.error }}</n-text>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 映射预览弹窗 -->
    <n-modal v-model:show="showPreviewModal" title="映射预览结果" class="mapping-preview-modal">
      <n-card style="width: 700px" title="字段映射结果" :bordered="false" size="small">
        <div class="preview-content">
          <div class="preview-section">
            <h4 class="section-title">映射结果</h4>
            <div class="result-display">
              <pre class="result-json">{{ JSON.stringify(previewResult, null, 2) }}</pre>
            </div>
          </div>

          <div v-if="previewErrors.length > 0" class="preview-section">
            <h4 class="section-title error-title">映射错误</h4>
            <div class="error-list">
              <n-alert
                v-for="(error, index) in previewErrors"
                :key="index"
                type="error"
                size="small"
                :show-icon="false"
              >
                <strong>{{ error.field }}:</strong>
                {{ error.message }}
              </n-alert>
            </div>
          </div>
        </div>

        <template #footer>
          <n-space justify="end">
            <n-button @click="showPreviewModal = false">关闭</n-button>
            <n-button type="primary" :disabled="previewErrors.length > 0" @click="applyMappingResult">
              应用结果
            </n-button>
          </n-space>
        </template>
      </n-card>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
/**
 * 路径映射编辑器组件
 * 提供字段映射规则配置，支持复杂路径解析和数据转换
 */

import { ref, computed, watch, nextTick } from 'vue'
import {
  NButton,
  NIcon,
  NTag,
  NSpace,
  NEmpty,
  NSwitch,
  NSelect,
  NInput,
  NTooltip,
  NText,
  NModal,
  NCard,
  NAlert,
  SelectOption
} from 'naive-ui'
import {
  LinkOutline,
  EyeOutline,
  AddOutline,
  LocationOutline,
  PlayOutline,
  TrashOutline,
  HelpOutline,
  FlaskOutline
} from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'
import type {
  FieldMappingRule,
  ComponentFieldRequirement,
  MappingPreviewResult,
  FieldType
} from '../../core/data-source-config-types'
import { PathDataMapper } from '../../../../card2.1/core/data-binding/data-processors'

// 组件属性定义
interface Props {
  /** 映射规则 */
  modelValue: FieldMappingRule[]
  /** 目标字段定义 */
  targetFields?: ComponentFieldRequirement[]
  /** 源数据（用于测试映射） */
  sourceData?: any
  /** 是否只读 */
  readonly?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: FieldMappingRule[]): void
  (e: 'mapping-change', result: any): void
  (e: 'validation-change', isValid: boolean, errors: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  targetFields: () => [],
  readonly: false
})

const emit = defineEmits<Emits>()

// 国际化
const { t } = useI18n()

// 组件状态
const mappingRules = ref<FieldMappingRule[]>([...props.modelValue])
const showPreviewModal = ref(false)
const previewResult = ref<any>({})
const previewErrors = ref<Array<{ field: string; message: string }>>([])

// 测试结果接口
interface TestResult {
  success: boolean
  extractedValue: any
  transformedValue?: any
  transformSuccess?: boolean
  finalValue: any
  error?: string
}

// 计算属性
const targetFieldOptions = computed((): SelectOption[] => {
  return props.targetFields.map(field => ({
    label: `${field.name} (${field.type})`,
    value: field.name,
    disabled: mappingRules.value.some(rule => rule.targetField === field.name)
  }))
})

// 获取字段类型对应的颜色
const getFieldTypeColor = (type: FieldType) => {
  switch (type) {
    case 'string':
      return 'info'
    case 'number':
      return 'success'
    case 'boolean':
      return 'warning'
    case 'date':
      return 'error'
    default:
      return 'default'
  }
}

// 路径验证
const isValidPath = (path: string): boolean => {
  if (!path) return false

  // 基本路径格式验证
  const pathRegex = /^[a-zA-Z_$][a-zA-Z0-9_$]*(\.[a-zA-Z_$][a-zA-Z0-9_$]*|\[[0-9]+\])*$/
  return pathRegex.test(path)
}

const getPathValidationStatus = (path: string) => {
  if (!path) return undefined
  return isValidPath(path) ? 'success' : 'error'
}

// 获取规则验证状态
const getValidationStatus = (rule: FieldMappingRule) => {
  const errors: string[] = []

  if (!rule.targetField) {
    errors.push('目标字段不能为空')
  }

  if (!rule.sourcePath) {
    errors.push('源路径不能为空')
  } else if (!isValidPath(rule.sourcePath)) {
    errors.push('源路径格式无效')
  }

  return {
    isValid: errors.length === 0 ? true : errors.length > 0 ? false : null,
    errors
  }
}

// 格式化测试值显示
const formatTestValue = (value: any): string => {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return `"${value}"`
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// 数据提取方法（使用现有的PathDataMapper逻辑）
const extractValueByPath = (data: any, path: string): any => {
  try {
    const mapper = new PathDataMapper([
      {
        sourcePath: path,
        targetField: 'temp',
        type: 'direct',
        enabled: true
      }
    ])

    const result = mapper.map(data)
    return result.temp
  } catch (error) {
    return undefined
  }
}

// 数据转换方法
const transformValue = (value: any, transformer?: string): any => {
  if (!transformer) return value

  try {
    // 创建安全的转换函数
    const transformFn = new Function('value', `return ${transformer}`)
    return transformFn(value)
  } catch (error) {
    throw new Error(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 映射规则操作
const addMappingRule = () => {
  const newRule: FieldMappingRule = {
    targetField: '',
    sourcePath: '',
    enabled: true,
    defaultValue: undefined,
    transformer: undefined
  }

  mappingRules.value.push(newRule)
  updateMappingRules()
}

const removeMappingRule = (index: number) => {
  mappingRules.value.splice(index, 1)
  updateMappingRules()
}

const updateMappingRule = (index: number) => {
  // 触发响应式更新
  nextTick(() => {
    updateMappingRules()
  })
}

const updateMappingRules = () => {
  emit('update:modelValue', [...mappingRules.value])
  validateMappingRules()
}

// 验证所有映射规则
const validateMappingRules = () => {
  const errors: string[] = []

  mappingRules.value.forEach((rule, index) => {
    if (!rule.enabled) return

    const validation = getValidationStatus(rule)
    if (!validation.isValid) {
      errors.push(`规则 ${index + 1}: ${validation.errors.join(', ')}`)
    }
  })

  emit('validation-change', errors.length === 0, errors)
}

// 测试单个映射规则
const testMappingRule = (index: number) => {
  if (!props.sourceData) return

  const rule = mappingRules.value[index]
  const testResult: TestResult = {
    success: false,
    extractedValue: undefined,
    finalValue: undefined
  }

  try {
    // 提取值
    testResult.extractedValue = extractValueByPath(props.sourceData, rule.sourcePath)
    testResult.success = testResult.extractedValue !== undefined

    // 应用转换
    if (rule.transformer) {
      try {
        testResult.transformedValue = transformValue(testResult.extractedValue, rule.transformer)
        testResult.transformSuccess = true
      } catch (error) {
        testResult.transformedValue = testResult.extractedValue
        testResult.transformSuccess = false
        testResult.error = error instanceof Error ? error.message : '转换失败'
      }
    }

    // 确定最终值
    const finalValue = rule.transformer ? testResult.transformedValue : testResult.extractedValue
    testResult.finalValue = finalValue !== undefined ? finalValue : rule.defaultValue
  } catch (error) {
    testResult.error = error instanceof Error ? error.message : '测试失败'
  }

  // 添加测试结果到规则对象
  ;(rule as any).testResult = testResult
}

// 预览所有映射结果
const previewMapping = () => {
  if (!props.sourceData) return

  const result: any = {}
  const errors: Array<{ field: string; message: string }> = []

  mappingRules.value
    .filter(rule => rule.enabled)
    .forEach(rule => {
      try {
        // 提取值
        let value = extractValueByPath(props.sourceData, rule.sourcePath)

        // 应用转换
        if (rule.transformer && value !== undefined) {
          try {
            value = transformValue(value, rule.transformer)
          } catch (error) {
            errors.push({
              field: rule.targetField,
              message: `转换失败: ${error instanceof Error ? error.message : '未知错误'}`
            })
            return
          }
        }

        // 使用默认值
        if (value === undefined && rule.defaultValue !== undefined) {
          value = rule.defaultValue
        }

        result[rule.targetField] = value
      } catch (error) {
        errors.push({
          field: rule.targetField,
          message: error instanceof Error ? error.message : '映射失败'
        })
      }
    })

  previewResult.value = result
  previewErrors.value = errors
  showPreviewModal.value = true
}

// 应用映射结果
const applyMappingResult = () => {
  emit('mapping-change', previewResult.value)
  showPreviewModal.value = false
}

// 监听props变化
watch(
  () => props.modelValue,
  newValue => {
    if (JSON.stringify(newValue) !== JSON.stringify(mappingRules.value)) {
      mappingRules.value = [...newValue]
    }
  },
  { deep: true }
)

watch(
  () => mappingRules.value,
  () => {
    validateMappingRules()
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
.path-mapping-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* === 头部样式 === */
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--card-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-icon {
  color: var(--primary-color);
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

/* === 目标字段信息 === */
.target-fields-info {
  padding: 12px;
  background: var(--hover-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

.info-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.info-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
}

.target-field-item {
  padding: 8px;
  background: var(--card-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
}

.field-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.field-name {
  font-size: 12px;
  font-weight: 500;
  font-family: monospace;
  color: var(--text-color);
}

.field-description {
  font-size: 11px;
  line-height: 1.3;
}

/* === 映射规则区域 === */
.mapping-rules-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-state {
  padding: 32px;
  text-align: center;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* === 映射规则项 === */
.mapping-rule-item {
  background: var(--card-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  transition: opacity 0.2s ease;
}

.rule-disabled {
  opacity: 0.6;
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--hover-color);
  border-bottom: 1px solid var(--divider-color);
}

.rule-info {
  flex: 1;
}

.rule-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
}

.rule-content {
  padding: 16px;
}

/* === 表单样式 === */
.rule-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.form-item.full-width {
  flex: 1;
}

.form-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color-2);
  display: flex;
  align-items: center;
  gap: 4px;
}

.help-icon {
  color: var(--text-color-3);
  cursor: help;
}

.field-select,
.path-input {
  width: 100%;
}

.path-error {
  margin-top: 4px;
}

.error-text {
  font-size: 11px;
  color: var(--error-color);
}

/* === 测试结果区域 === */
.test-result {
  margin-top: 16px;
  padding: 12px;
  background: var(--info-color-suppl);
  border-radius: 4px;
  border: 1px solid var(--info-color-suppl);
}

.result-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.result-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color);
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.result-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-color-2);
  min-width: 60px;
}

.result-value {
  font-size: 11px;
  font-family: monospace;
  word-break: break-all;
}

.result-error {
  margin-top: 8px;
  padding: 6px;
  background: var(--error-color-suppl);
  border-radius: 3px;
}

/* === 预览弹窗样式 === */
.mapping-preview-modal :deep(.n-card) {
  max-height: 80vh;
}

.preview-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 500px;
  overflow-y: auto;
}

.preview-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-title.error-title {
  color: var(--error-color);
}

.result-display {
  background: var(--code-color);
  border-radius: 4px;
  border: 1px solid var(--border-color);
  overflow: hidden;
}

.result-json {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.4;
  margin: 0;
  padding: 12px;
  color: var(--text-color);
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 300px;
  overflow-y: auto;
}

.error-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* === Tooltip内容样式 === */
.tooltip-content {
  max-width: 300px;
}

.tooltip-content p {
  margin: 0 0 8px 0;
  font-size: 12px;
}

.tooltip-content ul {
  margin: 0;
  padding-left: 16px;
  font-size: 11px;
}

.tooltip-content li {
  margin-bottom: 4px;
}

.tooltip-content code {
  background: var(--code-color);
  padding: 1px 4px;
  border-radius: 2px;
  font-family: monospace;
  font-size: 11px;
}

/* === 响应式设计 === */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
  }

  .fields-grid {
    grid-template-columns: 1fr;
  }

  .rule-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .editor-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .result-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .result-label {
    min-width: auto;
  }
}

/* === 主题适配 === */
[data-theme='dark'] .mapping-rule-item {
  background: var(--card-color-dark);
  border-color: var(--border-color-dark);
}

[data-theme='dark'] .rule-header {
  background: var(--hover-color-dark);
  border-color: var(--divider-color-dark);
}

[data-theme='dark'] .target-field-item {
  background: var(--card-color-dark);
  border-color: var(--border-color-dark);
}
</style>
