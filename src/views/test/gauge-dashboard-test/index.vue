<!--
仪表盘组件测试页面
测试新创建的gauge-dashboard组件功能
-->
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useThemeStore } from '@/store/modules/theme'
import { useI18n } from 'vue-i18n'
import type { GaugeDashboardCustomize } from '@/card2.1/components/dashboard/gauge-dashboard/settingConfig'
import { customConfig } from '@/card2.1/components/dashboard/gauge-dashboard/settingConfig'
import GaugeDashboardCard from '@/card2.1/components/dashboard/gauge-dashboard/index.vue'
import GaugeDashboardSetting from '@/card2.1/components/dashboard/gauge-dashboard/setting.vue'

// 国际化和主题
const { t } = useI18n()
const themeStore = useThemeStore()

// 页面状态
const activeTab = ref('demo')
const selectedPreset = ref('temperature')
const simulationRunning = ref(false)
const currentSimulationValue = ref(25)

// 仪表盘配置
const gaugeConfig = reactive({
  customize: { ...customConfig }
})

// 实时数据模拟
const simulationData = ref({
  currentValue: 25,
  unit: '℃',
  title: '室内温度',
  lastUpdateTime: Date.now(),
  thresholdStatus: 'normal',
  percentage: 50
})

/**
 * 预设配置
 */
const presetConfigs = {
  temperature: {
    title: '室内温度',
    displayMode: 'semi-circle' as const,
    gaugeType: 'temperature' as const,
    minValue: -20,
    maxValue: 50,
    currentValue: 25,
    unit: '℃',
    colorRanges: [
      { from: -20, to: 0, color: '#4dabf7', label: '低温' },
      { from: 0, to: 25, color: '#51cf66', label: '适宜' },
      { from: 25, to: 35, color: '#ffd43b', label: '偏热' },
      { from: 35, to: 50, color: '#ff6b6b', label: '高温' }
    ],
    warningThreshold: 30,
    dangerThreshold: 40
  },
  humidity: {
    title: '空气湿度',
    displayMode: 'arc' as const,
    gaugeType: 'normal' as const,
    minValue: 0,
    maxValue: 100,
    currentValue: 55,
    unit: '%',
    colorRanges: [
      { from: 0, to: 40, color: '#ffd43b', label: '干燥' },
      { from: 40, to: 70, color: '#51cf66', label: '适宜' },
      { from: 70, to: 100, color: '#4dabf7', label: '潮湿' }
    ],
    warningThreshold: 70,
    dangerThreshold: 85
  },
  speed: {
    title: '行驶速度',
    displayMode: 'full-circle' as const,
    gaugeType: 'speedometer' as const,
    minValue: 0,
    maxValue: 120,
    currentValue: 65,
    unit: 'km/h',
    colorRanges: [
      { from: 0, to: 60, color: '#51cf66', label: '安全' },
      { from: 60, to: 90, color: '#ffd43b', label: '注意' },
      { from: 90, to: 120, color: '#ff6b6b', label: '超速' }
    ],
    warningThreshold: 80,
    dangerThreshold: 100
  },
  battery: {
    title: '电池电量',
    displayMode: 'linear' as const,
    gaugeType: 'battery' as const,
    minValue: 0,
    maxValue: 100,
    currentValue: 75,
    unit: '%',
    colorRanges: [
      { from: 0, to: 20, color: '#ff6b6b', label: '低电量' },
      { from: 20, to: 50, color: '#ffd43b', label: '中等' },
      { from: 50, to: 100, color: '#51cf66', label: '充足' }
    ],
    warningThreshold: 30,
    dangerThreshold: 15
  },
  pressure: {
    title: '系统压力',
    displayMode: 'arc' as const,
    gaugeType: 'normal' as const,
    minValue: 0,
    maxValue: 10,
    currentValue: 6.5,
    unit: 'bar',
    colorRanges: [
      { from: 0, to: 3, color: '#51cf66', label: '正常' },
      { from: 3, to: 7, color: '#ffd43b', label: '偏高' },
      { from: 7, to: 10, color: '#ff6b6b', label: '危险' }
    ],
    warningThreshold: 7,
    dangerThreshold: 8.5
  }
}

/**
 * 应用预设配置
 */
const applyPreset = (presetKey: string) => {
  const preset = presetConfigs[presetKey as keyof typeof presetConfigs]
  if (preset) {
    Object.assign(gaugeConfig.customize, preset)
    simulationData.value.currentValue = preset.currentValue
    simulationData.value.unit = preset.unit
    simulationData.value.title = preset.title
    selectedPreset.value = presetKey
  }
}

/**
 * 开始数据模拟
 */
const startSimulation = () => {
  if (simulationRunning.value) return
  
  simulationRunning.value = true
  const config = gaugeConfig.customize
  
  const simulate = () => {
    if (!simulationRunning.value) return
    
    // 随机生成在合理范围内的数值
    const range = config.maxValue - config.minValue
    const variation = range * 0.1 // 10%的变化范围
    const center = (config.maxValue + config.minValue) / 2
    
    // 添加一些随机波动
    const randomChange = (Math.random() - 0.5) * variation
    let newValue = currentSimulationValue.value + randomChange
    
    // 限制在范围内
    newValue = Math.max(config.minValue, Math.min(config.maxValue, newValue))
    
    // 更新值
    currentSimulationValue.value = newValue
    simulationData.value.currentValue = Number(newValue.toFixed(2))
    simulationData.value.lastUpdateTime = Date.now()
    
    // 计算阈值状态
    if (newValue >= config.dangerThreshold) {
      simulationData.value.thresholdStatus = 'danger'
    } else if (newValue >= config.warningThreshold) {
      simulationData.value.thresholdStatus = 'warning'
    } else {
      simulationData.value.thresholdStatus = 'normal'
    }
    
    // 计算百分比
    simulationData.value.percentage = ((newValue - config.minValue) / range) * 100
    
    // 继续模拟
    setTimeout(simulate, 2000) // 每2秒更新一次
  }
  
  simulate()
}

/**
 * 停止数据模拟
 */
const stopSimulation = () => {
  simulationRunning.value = false
}

/**
 * 手动设置数值
 */
const setManualValue = (value: number) => {
  simulationData.value.currentValue = value
  currentSimulationValue.value = value
  
  // 计算状态
  const config = gaugeConfig.customize
  if (value >= config.dangerThreshold) {
    simulationData.value.thresholdStatus = 'danger'
  } else if (value >= config.warningThreshold) {
    simulationData.value.thresholdStatus = 'warning'
  } else {
    simulationData.value.thresholdStatus = 'normal'
  }
}

// 事件处理
const handleGaugeClick = (event: MouseEvent) => {
  console.log('仪表盘被点击:', event)
  window.$message?.info('仪表盘被点击了！')
}

const handleGaugeHover = (event: MouseEvent) => {
  console.log('仪表盘悬停:', event)
}

const handleDataChange = (data: any) => {
  console.log('仪表盘数据变化:', data)
}

const handleThresholdExceeded = (value: number, threshold: number) => {
  console.log('阈值超限:', { value, threshold })
  window.$message?.warning(`数值 ${value} 超过阈值 ${threshold}！`)
}

const handleConfigChange = (newConfig: any) => {
  console.log('配置变化:', newConfig)
  Object.assign(gaugeConfig, newConfig)
}

// 生命周期
onMounted(() => {
  // 默认应用温度计预设
  applyPreset('temperature')
})

// 计算属性
const formatUpdateTime = computed(() => {
  return new Date(simulationData.value.lastUpdateTime).toLocaleTimeString()
})

const isThresholdAlert = computed(() => {
  return simulationData.value.thresholdStatus !== 'normal'
})
</script>

<template>
  <div class="gauge-test-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>🎯 仪表盘组件测试</h1>
      <p>测试和演示 gauge-dashboard 组件的各种功能</p>
    </div>

    <!-- 选项卡导航 -->
    <n-tabs v-model:value="activeTab" type="card">
      
      <!-- 演示选项卡 -->
      <n-tab-pane name="demo" tab="🎨 演示面板">
        <n-space vertical size="large">
          
          <!-- 预设配置选择 -->
          <n-card title="🎯 快速预设" size="small">
            <n-space>
              <n-button
                v-for="(preset, key) in presetConfigs"
                :key="key"
                :type="selectedPreset === key ? 'primary' : 'default'"
                size="small"
                @click="applyPreset(key)"
              >
                {{ preset.title }}
              </n-button>
            </n-space>
          </n-card>

          <!-- 数据控制面板 -->
          <n-card title="📊 数据控制" size="small">
            <n-space vertical>
              <n-space align="center">
                <n-text>当前值:</n-text>
                <n-input-number
                  :value="simulationData.currentValue"
                  :min="gaugeConfig.customize.minValue"
                  :max="gaugeConfig.customize.maxValue"
                  :step="0.1"
                  style="width: 120px"
                  @update:value="setManualValue"
                />
                <n-text>{{ gaugeConfig.customize.unit }}</n-text>
                <n-tag :type="isThresholdAlert ? 'warning' : 'default'">
                  {{ simulationData.thresholdStatus }}
                </n-tag>
              </n-space>

              <n-space>
                <n-button
                  :type="simulationRunning ? 'default' : 'primary'"
                  :loading="simulationRunning"
                  @click="startSimulation"
                >
                  {{ simulationRunning ? '模拟运行中...' : '开始数据模拟' }}
                </n-button>
                <n-button
                  v-if="simulationRunning"
                  type="error"
                  @click="stopSimulation"
                >
                  停止模拟
                </n-button>
                <n-text depth="3">
                  最后更新: {{ formatUpdateTime }}
                </n-text>
              </n-space>
            </n-space>
          </n-card>

          <!-- 仪表盘展示区域 -->
          <n-grid :cols="2" :x-gap="24">
            <n-grid-item>
              <n-card title="🎯 仪表盘展示" size="small">
                <div class="gauge-display-area">
                  <GaugeDashboardCard
                    :config="gaugeConfig"
                    :data="simulationData"
                    component-id="test-gauge-1"
                    @click="handleGaugeClick"
                    @hover="handleGaugeHover"
                    @data-change="handleDataChange"
                    @threshold-exceeded="handleThresholdExceeded"
                  />
                </div>
              </n-card>
            </n-grid-item>

            <n-grid-item>
              <n-card title="📋 数据信息" size="small">
                <n-descriptions :column="1" size="small">
                  <n-descriptions-item label="当前值">
                    <n-tag :type="isThresholdAlert ? 'error' : 'success'">
                      {{ simulationData.currentValue }}{{ gaugeConfig.customize.unit }}
                    </n-tag>
                  </n-descriptions-item>
                  <n-descriptions-item label="范围">
                    {{ gaugeConfig.customize.minValue }} ~ {{ gaugeConfig.customize.maxValue }}
                  </n-descriptions-item>
                  <n-descriptions-item label="百分比">
                    {{ simulationData.percentage.toFixed(1) }}%
                  </n-descriptions-item>
                  <n-descriptions-item label="状态">
                    <n-tag :type="simulationData.thresholdStatus === 'danger' ? 'error' : simulationData.thresholdStatus === 'warning' ? 'warning' : 'success'">
                      {{ simulationData.thresholdStatus }}
                    </n-tag>
                  </n-descriptions-item>
                  <n-descriptions-item label="警告阈值">
                    {{ gaugeConfig.customize.warningThreshold }}{{ gaugeConfig.customize.unit }}
                  </n-descriptions-item>
                  <n-descriptions-item label="危险阈值">
                    {{ gaugeConfig.customize.dangerThreshold }}{{ gaugeConfig.customize.unit }}
                  </n-descriptions-item>
                  <n-descriptions-item label="颜色区间">
                    <n-space size="small">
                      <n-tag
                        v-for="(range, index) in gaugeConfig.customize.colorRanges"
                        :key="index"
                        :color="{ color: range.color, textColor: '#fff' }"
                        size="small"
                      >
                        {{ range.from }}-{{ range.to }}
                      </n-tag>
                    </n-space>
                  </n-descriptions-item>
                </n-descriptions>
              </n-card>
            </n-grid-item>
          </n-grid>

        </n-space>
      </n-tab-pane>

      <!-- 配置选项卡 -->
      <n-tab-pane name="config" tab="⚙️ 配置面板">
        <n-grid :cols="2" :x-gap="24">
          <n-grid-item>
            <n-card title="📝 组件配置" size="small">
              <div style="max-height: 600px; overflow-y: auto;">
                <GaugeDashboardSetting
                  :config="gaugeConfig"
                  @update:config="handleConfigChange"
                  @config-change="handleConfigChange"
                />
              </div>
            </n-card>
          </n-grid-item>

          <n-grid-item>
            <n-card title="👁️ 实时预览" size="small">
              <div class="gauge-preview-area">
                <GaugeDashboardCard
                  :config="gaugeConfig"
                  :data="simulationData"
                  component-id="preview-gauge"
                  is-preview
                />
              </div>
            </n-card>
          </n-grid-item>
        </n-grid>
      </n-tab-pane>

      <!-- 代码示例选项卡 -->
      <n-tab-pane name="code" tab="💻 代码示例">
        <n-space vertical size="large">
          
          <n-card title="📦 基本使用" size="small">
            <CodeMirror
              v-model="basicUsageCode"
              basic
              :dark="themeStore.darkMode"
              :lang="javascript()"
              :style="{ minHeight: '200px' }"
              :read-only="true"
            />
          </n-card>

          <n-card title="🎯 高级配置" size="small">
            <CodeMirror
              v-model="advancedUsageCode"
              basic
              :dark="themeStore.darkMode"
              :lang="javascript()"
              :style="{ minHeight: '300px' }"
              :read-only="true"
            />
          </n-card>

          <n-card title="🔗 数据绑定" size="small">
            <CodeMirror
              v-model="dataBindingCode"
              basic
              :dark="themeStore.darkMode"
              :lang="javascript()"
              :style="{ minHeight: '250px' }"
              :read-only="true"
            />
          </n-card>

        </n-space>
      </n-tab-pane>

    </n-tabs>

  </div>
</template>

<script setup lang="ts">
// 导入 CodeMirror（如果需要代码展示）
import CodeMirror from 'vue-codemirror6'
import { javascript } from '@codemirror/lang-javascript'

// 代码示例
const basicUsageCode = ref(`<template>
  <GaugeDashboardCard
    :config="gaugeConfig"
    :data="realTimeData"
    component-id="my-gauge"
    @click="handleClick"
    @data-change="handleDataChange"
  />
</template>

<script setup>
import GaugeDashboardCard from '@/card2.1/components/dashboard/gauge-dashboard/index.vue'
import { customConfig } from '@/card2.1/components/dashboard/gauge-dashboard/settingConfig'

// 基本配置
const gaugeConfig = reactive({
  customize: {
    ...customConfig,
    title: '温度监控',
    minValue: 0,
    maxValue: 100,
    unit: '℃'
  }
})

// 实时数据
const realTimeData = ref({
  currentValue: 25.6,
  unit: '℃',
  title: '室内温度',
  thresholdStatus: 'normal'
})
<\/script>`)

const advancedUsageCode = ref(`// 高级配置示例
const advancedConfig = {
  customize: {
    title: '系统压力监控',
    displayMode: 'semi-circle',
    gaugeType: 'normal',
    
    // 数值范围
    minValue: 0,
    maxValue: 10,
    currentValue: 6.5,
    unit: 'bar',
    decimal: 2,
    
    // 外观设置
    radius: 150,
    startAngle: 200,
    endAngle: -20,
    backgroundColor: '#f8f9fa',
    borderColor: '#dee2e6',
    
    // 颜色区间
    colorRanges: [
      { from: 0, to: 3, color: '#28a745', label: '安全' },
      { from: 3, to: 7, color: '#ffc107', label: '警告' },
      { from: 7, to: 10, color: '#dc3545', label: '危险' }
    ],
    
    // 动画设置
    enableAnimation: true,
    animationDuration: 1500,
    animationType: 'ease-out',
    
    // 警告阈值
    enableThresholdAlert: true,
    warningThreshold: 7,
    dangerThreshold: 8.5,
    
    // 交互设置
    clickable: true,
    showTooltip: true,
    tooltipTemplate: '{title}: {value}{unit} (状态: {thresholdStatus})'
  }
}`)

const dataBindingCode = ref(`// 数据绑定配置
const dataSourceConfig = {
  // 主数据源
  primaryData: {
    type: 'websocket',
    url: 'ws://localhost:8080/sensor-data',
    updateInterval: 1000,
    fieldMappings: {
      'temperature': 'currentValue',
      'unit': 'unit',
      'sensor_name': 'title'
    }
  },
  
  // 范围配置数据源
  rangeConfig: {
    type: 'api',
    url: '/api/sensor/config',
    updateInterval: 60000,
    fieldMappings: {
      'min_value': 'minValue',
      'max_value': 'maxValue',
      'warning_threshold': 'warningThreshold',
      'danger_threshold': 'dangerThreshold'
    }
  }
}

// 事件处理
const handleThresholdExceeded = (value, threshold) => {
  // 发送告警
  sendAlert({
    type: 'threshold_exceeded',
    sensor: gaugeConfig.customize.title,
    value: value,
    threshold: threshold,
    timestamp: Date.now()
  })
}`)
</script>

<style scoped>
.gauge-test-page {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  color: var(--text-color);
  font-size: 28px;
}

.page-header p {
  margin: 0;
  color: var(--text-color-2);
  font-size: 16px;
}

.gauge-display-area {
  height: 350px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--body-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.gauge-preview-area {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--body-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

/* 响应主题变化 */
[data-theme="dark"] .gauge-test-page {
  background: var(--body-color);
}

[data-theme="light"] .gauge-test-page {
  background: var(--n-card-color);
}
</style>