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
    <div v-if="!isInitialized && !initializationError" class="loading-state">
      <n-spin size="large" />
      <div class="loading-text">{{ $t('visualEditor.loadingComponents') }}</div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="initializationError" class="error-state">
      <n-icon size="48" color="#ff4d4f">
        <component :is="AlertCircleOutline" />
      </n-icon>
      <div class="error-text">{{ $t('visualEditor.loadingFailed') }}</div>
      <div class="error-detail">{{ initializationError }}</div>
      <n-button type="primary" size="small" @click="initializeWidgets">{{ $t('visualEditor.retry') }}</n-button>
    </div>

    <!-- 两级分类 Tabs -->
    <n-tabs v-else type="line" animated class="widget-tabs">
      <n-tab-pane
        v-for="topCategory in filteredWidgetTree"
        :key="topCategory.name"
        :name="topCategory.name"
        :tab="topCategory.name"
      >
        <div class="tab-content">
          <div v-for="subCategory in topCategory.subCategories" :key="subCategory.name" class="widget-subcategory">
            <h4 class="subcategory-title">{{ subCategory.name }}</h4>
            <div class="category-grid">
              <div
                v-for="widget in subCategory.children"
                :key="widget.type"
                class="widget-card"
                :title="`点击添加到编辑器\n${widget.description}`"
                @click="handleAddWidget(widget)"
              >
                <div class="widget-icon">
                  <n-icon v-if="typeof widget.icon !== 'string' && widget.icon" size="20">
                    <component :is="widget.icon" />
                  </n-icon>
                  <SvgIcon
                    v-else-if="typeof widget.icon === 'string' && !widget.icon.startsWith('<svg')"
                    :icon="widget.icon"
                  />
                  <div
                    v-else-if="typeof widget.icon === 'string' && widget.icon.startsWith('<svg')"
                    class="svg-icon-inline"
                    v-html="widget.icon"
                  ></div>
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
import { ref, computed, onMounted } from 'vue'
import { SearchOutline, AlertCircleOutline } from '@vicons/ionicons5'
import { useI18n } from 'vue-i18n'
import { useComponentTree } from '@/card2.1/hooks/useComponentTree'
import { getCategoryDisplayName } from '@/card2.1/components/category-mapping'
import type { WidgetDefinition, WidgetTreeNode } from '@/components/visual-editor/types/widget'
import { registerAllWidgets } from '@/components/visual-editor/widgets'
import SvgIcon from '@/components/custom/svg-icon.vue'
import { $t } from '@/locales'

const componentTree = useComponentTree({ autoInit: true })

// --- State and Emits ---
const searchTerm = ref('')
const emit = defineEmits<{
  'add-widget': [payload: { type: string; source: 'card2' | 'legacy' }]
}>()

// --- Widget Initialization ---
// 使用 componentTree 的初始化状态
const isInitialized = computed(() => !componentTree.isLoading.value && componentTree.componentTree.value.totalCount > 0)
const initializationError = computed(() => componentTree.error.value)

const initializeWidgets = async () => {
  try {
    await componentTree.initialize()
  } catch (error) {}
}

// 组件挂载时的初始化检查
onMounted(() => {
  // 系统会自动初始化，无需额外操作
})

// --- Widget Data ---
const allWidgets = computed(() => {
  if (!isInitialized.value) return []

  // 从 componentTree 获取组件数据并转换为 WidgetDefinition 格式
  const components = componentTree.filteredComponents.value
  if (!Array.isArray(components)) {
    return []
  }

  return components.map(component => ({
    type: component.type,
    name: component.name || component.type,
    description: component.description || '',
    icon: component.icon,
    source: 'card2' as const,
    definition: {
      mainCategory: getCategoryDisplayName(component.category || ''),
      subCategory: component.subCategory || '默认'
    }
  }))
})

// --- Combined & Re-grouped Logic ---
// combinedWidgetTree is no longer needed as we process a flat list directly in twoLevelWidgetTree

interface SubCategory {
  name: string
  children: WidgetDefinition[]
}

interface TopCategory {
  name: string
  subCategories: SubCategory[]
}

// ✅ 修改为单级分类结构，忽略subCategory
const simplifiedWidgetTree = computed(() => {
  // 按mainCategory分组组件
  const categoriesData: Record<string, WidgetDefinition[]> = {}

  allWidgets.value.forEach(widget => {
    // 只检查mainCategory，忽略subCategory
    if (!widget.definition?.mainCategory) {
      console.error('⚠️ [WidgetLibrary] 跳过未分类组件:', {
        type: widget.type,
        name: widget.name,
        mainCategory: widget.definition?.mainCategory,
        source: widget.source,
        definition: widget.definition
      })
      return // 跳过此组件
    }

    const categoryName = widget.definition.mainCategory

    // 调试：记录正确分类的组件
    if (process.env.NODE_ENV === 'development') {
    }

    if (!categoriesData[categoryName]) {
      categoriesData[categoryName] = []
    }
    categoriesData[categoryName].push(widget)
  })

  // 转换为单级分类结构
  const result: TopCategory[] = Object.entries(categoriesData).map(([categoryName, widgets]) => ({
    name: categoryName,
    subCategories: [
      {
        name: '默认', // 统一的子分类名，在UI中不显示
        children: widgets
      }
    ]
  }))

  return result.filter(cat => cat.subCategories[0]?.children.length > 0)
})

const filteredWidgetTree = computed(() => {
  const result = !searchTerm.value
    ? simplifiedWidgetTree.value
    : (() => {
        const lowerCaseSearch = searchTerm.value.toLowerCase()
        const filteredTopCategories: TopCategory[] = []

        simplifiedWidgetTree.value.forEach(topCategory => {
          const filteredSubCategories: SubCategory[] = []
          topCategory.subCategories.forEach(subCategory => {
            const filteredChildren = subCategory.children.filter(
              widget =>
                widget.name.toLowerCase().includes(lowerCaseSearch) ||
                widget.type.toLowerCase().includes(lowerCaseSearch)
            )
            if (filteredChildren.length > 0) {
              filteredSubCategories.push({ name: subCategory.name, children: filteredChildren })
            }
          })

          if (filteredSubCategories.length > 0) {
            filteredTopCategories.push({ name: topCategory.name, subCategories: filteredSubCategories })
          }
        })

        return filteredTopCategories
      })()

  return result
})

// --- Event Handlers ---
const handleAddWidget = (widget: any) => {
  if (!widget.type) {
    return
  }

  const payload = { type: widget.type, source: widget.source || 'legacy' }
  emit('add-widget', payload)
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

.loading-state,
.error-state {
  padding: 20px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.loading-text {
  margin-top: 8px;
  color: var(--n-text-color-3);
}

.error-text {
  margin-top: 12px;
  font-size: 16px;
  font-weight: 600;
  color: var(--n-text-color-1);
}

.error-detail {
  margin-top: 8px;
  color: var(--n-text-color-3);
  font-size: 12px;
  max-width: 300px;
  word-break: break-word;
}

.widget-subcategory {
  margin-bottom: 16px;
}

.subcategory-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--n-text-color-1);
  padding-bottom: 6px;
  border-bottom: 1px solid var(--n-border-color);
  position: relative;
}

.subcategory-title::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 30px;
  height: 2px;
  background: var(--n-primary-color);
  border-radius: 1px;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.widget-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 12px 8px;
  border: 2px solid var(--n-border-color);
  border-radius: 8px;
  cursor: grab;
  transition: all 0.2s ease-in-out;
  background-color: var(--n-card-color);
  height: 90px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.widget-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--n-primary-color), var(--n-primary-color-hover));
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
}

.widget-card:hover {
  border-color: var(--n-primary-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.widget-card:hover::before {
  opacity: 1;
}

.widget-card:active {
  cursor: grabbing;
  transform: scale(0.98);
}

/* 🔥 确保拖拽事件不被子元素阻断 */
.widget-card * {
  pointer-events: none;
}

.widget-icon {
  margin-bottom: 8px;
  color: var(--n-primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.widget-name {
  font-size: 11px;
  font-weight: 500;
  color: var(--n-text-color-2);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all;
  max-width: 100%;
}

.svg-icon-inline {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.svg-icon-inline svg {
  width: 20px;
  height: 20px;
}
</style>
