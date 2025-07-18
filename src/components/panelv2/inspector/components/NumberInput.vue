<template>
  <div class="number-input-inspector">
    <label v-if="label" class="input-label">{{ label }}</label>
    <input 
      type="number"
      :value="modelValue" 
      :placeholder="placeholder || '请输入数字'"
      :min="min"
      :max="max"
      :step="step"
      class="input-field"
      @input="handleInput"
    />
    <div v-if="description" class="input-description">{{ description }}</div>
  </div>
</template>

<script lang="ts" setup>
// --- Props 定义 ---
const props = defineProps<{
  modelValue: number;
  label?: string;
  placeholder?: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
}>();

// --- Events 定义 ---
const emit = defineEmits<{
  'update:modelValue': [value: number];
}>();

// --- 事件处理 ---
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = parseFloat(target.value);
  if (!isNaN(value)) {
    emit('update:modelValue', value);
  }
};
</script>

<style scoped>
.number-input-inspector {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.input-field {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.input-field:focus {
  outline: none;
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(64, 169, 255, 0.2);
}

.input-field:hover {
  border-color: #40a9ff;
}

.input-description {
  margin-top: 4px;
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.4;
}
</style>