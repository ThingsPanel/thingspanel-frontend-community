<template>
  <div class="config-control">
    <label v-if="label" class="control-label">
      {{ label }}
      <span v-if="required" class="required">*</span>
    </label>
    <div class="control-wrapper">
      <!-- 文本输入 -->
      <input 
        v-if="type === 'text-input'"
        :value="modelValue"
        class="form-control"
        type="text"
        :placeholder="placeholder"
        :readonly="readonly"
        @input="handleInput($event)"
      />
      
      <!-- 多行文本 -->
      <textarea 
        v-else-if="type === 'textarea'"
        :value="modelValue"
        class="form-control"
        :rows="rows || 3"
        :placeholder="placeholder"
        @input="handleInput($event)"
      ></textarea>
      
      <!-- 数字输入 -->
      <input 
        v-else-if="type === 'number-input'"
        :value="modelValue"
        class="form-control"
        type="number"
        :min="min"
        :max="max"
        :step="step"
        :readonly="readonly"
        @input="handleNumberInput($event)"
      />
      
      <!-- 颜色选择器 -->
      <div v-else-if="type === 'color-picker'" class="color-picker-wrapper">
        <input 
          :value="modelValue"
          class="color-input"
          type="color"
          @input="handleInput($event)"
        />
        <input 
          :value="modelValue"
          class="form-control color-text"
          type="text"
          :placeholder="placeholder || '#ffffff'"
          @input="handleInput($event)"
        />
      </div>
      
      <!-- 选择器 -->
      <select 
        v-else-if="type === 'select'"
        :value="modelValue"
        class="form-control"
        @change="handleInput($event)"
      >
        <option value="">请选择...</option>
        <option 
          v-for="option in options" 
          :key="option.value" 
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      
      <!-- 开关 -->
      <label v-else-if="type === 'switch'" class="switch-wrapper">
        <input 
          :checked="modelValue"
          type="checkbox"
          class="switch-input"
          @change="handleSwitchChange($event)"
        />
        <span class="switch-slider"></span>
        <span v-if="switchLabel" class="switch-label">{{ switchLabel }}</span>
      </label>
      
      <!-- 复选框 -->
      <label v-else-if="type === 'checkbox'" class="checkbox-wrapper">
        <input 
          :checked="modelValue"
          type="checkbox"
          class="checkbox-input"
          @change="handleSwitchChange($event)"
        />
        <span class="checkbox-label">{{ checkboxLabel || label }}</span>
      </label>
      
      <!-- 滑块 -->
      <div v-else-if="type === 'slider'" class="slider-wrapper">
        <input 
          :value="modelValue"
          class="slider-input"
          type="range"
          :min="min || 0"
          :max="max || 100"
          :step="step || 1"
          @input="handleNumberInput($event)"
        />
        <span class="slider-value">{{ modelValue }}</span>
      </div>
      
      <!-- 默认文本输入 -->
      <input 
        v-else
        :value="modelValue"
        class="form-control"
        type="text"
        :placeholder="placeholder"
        @input="handleInput($event)"
      />
    </div>
    
    <small v-if="description" class="control-description">
      {{ description }}
    </small>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

// Props定义
interface Props {
  modelValue: any;
  type: string;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  readonly?: boolean;
  min?: number;
  max?: number;
  step?: number;
  rows?: number;
  options?: Array<{ label: string; value: any }>;
  switchLabel?: string;
  checkboxLabel?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text-input',
  required: false,
  readonly: false,
  step: 1
});

// Emits定义
const emit = defineEmits<{
  'update:modelValue': [value: any];
}>();

// 事件处理
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  emit('update:modelValue', target.value);
};

const handleNumberInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const value = target.value === '' ? null : Number(target.value);
  emit('update:modelValue', value);
};

const handleSwitchChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.checked);
};
</script>

<style scoped>
.config-control {
  margin-bottom: 16px;
}

.control-label {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 500;
  color: #333;
}

.required {
  color: #ff4d4f;
  margin-left: 2px;
}

.control-wrapper {
  position: relative;
}

.form-control {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s;
  background-color: #fff;
}

.form-control:focus {
  border-color: #40a9ff;
  outline: none;
}

.form-control:readonly {
  background-color: #f5f5f5;
  color: #999;
}

.color-picker-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-input {
  width: 40px;
  height: 32px;
  padding: 2px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

.color-text {
  flex: 1;
}

.switch-wrapper {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.switch-input {
  display: none;
}

.switch-slider {
  position: relative;
  width: 44px;
  height: 22px;
  background-color: #ccc;
  border-radius: 11px;
  transition: background-color 0.3s;
}

.switch-slider::before {
  content: '';
  position: absolute;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: white;
  top: 2px;
  left: 2px;
  transition: transform 0.3s;
}

.switch-input:checked + .switch-slider {
  background-color: #40a9ff;
}

.switch-input:checked + .switch-slider::before {
  transform: translateX(22px);
}

.switch-label {
  margin-left: 8px;
  font-size: 14px;
  color: #333;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-input {
  margin-right: 8px;
}

.checkbox-label {
  font-size: 14px;
  color: #333;
}

.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-input {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;
}

.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #40a9ff;
  cursor: pointer;
}

.slider-input::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #40a9ff;
  cursor: pointer;
  border: none;
}

.slider-value {
  min-width: 30px;
  text-align: center;
  font-size: 14px;
  color: #666;
}

.control-description {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}
</style>