<template>
  <div class="device-data-source-example">
    <n-card title="设备数据源配置示例" size="small">
      <n-space vertical>
        <!-- 使用说明 -->
        <n-alert type="info" title="使用说明">
          <template #default>
            <p>
              1.
              <strong>设备选择</strong>
              ：组件会自动加载设备列表，选择设备后会自动获取该设备的指标列表
            </p>
            <p>
              2.
              <strong>数据类型</strong>
              ：选择遥测数据、属性数据、事件数据或命令数据
            </p>
            <p>
              3.
              <strong>数据模式</strong>
              ：只有遥测数据支持历史数据模式，其他类型只能使用最新数据
            </p>
            <p>
              4.
              <strong>轮询方式</strong>
              ：选择定时器、WebSocket或MQTT轮询方式，历史数据只支持定时器轮询
            </p>
            <p>
              5.
              <strong>API接口选择</strong>
              ：选择具体的API接口类型，包括遥测数据、属性数据、事件数据、命令数据、设备信息、模拟数据等各类接口
            </p>
            <p>
              6.
              <strong>数据获取</strong>
              ：点击"手动获取数据"按钮，根据选择的API接口类型调用相应的后端接口
            </p>
            <p>
              7.
              <strong>数据映射</strong>
              ：配置数据路径映射，将原始数据映射到组件属性
            </p>
          </template>
        </n-alert>

        <!-- 数据源配置 -->
        <DeviceDataSourceConfig v-model="dataSource" @update:modelValue="onDataSourceChange" />

        <!-- 配置预览 -->
        <n-divider title-placement="left">配置预览</n-divider>
        <n-card size="small">
          <pre>{{ JSON.stringify(dataSource, null, 2) }}</pre>
        </n-card>

        <!-- 数据预览 -->
        <n-divider title-placement="left">数据预览</n-divider>
        <n-card size="small">
          <div v-if="dataValue">
            <div class="data-item">
              <strong>时间戳:</strong>
              {{ new Date(dataValue.timestamp).toLocaleString() }}
            </div>
            <div class="data-item">
              <strong>数据质量:</strong>
              <n-tag :type="dataValue.quality === 'good' ? 'success' : 'error'">
                {{ dataValue.quality }}
              </n-tag>
            </div>
            <div class="data-item">
              <strong>映射值:</strong>
              <pre>{{ JSON.stringify(dataValue.values, null, 2) }}</pre>
            </div>
          </div>
          <n-empty v-else description="暂无数据" size="small" />
        </n-card>

        <!-- 操作按钮 -->
        <n-space>
          <n-button
            type="primary"
            :loading="isLoading"
            :disabled="!dataSource.deviceId || !dataSource.metricsId"
            @click="startDataSource"
          >
            启动数据源
          </n-button>
          <n-button type="error" @click="stopDataSource">停止数据源</n-button>
          <n-button @click="resetDataSource">重置配置</n-button>
        </n-space>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { NCard, NSpace, NDivider, NButton, NTag, NEmpty, NAlert } from 'naive-ui'
import DeviceDataSourceConfig from './DeviceDataSourceConfig.vue'
import { dataSourceManager } from '@/components/visual-editor/core'
import type { DeviceDataSource, DataSourceValue } from '@/components/visual-editor/types/data-source'
import { DataSourceType } from '@/components/visual-editor/types/data-source'

// 响应式数据
const dataSource = ref<DeviceDataSource>({
  type: DataSourceType.DEVICE,
  enabled: true,
  name: '设备数据源示例',
  description: '这是一个设备数据源配置示例',
  deviceId: '',
  metricsType: 'telemetry',
  dataMode: 'latest',
  pollingType: 'timer',
  timeRange: '1h',
  aggregateFunction: 'avg',
  dataPaths: [],
  refreshInterval: 5000,
  metricsShow: false,
  metricsOptions: [],
  metricsOptionsFetched: false
})

const dataValue = ref<DataSourceValue | null>(null)
const isLoading = ref(false)
const subscriberId = ref<string | null>(null)

// 事件处理
const onDataSourceChange = (newDataSource: DeviceDataSource) => {
  dataSource.value = newDataSource
  console.log('数据源配置已更新:', newDataSource)
}

const startDataSource = async () => {
  if (!dataSource.value.deviceId || !dataSource.value.metricsId) {
    console.warn('请先配置设备和指标')
    return
  }

  isLoading.value = true

  try {
    // 停止现有数据源
    if (subscriberId.value) {
      dataSourceManager.unsubscribe(subscriberId.value)
    }

    // 启动新数据源
    subscriberId.value = dataSourceManager.subscribe(dataSource.value, (value: DataSourceValue) => {
      dataValue.value = value
      console.log('收到数据更新:', value)
    })

    // 立即获取一次数据
    const initialValue = await dataSourceManager.getValue(dataSource.value)
    dataValue.value = initialValue

    console.log('数据源已启动:', subscriberId.value)
  } catch (error) {
    console.error('启动数据源失败:', error)
  } finally {
    isLoading.value = false
  }
}

const stopDataSource = () => {
  if (subscriberId.value) {
    dataSourceManager.unsubscribe(subscriberId.value)
    subscriberId.value = null
    dataValue.value = null
    console.log('数据源已停止')
  }
}

const resetDataSource = () => {
  stopDataSource()
  dataSource.value = {
    type: DataSourceType.DEVICE,
    enabled: true,
    name: '设备数据源示例',
    description: '这是一个设备数据源配置示例',
    deviceId: '',
    metricsType: 'telemetry',
    dataMode: 'latest',
    pollingType: 'timer',
    timeRange: '1h',
    aggregateFunction: 'avg',
    dataPaths: [],
    refreshInterval: 5000,
    metricsShow: false,
    metricsOptions: [],
    metricsOptionsFetched: false
  }
  dataValue.value = null
}

// 组件卸载时清理资源
onUnmounted(() => {
  stopDataSource()
})
</script>

<style scoped>
.device-data-source-example {
  padding: 16px;
  max-width: 800px;
  margin: 0 auto;
}

.data-item {
  margin-bottom: 8px;
}

.data-item strong {
  display: inline-block;
  width: 80px;
  color: #666;
}

.data-item pre {
  margin: 8px 0 0 0;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow-y: auto;
}
</style>
