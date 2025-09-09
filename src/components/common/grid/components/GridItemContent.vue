<!--
  Grid Item 内容渲染组件
  负责单个网格项的内容渲染和样式处理
-->
<template>
  <div class="grid-item-content" :class="item.className" :style="item.style">
    <!-- 标题栏 -->
    <div v-if="!readonly && showTitle" class="grid-item-header">
      <span class="grid-item-title">{{ getItemTitle(item) }}</span>
    </div>

    <!-- 内容区域 -->
    <div class="grid-item-body">
      <slot :item="item">
        <!-- 默认内容 -->
        <div class="default-item-content">
          <div class="item-type">{{ item.type || '组件' }}</div>
          <div class="item-id">{{ item.i }}</div>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Grid Item 内容组件
 * 专注于网格项内容的渲染和展示
 */

import type { GridLayoutPlusItem } from '../gridLayoutPlusTypes'

interface Props {
  /** 网格项数据 */
  item: GridLayoutPlusItem
  /** 是否只读模式 */
  readonly?: boolean
  /** 是否显示标题 */
  showTitle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  readonly: false,
  showTitle: false
})

/**
 * 获取网格项标题
 * 优先级: title > type > 默认格式
 */
const getItemTitle = (item: GridLayoutPlusItem): string => {
  return item.title || item.type || `项目 ${item.i}`
}
</script>

<style scoped>
.grid-item-content {
  width: 100%;
  height: 100%; /* 🔧 恢复高度100%以支持栅格容器中的高度自适应 */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 🔧 恢复overflow hidden确保内容不超出容器 */
}

.grid-item-header {
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color);
  background: var(--card-color);
  flex-shrink: 0;
}

.grid-item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  line-height: 1.4;
}

.grid-item-body {
  flex: 1;
  padding: 12px;
  overflow: hidden; /* 🔧 恢复overflow hidden确保内容不超出容器 */
}

.default-item-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: var(--text-color-3);
}

.item-type {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 4px;
}

.item-id {
  font-size: 12px;
  opacity: 0.7;
}

/* 响应主题变化 */
[data-theme='dark'] .grid-item-header {
  border-bottom-color: var(--border-color);
}
</style>
