# Recently-Visited 组件迁移指南

## 📋 组件概述

### 基本信息
- **组件ID**: `recently-visited`
- **组件名称**: 最近访问页面卡片
- **文件路径**: `src/card/builtin-card/recently-visited/`
- **组件类型**: 交互式导航卡片
- **当前状态**: ✅ 代码质量优秀，功能完善

### 功能描述
展示用户最近访问过的页面列表，提供快速导航功能。通过LocalStorage记录访问历史，支持页面图标显示、国际化标题和一键跳转，为用户提供便捷的页面导航体验。

## 🔧 技术分析

### 数据存储机制
```typescript
// LocalStorage 存储方案
const RECENTLY_VISITED_ROUTES_KEY = 'RECENTLY_VISITED_ROUTES'

interface VisitedRoute {
  path: string                    // 路由路径
  name: string | symbol           // 路由名称
  title: string                   // 页面标题
  icon?: string                   // 页面图标
  i18nKey?: string               // 国际化键值
  query?: LocationQuery          // 路由查询参数
}
```

### 技术依赖
- **Vue 3**: Composition API, `<script setup>`
- **Vue Router**: 路由导航和参数处理
- **LocalStorage**: 本地数据持久化存储
- **国际化**: `$t()` 和 `i18nKey` 双重支持
- **Naive UI**: 自动主题适配 (通过 Tailwind 类)
- **响应式**: 支持跨标签页数据同步

### 核心功能特性
1. **访问历史记录**: 自动记录用户访问的页面
2. **跨标签页同步**: 监听storage事件，多标签页数据一致
3. **智能国际化**: 支持 `i18nKey` 和 `title` 的fallback机制
4. **路由参数保持**: 完整保存和恢复路由查询参数
5. **图标展示**: 可选的页面图标显示
6. **响应式布局**: 支持明暗主题和响应式设计

## ❌ 存在问题

### 代码质量问题
1. **国际化使用方式**:
   ```typescript
   // ❌ 问题: 直接导入$t而非使用hook
   import { $t } from '@/locales'
   
   // ✅ 建议: 使用Vue 3推荐的hook方式
   import { useI18n } from 'vue-i18n'
   const { t } = useI18n()
   ```

2. **错误处理不够完善**:
   ```typescript
   // ❌ 问题: 简单的try-catch，没有详细错误处理
   } catch (error) {
     visitedRoutes.value = []
   }
   
   // ✅ 建议: 添加详细的错误处理和日志
   } catch (error) {
     console.warn('加载访问历史失败:', error)
     visitedRoutes.value = []
   }
   ```

3. **数据格式验证缺失**:
   ```typescript
   // ❌ 问题: 没有验证LocalStorage数据格式
   visitedRoutes.value = JSON.parse(routesRaw)
   
   // ✅ 建议: 添加数据格式验证
   const routes = JSON.parse(routesRaw)
   visitedRoutes.value = Array.isArray(routes) ? routes : []
   ```

### 功能扩展空间
1. **访问历史管理**: 缺少清空历史、删除单项等管理功能
2. **访问统计**: 没有访问频率和时间统计
3. **智能排序**: 可以基于访问频率或时间智能排序
4. **分类管理**: 可以按模块分类显示访问历史
5. **搜索过滤**: 大量历史时需要搜索功能

## 🔄 迁移建议

### 迁移策略: 保持独立并增强功能
**建议保持为独立的导航工具组件，但进行功能和架构升级**

#### 原因分析
1. **功能独特**: 导航工具与数据展示组件性质不同
2. **交互复杂**: 包含路由导航、数据同步等复杂交互
3. **用户价值**: 用户体验工具，具有重要的操作便利性
4. **扩展潜力**: 可以发展为完整的导航助手

## 🚀 具体迁移步骤

### Phase 1: 创建Card 2.1导航组件

#### 1.1 组件定义
```typescript
// src/card2.1/components/navigation-history/component-definition.ts
import type { ComponentDefinition } from '@/card2.1/core/types'

export const navigationHistoryDefinition: ComponentDefinition = {
  type: 'NavigationHistory',
  name: '访问历史导航',
  description: '显示用户最近访问的页面，提供快速导航功能',
  category: 'user-tools',
  
  // 数据需求 (主要是配置数据，不需要API)
  dataRequirement: {
    fields: {
      // 可以用于获取当前路由信息进行上下文显示
      currentRoute: {
        type: 'object',
        required: false,
        description: '当前路由信息'
      }
    }
  },
  
  // 配置选项
  config: {
    title: {
      type: 'string',
      default: '最近访问',
      label: '标题'
    },
    maxRecords: {
      type: 'number',
      default: 10,
      min: 5,
      max: 50,
      label: '最大记录数'
    },
    displayMode: {
      type: 'select',
      options: [
        { label: '列表模式', value: 'list' },
        { label: '卡片模式', value: 'cards' },
        { label: '紧凑模式', value: 'compact' }
      ],
      default: 'list',
      label: '显示模式'
    },
    showIcons: {
      type: 'boolean',
      default: true,
      label: '显示图标'
    },
    showTimestamp: {
      type: 'boolean',
      default: false,
      label: '显示访问时间'
    },
    enableSearch: {
      type: 'boolean',
      default: false,
      label: '启用搜索'
    },
    groupByModule: {
      type: 'boolean',
      default: false,
      label: '按模块分组'
    },
    sortBy: {
      type: 'select',
      options: [
        { label: '最近访问', value: 'recent' },
        { label: '访问频率', value: 'frequency' },
        { label: '字母排序', value: 'alphabetical' }
      ],
      default: 'recent',
      label: '排序方式'
    },
    allowManagement: {
      type: 'boolean',
      default: true,
      label: '允许管理历史'
    }
  }
}
```

#### 1.2 增强版组件实现
```vue
<!-- src/card2.1/components/navigation-history/NavigationHistory.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import dayjs from 'dayjs'

interface Props {
  config: {
    title: string
    maxRecords: number
    displayMode: 'list' | 'cards' | 'compact'
    showIcons: boolean
    showTimestamp: boolean
    enableSearch: boolean
    groupByModule: boolean
    sortBy: 'recent' | 'frequency' | 'alphabetical'
    allowManagement: boolean
  }
}

const props = withDefaults(defineProps<Props>(), {
  config: () => ({
    title: '最近访问',
    maxRecords: 10,
    displayMode: 'list',
    showIcons: true,
    showTimestamp: false,
    enableSearch: false,
    groupByModule: false,
    sortBy: 'recent',
    allowManagement: true
  })
})

// 扩展的访问记录接口
interface EnhancedVisitedRoute {
  path: string
  name: string | symbol | undefined
  title: string
  icon?: string
  i18nKey?: string
  query?: Record<string, any>
  timestamp: number          // 最后访问时间
  visitCount: number         // 访问次数
  module?: string           // 所属模块
  category?: string         // 页面分类
}

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const themeStore = useThemeStore()

// 存储键
const STORAGE_KEY = 'ENHANCED_RECENTLY_VISITED_ROUTES'

// 响应式状态
const visitedRoutes = ref<EnhancedVisitedRoute[]>([])
const searchQuery = ref('')
const loading = ref(false)

// 搜索过滤
const filteredRoutes = computed(() => {
  let routes = [...visitedRoutes.value]
  
  // 搜索过滤
  if (searchQuery.value && props.config.enableSearch) {
    const query = searchQuery.value.toLowerCase()
    routes = routes.filter(route => 
      route.title.toLowerCase().includes(query) ||
      route.path.toLowerCase().includes(query)
    )
  }
  
  // 排序
  switch (props.config.sortBy) {
    case 'frequency':
      routes.sort((a, b) => b.visitCount - a.visitCount)
      break
    case 'alphabetical':
      routes.sort((a, b) => route.title.localeCompare(b.title))
      break
    case 'recent':
    default:
      routes.sort((a, b) => b.timestamp - a.timestamp)
      break
  }
  
  // 限制记录数
  return routes.slice(0, props.config.maxRecords)
})

// 按模块分组
const groupedRoutes = computed(() => {
  if (!props.config.groupByModule) {
    return [{ module: '', routes: filteredRoutes.value }]
  }
  
  const groups: Record<string, EnhancedVisitedRoute[]> = {}
  filteredRoutes.value.forEach(route => {
    const module = route.module || '其他'
    if (!groups[module]) groups[module] = []
    groups[module].push(route)
  })
  
  return Object.entries(groups).map(([module, routes]) => ({
    module,
    routes
  }))
})

// 加载访问历史
const loadVisitedRoutes = () => {
  try {
    const routesRaw = localStorage.getItem(STORAGE_KEY)
    if (routesRaw) {
      const routes = JSON.parse(routesRaw)
      visitedRoutes.value = Array.isArray(routes) ? routes : []
    } else {
      visitedRoutes.value = []
    }
  } catch (error) {
    console.warn('加载访问历史失败:', error)
    visitedRoutes.value = []
  }
}

// 保存访问历史
const saveVisitedRoutes = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visitedRoutes.value))
  } catch (error) {
    console.warn('保存访问历史失败:', error)
  }
}

// 添加访问记录
const addVisitRecord = (routeInfo: any) => {
  const now = Date.now()
  const existingIndex = visitedRoutes.value.findIndex(
    r => r.path === routeInfo.path && JSON.stringify(r.query) === JSON.stringify(routeInfo.query)
  )
  
  if (existingIndex >= 0) {
    // 更新现有记录
    visitedRoutes.value[existingIndex].timestamp = now
    visitedRoutes.value[existingIndex].visitCount++
  } else {
    // 添加新记录
    const newRecord: EnhancedVisitedRoute = {
      path: routeInfo.path,
      name: routeInfo.name,
      title: routeInfo.title || routeInfo.path,
      icon: routeInfo.icon,
      i18nKey: routeInfo.i18nKey,
      query: routeInfo.query,
      timestamp: now,
      visitCount: 1,
      module: getModuleFromPath(routeInfo.path)
    }
    
    visitedRoutes.value.unshift(newRecord)
  }
  
  // 保存到LocalStorage
  saveVisitedRoutes()
}

// 从路径获取模块信息
const getModuleFromPath = (path: string): string => {
  const pathSegments = path.split('/').filter(Boolean)
  if (pathSegments.length > 0) {
    const moduleMap: Record<string, string> = {
      'device': '设备管理',
      'dashboard': '仪表板',
      'system': '系统设置',
      'user': '用户管理',
      'alarm': '告警管理',
      'data': '数据管理'
    }
    return moduleMap[pathSegments[0]] || pathSegments[0]
  }
  return '其他'
}

// 导航到指定路由
const navigateTo = (routeInfo: EnhancedVisitedRoute) => {
  router.push({ path: routeInfo.path, query: routeInfo.query })
}

// 获取路由显示标题
const getRouteDisplayTitle = (routeInfo: EnhancedVisitedRoute): string => {
  if (routeInfo.i18nKey) {
    try {
      return t(routeInfo.i18nKey as any)
    } catch {
      return routeInfo.title
    }
  }
  return routeInfo.title
}

// 删除访问记录
const removeVisitRecord = (index: number) => {
  visitedRoutes.value.splice(index, 1)
  saveVisitedRoutes()
}

// 清空访问历史
const clearHistory = () => {
  visitedRoutes.value = []
  saveVisitedRoutes()
}

// 格式化访问时间
const formatTimestamp = (timestamp: number): string => {
  return dayjs(timestamp).format('MM-DD HH:mm')
}

// 格式化访问频率
const getFrequencyText = (count: number): string => {
  if (count === 1) return t('navigation.onceVisited')
  return t('navigation.visitedTimes', { count })
}

// Storage事件监听
const handleStorageChange = (event: StorageEvent) => {
  if (event.key === STORAGE_KEY) {
    loadVisitedRoutes()
  }
}

// 生命周期
onMounted(() => {
  loadVisitedRoutes()
  window.addEventListener('storage', handleStorageChange)
})

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
})

// 监听路由变化以添加访问记录
watch(() => route.path, () => {
  // 这里可以根据需要自动记录路由访问
  // 或者由外部调用 addVisitRecord
}, { immediate: true })
</script>

<template>
  <div class="navigation-history-card">
    <!-- 标题和管理区域 -->
    <div class="header">
      <h3 class="title">{{ t(config.title) }}</h3>
      
      <div v-if="config.allowManagement" class="management-actions">
        <!-- 搜索 -->
        <n-input
          v-if="config.enableSearch"
          v-model:value="searchQuery"
          size="small"
          :placeholder="t('common.search')"
          clearable
          class="search-input"
        >
          <template #prefix>
            <n-icon><SearchOutline /></n-icon>
          </template>
        </n-input>
        
        <!-- 清空按钮 -->
        <n-popconfirm @positive-click="clearHistory">
          <template #trigger>
            <n-button size="small" type="warning" quaternary>
              <template #icon>
                <n-icon><TrashOutline /></n-icon>
              </template>
            </n-button>
          </template>
          {{ t('navigation.confirmClearHistory') }}
        </n-popconfirm>
      </div>
    </div>
    
    <!-- 访问历史列表 -->
    <div class="history-content">
      <!-- 无数据状态 -->
      <n-empty 
        v-if="filteredRoutes.length === 0"
        size="small"
        :description="searchQuery ? t('navigation.noSearchResults') : t('navigation.noHistory')"
      />
      
      <!-- 分组显示 -->
      <div v-else>
        <div v-for="group in groupedRoutes" :key="group.module" class="route-group">
          <!-- 模块标题 -->
          <div v-if="config.groupByModule && group.module" class="group-title">
            {{ group.module }}
          </div>
          
          <!-- 路由列表 -->
          <div 
            :class="{
              'route-list': config.displayMode === 'list',
              'route-cards': config.displayMode === 'cards',
              'route-compact': config.displayMode === 'compact'
            }"
          >
            <div
              v-for="(routeInfo, index) in group.routes"
              :key="`${routeInfo.path}-${JSON.stringify(routeInfo.query)}`"
              class="route-item"
              :class="{ 'is-current': routeInfo.path === route.path }"
              @click="navigateTo(routeInfo)"
            >
              <!-- 图标 -->
              <div v-if="config.showIcons" class="route-icon">
                <n-icon v-if="routeInfo.icon" size="16">
                  <component :is="routeInfo.icon" />
                </n-icon>
                <n-icon v-else size="16" color="#ccc">
                  <DocumentOutline />
                </n-icon>
              </div>
              
              <!-- 内容 -->
              <div class="route-content">
                <div class="route-title">{{ getRouteDisplayTitle(routeInfo) }}</div>
                <div v-if="config.showTimestamp || config.sortBy === 'frequency'" class="route-meta">
                  <span v-if="config.showTimestamp">
                    {{ formatTimestamp(routeInfo.timestamp) }}
                  </span>
                  <span v-if="config.sortBy === 'frequency'" class="visit-count">
                    {{ getFrequencyText(routeInfo.visitCount) }}
                  </span>
                </div>
              </div>
              
              <!-- 操作按钮 -->
              <div v-if="config.allowManagement" class="route-actions">
                <n-button
                  size="tiny"
                  type="error"
                  quaternary
                  @click.stop="removeVisitRecord(index)"
                >
                  <template #icon>
                    <n-icon size="12"><CloseOutline /></n-icon>
                  </template>
                </n-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.navigation-history-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: var(--card-color);
  border-radius: var(--border-radius);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
}

.management-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-input {
  width: 120px;
}

.history-content {
  flex: 1;
  overflow: hidden;
}

.route-group {
  margin-bottom: 16px;
}

.group-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-color-2);
  margin-bottom: 8px;
  padding-left: 8px;
  border-left: 3px solid var(--primary-color);
}

/* 列表模式 */
.route-list .route-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
}

.route-list .route-item:hover {
  background: var(--hover-color);
}

.route-list .route-item.is-current {
  background: var(--primary-color-suppl);
  color: var(--primary-color);
}

/* 卡片模式 */
.route-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 8px;
}

.route-cards .route-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px 8px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.route-cards .route-item:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 紧凑模式 */
.route-compact .route-item {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  margin-bottom: 2px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.route-compact .route-item:hover {
  background: var(--hover-color);
}

.route-icon {
  flex-shrink: 0;
  margin-right: 8px;
  color: var(--primary-color);
}

.route-content {
  flex: 1;
  min-width: 0;
}

.route-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.route-meta {
  font-size: 11px;
  color: var(--text-color-3);
  margin-top: 2px;
  display: flex;
  gap: 8px;
}

.visit-count {
  color: var(--primary-color);
}

.route-actions {
  flex-shrink: 0;
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.route-item:hover .route-actions {
  opacity: 1;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .route-cards {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  }
  
  .search-input {
    width: 100px;
  }
}
</style>
```

### Phase 2: 预设配置

#### 2.1 预设配置
```typescript
// src/card2.1/components/navigation-history/presets/recently-visited.ts
export const recentlyVisitedPreset: ComponentPreset = {
  id: 'recently-visited-navigation',
  name: '最近访问',
  description: '显示用户最近访问的页面，提供快速导航',
  
  config: {
    title: 'navigation.recentlyVisited',
    maxRecords: 8,
    displayMode: 'list',
    showIcons: true,
    showTimestamp: false,
    enableSearch: false,
    groupByModule: false,
    sortBy: 'recent',
    allowManagement: true
  },
  
  // 不需要数据绑定，使用本地存储
  dataBinding: {
    dataSources: [],
    updateTriggers: []
  },
  
  // 布局配置
  defaultLayout: {
    canvas: { width: 300, height: 250 },
    gridstack: { w: 3, h: 3, minH: 2, minW: 2 }
  }
}
```

## ✅ 迁移验证清单

### 功能对等验证
- [ ] **历史记录**: 正确记录和显示访问历史
- [ ] **跨标签页同步**: Storage事件监听正常工作
- [ ] **路由导航**: 点击跳转功能正常
- [ ] **国际化**: i18nKey和title的fallback机制正常
- [ ] **查询参数**: 完整保存和恢复路由参数

### 增强功能验证
- [ ] **搜索过滤**: 搜索功能正确过滤结果
- [ ] **智能排序**: 按时间、频率、字母排序正常
- [ ] **访问统计**: 正确统计访问次数和时间
- [ ] **模块分组**: 按模块分组显示正常
- [ ] **历史管理**: 删除单项和清空功能正常
- [ ] **显示模式**: 列表、卡片、紧凑模式切换正常
- [ ] **主题适配**: 明暗主题下样式正确

## 🎯 预期收益

### 用户体验提升
- **导航效率**: 快速访问常用页面，提升操作效率
- **个性化**: 基于用户行为的智能推荐
- **统计洞察**: 了解用户的页面访问模式
- **便捷管理**: 灵活的历史管理和搜索功能

### 功能增强
- **智能排序**: 多维度排序提升查找效率
- **模块分组**: 结构化展示便于理解
- **访问统计**: 为用户行为分析提供数据
- **响应式设计**: 适配不同屏幕尺寸和使用场景

该组件通过保持独立性并进行功能增强，将从简单的访问历史工具升级为智能导航助手。