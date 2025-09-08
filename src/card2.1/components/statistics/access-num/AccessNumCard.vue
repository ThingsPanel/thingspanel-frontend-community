<template>
  <div class="access-num-card">
    <!-- 渐变背景容器 -->
    <div class="gradient-container" :style="{ backgroundImage: gradientStyle }">
      <!-- 标题区域 -->
      <div class="header">
        <h3 class="title">{{ displayTitle }}</h3>
      </div>

      <!-- 内容区域 -->
      <div class="content">
        <div class="icon-and-count">
          <!-- 设备图标 -->
          <div v-if="showIcon" class="icon-container">
            <n-icon size="32" color="white">
              <svg viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                />
              </svg>
            </n-icon>
          </div>

          <!-- 数量显示 -->
          <div class="count-container">
            <div class="count-number">
              {{ formattedCount }}
            </div>
            <div class="count-unit">{{ $t('card.deviceUnit') }}</div>
          </div>
        </div>

        <!-- 刷新状态指示 -->
        <div v-if="isRefreshing" class="refresh-indicator">
          <n-spin size="small" />
          <span class="refresh-text">{{ $t('common.refreshing') }}</span>
        </div>

        <!-- 最后更新时间 -->
        <div v-if="lastUpdateTime" class="last-update">
          {{ $t('common.lastUpdate') }}: {{ formatTime(lastUpdateTime) }}
        </div>
      </div>
    </div>

    <!-- 调试信息面板 -->
    <div v-if="showDebug" class="debug-panel">
      <n-collapse size="small">
        <n-collapse-item title="调试信息" name="debug">
          <n-code :code="debugInfo" language="json" />
        </n-collapse-item>
      </n-collapse>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 设备总数统计卡片组件 (Card2.1)
 * 迁移自 builtin-card/access，实现自包含的设备统计功能
 * - 移除外部数据源依赖，组件内部获取数据
 * - 支持自动刷新和错误处理
 * - 完全集成主题系统和国际化
 */

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { NIcon, NSpin, NCollapse, NCollapseItem, NCode } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/store/modules/auth'
import { createLogger } from '@/utils/logger'
import { sumData, totalNumber } from '@/service/api'

// 组件属性接口
interface Props {
  rawDataSources?: any // Card2.1 标准数据绑定接口
  title?: string // 自定义标题
  showIcon?: boolean // 是否显示图标
  gradientColors?: string[] // 渐变颜色配置
  refreshInterval?: number // 刷新间隔(毫秒)
  showDebug?: boolean // 是否显示调试信息
}

const props = withDefaults(defineProps<Props>(), {
  rawDataSources: null,
  title: '',
  showIcon: true,
  gradientColors: () => ['#ec4786', '#b955a4'],
  refreshInterval: 30000,
  showDebug: false
})

// 国际化和认证
const { t } = useI18n()
const authStore = useAuthStore()
const logger = createLogger('AccessNumCard')

// 响应式数据
const deviceTotal = ref<number>(0)
const isRefreshing = ref<boolean>(false)
const lastUpdateTime = ref<Date | null>(null)
const error = ref<string | null>(null)
const refreshTimer = ref<number | null>(null)

// 计算属性
const displayTitle = computed(() => {
  return props.title || t('card.deviceTotal')
})

const gradientStyle = computed(() => {
  const [start, end] = props.gradientColors
  return `linear-gradient(to bottom right, ${start}, ${end})`
})

const formattedCount = computed(() => {
  if (deviceTotal.value >= 10000) {
    return `${(deviceTotal.value / 10000).toFixed(1)}万`
  } else if (deviceTotal.value >= 1000) {
    return `${(deviceTotal.value / 1000).toFixed(1)}k`
  }
  return deviceTotal.value.toString()
})

const debugInfo = computed(() => {
  return JSON.stringify(
    {
      deviceTotal: deviceTotal.value,
      isRefreshing: isRefreshing.value,
      lastUpdateTime: lastUpdateTime.value,
      error: error.value,
      userAuthority: authStore.userInfo?.authority,
      refreshInterval: props.refreshInterval,
      gradientColors: props.gradientColors,
      rawDataSources: props.rawDataSources
    },
    null,
    2
  )
})

// 格式化时间显示
const formatTime = (date: Date): string => {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date)
}

/**
 * 获取设备总数数据
 * 根据用户权限调用不同的API接口
 */
const fetchDeviceData = async (): Promise<void> => {
  try {
    isRefreshing.value = true
    error.value = null

    logger.info('开始获取设备统计数据', {
      userAuthority: authStore.userInfo?.authority
    })

    // 根据用户权限选择API
    const response = authStore.userInfo?.authority === 'TENANT_ADMIN' ? await sumData() : await totalNumber()

    if (response?.data && typeof response.data.device_total === 'number') {
      const newTotal = response.data.device_total
      deviceTotal.value = newTotal
      lastUpdateTime.value = new Date()

      logger.info('设备数据获取成功', {
        deviceTotal: newTotal,
        updateTime: lastUpdateTime.value
      })
    } else {
      throw new Error('API返回数据格式错误：缺少 device_total 字段')
    }
  } catch (err: any) {
    const errorMessage = err.message || '获取设备数据失败'
    error.value = errorMessage
    logger.error('获取设备数据出错', err)

    // 如果是首次加载失败，设置默认值
    if (deviceTotal.value === 0) {
      deviceTotal.value = 0
    }
  } finally {
    isRefreshing.value = false
  }
}

/**
 * 启动自动刷新定时器
 */
const startAutoRefresh = (): void => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
  }

  if (props.refreshInterval > 0) {
    refreshTimer.value = window.setInterval(() => {
      fetchDeviceData()
    }, props.refreshInterval)

    logger.info('启动自动刷新', {
      interval: props.refreshInterval
    })
  }
}

/**
 * 停止自动刷新定时器
 */
const stopAutoRefresh = (): void => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value)
    refreshTimer.value = null
    logger.info('停止自动刷新')
  }
}

// 监听刷新间隔变化
watch(
  () => props.refreshInterval,
  () => {
    startAutoRefresh()
  },
  { immediate: false }
)

// 生命周期钩子
onMounted(async () => {
  logger.info('AccessNumCard 组件挂载')

  // 初始数据加载
  await fetchDeviceData()

  // 启动自动刷新
  startAutoRefresh()
})

onUnmounted(() => {
  logger.info('AccessNumCard 组件卸载')
  stopAutoRefresh()
})

// 监听 rawDataSources 变化（用于调试）
watch(
  () => props.rawDataSources,
  newRawDataSources => {
    logger.debug('接收到 rawDataSources 更新', {
      rawDataSources: newRawDataSources
    })
  },
  { deep: true }
)
</script>

<style scoped>
.access-num-card {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  overflow: hidden;
}

.gradient-container {
  flex: 1;
  padding: 16px;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 150px;
  position: relative;
}

.header {
  margin-bottom: 12px;
}

.title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.icon-and-count {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.icon-container {
  display: flex;
  align-items: center;
  opacity: 0.9;
}

.count-container {
  text-align: right;
  flex: 1;
  margin-left: 16px;
}

.count-number {
  font-size: 32px;
  font-weight: bold;
  line-height: 1;
  margin-bottom: 4px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.count-unit {
  font-size: 12px;
  opacity: 0.9;
  font-weight: 500;
}

.refresh-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  opacity: 0.8;
  margin-top: 8px;
}

.refresh-text {
  font-size: 11px;
}

.last-update {
  font-size: 11px;
  opacity: 0.7;
  margin-top: 4px;
  text-align: right;
}

.debug-panel {
  margin-top: 8px;
  padding: 8px;
  background: var(--card-color);
  border-top: 1px solid var(--border-color);
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .gradient-container {
    padding: 12px;
  }

  .count-number {
    font-size: 28px;
  }

  .title {
    font-size: 14px;
  }

  .icon-and-count {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .count-container {
    text-align: center;
    margin-left: 0;
  }
}

/* 小尺寸适配 */
@container (max-width: 250px) {
  .gradient-container {
    padding: 10px;
  }

  .count-number {
    font-size: 24px;
  }

  .title {
    font-size: 13px;
  }
}

/* 错误状态样式 */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--error-color);
  font-size: 12px;
  text-align: center;
  padding: 16px;
}

/* 主题适配 */
[data-theme='dark'] .debug-panel {
  background: var(--card-color-dark, #333);
  border-color: var(--border-color-dark, #555);
}
</style>
