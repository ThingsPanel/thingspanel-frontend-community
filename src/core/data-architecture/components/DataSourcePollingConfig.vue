<!--
  数据源轮询配置组件
  独立的轮询配置，支持预览模式下的数据源轮询
-->
<script setup lang="ts">
/**
 * DataSourcePollingConfig - 数据源轮询配置组件
 * 提供数据源级别的轮询控制，仅在预览模式下生效
 */

import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import { useThemeStore } from '@/store/modules/theme'

// 导入轮询相关模块
import { useGlobalPollingManager } from '@/components/visual-editor/core/GlobalPollingManager'
import { editorDataSourceManager } from '@/components/visual-editor/core/EditorDataSourceManager'

// Props接口
interface Props {
  /** 数据源唯一标识 */
  dataSourceKey: string
  /** 数据源名称 */
  dataSourceName?: string
  /** 组件ID */
  componentId: string
  /** 是否为预览模式 */
  previewMode?: boolean
  /** 全局轮询开关 - 用于性能控制 */
  globalPollingEnabled?: boolean
  /** 初始轮询配置 */
  initialConfig?: PollingConfig | null
}

// 轮询配置接口
interface PollingConfig {
  /** 是否启用轮询 */
  enabled: boolean
  /** 轮询间隔（毫秒） */
  interval: number
  /** 是否立即执行首次轮询 */
  immediate: boolean
}

// Emits接口
interface Emits {
  (e: 'configChange', config: PollingConfig): void
  (e: 'pollingStatusChange', status: { isRunning: boolean; taskId?: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  dataSourceName: '数据源',
  previewMode: false,
  globalPollingEnabled: true,
  initialConfig: null
})

const emit = defineEmits<Emits>()
const { t } = useI18n()
const message = useMessage()
const themeStore = useThemeStore()

/**
 * 本地轮询配置状态
 */
const pollingConfig = reactive<PollingConfig>({
  enabled: props.initialConfig?.enabled || false,
  interval: props.initialConfig?.interval || 30000,
  immediate: props.initialConfig?.immediate || true
})

/**
 * 轮询状态管理
 */
const pollingState = reactive({
  isRunning: false,
  taskId: '' as string | undefined,
  lastExecutionTime: null as number | null,
  executionCount: 0,
  errorCount: 0
})

/**
 * 间隔选项
 */
const intervalOptions = [
  { label: '5秒', value: 5000 },
  { label: '10秒', value: 10000 },
  { label: '30秒', value: 30000 },
  { label: '1分钟', value: 60000 },
  { label: '5分钟', value: 300000 },
  { label: '10分钟', value: 600000 }
]

/**
 * 轮询管理器实例
 */
const pollingManager = useGlobalPollingManager()
const dataSourceManager = editorDataSourceManager

/**
 * 是否可以配置轮询（编辑和预览模式都可以）
 */
const canConfigurePolling = computed(() => {
  return true // 编辑和预览模式都可以配置
})

/**
 * 是否可以执行轮询（需要预览模式且全局开关启用）
 */
const canExecutePolling = computed(() => {
  return props.previewMode && props.globalPollingEnabled
})

/**
 * 轮询状态显示文本
 */
const statusText = computed(() => {
  if (pollingConfig.enabled && !props.globalPollingEnabled) {
    return '已配置（全局轮询已暂停）'
  }

  if (!props.previewMode && pollingConfig.enabled) {
    return '已配置（预览模式执行）'
  }

  if (pollingState.isRunning) {
    return `运行中 (${pollingState.executionCount}次)`
  }

  if (pollingConfig.enabled) {
    return '已配置，未运行'
  }

  return '未配置'
})

/**
 * 状态显示类型
 */
const statusType = computed(() => {
  if (pollingState.isRunning) {
    return 'success'
  }

  if (pollingConfig.enabled) {
    return props.previewMode ? 'warning' : 'info'
  }

  return 'default'
})

/**
 * 启动轮询任务
 */
const startPolling = async () => {
  console.log(`🚀 [DataSourcePollingConfig] 尝试启动轮询:`, {
    dataSourceKey: props.dataSourceKey,
    canExecute: canExecutePolling.value,
    enabled: pollingConfig.enabled,
    previewMode: props.previewMode,
    globalPollingEnabled: props.globalPollingEnabled
  })
  
  if (!canExecutePolling.value || !pollingConfig.enabled) {
    console.warn(`⚠️ [DataSourcePollingConfig] 不能启动轮询: canExecute=${canExecutePolling.value}, enabled=${pollingConfig.enabled}`)
    return
  }

  try {
    // 生成唯一的任务ID
    const taskId = `datasource_${props.componentId}_${props.dataSourceKey}_${Date.now()}`

    // 定义轮询执行函数
    const pollingTask = async () => {
      try {
        console.log(`🔄 [DataSourcePollingConfig] 执行轮询任务:`, {
          componentId: props.componentId,
          dataSourceKey: props.dataSourceKey,
          executionCount: pollingState.executionCount + 1
        })
        
        // 触发组件数据源执行（EditorDataSourceManager 是以组件为单位执行的）
        console.log(`📡 [DataSourcePollingConfig] 调用 EditorDataSourceManager.startComponentDataSource: ${props.componentId}`)
        const success = await dataSourceManager.startComponentDataSource(props.componentId)

        if (success) {
          // 更新统计
          pollingState.lastExecutionTime = Date.now()
          pollingState.executionCount++

          console.log(`[轮询] 组件 ${props.componentId} 数据源执行成功, 第${pollingState.executionCount}次`)
        } else {
          pollingState.errorCount++
          console.warn(`[轮询] 组件 ${props.componentId} 数据源执行失败，返回 false`)
        }
      } catch (error) {
        pollingState.errorCount++
        console.error(`[轮询] 组件 ${props.componentId} 数据源执行失败:`, error)
        message.error(`数据源轮询执行失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }

    // 添加轮询任务到全局管理器
    console.log(`📋 [DataSourcePollingConfig] 添加轮询任务:`, {
      componentId: props.componentId,
      dataSourceKey: props.dataSourceKey,
      interval: pollingConfig.interval,
      autoStart: pollingConfig.immediate
    })
    
    const actualTaskId = pollingManager.addTask({
      componentId: props.componentId,
      componentName: props.dataSourceName || props.dataSourceKey,
      interval: pollingConfig.interval,
      callback: pollingTask,
      autoStart: pollingConfig.immediate
    })
    
    console.log(`✅ [DataSourcePollingConfig] 轮询任务已添加, taskId: ${actualTaskId}`)

    // 如果不是立即执行，则手动启动任务
    if (!pollingConfig.immediate) {
      pollingManager.startTask(actualTaskId)
    }

    // 更新状态
    pollingState.isRunning = true
    pollingState.taskId = actualTaskId

    // 发射状态变化事件
    emit('pollingStatusChange', { isRunning: true, taskId: actualTaskId })

    message.success(`数据源轮询已启动，间隔 ${pollingConfig.interval / 1000} 秒`)
  } catch (error) {
    console.error('[轮询] 启动失败:', error)
    message.error(`启动轮询失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 停止轮询任务
 */
const stopPolling = () => {
  if (pollingState.taskId) {
    // 停止并移除任务
    pollingManager.stopTask(pollingState.taskId)
    pollingManager.removeTask(pollingState.taskId)

    // 重置状态
    pollingState.isRunning = false
    pollingState.taskId = undefined

    // 发射状态变化事件
    emit('pollingStatusChange', { isRunning: false })

    message.success('轮询已停止')
  }
}

/**
 * 切换轮询状态
 */
const togglePolling = () => {
  if (!canExecutePolling.value) {
    message.warning('轮询执行仅在预览模式下生效')
    return
  }

  if (pollingState.isRunning) {
    stopPolling()
  } else if (pollingConfig.enabled) {
    startPolling()
  }
}

/**
 * 处理配置变化
 */
const handleConfigChange = () => {
  // 如果轮询正在运行，需要重新启动以应用新配置
  if (pollingState.isRunning) {
    stopPolling()
    if (pollingConfig.enabled) {
      // 延迟启动以确保停止完成
      setTimeout(() => {
        startPolling()
      }, 100)
    }
  }

  // 发射配置变化事件
  emit('configChange', { ...pollingConfig })
}

/**
 * 监听配置变化
 */
watch(() => pollingConfig.enabled, (newVal, oldVal) => {
  console.log(`🔄 [DataSourcePollingConfig] enabled变化: ${oldVal} -> ${newVal} (${props.dataSourceKey})`)
  handleConfigChange()
})
watch(() => pollingConfig.interval, (newVal, oldVal) => {
  console.log(`🔄 [DataSourcePollingConfig] interval变化: ${oldVal} -> ${newVal} (${props.dataSourceKey})`)
  handleConfigChange()
})
watch(() => pollingConfig.immediate, (newVal, oldVal) => {
  console.log(`🔄 [DataSourcePollingConfig] immediate变化: ${oldVal} -> ${newVal} (${props.dataSourceKey})`)
  handleConfigChange()
})

/**
 * 监听 Props 变化 - 调试用
 */
watch(
  () => props.previewMode,
  (newVal, oldVal) => {
    console.log(`🔍 [DataSourcePollingConfig] previewMode prop变化: ${oldVal} -> ${newVal} (${props.dataSourceKey})`)
  },
  { immediate: true }
)
watch(
  () => props.globalPollingEnabled,
  (newVal, oldVal) => {
    console.log(`🔍 [DataSourcePollingConfig] globalPollingEnabled prop变化: ${oldVal} -> ${newVal} (${props.dataSourceKey})`)
  },
  { immediate: true }
)

/**
 * 监听初始配置变化（用于恢复已保存的配置）
 */
watch(
  () => props.initialConfig,
  (newConfig) => {
    if (newConfig) {
      console.log('🔄 [DataSourcePollingConfig] 恢复初始配置:', newConfig)
      pollingConfig.enabled = newConfig.enabled || false
      pollingConfig.interval = newConfig.interval || 30000
      pollingConfig.immediate = newConfig.immediate || true
    }
  },
  { deep: true, immediate: true }
)

/**
 * 监听预览模式变化
 */
watch(
  () => props.previewMode,
  (newPreviewMode, oldPreviewMode) => {
    console.log(`🔄 [DataSourcePollingConfig] 预览模式变化:`, {
      dataSourceKey: props.dataSourceKey,
      newPreviewMode,
      oldPreviewMode,
      pollingEnabled: pollingConfig.enabled,
      isRunning: pollingState.isRunning,
      globalPollingEnabled: props.globalPollingEnabled
    })
    
    if (!newPreviewMode && pollingState.isRunning) {
      console.log(`🚫 [DataSourcePollingConfig] 退出预览模式，停止轮询: ${props.dataSourceKey}`)
      stopPolling()
    } else if (newPreviewMode && !oldPreviewMode && pollingConfig.enabled && !pollingState.isRunning && props.globalPollingEnabled) {
      console.log(`▶️ [DataSourcePollingConfig] 进入预览模式，启动轮询: ${props.dataSourceKey}`)
      startPolling()
    } else {
      console.log(`⏸️ [DataSourcePollingConfig] 不满足启动条件:`, {
        newPreviewMode,
        oldPreviewMode,
        enabled: pollingConfig.enabled,
        notRunning: !pollingState.isRunning,
        globalEnabled: props.globalPollingEnabled
      })
    }
  }
)

/**
 * 监听全局轮询开关变化
 */
watch(
  () => props.globalPollingEnabled,
  (newGlobalEnabled, oldGlobalEnabled) => {
    if (!newGlobalEnabled && pollingState.isRunning) {
      // 全局轮询关闭时停止轮询
      stopPolling()
    } else if (newGlobalEnabled && !oldGlobalEnabled && props.previewMode && pollingConfig.enabled && !pollingState.isRunning) {
      // 全局轮询开启且条件满足时自动启动
      startPolling()
    }
  }
)

/**
 * 组件挂载时初始化调试
 */
onMounted(() => {
  console.log(`🚀 [DataSourcePollingConfig] 组件已挂载:`, {
    dataSourceKey: props.dataSourceKey,
    componentId: props.componentId,
    previewMode: props.previewMode,
    globalPollingEnabled: props.globalPollingEnabled,
    pollingEnabled: pollingConfig.enabled,
    interval: pollingConfig.interval,
    canExecute: canExecutePolling.value
  })
})

/**
 * 组件卸载时清理
 */
onUnmounted(() => {
  console.log(`📋 [DataSourcePollingConfig] 组件即将卸载: ${props.dataSourceKey}`)
  if (pollingState.isRunning) {
    stopPolling()
  }
})

/**
 * 获取格式化的最后执行时间
 */
const formatLastExecutionTime = computed(() => {
  if (!pollingState.lastExecutionTime) {
    return '从未执行'
  }

  const date = new Date(pollingState.lastExecutionTime)
  return date.toLocaleTimeString()
})
</script>

<template>
  <div class="polling-config">
    <!-- 轮询配置标题 -->
    <div class="config-header">
      <n-space align="center" justify="space-between">
        <n-text strong>数据源轮询配置</n-text>
        <n-tag :type="statusType" size="small">
          {{ statusText }}
        </n-tag>
      </n-space>
    </div>

    <!-- 轮询配置表单 -->
    <div class="config-form">
      <n-form size="small" :show-feedback="false">
        <!-- 启用轮询开关 -->
        <n-form-item>
          <template #label>
            <n-space align="center" size="small">
              <span>启用轮询</span>
              <n-tooltip v-if="!props.previewMode">
                <template #trigger>
                  <n-icon size="14" color="#1890ff">
                    <svg viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                      />
                    </svg>
                  </n-icon>
                </template>
                轮询配置在预览模式下生效执行
              </n-tooltip>
              <n-tooltip v-if="props.previewMode && !props.globalPollingEnabled">
                <template #trigger>
                  <n-icon size="14" color="#faad14">
                    <svg viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                      />
                    </svg>
                  </n-icon>
                </template>
                全局轮询已暂停，需要开启全局轮询开关
              </n-tooltip>
            </n-space>
          </template>
          <n-switch v-model:value="pollingConfig.enabled" />
        </n-form-item>

        <!-- 轮询间隔配置 -->
        <n-form-item v-if="pollingConfig.enabled" label="轮询间隔">
          <n-select
            v-model:value="pollingConfig.interval"
            :options="intervalOptions"
            size="small"
          />
        </n-form-item>

        <!-- 立即执行选项 -->
        <n-form-item v-if="pollingConfig.enabled">
          <template #label>
            <n-space align="center" size="small">
              <span>立即执行</span>
              <n-tooltip>
                <template #trigger>
                  <n-icon size="14" color="#1890ff">
                    <svg viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                      />
                    </svg>
                  </n-icon>
                </template>
                启动轮询时是否立即执行一次，否则等待第一个间隔
              </n-tooltip>
            </n-space>
          </template>
          <n-switch v-model:value="pollingConfig.immediate" />
        </n-form-item>
      </n-form>
    </div>

    <!-- 轮询控制按钮 -->
    <div v-if="canExecutePolling && pollingConfig.enabled" class="config-actions">
      <n-space>
        <n-button
          size="small"
          :type="pollingState.isRunning ? 'error' : 'primary'"
          :loading="false"
          @click="togglePolling"
        >
          <template #icon>
            <n-icon>
              <svg v-if="pollingState.isRunning" viewBox="0 0 24 24">
                <path fill="currentColor" d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
              <svg v-else viewBox="0 0 24 24">
                <path fill="currentColor" d="m7 4l10 6l-10 6V4z" />
              </svg>
            </n-icon>
          </template>
          {{ pollingState.isRunning ? '停止轮询' : '开始轮询' }}
        </n-button>
      </n-space>
    </div>

    <!-- 轮询统计信息 -->
    <div v-if="pollingState.isRunning || pollingState.executionCount > 0" class="polling-stats">
      <n-descriptions size="small" :column="2">
        <n-descriptions-item label="执行次数">
          {{ pollingState.executionCount }}
        </n-descriptions-item>
        <n-descriptions-item label="错误次数">
          <n-text :type="pollingState.errorCount > 0 ? 'error' : 'default'">
            {{ pollingState.errorCount }}
          </n-text>
        </n-descriptions-item>
        <n-descriptions-item label="最后执行">
          {{ formatLastExecutionTime }}
        </n-descriptions-item>
        <n-descriptions-item label="轮询间隔">{{ pollingConfig.interval / 1000 }}秒</n-descriptions-item>
      </n-descriptions>
    </div>
  </div>
</template>

<style scoped>
.polling-config {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 12px;
  background: var(--card-color);
  margin-top: 8px;
}

.config-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.config-form {
  margin-bottom: 12px;
}

.config-actions {
  margin-bottom: 12px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-color);
}

.polling-stats {
  padding-top: 8px;
  border-top: 1px dashed var(--border-color);
  background: var(--body-color);
  border-radius: 4px;
  padding: 8px;
  font-size: 12px;
}

/* 响应主题变化 */
[data-theme='dark'] .polling-config {
  background: var(--card-color-dark);
  border-color: var(--border-color-dark);
}

[data-theme='dark'] .config-header {
  border-color: var(--border-color-dark);
}

[data-theme='dark'] .polling-stats {
  background: var(--body-color-dark);
}
</style>
