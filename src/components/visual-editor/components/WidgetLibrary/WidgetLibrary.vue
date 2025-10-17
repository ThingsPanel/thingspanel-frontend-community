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
      <!-- 图表分类Tabs -->
      <n-tab-pane
        v-for="topCategory in filteredWidgetTree"
        :key="topCategory.name"
        :name="topCategory.name"
        :tab="$t(topCategory.name)"
      >
        <div class="tab-content">
          <!-- 检查是否有子分类 -->
          <div v-if="topCategory.subCategories && topCategory.subCategories.length > 0">
            <div v-for="subCategory in topCategory.subCategories" :key="subCategory.name" class="widget-subcategory">
              <h4 class="subcategory-title">{{ $t(subCategory.name) }}</h4>

              <!-- 检查是否有组件 -->
              <div v-if="subCategory.children && subCategory.children.length > 0" class="category-grid">
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
                  <div class="widget-name">{{ $t(widget.name) }}</div>
                </div>
              </div>

              <!-- 空子分类提示 -->
              <div v-else class="empty-subcategory">
                <n-empty size="small" :description="`暂无${$t(subCategory.name)}组件`" />
              </div>
            </div>
          </div>

          <!-- 空分类提示 -->
          <div v-else class="empty-category">
            <n-empty :description="`${$t(topCategory.name)}分类暂无组件`" />
          </div>
        </div>
      </n-tab-pane>

      <!-- 🔥 新增：设备Tab（仅看板模式） -->
      <n-tab-pane v-if="props.mode === 'dashboard'" name="device" :tab="$t('card.deviceTab')">
        <div class="tab-content">
          <!-- 设备选择器 -->
          <div class="device-selector">
            <NSelect
              v-model:value="selectedDeviceId"
              :placeholder="$t('generate.select-device')"
              :options="deviceOptions"
              filterable
              clearable
              value-field="device_id"
              label-field="device_name"
              @update:value="(value, option) => parseDeviceTemplate(value, option)"
            />
          </div>

          <!-- 设备组件网格 -->
          <div v-if="deviceTabWidgets.length > 0" class="widget-subcategory">
            <h4 class="subcategory-title">{{ $t('card.availableComponents') || '可用组件' }}</h4>
            <div class="category-grid">
              <div
                v-for="widget in deviceTabWidgets"
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
                <div class="widget-name">{{ $t(widget.name) }}</div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="empty-device-state">
            <n-empty
              :description="selectedDeviceId ? '该设备模板无可用组件（v2格式）' : '请选择设备'"
            />
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
import { ref, computed, watch, onMounted } from 'vue'
import { SearchOutline, AlertCircleOutline } from '@vicons/ionicons5'
import { useComponentTree } from '@/card2.1/hooks/useComponentTree'
import type { WidgetDefinition } from '@/components/visual-editor/types/widget'
import SvgIcon from '@/components/custom/svg-icon.vue'
import { useI18n } from 'vue-i18n'
import { deviceTemplateSelect } from '@/service/api/device'

const componentTree = useComponentTree({ autoInit: true })

// --- 国际化 ---
const { t } = useI18n()

// --- Props ---
interface Props {
  mode?: 'template' | 'dashboard' // 模式：template=模板配置，dashboard=看板编辑
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'dashboard'
})

// --- State and Emits ---
const searchTerm = ref('')
const emit = defineEmits<{
  'add-widget': [payload: { type: string; source: 'card2' | 'legacy' }]
}>()

// 🔥 设备Tab相关状态
const deviceOptions = ref<any[]>([])
const selectedDeviceId = ref<string | null>(null)
const availableComponentTypes = ref<string[]>([])

// --- Widget Initialization ---
// 使用 componentTree 的初始化状态
const isInitialized = computed(() => !componentTree.isLoading.value && componentTree.componentTree.value.totalCount > 0)
const initializationError = computed(() => componentTree.error.value)


const initializeWidgets = async () => {
  try {
    await componentTree.initialize()
  } catch (error) {}
}

// 🔥 设备相关功能

/**
 * 加载设备列表
 */
const loadDeviceOptions = async () => {
  try {
    const { data, error } = await deviceTemplateSelect()
    if (!error && data) {
      deviceOptions.value = [...data].reverse()
    } else {
      deviceOptions.value = []
    }
  } catch (error) {
    console.error('❌ 加载设备列表失败:', error)
    deviceOptions.value = []
  }
}

/**
 * 解析设备模板配置
 * 提取可用的组件类型列表
 */
const parseDeviceTemplate = (deviceId: string | null, deviceOption: any) => {
  // 清空选择
  if (!deviceId || !deviceOption?.web_chart_config) {
    availableComponentTypes.value = []
    return
  }

  try {
    const config = JSON.parse(deviceOption.web_chart_config)

    // 只处理 v2 版本数据
    if (config.version === 'v2' && config.web?.config?.widgets) {
      // 提取所有组件的 type 字段
      const types = config.web.config.widgets.map((w: any) => w.type).filter(Boolean)
      availableComponentTypes.value = types
      console.log('🔥 [设备Tab] 提取到的组件类型:', types)
    } else {
      // 旧版数据或非v2版本，显示空列表
      console.log('⚠️ [设备Tab] 非v2格式数据，显示空列表')
      availableComponentTypes.value = []
    }
  } catch (e) {
    console.error('❌ [设备Tab] 解析 web_chart_config 失败:', e)
    availableComponentTypes.value = []
  }
}

/**
 * 设备Tab专用的组件列表
 * 根据模板配置过滤组件
 */
const deviceTabWidgets = computed(() => {
  if (!selectedDeviceId.value || availableComponentTypes.value.length === 0) {
    return []
  }

  // 过滤出模板中配置过的组件类型
  const filtered = allWidgets.value.filter(widget =>
    availableComponentTypes.value.includes(widget.type)
  )

  console.log('🔥 [设备Tab] 过滤后的组件:', filtered.length, '个')
  return filtered
})


// --- Widget Data ---
const allWidgets = computed(() => {
  if (!isInitialized.value) return []

  // 从 componentTree 获取组件数据并转换为 WidgetDefinition 格式
  const components = componentTree.filteredComponents.value
  if (!Array.isArray(components)) {
    console.warn('❌ [WidgetLibrary] filteredComponents 不是数组:', components)
    return []
  }

  // 🔥 调试：打印接收到的组件数据
  console.log('🔥 [WidgetLibrary] 接收组件:', components.length, '个')
  console.log('🔥 [WidgetLibrary] 分类统计:', components.reduce((acc, c) => {
    const mainCat = c?.mainCategory || '未知'
    acc[mainCat] = (acc[mainCat] || 0) + 1
    return acc
  }, {} as Record<string, number>))
  
  // 🔥 详细调试：打印数字指示器的分类信息
  const digitIndicator = components.find(c => c.type === 'digit-indicator')
  console.log('🔥 [WidgetLibrary] 数字指示器分类信息:', {
    type: digitIndicator?.type,
    mainCategory: digitIndicator?.mainCategory,
    subCategory: digitIndicator?.subCategory,
    category: digitIndicator?.category
  })

  const widgets = components.map(component => {
    // auto-registry.ts 传递翻译键，UI层负责翻译
    const widget = {
      type: component.type,
      name: component.name || component.type, // auto-registry.ts传递的翻译键
      description: component.description || '',
      icon: component.icon,
      source: 'card2' as const,
      definition: {
        mainCategory: component.mainCategory || 'categories.chart', // 默认翻译键
        subCategory: component.subCategory     // 使用实际的子分类，不设置默认值
      }
    }

    return widget
  })

  return widgets
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
    // 使用实际的子分类，不设置默认值
    const sub = widget.definition?.subCategory

    if (!sub) return // 如果没有子分类，跳过该组件

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


  // 🔥 修复：保留空分类，便于调试和确保系统分类显示
  return result.map(top => ({
    name: top.name,
    subCategories: top.subCategories // 暂时移除空分类过滤
  }))
})


const filteredWidgetTree = computed(() => {
  let result = !searchTerm.value
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


          // 🔥 修复：总是包含分类，即使没有匹配的组件（便于显示空分类状态）
          filteredTopCategories.push({ name: topCategory.name, subCategories: filteredSubCategories })
        })

        return filteredTopCategories
      })()

  // 🔥 根据 mode 过滤顶层分类
  if (props.mode === 'template') {
    // 模板模式：只显示图表分类（categories.chart）
    result = result.filter(topCategory => topCategory.name === 'categories.chart')
  }

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

// 🔥 组件挂载时加载设备列表（仅看板模式）
onMounted(() => {
  if (props.mode === 'dashboard') {
    loadDeviceOptions()
  }
})
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

/* 空分类状态样式 */
.empty-category,
.empty-subcategory {
  padding: 20px;
  text-align: center;
  color: var(--n-text-color-3);
}

.empty-subcategory {
  padding: 10px;
  margin: 10px 0;
  background-color: var(--n-card-color);
  border-radius: 6px;
  border: 1px dashed var(--n-border-color);
}
</style>
