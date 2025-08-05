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
      <div class="loading-text">正在加载组件库...</div>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="initializationError" class="error-state">
      <n-icon size="48" color="#ff4d4f">
        <component :is="AlertCircleOutline" />
      </n-icon>
      <div class="error-text">组件库加载失败</div>
      <div class="error-detail">{{ initializationError }}</div>
      <n-button type="primary" size="small" @click="initializeWidgets">重试</n-button>
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
                draggable="true"
                :title="widget.description"
                @click="handleAddWidget(widget)"
                @dragstart="handleDragStart(widget, $event)"
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
import { widgetRegistry, type WidgetTreeNode, type WidgetDefinition } from '../../core/widget-registry'
import { card2Integration } from '../../core/card2-integration'
import { registerAllWidgets } from '../../widgets'
import { debugCard2System } from '@/card2.1/debug'
import SvgIcon from '@/components/custom/svg-icon.vue'
import { $t } from '@/locales'

// --- State and Emits ---
const searchTerm = ref('')
const emit = defineEmits<{
  'add-widget': [payload: { type: string; source: 'card2' | 'legacy' }]
  'drag-start': [widget: any, event: DragEvent]
}>()

// --- Widget Initialization ---
const isInitialized = ref(false)
const initializationError = ref<string | null>(null)

const initializeWidgets = async () => {
  try {
    // console.log('🚀 [WidgetLibrary] 开始初始化组件...')

    // 不注册基础组件，只注册Card2.1组件
    // registerAllWidgets(true)
    // console.log('✅ [WidgetLibrary] 跳过基础组件注册')

    // 调试 Card 2.1 系统
    await debugCard2System()
    // console.log('✅ [WidgetLibrary] Card 2.1 调试完成')

    // 初始化 Card 2.1 集成
    await card2Integration.initialize()
    // console.log('✅ [WidgetLibrary] Card 2.1 集成完成')

    isInitialized.value = true
    // console.log('🎉 [WidgetLibrary] 所有组件初始化完成')
  } catch (error) {
    console.error('❌ [WidgetLibrary] 组件初始化失败:', error)
    initializationError.value = error instanceof Error ? error.message : '初始化失败'
  }
}

// 在组件挂载时初始化所有组件
onMounted(() => {
  initializeWidgets()
})

// --- Legacy Widget Integration ---
const legacyWidgetTree = computed<WidgetTreeNode[]>(() => {
  if (!isInitialized.value) {
    // console.log('⏳ [WidgetLibrary] 等待组件初始化完成...')
    return []
  }
  return widgetRegistry.getWidgetTree()
})

// --- Combined & Re-grouped Logic ---
const combinedWidgetTree = computed<WidgetTreeNode[]>(() => {
  if (!isInitialized.value) {
    return []
  }

  const tree = legacyWidgetTree.value
  // console.log('🌳 [WidgetLibrary] 当前组件树:', tree)
  // console.log('📊 [WidgetLibrary] 组件统计:', {
  //   总分类数: tree.length,
  //   总组件数: tree.reduce((total, category) => total + category.children.length, 0),
  //   各分类组件数: tree.map(cat => ({ name: cat.name, count: cat.children.length }))
  // })
  return tree
})

interface SubCategory {
  name: string
  children: WidgetDefinition[]
}

interface TopCategory {
  name: string
  subCategories: SubCategory[]
}

const twoLevelWidgetTree = computed(() => {
  // 动态构建顶级分类数据
  const topCategoriesData: Record<string, { [subCategoryName: string]: WidgetDefinition[] }> = {}

  combinedWidgetTree.value.forEach(subCategory => {
    subCategory.children.forEach(widget => {
      // 只处理Card2.1组件
      if (!widget.metadata?.isCard2Component) {
        return
      }

      // 1. Determine Top-Level Category - 使用Card 2.1组件的mainCategory
      let topLevelName = '系统组件'
      if (widget.metadata?.card2Definition?.mainCategory) {
        topLevelName = widget.metadata.card2Definition.mainCategory
      }

      // 2. Determine Second-Level Category - 使用Card 2.1组件的subCategory
      let subLevelName = '其他'
      if (widget.metadata?.card2Definition?.subCategory) {
        subLevelName = widget.metadata.card2Definition.subCategory
      }

      // 初始化顶级分类
      if (!topCategoriesData[topLevelName]) {
        topCategoriesData[topLevelName] = {}
      }

      if (!topCategoriesData[topLevelName][subLevelName]) {
        topCategoriesData[topLevelName][subLevelName] = []
      }
      topCategoriesData[topLevelName][subLevelName].push(widget)
    })
  })

  // 3. Convert map to final array structure for rendering
  const result: TopCategory[] = Object.entries(topCategoriesData).map(([topLevelName, subCategories]) => ({
    name: topLevelName,
    subCategories: Object.entries(subCategories).map(([name, children]) => ({ name, children }))
  }))

  // console.log('🌳 [WidgetLibrary] twoLevelWidgetTree 构建结果:', {
  //   顶级分类数: result.length,
  //   各分类详情: result.map(cat => ({
  //     name: cat.name,
  //     subCategories: cat.subCategories.length,
  //     totalWidgets: cat.subCategories.reduce((sum, sub) => sum + sub.children.length, 0)
  //   }))
  // })

  return result.filter(
    topCat => topCat.subCategories.length > 0 && topCat.subCategories.some(subCat => subCat.children.length > 0)
  )
})

const filteredWidgetTree = computed(() => {
  const result = !searchTerm.value
    ? twoLevelWidgetTree.value
    : (() => {
        const lowerCaseSearch = searchTerm.value.toLowerCase()
        const filteredTopCategories: TopCategory[] = []

        twoLevelWidgetTree.value.forEach(topCategory => {
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

  // console.log('🔍 [WidgetLibrary] filteredWidgetTree 结果:', {
  //   搜索词: searchTerm.value,
  //   结果分类数: result.length,
  //   各分类详情: result.map(cat => ({
  //     name: cat.name,
  //     subCategories: cat.subCategories.length,
  //     totalWidgets: cat.subCategories.reduce((sum, sub) => sum + sub.children.length, 0)
  //   }))
  // })

  return result
})

// --- Event Handlers ---
const handleAddWidget = (widget: any) => {
  // console.log('🎯 [WidgetLibrary] handleAddWidget 被调用:', {
  //   widget,
  //   type: widget.type,
  //   source: widget.source,
  //   hasType: !!widget.type
  // })

  if (!widget.type) {
    console.error('❌ handleAddWidget called with undefined type.', widget)
    return
  }

  const payload = { type: widget.type, source: widget.source || 'legacy' }
  // console.log('📤 [WidgetLibrary] 发送 add-widget 事件:', payload)
  emit('add-widget', payload)
}

const handleDragStart = (widget: WidgetDefinition | any, event: DragEvent) => {
  // console.log('🎯 [WidgetLibrary] handleDragStart 被调用:', {
  //   widget,
  //   type: widget.type,
  //   source: widget.source
  // })

  if (event.dataTransfer) {
    const dragData = { type: widget.type, source: widget.source || 'legacy' }
    event.dataTransfer.setData('application/json', JSON.stringify(dragData))
    event.dataTransfer.effectAllowed = 'copy'
    // console.log('📤 [WidgetLibrary] 设置拖拽数据:', dragData)
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
