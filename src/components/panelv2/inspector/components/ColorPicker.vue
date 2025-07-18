<template>
  <div class="color-picker-inspector">
    <label v-if="label" class="input-label">{{ label }}</label>
    <div class="color-input-wrapper">
      <input 
        type="color"
        :value="modelValue" 
        class="color-input"
        @input="handleInput"
      />
      <input 
        type="text"
        :value="modelValue" 
        :placeholder="placeholder || '#000000'"
        class="text-input"
        @input="handleTextInput"
      />
    </div>
    <div v-if="description" class="input-description">{{ description }}</div>
  </div>
</template>

<script lang="ts" setup>
// --- Props 定义 ---
const props = defineProps<{
  modelValue: string;
  label?: string;
  placeholder?: string;
  description?: string;
}>();

// --- Events 定义 ---
const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

// --- 事件处理 ---
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};

const handleTextInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = target.value;
  // 简单的颜色值验证
  if (/^#[0-9A-Fa-f]{6}$/.test(value) || /^#[0-9A-Fa-f]{3}$/.test(value)) {
    emit('update:modelValue', value);
  }
};
</script>

<style scoped>
.color-picker-inspector {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.color-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-input {
  width: 40px;
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
  background: none;
}

.color-input::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-input::-webkit-color-swatch {
  border: none;
  border-radius: 2px;
}

.text-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
}

.text-input:focus {
  outline: none;
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(64, 169, 255, 0.2);
}

.text-input:hover {
  border-color: #40a9ff;
}

.input-description {
  margin-top: 4px;
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.4;
}
</style>