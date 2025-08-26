<template>
  <div class="form-test-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2>HTTP配置表单测试页面</h2>
      <p class="page-description">测试独立的HTTP配置表单组件，支持示例数据回显和完整配置</p>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-container">
      <!-- 左侧配置区 -->
      <div class="config-section">
        <n-card title="HTTP配置表单" size="small">
          <template #header-extra>
            <!-- 示例按钮 -->
            <div class="example-buttons">
              <n-button size="small" @click="loadGetExample">基础GET</n-button>
              <n-button size="small" @click="loadPostExample">基础POST</n-button>
              <n-button size="small" @click="loadFullExample">拦截器脚本</n-button>
              <n-button size="small" type="info" @click="loadInternalApiExample">设备分组API</n-button>
              <n-button size="small" type="success" @click="loadUserInfoApiExample">用户信息API</n-button>
              <n-button size="small" type="warning" @click="loadSimpleInternalExample">简化内部API</n-button>
              <n-button size="small" type="error" @click="resetForm">重置表单</n-button>
            </div>
          </template>

          <!-- 使用独立的HTTP配置表单组件 -->
          <HttpConfigFormComponent
            ref="httpConfigFormRef"
            v-model="currentHttpConfig"
            @change="onConfigChange"
            @validate="onConfigValidate"
          />

          <!-- 执行按钮和状态 -->
          <div class="execute-section">
            <n-button
              type="primary"
              size="large"
              :loading="isExecuting"
              :disabled="!isValidConfig"
              @click="executeRequest"
            >
              <template #icon>
                <n-icon><SendOutlined /></n-icon>
              </template>
              {{ isExecuting ? '正在执行...' : '执行请求' }}
            </n-button>

            <div class="validation-message" :class="{ error: !isValidConfig && currentHttpConfig?.url }">
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

                <n-tab-pane name="config" tab="当前配置">
                  <div class="json-viewer">
                    <pre>{{ formatJson(currentHttpConfig) }}</pre>
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
 * HTTP配置表单测试页面
 * 专门用于测试 HttpConfigFormComponent 组件
 */

import { ref, computed } from 'vue'
import { SendOutlined } from '@vicons/antd'

// 导入组件
import HttpConfigFormComponent from './HttpConfigFormComponent.vue'

// 导入类型定义和执行器
import type { HttpConfig } from '@/core/data-source-system/types/http-config'
import { HttpConfigConverter } from '@/core/data-source-system/types/http-config'
import { DataExecutorFactory } from '@/core/data-source-system/executors/DataExecutorFactory'
import type { ExecutionResult, HttpExecutionConfig } from '@/core/data-source-system/executors/DataExecutorFactory'

// ========== 响应式数据 ==========

// HTTP配置表单引用
const httpConfigFormRef = ref()

// 当前HTTP配置
const currentHttpConfig = ref<HttpConfig>(HttpConfigConverter.createDefaultConfig())

// 配置验证状态
const isValidConfig = ref(false)
const validationErrors = ref<string[]>([])
const validationMessage = ref('请完成配置')

// 执行状态
const isExecuting = ref(false)
const executionResult = ref<ExecutionResult | null>(null)
const executionError = ref<string>('')
const executionTime = ref<number>(0)

// ========== 方法定义 ==========

/**
 * 配置变化处理
 */
const onConfigChange = (config: HttpConfig) => {
  currentHttpConfig.value = config
  // 清空之前的结果
  executionResult.value = null
  executionError.value = ''
  console.log('🔄 配置已更新:', config)
}

/**
 * 配置验证处理
 */
const onConfigValidate = (valid: boolean, errors: string[]) => {
  isValidConfig.value = valid
  validationErrors.value = errors

  if (valid) {
    validationMessage.value = '配置验证通过'
  } else if (errors.length > 0) {
    validationMessage.value = errors[0]
  } else {
    validationMessage.value = '请完成配置'
  }

  console.log('✅ 验证状态:', valid, errors)
}

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
 * 加载完整配置示例 - 包含请求和响应拦截器脚本
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
 * 加载内部API示例 - 测试项目内部请求服务
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
 * 加载用户信息API示例 - 测试认证相关的内部API
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
 * 加载简化内部API示例 - 不包含脚本的基础测试
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
 * 重置表单
 */
const resetForm = () => {
  console.log('🔄 重置表单')
  httpConfigFormRef.value?.reset()
  executionResult.value = null
  executionError.value = ''
}

/**
 * 执行HTTP请求
 */
const executeRequest = async () => {
  console.log('🎯 [executeRequest] 开始执行，配置有效性:', isValidConfig.value)
  console.log('🎯 [executeRequest] 当前配置:', currentHttpConfig.value)

  if (!isValidConfig.value) {
    console.error('❌ [executeRequest] 配置无效:', validationMessage.value)
    window.$message?.warning('请检查配置: ' + validationMessage.value)
    return
  }

  isExecuting.value = true
  executionError.value = ''
  executionResult.value = null

  try {
    console.log('🚀 [executeRequest] 开始执行HTTP请求')

    // 使用当前的HTTP配置
    const httpConfig = currentHttpConfig.value
    console.log('📋 [executeRequest] HTTP配置:', httpConfig)

    // 构建执行配置
    const executionConfig: HttpExecutionConfig = {
      type: 'http',
      id: 'test-http-request',
      name: 'HTTP配置测试请求',
      config: httpConfig
    }
    console.log('⚙️ [executeRequest] 执行器配置:', executionConfig)

    // 使用执行器工厂执行请求
    console.log('🏭 [executeRequest] 调用执行器工厂...')
    const result = await DataExecutorFactory.execute(executionConfig)

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

// ========== 生命周期 ==========

// 页面加载完成后默认加载GET示例
setTimeout(() => {
  console.log('🎬 表单测试页面已加载')
  loadGetExample()
}, 100)
</script>

<style scoped>
.form-test-page {
  height: 100vh;
  padding: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
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
  flex: 0 0 400px;
  display: flex;
  flex-direction: column;
}

.config-section :deep(.n-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.config-section :deep(.n-card-body) {
  flex: 1;
  overflow: auto;
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

.example-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.execute-section {
  padding-top: 16px;
  margin-top: 16px;
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
</style>
