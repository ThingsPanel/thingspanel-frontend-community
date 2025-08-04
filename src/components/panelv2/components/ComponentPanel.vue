<!--
  组件面板
  显示可用的卡片组件，支持分类、搜索和预览
-->
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  NInput,
  NTree,
  NCard,
  NImage,
  NEmpty,
  NSpin,
  NIcon,
  NTooltip,
  NTag,
  NBadge,
  NCollapse,
  NCollapseItem
} from 'naive-ui'
import type { TreeOption } from 'naive-ui'
import { useThemeStore } from '@/store/modules/theme'
import { cardRegistry, CardCategory, initializeCardSystem } from '../cards'
import type { CardDefinition } from '../cards'
import { dragDropService, type DragData } from '../core/DragDropService'
import {
  CubeOutline,
  BarChartOutline,
  ServerOutline,
  GridOutline,
  SettingsOutline,
  CodeOutline,
  HelpOutline,
  SearchOutline,
  ImageOutline
} from '@vicons/ionicons5'

// 组件状态
const themeStore = useThemeStore()
const loading = ref(true)
const searchKeyword = ref('')
const selectedCategory = ref<CardCategory | null>(null)
const expandedKeys = ref<string[]>([])

// 搜索结果
const searchResults = computed(() => {
  if (!searchKeyword.value) {
    return selectedCategory.value ? cardRegistry.getByCategory(selectedCategory.value) : cardRegistry.getAll()
  }

  return cardRegistry.search({
    keyword: searchKeyword.value,
    category: selectedCategory.value || undefined
  })
})

// 按分类组织的卡片数据
const categorizedCards = computed(() => {
  const categories = new Map<CardCategory, CardDefinition[]>()

  searchResults.value.forEach(card => {
    if (!categories.has(card.category)) {
      categories.set(card.category, [])
    }
    categories.get(card.category)!.push(card)
  })

  return categories
})

// 分类显示配置
const categoryConfig = {
  [CardCategory.BUILTIN]: {
    label: '内置组件',
    icon: CubeOutline,
    color: '#18a058'
  },
  [CardCategory.CHART]: {
    label: '图表组件',
    icon: BarChartOutline,
    color: '#2080f0'
  },
  [CardCategory.SYSTEM]: {
    label: '系统监控',
    icon: ServerOutline,
    color: '#f0a020'
  },
  [CardCategory.DATA]: {
    label: '数据展示',
    icon: GridOutline,
    color: '#722ed1'
  },
  [CardCategory.CONTROL]: {
    label: '控制组件',
    icon: SettingsOutline,
    color: '#eb2f96'
  },
  [CardCategory.CUSTOM]: {
    label: '自定义组件',
    icon: CodeOutline,
    color: '#13c2c2'
  }
}

// 统计信息
const stats = computed(() => cardRegistry.getStats())

// 主题颜色计算属性
const themeColors = computed(() => {
  const isDark = themeStore.darkMode
  return {
    '--component-bg': isDark ? '#2a2a2a' : '#ffffff',
    '--component-border': isDark ? '#404040' : '#e0e0e0',
    '--component-hover': isDark ? '#3a3a3a' : '#f5f5f5',
    '--text-primary': isDark ? '#ffffff' : '#333333',
    '--text-secondary': isDark ? '#cccccc' : '#666666',
    '--search-bg': isDark ? '#1f1f1f' : '#fafafa'
  }
})

// 生命周期
onMounted(async () => {
  try {
    await initializeCardSystem()

    // 默认展开所有分类
    expandedKeys.value = Object.values(CardCategory)
  } catch (error) {
    console.error('Failed to initialize card system:', error)
  } finally {
    loading.value = false
  }
})

// Props
interface Props {
  currentRenderer?: string
}

const props = withDefaults(defineProps<Props>(), {
  currentRenderer: 'kanban'
})

// Emits
interface Emits {
  (e: 'card-drag', data: DragData): void
}

const emit = defineEmits<Emits>()

// 拖拽事件处理
const handleDragStart = (event: DragEvent, card: CardDefinition) => {
  if (!event.dataTransfer) return

  // 创建拖拽数据
  const dragData: DragData = {
    type: 'card',
    source: 'component-panel',
    cardId: card.id,
    cardName: card.name,
    cardType: card.category,
    cardConfig: {
      id: card.id,
      name: card.name,
      category: card.category,
      preset: card.preset,
      config: card.config,
      version: card.version
    },
    preview: card.poster,
    metadata: {
      description: card.description,
      tags: card.tags,
      deprecated: card.deprecated
    }
  }

  // 使用DragDropService处理拖拽
  dragDropService.startDrag(dragData, event)

  // 发出事件通知父组件
  emit('card-drag', dragData)
}

// 获取分类图标
const getCategoryIcon = (category: CardCategory) => {
  return categoryConfig[category]?.icon || HelpOutline
}

// 获取分类颜色
const getCategoryColor = (category: CardCategory) => {
  return categoryConfig[category]?.color || '#666666'
}

// 获取分类标签
const getCategoryLabel = (category: CardCategory) => {
  return categoryConfig[category]?.label || category
}
</script>

<template>
  <div class="component-panel h-full flex flex-col" :style="themeColors">
    <!-- 顶部搜索和统计 -->
    <div
      class="panel-header p-4"
      style="background-color: var(--component-bg); border-bottom: 1px solid var(--component-border)"
    >
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-lg font-semibold" style="color: var(--text-primary)">组件库</h3>
        <NBadge :value="stats.total" :max="99">
          <NIcon size="20" class="text-gray-500">
            <CubeOutline />
          </NIcon>
        </NBadge>
      </div>

      <!-- 搜索框 -->
      <NInput v-model:value="searchKeyword" placeholder="搜索组件..." clearable size="small">
        <template #prefix>
          <NIcon>
            <SearchOutline />
          </NIcon>
        </template>
      </NInput>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <NSpin size="large">
        <template #description>加载组件库...</template>
      </NSpin>
    </div>

    <!-- 组件列表 -->
    <div v-else class="flex-1 overflow-auto">
      <!-- 空状态 -->
      <div v-if="searchResults.length === 0" class="p-4">
        <NEmpty description="没有找到匹配的组件">
          <template #icon>
            <NIcon size="48" class="text-gray-400">
              <ImageOutline />
            </NIcon>
          </template>
        </NEmpty>
      </div>

      <!-- 按分类显示组件 -->
      <div v-else class="p-4">
        <NCollapse v-model:expanded-names="expandedKeys" accordion>
          <NCollapseItem v-for="[category, cards] in categorizedCards" :key="category" :name="category">
            <template #header>
              <div class="flex items-center gap-2">
                <NIcon size="16" :style="{ color: getCategoryColor(category) }">
                  <component :is="getCategoryIcon(category)" />
                </NIcon>
                <span class="font-medium">{{ getCategoryLabel(category) }}</span>
                <NBadge :value="cards.length" size="small" />
              </div>
            </template>

            <!-- 分类下的卡片 -->
            <div class="grid grid-cols-1 gap-3 mt-2">
              <div
                v-for="card in cards"
                :key="card.id"
                class="card-item group"
                draggable="true"
                @dragstart="handleDragStart($event, card)"
              >
                <NCard size="small" hoverable class="cursor-move transition-all duration-200 group-hover:shadow-md">
                  <div class="flex items-start gap-3">
                    <!-- 预览图 -->
                    <div class="flex-shrink-0 w-12 h-12 bg-gray-100 rounded overflow-hidden">
                      <NImage
                        v-if="card.poster"
                        :src="card.poster"
                        :alt="card.name"
                        object-fit="cover"
                        class="w-full h-full"
                        fallback-src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik0yNCAzNkMzMC42Mjc0IDM2IDM2IDMwLjYyNzQgMzYgMjRDMzYgMTcuMzcyNiAzMC42Mjc0IDEyIDI0IDEyQzE3LjM3MjYgMTIgMTIgMTcuMzcyNiAxMiAyNEMxMiAzMC42Mjc0IDE3LjM3MjYgMzYgMjQgMzYiIGZpbGw9IiNEOUQ5RDkiLz4KPC9zdmc+"
                      />
                      <div v-else class="w-full h-full flex items-center justify-center bg-gray-200">
                        <NIcon size="20" class="text-gray-400">
                          <component :is="getCategoryIcon(card.category)" />
                        </NIcon>
                      </div>
                    </div>

                    <!-- 卡片信息 -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between">
                        <div class="flex-1">
                          <div class="font-medium text-sm text-gray-900 truncate">
                            {{ card.name }}
                          </div>
                          <div v-if="card.description" class="text-xs text-gray-500 mt-1 line-clamp-2">
                            {{ card.description }}
                          </div>
                        </div>

                        <!-- 大小标签 -->
                        <NTag size="tiny" :bordered="false" class="ml-2 flex-shrink-0">
                          {{ card.preset.w }}×{{ card.preset.h }}
                        </NTag>
                      </div>

                      <!-- 标签 -->
                      <div v-if="card.tags && card.tags.length > 0" class="flex flex-wrap gap-1 mt-2">
                        <NTag
                          v-for="tag in card.tags.slice(0, 2)"
                          :key="tag"
                          size="tiny"
                          type="default"
                          :bordered="false"
                        >
                          {{ tag }}
                        </NTag>
                        <span v-if="card.tags.length > 2" class="text-xs text-gray-400">
                          +{{ card.tags.length - 2 }}
                        </span>
                      </div>
                    </div>
                  </div>
                </NCard>
              </div>
            </div>
          </NCollapseItem>
        </NCollapse>
      </div>
    </div>

    <!-- 底部提示 -->
    <div class="panel-footer p-3 bg-white border-t border-gray-200">
      <div class="text-xs text-gray-500 text-center">拖拽组件到画布中添加</div>
    </div>
  </div>
</template>

<style scoped>
.component-panel {
  width: 100%;
  height: 100%;
  background-color: var(--search-bg);
  transition: background-color 0.3s ease;
}

.card-item {
  position: relative;
  background-color: var(--component-bg);
  border: 1px solid var(--component-border);
  transition: all 0.2s ease;
}

.card-item:hover {
  transform: translateY(-1px);
  background-color: var(--component-hover);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 拖拽时的样式 */
.card-item:active {
  opacity: 0.8;
  transform: scale(0.98);
}

.card-item[draggable='true']:hover {
  cursor: move;
}

.card-item[draggable='true']:active {
  cursor: grabbing;
  opacity: 0.6;
}

/* 全局拖拽预览样式 */
:global(.drag-preview) {
  background: white !important;
  border: 2px solid #1890ff !important;
  border-radius: 8px !important;
  padding: 8px 12px !important;
  font-size: 14px !important;
  color: #1890ff !important;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3) !important;
  pointer-events: none !important;
  z-index: 9999 !important;
}
</style>
