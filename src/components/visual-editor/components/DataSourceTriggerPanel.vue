<template>
  <div class="data-source-trigger-panel">
    <!-- 📊 数据源触发器控制面板 -->
    <n-card :bordered="false" size="small" class="trigger-control-card">
      <!-- 🎮 面板头部控制区 -->
      <template #header>
        <n-space justify="space-between" align="center">
          <n-space align="center" :size="8">
            <n-icon size="18" :color="themeStore.colors.primary">
              <TimerOutline />
            </n-icon>
            <n-text strong>{{ $t('dataSource.trigger.title') }}</n-text>
            <n-badge
              v-if="componentsWithDataSources.length > 0"
              :value="activeDataSourcesCount"
              type="success"
              :max="99"
            >
              <n-tag type="info" size="small" round>
                {{ componentsWithDataSources.length }} {{ $t('dataSource.trigger.components') }}
              </n-tag>
            </n-badge>
          </n-space>

          <!-- 全局控制按钮 -->
          <n-space :size="8">
            <!-- 全部启动 -->
            <n-button
              size="small"
              type="success"
              :disabled="componentsWithDataSources.length === 0 || allDataSourcesActive"
              :loading="bulkOperationLoading"
              @click="startAllDataSources"
            >
              <template #icon>
                <n-icon><PlayOutline /></n-icon>
              </template>
              {{ $t('dataSource.trigger.startAll') }}
            </n-button>

            <!-- 全部停止 -->
            <n-button
              size="small"
              type="error"
              :disabled="activeDataSourcesCount === 0"
              :loading="bulkOperationLoading"
              @click="stopAllDataSources"
            >
              <template #icon>
                <n-icon><StopOutline /></n-icon>
              </template>
              {{ $t('dataSource.trigger.stopAll') }}
            </n-button>

            <!-- 刷新状态 -->
            <n-button size="small" type="default" :loading="refreshLoading" @click="refreshComponentStatus">
              <template #icon>
                <n-icon><RefreshOutline /></n-icon>
              </template>
            </n-button>
          </n-space>
        </n-space>
      </template>

      <!-- 📋 数据源组件列表 -->
      <div class="components-list">
        <!-- 空状态提示 -->
        <n-empty
          v-if="componentsWithDataSources.length === 0"
          :description="$t('dataSource.trigger.noComponents')"
          size="small"
        >
          <template #icon>
            <n-icon size="32" :color="themeStore.colors.textColor3">
              <ServerOutline />
            </n-icon>
          </template>
          <template #extra>
            <n-text depth="3" style="font-size: 12px">
              {{ $t('dataSource.trigger.configureHint') }}
            </n-text>
          </template>
        </n-empty>

        <!-- 组件数据源控制列表 -->
        <n-space v-else vertical :size="8">
          <div v-for="component in componentsWithDataSources" :key="component.id" class="component-trigger-item">
            <n-card
              size="small"
              :bordered="true"
              class="component-card"
              :class="{
                'active-component': component.status === DataSourceStatus.RUNNING,
                'error-component': component.status === DataSourceStatus.ERROR
              }"
            >
              <!-- 组件信息区 -->
              <n-space justify="space-between" align="center">
                <n-space align="center" :size="8">
                  <!-- 状态指示器 -->
                  <n-tag :type="getStatusTagType(component.status)" size="small" round>
                    <template #icon>
                      <n-icon>
                        <component :is="getStatusIcon(component.status)" />
                      </n-icon>
                    </template>
                    {{ getStatusText(component.status) }}
                  </n-tag>

                  <!-- 组件基本信息 -->
                  <div class="component-info">
                    <n-text strong style="font-size: 13px">
                      {{ component.name || component.type }}
                    </n-text>
                    <br />
                    <n-text depth="3" style="font-size: 11px">ID: {{ component.id.slice(0, 8) }}...</n-text>
                  </div>
                </n-space>

                <!-- 控制区域 -->
                <n-space align="center" :size="8">
                  <!-- 轮询间隔设置 -->
                  <n-input-number
                    v-model:value="component.trigger.interval"
                    size="small"
                    :min="1000"
                    :max="3600000"
                    :step="1000"
                    style="width: 90px"
                    :placeholder="$t('dataSource.trigger.interval')"
                    @update:value="updatePollingInterval(component.id, $event)"
                  >
                    <template #suffix>
                      <n-text depth="3" style="font-size: 10px">ms</n-text>
                    </template>
                  </n-input-number>

                  <!-- 手动触发 -->
                  <n-button
                    size="small"
                    type="info"
                    :disabled="component.status === DataSourceStatus.RUNNING"
                    :loading="component.manualTriggerLoading"
                    @click="manualTrigger(component.id)"
                  >
                    <template #icon>
                      <n-icon><FlashOutline /></n-icon>
                    </template>
                  </n-button>

                  <!-- 启动/停止切换 -->
                  <n-button
                    size="small"
                    :type="component.status === DataSourceStatus.RUNNING ? 'error' : 'success'"
                    :loading="component.operationLoading"
                    @click="toggleDataSource(component.id)"
                  >
                    <template #icon>
                      <n-icon>
                        <component :is="component.status === DataSourceStatus.RUNNING ? StopOutline : PlayOutline" />
                      </n-icon>
                    </template>
                    {{ component.status === DataSourceStatus.RUNNING ? $t('common.stop') : $t('common.start') }}
                  </n-button>

                  <!-- 更多操作 -->
                  <n-dropdown :options="getComponentActions(component)" @select="handleComponentAction">
                    <n-button size="small" quaternary>
                      <template #icon>
                        <n-icon><EllipsisHorizontalOutline /></n-icon>
                      </template>
                    </n-button>
                  </n-dropdown>
                </n-space>
              </n-space>

              <!-- 数据源详情展开区 -->
              <n-collapse-transition :show="component.showDetails">
                <div
                  class="component-details"
                  style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color)"
                >
                  <n-space vertical :size="8">
                    <!-- 数据源配置信息 -->
                    <div class="data-source-info">
                      <n-text depth="2" style="font-size: 12px">
                        {{ $t('dataSource.trigger.lastExecution') }}:
                        <n-time v-if="component.lastExecution" :time="component.lastExecution" format="HH:mm:ss" />
                        <n-text v-else depth="3">{{ $t('common.never') }}</n-text>
                      </n-text>
                      <br />
                      <n-text depth="2" style="font-size: 12px">
                        {{ $t('dataSource.trigger.executionCount') }}: {{ component.executionCount || 0 }}
                      </n-text>
                      <br />
                      <n-text depth="2" style="font-size: 12px">
                        {{ $t('dataSource.trigger.dataSourceType') }}: {{ component.dataSourceType || 'Unknown' }}
                      </n-text>
                    </div>

                    <!-- 最近错误信息 -->
                    <div v-if="component.lastError" class="error-info">
                      <n-alert type="error" size="small">
                        <template #header>
                          {{ $t('dataSource.trigger.lastError') }}
                        </template>
                        {{ component.lastError }}
                      </n-alert>
                    </div>

                    <!-- 数据预览 -->
                    <div v-if="component.lastData" class="data-preview">
                      <n-text depth="2" style="font-size: 12px; margin-bottom: 4px">
                        {{ $t('dataSource.trigger.lastData') }}:
                      </n-text>
                      <n-code
                        :code="JSON.stringify(component.lastData, null, 2)"
                        language="json"
                        style="font-size: 10px; max-height: 100px; overflow-y: auto"
                      />
                    </div>
                  </n-space>
                </div>
              </n-collapse-transition>
            </n-card>
          </div>
        </n-space>
      </div>

      <!-- 📈 执行统计信息 -->
      <template #footer>
        <n-space justify="space-between" align="center" style="font-size: 11px">
          <n-space align="center" :size="16">
            <n-text depth="3">
              {{ $t('dataSource.trigger.stats.total') }}: {{ componentsWithDataSources.length }}
            </n-text>
            <n-text depth="3">{{ $t('dataSource.trigger.stats.active') }}: {{ activeDataSourcesCount }}</n-text>
            <n-text depth="3">{{ $t('dataSource.trigger.stats.errors') }}: {{ errorDataSourcesCount }}</n-text>
            <n-divider vertical />
            <n-text depth="3">全局轮询: {{ pollingStatistics.totalTasks }} 任务</n-text>
            <n-text depth="3">总执行: {{ pollingStatistics.totalExecutions }} 次</n-text>
          </n-space>
          <n-space align="center" :size="8">
            <n-tag :type="pollingStatistics.globalTimerActive ? 'success' : 'default'" size="small" round>
              <template #icon>
                <n-icon>
                  <component :is="pollingStatistics.globalTimerActive ? CheckmarkCircleOutline : TimeOutline" />
                </n-icon>
              </template>
              {{ pollingStatistics.globalTimerActive ? '全局定时器运行中' : '全局定时器停止' }}
            </n-tag>
            <n-text depth="3">
              {{ $t('dataSource.trigger.stats.lastUpdate') }}:
              <n-time :time="lastUpdateTime" format="HH:mm:ss" />
            </n-text>
          </n-space>
        </n-space>
      </template>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 数据源触发器控制面板
 * 提供统一的数据源触发器管理界面，支持批量操作和实时状态监控
 */

import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import {
  TimerOutline,
  PlayOutline,
  StopOutline,
  RefreshOutline,
  ServerOutline,
  FlashOutline,
  EllipsisHorizontalOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
  WarningOutline,
  TimeOutline
} from '@vicons/ionicons5'

// 导入数据源管理器和全局轮询管理器
import { editorDataSourceManager, DataSourceStatus } from '../core/EditorDataSourceManager'
import type { ComponentDataSourceConfig } from '../core/EditorDataSourceManager'
import { useGlobalPollingManager } from '../core/GlobalPollingManager'

// 国际化和主题
const { t } = useI18n()
const themeStore = useThemeStore()

// 全局轮询管理器
const globalPollingManager = useGlobalPollingManager()

// 响应式状态
const componentsWithDataSources = ref<ComponentDataSourceConfig[]>([])
const bulkOperationLoading = ref(false)
const refreshLoading = ref(false)
const lastUpdateTime = ref(Date.now())

// 轮询任务统计
const pollingStatistics = computed(() => globalPollingManager.getStatistics())

// 定时刷新器
let refreshTimer: NodeJS.Timeout | null = null

// 计算属性
const activeDataSourcesCount = computed(() => {
  return componentsWithDataSources.value.filter(c => c.status === DataSourceStatus.RUNNING).length
})

const errorDataSourcesCount = computed(() => {
  return componentsWithDataSources.value.filter(c => c.status === DataSourceStatus.ERROR).length
})

const allDataSourcesActive = computed(() => {
  return (
    componentsWithDataSources.value.length > 0 &&
    componentsWithDataSources.value.every(c => c.status === DataSourceStatus.RUNNING)
  )
})

/**
 * 获取状态标签类型
 */
const getStatusTagType = (status: DataSourceStatus): string => {
  switch (status) {
    case DataSourceStatus.RUNNING:
      return 'success'
    case DataSourceStatus.ERROR:
      return 'error'
    case DataSourceStatus.STOPPED:
      return 'default'
    default:
      return 'info'
  }
}

/**
 * 获取状态图标
 */
const getStatusIcon = (status: DataSourceStatus) => {
  switch (status) {
    case DataSourceStatus.RUNNING:
      return CheckmarkCircleOutline
    case DataSourceStatus.ERROR:
      return CloseCircleOutline
    case DataSourceStatus.STOPPED:
      return TimeOutline
    default:
      return WarningOutline
  }
}

/**
 * 获取状态文本
 */
const getStatusText = (status: DataSourceStatus): string => {
  switch (status) {
    case DataSourceStatus.RUNNING:
      return t('dataSource.status.running')
    case DataSourceStatus.ERROR:
      return t('dataSource.status.error')
    case DataSourceStatus.STOPPED:
      return t('dataSource.status.stopped')
    default:
      return t('dataSource.status.unknown')
  }
}

/**
 * 更新轮询间隔
 */
const updatePollingInterval = async (componentId: string, interval: number | null) => {
  if (!interval || interval < 1000) return

  try {
    await editorDataSourceManager.setPollingInterval(componentId, interval)
    // 实时更新本地状态
    const component = componentsWithDataSources.value.find(c => c.id === componentId)
    if (component && component.trigger) {
      component.trigger.interval = interval
    }
  } catch (error) {
    console.error('Failed to update polling interval:', error)
    window.$message?.error(t('dataSource.trigger.updateIntervalError'))
  }
}

/**
 * 手动触发数据源
 */
const manualTrigger = async (componentId: string) => {
  const component = componentsWithDataSources.value.find(c => c.id === componentId)
  if (!component) return

  component.manualTriggerLoading = true
  try {
    await editorDataSourceManager.triggerDataUpdate(componentId)
    window.$message?.success(t('dataSource.trigger.manualTriggerSuccess'))

    // 刷新组件状态
    await refreshComponentStatus()
  } catch (error) {
    console.error('Manual trigger failed:', error)
    window.$message?.error(t('dataSource.trigger.manualTriggerError'))
  } finally {
    component.manualTriggerLoading = false
  }
}

/**
 * 切换数据源启动/停止状态
 */
const toggleDataSource = async (componentId: string) => {
  const component = componentsWithDataSources.value.find(c => c.id === componentId)
  if (!component) return

  component.operationLoading = true
  try {
    if (component.status === DataSourceStatus.RUNNING) {
      await editorDataSourceManager.stopComponentDataSource(componentId)
      window.$message?.success(t('dataSource.trigger.stopSuccess'))
    } else {
      await editorDataSourceManager.startComponentDataSource(componentId)
      window.$message?.success(t('dataSource.trigger.startSuccess'))
    }

    // 刷新状态
    await refreshComponentStatus()
  } catch (error) {
    console.error('Toggle data source failed:', error)
    window.$message?.error(t('dataSource.trigger.toggleError'))
  } finally {
    component.operationLoading = false
  }
}

/**
 * 启动所有数据源
 */
const startAllDataSources = async () => {
  bulkOperationLoading.value = true
  try {
    const componentIds = componentsWithDataSources.value
      .filter(c => c.status !== DataSourceStatus.RUNNING)
      .map(c => c.id)

    await editorDataSourceManager.batchStartComponents(componentIds)
    window.$message?.success(t('dataSource.trigger.startAllSuccess'))

    await refreshComponentStatus()
  } catch (error) {
    console.error('Start all data sources failed:', error)
    window.$message?.error(t('dataSource.trigger.startAllError'))
  } finally {
    bulkOperationLoading.value = false
  }
}

/**
 * 停止所有数据源
 */
const stopAllDataSources = async () => {
  bulkOperationLoading.value = true
  try {
    const componentIds = componentsWithDataSources.value
      .filter(c => c.status === DataSourceStatus.RUNNING)
      .map(c => c.id)

    await editorDataSourceManager.batchStopComponents(componentIds)
    window.$message?.success(t('dataSource.trigger.stopAllSuccess'))

    await refreshComponentStatus()
  } catch (error) {
    console.error('Stop all data sources failed:', error)
    window.$message?.error(t('dataSource.trigger.stopAllError'))
  } finally {
    bulkOperationLoading.value = false
  }
}

/**
 * 刷新组件状态
 */
const refreshComponentStatus = async () => {
  refreshLoading.value = true
  try {
    // 获取最新的组件配置和状态
    const allConfigs = editorDataSourceManager.getAllComponentConfigs()
    const stats = editorDataSourceManager.getStatistics()

    // 更新组件列表，并补充额外的UI状态
    componentsWithDataSources.value = Array.from(allConfigs.values()).map(config => ({
      ...config,
      showDetails: false,
      manualTriggerLoading: false,
      operationLoading: false
    }))

    lastUpdateTime.value = Date.now()
  } catch (error) {
    console.error('Refresh component status failed:', error)
    window.$message?.error(t('dataSource.trigger.refreshError'))
  } finally {
    refreshLoading.value = false
  }
}

/**
 * 获取组件操作菜单
 */
const getComponentActions = (component: ComponentDataSourceConfig) => {
  return [
    {
      label: component.showDetails ? t('common.hideDetails') : t('common.showDetails'),
      key: 'toggleDetails',
      props: {
        onClick: () => {
          component.showDetails = !component.showDetails
        }
      }
    },
    {
      label: t('dataSource.trigger.viewLogs'),
      key: 'viewLogs',
      props: {
        onClick: () => {
          // TODO: 实现日志查看功能
          window.$message?.info(t('dataSource.trigger.logsNotImplemented'))
        }
      }
    },
    {
      label: t('dataSource.trigger.resetConfig'),
      key: 'resetConfig',
      props: {
        onClick: () => {
          // TODO: 实现配置重置功能
          window.$message?.info(t('dataSource.trigger.resetNotImplemented'))
        }
      }
    }
  ]
}

/**
 * 处理组件操作
 */
const handleComponentAction = (key: string, option: any) => {
  // 操作已在菜单项的 onClick 中处理
}

/**
 * 设置定时刷新
 */
const setupRefreshTimer = () => {
  // 每5秒刷新一次状态
  refreshTimer = setInterval(() => {
    refreshComponentStatus()
  }, 5000)
}

// 生命周期钩子
onMounted(async () => {
  await refreshComponentStatus()
  setupRefreshTimer()
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})
</script>

<style scoped>
.data-source-trigger-panel {
  width: 100%;
  height: 100%;
}

.trigger-control-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.components-list {
  flex: 1;
  overflow-y: auto;
  min-height: 200px;
  max-height: 500px;
}

.component-trigger-item {
  width: 100%;
}

.component-card {
  transition: all 0.2s ease;
  border: 1px solid var(--border-color);
}

.component-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.component-card.active-component {
  border-color: var(--success-color);
  background-color: rgba(82, 196, 26, 0.02);
}

.component-card.error-component {
  border-color: var(--error-color);
  background-color: rgba(255, 77, 79, 0.02);
}

.component-info {
  line-height: 1.2;
}

.component-details {
  background-color: var(--body-color);
  border-radius: var(--border-radius);
  padding: 8px;
}

.data-source-info {
  line-height: 1.4;
}

.error-info,
.data-preview {
  margin-top: 8px;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .component-card .n-space {
    flex-direction: column;
    align-items: flex-start !important;
  }

  .component-card .n-space > .n-space {
    width: 100%;
    justify-content: space-between;
  }
}

/* 主题适配 */
[data-theme='dark'] .component-card.active-component {
  background-color: rgba(82, 196, 26, 0.05);
}

[data-theme='dark'] .component-card.error-component {
  background-color: rgba(255, 77, 79, 0.05);
}

[data-theme='dark'] .component-details {
  background-color: rgba(255, 255, 255, 0.02);
}
</style>
