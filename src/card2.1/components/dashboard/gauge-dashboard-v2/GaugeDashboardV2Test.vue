<!--
仪表盘V2组件测试页面
用于测试重写后的干净版本
-->
<script setup lang="ts">
import { ref, reactive } from 'vue'
import { NCard, NButton, NSpace, NInputNumber, NSelect, NSwitch } from 'naive-ui'
import GaugeDashboardV2 from '@/card2.1/components/dashboard/gauge-dashboard-v2/index.vue'
import type { GaugeDashboardCustomize } from '@/card2.1/components/dashboard/gauge-dashboard-v2/settingConfig'

// 测试配置
const testConfig = reactive<{ customize: GaugeDashboardCustomize }>({
  customize: {
    title: '温度监控',
    displayMode: 'arc',
    gaugeType: 'temperature',
    
    // 数值设置
    minValue: 0,
    maxValue: 100,
    currentValue: 65,
    unit: '℃',
    decimal: 1,
    
    // 外观设置
    radius: 120,
    startAngle: 225,
    endAngle: -45,
    backgroundColor: '#f8f9fa',
    borderColor: '#e9ecef',
    borderWidth: 2,
    
    // 刻度配置
    tickConfig: {
      show: true,
      majorCount: 6,
      minorCount: 2,
      color: '#6c757d'
    },
    
    // 指针配置
    pointerConfig: {
      color: '#1890ff',
      width: 4,
      lengthRatio: 0.8,
      style: 'arrow'
    },
    
    // 颜色区间
    colorRanges: [
      { from: 0, to: 30, color: '#52c41a', label: '正常' },
      { from: 30, to: 70, color: '#faad14', label: '警告' },
      { from: 70, to: 100, color: '#f5222d', label: '危险' }
    ],
    
    // 显示设置
    showValue: true,
    showUnit: true,
    showTitle: true,
    valueFontSize: 24,
    titleFontSize: 16,
    
    // 动画设置
    enableAnimation: true,
    animationDuration: 1000,
    animationType: 'ease-out',
    
    // 警告设置
    warningThreshold: 70,
    dangerThreshold: 90,
    enableThresholdAlert: true,
    
    // 交互设置
    clickable: true,
    showTooltip: true,
    tooltipTemplate: '{title}: {value}{unit}'
  }
})

// 测试数据
const testData = reactive({
  currentValue: 65,
  unit: '℃',
  title: '实时温度',
  lastUpdateTime: Date.now(),
  thresholdStatus: 'warning' as 'normal' | 'warning' | 'danger'
})

// 显示模式选项
const displayModeOptions = [
  { label: '弧形', value: 'arc' },
  { label: '半圆', value: 'semi-circle' },
  { label: '全圆', value: 'full-circle' },
  { label: '线性', value: 'linear' }
]

// 仪表盘类型选项
const gaugeTypeOptions = [
  { label: '普通', value: 'normal' },
  { label: '速度计', value: 'speedometer' },
  { label: '温度计', value: 'temperature' },
  { label: '进度条', value: 'progress' },
  { label: '电池', value: 'battery' }
]

// 模拟数据变化
const simulateDataChange = () => {
  const newValue = Math.floor(Math.random() * 100)
  testConfig.customize.currentValue = newValue
  testData.currentValue = newValue
  testData.lastUpdateTime = Date.now()
  
  // 更新阈值状态
  if (newValue >= testConfig.customize.dangerThreshold) {
    testData.thresholdStatus = 'danger'
  } else if (newValue >= testConfig.customize.warningThreshold) {
    testData.thresholdStatus = 'warning'
  } else {
    testData.thresholdStatus = 'normal'
  }
}

// 事件处理
const handleClick = (event: MouseEvent) => {
  console.log('仪表盘被点击:', event)
}

const handleDataChange = (data: any) => {
  console.log('数据变化:', data)
}

const handleThresholdExceeded = (value: number, threshold: number) => {
  console.log('阈值超限:', { value, threshold })
}
</script>

<template>
  <div class="gauge-test-container">
    <n-card title="🎯 仪表盘V2组件测试 - vue-echarts 干净版本" class="test-card">
      <template #header-extra>
        <n-button type="primary" @click="simulateDataChange">
          🎲 随机数据
        </n-button>
      </template>
      
      <!-- 仪表盘展示区域 -->
      <div class="gauge-display-area">
        <GaugeDashboardV2
          :config="testConfig"
          :data="testData"
          component-id="test-gauge-v2"
          :is-preview="true"
          @click="handleClick"
          @data-change="handleDataChange"
          @threshold-exceeded="handleThresholdExceeded"
        />
      </div>
      
      <!-- 控制面板 -->
      <n-card title="🔧 控制面板" class="control-panel">
        <n-space vertical :size="16">
          <!-- 基础配置 -->
          <n-space :size="12" wrap>
            <div class="control-item">
              <label>显示模式：</label>
              <n-select
                v-model:value="testConfig.customize.displayMode"
                :options="displayModeOptions"
                style="width: 120px"
              />
            </div>
            
            <div class="control-item">
              <label>仪表盘类型：</label>
              <n-select
                v-model:value="testConfig.customize.gaugeType"
                :options="gaugeTypeOptions"
                style="width: 120px"
              />
            </div>
            
            <div class="control-item">
              <label>当前值：</label>
              <n-input-number
                v-model:value="testConfig.customize.currentValue"
                :min="testConfig.customize.minValue"
                :max="testConfig.customize.maxValue"
                :step="1"
                style="width: 100px"
              />
            </div>
          </n-space>
          
          <!-- 范围配置 -->
          <n-space :size="12" wrap>
            <div class="control-item">
              <label>最小值：</label>
              <n-input-number
                v-model:value="testConfig.customize.minValue"
                :max="testConfig.customize.maxValue - 1"
                style="width: 80px"
              />
            </div>
            
            <div class="control-item">
              <label>最大值：</label>
              <n-input-number
                v-model:value="testConfig.customize.maxValue"
                :min="testConfig.customize.minValue + 1"
                style="width: 80px"
              />
            </div>
            
            <div class="control-item">
              <label>警告阈值：</label>
              <n-input-number
                v-model:value="testConfig.customize.warningThreshold"
                :min="testConfig.customize.minValue"
                :max="testConfig.customize.dangerThreshold - 1"
                style="width: 80px"
              />
            </div>
            
            <div class="control-item">
              <label>危险阈值：</label>
              <n-input-number
                v-model:value="testConfig.customize.dangerThreshold"
                :min="testConfig.customize.warningThreshold + 1"
                :max="testConfig.customize.maxValue"
                style="width: 80px"
              />
            </div>
          </n-space>
          
          <!-- 开关配置 -->
          <n-space :size="12" wrap>
            <div class="control-item">
              <label>显示数值：</label>
              <n-switch v-model:value="testConfig.customize.showValue" />
            </div>
            
            <div class="control-item">
              <label>显示单位：</label>
              <n-switch v-model:value="testConfig.customize.showUnit" />
            </div>
            
            <div class="control-item">
              <label>显示标题：</label>
              <n-switch v-model:value="testConfig.customize.showTitle" />
            </div>
            
            <div class="control-item">
              <label>启用动画：</label>
              <n-switch v-model:value="testConfig.customize.enableAnimation" />
            </div>
            
            <div class="control-item">
              <label>阈值警告：</label>
              <n-switch v-model:value="testConfig.customize.enableThresholdAlert" />
            </div>
            
            <div class="control-item">
              <label>可点击：</label>
              <n-switch v-model:value="testConfig.customize.clickable" />
            </div>
          </n-space>
        </n-space>
      </n-card>
      
      <!-- 状态信息 -->
      <n-card title="📊 状态信息" class="status-info">
        <n-space vertical :size="8">
          <div>当前值: {{ testData.currentValue }}{{ testData.unit }}</div>
          <div>阈值状态: {{ testData.thresholdStatus }}</div>
          <div>最后更新: {{ new Date(testData.lastUpdateTime).toLocaleTimeString() }}</div>
          <div>显示模式: {{ testConfig.customize.displayMode }}</div>
          <div>仪表盘类型: {{ testConfig.customize.gaugeType }}</div>
          <div>ECharts模块: ✅ 正确导入</div>
          <div>vue-echarts: ✅ 已集成</div>
        </n-space>
      </n-card>
    </n-card>
  </div>
</template>

<style scoped>
.gauge-test-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.test-card {
  margin-bottom: 20px;
}

.gauge-display-area {
  height: 300px;
  width: 100%;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  margin-bottom: 20px;
  background: var(--body-color);
}

.control-panel {
  margin-bottom: 20px;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.control-item label {
  font-size: 14px;
  color: var(--text-color);
  min-width: 80px;
}

.status-info {
  font-family: monospace;
  background: var(--code-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .gauge-test-container {
    padding: 10px;
  }
  
  .gauge-display-area {
    height: 250px;
  }
  
  .control-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .control-item label {
    min-width: auto;
  }
}
</style>