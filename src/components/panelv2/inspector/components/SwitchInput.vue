<template>
  <div class="switch-input-inspector">
    <div class="switch-wrapper">
      <label v-if="label" class="input-label">{{ label }}</label>
      <div class="switch-container">
        <label class="switch">
          <input 
            type="checkbox"
            :checked="modelValue"
            @change="handleChange"
          />
          <span class="slider"></span>
        </label>
        <span class="switch-text">{{ modelValue ? (onText || '开启') : (offText || '关闭') }}</span>
      </div>
    </div>
    <div v-if="description" class="input-description">{{ description }}</div>
  </div>
</template>

<script lang="ts" setup>
const props = defineProps<{
  modelValue: boolean
  label?: string
  description?: string
  onText?: string
  offText?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.checked)
}
</script>

<style scoped>
.switch-input-inspector {
  margin-bottom: 16px;
}

.switch-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  margin: 0;
}

.switch-container {
  display: flex;
  align-items: center;
  gap: 12px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 22px;
  cursor: pointer;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.3s;
  border-radius: 22px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.3s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #40a9ff;
}

input:checked + .slider:before {
  transform: translateX(22px);
}

.switch-text {
  font-size: 14px;
  color: #666;
  user-select: none;
}

.input-description {
  margin-top: 4px;
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.4;
}
</style>