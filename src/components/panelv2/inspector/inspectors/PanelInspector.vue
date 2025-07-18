<template>
  <div class="config-item">
    <label>看板背景色</label>
    <input v-model="model" type="color" />
  </div>
</template>

<script lang="ts" setup>
// 这是一个通用的颜色选择器配置器
const model = defineModel<string>();
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