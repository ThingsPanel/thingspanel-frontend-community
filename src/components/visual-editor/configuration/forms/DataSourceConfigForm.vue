<template>
  <div class="datasource-config-form">
    <n-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="left"
      label-width="auto"
      size="small"
      class="config-form"
    >
      <!-- 数据源类型选择 -->
      <div class="config-section">
        <h4 class="section-title">{{ $t('config.dataSource.type.section') }}</h4>

        <n-form-item :label="$t('config.dataSource.type')" path="type">
          <n-select
            v-model:value="formData.type"
            :options="dataSourceTypeOptions"
            :disabled="readonly"
            :placeholder="$t('config.dataSource.type.placeholder')"
            clearable
            @update:value="handleTypeChange"
          />
        </n-form-item>

        <div v-if="!formData.type" class="no-datasource-message">
          <n-alert type="info" size="small" :title="$t('config.dataSource.noTypeSelected')" closable>
            {{ $t('config.dataSource.noTypeSelectedDesc') }}
          </n-alert>
        </div>
      </div>

      <!-- 静态数据配置 -->
      <div v-if="formData.type === 'static'" class="config-section">
        <h4 class="section-title">{{ $t('config.dataSource.static.section') }}</h4>

        <n-form-item :label="$t('config.dataSource.static.data')" path="config.data">
          <n-input
            v-model:value="formData.config.data"
            type="textarea"
            :rows="6"
            :placeholder="$t('config.dataSource.static.data.placeholder')"
            :readonly="readonly"
            class="json-input"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item>
          <n-space>
            <n-button size="small" @click="formatJSON">
              {{ $t('config.dataSource.static.format') }}
            </n-button>
            <n-button size="small" @click="validateJSON">
              {{ $t('config.dataSource.static.validate') }}
            </n-button>
          </n-space>
        </n-form-item>
      </div>

      <!-- API数据源配置 -->
      <div v-if="formData.type === 'api'" class="config-section">
        <h4 class="section-title">{{ $t('config.dataSource.api.section') }}</h4>

        <n-form-item :label="$t('config.dataSource.api.url')" path="config.url">
          <n-input
            v-model:value="formData.config.url"
            :placeholder="$t('config.dataSource.api.url.placeholder')"
            :readonly="readonly"
            clearable
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item :label="$t('config.dataSource.api.method')" path="config.method">
          <n-select
            v-model:value="formData.config.method"
            :options="httpMethodOptions"
            :disabled="readonly"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item :label="$t('config.dataSource.api.headers')" path="config.headers">
          <n-input
            v-model:value="formData.config.headers"
            type="textarea"
            :rows="3"
            :placeholder="$t('config.dataSource.api.headers.placeholder')"
            :readonly="readonly"
            class="json-input"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item
          v-if="formData.config.method !== 'GET'"
          :label="$t('config.dataSource.api.body')"
          path="config.body"
        >
          <n-input
            v-model:value="formData.config.body"
            type="textarea"
            :rows="4"
            :placeholder="$t('config.dataSource.api.body.placeholder')"
            :readonly="readonly"
            class="json-input"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item>
          <n-button size="small" :loading="testing" @click="testApiConnection">
            {{ $t('config.dataSource.api.test') }}
          </n-button>
        </n-form-item>
      </div>

      <!-- WebSocket数据源配置 -->
      <div v-if="formData.type === 'websocket'" class="config-section">
        <h4 class="section-title">{{ $t('config.dataSource.websocket.section') }}</h4>

        <n-form-item :label="$t('config.dataSource.websocket.url')" path="config.url">
          <n-input
            v-model:value="formData.config.url"
            :placeholder="$t('config.dataSource.websocket.url.placeholder')"
            :readonly="readonly"
            clearable
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item :label="$t('config.dataSource.websocket.protocols')" path="config.protocols">
          <n-dynamic-tags
            v-model:value="formData.config.protocols"
            :disabled="readonly"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item :label="$t('config.dataSource.websocket.autoReconnect')" path="config.autoReconnect">
          <n-switch
            v-model:value="formData.config.autoReconnect"
            :disabled="readonly"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item
          v-if="formData.config.autoReconnect"
          :label="$t('config.dataSource.websocket.reconnectInterval')"
          path="config.reconnectInterval"
        >
          <n-input-number
            v-model:value="formData.config.reconnectInterval"
            :min="1000"
            :max="60000"
            :step="1000"
            :readonly="readonly"
            @update:value="handleConfigChange"
          >
            <template #suffix>ms</template>
          </n-input-number>
        </n-form-item>
      </div>

      <!-- 脚本数据源配置 -->
      <div v-if="formData.type === 'script'" class="config-section">
        <h4 class="section-title">{{ $t('config.dataSource.script.section') }}</h4>

        <n-form-item :label="$t('config.dataSource.script.code')" path="config.script">
          <n-input
            v-model:value="formData.config.script"
            type="textarea"
            :rows="8"
            :placeholder="$t('config.dataSource.script.code.placeholder')"
            :readonly="readonly"
            class="code-input"
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item>
          <n-space>
            <n-button size="small" :loading="testing" @click="testScript">
              {{ $t('config.dataSource.script.test') }}
            </n-button>
            <n-button size="small" @click="insertTemplate">
              {{ $t('config.dataSource.script.template') }}
            </n-button>
          </n-space>
        </n-form-item>
      </div>

      <!-- 设备数据源配置 -->
      <div v-if="formData.type === 'device'" class="config-section">
        <h4 class="section-title">{{ $t('config.dataSource.device.section') }}</h4>

        <n-form-item :label="$t('config.dataSource.device.deviceId')" path="config.deviceId">
          <n-input
            v-model:value="formData.config.deviceId"
            :placeholder="$t('config.dataSource.device.deviceId.placeholder')"
            :readonly="readonly"
            clearable
            @update:value="handleConfigChange"
          />
        </n-form-item>

        <n-form-item :label="$t('config.dataSource.device.metrics')" path="config.metrics">
          <n-dynamic-tags
            v-model:value="formData.config.metrics"
            :disabled="readonly"
            @update:value="handleConfigChange"
          />
        </n-form-item>
      </div>

      <!-- 高级配置 -->
      <div v-if="showAdvanced && formData.type" class="config-section advanced-section">
        <h4 class="section-title">{{ $t('config.dataSource.advanced.section') }}</h4>

        <n-form-item :label="$t('config.dataSource.refreshInterval')" path="refreshInterval">
          <n-input-number
            v-model:value="formData.refreshInterval"
            :min="1"
            :max="3600"
            :readonly="readonly"
            @update:value="handleChange"
          >
            <template #suffix>{{ $t('common.seconds') }}</template>
          </n-input-number>
        </n-form-item>

        <n-form-item :label="$t('config.dataSource.enableCache')" path="enableCache">
          <n-switch v-model:value="formData.enableCache" :disabled="readonly" @update:value="handleChange" />
        </n-form-item>

        <n-form-item v-if="formData.enableCache" :label="$t('config.dataSource.cacheTimeout')" path="cacheTimeout">
          <n-input-number
            v-model:value="formData.cacheTimeout"
            :min="1"
            :max="3600"
            :readonly="readonly"
            @update:value="handleChange"
          >
            <template #suffix>{{ $t('common.seconds') }}</template>
          </n-input-number>
        </n-form-item>

        <n-form-item :label="$t('config.dataSource.retryAttempts')" path="retryAttempts">
          <n-input-number
            v-model:value="formData.retryAttempts"
            :min="0"
            :max="10"
            :readonly="readonly"
            @update:value="handleChange"
          />
        </n-form-item>
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <n-space>
          <n-button size="small" @click="handleReset">
            {{ $t('common.reset') }}
          </n-button>
          <n-button v-if="showAdvanced !== undefined" size="small" @click="$emit('toggle-advanced')">
            {{ showAdvanced ? $t('config.hideAdvanced') : $t('config.showAdvanced') }}
          </n-button>
        </n-space>
      </div>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据源配置表单组件
 * 负责配置组件的数据源，支持多种数据源类型
 */

import { ref, reactive, watch, computed } from 'vue'
import {
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSwitch,
  NSelect,
  NDynamicTags,
  NButton,
  NSpace,
  NAlert,
  FormInst,
  FormRules,
  useMessage
} from 'naive-ui'
import type { DataSourceConfiguration, ConfigFormProps, ConfigFormEmits, ValidationResult } from '../types'

interface Props extends ConfigFormProps<DataSourceConfiguration | null> {
  /** 是否显示高级选项 */
  showAdvanced?: boolean
}

interface Emits extends ConfigFormEmits<DataSourceConfiguration | null> {
  (event: 'toggle-advanced'): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
  showAdvanced: false
})

const emit = defineEmits<Emits>()

// 消息提示
const message = useMessage()

// 表单引用
const formRef = ref<FormInst>()

// 测试状态
const testing = ref(false)

// 表单数据
const formData = reactive<DataSourceConfiguration>({
  type: props.modelValue?.type || null,
  config: { ...(props.modelValue?.config || {}) },
  refreshInterval: props.modelValue?.refreshInterval || 30,
  enableCache: props.modelValue?.enableCache || false,
  cacheTimeout: props.modelValue?.cacheTimeout || 300,
  retryAttempts: props.modelValue?.retryAttempts || 3
})

// 数据源类型选项
const dataSourceTypeOptions = [
  { label: '静态数据', value: 'static' },
  { label: 'API接口', value: 'api' },
  { label: 'WebSocket', value: 'websocket' },
  { label: '脚本生成', value: 'script' },
  { label: '设备数据', value: 'device' }
]

// HTTP方法选项
const httpMethodOptions = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' }
]

// 表单验证规则
const formRules: FormRules = {
  type: {
    required: false,
    message: '请选择数据源类型',
    trigger: 'change'
  },
  'config.url': {
    required: true,
    message: '请输入URL地址',
    trigger: 'blur',
    validator: (rule, value) => {
      if (formData.type === 'api' || formData.type === 'websocket') {
        if (!value) return Promise.reject(new Error('URL不能为空'))
        try {
          new URL(value)
          return Promise.resolve()
        } catch {
          return Promise.reject(new Error('URL格式不正确'))
        }
      }
      return Promise.resolve()
    }
  },
  'config.data': {
    required: true,
    message: '请输入静态数据',
    trigger: 'blur',
    validator: (rule, value) => {
      if (formData.type === 'static') {
        if (!value) return Promise.reject(new Error('静态数据不能为空'))
        try {
          JSON.parse(value)
          return Promise.resolve()
        } catch {
          return Promise.reject(new Error('JSON格式不正确'))
        }
      }
      return Promise.resolve()
    }
  },
  'config.script': {
    required: true,
    message: '请输入脚本代码',
    trigger: 'blur',
    validator: (rule, value) => {
      if (formData.type === 'script' && !value) {
        return Promise.reject(new Error('脚本代码不能为空'))
      }
      return Promise.resolve()
    }
  },
  'config.deviceId': {
    required: true,
    message: '请输入设备ID',
    trigger: 'blur',
    validator: (rule, value) => {
      if (formData.type === 'device' && !value) {
        return Promise.reject(new Error('设备ID不能为空'))
      }
      return Promise.resolve()
    }
  }
}

// 监听外部值变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && JSON.stringify(newValue) !== JSON.stringify(formData)) {
      Object.assign(formData, newValue)
    }
  },
  { deep: true }
)

// 处理数据源类型变化
const handleTypeChange = () => {
  // 清空配置
  formData.config = {}

  // 设置默认配置
  switch (formData.type) {
    case 'api':
      formData.config = {
        url: '',
        method: 'GET',
        headers: '{}',
        body: ''
      }
      break
    case 'websocket':
      formData.config = {
        url: '',
        protocols: [],
        autoReconnect: true,
        reconnectInterval: 5000
      }
      break
    case 'static':
      formData.config = {
        data: '{}'
      }
      break
    case 'script':
      formData.config = {
        script: ''
      }
      break
    case 'device':
      formData.config = {
        deviceId: '',
        metrics: []
      }
      break
  }

  handleChange()
}

// 处理配置变化
const handleConfigChange = () => {
  handleChange()
}

// 处理表单变化
const handleChange = () => {
  if (props.readonly) return

  // 验证表单
  formRef.value?.validate(async errors => {
    const validationResult: ValidationResult = {
      valid: !errors,
      errors: errors?.map(error => ({
        field: error.field || 'unknown',
        message: error.message || '验证失败',
        code: 'VALIDATION_ERROR'
      }))
    }

    emit('validate', validationResult)

    if (!errors) {
      // 发出配置更新事件
      const newConfig = formData.type ? { ...formData } : null
      emit('update:modelValue', newConfig)
      emit('change', newConfig, props.modelValue)
    }
  })
}

// JSON格式化
const formatJSON = () => {
  try {
    const parsed = JSON.parse(formData.config.data)
    formData.config.data = JSON.stringify(parsed, null, 2)
    message.success('JSON格式化成功')
  } catch (error) {
    message.error('JSON格式错误')
  }
}

// JSON验证
const validateJSON = () => {
  try {
    JSON.parse(formData.config.data)
    message.success('JSON格式正确')
  } catch (error) {
    message.error('JSON格式错误')
  }
}

// 测试API连接
const testApiConnection = async () => {
  testing.value = true
  try {
    // 这里应该调用实际的API测试逻辑
    await new Promise(resolve => setTimeout(resolve, 1000))
    message.success('API连接测试成功')
  } catch (error) {
    message.error('API连接测试失败')
  } finally {
    testing.value = false
  }
}

// 测试脚本
const testScript = async () => {
  testing.value = true
  try {
    // 这里应该调用实际的脚本测试逻辑
    await new Promise(resolve => setTimeout(resolve, 1000))
    message.success('脚本测试成功')
  } catch (error) {
    message.error('脚本测试失败')
  } finally {
    testing.value = false
  }
}

// 插入模板
const insertTemplate = () => {
  const template = `// 返回数据的函数
function generateData() {
  return {
    timestamp: Date.now(),
    value: Math.random() * 100,
    status: 'online'
  }
}

// 返回结果
return generateData()`

  formData.config.script = template
  handleConfigChange()
}

// 重置表单
const handleReset = () => {
  if (props.readonly) return

  Object.assign(formData, {
    type: null,
    config: {},
    refreshInterval: 30,
    enableCache: false,
    cacheTimeout: 300,
    retryAttempts: 3
  })

  emit('update:modelValue', null)
}

// 暴露验证方法
const validate = async (): Promise<ValidationResult> => {
  return new Promise(resolve => {
    formRef.value?.validate(errors => {
      resolve({
        valid: !errors,
        errors: errors?.map(error => ({
          field: error.field || 'unknown',
          message: error.message || '验证失败',
          code: 'VALIDATION_ERROR'
        }))
      })
    })
  })
}

// 暴露公共方法
defineExpose({
  validate,
  reset: handleReset
})
</script>

<style scoped>
.datasource-config-form {
  padding: 0;
}

.config-form {
  width: 100%;
}

.config-section {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.config-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
  margin: 0 0 12px 0;
}

.advanced-section {
  border-top: 1px dashed var(--border-color);
  padding-top: 16px;
}

.no-datasource-message {
  margin-top: 8px;
}

.json-input {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}

.code-input {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}

.form-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

/* 只读状态样式 */
.datasource-config-form :deep(.n-input[readonly]),
.datasource-config-form :deep(.n-input-number[readonly]),
.datasource-config-form :deep(.n-switch[disabled]),
.datasource-config-form :deep(.n-select[disabled]) {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
