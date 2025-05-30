<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue'
import { NCard, NEllipsis } from 'naive-ui'

interface Props {
  /** 卡片主标题 */
  title: string
  /** 卡片副标题，可选，支持两行显示 */
  subtitle?: string
  /** 状态点是否激活，undefined时不显示状态点 */
  statusActive?: boolean
  isStatus?:boolean
  /** 状态点类型，影响激活时的颜色 */
  statusType?: 'success' | 'warning' | 'error' | 'info' | 'default'
  /** 底部右侧显示的文本，可以是时间戳或其他文本 */
  footerText?: string
  /** 是否显示边框 */
  bordered?: boolean
  /** 是否支持悬停效果 */
  hoverable?: boolean
  /** 告警状态，用于右上角图标 */
  warnStatus?: string
  /** 设备ID，用于跳转 */
  deviceId?: string
  /** 设备配置ID，用于副标题跳转 */
  deviceConfigId?: string
}

const props = withDefaults(defineProps<Props>(), {
  statusType: 'default',
  bordered: true,
  hoverable: true,
  isStatus:true,
})

// 定义组件事件
const emit = defineEmits<{
  /** 点击整个卡片时触发 */
  'click-card': []
  /** 点击标题区域时触发 */
  'click-title': []
  /** 点击副标题区域时触发 */
  'click-subtitle': []
  /** 点击告警图标时触发 */
  'click-warning': []
  /** 点击右上角图标时触发 */
  'click-top-right-icon': []
}>()

// 计算状态点颜色
const statusColor = computed(() => {
  if (props.statusActive === undefined) return undefined

  // 根据状态类型和激活状态返回对应颜色
  const colorMap = {
    success: props.statusActive ? '#52c41a' : '#d9d9d9',
    warning: props.statusActive ? '#faad14' : '#d9d9d9',
    error: props.statusActive ? '#ff4d4f' : '#d9d9d9',
    info: props.statusActive ? '#1890ff' : '#d9d9d9',
    default: props.statusActive ? '#52c41a' : '#d9d9d9'
  }

  return colorMap[props.statusType]
})

// 检查是否有监听器的工具函数
const hasListener = (eventName: string) => {
  const listeners = getCurrentInstance()?.vnode.props
  return listeners && `on${eventName.charAt(0).toUpperCase() + eventName.slice(1)}` in listeners
}

// 检查是否应该处理标题点击
const shouldHandleTitleClick = computed(() => {
  return hasListener('click-title') || props.deviceId
})

// 检查是否应该处理副标题点击
const shouldHandleSubtitleClick = computed(() => {
  return hasListener('click-subtitle') || props.deviceConfigId
})

// 检查是否应该处理右上角图标点击
const shouldHandleTopRightIconClick = computed(() => {
  return hasListener('click-top-right-icon') || props.warnStatus
})

// 点击事件处理函数
const handleCardClick = () => {
  // 跳转到设备详情页
  if (props.deviceId) {
    window.location.href = `/device/details?d_id=${props.deviceId}`
  }
  emit('click-card')
}

const handleTitleClick = (e: Event) => {
  // 只有在需要处理点击时才阻止冒泡
  if (shouldHandleTitleClick.value) {
    e.stopPropagation()
    // 跳转到设备详情页
    if (props.deviceId) {
      window.location.href = `/device/details?d_id=${props.deviceId}`
    }
    emit('click-title')
  }
}

const handleSubtitleClick = (e: Event) => {
  // 只有在需要处理点击时才阻止冒泡
  if (shouldHandleSubtitleClick.value) {
    e.stopPropagation()
    // 跳转到设备配置详情页
    if (props.deviceConfigId) {
      window.location.href = `/device/config-detail?id=${props.deviceConfigId}`
    }
    emit('click-subtitle')
  }
}

const handleTopRightIconClick = (e: Event) => {
  // 只有在需要处理点击时才阻止冒泡
  if (shouldHandleTopRightIconClick.value) {
    e.stopPropagation()
    emit('click-top-right-icon')
  }
}
</script>

<template>
  <NCard
    content-style="padding: 0px;margin: 0px;"
    :bordered="bordered"
    :hoverable="hoverable"
    class="item-card"
    @click="handleCardClick"
  >
    <!-- 卡片内容容器 -->
    <div class="card-container">
      <!-- 卡片头部：包含标题、副标题和右侧指示器 -->
      <div class="card-header">
        <!-- 左侧标题区域 -->
        <div class="title-section">
          <!-- 主标题行：标题文本 + 状态点 -->
          <div class="title-row" :class="{ clickable: shouldHandleTitleClick }" @click="handleTitleClick">
            <div class="title-content">
              <!-- 主标题，支持单行省略 -->
              <NEllipsis class="card-title" :tooltip="false">
                {{ title }}
              </NEllipsis>

              <!-- 状态点，紧跟标题显示 -->

              <div v-if="isStatus" class="status-dot" :style="{ backgroundColor: statusColor }" />
            </div>
          </div>

          <!-- 副标题行：图标 + 副标题文本 -->
          <div
            v-if="subtitle || $slots['subtitle-icon']"
            class="subtitle-row"
            :class="{ clickable: shouldHandleSubtitleClick }"
            @click="handleSubtitleClick"
          >
            <!-- 副标题图标插槽，顶部对齐 -->
            <div v-if="$slots['subtitle-icon']" class="subtitle-icon-container">
              <slot name="subtitle-icon" />
            </div>
            <!-- 副标题文本，支持两行省略 -->
            <div v-if="subtitle" class="subtitle-text-container">
              <NEllipsis :line-clamp="2" class="subtitle-text" :tooltip="false">
                {{ subtitle }}
              </NEllipsis>
            </div>
          </div>
        </div>

        <!-- 右上角图标区域 - 支持插槽自定义 -->
        <div class="indicator-section">
          <div
            class="top-right-icon-container"
            :class="{ clickable: shouldHandleTopRightIconClick }"
            @click="handleTopRightIconClick"
          >
            <!-- 右上角图标插槽 -->
            <slot name="top-right-icon"></slot>
          </div>
        </div>
      </div>

      <!-- 卡片内容区域：自定义内容插槽 - 这个区域会自动填充剩余空间 -->
      <div v-if="$slots.default" class="card-content">
        <slot />
      </div>

      <!-- 卡片底部 - 固定在底部 -->
      <div v-if="footerText || $slots['footer-icon'] || $slots.footer" class="card-footer">
        <!-- 底部左侧：图标 + 自定义内容 -->
        <div class="footer-left">
          <div class="footer-icon-container">
            <!-- 如果没有提供footer-icon插槽，显示默认设备图标 -->
            <slot name="footer-icon">
              <!-- 默认设备图标 SVG -->
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#666" class="default-device-icon">
                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
              </svg>
            </slot>
          </div>
        
        </div>
        <div class="footer-right"> <slot name="footer" /> </div>
        <!-- 底部右侧：文本内容（可以是时间戳或其他文本） -->
        <div v-if="footerText" class="footer-right">
          <NEllipsis class="footer-text" :tooltip="false">
            {{ footerText }}
          </NEllipsis>
   
        </div>
      </div>
    </div>
  </NCard>
</template>

<style scoped>
.item-card {
  width: 100%;
  height: 180px;
  border-radius: 12px;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 悬停效果 - 调整为与用户提供的HTML示例一致 (无特定transform, box-shadow, border-color变化) */
.item-card:hover {
  /* transform: translateY(4px) translateX(4px); */ /* Removed for consistency */
  /* box-shadow:
    0 8px 25px rgba(0, 0, 0, 0.12),
    0 4px 10px rgba(0, 0, 0, 0.08); */ /* Removed for consistency */
  /* border-color: rgba(24, 144, 255, 0.3); */ /* Removed for consistency */
  /* 如果需要特定的悬停效果，应在此处明确定义 */
}

/* 点击时的动画 - kept subtle, can be removed if not desired */
.item-card:active {
  transform: translateY(2px) translateX(2px);
  transition: all 0.1s ease;
}

/* 卡片内容容器，使用flexbox布局 */
.card-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.title-section {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.title-row {
  margin-bottom: 12px;
  transition: transform 0.2s ease;
}

/* 只有可点击的标题才显示指针和悬停效果 */
.title-row.clickable {
  cursor: pointer;
}

.title-row.clickable:hover {
  transform: translateX(2px);
}

.title-row.clickable:hover .card-title {
  color: #1890ff;
  transition: color 0.2s ease;
}

.title-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  min-width: 0;
  transition: color 0.2s ease;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  transition: background-color 0.3s ease;
}

.subtitle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  transition: transform 0.2s ease;
}

/* 只有可点击的副标题才显示指针和悬停效果 */
.subtitle-row.clickable {
  cursor: pointer;
}

.subtitle-row.clickable:hover {
  transform: translateX(2px);
}

.subtitle-row.clickable:hover .subtitle-text {
  color: #1890ff;
  transition: color 0.2s ease;
}

.subtitle-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 14px;
  flex-shrink: 0;
}

.subtitle-text-container {
  flex: 1;
  min-width: 0;
}

.subtitle-text {
  font-size: 14px;
  color: #888;
  transition: color 0.2s ease;
}

.indicator-section {
  flex-shrink: 0;
  margin-left: 16px;
}

.top-right-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  transition:
    transform 0.2s ease,
    background-color 0.2s ease;
}

/* 只有可点击的右上角图标才显示指针和悬停效果 */
.top-right-icon-container.clickable {
  cursor: pointer;
}

.top-right-icon-container.clickable:hover {
  transform: scale(1.2);
}

.card-content {
  flex: 1;
  margin: 16px 0;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  margin-top: auto;
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.footer-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 35.5px;
  border-radius: 8px;
  flex-shrink: 0;
}

.default-device-icon {
  width: 18px;
  height: 18px;
  fill: #666;
  opacity: 0.8;
}

.footer-right {
  flex-shrink: 0;
  margin-left: 16px;
}

.footer-text {
  font-size: 14px;
  color: #888;
  max-width: 150px;
}
</style>
