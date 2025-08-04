<!--
  Visual Editor 与 Card 2.0 集成演示
-->
<template>
  <div class="card2-integration-demo">
    <h2>Card 2.1 集成测试</h2>

    <div class="status-section">
      <h3>状态信息</h3>
      <p>初始化状态: {{ card2Integration.isInitialized ? '✅ 已初始化' : '⏳ 初始化中...' }}</p>
      <p>加载状态: {{ card2Integration.isLoading ? '⏳ 加载中...' : '✅ 加载完成' }}</p>
      <p v-if="card2Integration.error">错误: {{ card2Integration.error }}</p>
    </div>

    <div class="components-section">
      <h3>可用组件 ({{ card2Integration.availableComponents.length }})</h3>
      <div v-if="card2Integration.availableComponents.length > 0" class="components-list">
        <div v-for="component in card2Integration.availableComponents" :key="component.type" class="component-item">
          <strong>{{ component.name }}</strong>
          ({{ component.type }})
          <br />
          <small>{{ component.description }}</small>
          <br />
          <small>分类: {{ component.category }}</small>
        </div>
      </div>
      <div v-else class="no-components">暂无可用组件</div>
    </div>

    <div class="registry-section">
      <h3>Widget Registry 状态</h3>
      <p>注册的组件数量: {{ widgetRegistry.getAllWidgets().length }}</p>
      <div v-if="widgetRegistry.getAllWidgets().length > 0" class="registry-list">
        <div v-for="widget in widgetRegistry.getAllWidgets()" :key="widget.type" class="widget-item">
          <strong>{{ widget.name }}</strong>
          ({{ widget.type }})
          <br />
          <small>分类: {{ widget.category }}</small>
          <br />
          <small v-if="widget.metadata?.isCard2Component">✅ Card 2.1 组件</small>
          <small v-else>❌ 传统组件</small>
        </div>
      </div>
      <div v-else class="no-widgets">注册表中暂无组件</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCard2Integration } from '../hooks/useCard2Integration'
import { widgetRegistry } from '../core/widget-registry'

const card2Integration = useCard2Integration({
  autoInit: true
})
</script>

<style scoped>
.card2-integration-demo {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.status-section,
.components-section,
.registry-section {
  margin-bottom: 30px;
  padding: 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.components-list,
.registry-list {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.component-item,
.widget-item {
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.no-components,
.no-widgets {
  color: #666;
  font-style: italic;
  margin-top: 10px;
}
</style>
