<template>
  <div class="comprehensive-data-config-panel">
    <div class="config-header">
      <h3>数据源配置</h3>
      <n-button size="small" @click="resetConfig">
        <template #icon>
          <i class="i-carbon-reset" />
        </template>
        重置配置
      </n-button>
    </div>

    <n-tabs v-model:value="activeTab" type="line">
      <!-- 数据源配置 -->
      <n-tab-pane name="dataSource" tab="📊 数据源">
        <div class="config-section">
          <div class="section-title">数据源类型</div>
          <n-radio-group v-model:value="config.dataSource.type" @update:value="onDataSourceTypeChange">
            <n-space direction="vertical">
              <n-radio value="static">
                <div class="radio-option">
                  <div class="option-title">📄 静态数据</div>
                  <div class="option-desc">使用固定的JSON数据</div>
                </div>
              </n-radio>
              <n-radio value="script">
                <div class="radio-option">
                  <div class="option-title">📜 脚本数据</div>
                  <div class="option-desc">通过JavaScript生成动态数据</div>
                </div>
              </n-radio>
              <n-radio value="api">
                <div class="radio-option">
                  <div class="option-title">🌐 API接口</div>
                  <div class="option-desc">从HTTP API获取数据</div>
                </div>
              </n-radio>
              <n-radio value="websocket">
                <div class="radio-option">
                  <div class="option-title">🔌 WebSocket</div>
                  <div class="option-desc">实时WebSocket数据流</div>
                </div>
              </n-radio>
            </n-space>
          </n-radio-group>
        </div>

        <!-- 静态数据配置 -->
        <div v-if="config.dataSource.type === 'static'" class="config-section">
          <div class="section-title">
            <span>静态数据内容</span>
            <n-button text size="small" @click="loadSampleStaticData">
              <template #icon>
                <i class="i-carbon-document-add" />
              </template>
              加载示例
            </n-button>
          </div>
          <n-input
            v-model:value="staticDataString"
            type="textarea"
            placeholder="输入JSON格式的数据"
            :rows="8"
            @input="onStaticDataChange"
          />
          <div v-if="staticDataError" class="config-error">
            <n-text type="error">{{ staticDataError }}</n-text>
          </div>
          <div v-if="staticDataPreview" class="data-preview">
            <div class="preview-title">数据预览:</div>
            <pre class="json-preview">{{ formatJson(staticDataPreview) }}</pre>
          </div>
        </div>

        <!-- 脚本数据配置 -->
        <div v-if="config.dataSource.type === 'script'" class="config-section">
          <div class="section-title">
            <span>JavaScript脚本</span>
            <n-button text size="small" @click="loadSampleScript">
              <template #icon>
                <i class="i-carbon-code" />
              </template>
              加载示例
            </n-button>
          </div>
          <n-input
            v-model:value="config.dataSource.script"
            type="textarea"
            placeholder="输入返回数据对象的JavaScript代码"
            :rows="6"
          />
          <div class="script-help">
            <n-collapse>
              <n-collapse-item title="🔧 可用函数和变量" name="help">
                <div class="help-content">
                  <div class="help-section">
                    <strong>mockData 工具函数:</strong>
                    <ul>
                      <li>
                        <code>mockData.randomNumber(min, max)</code>
                        - 生成随机数字
                      </li>
                      <li>
                        <code>mockData.randomString(length)</code>
                        - 生成随机字符串
                      </li>
                      <li>
                        <code>mockData.randomBoolean()</code>
                        - 生成随机布尔值
                      </li>
                      <li>
                        <code>mockData.randomDate()</code>
                        - 生成随机日期
                      </li>
                    </ul>
                  </div>
                  <div class="help-section">
                    <strong>其他可用变量:</strong>
                    <ul>
                      <li>
                        <code>Math</code>
                        - 数学函数
                      </li>
                      <li>
                        <code>Date</code>
                        - 日期函数
                      </li>
                      <li>
                        <code>JSON</code>
                        - JSON处理
                      </li>
                    </ul>
                  </div>
                </div>
              </n-collapse-item>
            </n-collapse>
          </div>
        </div>

        <!-- API配置 -->
        <div v-if="config.dataSource.type === 'api'" class="config-section">
          <div class="section-title">API接口配置</div>
          <div class="form-grid">
            <div class="form-item">
              <label>请求URL:</label>
              <n-input v-model:value="config.dataSource.url" placeholder="https://api.example.com/data" />
            </div>
            <div class="form-item">
              <label>请求方法:</label>
              <n-select v-model:value="config.dataSource.method" :options="httpMethods" />
            </div>
            <div class="form-item">
              <label>超时时间 (ms):</label>
              <n-input-number v-model:value="config.dataSource.timeout" :min="1000" :max="60000" :step="1000" />
            </div>
          </div>

          <div class="form-item">
            <label>请求头 (JSON格式):</label>
            <n-input
              v-model:value="apiHeadersString"
              type="textarea"
              placeholder='{"Content-Type": "application/json"}'
              :rows="3"
              @input="onApiHeadersChange"
            />
          </div>

          <div v-if="config.dataSource.method !== 'GET'" class="form-item">
            <label>请求体 (JSON格式):</label>
            <n-input
              v-model:value="apiBodyString"
              type="textarea"
              placeholder='{"key": "value"}'
              :rows="4"
              @input="onApiBodyChange"
            />
          </div>

          <div class="api-test-section">
            <n-button :loading="apiTesting" type="primary" size="small" @click="testApiConnection">
              <template #icon>
                <i class="i-carbon-api" />
              </template>
              测试API连接
            </n-button>
            <div v-if="apiTestResult" class="api-test-result">
              <n-tag :type="apiTestResult.success ? 'success' : 'error'" size="small">
                {{ apiTestResult.success ? '连接成功' : '连接失败' }}
              </n-tag>
              <span class="test-message">{{ apiTestResult.message }}</span>
            </div>
          </div>
        </div>

        <!-- WebSocket配置 -->
        <div v-if="config.dataSource.type === 'websocket'" class="config-section">
          <div class="section-title">WebSocket配置</div>
          <div class="form-grid">
            <div class="form-item">
              <label>WebSocket URL:</label>
              <n-input v-model:value="config.dataSource.wsUrl" placeholder="ws://localhost:8080/data" />
            </div>
            <div class="form-item">
              <label>重连间隔 (ms):</label>
              <n-input-number
                v-model:value="config.dataSource.reconnectInterval"
                :min="1000"
                :max="30000"
                :step="1000"
              />
            </div>
            <div class="form-item">
              <label>最大重连次数:</label>
              <n-input-number v-model:value="config.dataSource.maxReconnectAttempts" :min="1" :max="10" />
            </div>
          </div>
        </div>
      </n-tab-pane>

      <!-- 字段映射配置 -->
      <n-tab-pane name="mapping" tab="🗺️ 字段映射">
        <div class="mapping-section">
          <div class="section-title">
            <span>字段映射规则</span>
            <n-button size="small" @click="addMappingRule">
              <template #icon>
                <i class="i-carbon-add" />
              </template>
              添加映射
            </n-button>
          </div>

          <div class="mapping-list">
            <div v-for="(rule, index) in config.mappingRules" :key="index" class="mapping-rule">
              <div class="rule-header">
                <span class="rule-index">{{ index + 1 }}</span>
                <n-button text size="small" type="error" @click="removeMappingRule(index)">
                  <template #icon>
                    <i class="i-carbon-trash-can" />
                  </template>
                </n-button>
              </div>

              <div class="rule-content">
                <div class="rule-field">
                  <label>目标字段:</label>
                  <n-select v-model:value="rule.targetField" :options="targetFieldOptions" placeholder="选择目标字段" />
                </div>

                <div class="rule-field">
                  <label>源路径:</label>
                  <n-input v-model:value="rule.sourcePath" placeholder="如: data.temperature 或 readings[0].value" />
                </div>

                <div class="rule-field">
                  <label>映射类型:</label>
                  <n-select v-model:value="rule.type" :options="mappingTypeOptions" />
                </div>

                <div v-if="rule.type === 'calculated'" class="rule-field">
                  <label>转换函数:</label>
                  <n-input
                    v-model:value="rule.transformerString"
                    placeholder="如: value => value * 2"
                    @input="onTransformerChange(rule, $event)"
                  />
                </div>

                <div class="rule-field">
                  <label>默认值:</label>
                  <n-input v-model:value="rule.defaultValue" placeholder="当源路径无效时使用的默认值" />
                </div>
              </div>
            </div>
          </div>

          <div v-if="config.mappingRules.length === 0" class="empty-mapping">
            <div class="empty-message">还没有配置字段映射规则</div>
            <n-button type="primary" dashed @click="addDefaultMappingRules">
              <template #icon>
                <i class="i-carbon-magic-wand" />
              </template>
              添加默认映射规则
            </n-button>
          </div>
        </div>
      </n-tab-pane>

      <!-- 更新触发器配置 -->
      <n-tab-pane name="triggers" tab="⚡ 更新触发器">
        <div class="triggers-section">
          <div class="section-title">更新触发方式</div>
          <n-radio-group v-model:value="config.updateTrigger.type">
            <n-space direction="vertical">
              <n-radio value="manual">
                <div class="radio-option">
                  <div class="option-title">👆 手动触发</div>
                  <div class="option-desc">只有手动调用时才更新数据</div>
                </div>
              </n-radio>
              <n-radio value="timer">
                <div class="radio-option">
                  <div class="option-title">⏰ 定时器</div>
                  <div class="option-desc">按固定间隔自动更新数据</div>
                </div>
              </n-radio>
              <n-radio value="websocket">
                <div class="radio-option">
                  <div class="option-title">🔌 WebSocket消息</div>
                  <div class="option-desc">收到WebSocket消息时更新</div>
                </div>
              </n-radio>
              <n-radio value="event">
                <div class="radio-option">
                  <div class="option-title">📡 自定义事件</div>
                  <div class="option-desc">监听特定事件触发更新</div>
                </div>
              </n-radio>
            </n-space>
          </n-radio-group>

          <!-- 定时器配置 -->
          <div v-if="config.updateTrigger.type === 'timer'" class="trigger-config">
            <div class="form-item">
              <label>更新间隔 (毫秒):</label>
              <n-input-number v-model:value="config.updateTrigger.interval" :min="1000" :max="300000" :step="1000" />
            </div>
            <div class="form-item">
              <n-checkbox v-model:checked="config.updateTrigger.immediate">立即执行一次</n-checkbox>
            </div>
          </div>

          <!-- WebSocket触发器配置 -->
          <div v-if="config.updateTrigger.type === 'websocket'" class="trigger-config">
            <div class="form-item">
              <label>WebSocket URL:</label>
              <n-input v-model:value="config.updateTrigger.wsUrl" placeholder="ws://localhost:8080/updates" />
            </div>
          </div>

          <!-- 事件触发器配置 -->
          <div v-if="config.updateTrigger.type === 'event'" class="trigger-config">
            <div class="form-item">
              <label>事件名称:</label>
              <n-input v-model:value="config.updateTrigger.eventName" placeholder="dataUpdate" />
            </div>
          </div>
        </div>
      </n-tab-pane>

      <!-- 预览和测试 -->
      <n-tab-pane name="preview" tab="👀 预览测试">
        <div class="preview-section">
          <div class="preview-header">
            <span>配置预览</span>
            <n-space>
              <n-button :loading="configTesting" type="primary" @click="testConfiguration">
                <template #icon>
                  <i class="i-carbon-play" />
                </template>
                测试配置
              </n-button>
              <n-button type="default" @click="exportConfiguration">
                <template #icon>
                  <i class="i-carbon-download" />
                </template>
                导出配置
              </n-button>
            </n-space>
          </div>

          <!-- 配置摘要 -->
          <div class="config-summary">
            <div class="summary-item">
              <div class="summary-label">数据源类型:</div>
              <div class="summary-value">{{ getDataSourceTypeName(config.dataSource.type) }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">映射规则数量:</div>
              <div class="summary-value">{{ config.mappingRules.length }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">更新触发器:</div>
              <div class="summary-value">{{ getTriggerTypeName(config.updateTrigger.type) }}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">配置状态:</div>
              <div class="summary-value">
                <n-tag :type="configValid ? 'success' : 'error'" size="small">
                  {{ configValid ? '有效' : '无效' }}
                </n-tag>
              </div>
            </div>
          </div>

          <!-- 测试结果 -->
          <div v-if="testResult" class="test-result">
            <div class="result-header">
              <span>测试结果</span>
              <n-tag :type="testResult.success ? 'success' : 'error'" size="small">
                {{ testResult.success ? '成功' : '失败' }}
              </n-tag>
            </div>
            <div v-if="testResult.success" class="result-data">
              <pre class="json-preview">{{ formatJson(testResult.data) }}</pre>
            </div>
            <div v-else class="result-error">
              <n-text type="error">{{ testResult.error }}</n-text>
            </div>
          </div>

          <!-- 完整配置JSON -->
          <div class="config-json">
            <n-collapse>
              <n-collapse-item title="完整配置JSON" name="json">
                <pre class="json-preview">{{ formatJson(config) }}</pre>
              </n-collapse-item>
            </n-collapse>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import {
  NTabs,
  NTabPane,
  NRadioGroup,
  NRadio,
  NButton,
  NInput,
  NInputNumber,
  NSelect,
  NSpace,
  NText,
  NCollapse,
  NCollapseItem,
  NCheckbox,
  NTag
} from 'naive-ui'

interface Props {
  initialConfig?: any
}

interface Emits {
  'config-change': [config: any]
  'config-test': [config: any]
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// ========== 响应式数据 ==========

const activeTab = ref('dataSource')

const config = reactive({
  dataSource: {
    type: 'static' as 'static' | 'script' | 'api' | 'websocket',
    // 静态数据配置
    data: null,
    // 脚本配置
    script: '',
    // API配置
    url: '',
    method: 'GET',
    headers: {},
    body: null,
    timeout: 10000,
    // WebSocket配置
    wsUrl: '',
    reconnectInterval: 5000,
    maxReconnectAttempts: 5
  },
  mappingRules: [] as any[],
  updateTrigger: {
    type: 'manual' as 'manual' | 'timer' | 'websocket' | 'event',
    interval: 5000,
    immediate: false,
    wsUrl: '',
    eventName: ''
  }
})

// 辅助数据
const staticDataString = ref('')
const staticDataError = ref('')
const staticDataPreview = ref(null)
const apiHeadersString = ref('{}')
const apiBodyString = ref('{}')
const apiTesting = ref(false)
const apiTestResult = ref<any>(null)
const configTesting = ref(false)
const testResult = ref<any>(null)

// ========== 选项数据 ==========

const httpMethods = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' }
]

const targetFieldOptions = [
  { label: 'temperature (温度)', value: 'temperature' },
  { label: 'humidity (湿度)', value: 'humidity' },
  { label: 'isOnline (在线状态)', value: 'isOnline' },
  { label: 'sensorInfo (传感器信息)', value: 'sensorInfo' },
  { label: 'readings (历史读数)', value: 'readings' }
]

const mappingTypeOptions = [
  { label: '直接映射', value: 'direct' },
  { label: '计算映射', value: 'calculated' },
  { label: '条件映射', value: 'conditional' }
]

// ========== 计算属性 ==========

const configValid = computed(() => {
  // 验证数据源配置
  if (config.dataSource.type === 'api' && !config.dataSource.url) {
    return false
  }
  if (config.dataSource.type === 'websocket' && !config.dataSource.wsUrl) {
    return false
  }
  if (config.dataSource.type === 'static' && !config.dataSource.data) {
    return false
  }
  if (config.dataSource.type === 'script' && !config.dataSource.script) {
    return false
  }

  // 验证映射规则
  if (config.mappingRules.length === 0) {
    return false
  }

  return config.mappingRules.every(rule => rule.targetField && rule.sourcePath && rule.type)
})

// ========== 方法 ==========

const formatJson = (obj: any): string => {
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return String(obj)
  }
}

const getDataSourceTypeName = (type: string): string => {
  const names = {
    static: '静态数据',
    script: '脚本数据',
    api: 'API接口',
    websocket: 'WebSocket'
  }
  return names[type as keyof typeof names] || type
}

const getTriggerTypeName = (type: string): string => {
  const names = {
    manual: '手动触发',
    timer: '定时器',
    websocket: 'WebSocket消息',
    event: '自定义事件'
  }
  return names[type as keyof typeof names] || type
}

// 数据源类型变化
const onDataSourceTypeChange = () => {
  // 重置相关配置
  apiTestResult.value = null
  staticDataError.value = ''
  staticDataPreview.value = null
}

// 静态数据处理
const onStaticDataChange = () => {
  try {
    if (staticDataString.value.trim()) {
      const parsed = JSON.parse(staticDataString.value)
      config.dataSource.data = parsed
      staticDataPreview.value = parsed
      staticDataError.value = ''
    } else {
      config.dataSource.data = null
      staticDataPreview.value = null
      staticDataError.value = ''
    }
  } catch (error) {
    staticDataError.value = error instanceof Error ? error.message : '无效的JSON格式'
    staticDataPreview.value = null
  }
}

const loadSampleStaticData = () => {
  const sampleData = {
    temperature: 25.6,
    humidity: 68.2,
    isOnline: true,
    sensorInfo: {
      id: 'sensor-001',
      name: '环境传感器',
      location: '机房A区'
    },
    readings: [
      { time: '14:00', value: 24.5 },
      { time: '14:30', value: 25.1 },
      { time: '15:00', value: 25.6 }
    ]
  }

  staticDataString.value = formatJson(sampleData)
  onStaticDataChange()
}

const loadSampleScript = () => {
  config.dataSource.script = `
return {
  temperature: mockData.randomNumber(18, 32),
  humidity: mockData.randomNumber(40, 80),
  isOnline: mockData.randomBoolean(),
  sensorInfo: {
    id: 'script-sensor-' + Math.floor(Math.random() * 100).toString().padStart(3, '0'),
    name: '脚本传感器',
    location: ['机房A区', '机房B区', '机房C区'][Math.floor(Math.random() * 3)]
  },
  readings: Array.from({length: 5}, (_, i) => {
    const now = new Date()
    const time = new Date(now.getTime() - (4-i) * 15 * 60 * 1000)
    return {
      time: time.toLocaleTimeString(),
      value: mockData.randomNumber(15, 35)
    }
  })
};
  `.trim()
}

// API配置处理
const onApiHeadersChange = () => {
  try {
    config.dataSource.headers = JSON.parse(apiHeadersString.value || '{}')
  } catch {
    // 忽略解析错误，保持之前的值
  }
}

const onApiBodyChange = () => {
  try {
    config.dataSource.body = JSON.parse(apiBodyString.value || 'null')
  } catch {
    // 忽略解析错误，保持之前的值
  }
}

const testApiConnection = async () => {
  if (!config.dataSource.url) return

  apiTesting.value = true
  apiTestResult.value = null

  try {
    // 模拟API测试（实际项目中会真实调用）
    await new Promise(resolve => setTimeout(resolve, 1000))

    apiTestResult.value = {
      success: true,
      message: 'API连接测试成功'
    }
  } catch (error) {
    apiTestResult.value = {
      success: false,
      message: error instanceof Error ? error.message : 'API连接失败'
    }
  } finally {
    apiTesting.value = false
  }
}

// 映射规则管理
const addMappingRule = () => {
  config.mappingRules.push({
    targetField: '',
    sourcePath: '',
    type: 'direct',
    transformerString: '',
    transformer: null,
    defaultValue: ''
  })
}

const removeMappingRule = (index: number) => {
  config.mappingRules.splice(index, 1)
}

const addDefaultMappingRules = () => {
  const defaultRules = [
    { targetField: 'temperature', sourcePath: 'temperature', type: 'direct' },
    { targetField: 'humidity', sourcePath: 'humidity', type: 'direct' },
    { targetField: 'isOnline', sourcePath: 'isOnline', type: 'direct' },
    { targetField: 'sensorInfo', sourcePath: 'sensorInfo', type: 'direct' },
    { targetField: 'readings', sourcePath: 'readings', type: 'direct' }
  ]

  defaultRules.forEach(rule => {
    config.mappingRules.push({
      ...rule,
      transformerString: '',
      transformer: null,
      defaultValue: ''
    })
  })
}

const onTransformerChange = (rule: any, value: string) => {
  rule.transformerString = value
  try {
    if (value.trim()) {
      // 创建转换函数
      rule.transformer = new Function('value', `return (${value})(value)`)
    } else {
      rule.transformer = null
    }
  } catch {
    rule.transformer = null
  }
}

// 配置测试
const testConfiguration = async () => {
  if (!configValid.value) {
    testResult.value = {
      success: false,
      error: '配置无效，请检查必填项'
    }
    return
  }

  configTesting.value = true
  testResult.value = null

  try {
    // 模拟配置测试
    await new Promise(resolve => setTimeout(resolve, 1500))

    // 生成测试数据
    let testData: any

    if (config.dataSource.type === 'static') {
      testData = config.dataSource.data
    } else if (config.dataSource.type === 'script') {
      // 模拟脚本执行结果
      testData = {
        temperature: Math.round(Math.random() * 20 + 15),
        humidity: Math.round(Math.random() * 40 + 40),
        isOnline: Math.random() > 0.2,
        sensorInfo: {
          id: 'test-sensor-001',
          name: '测试传感器',
          location: '测试区域'
        },
        readings: [
          { time: '15:00', value: 24.5 },
          { time: '15:15', value: 25.1 }
        ]
      }
    } else {
      // API 或 WebSocket 的模拟数据
      testData = {
        temperature: 23.5,
        humidity: 65.2,
        isOnline: true,
        sensorInfo: {
          id: 'remote-sensor-001',
          name: '远程传感器',
          location: '远程位置'
        },
        readings: [
          { time: '15:30', value: 23.2 },
          { time: '15:45', value: 23.8 }
        ]
      }
    }

    // 应用映射规则
    const mappedData: any = {}
    config.mappingRules.forEach(rule => {
      try {
        let value = getValueByPath(testData, rule.sourcePath)

        if (rule.type === 'calculated' && rule.transformer) {
          value = rule.transformer(value)
        }

        if (value === undefined && rule.defaultValue) {
          value = rule.defaultValue
        }

        mappedData[rule.targetField] = value
      } catch (error) {
        mappedData[rule.targetField] = rule.defaultValue || null
      }
    })

    testResult.value = {
      success: true,
      data: mappedData
    }
  } catch (error) {
    testResult.value = {
      success: false,
      error: error instanceof Error ? error.message : '测试失败'
    }
  } finally {
    configTesting.value = false
  }
}

const getValueByPath = (obj: any, path: string): any => {
  if (!path) return obj

  const parts = path.split('.')
  let current = obj

  for (const part of parts) {
    if (part.includes('[') && part.includes(']')) {
      // 处理数组索引
      const [key, indexStr] = part.split(/[[\]]/)
      const index = parseInt(indexStr, 10)
      current = current?.[key]?.[index]
    } else {
      current = current?.[part]
    }

    if (current === undefined) break
  }

  return current
}

const exportConfiguration = () => {
  const configToExport = JSON.stringify(config, null, 2)
  const blob = new Blob([configToExport], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'data-source-config.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

const resetConfig = () => {
  // 重置配置到默认状态
  Object.assign(config, {
    dataSource: {
      type: 'static',
      data: null,
      script: '',
      url: '',
      method: 'GET',
      headers: {},
      body: null,
      timeout: 10000,
      wsUrl: '',
      reconnectInterval: 5000,
      maxReconnectAttempts: 5
    },
    mappingRules: [],
    updateTrigger: {
      type: 'manual',
      interval: 5000,
      immediate: false,
      wsUrl: '',
      eventName: ''
    }
  })

  staticDataString.value = ''
  staticDataError.value = ''
  staticDataPreview.value = null
  apiHeadersString.value = '{}'
  apiBodyString.value = '{}'
  apiTestResult.value = null
  testResult.value = null
}

// ========== 监听器 ==========

watch(
  config,
  () => {
    emit('config-change', { ...config })
  },
  { deep: true }
)

// ========== 初始化 ==========

if (props.initialConfig) {
  Object.assign(config, props.initialConfig)
}
</script>

<style scoped>
.comprehensive-data-config-panel {
  background: white;
  border-radius: 8px;
  border: 1px solid #e9ecef;
  overflow: hidden;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.config-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

/* 配置区段 */
.config-section {
  margin-bottom: 24px;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

/* 单选按钮样式 */
.radio-option {
  margin-left: 8px;
}

.option-title {
  font-weight: 500;
  color: #333;
}

.option-desc {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

/* 表单样式 */
.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #666;
  margin-bottom: 6px;
}

/* 错误和预览 */
.config-error {
  margin-top: 8px;
}

.data-preview {
  margin-top: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.preview-title {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
}

.json-preview {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
  line-height: 1.4;
  color: #333;
  margin: 0;
  max-height: 200px;
  overflow-y: auto;
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
}

/* 脚本帮助 */
.script-help {
  margin-top: 12px;
}

.help-content {
  font-size: 12px;
  color: #666;
}

.help-section {
  margin-bottom: 12px;
}

.help-section ul {
  margin: 8px 0;
  padding-left: 20px;
}

.help-section code {
  background: #f5f5f5;
  padding: 2px 4px;
  border-radius: 2px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
}

/* API测试 */
.api-test-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.api-test-result {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
}

.test-message {
  font-size: 12px;
  color: #666;
}

/* 映射规则 */
.mapping-section {
  min-height: 300px;
}

.mapping-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mapping-rule {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.rule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.rule-index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #007bff;
  color: white;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
}

.rule-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.rule-field {
  display: flex;
  flex-direction: column;
}

.rule-field label {
  font-size: 12px;
  font-weight: 500;
  color: #666;
  margin-bottom: 4px;
}

.empty-mapping {
  text-align: center;
  padding: 40px 20px;
  color: #666;
}

.empty-message {
  margin-bottom: 16px;
  font-size: 14px;
}

/* 触发器配置 */
.triggers-section {
  min-height: 200px;
}

.trigger-config {
  margin-top: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

/* 预览区域 */
.preview-section {
  min-height: 400px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  font-weight: 600;
  color: #333;
}

.config-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
}

.summary-value {
  font-size: 14px;
  color: #333;
  font-weight: 600;
}

.test-result {
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
  color: #333;
}

.result-data {
  background: #f5f5f5;
  border-radius: 4px;
  padding: 8px;
  border: 1px solid #ddd;
}

.result-error {
  padding: 8px;
  background: #fef2f2;
  border-radius: 4px;
  border: 1px solid #fecaca;
}

.config-json {
  margin-top: 16px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .config-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .rule-content {
    grid-template-columns: 1fr;
  }

  .config-summary {
    grid-template-columns: 1fr;
  }

  .preview-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
}
</style>
