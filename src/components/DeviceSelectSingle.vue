<script setup lang="ts">
/**
 * 设备单选选择器组件
 * 支持无限滚动和搜索功能
 */

import { computed, ref, watch } from 'vue'
import { NEmpty, NFlex, NInfiniteScroll, NPopover, NSelect, NSpin } from 'naive-ui'
import { useI18n } from 'vue-i18n'

// --- 类型定义 ---
interface DeviceOption {
  device_id: string
  device_name: string
  device_type?: string
  [key: string]: any
}

// --- Props (Type-based) ---
interface Props {
  modelValue: string | null
  options: DeviceOption[]
  loading?: boolean
  hasMore?: boolean
  placeholder?: string
  disabled?: boolean
  clearable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  loading: false,
  hasMore: true,
  placeholder: '请选择设备',
  disabled: false,
  clearable: false
})

// --- Emits (Type-based) ---
interface Emits {
  (e: 'update:modelValue', value: string | null): void
  (e: 'loadMore'): void
  (e: 'initialLoad'): void
  (e: 'search', keyword: string): void
}

const emit = defineEmits<Emits>()

// --- 组合式函数 ---
const { t } = useI18n()

// --- 内部状态 ---
/** 控制 Popover 是否显示 */
const showPopover = ref(false)
/** 搜索关键词 */
const searchKeyword = ref('')

// --- 计算属性 ---
/** 选中的设备选项 */
const selectedOption = computed(() => {
  if (!props.modelValue) return null
  return props.options.find(opt => opt.device_id === props.modelValue) || null
})

/** 显示标签 */
const displayLabel = computed(() => {
  if (!selectedOption.value) return ''
  return selectedOption.value.device_name
})

/** 根据搜索关键词过滤后的选项列表 */
const filteredOptions = computed(() => {
  if (!searchKeyword.value.trim()) {
    return props.options
  }
  const keyword = searchKeyword.value.toLowerCase().trim()
  return props.options.filter(
    option => option.device_name.toLowerCase().includes(keyword) || option.device_id.toLowerCase().includes(keyword)
  )
})

// --- 方法 ---
/** 处理无限滚动加载事件 */
const handleLoadMore = () => {
  if (!props.loading && props.hasMore) {
    emit('loadMore')
  }
}

/**
 * 处理选项点击事件
 *
 * @param deviceId 被点击选项的设备 ID
 */
const handleOptionClick = (deviceId: string) => {
  if (props.modelValue === deviceId) {
    // 如果点击的是已选中的选项，则取消选中
    emit('update:modelValue', null)
  } else {
    // 选中新选项
    emit('update:modelValue', deviceId)
  }
  // 选中后关闭弹窗
  showPopover.value = false
}

/**
 * 当 Popover 显示状态改变时触发
 *
 * @param show 是否显示
 */
const handlePopoverUpdateShow = (show: boolean) => {
  showPopover.value = show
  if (show) {
    // 重置搜索关键词
    searchKeyword.value = ''
    // 当首次展开且没有选项时，触发初始加载
    if (props.options.length === 0) {
      emit('initialLoad')
    }
  }
}

/**
 * 处理搜索事件
 *
 * @param searchValue 搜索关键词
 */
const handleSearch = (searchValue: string) => {
  searchKeyword.value = searchValue
  emit('search', searchValue)
}

/**
 * 检查某个选项是否被选中
 *
 * @param deviceId 设备 ID
 */
const isSelected = (deviceId: string): boolean => {
  return props.modelValue === deviceId
}

/**
 * 清空选择
 */
const handleClear = () => {
  emit('update:modelValue', null)
}
</script>

<template>
  <NPopover
    trigger="click"
    placement="bottom-start"
    class="device-select-popover"
    width="trigger"
    :show="showPopover"
    :disabled="props.disabled"
    @update:show="handlePopoverUpdateShow"
  >
    <!-- 触发器 -->
    <template #trigger>
      <div class="select-trigger-wrapper" :class="{ 'is-disabled': props.disabled }">
        <NSelect
          :value="displayLabel"
          :options="[]"
          :placeholder="props.placeholder"
          :disabled="props.disabled"
          :show-arrow="true"
          :show="false"
          filterable
          :clearable="props.clearable"
          :multiple="false"
          class="select-input"
          @search="handleSearch"
          @clear="handleClear"
        >
          <template #value>
            <span v-if="displayLabel" class="device-display-name">{{ displayLabel }}</span>
            <span v-else class="placeholder-text">{{ props.placeholder }}</span>
          </template>
        </NSelect>
      </div>
    </template>

    <!-- Popover 内容 -->
    <div class="device-select-popover-content">
      <NInfiniteScroll class="options-scroll-container" :distance="10" @load="handleLoadMore">
        <div v-if="filteredOptions && filteredOptions.length > 0" class="options-list">
          <div
            v-for="option in filteredOptions"
            :key="option.device_id"
            class="device-option-item"
            :class="{ 'is-selected': isSelected(option.device_id) }"
            @click="handleOptionClick(option.device_id)"
          >
            <span class="option-label">{{ option.device_name }}</span>
            <span v-if="option.device_type" class="option-type">{{ option.device_type }}</span>
          </div>
        </div>
        <NEmpty
          v-else-if="!props.loading"
          :description="searchKeyword ? '未找到匹配的设备' : t('common.noData') || '暂无数据'"
          class="empty-placeholder"
        />

        <!-- 加载中提示 -->
        <NFlex v-if="props.loading" justify="center" class="loading-indicator">
          <NSpin size="small" />
          <span class="loading-text">{{ t('card.loading') || '加载中...' }}</span>
        </NFlex>

        <!-- 没有更多提示 -->
        <NFlex
          v-if="!props.loading && !props.hasMore && filteredOptions && filteredOptions.length > 0"
          justify="center"
          class="no-more-indicator"
        >
          {{ t('common.noMoreData') || '没有更多了' }}
        </NFlex>
      </NInfiniteScroll>
    </div>
  </NPopover>
</template>

<style scoped lang="scss">
.device-select-popover {
  padding: 0 !important;
}

.select-trigger-wrapper {
  position: relative;
  width: 100%;
}

.select-input {
  cursor: pointer;
  width: 100%;
}

.device-select-popover-content {
  max-height: 300px;
  overflow-y: auto;
}

.options-scroll-container {
  // NInfiniteScroll 内部样式
}

.options-list {
  // 列表容器样式
}

.device-option-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: background-color 0.3s;

  &:hover {
    background-color: var(--n-option-color-pending, #f0f0f0);
  }

  &.is-selected {
    background-color: var(--n-option-color-active, #e6f7ff);
    font-weight: 500;
  }
}

.option-label {
  flex: 1;
  font-size: 14px;
  color: var(--text-color);
}

.option-type {
  font-size: 12px;
  color: var(--text-color-3);
  background-color: var(--n-tag-color, #f5f5f5);
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: 8px;
}

.empty-placeholder {
  padding: 20px 0;
}

.loading-indicator {
  padding: 10px 0;
}

.loading-text {
  margin-left: 8px;
  font-size: 12px;
  color: var(--text-color-3);
}

.no-more-indicator {
  padding: 10px 0;
  color: var(--text-color-3);
  font-size: 12px;
}

.device-display-name {
  font-size: 14px;
  color: var(--text-color);
}

.placeholder-text {
  font-size: 14px;
  color: var(--text-color-3);
}
</style>
