<template>
  <div class="advanced-list-container">
    <n-card class="full-height-card" footer-style="padding-top: 0px; padding-bottom: 0px; margin-top: -19px">
      <div class="advanced-list-layout">
        <!-- 搜索区域 -->
        <div v-if="shouldShowSearchArea" class="search">
          <div class="search-form-content">
            <slot name="search-form-content" />
          </div>
          <div class="search-button">
            <n-button v-if="showQueryButton" type="primary" size="small" @click="handleQuery">
              {{ $t('generate.query') }}
            </n-button>
            <n-button v-if="showResetButton" type="default" size="small" @click="handleReset">
              {{ $t('generate.reset') }}
            </n-button>
          </div>
        </div>
        <n-divider style="margin-top: 10px;"/>
        <!-- 内容区域 -->
        <div class="list-content">
          <!-- 内容头部 -->
          <div class="list-content-header">
            <!-- 左侧操作区域 -->
            <div class="list-content-header-left">
              <slot name="header-left">
                <!-- 默认新建按钮 -->
                <slot name="add-button">
                  <n-button type="primary" size="small" @click="handleAddNew">
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
                      @click="handleViewChange(view.key)"
                      :title="view.label ? $t(view.label) : view.key"
                    >
                      <n-icon size="14">
                        <component :is="view.icon" />
                      </n-icon>
                    </n-button>
                  </n-button-group>
                  <n-button size="small" @click="handleRefresh" :title="$t('buttons.refresh')">
                    <n-icon size="14"><refresh-icon /></n-icon>
                  </n-button>
                </n-space>
              </slot>
            </div>
          </div>

          <!-- 内容主体 -->
          <div class="list-content-body">
            <n-scrollbar class="content-scrollbar">
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
            </n-scrollbar>
          </div>
        </div>
      </div>

      <!-- 底部区域 -->
      <template #footer v-if="hasSlot('footer')">
        <div class="list-content-footer">
          <slot name="footer" />
        </div>
      </template>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, useSlots, onMounted } from 'vue';
import {
  NCard,
  NButton,
  NButtonGroup,
  NIcon,
  NSpace,
  NScrollbar
} from 'naive-ui';
import { $t } from '@/locales';
import {
  AddOutline as PlusIcon,
  RefreshOutline as RefreshIcon,
  GridOutline as CardIcon,
  ListOutline as ListIcon,
  MapOutline as MapIcon
} from '@vicons/ionicons5';

// 定义组件名称
defineOptions({
  name: 'AdvancedListLayout'
});

// Props 定义
interface ViewItem {
  key: string;
  icon: any;
  label?: string;
}

interface Props {
  addButtonText?: string | (() => string);
  addButtonI18nKey?: string;
  initialView?: string;
  availableViews?: ViewItem[];
  showQueryButton?: boolean;
  showResetButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  addButtonText: '',
  addButtonI18nKey: 'card.addButton',
  initialView: '',
  availableViews: () => [
    { key: 'card', icon: CardIcon, label: 'views.card' },
    { key: 'list', icon: ListIcon, label: 'views.list' },
    { key: 'map', icon: MapIcon, label: 'views.map' }
  ],
  showQueryButton: true,
  showResetButton: true
});

// Emits 定义
const emit = defineEmits<{
  query: [filterData: Record<string, any>];
  reset: [];
  'add-new': [];
  'view-change': [{ viewType: string }];
  refresh: [];
}>();

// 获取插槽
const slots = useSlots();

// 响应式数据
const currentView = ref<string>('');

// 计算属性
const shouldShowSearchArea = computed(() => {
  // 如果有搜索表单内容插槽，或者显示查询/重置按钮，则显示搜索区域
  return hasSlot('search-form-content') || props.showQueryButton || props.showResetButton;
});

const shouldShowViewSwitcher = computed(() => {
  const availableSlots = getAvailableViewsWithSlots();
  return availableSlots.length > 1;
});

const hasRefreshButton = computed(() => true); // 刷新按钮始终显示

const getAvailableViewsWithSlots = () => {
  return props.availableViews.filter(view => hasSlot(`${view.key}-view`));
};

// 方法
const hasSlot = (name: string): boolean => {
  return !!slots[name];
};

const getAddButtonText = (): string => {
  // 优先使用传入的文本
  if (props.addButtonText) {
    if (typeof props.addButtonText === 'function') {
      return props.addButtonText();
    }
    return props.addButtonText;
  }

  // 其次使用国际化key
  if (props.addButtonI18nKey) {
    return $t(props.addButtonI18nKey);
  }

  // 最后使用默认值
  return $t('card.addButton');
};

const getDefaultViewSlot = (): string => {
  const availableSlots = getAvailableViewsWithSlots();
  return availableSlots.length > 0 ? `${availableSlots[0].key}-view` : 'list-view';
};

const initializeView = () => {
  // 如果指定了初始视图且对应插槽存在，使用初始视图
  if (props.initialView && hasSlot(`${props.initialView}-view`)) {
    currentView.value = props.initialView;
    return;
  }

  // 否则找到第一个有对应插槽的视图
  const availableSlots = getAvailableViewsWithSlots();
  if (availableSlots.length > 0) {
    currentView.value = availableSlots[0].key;
  } else {
    currentView.value = 'list'; // 默认值
  }
};

const handleQuery = () => {
  // 通过事件携带筛选表单数据，由父组件负责收集表单数据
  const filterData = {}; // 实际使用时父组件应通过ref获取表单数据
  emit('query', filterData);
};

const handleReset = () => {
  // 触发重置事件，父组件负责清空表单和刷新数据
  emit('reset');
};

const handleAddNew = () => {
  emit('add-new');
};

const handleViewChange = (viewType: string) => {
  if (currentView.value !== viewType && hasSlot(`${viewType}-view`)) {
    currentView.value = viewType;
    emit('view-change', { viewType });
  }
};

const handleRefresh = () => {
  emit('refresh');
};

// 生命周期
onMounted(() => {
  initializeView();
});
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
    min-height: 0;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    .search-form-content {
      flex: 1;
      min-height: 0;
      padding-bottom: 16px;
    }

    .search-button {
      flex-shrink: 0;
      display: flex;
      gap: 8px;
    }
  }

  /* 列表内容区域：占用剩余空间 */
  .list-content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden; /* 确保不会超出容器 */

    /* 内容头部：固定高度 */
    .list-content-header {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;

      .list-content-header-left {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .list-content-header-right {
        display: flex;
        align-items: center;
      }
    }

    /* 内容主体：占用剩余空间，内容超出时滚动 */
    .list-content-body {
      flex: 1;
      min-height: 0;
      overflow: hidden;

      /* 滚动条容器：占满父容器高度 */
      .content-scrollbar {
        height: 100%;
      }

      /* 视图包装器：确保内容正确显示 */
      .view-wrapper {
        min-height: 100%;
        display: flex;
        flex-direction: column;
      }
    }
  }
}

/* 底部区域：固定高度 */
.list-content-footer {
  flex-shrink: 0;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: end;
}

/* 为了确保在 naive-ui 的 Card 组件中正确工作，需要覆盖一些默认样式 */
:deep(.n-card__content) {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px; /* 根据需要调整内边距 */
}

:deep(.n-card) {
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