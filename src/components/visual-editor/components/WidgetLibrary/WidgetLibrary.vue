<template>
  <div class="widget-library">
    <n-card :title="$t('visualEditor.componentLibrary')" size="small" :bordered="false">
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
      
      <!-- 组件列表 -->
      <n-collapse v-else :default-expanded-names="defaultExpanded">
        <n-collapse-item 
          v-for="category in combinedWidgetTree" 
          :key="category.name" 
          :title="category.name"
          :name="category.name"
        >
          <n-space vertical size="small">
            <n-button 
  v-for="widget in category.children" 
  :key="widget.type"
  block 
  size="small"
  type="tertiary"
  draggable="true"
  :title="widget.description"
  @click="handleAddWidget(widget)"
  @dragstart="handleDragStart(widget, $event)"
>
              <template #icon>
                <n-icon>
                  <component :is="widget.icon" v-if="typeof widget.icon !== 'string' && widget.icon" />
                  <SvgIcon v-else-if="typeof widget.icon === 'string'" :icon="widget.icon" />
                </n-icon>
              </template>
              <div class="widget-info">
                <div class="widget-name">{{ widget.name }}</div>
                <div v-if="widget.version" class="widget-version">v{{ widget.version }}</div>
              </div>
            </n-button>
          </n-space>
        </n-collapse-item>
      </n-collapse>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { widgetRegistry, type WidgetTreeNode, type WidgetDefinition } from '../../core/widget-registry'
import { useCard2Integration } from '../../hooks'
import SvgIcon from '@/components/custom/svg-icon.vue'
import { $t } from '@/locales'

// --- Card 2.1 Integration ---
const card2Integration = useCard2Integration()

const isLoading = card2Integration.isLoading
const error = card2Integration.error

const card2CategoryMap: Record<string, string> = {
  'chart': '📊 Card 2.1 图表',
  'control': '🎛️ Card 2.1 控制',
  'display': '📱 Card 2.1 显示',
  'media': '🎥 Card 2.1 媒体',
  'other': '🔧 Card 2.1 其他'
}

const card2WidgetTree = computed<WidgetTreeNode[]>(() => {
  const categories: { [key: string]: WidgetTreeNode } = {}
  
  card2Integration.availableComponents.value.forEach(widget => {
    // 修正: 直接从 widget 对象获取 category
    const categoryKey = widget.category || 'other'
    const categoryName = card2CategoryMap[categoryKey] || card2CategoryMap.other
    
    if (!categories[categoryName]) {
      categories[categoryName] = { name: categoryName, children: [] }
    }
    
    // 为 Card 2.1 组件添加 source 标识并转换为 WidgetDefinition
    const card2Widget = {
      ...widget,
      source: 'card2' as const
    }
    categories[categoryName].children.push(card2Widget as unknown as WidgetDefinition)
  })
  
  return Object.values(categories)
})

// --- Legacy Widget Integration ---
const legacyWidgetTree = computed<WidgetTreeNode[]>(() => {
  return widgetRegistry.getWidgetTree()
})

// --- Combined Logic ---
const combinedWidgetTree = computed<WidgetTreeNode[]>(() => {
  const allCategories: { [key: string]: WidgetTreeNode } = {}

  // 添加传统组件
  legacyWidgetTree.value.forEach(category => {
    allCategories[category.name] = { name: category.name, children: [...category.children] }
  })

  // 添加 Card 2.1 组件
  card2WidgetTree.value.forEach(category => {
    if (allCategories[category.name]) {
      // 合并到现有分类
      allCategories[category.name].children.push(...category.children)
    } else {
      // 添加新分类
      allCategories[category.name] = category
    }
  })

  return Object.values(allCategories)
})

const defaultExpanded = computed(() => {
  return combinedWidgetTree.value.map(c => c.name)
})


// --- Emits and Event Handlers ---
const emit = defineEmits<{
  'add-widget': [payload: { type: string; source: 'card2' | 'legacy' }]
}>()

const handleAddWidget = (widget: any) => {
  const isCard2 = widget.source === 'card2'
  // Card 2.1 组件和传统组件都使用 type 字段
  const type = widget.type
  
  if (!type) {
    console.error("❌ handleAddWidget called with undefined type.", widget);
    return;
  }
  emit('add-widget', { type, source: widget.source || 'legacy' })
}

const handleDragStart = (widget: WidgetDefinition | any, event: DragEvent) => {
  if (event.dataTransfer) {
    const isCard2 = widget.source === 'card2'
    // Card 2.1 组件和传统组件都使用 type 字段
    const type = widget.type
    
    const dragData = {
      type,
      source: widget.source || 'legacy'
    };

    console.log('Dragging widget:', widget);
    console.log('Drag data being set:', dragData);

    event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    event.dataTransfer.effectAllowed = 'copy';
  }
}
</script>

<style scoped>
.widget-library {
  padding: 8px;
  height: 100%;
  overflow-y: auto;
  background-color: var(--tp-c-bg);
}

:deep(.n-card) {
  background-color: transparent;
}

:deep(.n-card__content) {
  padding: 8px;
}

.loading-state {
  padding: 20px;
  text-align: center;
}
.loading-text {
  margin-top: 8px;
  color: var(--n-text-color-3);
}

.error-state {
  padding: 10px;
}

.widget-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  text-align: left;
}

.widget-name {
  font-weight: 500;
  line-height: 1.2;
}

.widget-version {
  font-size: 10px;
  color: var(--n-text-color-3);
  line-height: 1;
  margin-top: 2px;
}

:deep(.n-button__content) {
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
}

:deep(.n-collapse-item__header) {
  padding: 8px 12px !important;
}

:deep(.n-collapse-item__content-inner) {
  padding: 0 4px 8px 4px !important;
}
</style>
