<template>
  <div class="widget-library">
    <!-- 搜索框 -->
    <div class="search-bar">
      <n-input v-model:value="searchTerm" :placeholder="$t('visualEditor.searchComponents')" clearable>
        <template #prefix>
          <n-icon :component="SearchOutline" />
        </template>
      </n-input>
    </div>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-state">
      <n-spin size="small" />
      <p class="loading-text">{{ $t('visualEditor.loadingComponents') }}</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <n-alert type="error" :title="$t('visualEditor.componentLoadFailed')">
        {{ error }}
      </n-alert>
    </div>
    
    <!-- Tabs 组件列表 -->
    <n-tabs v-else type="line" animated class="widget-tabs">
      <n-tab-pane
        v-for="category in filteredWidgetTree"
        :key="category.name"
        :name="category.name"
        :tab="category.name"
      >
        <div class="category-grid">
          <div 
            v-for="widget in category.children" 
            :key="widget.type"
            class="widget-card"
            draggable="true"
            :title="widget.description"
            @click="handleAddWidget(widget)"
            @dragstart="handleDragStart(widget, $event)"
          >
            <div class="widget-icon">
              <n-icon size="20">
                <component :is="widget.icon" v-if="typeof widget.icon !== 'string' && widget.icon" />
                <SvgIcon v-else-if="typeof widget.icon === 'string'" :icon="widget.icon" />
              </n-icon>
            </div>
            <div class="widget-name">{{ widget.name }}</div>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { NIcon, NInput, NSpin, NAlert, NTabs, NTabPane } from 'naive-ui'
import { SearchOutline } from '@vicons/ionicons5'
import { widgetRegistry, type WidgetTreeNode, type WidgetDefinition } from '../../core/widget-registry'
import { useCard2Integration } from '../../hooks'
import SvgIcon from '@/components/custom/svg-icon.vue'
import { $t } from '@/locales'

// --- State and Emits ---
const searchTerm = ref('')
const emit = defineEmits<{
  'add-widget': [payload: { type: string; source: 'card2' | 'legacy' }];
  'drag-start': [widget: any, event: DragEvent];
}>()

// --- Card 2.1 Integration ---
const card2Integration = useCard2Integration()
const isLoading = card2Integration.isLoading
const error = card2Integration.error
const card2CategoryMap: Record<string, string> = {
  'chart': '📊 图表',
  'control': '🎛️ 控制',
  'display': '📱 显示',
  'media': '🎥 媒体',
  'other': '🔧 其他'
}
const card2WidgetTree = computed<WidgetTreeNode[]>(() => {
  const categories: { [key: string]: WidgetTreeNode } = {}
  card2Integration.availableComponents.value.forEach(widget => {
    const categoryKey = widget.category || 'other'
    const categoryName = card2CategoryMap[categoryKey] || card2CategoryMap.other
    if (!categories[categoryName]) {
      categories[categoryName] = { name: categoryName, children: [] }
    }
    const card2Widget = { ...widget, source: 'card2' as const }
    categories[categoryName].children.push(card2Widget as unknown as WidgetDefinition)
  })
  return Object.values(categories)
})

// --- Legacy Widget Integration ---
const legacyWidgetTree = computed<WidgetTreeNode[]>(() => widgetRegistry.getWidgetTree())

// --- Combined & Filtered Logic ---
const combinedWidgetTree = computed<WidgetTreeNode[]>(() => {
  const allCategories: { [key: string]: WidgetTreeNode } = {}
  legacyWidgetTree.value.forEach(category => {
    allCategories[category.name] = { name: category.name, children: [...category.children] }
  })
  card2WidgetTree.value.forEach(category => {
    if (allCategories[category.name]) {
      allCategories[category.name].children.push(...category.children)
    } else {
      allCategories[category.name] = category
    }
  })
  return Object.values(allCategories)
})

const filteredWidgetTree = computed<WidgetTreeNode[]>(() => {
  if (!searchTerm.value) {
    return combinedWidgetTree.value
  }
  const lowerCaseSearch = searchTerm.value.toLowerCase()
  const filtered: WidgetTreeNode[] = []
  combinedWidgetTree.value.forEach(category => {
    const filteredChildren = category.children.filter(widget => 
      widget.name.toLowerCase().includes(lowerCaseSearch) || 
      widget.type.toLowerCase().includes(lowerCaseSearch)
    )
    if (filteredChildren.length > 0) {
      filtered.push({ name: category.name, children: filteredChildren })
    }
  })
  return filtered
})

// --- Event Handlers ---
const handleAddWidget = (widget: any) => {
  if (!widget.type) {
    console.error("❌ handleAddWidget called with undefined type.", widget)
    return
  }
  emit('add-widget', { type: widget.type, source: widget.source || 'legacy' })
}

const handleDragStart = (widget: WidgetDefinition | any, event: DragEvent) => {
  if (event.dataTransfer) {
    const dragData = { type: widget.type, source: widget.source || 'legacy' }
    event.dataTransfer.setData('application/json', JSON.stringify(dragData))
    event.dataTransfer.effectAllowed = 'copy'
  }
}
</script>

<style scoped>
.widget-library {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--n-body-color);
}

.search-bar {
  padding: 8px 12px;
  border-bottom: 1px solid var(--n-border-color);
}

.widget-tabs {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

:deep(.n-tabs-pane) {
  flex-grow: 1;
  overflow-y: auto;
  padding: 12px;
}

.loading-state, .error-state {
  padding: 20px;
  text-align: center;
}
.loading-text {
  margin-top: 8px;
  color: var(--n-text-color-3);
}

.category-grid {
  display: grid;
  /* 确保每行至少3个，调整minmax的最小值 */
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 12px;
}

.widget-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8px;
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s ease-in-out;
  background-color: var(--n-card-color);
  height: 80px;
}

.widget-card:hover {
  border-color: var(--n-primary-color-hover);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.widget-card:active {
  cursor: grabbing;
  transform: scale(0.98);
}

.widget-icon {
  margin-bottom: 6px;
  color: var(--n-primary-color);
}

.widget-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--n-text-color-2);
  line-height: 1.3;
  /* 多行文本省略 */
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
}
</style>
