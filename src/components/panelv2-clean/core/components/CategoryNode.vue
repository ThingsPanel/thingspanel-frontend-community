<!--
  @file CategoryNode.vue
  @description 组件分类节点组件
  展示可展开/折叠的分类节点及其子组件
-->

<template>
  <div class="category-node">
    <!-- 分类头部 -->
    <div 
      class="category-header"
      :class="{ 'expanded': expanded }"
      @click="handleToggle"
    >
      <div class="category-icon">
        <span class="expand-icon">{{ expanded ? '▼' : '▶' }}</span>
        <span class="category-emoji">{{ node.icon }}</span>
      </div>
      <div class="category-info">
        <div class="category-name">{{ node.name }}</div>
        <div class="category-count">{{ getComponentCount() }} 个组件</div>
      </div>
    </div>

    <!-- 分类内容 -->
    <div 
      v-if="expanded && node.children"
      class="category-content"
    >
      <div class="category-children">
        <template v-for="child in node.children" :key="child.id">
          <!-- 递归渲染子分类 -->
          <CategoryNode
            v-if="child.type === 'category'"
            :node="child"
            :expanded="expandedCategories.has(child.id)"
            @toggle="(id) => $emit('toggle', id)"
            @component-drag-start="(comp, event) => $emit('component-drag-start', comp, event)"
            @component-click="(comp) => $emit('component-click', comp)"
          />
          
          <!-- 渲染组件项 -->
          <ComponentItem
            v-else-if="child.type === 'component' && child.componentDef"
            :component="child.componentDef"
            :is-draggable="true"
            @drag-start="(comp, event) => $emit('component-drag-start', comp, event)"
            @click="(comp) => $emit('component-click', comp)"
          />
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ComponentTreeNode } from '../../engines/interfaces/NodeRegistry'
import type { ComponentDefinition } from '../../types/core'
import ComponentItem from './ComponentItem.vue'

// Props定义
interface Props {
  node: ComponentTreeNode
  expanded: boolean
}

const props = defineProps<Props>()

// 事件定义
const emit = defineEmits<{
  'toggle': [categoryId: string]
  'component-drag-start': [component: ComponentDefinition, event: DragEvent]
  'component-click': [component: ComponentDefinition]
}>()

// 模拟展开状态（这里简化处理，实际应该由父组件管理）
const expandedCategories = computed(() => new Set(['basic', 'chart']))

/**
 * 获取当前分类下的组件数量
 */
const getComponentCount = (): number => {
  if (!props.node.children) return 0
  
  return props.node.children.reduce((count, child) => {
    if (child.type === 'component') {
      return count + 1
    } else if (child.type === 'category' && child.children) {
      // 递归计算子分类的组件数量
      return count + child.children.filter(c => c.type === 'component').length
    }
    return count
  }, 0)
}

/**
 * 处理分类展开/折叠
 */
const handleToggle = () => {
  emit('toggle', props.node.id)
}
</script>

<style scoped>
.category-node {
  margin-bottom: 8px;
}

/* 分类头部样式 */
.category-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f5f5f5;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
}

.category-header:hover {
  background: #f0f0f0;
  border-color: #d9d9d9;
}

.category-header.expanded {
  background: #e6f7ff;
  border-color: #91d5ff;
}

/* 分类图标区域 */
.category-icon {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.expand-icon {
  font-size: 10px;
  color: #666;
  transition: transform 0.2s;
  width: 10px;
  text-align: center;
}

.category-emoji {
  font-size: 16px;
  line-height: 1;
}

/* 分类信息 */
.category-info {
  flex: 1;
  min-width: 0;
}

.category-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 1px;
}

.category-count {
  font-size: 11px;
  color: #999;
}

/* 分类内容样式 */
.category-content {
  margin-top: 4px;
  padding-left: 16px;
  border-left: 2px solid #f0f0f0;
  margin-left: 12px;
}

.category-children {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 0;
}

/* 展开动画 */
.category-content {
  animation: expand 0.2s ease-out;
}

@keyframes expand {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 嵌套分类样式调整 */
.category-node .category-node .category-header {
  background: #fafafa;
  font-size: 12px;
  padding: 6px 10px;
}

.category-node .category-node .category-name {
  font-size: 12px;
}

.category-node .category-node .category-count {
  font-size: 10px;
}

/* 响应式调整 */
@media (max-width: 280px) {
  .category-header {
    padding: 6px 8px;
  }
  
  .category-name {
    font-size: 12px;
  }
  
  .category-count {
    font-size: 10px;
  }
}
</style>