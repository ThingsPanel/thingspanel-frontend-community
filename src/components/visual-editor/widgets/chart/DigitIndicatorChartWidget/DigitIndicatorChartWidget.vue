<template>
  <div class="digit-indicator-chart-widget">
    <component :is="DigitIndicatorComponent" :card="cardData" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DigitIndicatorComponent from '@/card/chart-card/digit-indicator/component.vue'
import type { ICardData } from '@/components/panel/card'

interface Props {
  title?: string
  deviceId?: string
  metricsId?: string
  metricsType?: 'telemetry' | 'attributes'
  icon?: string
  color?: string
  backgroundColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '数字指示器',
  deviceId: '',
  metricsId: '',
  metricsType: 'telemetry',
  icon: 'uil:analytics',
  color: '#18a058',
  backgroundColor: '#f0f0f0'
})

// 将props适配为ICardData格式
const cardData = computed<ICardData>(() => ({
  id: 'widget-' + Date.now().toString(),
  basicSettings: {
    title: props.title,
    showTitle: true,
    titleColor: '#333',
    showBorder: false,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: props.backgroundColor,
    backgroundImage: '',
    opacity: 1
  },
  dataSource:
    props.deviceId && props.metricsId
      ? {
          deviceSource: [
            {
              deviceId: props.deviceId,
              metricsId: props.metricsId,
              metricsType: props.metricsType,
              aggregateWindow: '1m',
              name: props.title
            }
          ]
        }
      : undefined,
  config: {
    icon: props.icon,
    color: props.color,
    showIcon: true,
    iconSize: 24,
    showUnit: true,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    decimalPlaces: 1
  },
  w: 4,
  h: 3,
  x: 0,
  y: 0,
  i: 'widget-' + Date.now().toString(),
  component: 'digit-indicator'
}))
</script>

<style scoped>
.digit-indicator-chart-widget {
  width: 100%;
  height: 100%;
  padding: 4px;
  box-sizing: border-box;
}
</style>
