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
        :tab="getTopCategoryDisplayName(topCategory.name)"
      >
        <div class="tab-content">
          <div v-for="subCategory in topCategory.subCategories" :key="subCategory.name" class="widget-subcategory">
            <h4 v-if="subCategory.name !== 'subCategories.data'" class="subcategory-title">{{ getSubCategoryDisplayName(subCategory.name) }}</h4>
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
                <div class="widget-name">{{ getComponentDisplayName(widget.type, widget.name) }}</div>
              </div>
            </div>
          </div>
        </div>
      </n-tab-pane>
    </n-tabs>

    <!-- Dev 调试数据面板（仅开发环境显示） -->
    <div v-if="DEV" class="debug-dump">
      <details>
        <summary>调试数据（摘要）</summary>
        <pre class="debug-pre">{{ debugDump }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { SearchOutline, AlertCircleOutline } from '@vicons/ionicons5'
import { useComponentTree } from '@/card2.1/hooks/useComponentTree'
import type { WidgetDefinition } from '@/components/visual-editor/types/widget'
import SvgIcon from '@/components/custom/svg-icon.vue'
import { useI18n } from 'vue-i18n'

const componentTree = useComponentTree({ autoInit: true })

// --- 国际化 ---
const { t } = useI18n()

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


// --- Widget Data ---
const allWidgets = computed(() => {
  if (!isInitialized.value) return []

  // 从 componentTree 获取组件数据并转换为 WidgetDefinition 格式
  const components = componentTree.filteredComponents.value
  if (!Array.isArray(components)) {
    return []
  }

  return components.map(component => {
    // auto-registry.ts 传递翻译键，UI层负责翻译
    return {
      type: component.type,
      name: component.name || component.type, // auto-registry.ts传递的翻译键
      description: component.description || '',
      icon: component.icon,
      source: 'card2' as const,
      definition: {
        mainCategory: component.mainCategory || 'categories.chart', // 默认翻译键
        subCategory: component.subCategory || 'subCategories.data'     // 默认翻译键
      }
    }
  })
})


// Dev 面板简要数据摘要（仅开发显示）
const DEV = import.meta.env.DEV
const debugDump = computed(() => {
  if (!DEV || !isInitialized.value) return ''
  const tree = componentTree.componentTree.value
  const filtered = componentTree.filteredComponents.value || []
  const sample = Array.isArray(filtered)
    ? filtered.slice(0, 5).map(c => ({
        type: c?.type,
        name: c?.name,
        mainCategory: c?.mainCategory,
        subCategory: c?.subCategory,
        category: c?.category
      }))
    : []
  const categories = Array.isArray(tree?.categories) ? tree.categories.map((c: any) => c?.name) : []
  return JSON.stringify(
    {
      totalCount: tree?.totalCount,
      categories,
      componentsSample: sample
    },
    null,
    2
  )
})


interface SubCategory {
  name: string
  children: WidgetDefinition[]
}

interface TopCategory {
  name: string
  subCategories: SubCategory[]
}

// 生成两级分类树：顶层（系统/图表）、图表下再分子类
const simplifiedWidgetTree = computed(() => {
  // main → sub → widgets
  const map: Record<string, Record<string, WidgetDefinition[]>> = {}

  allWidgets.value.forEach(widget => {
    const main = widget.definition?.mainCategory
    if (!main) return
    // 使用翻译键默认值
    const sub = widget.definition?.subCategory || 'subCategories.data'

    if (!map[main]) map[main] = {}
    if (!map[main][sub]) map[main][sub] = []
    map[main][sub].push(widget)
  })

  // 使用componentTree中已排序好的分类顺序
  const orderedCategories = componentTree.componentTree.value?.categories || []
  const categoryOrder = orderedCategories.map(cat => cat.name)

  // 按照componentTree中的分类顺序构建结果
  const result: TopCategory[] = []

  // 首先按照已排序的分类顺序添加
  categoryOrder.forEach(categoryName => {
    if (map[categoryName]) {
      result.push({
        name: categoryName,
        subCategories: Object.entries(map[categoryName])
          .map(([subName, list]) => ({ name: subName, children: list }))
          // 子分类按字母排序
          .sort((a, b) => a.name.localeCompare(b.name))
      })
    }
  })

  // 然后添加任何未在categoryOrder中的分类（作为后备）
  Object.keys(map).forEach(categoryName => {
    if (!categoryOrder.includes(categoryName)) {
      result.push({
        name: categoryName,
        subCategories: Object.entries(map[categoryName])
          .map(([subName, list]) => ({ name: subName, children: list }))
          .sort((a, b) => a.name.localeCompare(b.name))
      })
    }
  })

  // 过滤空类
  return result.map(top => ({
    name: top.name,
    subCategories: top.subCategories.filter(s => s.children.length > 0)
  }))
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

// --- 国际化显示名称获取函数 ---
/**
 * 获取顶层分类的显示名称
 */
const getTopCategoryDisplayName = (categoryKey: string): string => {
  // widget-library.categories.system -> categories.system
  if (categoryKey && categoryKey.startsWith('widget-library.')) {
    const actualKey = categoryKey.replace('widget-library.', '')
    return t(actualKey)
  }
  return categoryKey
}

/**
 * 获取子分类的显示名称
 */
const getSubCategoryDisplayName = (subCategoryKey: string): string => {
  // widget-library.subCategories.deviceStatus -> subCategories.deviceStatus
  if (subCategoryKey && subCategoryKey.startsWith('widget-library.')) {
    const actualKey = subCategoryKey.replace('widget-library.', '')
    return t(actualKey)
  }
  return subCategoryKey
}

/**
 * 获取组件的显示名称
 */
const getComponentDisplayName = (componentType: string, nameKey: string): string => {
  // widget-library.components.onLine -> components.onLine
  if (nameKey && nameKey.startsWith('widget-library.')) {
    const actualKey = nameKey.replace('widget-library.', '')
    return t(actualKey)
  }
  // 兼容性处理：如果不是翻译键，直接返回或使用组件类型作为后备
  return nameKey || componentType
}

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

/* 确保拖拽事件不被子元素阻断 */
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

/* Dev 调试面板样式 */
.debug-dump {
  padding: 8px 12px;
  border-top: 1px dashed var(--n-border-color);
}
.debug-pre {
  margin: 8px 0 0;
  background: var(--n-code-color);
  border: 1px solid var(--n-border-color);
  border-radius: 6px;
  padding: 8px;
  font-size: 12px;
  max-height: 320px;
  overflow: auto;
}
</style>
