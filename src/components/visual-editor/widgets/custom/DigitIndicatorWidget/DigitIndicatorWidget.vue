<template>
  <div class="digit-indicator-widget" :style="containerStyle">
    <div class="digit-value" :style="valueStyle">{{ displayValue }}</div>
    <div class="digit-label" :style="labelStyle">{{ label }}</div>
    <div class="digit-unit" :style="unitStyle">{{ unit }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  value?: number
  label?: string
  unit?: string
  color?: string
  backgroundColor?: string
  fontSize?: number
}

const props = withDefaults(defineProps<Props>(), {
  value: 888,
  label: '数据指示器',
  unit: '',
  color: '#18a058',
  backgroundColor: '#f0f0f0',
  fontSize: 24
})

const displayValue = computed(() => {
  if (props.value >= 10000) {
    return (props.value / 10000).toFixed(1) + 'w'
  } else if (props.value >= 1000) {
    return (props.value / 1000).toFixed(1) + 'k'
  }
  return props.value.toString()
})

const containerStyle = computed(() => ({
  backgroundColor: props.backgroundColor,
  borderLeft: `4px solid ${props.color}`,
  padding: '12px',
  borderRadius: '4px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column' as const,
  justifyContent: 'center',
  boxSizing: 'border-box' as const
}))

const valueStyle = computed(() => ({
  fontSize: props.fontSize + 'px',
  color: props.color,
  fontWeight: 'bold',
  lineHeight: '1',
  marginBottom: '4px'
}))

const labelStyle = computed(() => ({
  fontSize: '12px',
  color: '#666',
  lineHeight: '1',
  marginBottom: '2px'
}))

const unitStyle = computed(() => ({
  fontSize: '10px',
  color: '#999',
  lineHeight: '1'
}))
</script>

<style scoped>
.digit-indicator-widget {
  user-select: none;
}

.digit-value {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.digit-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.digit-unit {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>