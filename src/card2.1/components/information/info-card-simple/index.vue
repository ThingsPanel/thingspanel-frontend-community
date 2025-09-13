<template>
  <n-card 
    class="info-card-simple" 
    :style="cardStyle"
    embedded
  >
    <div class="info-content">
      <div v-if="config.showIcon" class="info-icon">
        <n-icon :size="config.iconSize" :color="config.iconColor">
          <Information />
        </n-icon>
      </div>
      
      <div class="info-text">
        <div v-if="config.showTitle" class="info-title">
          {{ displayData.title || config.title }}
        </div>
        
        <div class="info-value" :style="valueStyle">
          {{ displayData.value || config.defaultValue }}
        </div>
        
        <div v-if="config.showSubtext" class="info-subtext">
          {{ displayData.subtext || config.subtext }}
        </div>
      </div>
    </div>
    
    <div v-if="config.showUpdateTime && displayData.timestamp" class="update-time">
      {{ formatTime(displayData.timestamp) }}
    </div>
  </n-card>
</template>

<script setup lang="ts">
/**
 * 简单信息卡片组件
 * 用于显示基本信息和状态数据
 */

import { computed } from 'vue'
import { NCard, NIcon } from 'naive-ui'
import { Information } from '@vicons/ionicons5'
import { useCard2Props } from '@/card2.1/hooks'
import type { InfoCardSimpleConfig } from './settingConfig'

// 组件属性接口
interface Props {
  config: InfoCardSimpleConfig
  data?: Record<string, unknown>
}

const props = withDefaults(defineProps<Props>(), {
  data: () => ({})
})

// 使用 Card 2.1 数据绑定
const { config, displayData } = useCard2Props(props)

// 计算卡片样式
const cardStyle = computed(() => ({
  backgroundColor: config.value.backgroundColor,
  border: `1px solid ${config.value.borderColor}`,
  borderRadius: `${config.value.borderRadius}px`,
  minHeight: '120px'
}))

// 计算数值样式
const valueStyle = computed(() => ({
  fontSize: `${config.value.valueSize}px`,
  fontWeight: config.value.valueBold ? 'bold' : 'normal',
  color: config.value.valueColor
}))

// 格式化时间显示
const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString('zh-CN')
}
</script>

<style scoped>
.info-card-simple {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.info-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  padding: 8px;
}

.info-icon {
  flex-shrink: 0;
}

.info-text {
  flex: 1;
  min-width: 0;
}

.info-title {
  font-size: 14px;
  color: var(--text-color-2);
  margin-bottom: 4px;
  font-weight: 500;
}

.info-value {
  font-size: 24px;
  font-weight: bold;
  color: var(--text-color-1);
  margin-bottom: 4px;
  word-break: break-all;
}

.info-subtext {
  font-size: 12px;
  color: var(--text-color-3);
}

.update-time {
  font-size: 10px;
  color: var(--text-color-3);
  text-align: right;
  padding: 4px 8px;
  border-top: 1px solid var(--divider-color);
}
</style>