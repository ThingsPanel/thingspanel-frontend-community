<!-- src/card2.1/components/button/view.vue -->
<template>
  <button class="simple-button">{{ buttonText }}</button>
</template>

<script setup lang="ts">
defineProps<{
  buttonText: string;
}>();

// 这里可以添加点击事件的逻辑, 但交互逻辑主要由渲染器处理
</script>

<style scoped>
.simple-button {
  width: 100%;
  height: 100%;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f0f0f0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
.simple-button:hover {
  background-color: #e0e0e0;
}
</style>
