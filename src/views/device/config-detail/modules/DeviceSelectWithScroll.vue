<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NCheckbox, NEmpty, NFlex, NInfiniteScroll, NPopover, NSelect, NSpin } from 'naive-ui'
import { $t } from '@/locales'

// --- 类型定义 ---
interface DeviceOption {
  device_id: string
  device_name: string
  // 可以根据需要添加其他属性
  [key: string]: any // 允许其他属性
}

// --- Props (Type-based) ---
interface Props {
  modelValue: string[] | null
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
  placeholder: () => $t('common.selectPlaceholder') || '请选择',
  disabled: false,
  clearable: false
})

// --- Emits (Type-based) ---
interface Emits {
  (e: 'update:modelValue', value: string[] | null): void
  (e: 'loadMore'): void
  (e: 'initialLoad'): void
}
const emit = defineEmits<Emits>()

// --- 内部状态 ---
/** 控制 Popover 是否显示 */
const showPopover = ref(false)
/** 内部维护的选中 ID 列表，与 modelValue 同步 */
const selectedDeviceIds = ref<string[]>([])
/** 搜索关键词 */
const searchKeyword = ref('')

// --- 计算属性 ---
/** 将选中的 ID 映射回完整的设备对象，用于 NSelect 的 render-tag */
const selectedOptions = computed(() => {
  if (!selectedDeviceIds.value || selectedDeviceIds.value.length === 0) {
    return []
  }
  // 优化：创建一个 ID 到选项的映射，避免每次都遍历 options
  const optionsMap = new Map(props.options.map(opt => [opt.device_id, opt]))
  // 注意：这里可能只包含当前 options 列表中的已选项，如果 modelValue 包含尚未加载的项，它们不会显示
  // 如果需要显示所有（包括未加载）的已选项标签，需要更复杂的逻辑，可能需要父组件传入已选对象
  return selectedDeviceIds.value.map(id => optionsMap.get(id)).filter((opt): opt is DeviceOption => Boolean(opt)) // 过滤掉未找到的选项
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
    if (process.env.NODE_ENV === 'development') {
    } // 调试日志
    emit('loadMore')
  }
}

/**
 * 处理选项点击事件
 *
 * @param deviceId 被点击选项的设备 ID
 */
const handleOptionClick = (deviceId: string) => {
  const index = selectedDeviceIds.value.indexOf(deviceId)
  if (index > -1) {
    // 如果已选中，则取消选中
    selectedDeviceIds.value.splice(index, 1)
  } else {
    // 如果未选中，则添加选中
    selectedDeviceIds.value.push(deviceId)
  }
  // 触发 v-model 更新
  emit('update:modelValue', [...selectedDeviceIds.value]) // 确保发出新数组
}

/**
 * 当 Popover 显示状态改变时触发
 *
 * @param show 是否显示
 */
const handlePopoverUpdateShow = (show: boolean) => {
  showPopover.value = show
  if (show && (!props.options || props.options.length === 0)) {
    // 当首次展开且没有选项时，触发初始加载
    if (process.env.NODE_ENV === 'development') {
    } // 调试日志
    emit('initialLoad')
  }
}

/**
 * 处理搜索事件
 *
 * @param searchValue 搜索关键词
 */
const handleSearch = (searchValue: string) => {
  // 更新搜索关键词，触发过滤
  searchKeyword.value = searchValue
}

/**
 * 检查某个选项是否被选中
 *
 * @param deviceId 设备 ID
 */
const isSelected = (deviceId: string): boolean => {
  return selectedDeviceIds.value.includes(deviceId)
}

// --- Watchers ---
/** 监听外部 modelValue 的变化，同步到内部 selectedDeviceIds */
watch(
  () => props.modelValue,
  newVal => {
    if (newVal === null) {
      selectedDeviceIds.value = []
    } else if (Array.isArray(newVal)) {
      // 避免不必要的更新，比较数组内容
      if (JSON.stringify(newVal) !== JSON.stringify(selectedDeviceIds.value)) {
        selectedDeviceIds.value = [...newVal]
      }
    }
  },
  { immediate: true, deep: true } // 立即执行，深度监听（虽然通常不需要深度监听 ID 数组）
)
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
          :value="selectedDeviceIds"
          :options="selectedOptions"
          value-field="device_id"
          label-field="device_name"
          :placeholder="props.placeholder"
          :disabled="props.disabled"
          :show-arrow="true"
          :show="false"
          filterable
          clearable
          multiple
          class="select-input"
          @update:value="value => emit('update:modelValue', value)"
          @search="handleSearch"
        />
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
            <NCheckbox :checked="isSelected(option.device_id)" class="option-checkbox" />
            <span class="option-label">{{ option.device_name }}</span>
          </div>
        </div>
        <NEmpty
          v-else-if="!props.loading"
          :description="searchKeyword ? '未找到匹配的设备' : $t('common.noData') || '暂无数据'"
          class="empty-placeholder"
        />

        <!-- 加载中提示：放在 NInfiniteScroll 内容的末尾 -->
        <NFlex v-if="props.loading" justify="center" class="loading-indicator">
          <NSpin size="small" />
          <span class="loading-text">{{ $t('card.loading') }}</span>
        </NFlex>

        <!-- 没有更多提示 -->
        <NFlex
          v-if="!props.loading && !props.hasMore && filteredOptions && filteredOptions.length > 0"
          justify="center"
          class="no-more-indicator"
        >
          {{ $t('common.noMoreData') || '没有更多了' }}
        </NFlex>
      </NInfiniteScroll>
    </div>
  </NPopover>
</template>

<style scoped lang="scss">
.device-select-popover {
  padding: 0 !important; // Override default popover padding
  // 移除固定的宽度限制，交给 width="trigger"
  // width: 100%;
  // max-width: 400px;
}

.select-trigger-wrapper {
  position: relative;
  width: 100%;
  // No clear icon styles needed anymore
}

.select-input {
  cursor: pointer;
  width: 100%;
}

.device-select-popover-content {
  // 恢复外部容器的高度限制和滚动
  max-height: 300px;
  overflow-y: auto;
}

.options-scroll-container {
  // 移除内部 NInfiniteScroll 的高度限制
  // max-height: 300px;
}

.options-list {
  // Optional: Styles for the list container if needed
}

.device-option-item {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: background-color 0.3s;

  &:hover {
    background-color: var(--n-option-color-pending, #f0f0f0); // Added fallback color
  }

  // &.is-selected { // Selection indicated by checkbox, avoid background change
  //   font-weight: bold;
  // }
}

.option-checkbox {
  margin-right: 8px;
}

.option-label {
  // Optional: Styles for the label text
}

.empty-placeholder {
  padding: 20px 0;
}

.loading-indicator {
  padding: 10px 0;
}

.loading-text {
  margin-left: 8px;
}

.no-more-indicator {
  padding: 10px 0;
  color: #999;
}
</style>
