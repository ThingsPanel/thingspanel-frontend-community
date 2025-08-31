<!--
  组件级别轮询配置组件
  为整个组件配置统一的轮询策略
-->
<script setup lang="ts">
/**
 * ComponentPollingConfig - 组件级别轮询配置
 * 统一管理组件的轮询配置，执行时会触发组件的所有数据源
 */

import { reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'

// 轮询配置接口
interface PollingConfig {
  /** 是否启用轮询 */
  enabled: boolean
  /** 轮询间隔（毫秒） */
  interval: number
  /** 是否立即执行首次轮询 */
  immediate: boolean
}

// Props接口
interface Props {
  /** 组件ID */
  componentId: string
  /** 组件名称 */
  componentName?: string
  /** 是否为预览模式 - 仅用于UI状态显示 */
  previewMode?: boolean
  /** 初始轮询配置 */
  initialConfig?: PollingConfig | null
}

// Emits接口
interface Emits {
  (e: 'configChange', config: PollingConfig): void
}

const props = withDefaults(defineProps<Props>(), {
  componentName: '组件',
  previewMode: false,
  initialConfig: null
})

const emit = defineEmits<Emits>()
const { t } = useI18n()
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
 * 轮询状态显示文本
 */
const statusText = computed(() => {
  if (!props.previewMode && pollingConfig.enabled) {
    return '已配置（预览模式执行）'
  }

  if (pollingConfig.enabled) {
    return '已配置'
  }

  return '未配置'
})

/**
 * 状态显示类型
 */
const statusType = computed(() => {
  if (pollingConfig.enabled) {
    return props.previewMode ? 'success' : 'info'
  }
  return 'default'
})

/**
 * 处理配置变化
 */
const handleConfigChange = () => {
  console.log(`🔄 [ComponentPollingConfig] 配置变化触发:`, { 
    componentId: props.componentId, 
    pollingConfig: { ...pollingConfig },
    enabled: pollingConfig.enabled,
    interval: pollingConfig.interval,
    immediate: pollingConfig.immediate
  })
  
  // 发射配置变化事件，由父组件处理保存
  emit('configChange', { ...pollingConfig })
  console.log(`💾 [ComponentPollingConfig] 组件轮询配置已变化并发射事件:`, { 
    componentId: props.componentId, 
    config: { ...pollingConfig }
  })
}

/**
 * 监听配置变化
 */
watch(() => pollingConfig.enabled, handleConfigChange)
watch(() => pollingConfig.interval, handleConfigChange)
watch(() => pollingConfig.immediate, handleConfigChange)

/**
 * 监听初始配置变化（用于恢复已保存的配置）
 */
watch(
  () => props.initialConfig,
  (newConfig) => {
    if (newConfig) {
      console.log('🔄 [ComponentPollingConfig] 恢复组件轮询配置:', newConfig)
      pollingConfig.enabled = newConfig.enabled || false
      pollingConfig.interval = newConfig.interval || 30000
      pollingConfig.immediate = newConfig.immediate || true
    }
  },
  { deep: true, immediate: true }
)

/**
 * 组件挂载时初始化调试
 */
onMounted(() => {
  console.log(`🚀 [ComponentPollingConfig] 组件轮询配置已挂载:`, {
    componentId: props.componentId,
    componentName: props.componentName,
    previewMode: props.previewMode,
    pollingEnabled: pollingConfig.enabled,
    interval: pollingConfig.interval
  })
})
</script>

<template>
  <div class="component-polling-config">
    <!-- 轮询配置标题 -->
    <div class="config-header">
      <n-space align="center" justify="space-between">
        <n-text strong>组件轮询配置</n-text>
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
              <span>启用组件轮询</span>
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
                轮询将在预览模式下自动执行，定时刷新组件的所有数据源
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

    <!-- 轮询说明信息 -->
    <div v-if="pollingConfig.enabled" class="polling-info">
      <n-text depth="3" size="small">
        {{ props.previewMode ? '轮询将自动执行，刷新组件的所有数据源' : '轮询仅在预览模式下执行，将刷新组件的所有数据源' }}
      </n-text>
    </div>
  </div>
</template>

<style scoped>
.component-polling-config {
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 16px;
  background: var(--card-color);
  margin-bottom: 16px;
}

.config-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-color);
}

.config-form {
  margin-bottom: 12px;
}

.polling-info {
  margin-top: 8px;
  padding: 8px;
  background: var(--body-color);
  border-radius: 4px;
  border: 1px dashed var(--border-color);
}

/* 响应主题变化 */
[data-theme='dark'] .component-polling-config {
  background: var(--card-color-dark);
  border-color: var(--border-color-dark);
}

[data-theme='dark'] .config-header {
  border-color: var(--border-color-dark);
}

[data-theme='dark'] .polling-info {
  background: var(--body-color-dark);
}
</style>