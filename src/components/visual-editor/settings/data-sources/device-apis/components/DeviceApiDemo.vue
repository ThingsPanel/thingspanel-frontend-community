<template>
  <div class="device-api-demo">
    <n-card title="设备API配置系统演示" size="large">
      <template #header-extra>
        <n-space>
          <n-button size="small" @click="showInstructions = !showInstructions">
            {{ showInstructions ? '隐藏说明' : '显示说明' }}
          </n-button>
          <n-button size="small" @click="resetAll">重置所有</n-button>
        </n-space>
      </template>

      <!-- 使用说明 -->
      <template v-if="showInstructions">
        <n-alert type="info" class="instructions">
          <template #header>
            <strong>系统功能说明</strong>
          </template>
          <template #default>
            <div class="instruction-content">
              <p>
                <strong>🎯 系统目标</strong>
                ：根据不同的设备API接口，显示对应的表单，请求数据并进行映射
              </p>
              <p>
                <strong>📋 操作流程</strong>
                ：
              </p>
              <ol>
                <li>
                  <strong>选择API接口类型</strong>
                  ：从18种设备API中选择需要的接口
                </li>
                <li>
                  <strong>选择设备</strong>
                  ：从设备列表中选择目标设备
                </li>
                <li>
                  <strong>配置参数</strong>
                  ：根据API类型填写相应的参数
                </li>
                <li>
                  <strong>轮询配置</strong>
                  ：可选择启用轮询，自动定时获取数据
                </li>
                <li>
                  <strong>数据映射</strong>
                  ：配置API返回数据的映射关系
                </li>
                <li>
                  <strong>保存配置</strong>
                  ：保存完整的配置信息
                </li>
              </ol>
              <p>
                <strong>🔧 支持的API类型</strong>
                ：
              </p>
              <ul>
                <li>
                  <strong>遥测数据</strong>
                  ：当前值、历史值、发布、日志
                </li>
                <li>
                  <strong>属性数据</strong>
                  ：数据集、指定键值、发布、日志
                </li>
                <li>
                  <strong>事件数据</strong>
                  ：事件数据集
                </li>
                <li>
                  <strong>命令数据</strong>
                  ：发布命令、日志、自定义命令
                </li>
                <li>
                  <strong>设备信息</strong>
                  ：详情、连接信息、告警状态、告警历史
                </li>
                <li>
                  <strong>模拟数据</strong>
                  ：获取、发送
                </li>
              </ul>
            </div>
          </template>
        </n-alert>
      </template>

      <!-- 主配置组件 -->
      <DeviceApiConfig v-model="apiConfig" @config-saved="onConfigSaved" @config-tested="onConfigTested" />

      <!-- 配置结果展示 -->
      <template v-if="savedConfig">
        <n-divider title-placement="left">
          <n-space align="center">
            <n-icon><CheckmarkCircle /></n-icon>
            <span>配置结果</span>
          </n-space>
        </n-divider>

        <n-card size="small" title="已保存的配置">
          <n-descriptions :column="2" bordered>
            <n-descriptions-item label="API类型">
              {{ getApiTypeLabel(savedConfig.apiType) }}
            </n-descriptions-item>
            <n-descriptions-item label="设备ID">
              {{ savedConfig.deviceId }}
            </n-descriptions-item>
            <n-descriptions-item label="轮询状态">
              <n-tag :type="savedConfig.polling?.enabled ? 'success' : 'default'">
                {{ savedConfig.polling?.enabled ? '已启用' : '未启用' }}
              </n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="轮询间隔">
              {{ savedConfig.polling?.interval ? `${savedConfig.polling.interval / 1000}秒` : '未设置' }}
            </n-descriptions-item>
            <n-descriptions-item label="数据映射数量">{{ savedConfig.dataPaths?.length || 0 }} 个</n-descriptions-item>
            <n-descriptions-item label="配置时间">
              {{ formatTime(savedConfig.timestamp) }}
            </n-descriptions-item>
          </n-descriptions>
        </n-card>

        <!-- 映射结果展示 -->
        <template v-if="savedConfig.dataPaths && savedConfig.dataPaths.length > 0">
          <n-card size="small" title="数据映射结果" class="mapping-result">
            <n-table :bordered="false" :single-line="false">
              <thead>
                <tr>
                  <th>组件属性</th>
                  <th>数据路径</th>
                  <th>数据类型</th>
                  <th>示例值</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mapping in savedConfig.dataPaths" :key="mapping.target">
                  <td>{{ mapping.target }}</td>
                  <td>{{ mapping.path }}</td>
                  <td>{{ mapping.type || 'auto' }}</td>
                  <td>{{ getSampleValue(mapping) }}</td>
                </tr>
              </tbody>
            </n-table>
          </n-card>
        </template>
      </template>

      <!-- 测试结果展示 -->
      <template v-if="testResult">
        <n-divider title-placement="left">
          <n-space align="center">
            <n-icon><Beaker /></n-icon>
            <span>测试结果</span>
          </n-space>
        </n-divider>

        <n-card size="small" title="API测试结果">
          <n-alert :type="testResult.success ? 'success' : 'error'">
            <template #header>
              {{ testResult.success ? '测试成功' : '测试失败' }}
            </template>
            <template #default>
              <p v-if="testResult.success">数据获取成功，共获取到 {{ getDataCount(testResult.data) }} 条数据</p>
              <p v-else>测试失败：{{ testResult.error || '未知错误' }}</p>
            </template>
          </n-alert>
        </n-card>
      </template>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  NCard,
  NDivider,
  NSpace,
  NButton,
  NAlert,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  NTable,
  NIcon
} from 'naive-ui'
import { CheckmarkCircle, Beaker } from '@vicons/ionicons5'
import DeviceApiConfig from './DeviceApiConfig.vue'
import { API_TYPE_OPTIONS } from '../index'

// 响应式数据
const showInstructions = ref(true)
const apiConfig = ref<any>({
  deviceId: '',
  apiType: 'telemetry_current',
  parameters: {},
  polling: {
    enabled: false,
    interval: 5000,
    status: 'stopped'
  },
  dataPaths: []
})

const savedConfig = ref<any>(null)
const testResult = ref<any>(null)

// 事件处理
const onConfigSaved = (config: any) => {
  savedConfig.value = {
    ...config,
    timestamp: new Date().toISOString()
  }
  console.log('配置已保存:', savedConfig.value)
}

const onConfigTested = (result: any) => {
  testResult.value = result
  console.log('测试结果:', testResult.value)
}

const resetAll = () => {
  apiConfig.value = {
    deviceId: '',
    apiType: 'telemetry_current',
    parameters: {},
    polling: {
      enabled: false,
      interval: 5000,
      status: 'stopped'
    },
    dataPaths: []
  }
  savedConfig.value = null
  testResult.value = null
}

// 工具函数
const getApiTypeLabel = (apiType: string) => {
  const option = API_TYPE_OPTIONS.find(opt => opt.value === apiType)
  return option?.label || apiType
}

const formatTime = (timeString: string) => {
  if (!timeString) return ''
  try {
    const date = new Date(timeString)
    return date.toLocaleString('zh-CN')
  } catch {
    return timeString
  }
}

const getDataCount = (data: any) => {
  if (!data) return 0
  if (Array.isArray(data)) return data.length
  if (typeof data === 'object') return Object.keys(data).length
  return 1
}

const getSampleValue = (mapping: any) => {
  // 这里可以根据映射路径从实际数据中提取示例值
  // 暂时返回一个占位符
  return '示例值'
}
</script>

<style scoped>
.device-api-demo {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.instructions {
  margin-bottom: 20px;
}

.instruction-content p {
  margin: 8px 0;
  line-height: 1.6;
}

.instruction-content ol,
.instruction-content ul {
  margin: 8px 0;
  padding-left: 20px;
}

.instruction-content li {
  margin: 4px 0;
  line-height: 1.5;
}

.mapping-result {
  margin-top: 16px;
}
</style>
