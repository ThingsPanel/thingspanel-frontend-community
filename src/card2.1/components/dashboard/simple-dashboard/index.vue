<template>
  <n-card class="simple-dashboard" :style="cardStyle" embedded>
    <div class="dashboard-header">
      <div class="dashboard-title">{{ displayData.title || config.title }}</div>
      <div class="dashboard-value" :style="valueStyle">
        {{ formatValue(displayData.value || config.defaultValue) }}
      </div>
    </div>
    
    <div class="dashboard-content">
      <div class="metrics">
        <div class="metric-item">
          <div class="metric-label">当前值</div>
          <div class="metric-value">{{ displayData.current || 0 }}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">最大值</div>
          <div class="metric-value">{{ displayData.max || 100 }}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">平均值</div>
          <div class="metric-value">{{ displayData.avg || 50 }}</div>
        </div>
      </div>
    </div>
    
    <div class="dashboard-footer">
      <div class="status-indicator" :class="statusClass">
        {{ getStatusText() }}
      </div>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard } from 'naive-ui'
import { useCard2Props } from '@/card2.1/hooks'
import type { SimpleDashboardConfig } from './settingConfig'

interface Props { config: SimpleDashboardConfig; data?: Record<string, unknown> }
const props = withDefaults(defineProps<Props>(), { data: () => ({}) })
const { config, displayData } = useCard2Props(props)

const cardStyle = computed(() => ({ backgroundColor: config.value.backgroundColor, border: `1px solid ${config.value.borderColor}`, borderRadius: `${config.value.borderRadius}px` }))
const valueStyle = computed(() => ({ fontSize: `${config.value.valueSize}px`, color: config.value.valueColor, fontWeight: 'bold' }))
const statusClass = computed(() => ({ normal: (displayData.value.current || 0) <= 80, warning: (displayData.value.current || 0) > 80 }))
const formatValue = (value: unknown) => typeof value === 'number' ? value.toFixed(1) : String(value || '0')
const getStatusText = () => (displayData.value.current || 0) > 80 ? '警告' : '正常'
</script>

<style scoped>
.simple-dashboard { height: 100%; padding: 16px; }
.dashboard-header { text-align: center; margin-bottom: 16px; }
.dashboard-title { font-size: 16px; font-weight: 500; margin-bottom: 8px; }
.dashboard-value { font-size: 32px; font-weight: bold; }
.dashboard-content { flex: 1; }
.metrics { display: flex; justify-content: space-around; }
.metric-item { text-align: center; }
.metric-label { font-size: 12px; color: var(--text-color-3); margin-bottom: 4px; }
.metric-value { font-size: 20px; font-weight: 500; }
.dashboard-footer { margin-top: 16px; text-align: center; }
.status-indicator { padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 500; }
.status-indicator.normal { background: var(--success-color-suppl); color: var(--success-color); }
.status-indicator.warning { background: var(--warning-color-suppl); color: var(--warning-color); }
</style>