<!--
  @file ComponentListRenderer.vue
  @description 组件列表渲染器（简化版）- 横向tab布局
  负责展示可拖拽的组件列表，采用数据驱动的tab分组设计
-->

<template>
  <div class="component-list-renderer">
    <!-- 搜索框 -->
    <div v-if="config.showSearch" class="search-section">
      <div class="search-wrapper">
        <input 
          v-model="searchKeyword"
          type="text"
          placeholder="搜索组件..."
          class="search-input"
          @input="handleSearch"
        />
        <div class="search-icon">🔍</div>
        <button 
          v-if="isSearching"
          class="clear-search" 
          @click="clearSearch"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- 分类Tab栏 -->
    <div v-if="!isSearching" class="category-tabs">
      <div class="tabs-wrapper">
        <button
          v-for="tab in categoryTabs"
          :key="tab.id"
          class="category-tab"
          :class="{ 'active': tab.id === activeCategory }"
          @click="switchToCategory(tab.id)"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-name">{{ tab.name }}</span>
          <span class="tab-count">({{ tab.components.length }})</span>
        </button>
      </div>
    </div>

    <!-- 组件列表区域 -->
    <div class="component-content">
      <!-- 搜索结果模式 -->
      <div v-if="isSearching" class="search-results">
        <div class="search-header">
          <span class="search-count">找到 {{ searchResults.length }} 个组件</span>
        </div>
        <div class="component-grid" :class="{ 'compact': config.compact }">
          <ComponentCard
            v-for="component in searchResults"
            :key="component.type"
            :component="component"
            :is-draggable="true"
            :compact="config.compact"
            @drag-start="handleDragStart"
            @click="handleComponentClick"
          />
        </div>
      </div>

      <!-- 正常分类模式 -->
      <div v-else class="category-content">
        <div 
          v-if="activeTab" 
          class="component-grid" 
          :class="{ 'compact': config.compact }"
        >
          <ComponentCard
            v-for="component in activeTab.components"
            :key="component.type"
            :component="component"
            :is-draggable="true"
            :compact="config.compact"
            @drag-start="handleDragStart"
            @click="handleComponentClick"
          />
        </div>
        
        <!-- 空状态 -->
        <div v-else-if="categoryTabs.length === 0" class="empty-state">
          <div class="empty-icon">🎨</div>
          <div class="empty-text">暂无组件</div>
          <div class="empty-hint">请先注册一些组件</div>
        </div>
      </div>
    </div>

    <!-- 底部统计信息 -->
    <div v-if="config.showStats" class="stats-footer">
      <div class="stats-info">
        <span class="stat-item">{{ rendererStats.totalCategories }} 个分类</span>
        <span class="stat-item">{{ rendererStats.totalComponents }} 个组件</span>
        <span v-if="isSearching" class="stat-item search-stat">搜索中</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { globalDataEngine } from '../engines/DataEngine'
import type { ComponentDefinition } from '../types/core'
import type { 
  ComponentCategoryTab, 
  ComponentListConfig,
  ComponentListRenderer as IComponentListRenderer
} from './interfaces/ComponentListRenderer'

// 子组件引用
import ComponentCard from './components/ComponentCard.vue'

// Props定义
interface Props {
  config?: Partial<ComponentListConfig>
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({})
})

// 事件定义
const emit = defineEmits<{
  'component-drag-start': [component: ComponentDefinition, event: DragEvent]
  'component-click': [component: ComponentDefinition]
}>()

// 响应式数据
const searchKeyword = ref('')
const searchResults = ref<ComponentDefinition[]>([])
const categoryTabs = ref<ComponentCategoryTab[]>([])
const activeCategory = ref<string>('')

// 默认配置
const config = computed<ComponentListConfig>(() => ({
  defaultActiveCategory: 'basic',
  showSearch: true,
  showStats: true,
  itemsPerRow: 4,
  compact: false,
  ...props.config
}))

// 计算属性
const isSearching = computed(() => searchKeyword.value.trim().length > 0)
const activeTab = computed(() => 
  categoryTabs.value.find(tab => tab.id === activeCategory.value)
)
const rendererStats = computed(() => ({
  totalCategories: categoryTabs.value.length,
  totalComponents: categoryTabs.value.reduce((sum, tab) => sum + tab.components.length, 0),
  activeCategory: activeCategory.value,
  isSearching: isSearching.value
}))

/**
 * 初始化分类Tab数据
 */
const initializeCategoryTabs = async () => {
  try {
    // 从DataEngine获取准备好的组件列表数据
    const componentListData = globalDataEngine.manager.getComponentListData()
    
    if (componentListData) {
      // 使用已准备的数据
      categoryTabs.value = componentListData.categoryTabs
      activeCategory.value = componentListData.defaultActiveCategory
      console.log('ComponentListRenderer: 使用DataEngine准备的数据', componentListData)
    } else {
      // 如果数据还未准备，触发数据准备
      console.log('ComponentListRenderer: 数据未准备，开始触发准备流程')
      const result = await globalDataEngine.preparation.prepareComponentListData()
      categoryTabs.value = result.categoryTabs
      activeCategory.value = result.defaultActiveCategory
    }
  } catch (error) {
    console.error('ComponentListRenderer: 初始化失败', error)
    categoryTabs.value = []
    activeCategory.value = ''
  }
}

/**
 * 切换到指定分类
 */
const switchToCategory = (categoryId: string) => {
  activeCategory.value = categoryId
  console.log('ComponentListRenderer: 切换到分类', categoryId)
}

/**
 * 处理搜索输入
 */
const handleSearch = () => {
  const keyword = searchKeyword.value.trim()
  if (keyword) {
    // 从所有分类Tab中搜索组件
    const allComponents: ComponentDefinition[] = []
    categoryTabs.value.forEach(tab => {
      allComponents.push(...tab.components)
    })
    
    // 客户端搜索逻辑
    const lowercaseKeyword = keyword.toLowerCase()
    searchResults.value = allComponents.filter(component => {
      return (
        component.name.toLowerCase().includes(lowercaseKeyword) ||
        component.type.toLowerCase().includes(lowercaseKeyword) ||
        component.meta.description?.toLowerCase().includes(lowercaseKeyword) ||
        component.meta.keywords?.some(kw => kw.toLowerCase().includes(lowercaseKeyword))
      )
    }).slice(0, 50)
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
 * 处理组件拖拽开始
 */
const handleDragStart = (component: ComponentDefinition, event: DragEvent) => {
  console.log('ComponentListRenderer: 开始拖拽组件', component.type)
  emit('component-drag-start', component, event)
}

/**
 * 处理组件点击
 */
const handleComponentClick = (component: ComponentDefinition) => {
  console.log('ComponentListRenderer: 点击组件', component.type)
  emit('component-click', component)
}

// 监听DataEngine的组件列表数据变更
globalDataEngine.events.onComponentListDataChange((data) => {
  categoryTabs.value = data.categoryTabs
  activeCategory.value = data.defaultActiveCategory
  console.log('ComponentListRenderer: 接收到DataEngine数据更新', data)
})

// 组件挂载
onMounted(() => {
  initializeCategoryTabs()
})
</script>

<style scoped>
.component-list-renderer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fafafa;
  border-right: 1px solid #e8e8e8;
}

/* 搜索框样式 */
.search-section {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  background: white;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 8px 36px 8px 12px;
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
  right: 12px;
  font-size: 12px;
  color: #999;
  pointer-events: none;
}

.clear-search {
  position: absolute;
  right: 12px;
  width: 16px;
  height: 16px;
  border: none;
  background: #f0f0f0;
  color: #666;
  border-radius: 50%;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.clear-search:hover {
  background: #e8e8e8;
}

/* 分类Tab样式 */
.category-tabs {
  border-bottom: 1px solid #f0f0f0;
  background: white;
  overflow-x: auto;
  overflow-y: hidden;
}

.tabs-wrapper {
  display: flex;
  padding: 0 8px;
  min-width: max-content;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px;
  border: none;
  background: none;
  color: #666;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  flex-shrink: 0;
}

.category-tab:hover {
  color: #333;
  background: #f5f5f5;
}

.category-tab.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
  background: #e6f7ff;
}

.tab-icon {
  font-size: 14px;
}

.tab-name {
  font-weight: 500;
}

.tab-count {
  font-size: 10px;
  color: #999;
  margin-left: 2px;
}

.category-tab.active .tab-count {
  color: #1890ff;
}

/* 组件内容区域 */
.component-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 搜索结果样式 */
.search-results {
  padding: 12px;
}

.search-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.search-count {
  font-size: 12px;
  color: #666;
}

/* 分类内容样式 */
.category-content {
  padding: 12px;
}

/* 组件网格样式 */
.component-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.component-grid.compact {
  grid-template-columns: 1fr;
  gap: 4px;
}

/* 空状态样式 */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
  margin-bottom: 4px;
  color: #666;
}

.empty-hint {
  font-size: 12px;
  color: #999;
}

/* 底部统计样式 */
.stats-footer {
  padding: 12px;
  border-top: 1px solid #f0f0f0;
  background: white;
}

.stats-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.stat-item {
  font-size: 11px;
  color: #999;
}

.stat-item.search-stat {
  color: #1890ff;
  font-weight: 500;
}

/* 滚动条样式 */
.component-content::-webkit-scrollbar {
  width: 4px;
}

.component-content::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.component-content::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 2px;
}

.component-content::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}

.category-tabs::-webkit-scrollbar {
  height: 4px;
}

.category-tabs::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.category-tabs::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 2px;
}

/* 响应式调整 */
@media (max-width: 320px) {
  .component-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 6px;
  }
  
  .search-section {
    padding: 8px;
  }
  
  .category-content {
    padding: 8px;
  }
  
  .category-tab {
    padding: 8px 12px;
    font-size: 11px;
  }
  
  .tab-name {
    display: none;
  }
}
</style>