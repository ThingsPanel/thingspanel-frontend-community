<template>
  <div class="alert-status-v2-setting">
    <n-form
      ref="formRef"
      :model="localConfig"
      :rules="rules"
      label-placement="left"
      label-width="auto"
      class="setting-form"
    >
      <!-- 标题配置 -->
      <n-form-item label="标题" path="title">
        <n-input
          v-model:value="localConfig.title"
          placeholder="请输入标题"
          @update:value="handleConfigChange"
        />
      </n-form-item>

      <!-- 金额配置 -->
      <n-form-item label="金额" path="amount">
        <n-input-number
          v-model:value="localConfig.amount"
          placeholder="请输入金额"
          :min="0"
          :precision="2"
          @update:value="handleConfigChange"
        />
      </n-form-item>

      <!-- 状态配置 -->
      <n-form-item label="状态" path="status">
        <n-select
          v-model:value="localConfig.status"
          placeholder="请选择状态"
          :options="statusOptions"
          @update:value="handleConfigChange"
        />
      </n-form-item>

      <!-- 描述配置 -->
      <n-form-item label="描述" path="description">
        <n-input
          v-model:value="localConfig.description"
          type="textarea"
          placeholder="请输入描述"
          :autosize="{ minRows: 2, maxRows: 4 }"
          @update:value="handleConfigChange"
        />
      </n-form-item>

      <!-- 预览区域 -->
      <n-divider>预览效果</n-divider>
      <div class="preview-section">
        <div class="preview-item">
          <span class="preview-label">标题:</span>
          <span class="preview-value">{{ localConfig.title || '未设置' }}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">金额:</span>
          <span class="preview-value">{{ localConfig.amount || 0 }}</span>
        </div>
        <div class="preview-item">
          <span class="preview-label">状态:</span>
          <span class="preview-value" :class="`status-${localConfig.status}`">
            {{ localConfig.status || '正常' }}
          </span>
        </div>
        <div class="preview-item">
          <span class="preview-label">描述:</span>
          <span class="preview-value">{{ localConfig.description || '无描述' }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <n-button @click="resetToDefault">重置为默认值</n-button>
        <n-button type="primary" @click="applyConfig">应用配置</n-button>
      </div>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * 告警状态V2组件配置表单
 * 标准4属性配置界面
 */

import { ref, reactive, watch, onMounted } from 'vue'
import {
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NButton,
  NDivider,
  useMessage,
  type FormInst,
  type FormRules
} from 'naive-ui'
import type { AlertStatusV2Customize } from './settingConfig'

interface Props {
  modelValue: AlertStatusV2Customize
}

interface Emits {
  (e: 'update:modelValue', value: AlertStatusV2Customize): void
  (e: 'change', value: AlertStatusV2Customize): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const message = useMessage()
const formRef = ref<FormInst | null>(null)

// 本地配置状态
const localConfig = reactive<AlertStatusV2Customize>({
  title: '告警状态',
  amount: 0,
  status: '正常',
  description: '系统运行正常',
  ...props.modelValue
})

// 状态选项
const statusOptions = [
  { label: '正常', value: '正常' },
  { label: '警告', value: '警告' },
  { label: '错误', value: '错误' },
  { label: '离线', value: '离线' }
]

// 表单验证规则
const rules: FormRules = {
  title: [
    { required: true, message: '请输入标题', trigger: 'blur' },
    { min: 1, max: 50, message: '标题长度应在1-50个字符之间', trigger: 'blur' }
  ],
  amount: [
    { type: 'number', min: 0, message: '金额不能为负数', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ],
  description: [
    { max: 200, message: '描述长度不能超过200个字符', trigger: 'blur' }
  ]
}

// 监听外部配置变化
watch(
  () => props.modelValue,
  (newValue) => {
    Object.assign(localConfig, {
      title: '告警状态',
      amount: 0,
      status: '正常',
      description: '系统运行正常',
      ...newValue
    })
  },
  { deep: true, immediate: true }
)

// 配置变化处理
const handleConfigChange = () => {
  // 实时更新
  emit('update:modelValue', { ...localConfig })
  emit('change', { ...localConfig })
}

// 重置为默认值
const resetToDefault = () => {
  const defaultConfig: AlertStatusV2Customize = {
    title: '告警状态',
    amount: 0,
    status: '正常',
    description: '系统运行正常'
  }

  Object.assign(localConfig, defaultConfig)
  handleConfigChange()
  message.info('已重置为默认值')
}

// 应用配置
const applyConfig = async () => {
  try {
    await formRef.value?.validate()
    emit('update:modelValue', { ...localConfig })
    emit('change', { ...localConfig })
    message.success('配置已应用')
  } catch (error) {
    message.error('配置验证失败，请检查输入')
  }
}

onMounted(() => {
  console.log('🔥 [alert-status-v2-setting] 配置表单初始化:', localConfig)
})
</script>

<style scoped>
.alert-status-v2-setting {
  padding: 16px;
}

.setting-form {
  max-width: 100%;
}

.preview-section {
  padding: 12px;
  background: var(--code-color);
  border-radius: 6px;
  margin-bottom: 16px;
}

.preview-item {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}

.preview-item:last-child {
  margin-bottom: 0;
}

.preview-label {
  font-size: 12px;
  color: var(--text-color-2);
  min-width: 50px;
  font-weight: 500;
}

.preview-value {
  font-size: 13px;
  color: var(--text-color-1);
  padding: 2px 6px;
  background: var(--input-color);
  border-radius: 3px;
  border: 1px solid var(--border-color);
}

.status-正常 {
  color: var(--success-color);
  border-color: var(--success-color);
}

.status-警告 {
  color: var(--warning-color);
  border-color: var(--warning-color);
}

.status-错误 {
  color: var(--error-color);
  border-color: var(--error-color);
}

.status-离线 {
  color: var(--text-color-3);
  border-color: var(--text-color-3);
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.actions .n-button {
  min-width: 80px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .alert-status-v2-setting {
    padding: 12px;
  }

  .preview-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .preview-label {
    min-width: auto;
  }

  .preview-value {
    width: 100%;
  }

  .actions {
    flex-direction: column;
  }
}
</style>