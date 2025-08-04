<template>
  <div class="data-source-test">
    <h2>数据源测试页面</h2>

    <div class="test-section">
      <h3>JSON 数据源测试</h3>

      <div class="config-panel">
        <h4>配置 JSON 数据源</h4>
        <n-form label-placement="left" label-width="auto" size="small">
          <n-form-item label="JSON 数据">
            <n-input
              v-model:value="jsonConfig"
              type="textarea"
              placeholder='{"data": {"value": 45, "value2": 87, "key": "shuju"}}'
              :rows="4"
            />
          </n-form-item>
          <n-form-item label="刷新间隔">
            <n-input-number v-model:value="refreshInterval" :min="0" :max="10000" placeholder="0表示不自动刷新" />
            <template #suffix>
              <span style="margin-left: 8px; color: #999">毫秒</span>
            </template>
          </n-form-item>
          <n-button type="primary" @click="updateDataSource">更新数据源</n-button>
        </n-form>
      </div>

      <div class="component-preview">
        <h4>组件预览</h4>
        <div class="component-container">
          <DigitIndicatorCard :properties="componentProperties" :metadata="{ dataSource: currentDataSource }" />
        </div>
      </div>

      <div class="data-preview">
        <h4>数据源值预览</h4>
        <pre>{{ JSON.stringify(dataSourceValue, null, 2) }}</pre>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { NForm, NFormItem, NInput, NInputNumber, NButton } from 'naive-ui'
import DigitIndicatorCard from '@/card2.1/components/digit-indicator/DigitIndicatorCard.vue'
import { dataSourceManager } from '../core/data-source-manager'
import { DataSourceType } from '../types/data-source'
import type { DataSourceValue } from '../types/data-source'

const jsonConfig = ref('{"data": {"value": 45, "value2": 87, "key": "shuju"}}')
const refreshInterval = ref(0)
const dataSourceValue = ref<DataSourceValue | null>(null)

// 组件属性
const componentProperties = ref({
  color: 'blue',
  iconName: 'Water'
})

// 当前数据源
const currentDataSource = ref({
  type: DataSourceType.STATIC,
  enabled: true,
  name: '测试数据源',
  description: '测试用的静态数据源',
  data: {
    data: {
      value: 45,
      value2: 87,
      key: 'shuju'
    }
  },
  dataPath: 'data.value', // 默认路径
  refreshInterval: 0
})

// 更新数据源
const updateDataSource = () => {
  try {
    const parsedData = JSON.parse(jsonConfig.value)
    currentDataSource.value = {
      ...currentDataSource.value,
      data: parsedData,
      refreshInterval: refreshInterval.value
    }

    // 重新订阅数据源
    subscribeDataSource()
  } catch (error) {
    console.error('JSON 格式错误:', error)
  }
}

// 订阅数据源
let unsubscribe: (() => void) | null = null

const subscribeDataSource = () => {
  // 取消之前的订阅
  if (unsubscribe) {
    unsubscribe()
  }

  // 订阅新的数据源
  unsubscribe = dataSourceManager.subscribe(currentDataSource.value, value => {
    dataSourceValue.value = value
    console.log('🔧 DataSourceTest - 收到数据源更新:', value)
  })
}

onMounted(() => {
  subscribeDataSource()
})

onBeforeUnmount(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})
</script>

<style scoped>
.data-source-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-section {
  margin-bottom: 30px;
  padding: 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.config-panel {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 6px;
}

.component-preview {
  margin-bottom: 20px;
}

.component-container {
  width: 200px;
  height: 150px;
  border: 1px solid #ddd;
  border-radius: 6px;
  overflow: hidden;
}

.data-preview {
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 6px;
}

.data-preview pre {
  margin: 0;
  font-size: 12px;
  color: #666;
}
</style>
