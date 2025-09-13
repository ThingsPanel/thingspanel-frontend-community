<template>
  <n-card class="simple-map" :style="cardStyle" embedded>
    <div v-if="config.showTitle" class="map-header">
      {{ displayData.title || config.title }}
    </div>
    
    <div class="map-container">
      <div class="map-placeholder">
        <n-icon size="48" color="var(--text-color-3)">
          <Location />
        </n-icon>
        <div class="location-info">
          <div class="coordinates">
            经度: {{ displayData.longitude || config.defaultLon }}<br>
            纬度: {{ displayData.latitude || config.defaultLat }}
          </div>
          <div v-if="displayData.address" class="address">
            {{ displayData.address }}
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="config.showControls" class="map-controls">
      <n-button size="small" @click="centerMap">居中</n-button>
      <n-button size="small" @click="refreshLocation">刷新</n-button>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NIcon, NButton, useMessage } from 'naive-ui'
import { Location } from '@vicons/ionicons5'
import { useCard2Props } from '@/card2.1/hooks'
import type { SimpleMapConfig } from './settingConfig'

interface Props {
  config: SimpleMapConfig
  data?: Record<string, unknown>
}

const props = withDefaults(defineProps<Props>(), { data: () => ({}) })
const { config, displayData } = useCard2Props(props)
const message = useMessage()

const cardStyle = computed(() => ({
  backgroundColor: config.value.backgroundColor,
  border: `1px solid ${config.value.borderColor}`,
  borderRadius: `${config.value.borderRadius}px`,
  minHeight: '200px'
}))

const centerMap = () => message.info('地图居中功能')
const refreshLocation = () => message.info('刷新位置信息')
</script>

<style scoped>
.simple-map { height: 100%; }
.map-header { padding: 12px 16px; font-weight: 500; border-bottom: 1px solid var(--divider-color); }
.map-container { flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px; }
.map-placeholder { text-align: center; }
.location-info { margin-top: 12px; }
.coordinates { font-size: 12px; color: var(--text-color-2); line-height: 1.5; }
.address { font-size: 11px; color: var(--text-color-3); margin-top: 4px; }
.map-controls { padding: 8px 16px; display: flex; gap: 8px; justify-content: center; border-top: 1px solid var(--divider-color); }
</style>