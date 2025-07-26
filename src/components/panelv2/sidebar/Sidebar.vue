<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <h3>节点数据</h3>
      <small>点击选中节点</small>
    </div>
    
    <div class="data-list">
      <div 
        v-for="node in nodes" 
        :key="node.id"
        class="data-item"
        :class="{ active: selectedNodeId === node.id }"
        @click="selectNode(node.id)"
      >
        <div class="node-type">{{ node.type }}</div>
        <div class="node-id">ID: {{ node.id }}</div>
        <div class="node-data">
          <pre>{{ JSON.stringify(node.data, null, 2) }}</pre>
        </div>
        <div v-if="node.layout" class="node-layout">
          <strong>布局:</strong> {{ JSON.stringify(node.layout) }}
        </div>
      </div>
      
      <div v-if="!nodes.length" class="empty-state">
        <i class="fa fa-database"></i>
        <p>暂无数据</p>
        <small>数据将在这里显示</small>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { NodeData } from '../engines/RenderEngine'

interface Props {
  nodes?: NodeData[]
  selectedNodeId?: string
}

const props = withDefaults(defineProps<Props>(), {
  nodes: () => [],
  selectedNodeId: undefined
})

const emit = defineEmits<{
  selectNode: [nodeId: string]
}>()

const selectNode = (nodeId: string) => {
  emit('selectNode', nodeId)
}
</script>

<style scoped>
.sidebar {
  width: 200px;
  padding: 16px;
  background-color: #ffffff;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  margin-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 12px;
}

.sidebar-header h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: #333;
}

.sidebar-header small {
  color: #999;
  font-size: 12px;
}

.data-list {
  flex: 1;
}

.data-item {
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  cursor: pointer;
  background-color: #fafafa;
  transition: all 0.2s ease;
}

.data-item:hover {
  background-color: #f0f8ff;
  border-color: #40a9ff;
}

.data-item.active {
  background-color: #e6f7ff;
  border-color: #1890ff;
  border-width: 2px;
}

.node-type {
  font-weight: bold;
  color: #1890ff;
  font-size: 13px;
  margin-bottom: 4px;
}

.node-id {
  font-size: 11px;
  color: #999;
  margin-bottom: 8px;
}

.node-data {
  margin-bottom: 8px;
}

.node-data pre {
  font-size: 10px;
  background: #f5f5f5;
  padding: 6px;
  border-radius: 3px;
  margin: 0;
  overflow-x: auto;
  max-height: 80px;
  color: #666;
  line-height: 1.3;
}

.node-layout {
  font-size: 11px;
  color: #666;
}

.node-layout strong {
  color: #333;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-state i {
  font-size: 32px;
  margin-bottom: 12px;
  display: block;
}

.empty-state p {
  margin: 0 0 4px 0;
  font-size: 14px;
}

.empty-state small {
  font-size: 12px;
}
</style>