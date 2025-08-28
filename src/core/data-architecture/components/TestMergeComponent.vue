<template>
  <div class="test-merge-component">
    <n-card title="测试合并策略组件">
      <p>这是一个测试组件，用于验证组件是否能正常加载</p>
      <n-button type="primary">测试按钮</n-button>
    </n-card>
  </div>
</template>

<script setup lang="ts">
// 简单的测试组件
console.log('TestMergeComponent 已加载')
</script>

<style scoped>
.test-merge-component {
  padding: 16px;
}
</style>
