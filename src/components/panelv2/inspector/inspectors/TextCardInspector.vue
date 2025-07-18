<template>
  <div class="config-item">
    <label>{{ label }}</label>
    <input v-model="model" type="text" />
  </div>
</template>

<script lang="ts" setup>
// 这是一个通用的文本输入配置器
const model = defineModel<string>();

defineProps<{
  label: string; // 从外部传入标签，使其更通用
}>();
</script>

<style scoped>
.config-item {
  margin-bottom: 16px;
}

.config-item label {
  display: block;
  margin-bottom: 4px;
  font-size: 14px;
  color: #333;
}

.config-item input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
</style>