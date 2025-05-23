<template>
  <div>
    <n-card style="height: 100%" footer-style="padding-top: 0px; padding-bottom: 0px; margin-top: -19px">
      <div class="advanced-list-layout">
        <!-- 搜索区域 -->
        <div class="search">
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
        
        <!-- 内容区域 -->
        <div class="list-content">
          <!-- 内容头部 -->
          <div class="list-content-header">
            <n-button type="primary" size="small" @click="handleAddNew">
              <template #icon>
                <n-icon><plus-icon /></n-icon>
              </template>
              {{ getAddButtonText() }}
            </n-button>
            <div class="list-content-header-right">
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
            </div>
          </div>
          
          <!-- 内容主体 -->
          <div class="list-content-body">
            <n-scrollbar>
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
.advanced-list-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  
  .search {
    flex-shrink: 0;
    min-height: 0;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    border-bottom: 1px solid #e0e0e0;
    margin-bottom: 16px;
    
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
  
  .list-content {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    
    .list-content-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 16px;
      
      .list-content-header-right {
        display: flex;
        align-items: center;
      }
    }
    
    .list-content-body {
      flex: 1;
      min-height: 0;
      overflow: hidden;
      
      .view-wrapper {
        height: 100%;
      }
    }
  }
}

.list-content-footer {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>