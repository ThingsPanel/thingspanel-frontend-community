<template>
  <div class="device-data-source-example-new">
    <n-card title="新的设备API配置系统演示" size="large">
      <template #header-extra>
        <n-space>
          <n-button size="small" @click="showInstructions = !showInstructions">
            {{ showInstructions ? '隐藏说明' : '显示说明' }}
          </n-button>
          <n-button size="small" @click="resetConfig">重置配置</n-button>
        </n-space>
      </template>

      <!-- 使用说明 -->
      <template v-if="showInstructions">
        <n-alert type="info" class="instructions">
          <template #header>
            <strong>🎉 新的设备API配置系统</strong>
          </template>
          <template #default>
            <div class="instruction-content">
              <p><strong>✨ 新功能特性：</strong></p>
              <ul>
                <li>
                  <strong>18种API接口</strong>
                  ：支持遥测、属性、事件、命令、设备信息、模拟数据
                </li>
                <li>
                  <strong>智能表单</strong>
                  ：根据API类型自动显示对应的参数表单
                </li>
                <li>
                  <strong>实时数据预览</strong>
                  ：JSON格式显示API返回数据
                </li>
                <li>
                  <strong>数据映射配置</strong>
                  ：支持配置数据路径映射到组件属性
                </li>
                <li>
                  <strong>轮询管理</strong>
                  ：完整的轮询控制，支持1秒到1小时间隔
                </li>
                <li>
                  <strong>错误处理</strong>
                  ：友好的错误提示和状态管理
                </li>
              </ul>
              <p><strong>🔄 操作流程：</strong></p>
              <ol>
                <li>选择API接口类型（18种可选）</li>
                <li>选择目标设备</li>
                <li>配置API特定参数</li>
                <li>设置轮询配置（可选）</li>
                <li>配置数据映射</li>
                <li>测试和保存配置</li>
              </ol>
            </div>
          </template>
        </n-alert>
      </template>

      <!-- 新的设备API配置系统 -->
      <DeviceApiDemo />

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
      </template>

      <!-- 兼容性说明 -->
      <n-divider title-placement="left">
        <n-space align="center">
          <n-icon><InformationCircle /></n-icon>
          <span>兼容性说明</span>
        </n-space>
      </n-divider>

      <n-alert type="success">
        <template #header>
          <strong>✅ 完全兼容</strong>
        </template>
        <template #default>
          <p>
            新的设备API配置系统完全兼容原有的
            <code>DeviceDataSource</code>
            格式，可以无缝替换原有的配置组件。
          </p>
          <p>新的配置会自动转换为原有的格式，确保与现有系统的兼容性。</p>
        </template>
      </n-alert>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NCard, NDivider, NSpace, NButton, NAlert, NDescriptions, NDescriptionsItem, NTag, NIcon } from 'naive-ui'
import { CheckmarkCircle, InformationCircle } from '@vicons/ionicons5'
import DeviceApiDemo from './device-apis/components/DeviceApiDemo.vue'
import { API_TYPE_OPTIONS } from './device-apis/index'

// 响应式数据
const showInstructions = ref(true)
const savedConfig = ref<any>(null)

// 事件处理
const resetConfig = () => {
  savedConfig.value = null
  console.log('配置已重置')
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
</script>

<style scoped>
.device-data-source-example-new {
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

.instruction-content ul,
.instruction-content ol {
  margin: 8px 0;
  padding-left: 20px;
}

.instruction-content li {
  margin: 4px 0;
  line-height: 1.5;
}
</style>
