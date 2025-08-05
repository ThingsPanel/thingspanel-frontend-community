<template>
  <div class="component-api-config-test">
    <n-card title="组件API配置自动化系统测试" size="small">
      <n-space vertical :size="24">
        <!-- 数字指示器测试 -->
        <n-card title="数字指示器 (digit-indicator)" size="small">
          <template #header-extra>
            <n-tag type="success">自动配置</n-tag>
          </template>

          <div class="test-content">
            <div class="config-display">
              <h4>配置信息:</h4>
              <pre>{{ JSON.stringify(digitConfig, null, 2) }}</pre>
            </div>

            <n-divider />

            <DeviceDataSourceConfigNew
              v-model="digitConfig"
              component-type="digit-indicator"
              @update:modelValue="onDigitConfigChange"
            />
          </div>
        </n-card>

        <!-- 曲线图测试 -->
        <n-card title="曲线图 (curve)" size="small">
          <template #header-extra>
            <n-tag type="success">自动配置</n-tag>
          </template>

          <div class="test-content">
            <div class="config-display">
              <h4>配置信息:</h4>
              <pre>{{ JSON.stringify(curveConfig, null, 2) }}</pre>
            </div>

            <n-divider />

            <DeviceDataSourceConfigNew
              v-model="curveConfig"
              component-type="curve"
              @update:modelValue="onCurveConfigChange"
            />
          </div>
        </n-card>

        <!-- 手动配置测试 -->
        <n-card title="手动配置模式" size="small">
          <template #header-extra>
            <n-tag type="warning">手动选择</n-tag>
          </template>

          <div class="test-content">
            <div class="config-display">
              <h4>配置信息:</h4>
              <pre>{{ JSON.stringify(manualConfig, null, 2) }}</pre>
            </div>

            <n-divider />

            <DeviceDataSourceConfigNew v-model="manualConfig" @update:modelValue="onManualConfigChange" />
          </div>
        </n-card>

        <!-- API配置信息展示 -->
        <n-card title="API配置信息" size="small">
          <n-tabs type="segment">
            <n-tab-pane name="digit-indicator" tab="数字指示器">
              <div class="api-info">
                <h4>组件配置:</h4>
                <pre>{{ JSON.stringify(digitIndicatorApiConfig, null, 2) }}</pre>
              </div>
            </n-tab-pane>
            <n-tab-pane name="curve" tab="曲线图">
              <div class="api-info">
                <h4>组件配置:</h4>
                <pre>{{ JSON.stringify(curveApiConfig, null, 2) }}</pre>
              </div>
            </n-tab-pane>
          </n-tabs>
        </n-card>
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NCard, NSpace, NTag, NDivider, NTabs, NTabPane } from 'naive-ui'
import DeviceDataSourceConfigNew from '@/components/visual-editor/settings/data-sources/DeviceDataSourceConfigNew.vue'
import { getComponentApiConfig } from '@/components/visual-editor/core/component-api-config'

// 配置数据
const digitConfig = ref({})
const curveConfig = ref({})
const manualConfig = ref({})

// API配置信息
const digitIndicatorApiConfig = computed(() => getComponentApiConfig('digit-indicator'))
const curveApiConfig = computed(() => getComponentApiConfig('curve'))

// 事件处理
const onDigitConfigChange = (newConfig: any) => {
  console.log('🔧 数字指示器配置变化:', newConfig)
  digitConfig.value = newConfig
}

const onCurveConfigChange = (newConfig: any) => {
  console.log('🔧 曲线图配置变化:', newConfig)
  curveConfig.value = newConfig
}

const onManualConfigChange = (newConfig: any) => {
  console.log('🔧 手动配置变化:', newConfig)
  manualConfig.value = newConfig
}
</script>

<style scoped>
.component-api-config-test {
  padding: 20px;
}

.test-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-display {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e0e0e0;
}

.config-display h4 {
  margin: 0 0 8px 0;
  color: #333;
}

.config-display pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  max-height: 200px;
  overflow-y: auto;
}

.api-info {
  background: #f8fafc;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.api-info h4 {
  margin: 0 0 8px 0;
  color: #2d3748;
}

.api-info pre {
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: #4a5568;
}
</style>
