<!--
  @file ComponentSidebar.vue
  @description 左侧组件列表侧边栏
  负责展示可拖拽的组件树形结构
-->

<template>
  <div class="component-sidebar">
    <!-- 搜索框 -->
    <div class="sidebar-search">
      <input 
        v-model="searchKeyword"
        type="text"
        placeholder="搜索组件..."
        class="search-input"
        @input="handleSearch"
      />
      <div class="search-icon">🔍</div>
    </div>

    <!-- 组件树 -->
    <div ref="treeRef" class="component-tree">
      <!-- 搜索结果模式 -->
      <div v-if="isSearching" class="search-results">
        <div class="search-header">
          <span class="search-count">找到 {{ searchResults.length }} 个组件</span>
          <button class="clear-search" @click="clearSearch">清除</button>
        </div>
        <div class="search-list">
          <ComponentItem
            v-for="component in searchResults"
            :key="component.type"
            :component="component"
            :is-draggable="true"
            @drag-start="handleDragStart"
            @click="handleComponentClick"
          />
        </div>
      </div>

      <!-- 正常树形模式 -->
      <div v-else class="tree-categories">
        <CategoryNode
          v-for="category in treeData"
          :key="category.id"
          :node="category"
          :expanded="expandedCategories.has(category.id)"
          @toggle="handleCategoryToggle"
          @component-drag-start="handleDragStart"
          @component-click="handleComponentClick"
        />
      </div>
    </div>

    <!-- 底部统计信息 -->
    <div class="sidebar-footer">
      <div class="stats-info">
        <span class="stat-item">{{ registryStats.totalCategories }} 个分类</span>
        <span class="stat-item">{{ registryStats.totalComponents }} 个组件</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { globalNodeRegistryEngine } from '../engines/NodeRegistryEngine'
import { allMockComponents } from './MockComponents'
import type { ComponentDefinition } from '../types/core'

// 子组件引用
import ComponentItem from './components/ComponentItem.vue'
import CategoryNode from './components/CategoryNode.vue'

// 响应式数据
const searchKeyword = ref('')
const searchResults = ref<ComponentDefinition[]>([])
const expandedCategories = ref(new Set(['basic', 'chart'])) // 默认展开基础组件和图表组件
const treeRef = ref()

// 计算属性
const isSearching = computed(() => searchKeyword.value.trim().length > 0)
const treeData = computed(() => globalNodeRegistryEngine.tree.generateTree())
const registryStats = computed(() => globalNodeRegistryEngine.getStats())

// 事件定义
const emit = defineEmits<{
  'component-drag-start': [component: ComponentDefinition, event: DragEvent]
  'component-click': [component: ComponentDefinition]
}>()

/**
 * 处理搜索输入
 */
const handleSearch = () => {
  const keyword = searchKeyword.value.trim()
  if (keyword) {
    searchResults.value = globalNodeRegistryEngine.search.searchComponents({
      keyword,
      options: {
        fuzzy: false,
        caseSensitive: false,
        searchInDescription: true,
        searchInKeywords: true,
        maxResults: 50
      }
    })
  } else {
    searchResults.value = []
  }
}

/**
 * 清除搜索
 */
const clearSearch = () => {
  searchKeyword.value = ''
  searchResults.value = []
}

/**
 * 处理分类展开/折叠
 */
const handleCategoryToggle = (categoryId: string) => {
  if (expandedCategories.value.has(categoryId)) {
    expandedCategories.value.delete(categoryId)
  } else {
    expandedCategories.value.add(categoryId)
  }
}

/**
 * 处理组件拖拽开始
 */
const handleDragStart = (component: ComponentDefinition, event: DragEvent) => {
  console.log('ComponentSidebar: 开始拖拽组件', component.type)
  emit('component-drag-start', component, event)
}

/**
 * 处理组件点击
 */
const handleComponentClick = (component: ComponentDefinition) => {
  console.log('ComponentSidebar: 点击组件', component.type)
  emit('component-click', component)
}

/**
 * 初始化组件注册中心
 */
const initializeRegistry = async () => {
  // 批量注册模拟组件
  await globalNodeRegistryEngine.manager.batchRegister(allMockComponents)
  console.log('ComponentSidebar: 组件注册完成', registryStats.value)
}

// 组件挂载
onMounted(() => {
  initializeRegistry()
})
</script>

<style scoped>
.component-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fafafa;
  border-right: 1px solid #e8e8e8;
}

/* 搜索框样式 */
.sidebar-search {
  position: relative;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  font-size: 12px;
  background: #f9f9f9;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #1890ff;
  background: white;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.search-icon {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: #999;
  pointer-events: none;
}

/* 组件树样式 */
.component-tree {
  flex: 1;
  padding: 8px 0;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 搜索结果样式 */
.search-results {
  padding: 0 12px;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  margin-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.search-count {
  font-size: 12px;
  color: #666;
}

.clear-search {
  padding: 4px 8px;
  border: none;
  background: #f0f0f0;
  color: #666;
  border-radius: 3px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-search:hover {
  background: #e8e8e8;
}

.search-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 树形分类样式 */
.tree-categories {
  padding: 0 8px;
}

/* 底部统计样式 */
.sidebar-footer {
  padding: 12px;
  border-top: 1px solid #f0f0f0;
  background: white;
}

.stats-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item {
  font-size: 11px;
  color: #999;
}

/* 滚动条样式 */
.component-tree::-webkit-scrollbar {
  width: 4px;
}

.component-tree::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.component-tree::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 2px;
}

.component-tree::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}
</style>