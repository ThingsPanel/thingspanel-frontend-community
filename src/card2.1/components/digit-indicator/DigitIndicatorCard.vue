<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, computed } from 'vue'
import { NIcon } from 'naive-ui'
import { icons as iconOptions } from '@/components/common/icons'
import { $t } from '@/locales'

interface Props {
  properties?: {
    unit?: string
    color?: string
    iconName?: string
    title?: string
    value?: string | number
  }
  metadata?: any
}

const props = withDefaults(defineProps<Props>(), {
  properties: () => ({})
})

const cardRef = ref(null)
const fontSize = ref('14px')
let resizeObserver: ResizeObserver | null = null

// 计算属性
const displayValue = computed(() => {
  return props.properties?.value ?? '45'
})

const displayUnit = computed(() => {
  return props.properties?.unit ?? '%'
})

const displayColor = computed(() => {
  return props.properties?.color ?? 'blue'
})

const displayIcon = computed(() => {
  return props.properties?.iconName ?? 'Water'
})

const displayTitle = computed(() => {
  return props.properties?.title ?? $t('card.humidity')
})

const handleResize = (entries: ResizeObserverEntry[]) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect
    const newFontSize = `${Math.min(width, height) / 10}px`
    fontSize.value = newFontSize
  }
}

onMounted(() => {
  if (cardRef.value) {
    resizeObserver = new ResizeObserver(handleResize)
    resizeObserver.observe(cardRef.value)
    handleResize([{ contentRect: cardRef.value.getBoundingClientRect() }] as ResizeObserverEntry[])
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<template>
  <div ref="cardRef" class="card-container">
    <div class="card-content" :style="{ fontSize: fontSize }">
      <div class="icon-container">
        <NIcon class="iconclass" :color="displayColor">
          <component :is="iconOptions[displayIcon]" />
        </NIcon>
      </div>
      <div class="value-container">
        <span class="value" :title="displayValue + displayUnit">
          {{ displayValue }} {{ displayUnit }}
        </span>
      </div>
      <div class="metric-name-container">
        <span class="metric-name" :title="displayTitle">
          {{ displayTitle }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-container {
  width: 100%;
  height: 100%;
}

.card-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 5% 5%;
}

.icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
}

.iconclass {
  font-size: 3em;
}

.value-container {
  display: flex;
  justify-content: center;
  align-items: baseline;
  width: 100%;
}

.value {
  font-size: 2em;
  font-weight: bold;
  text-wrap: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metric-name-container {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  width: 100%;
}

.metric-name {
  font-size: 1em;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
}
</style>