<template>
  <div class="http-config-test">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>{{ $t('test.httpConfigTest.title') }}</h2>
      <p class="page-description">{{ $t('test.httpConfigTest.description') }}</p>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-container">
      <!-- 左侧配置区 -->
      <div class="config-section">
        <n-card title="HTTP配置" size="small">
          <template #header-extra>
            <!-- 示例按钮 -->
            <div class="example-buttons">
              <n-button size="small" @click="loadGetExample">基础GET</n-button>
              <n-button size="small" @click="loadPostExample">基础POST</n-button>
              <n-button size="small" @click="loadFullExample">拦截器脚本</n-button>
              <n-button size="small" type="info" @click="loadInternalApiExample">设备分组API</n-button>
              <n-button size="small" type="success" @click="loadUserInfoApiExample">用户信息API</n-button>
              <n-button size="small" type="warning" @click="loadSimpleInternalExample">简化内部API</n-button>
              <n-button size="small" type="primary" @click="loadDynamicParamExample">动态参数示例</n-button>
            </div>
          </template>

          <!-- 使用表单组件 -->
          <SimpleHttpForm
            ref="httpConfigFormRef"
            v-model="currentHttpConfig"
            @change="onConfigChange"
            @validate="onConfigValidate"
          />

          <!-- 参数上下文 -->
          <n-divider title-placement="left">测试参数上下文</n-divider>
          <div class="context-section">
            <n-alert type="info" :show-icon="false" class="context-info">
              <template #icon><span>🎯</span></template>
              <div class="context-description">
                <strong>参数上下文</strong>
                - 模拟卡片组件传递给HTTP执行器的参数数据
              </div>
            </n-alert>

            <n-form size="small" class="context-form">
              <div class="context-row">
                <n-form-item label="设备ID">
                  <n-input v-model:value="testContext.deviceId" placeholder="device-12345" />
                </n-form-item>
                <n-form-item label="用户ID">
                  <n-input v-model:value="testContext.userId" placeholder="user-001" />
                </n-form-item>
                <n-form-item label="分页大小">
                  <n-input-number v-model:value="testContext.pageSize" :min="1" :max="100" />
                </n-form-item>
              </div>

              <div class="context-row">
                <n-form-item label="开始时间">
                  <n-input v-model:value="testContext.$system!.timeRange!.start" />
                </n-form-item>
                <n-form-item label="结束时间">
                  <n-input v-model:value="testContext.$system!.timeRange!.end" />
                </n-form-item>
              </div>

              <n-button dashed size="small" @click="resetTestContext">重置为默认值</n-button>
            </n-form>
          </div>

          <!-- 状态显示 -->
          <div class="status-section">
            <n-tag :type="isValidConfig ? 'success' : 'warning'" size="small">
              {{ isValidConfig ? (isExecuting ? '正在执行...' : '配置有效，自动执行') : '请完善配置' }}
            </n-tag>
            <div class="validation-message">
              {{ validationMessage }}
            </div>
          </div>
        </n-card>
      </div>

      <!-- 右侧结果区 -->
      <div class="result-section">
        <n-card title="执行结果" size="small">
          <div class="result-content">
            <!-- 执行状态 -->
            <div class="status-info">
              <n-tag :type="getStatusType()" size="small">
                {{ getStatusText() }}
              </n-tag>
              <span v-if="executionTime" class="execution-time">执行时间: {{ executionTime }}ms</span>
            </div>

            <!-- 结果数据展示 -->
            <div v-if="executionResult" class="result-data">
              <n-tabs type="line" animated>
                <n-tab-pane name="response" tab="响应数据">
                  <div class="json-viewer">
                    <pre>{{ formatJson(executionResult.data) }}</pre>
                  </div>
                </n-tab-pane>

                <n-tab-pane name="meta" tab="元信息">
                  <div class="meta-info">
                    <div v-if="executionResult.success" class="meta-item">
                      <span class="meta-label">执行状态:</span>
                      <span class="meta-value">成功</span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-label">执行时间:</span>
                      <span class="meta-value">{{ executionResult.executionTime }}ms</span>
                    </div>
                    <div class="meta-item">
                      <span class="meta-label">时间戳:</span>
                      <span class="meta-value">{{ new Date(executionResult.timestamp).toLocaleString() }}</span>
                    </div>
                  </div>
                </n-tab-pane>
              </n-tabs>
            </div>

            <!-- 错误信息展示 -->
            <div v-if="executionError" class="error-info">
              <n-alert type="error" title="执行错误">
                <pre>{{ executionError }}</pre>
              </n-alert>
            </div>

            <!-- 暂无数据提示 -->
            <div v-if="!executionResult && !executionError && !isExecuting" class="empty-state">
              <n-empty description="点击左侧【执行请求】按钮开始测试HTTP配置" size="medium" />
            </div>
          </div>
        </n-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * HTTP配置测试页面 - 简化版本
 * 用于测试和验证HTTP配置的正确性，以及执行器的功能
 */

import { ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'

// 导入组件
import SimpleHttpForm from './SimpleHttpForm.vue'

// 导入类型定义和执行器
import type { HttpConfig } from '@/core/data-source-system/types/http-config'
import type { ParamContext } from '@/core/data-source-system/types/dynamic-params'
import { DataExecutorFactory } from '@/core/data-source-system/executors/DataExecutorFactory'
import type { ExecutionResult, HttpExecutionConfig } from '@/core/data-source-system/executors/DataExecutorFactory'

// 国际化
const { t } = useI18n()

// ========== 响应式数据 ==========

// 表单组件引用
const httpConfigFormRef = ref()

// 当前HTTP配置（初始化为空对象）
const currentHttpConfig = ref<HttpConfig>({} as HttpConfig)

// 表单验证状态
const isValidConfig = ref(false)
const validationErrors = ref<string[]>([])
const validationMessage = ref('请完成配置')

// 执行状态
const isExecuting = ref(false)
const executionResult = ref<ExecutionResult | null>(null)
const executionError = ref<string>('')
const executionTime = ref<number>(0)

// 测试用的参数上下文
const testContext = ref<ParamContext>({
  deviceId: 'device-12345',
  pageSize: 10,
  userId: 'user-001',
  $system: {
    timestamp: Date.now(),
    userId: 'admin',
    deviceId: 'device-12345',
    timeRange: {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString()
    }
  }
})

// ========== 方法定义 ==========

/**
 * 表单配置变化处理
 */
const onConfigChange = (config: HttpConfig) => {
  currentHttpConfig.value = config
  // 清空之前的结果
  executionResult.value = null
  executionError.value = ''
  console.log('🔄 配置已更新:', config)
}

/**
 * 表单验证处理
 */
const onConfigValidate = (valid: boolean, errors: string[]) => {
  isValidConfig.value = valid
  validationErrors.value = errors

  if (valid) {
    validationMessage.value = '配置验证通过'
    // 验证通过就自动执行
    executeRequest()
  } else if (errors.length > 0) {
    validationMessage.value = errors[0]
  } else {
    validationMessage.value = '请完成配置'
  }

  console.log('✅ 验证状态:', valid, errors)
}

// ========== 示例方法 ==========

/**
 * 加载GET请求示例
 */
const loadGetExample = () => {
  const example: HttpConfig = {
    url: 'https://jsonplaceholder.typicode.com/posts/1',
    method: 'GET',
    headers: {
      Accept: 'application/json'
    },
    params: {},
    timeout: 10000
  }
  console.log('📄 加载GET示例:', example)
  httpConfigFormRef.value?.loadConfig(example)
}

/**
 * 加载POST请求示例
 */
const loadPostExample = () => {
  const example: HttpConfig = {
    url: 'https://jsonplaceholder.typicode.com/posts',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    params: {},
    body: JSON.stringify({
      title: '测试标题',
      body: '测试内容',
      userId: 1
    }),
    timeout: 10000
  }
  console.log('📝 加载POST示例:', example)
  httpConfigFormRef.value?.loadConfig(example)
}

/**
 * 加载完整配置示例
 */
const loadFullExample = () => {
  const example: HttpConfig = {
    url: 'https://httpbin.org/anything',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Client': 'HTTP-Config-Test'
    },
    params: {
      test: '1',
      debug: 'true'
    },
    body: JSON.stringify({
      name: '张三',
      age: 25,
      email: 'zhangsan@example.com'
    }),
    timeout: 15000,
    preRequestScript: `config.headers["X-Request-Time"] = new Date().toISOString(); config.headers["Authorization"] = "Bearer test-token"; if (config.method === "POST" && config.body) { const bodyData = JSON.parse(config.body); bodyData.timestamp = Date.now(); config.body = JSON.stringify(bodyData); } console.log("📤 请求拦截器执行:", config); return config;`,
    responseScript: `console.log("📥 响应拦截器执行:", response); if (response.json && response.json.json) { return { originalData: response.json, processedData: response.json.json, requestHeaders: response.json.headers, timestamp: new Date().toISOString() }; } return response;`
  }
  console.log('⚙️ 加载完整示例:', example)
  httpConfigFormRef.value?.loadConfig(example)
}

/**
 * 加载内部API示例
 */
const loadInternalApiExample = () => {
  const example: HttpConfig = {
    url: '/device/group',
    method: 'GET',
    headers: {
      Accept: 'application/json'
    },
    params: {
      page: '1',
      page_size: '10'
    },
    timeout: 10000,
    preRequestScript: `config.headers["X-Client"] = "HTTP-Config-Test"; config.headers["X-Request-Time"] = new Date().toISOString(); console.log("📤 内部API请求拦截器执行:", config); return config;`,
    responseScript: `console.log("📥 设备分组API响应拦截器执行:", response); const apiData = response.json; console.log("📥 实际响应数据:", apiData); if (apiData && (apiData.code === 200 || (apiData.list && Array.isArray(apiData.list)))) { return { success: true, message: "设备分组获取成功", data: apiData.data || apiData.list || apiData, originalResponse: apiData }; } else { return { success: false, error: apiData.message || "设备分组获取失败", originalResponse: apiData }; }`
  }
  console.log('🏢 加载内部API示例:', example)
  httpConfigFormRef.value?.loadConfig(example)
}

/**
 * 加载用户信息API示例
 */
const loadUserInfoApiExample = () => {
  const example: HttpConfig = {
    url: '/user/detail',
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    params: {},
    timeout: 8000,
    preRequestScript: `config.headers["X-Client"] = "HTTP-Config-Test"; config.headers["X-Module"] = "User-Management"; console.log("📤 用户API请求拦截器执行:", config); return config;`,
    responseScript: `console.log("📥 用户API响应拦截器执行:", response); const userData = response.json; console.log("📥 实际用户数据:", userData); if (userData && (userData.code === 200 || userData.id || userData.name)) { const user = userData.data || userData; return { success: true, message: "用户信息获取成功", userProfile: { id: user.id, name: user.name, email: user.email, authority: user.authority }, originalResponse: userData }; } else { return { success: false, error: userData.message || "用户信息获取失败", originalResponse: userData }; }`
  }
  console.log('👤 加载用户API示例:', example)
  httpConfigFormRef.value?.loadConfig(example)
}

/**
 * 加载简化内部API示例
 */
const loadSimpleInternalExample = () => {
  const example: HttpConfig = {
    url: '/device/group',
    method: 'GET',
    headers: {
      Accept: 'application/json'
    },
    params: {
      page: '1',
      page_size: '5'
    },
    timeout: 10000
  }
  console.log('📋 加载简化示例:', example)
  httpConfigFormRef.value?.loadConfig(example)
}

/**
 * 加载动态参数示例
 */
const loadDynamicParamExample = () => {
  const example: HttpConfig = {
    url: '/device/${deviceId}/telemetry',
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'X-User-ID': '${userId}',
      'X-Request-Time': '${currentTime}'
    },
    params: {
      page: '1',
      page_size: '${pageSize}',
      start_time: '${$system.timeRange.start}',
      end_time: '${$system.timeRange.end}'
    },
    timeout: 10000,
    dynamicParams: [
      {
        name: 'deviceId',
        source: 'context',
        type: 'string',
        required: true,
        description: '设备ID（从卡片上下文获取）'
      },
      {
        name: 'userId',
        source: 'context',
        type: 'string',
        required: true,
        description: '用户ID（从执行上下文获取）'
      },
      {
        name: 'pageSize',
        source: 'static',
        type: 'number',
        required: false,
        staticValue: 20,
        description: '分页大小（固定配置）'
      },
      {
        name: 'currentTime',
        source: 'computed',
        type: 'string',
        required: false,
        computedConfig: {
          computeScript: 'new Date().toISOString()',
          dependencies: [],
          async: false
        },
        description: '当前时间戳（动态计算）'
      }
    ],
    preRequestScript: `
// 动态参数示例的前置脚本
console.log("📊 动态参数解析后的配置:", config);
console.log("🎯 URL:", config.url);
console.log("📋 Headers:", config.headers);
console.log("🔍 Params:", config.params);

// 可以在这里做最后的调整
config.headers["X-Example"] = "DynamicParamTest";
return config;`,
    responseScript: `
// 动态参数示例的响应脚本
console.log("📥 动态参数请求响应:", response);
return {
  success: true,
  message: "动态参数请求成功",
  requestUrl: response.url || "未知",
  data: response.json,
  timestamp: new Date().toISOString()
};`
  }

  console.log('🎯 加载动态参数示例:', example)
  httpConfigFormRef.value?.loadConfig(example)
}

/**
 * 重置测试参数上下文
 */
const resetTestContext = () => {
  testContext.value = {
    deviceId: 'device-12345',
    pageSize: 10,
    userId: 'user-001',
    $system: {
      timestamp: Date.now(),
      userId: 'admin',
      deviceId: 'device-12345',
      timeRange: {
        start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString()
      }
    }
  }
  console.log('🔄 重置测试参数上下文:', testContext.value)
}

// ========== 执行方法 ==========

/**
 * 执行HTTP请求
 */
const executeRequest = async () => {
  console.log('🎯 [执行请求] 开始执行，配置有效性:', isValidConfig.value)
  console.log('🎯 [执行请求] 配置:', currentHttpConfig.value)

  if (!isValidConfig.value) {
    console.error('❌ [执行请求] 配置无效:', validationMessage.value)
    window.$message?.warning('请检查配置: ' + validationMessage.value)
    return
  }

  isExecuting.value = true
  executionError.value = ''
  executionResult.value = null

  try {
    console.log('🚀 [执行请求] 开始执行HTTP请求')

    // 使用当前的HTTP配置
    const httpConfig = currentHttpConfig.value
    console.log('📋 [执行请求] HTTP配置:', httpConfig)

    // 构建执行配置
    const executionConfig: HttpExecutionConfig = {
      type: 'http',
      id: 'test-http-request',
      name: 'HTTP配置测试请求',
      config: httpConfig
    }
    console.log('⚙️ [执行请求] 执行器配置:', executionConfig)

    // 使用执行器工厂执行请求（传递参数上下文）
    console.log('🏭 [执行请求] 调用执行器工厂...', { config: executionConfig, context: testContext.value })
    const result = await DataExecutorFactory.execute(executionConfig, testContext.value)

    // 更新状态
    executionTime.value = result.executionTime

    if (result.success) {
      executionResult.value = result
      console.log('✅ HTTP请求执行成功:', result)
      window.$message?.success('HTTP请求执行成功')
    } else {
      executionError.value = result.error || '请求执行失败'
      console.error('❌ HTTP请求执行失败:', result.error)
      window.$message?.error(`HTTP请求执行失败: ${result.error}`)
    }
  } catch (error: any) {
    console.error('❌ HTTP请求执行出现异常:', error)
    executionError.value = error.message || '请求执行异常'
    window.$message?.error(`HTTP请求执行异常: ${error.message}`)
  } finally {
    isExecuting.value = false
  }
}

/**
 * 获取状态类型
 */
const getStatusType = () => {
  if (isExecuting.value) return 'info'
  if (executionError.value) return 'error'
  if (executionResult.value) return 'success'
  return 'default'
}

/**
 * 获取状态文本
 */
const getStatusText = () => {
  if (isExecuting.value) return '执行中...'
  if (executionError.value) return '执行失败'
  if (executionResult.value) return '执行成功'
  return '待执行'
}

/**
 * 格式化JSON显示
 */
const formatJson = (data: any): string => {
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

// ========== 组件挂载 ==========

// 初始化：确保表单为空
nextTick(() => {
  console.log('🎬 HTTP配置测试页面已加载')
  console.log('📋 表单初始化为空状态，请点击示例按钮加载数据')

  // 确保表单组件初始化为空状态
  if (httpConfigFormRef.value) {
    httpConfigFormRef.value.reset()
  }
})
</script>

<style scoped>
.http-config-test {
  min-height: 100vh;
  padding: 16px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 16px;
}

.page-header h2 {
  margin: 0 0 8px 0;
  color: var(--text-color);
}

.page-description {
  margin: 0;
  color: var(--text-color-3);
  font-size: 14px;
}

.content-container {
  flex: 1;
  display: flex;
  gap: 16px;
  min-height: 0;
}

.config-section {
  flex: 0 0 450px;
  display: flex;
  flex-direction: column;
}

.config-section :deep(.n-card) {
  display: flex;
  flex-direction: column;
}

.config-section :deep(.n-card-body) {
  padding: 16px;
}

.result-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.result-section :deep(.n-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.result-section :deep(.n-card-body) {
  flex: 1;
  overflow: hidden;
}

.config-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-item {
  margin-bottom: 0;
}

.example-buttons {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.status-section {
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.validation-message {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-color-3);
  transition: color 0.2s ease;
}

.validation-message.error {
  color: var(--error-color);
  font-weight: 500;
}

.result-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.execution-time {
  font-size: 12px;
  color: var(--text-color-3);
}

.result-data {
  flex: 1;
  min-height: 0;
}

.result-data :deep(.n-tabs-content) {
  height: calc(100% - 40px);
  overflow: hidden;
}

.result-data :deep(.n-tab-pane) {
  height: 100%;
  overflow: auto;
}

.json-viewer {
  height: 100%;
  overflow: auto;
}

.json-viewer pre {
  margin: 0;
  padding: 12px;
  background: var(--code-color);
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-color);
  white-space: pre-wrap;
  word-break: break-all;
}

.meta-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.meta-label {
  font-weight: 500;
  color: var(--text-color-2);
  min-width: 80px;
}

.meta-value {
  color: var(--text-color);
  flex: 1;
  word-break: break-all;
}

.error-info {
  margin-top: 16px;
}

.error-info pre {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-all;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.context-section {
  margin: 16px 0;
  padding: 16px;
  background: var(--card-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.context-info {
  margin-bottom: 12px;
}

.context-description {
  font-size: 13px;
  line-height: 1.4;
}

.context-form {
  margin-top: 12px;
}

.context-row {
  display: grid;
  grid-template-columns: 1fr 1fr 120px;
  gap: 16px;
  margin-bottom: 12px;
}

.context-row:last-of-type {
  grid-template-columns: 1fr 1fr;
  margin-bottom: 16px;
}
</style>
