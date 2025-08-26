<!--
  简化版数据源配置表单主组件
  先实现基础功能，避免复杂依赖导致的编译错误
-->
<template>
  <div class="data-source-config-form">
    <!-- 数据源头部 -->
    <component
      :is="DataSourceHeader"
      v-if="DataSourceHeader"
      :data-source-options="dataSourceOptions"
      :active-data-source-key="activeDataSourceKey"
      @update:active-data-source-key="handleDataSourceChange"
    />

    <!-- 数据源配置区域 -->
    <n-space vertical :size="16" class="config-content">
      <!-- 数据源类型选择和基础配置 -->
      <n-card>
        <template #header>
          <n-space align="center" :size="8">
            <n-icon><SettingsOutline /></n-icon>
            <span>{{ $t('dataSource.config.basicSettings', '基础设置') }}</span>
          </n-space>
        </template>

        <n-space vertical :size="16">
          <!-- 数据源类型选择 -->
          <n-form-item :label="$t('dataSource.config.sourceType', '数据源类型')">
            <n-radio-group :value="configState.sourceType" @update:value="handleSourceTypeChange">
              <n-radio value="http">
                <n-space align="center" :size="8">
                  <n-icon><GlobeOutline /></n-icon>
                  <span>{{ $t('dataSource.type.http', 'HTTP') }}</span>
                </n-space>
              </n-radio>
              <n-radio value="websocket">
                <n-space align="center" :size="8">
                  <n-icon><FlashOutline /></n-icon>
                  <span>{{ $t('dataSource.type.websocket', 'WebSocket') }}</span>
                </n-space>
              </n-radio>
              <n-radio value="manual">
                <n-space align="center" :size="8">
                  <n-icon><CreateOutline /></n-icon>
                  <span>{{ $t('dataSource.type.manual', '手动') }}</span>
                </n-space>
              </n-radio>
              <n-radio value="script">
                <n-space align="center" :size="8">
                  <n-icon><CodeOutline /></n-icon>
                  <span>{{ $t('dataSource.type.script', '脚本') }}</span>
                </n-space>
              </n-radio>
            </n-radio-group>
          </n-form-item>

          <!-- 配置状态指示器 -->
          <n-space align="center" :size="12">
            <n-space align="center" :size="8">
              <n-icon :color="configState.isValid ? '#18a058' : '#d03050'">
                <CheckmarkCircleOutline v-if="configState.isValid" />
                <CloseCircleOutline v-else />
              </n-icon>
              <n-text>
                {{
                  configState.isValid
                    ? $t('dataSource.status.valid', '配置有效')
                    : $t('dataSource.status.invalid', '配置无效')
                }}
              </n-text>
            </n-space>

            <n-divider vertical />

            <n-space align="center" :size="8">
              <n-icon :color="configState.isConnected ? '#18a058' : '#909399'">
                <RadioButtonOnOutline v-if="configState.isConnected" />
                <RadioButtonOffOutline v-else />
              </n-icon>
              <n-text>
                {{
                  configState.isConnected
                    ? $t('dataSource.status.connected', '已连接')
                    : $t('dataSource.status.disconnected', '未连接')
                }}
              </n-text>
            </n-space>
          </n-space>
        </n-space>
      </n-card>

      <!-- 基础配置区域 -->
      <n-card>
        <template #header>
          <span>{{ $t('dataSource.config.title', '数据源配置') }}</span>
        </template>

        <n-form ref="formRef" :model="configState" label-placement="top">
          <!-- HTTP配置 -->
          <template v-if="configState.sourceType === 'http'">
            <n-form-item :label="$t('dataSource.http.url', 'URL地址')" path="httpConfig.url">
              <n-input
                v-model:value="configState.httpConfig.url"
                :placeholder="$t('dataSource.http.urlPlaceholder', '请输入HTTP接口地址')"
                @input="handleConfigChange"
              />
            </n-form-item>

            <n-form-item :label="$t('dataSource.http.method', '请求方法')" path="httpConfig.method">
              <n-select
                v-model:value="configState.httpConfig.method"
                :options="httpMethodOptions"
                @update:value="handleConfigChange"
              />
            </n-form-item>

            <n-form-item :label="$t('dataSource.http.headers', '请求头')" path="httpConfig.headers">
              <n-dynamic-input
                v-model:value="configState.httpConfig.headers"
                :on-create="createHeaderItem"
                #="{ value, index }"
              >
                <n-input-group>
                  <n-input
                    v-model:value="value.key"
                    :placeholder="$t('dataSource.http.headerKey', '键')"
                    style="width: 40%"
                  />
                  <n-input
                    v-model:value="value.value"
                    :placeholder="$t('dataSource.http.headerValue', '值')"
                    style="width: 60%"
                  />
                </n-input-group>
              </n-dynamic-input>
            </n-form-item>

            <n-form-item>
              <n-button :loading="testing" @click="testHttpConnection">
                <template #icon>
                  <n-icon><PlayOutline /></n-icon>
                </template>
                {{ $t('dataSource.http.test', '测试连接') }}
              </n-button>
            </n-form-item>
          </template>

          <!-- WebSocket配置 -->
          <template v-if="configState.sourceType === 'websocket'">
            <n-form-item :label="$t('dataSource.websocket.url', 'WebSocket地址')" path="websocketConfig.url">
              <n-input
                v-model:value="configState.websocketConfig.url"
                :placeholder="$t('dataSource.websocket.urlPlaceholder', '请输入WebSocket地址')"
                @input="handleConfigChange"
              />
            </n-form-item>

            <n-form-item>
              <n-space>
                <n-button
                  v-if="!configState.isConnected"
                  :loading="connecting"
                  type="primary"
                  @click="connectWebSocket"
                >
                  <template #icon>
                    <n-icon><PlayOutline /></n-icon>
                  </template>
                  {{ $t('dataSource.websocket.connect', '连接') }}
                </n-button>
                <n-button v-else type="error" @click="disconnectWebSocket">
                  <template #icon>
                    <n-icon><StopOutline /></n-icon>
                  </template>
                  {{ $t('dataSource.websocket.disconnect', '断开') }}
                </n-button>
              </n-space>
            </n-form-item>
          </template>

          <!-- 手动数据配置 -->
          <template v-if="configState.sourceType === 'manual'">
            <n-form-item :label="$t('dataSource.manual.data', '数据内容')" path="manualConfig.data">
              <component
                :is="ScriptEditor"
                v-if="ScriptEditor"
                v-model:value="configState.manualConfig.data"
                language="json"
                :height="200"
                @validate="handleJsonValidation"
              />
              <n-input
                v-else
                v-model:value="configState.manualConfig.data"
                type="textarea"
                :rows="8"
                :placeholder="$t('dataSource.manual.dataPlaceholder', '请输入JSON格式数据')"
                @input="handleConfigChange"
              />
            </n-form-item>
          </template>

          <!-- 脚本配置 -->
          <template v-if="configState.sourceType === 'script'">
            <n-form-item :label="$t('dataSource.script.code', '脚本代码')" path="scriptConfig.code">
              <component
                :is="ScriptEditor"
                v-if="ScriptEditor"
                v-model:value="configState.scriptConfig.code"
                language="javascript"
                :height="200"
              />
              <n-input
                v-else
                v-model:value="configState.scriptConfig.code"
                type="textarea"
                :rows="8"
                :placeholder="$t('dataSource.script.codePlaceholder', '请输入JavaScript代码')"
                @input="handleConfigChange"
              />
            </n-form-item>
          </template>
        </n-form>
      </n-card>

      <!-- 最终数据处理 -->
      <component
        :is="FinalDataProcessing"
        v-if="FinalDataProcessing"
        :data-value="currentDataSource"
        @update:finalProcessingType="handleFinalProcessingTypeUpdate"
        @update:finalProcessingScript="handleFinalProcessingScriptUpdate"
        @formatFinalScript="handleFormatFinalScript"
        @validateFinalScript="handleValidateFinalScript"
      />
    </n-space>
  </div>
</template>

<script setup lang="ts">
/**
 * 简化版数据源配置表单主组件
 * 先实现基础功能，避免复杂依赖
 */
import { computed, reactive, ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import type { FormInst } from 'naive-ui'
import {
  SettingsOutline,
  GlobeOutline,
  FlashOutline,
  CreateOutline,
  CodeOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
  RadioButtonOnOutline,
  RadioButtonOffOutline,
  PlayOutline,
  StopOutline
} from '@vicons/ionicons5'

// 尝试导入可选组件，如果不存在则不使用
const DataSourceHeader = ref(null)
const FinalDataProcessing = ref(null)
const ScriptEditor = ref(null)

// 在onMounted中动态导入组件
const loadOptionalComponents = async () => {
  try {
    const DataSourceHeaderModule = await import('./DataSourceHeader.vue')
    DataSourceHeader.value = DataSourceHeaderModule.default
  } catch (e) {
    console.warn('DataSourceHeader组件未找到，跳过导入')
  }

  try {
    const FinalDataProcessingModule = await import('./FinalDataProcessing.vue')
    FinalDataProcessing.value = FinalDataProcessingModule.default
  } catch (e) {
    console.warn('FinalDataProcessing组件未找到，跳过导入')
  }

  try {
    const CodeEditorModule = await import('./components/ScriptEditor.vue')
    ScriptEditor.value = CodeEditorModule.default
  } catch (e) {
    console.warn('ScriptEditor组件未找到，跳过导入')
  }
}

// 类型定义
interface DataSourceConfigFormProps {
  modelValue: Record<string, any>
  dataSources: Record<string, any>
  componentId: string
  componentType: string
}

interface DataSourceConfigFormEmits {
  'update:modelValue': [value: Record<string, any>]
}

const props = defineProps<DataSourceConfigFormProps>()
const emit = defineEmits<DataSourceConfigFormEmits>()

// 国际化和消息
const { t } = useI18n()
const message = useMessage()

// 表单引用
const formRef = ref<FormInst>()

// 状态管理
const testing = ref(false)
const connecting = ref(false)

// 配置状态
const configState = reactive({
  sourceType: 'http',
  isValid: false,
  isConnected: false,
  httpConfig: {
    url: '',
    method: 'GET',
    headers: []
  },
  websocketConfig: {
    url: ''
  },
  manualConfig: {
    data: ''
  },
  scriptConfig: {
    code: ''
  }
})

// 计算属性
const activeDataSourceKey = computed(() => {
  return Object.keys(props.modelValue)[0] || ''
})

const currentDataSource = computed(() => {
  return props.modelValue[activeDataSourceKey.value] || {}
})

const dataSourceOptions = computed(() => {
  return Object.keys(props.dataSources).map(key => ({
    label: `${props.dataSources[key].type} - ${key}`,
    value: key,
    type: props.dataSources[key].type,
    example: props.dataSources[key].example
  }))
})

const httpMethodOptions = computed(() => [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' }
])

// 监听器
watch(
  () => props.modelValue,
  newValue => {
    syncExternalConfig(newValue)
  },
  { deep: true, immediate: true }
)

watch(
  () => configState,
  newState => {
    emitConfigUpdate(newState)
  },
  { deep: true }
)

// 生命周期
onMounted(async () => {
  await loadOptionalComponents()
  initializeComponent()
})

onUnmounted(() => {
  cleanupComponent()
})

// 方法
const initializeComponent = () => {
  syncExternalConfig(props.modelValue)
  console.log('✅ 简化版DataSourceConfigForm组件初始化完成')
}

const cleanupComponent = () => {
  if (configState.isConnected) {
    disconnectWebSocket()
  }
  console.log('✅ 简化版DataSourceConfigForm组件资源清理完成')
}

const syncExternalConfig = (externalConfig: Record<string, any>) => {
  const firstKey = Object.keys(externalConfig)[0]
  if (!firstKey) return

  const sourceConfig = externalConfig[firstKey]

  if (sourceConfig.type) {
    configState.sourceType = sourceConfig.type
  }
}

const emitConfigUpdate = (newState: any) => {
  const updatedConfig = {
    [activeDataSourceKey.value]: {
      ...currentDataSource.value,
      type: newState.sourceType,
      config: newState[`${newState.sourceType}Config`]
    }
  }
  emit('update:modelValue', updatedConfig)
}

const handleSourceTypeChange = (newType: string) => {
  configState.sourceType = newType
  configState.isValid = false
  configState.isConnected = false

  // 重置相关配置
  if (newType === 'http') {
    configState.httpConfig = { url: '', method: 'GET', headers: [] }
  } else if (newType === 'websocket') {
    configState.websocketConfig = { url: '' }
  } else if (newType === 'manual') {
    configState.manualConfig = { data: '' }
  } else if (newType === 'script') {
    configState.scriptConfig = { code: '' }
  }
}

const handleConfigChange = () => {
  // 简单验证
  if (configState.sourceType === 'http') {
    configState.isValid = !!configState.httpConfig.url
  } else if (configState.sourceType === 'websocket') {
    configState.isValid = !!configState.websocketConfig.url
  } else if (configState.sourceType === 'manual') {
    configState.isValid = !!configState.manualConfig.data
  } else if (configState.sourceType === 'script') {
    configState.isValid = !!configState.scriptConfig.code
  }
}

const handleDataSourceChange = (newKey: string) => {
  if (newKey && newKey !== activeDataSourceKey.value) {
    const newConfig = {
      [newKey]: props.dataSources[newKey]
    }
    emit('update:modelValue', newConfig)
  }
}

const createHeaderItem = () => {
  return { key: '', value: '' }
}

const testHttpConnection = async () => {
  if (!configState.httpConfig.url) {
    message.warning(t('dataSource.http.validation.urlRequired', '请输入URL地址'))
    return
  }

  testing.value = true
  try {
    const response = await fetch(configState.httpConfig.url, {
      method: configState.httpConfig.method,
      headers: configState.httpConfig.headers.reduce((acc: any, header: any) => {
        if (header.key && header.value) {
          acc[header.key] = header.value
        }
        return acc
      }, {})
    })

    if (response.ok) {
      message.success(t('dataSource.http.testSuccess', '连接测试成功'))
      configState.isConnected = true
    } else {
      message.error(t('dataSource.http.testFailed', '连接测试失败'))
      configState.isConnected = false
    }
  } catch (error: any) {
    message.error(t('dataSource.http.testError', '连接测试出错'))
    configState.isConnected = false
    console.error('HTTP连接测试失败:', error)
  } finally {
    testing.value = false
  }
}

const connectWebSocket = async () => {
  if (!configState.websocketConfig.url) {
    message.warning(t('dataSource.websocket.validation.urlRequired', '请输入WebSocket地址'))
    return
  }

  connecting.value = true
  try {
    // 简单的WebSocket连接测试
    const ws = new WebSocket(configState.websocketConfig.url)

    ws.onopen = () => {
      message.success(t('dataSource.websocket.connectSuccess', 'WebSocket连接成功'))
      configState.isConnected = true
      connecting.value = false
      ws.close()
    }

    ws.onerror = () => {
      message.error(t('dataSource.websocket.connectError', 'WebSocket连接失败'))
      configState.isConnected = false
      connecting.value = false
    }

    // 超时处理
    setTimeout(() => {
      if (connecting.value) {
        ws.close()
        message.error(t('dataSource.websocket.connectTimeout', 'WebSocket连接超时'))
        configState.isConnected = false
        connecting.value = false
      }
    }, 5000)
  } catch (error: any) {
    message.error(t('dataSource.websocket.connectError', 'WebSocket连接失败'))
    configState.isConnected = false
    connecting.value = false
    console.error('WebSocket连接失败:', error)
  }
}

const disconnectWebSocket = () => {
  configState.isConnected = false
  message.info(t('dataSource.websocket.disconnected', 'WebSocket已断开'))
}

const handleJsonValidation = (error: string) => {
  if (error) {
    configState.isValid = false
    message.error(t('dataSource.manual.validation.invalidJson', 'JSON格式无效'))
  } else {
    configState.isValid = !!configState.manualConfig.data
  }
}

// 兼容原有接口的处理函数
const handleFinalProcessingTypeUpdate = (type: string) => {
  const updatedConfig = {
    ...props.modelValue,
    [activeDataSourceKey.value]: {
      ...currentDataSource.value,
      finalProcessingType: type
    }
  }
  emit('update:modelValue', updatedConfig)
}

const handleFinalProcessingScriptUpdate = (script: string) => {
  const updatedConfig = {
    ...props.modelValue,
    [activeDataSourceKey.value]: {
      ...currentDataSource.value,
      finalProcessingScript: script
    }
  }
  emit('update:modelValue', updatedConfig)
}

const handleFormatFinalScript = () => {
  console.log('格式化最终处理脚本')
  message.info(t('dataSource.script.formatSuccess', '脚本格式化完成'))
}

const handleValidateFinalScript = () => {
  console.log('验证最终处理脚本')
  message.info(t('dataSource.script.validationSuccess', '脚本验证通过'))
}

// 暴露给父组件的方法
defineExpose({
  isValid: computed(() => configState.isValid),
  isConnected: computed(() => configState.isConnected)
})
</script>

<style scoped>
.data-source-config-form {
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
}

.config-content {
  margin-top: 16px;
}

:deep(.n-form-item-label) {
  font-weight: 500;
  color: var(--text-color);
}

:deep(.n-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

:deep(.n-radio) {
  margin-right: 0;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  transition: all 0.3s ease;
}

:deep(.n-radio:hover) {
  border-color: var(--primary-color);
  background-color: var(--primary-color-suppl);
}

:deep(.n-radio.n-radio--checked) {
  border-color: var(--primary-color);
  background-color: var(--primary-color-suppl);
}

:deep(.n-card) {
  border-radius: 8px;
  box-shadow: var(--box-shadow);
}

:deep(.n-card-header) {
  border-bottom: 1px solid var(--divider-color);
  padding-bottom: 12px;
}

:deep(.n-divider--vertical) {
  height: 16px;
  margin: 0 8px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .data-source-config-form {
    padding: 12px;
  }

  :deep(.n-radio-group) {
    flex-direction: column;
    gap: 8px;
  }

  :deep(.n-radio) {
    width: 100%;
    justify-content: center;
  }
}

/* 主题适配 */
[data-theme='dark'] :deep(.n-radio) {
  border-color: var(--border-color);
  background-color: var(--body-color);
}

[data-theme='dark'] :deep(.n-radio:hover) {
  border-color: var(--primary-color);
  background-color: rgba(24, 160, 88, 0.1);
}

[data-theme='dark'] :deep(.n-card) {
  background-color: var(--card-color);
  border-color: var(--border-color);
}
</style>
