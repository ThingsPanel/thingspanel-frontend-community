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

    <!-- 两级分类 Tabs -->
    <n-tabs type="line" animated class="widget-tabs">
      <n-tab-pane
        v-for="topCategory in filteredWidgetTree"
        :key="topCategory.name"
        :name="topCategory.name"
        :tab="topCategory.name"
      >
        <div class="tab-content">
          <div
            v-for="subCategory in topCategory.subCategories"
            :key="subCategory.name"
            class="widget-subcategory"
          >
            <h4 class="subcategory-title">{{ subCategory.name }}</h4>
            <div class="category-grid">
              <div 
                v-for="widget in subCategory.children" 
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
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { SearchOutline } from '@vicons/ionicons5'
import { widgetRegistry, type WidgetTreeNode, type WidgetDefinition } from '../../core/widget-registry'
import SvgIcon from '@/components/custom/svg-icon.vue'
import { $t } from '@/locales'

// --- State and Emits ---
const searchTerm = ref('')
const emit = defineEmits<{
  'add-widget': [payload: { type: string; source: 'card2' | 'legacy' }];
  'drag-start': [widget: any, event: DragEvent];
}>()

// --- Legacy Widget Integration ---
const legacyWidgetTree = computed<WidgetTreeNode[]>(() => widgetRegistry.getWidgetTree())

// --- Combined & Re-grouped Logic ---
const combinedWidgetTree = computed<WidgetTreeNode[]>(() => {
  return legacyWidgetTree.value
})

interface SubCategory {
  name: string;
  children: WidgetDefinition[];
}

interface TopCategory {
  name: string;
  subCategories: SubCategory[];
}

const twoLevelWidgetTree = computed(() => {
  const topCategoriesData: {
    '曲线': { [subCategoryName: string]: WidgetDefinition[] },
    '系统': { [subCategoryName: string]: WidgetDefinition[] }
  } = {
    '曲线': {},
    '系统': {}
  };

  combinedWidgetTree.value.forEach(subCategory => {
    subCategory.children.forEach(widget => {
      // 1. Determine Top-Level Category
      const topLevelName = widget.category === 'chart' ? '曲线' : '系统';
      
      // 2. Determine Second-Level Category
      const subLevelName = subCategory.name || '其他';

      if (!topCategoriesData[topLevelName][subLevelName]) {
        topCategoriesData[topLevelName][subLevelName] = [];
      }
      topCategoriesData[topLevelName][subLevelName].push(widget);
    });
  });

  // 3. Convert map to final array structure for rendering
  const result: TopCategory[] = [
    {
      name: '曲线',
      subCategories: Object.entries(topCategoriesData['曲线']).map(([name, children]) => ({ name, children }))
    },
    {
      name: '系统',
      subCategories: Object.entries(topCategoriesData['系统']).map(([name, children]) => ({ name, children }))
    }
  ];
  
  return result.filter(topCat => topCat.subCategories.length > 0 && topCat.subCategories.some(subCat => subCat.children.length > 0));
});


const filteredWidgetTree = computed(() => {
  if (!searchTerm.value) {
    return twoLevelWidgetTree.value;
  }
  
  const lowerCaseSearch = searchTerm.value.toLowerCase();
  const filteredTopCategories: TopCategory[] = [];

  twoLevelWidgetTree.value.forEach(topCategory => {
    const filteredSubCategories: SubCategory[] = [];
    topCategory.subCategories.forEach(subCategory => {
      const filteredChildren = subCategory.children.filter(widget => 
        widget.name.toLowerCase().includes(lowerCaseSearch) || 
        widget.type.toLowerCase().includes(lowerCaseSearch)
      );
      if (filteredChildren.length > 0) {
        filteredSubCategories.push({ name: subCategory.name, children: filteredChildren });
      }
    });

    if (filteredSubCategories.length > 0) {
      filteredTopCategories.push({ name: topCategory.name, subCategories: filteredSubCategories });
    }
  });

  return filteredTopCategories;
});

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
  padding: 0;
}

.tab-content {
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

.widget-subcategory {
  margin-bottom: 16px;
}

.subcategory-title {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 10px;
  color: var(--n-text-color-2);
}

.category-grid {
  display: grid;
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
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
}
</style>
