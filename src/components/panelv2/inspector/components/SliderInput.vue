<template>
  <div class="slider-input-inspector">
    <label v-if="label" class="input-label">{{ label }}</label>
    <div class="slider-container">
      <input
        type="range"
        :value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        class="slider"
        @input="handleInput"
      />
      <div class="value-display">
        <input
          type="number"
          :value="modelValue"
          :min="min"
          :max="max"
          :step="step"
          class="value-input"
          @input="handleNumberInput"
        />
        <span v-if="unit" class="unit">{{ unit }}</span>
      </div>
    </div>
    <div v-if="showMinMax" class="min-max-labels">
      <span>{{ min }}</span>
      <span>{{ max }}</span>
    </div>
    <div v-if="description" class="input-description">{{ description }}</div>
  </div>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{
  modelValue: number
  label?: string
  description?: string
  min?: number
  max?: number
  step?: number
  unit?: string
  showMinMax?: boolean
}>(), {
  min: 0,
  max: 100,
  step: 1,
  showMinMax: true
})

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', Number(target.value))
}

const handleNumberInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  if (value >= props.min && value <= props.max) {
    emit('update:modelValue', value)
  }
}
</script>

<style scoped>
.slider-input-inspector {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}

.slider {
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #40a9ff;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #40a9ff;
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #40a9ff;
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px #40a9ff;
}

.value-display {
  display: flex;
  align-items: center;
  gap: 4px;
}

.value-input {
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
}

.value-input:focus {
  outline: none;
  border-color: #40a9ff;
}

.unit {
  font-size: 12px;
  color: #666;
}

.min-max-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.input-description {
  margin-top: 8px;
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.4;
}
</style>