<template>
  <div class="simple-card" :style="cardStyle">
    <div class="card-header">
      <h3>{{ title }}</h3>
    </div>
    <div class="card-content">
      <div class="value-display">
        <span class="value">{{ value }}</span>
        <span v-if="unit" class="unit">{{ unit }}</span>
      </div>
      <div v-if="description" class="description">
        {{ description }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  title?: string
  value?: string | number
  unit?: string
  description?: string
  backgroundColor?: string
  textColor?: string
  fontSize?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: '简单卡片',
  value: '0',
  unit: '',
  description: '',
  backgroundColor: '#ffffff',
  textColor: '#333333',
  fontSize: '16px'
})

const cardStyle = computed(() => ({
  backgroundColor: props.backgroundColor,
  color: props.textColor,
  fontSize: props.fontSize
}))
</script>

<style scoped>
.simple-card {
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  min-height: 120px;
  display: flex;
  flex-direction: column;
}

.card-header {
  margin-bottom: 16px;
}

.card-header h3 {
  margin: 0;
  font-size: 1.2em;
  font-weight: 600;
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.value-display {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin-bottom: 8px;
}

.value {
  font-size: 2em;
  font-weight: bold;
}

.unit {
  font-size: 1em;
  opacity: 0.7;
}

.description {
  font-size: 0.9em;
  opacity: 0.8;
  line-height: 1.4;
}
</style>
