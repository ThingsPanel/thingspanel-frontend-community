<template>
  <div class="select-input-inspector">
    <label v-if="label" class="input-label">{{ label }}</label>
    <select 
      :value="modelValue" 
      class="select-field"
      @change="handleChange"
    >
      <option value="" disabled>{{ placeholder || '请选择' }}</option>
      <option 
        v-for="option in options" 
        :key="option.value" 
        :value="option.value"
      >
        {{ option.label }}
      </option>
    </select>
    <div v-if="description" class="input-description">{{ description }}</div>
  </div>
</template>

<script lang="ts" setup>
interface Option {
  value: string | number
  label: string
}

const props = defineProps<{
  modelValue: string | number
  label?: string
  placeholder?: string
  description?: string
  options?: Option[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  const value = target.value
  emit('update:modelValue', isNaN(Number(value)) ? value : Number(value))
}
</script>

<style scoped>
.select-input-inspector {
  margin-bottom: 16px;
}

.input-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.select-field {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  font-size: 14px;
  background-color: #fff;
  transition: border-color 0.2s ease;
  box-sizing: border-box;
  cursor: pointer;
}

.select-field:focus {
  outline: none;
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(64, 169, 255, 0.2);
}

.select-field:hover {
  border-color: #40a9ff;
}

.input-description {
  margin-top: 4px;
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.4;
}
</style>