<template>
  <div class="paneldemo-page">
    <SimpleDemo />
  </div>
</template>

<script lang="ts" setup>
import SimpleDemo from '@/components/panelv2/demo/SimpleDemo.vue'
</script>

<style scoped>
.paneldemo-page {
  height: calc(100vh - 120px);
  width: 100%;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  background: #f8f9fa;
}

.demo-tabs {
  display: flex;
  background: white;
  border-bottom: 2px solid #e8e8e8;
  padding: 0 16px;
  flex-shrink: 0;
}

.demo-tab {
  padding: 12px 20px;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.demo-tab:hover {
  color: #1890ff;
  background: #f0f8ff;
}

.demo-tab.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
  background: #f0f8ff;
}

.demo-tab i {
  font-size: 16px;
}

.demo-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .demo-tabs {
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  
  .demo-tabs::-webkit-scrollbar {
    display: none;
  }
  
  .demo-tab {
    padding: 10px 16px;
    font-size: 13px;
  }
}
</style>