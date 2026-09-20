<template>
  <div class="advanced-list-container">
    <n-card class="full-height-card" footer-style="padding-top: 0px; padding-bottom: 0px;">
      <div class="advanced-list-layout">
        <!-- 搜索区域 -->
        <div v-if="!inlineHeader && shouldShowSearchArea" class="search">
          <div class="search-form-content">
            <slot name="search-form-content" />
          </div>
        </div>
        <n-divider v-if="!inlineHeader && showAddButton" style="margin-top: 10px; margin-bottom: 10px" />
        <!-- 内容区域 -->
        <div class="list-content">
          <!-- 内容头部 -->
          <div v-if="inlineHeader && stackedHeader" class="list-content-header list-content-header--stacked">
            <div class="list-content-header-title-row">
              <div class="list-content-header-left">
                <slot name="header-title">
                  <slot name="header-left">
                    <slot name="add-button">
                      <n-button v-if="showAddButton" type="primary" size="small" @click="handleAddNew">
                        <template #icon>
                          <n-icon><plus-icon /></n-icon>
                        </template>
                        {{ getAddButtonText() }}
                      </n-button>
                    </slot>
                  </slot>
                </slot>
              </div>
            </div>
            <div class="list-content-header-toolbar-row">
              <div v-if="shouldShowSearchArea" class="list-content-header-toolbar-search">
                <slot name="search-form-content" />
              </div>
              <div class="list-content-header-toolbar-right">
                <slot name="header-right">
                  <n-space v-if="shouldShowViewSwitcher || hasRefreshButton" align="center">
                    <n-button-group v-if="shouldShowViewSwitcher">
                      <n-button
                        v-for="view in getAvailableViewsWithSlots()"
                        :key="view.key"
                        :type="currentView === view.key ? 'primary' : 'default'"
                        size="small"
                        :title="view.label ? $t(view.label) : view.key"
                        @click="handleViewChange(view.key)"
                      >
                        <n-icon size="14">
                          <component :is="view.icon" />
                        </n-icon>
                      </n-button>
                    </n-button-group>
                    <n-button size="small" :title="$t('buttons.refresh')" @click="handleRefresh">
                      <n-icon size="14"><refresh-icon /></n-icon>
                    </n-button>
                  </n-space>
                </slot>
              </div>
            </div>
          </div>
          <div v-else-if="inlineHeader" class="list-content-header list-content-header--inline">
            <div class="list-content-header-left">
              <slot name="header-title">
                <slot name="header-left">
                  <slot name="add-button">
                    <n-button v-if="showAddButton" type="primary" size="small" @click="handleAddNew">
                      <template #icon>
                        <n-icon><plus-icon /></n-icon>
                      </template>
                      {{ getAddButtonText() }}
                    </n-button>
                  </slot>
                </slot>
              </slot>
            </div>
            <div class="list-content-header-right list-content-header-right--inline">
              <div v-if="shouldShowSearchArea" class="inline-search-form">
                <slot name="search-form-content" />
              </div>
              <slot name="header-right">
                <n-space v-if="shouldShowViewSwitcher || hasRefreshButton" align="center">
                  <n-button-group v-if="shouldShowViewSwitcher">
                    <n-button
                      v-for="view in getAvailableViewsWithSlots()"
                      :key="view.key"
                      :type="currentView === view.key ? 'primary' : 'default'"
                      size="small"
                      :title="view.label ? $t(view.label) : view.key"
                      @click="handleViewChange(view.key)"
                    >
                      <n-icon size="14">
                        <component :is="view.icon" />
                      </n-icon>
                    </n-button>
                  </n-button-group>
                  <n-button size="small" :title="$t('buttons.refresh')" @click="handleRefresh">
                    <n-icon size="14"><refresh-icon /></n-icon>
                  </n-button>
                </n-space>
              </slot>
            </div>
          </div>
          <div v-else class="list-content-header">
            <!-- 左侧操作区域 -->
            <div class="list-content-header-left">
              <slot name="header-left">
                <!-- 默认新建按钮 -->
                <slot name="add-button">
                  <n-button v-if="showAddButton" type="primary" size="small" @click="handleAddNew">
                    <template #icon>
                      <n-icon><plus-icon /></n-icon>
                    </template>
                    {{ getAddButtonText() }}
                  </n-button>
                </slot>
              </slot>
            </div>
            <!-- 右侧操作区域 -->
            <div class="list-content-header-right">
              <slot name="header-right">
                <n-space v-if="shouldShowViewSwitcher || hasRefreshButton" align="center">
                  <n-button-group v-if="shouldShowViewSwitcher">
                    <n-button
                      v-for="view in getAvailableViewsWithSlots()"
                      :key="view.key"
                      :type="currentView === view.key ? 'primary' : 'default'"
                      size="small"
                      :title="view.label ? $t(view.label) : view.key"
                      @click="handleViewChange(view.key)"
                    >
                      <n-icon size="14">
                        <component :is="view.icon" />
                      </n-icon>
                    </n-button>
                  </n-button-group>
                  <n-button size="small" :title="$t('buttons.refresh')" @click="handleRefresh">
                    <n-icon size="14"><refresh-icon /></n-icon>
                  </n-button>
                </n-space>
              </slot>
            </div>
          </div>

          <!-- 内容主体 -->

          <div class="list-content-body" :class="{ 'list-content-body--inline': inlineHeader }">
            <div v-if="currentView === 'card' && hasSlot('card-view')" class="view-wrapper">
              <slot name="card-view"></slot>
            </div>
            <div v-else-if="currentView === 'list' && hasSlot('list-view')" class="view-wrapper">
              <slot name="list-view"></slot>
            </div>
            <div v-else-if="currentView === 'map' && hasSlot('map-view')" class="view-wrapper">
              <slot name="map-view"></slot>
            </div>
            <div v-else class="view-wrapper">
              <slot :name="getDefaultViewSlot()"></slot>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部区域 -->
      <template v-if="hasSlot('footer')" #footer>
        <div class="list-content-footer">
          <slot name="footer" />
        </div>
      </template>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, useSlots, onMounted, onUnmounted, onActivated } from 'vue'
import { useStorage } from '@vueuse/core'
import { NCard, NButton, NButtonGroup, NIcon, NSpace } from 'naive-ui'
import { $t } from '@/locales'
import {
  AddOutline as PlusIcon,
  RefreshOutline as RefreshIcon,
  GridOutline as CardIcon,
  ListOutline as ListIcon,
  MapOutline as MapIcon
} from '@vicons/ionicons5'

// 定义组件名称
defineOptions({
  name: 'AdvancedListLayout'
})

// Props 定义
interface ViewItem {
  key: string
  icon: any
  label?: string
}

interface Props {
  addButtonText?: string | (() => string)
  addButtonI18nKey?: string
  initialView?: string
  availableViews?: ViewItem[]
  showQueryButton?: boolean
  showResetButton?: boolean
  showAddButton?: boolean
  inlineHeader?: boolean // 是否将标题、搜索和操作合并到同一行
  stackedHeader?: boolean // 是否将标题单独置于工具栏上方
  mobileBreakpoint?: number // 移动端断点，默认768px
  useViewMemory?: boolean // 是否启用视图记忆功能
  memoryKey?: string // 视图记忆的唯一键
}

const props = withDefaults(defineProps<Props>(), {
  addButtonText: '',
  addButtonI18nKey: 'card.addButton',
  initialView: '',
  availableViews: () => [
    { key: 'card', icon: CardIcon, label: 'common.viewCard' },
    { key: 'list', icon: ListIcon, label: 'common.viewList' },
    { key: 'map', icon: MapIcon, label: 'common.viewMap' }
  ],
  showQueryButton: true,
  showResetButton: true,
  showAddButton: true,
  inlineHeader: false,
  stackedHeader: false,
  mobileBreakpoint: 768,
  useViewMemory: false,
  memoryKey: 'advanced-list-view'
})

// Emits 定义
const emit = defineEmits<{
  query: [filterData: Record<string, any>]
  reset: []
  'add-new': []
  'view-change': [{ viewType: string }]
  refresh: []
}>()

// 获取插槽
const slots = useSlots()

// 响应式数据
const storageView = props.useViewMemory ? useStorage(props.memoryKey, '') : ref('')
const currentView = ref('')
const windowWidth = ref<number>(window.innerWidth)

// 监听窗口大小变化
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

const shouldShowSearchArea = computed(() => {
  // 如果有搜索表单内容插槽，或者显示查询/重置按钮，则显示搜索区域
  return hasSlot('search-form-content') || props.showQueryButton || props.showResetButton
})

const shouldShowViewSwitcher = computed(() => {
  const availableSlots = getAvailableViewsWithSlots()
  return availableSlots.length > 1
})

const hasRefreshButton = computed(() => true) // 刷新按钮始终显示

const getAvailableViewsWithSlots = () => {
  return props.availableViews.filter(view => hasSlot(`${view.key}-view`))
}

// 方法
const hasSlot = (name: string): boolean => {
  return !!slots[name]
}

const getAddButtonText = (): string => {
  // 优先使用传入的文本
  if (props.addButtonText) {
    if (typeof props.addButtonText === 'function') {
      return props.addButtonText()
    }
    return props.addButtonText
  }

  // 其次使用国际化key
  if (props.addButtonI18nKey) {
    return $t(props.addButtonI18nKey)
  }

  // 最后使用默认值
  return $t('card.addButton')
}

const getDefaultViewSlot = (): string => {
  const availableSlots = getAvailableViewsWithSlots()
  return availableSlots.length > 0 ? `${availableSlots[0].key}-view` : 'list-view'
}

const initializeView = () => {
  const available = getAvailableViewsWithSlots()
  let initial = ''

  // 优先从 memory storage 中获取
  if (props.useViewMemory && storageView.value && available.some(v => v.key === storageView.value)) {
    initial = storageView.value
  }
  // 其次使用 initialView prop
  else if (props.initialView && available.some(v => v.key === props.initialView)) {
    initial = props.initialView
  }
  // 最后使用第一个可用的视图
  else if (available.length > 0) {
    initial = available[0].key
  }
  // 默认值
  else {
    initial = 'list'
  }

  currentView.value = initial

  // 如果启用了记忆功能但 storage 为空，则用初始值填充
  if (props.useViewMemory && !storageView.value) {
    storageView.value = initial
  }
}

const handleReset = () => {
  // 触发重置事件，父组件负责清空表单和刷新数据
  emit('reset')
}

const handleAddNew = () => {
  emit('add-new')
}

const handleViewChange = (viewType: string) => {
  if (currentView.value !== viewType && hasSlot(`${viewType}-view`)) {
    currentView.value = viewType
    if (props.useViewMemory) {
      storageView.value = viewType
    }
    emit('view-change', { viewType })
  }
}

const handleRefresh = () => {
  emit('refresh')
}

// 生命周期
onMounted(() => {
  initializeView()
  window.addEventListener('resize', handleResize)
})

onActivated(() => {
  initializeView()
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* 最外层容器：占满父容器的全部高度 */
.advanced-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 卡片容器：占满剩余高度 */
.full-height-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 主布局容器：使用 flex 布局，确保高度分配 */
.advanced-list-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 防止内容溢出 */

  /* 搜索区域：固定高度，不参与 flex 分配 */
  .search {
    flex-shrink: 0;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    z-index: 10; /* 确保在滚动内容之上 */

    /* 桌面端布局 */
    .search-form-content {
      flex: 1;
      min-width: 0;
      padding-bottom: 16px;
    }

    .search-button {
      flex-shrink: 0;
      display: flex;
      gap: 8px;
    }

    /* 移动端布局 */
    &:has(.search-button-mobile) {
      flex-direction: column;
      align-items: stretch;

      .search-form-content {
        padding-bottom: 8px;
      }

      .search-button-mobile {
        flex-direction: row;
        gap: 8px;
        width: 100%;

        .mobile-button {
          flex: 1;
        }
      }
    }
  }

  /* 列表内容区域：占用剩余空间，整个区域可滚动 */
  .list-content {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    position: relative;

    /* 内容头部：固定在列表内容区域顶部 */
    .list-content-header {
      position: sticky;
      top: 0;
      z-index: 5;
      padding: 6px 0;
      margin-bottom: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-shrink: 0;

      .list-content-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .list-content-header-right {
        display: flex;
        align-items: center;
      }

      &--inline {
        align-items: flex-start;
        padding: 0 0 20px;

        .list-content-header-left {
          min-height: 36px;
        }

        .list-content-header-right--inline {
          flex: 1;
          min-width: 0;
          justify-content: flex-end;
          gap: 10px;
        }

        .inline-search-form {
          flex: 1;
          min-width: 0;
          display: flex;
          justify-content: flex-end;
        }
      }

      &--stacked {
        display: block;
        padding: 0 0 20px;

        .list-content-header-title-row {
          display: flex;
          align-items: flex-start;
          min-height: 36px;
          padding-bottom: 12px;
        }

        .list-content-header-toolbar-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          width: 100%;
          min-width: 0;
        }

        .list-content-header-toolbar-search {
          flex: 1;
          display: block;
          min-width: 0;
          width: 100%;
        }

        .list-content-header-toolbar-right {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          min-height: 36px;
        }
      }
    }

    /* 内容主体：可滚动区域 */
    .list-content-body {
      height: 100%;
      margin-top: 20px;

      &--inline {
        margin-top: 0;
      }

      /* 视图包装器：确保内容正确显示 */
      .view-wrapper {
        height: calc(100% - 66px); /* 减去padding */
        overflow: auto;
      }
    }
  }
}

/* 堆叠头部使用平级选择器，避免被嵌套样式规则覆盖 */
.list-content-header--stacked {
  display: block !important;
  padding: 0 0 20px;
}

.advanced-list-layout .list-content-header--stacked {
  display: block !important;
}

.list-content-header--stacked .list-content-header-title-row {
  display: flex;
  align-items: flex-start;
  min-height: 36px;
  padding-bottom: 12px;
}

.list-content-header--stacked .list-content-header-toolbar-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
  min-width: 0;
}

.list-content-header--stacked .list-content-header-toolbar-search {
  display: block;
  flex: 1;
  width: 100%;
  min-width: 0;
}

.list-content-header--stacked .list-content-header-toolbar-right {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  min-height: 36px;
}

/* 底部区域：固定高度 */
.list-content-footer {
  flex-shrink: 0;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: end;
}

/* 移动端特定样式 */
@media (max-width: 768px) {
  .search {
    flex-direction: column !important;
    align-items: stretch !important;

    .search-form-content {
      padding-bottom: 8px !important;
    }

    .search-button {
      flex-direction: row !important;
      gap: 8px !important;
      width: 100% !important;

      .n-button {
        flex: 1 !important;
      }
    }
  }

  .list-content-header--inline {
    flex-wrap: wrap;

    .list-content-header-left,
    .list-content-header-right--inline {
      width: 100%;
    }

    .list-content-header-right--inline {
      flex-wrap: wrap;
    }

    .inline-search-form {
      width: 100%;
      flex-basis: 100%;
    }
  }

  .list-content-header--stacked {
    .list-content-header-toolbar-row {
      flex-wrap: wrap;
    }

    .list-content-header-toolbar-search,
    .list-content-header-toolbar-right {
      width: 100%;
    }
  }
}

/* 为了确保在 naive-ui 的 Card 组件中正确工作，需要覆盖一些默认样式 */
:deep(.full-height-card > .n-card__content) {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px; /* 根据需要调整内边距 */
}

:deep(.full-height-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 确保 n-scrollbar 正确工作 */
:deep(.n-scrollbar) {
  height: 100%;
}

:deep(.n-scrollbar > .n-scrollbar-container) {
  height: 100%;
}

:deep(.n-scrollbar > .n-scrollbar-container > .n-scrollbar-content) {
  min-height: 100%;
}
</style>
