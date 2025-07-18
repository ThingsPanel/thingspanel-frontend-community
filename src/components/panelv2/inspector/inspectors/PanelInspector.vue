<template>
  <div class="config-item">
    <label>看板背景色</label>
    <input type="color" :value="modelValue" @input="onInput" />
  </div>
</template>

<script lang="ts" setup>
// 这是一个通用的颜色选择器配置器
defineProps<{ 
  modelValue: string;
}>();

const emit = defineEmits(['update:modelValue']);

const onInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  emit('update:modelValue', target.value);
};
</script>

<style scoped>
.config-item {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.config-item label {
  font-size: 14px;
  color: #333;
}

.config-item input[type='color'] {
  width: 100px;
  height: 30px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}
</style>