<template>
  <div class="base-api-form">
    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="top"
      size="small"
      require-mark-placement="right-hanging"
    >
      <!-- 表单内容插槽 -->
      <slot name="form-content" :form-data="formData" :update-form="updateForm" />

      <!-- 操作按钮 -->
      <div class="form-actions">
        <n-space>
          <n-button type="primary" :loading="isLoading" :disabled="!canSubmit" @click="handleSubmit">
            {{ submitText }}
          </n-button>
          <n-button :disabled="isLoading" @click="handleReset">重置</n-button>
          <n-button v-if="showTestButton" :loading="isTesting" :disabled="!canSubmit" @click="handleTest">
            测试
          </n-button>
        </n-space>
      </div>
    </n-form>

    <!-- 错误信息显示 -->
    <template v-if="errorMessage">
      <n-alert type="error" :title="errorMessage" class="error-alert" />
    </template>

    <!-- 成功信息显示 -->
    <template v-if="successMessage">
      <n-alert type="success" :title="successMessage" class="success-alert" />
    </template>

    <!-- 数据预览 -->
    <template v-if="showDataPreview && responseData">
      <n-card size="small" class="data-preview">
        <template #header>
          <div class="preview-header">
            <span>数据预览</span>
            <n-button size="tiny" text @click="copyToClipboard">复制</n-button>
          </div>
        </template>
        <div class="preview-content">
          <pre>{{ JSON.stringify(responseData, null, 2) }}</pre>
        </div>
      </n-card>
    </template>

    <!-- 加载状态 -->
    <template v-if="isLoading">
      <div class="loading-overlay">
        <n-spin size="medium">
          <template #description>
            <span>正在处理...</span>
          </template>
        </n-spin>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { NForm, NButton, NSpace, NAlert, NCard, NSpin } from 'naive-ui'
import type { FormRules } from 'naive-ui'

interface Props {
  modelValue: Record<string, any>
  rules?: FormRules
  submitText?: string
  showTestButton?: boolean
  showDataPreview?: boolean
  canSubmit?: boolean
}

interface Emits {
  'update:modelValue': [value: Record<string, any>]
  submit: [data: Record<string, any>]
  test: [data: Record<string, any>]
  reset: []
}

const props = withDefaults(defineProps<Props>(), {
  submitText: '提交',
  showTestButton: false,
  showDataPreview: true,
  canSubmit: true
})

const emit = defineEmits<Emits>()

// 响应式数据
const formRef = ref<any>(null)
const formData = ref<Record<string, any>>({ ...props.modelValue })
const formRules = ref<FormRules>(props.rules || {})
const isLoading = ref(false)
const isTesting = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const responseData = ref<any>(null)

// 监听外部数据变化
watch(
  () => props.modelValue,
  newValue => {
    formData.value = { ...newValue }
  },
  { deep: true }
)

// 监听规则变化
watch(
  () => props.rules,
  newRules => {
    formRules.value = newRules || {}
  },
  { deep: true }
)

// 更新表单数据
const updateForm = (key: string, value: any) => {
  formData.value[key] = value
  emit('update:modelValue', { ...formData.value })
}

// 表单验证
const validateForm = async (): Promise<boolean> => {
  try {
    await formRef.value?.validate()
    return true
  } catch (errors) {
    console.error('表单验证失败:', errors)
    return false
  }
}

// 提交处理
const handleSubmit = async () => {
  if (!props.canSubmit) return

  const isValid = await validateForm()
  if (!isValid) return

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    emit('submit', { ...formData.value })
  } catch (error) {
    console.error('提交失败:', error)
    errorMessage.value = '提交失败，请重试'
  } finally {
    isLoading.value = false
  }
}

// 测试处理
const handleTest = async () => {
  if (!props.canSubmit) return

  const isValid = await validateForm()
  if (!isValid) return

  isTesting.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    emit('test', { ...formData.value })
  } catch (error) {
    console.error('测试失败:', error)
    errorMessage.value = '测试失败，请重试'
  } finally {
    isTesting.value = false
  }
}

// 重置处理
const handleReset = () => {
  formRef.value?.restoreValidation()
  formData.value = { ...props.modelValue }
  emit('update:modelValue', { ...formData.value })
  emit('reset')

  errorMessage.value = ''
  successMessage.value = ''
  responseData.value = null
}

// 复制到剪贴板
const copyToClipboard = async () => {
  try {
    const text = JSON.stringify(responseData.value, null, 2)
    await navigator.clipboard.writeText(text)
    successMessage.value = '数据已复制到剪贴板'
    setTimeout(() => {
      successMessage.value = ''
    }, 2000)
  } catch (error) {
    console.error('复制失败:', error)
    errorMessage.value = '复制失败，请手动复制'
  }
}

// 设置响应数据
const setResponseData = (data: any) => {
  responseData.value = data
}

// 设置错误信息
const setErrorMessage = (message: string) => {
  errorMessage.value = message
}

// 设置成功信息
const setSuccessMessage = (message: string) => {
  successMessage.value = message
}

// 暴露方法给父组件
defineExpose({
  validateForm,
  setResponseData,
  setErrorMessage,
  setSuccessMessage,
  formData: computed(() => formData.value)
})
</script>

<style scoped>
.base-api-form {
  position: relative;
  width: 100%;
}

.form-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

.error-alert,
.success-alert {
  margin-top: 12px;
}

.data-preview {
  margin-top: 12px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-content {
  max-height: 300px;
  overflow-y: auto;
}

.preview-content pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: #333;
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #e9ecef;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
</style>
