<!--
  脚本执行结果展示面板
  用于显示脚本执行的详细结果、日志和性能信息
-->
<template>
  <div class="execution-result-panel">
    <!-- 执行状态头部 -->
    <div class="result-header">
      <n-space justify="space-between" align="center">
        <div class="result-status">
          <n-space align="center">
            <n-icon :color="result.success ? successColor : errorColor" size="18">
              <CheckmarkOutline v-if="result.success" />
              <CloseOutline v-else />
            </n-icon>

            <n-text :type="result.success ? 'success' : 'error'">
              {{ result.success ? t('scriptResult.success') : t('scriptResult.failed') }}
            </n-text>

            <n-text :depth="3" style="font-size: 12px">
              {{ t('scriptResult.executionTime', { time: result.executionTime }) }}
            </n-text>
          </n-space>
        </div>

        <div class="result-actions">
          <n-space>
            <n-button size="tiny" quaternary @click="copyResult">
              <template #icon>
                <n-icon><CopyOutline /></n-icon>
              </template>
              {{ t('scriptResult.copy') }}
            </n-button>

            <n-button size="tiny" quaternary @click="downloadResult">
              <template #icon>
                <n-icon><DownloadOutline /></n-icon>
              </template>
              {{ t('scriptResult.download') }}
            </n-button>
          </n-space>
        </div>
      </n-space>
    </div>

    <!-- 执行结果内容 -->
    <div class="result-content">
      <n-tabs type="line" size="small">
        <!-- 执行结果数据 -->
        <n-tab-pane name="data" :tab="t('scriptResult.resultData')">
          <div class="result-data">
            <n-scrollbar style="max-height: 300px">
              <n-code :code="formatResultData()" language="json" :hljs="true" style="font-size: 12px" />
            </n-scrollbar>
          </div>
        </n-tab-pane>

        <!-- 执行日志 -->
        <n-tab-pane name="logs" :tab="`${t('scriptResult.logs')} (${result.logs.length})`">
          <div class="result-logs">
            <n-scrollbar style="max-height: 200px">
              <div v-for="(log, index) in result.logs" :key="index" class="log-entry" :class="`log-${log.level}`">
                <div class="log-timestamp">
                  {{ formatTimestamp(log.timestamp) }}
                </div>
                <div class="log-level">
                  {{ log.level.toUpperCase() }}
                </div>
                <div class="log-message">
                  {{ log.message }}
                </div>
                <div v-if="log.args && log.args.length > 0" class="log-args">
                  <n-code :code="JSON.stringify(log.args, null, 2)" language="json" style="font-size: 11px" />
                </div>
              </div>

              <n-empty v-if="result.logs.length === 0" :description="t('scriptResult.noLogs')" size="small" />
            </n-scrollbar>
          </div>
        </n-tab-pane>

        <!-- 错误详情 -->
        <n-tab-pane v-if="result.error" name="error" :tab="t('scriptResult.errorDetails')">
          <div class="result-error">
            <n-alert type="error" :title="result.error.name || 'Error'" :show-icon="true">
              <div class="error-message">
                {{ result.error.message }}
              </div>

              <div v-if="result.error.stack" class="error-stack">
                <n-text :depth="3" style="font-size: 11px">{{ t('scriptResult.stackTrace') }}:</n-text>
                <n-code :code="result.error.stack" language="text" style="font-size: 10px; margin-top: 8px" />
              </div>
            </n-alert>
          </div>
        </n-tab-pane>

        <!-- 上下文快照 -->
        <n-tab-pane v-if="result.contextSnapshot" name="context" :tab="t('scriptResult.contextSnapshot')">
          <div class="result-context">
            <n-scrollbar style="max-height: 250px">
              <n-code :code="JSON.stringify(result.contextSnapshot, null, 2)" language="json" style="font-size: 12px" />
            </n-scrollbar>
          </div>
        </n-tab-pane>
      </n-tabs>
    </div>

    <!-- 性能统计 -->
    <div class="result-performance">
      <n-space justify="space-between" size="large">
        <div class="perf-item">
          <n-text :depth="3" style="font-size: 11px">
            {{ t('scriptResult.executionTime') }}
          </n-text>
          <n-text style="font-size: 12px; font-weight: 500">{{ result.executionTime }}ms</n-text>
        </div>

        <div class="perf-item">
          <n-text :depth="3" style="font-size: 11px">
            {{ t('scriptResult.resultSize') }}
          </n-text>
          <n-text style="font-size: 12px; font-weight: 500">
            {{ getResultSize() }}
          </n-text>
        </div>

        <div class="perf-item">
          <n-text :depth="3" style="font-size: 11px">
            {{ t('scriptResult.logCount') }}
          </n-text>
          <n-text style="font-size: 12px; font-weight: 500">
            {{ result.logs.length }}
          </n-text>
        </div>
      </n-space>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 脚本执行结果展示面板
 * 集成结果数据、日志、错误和性能信息的展示
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useThemeStore } from '@/store/modules/theme'
import { useMessage } from 'naive-ui'
import { CheckmarkOutline, CloseOutline, CopyOutline, DownloadOutline } from '@vicons/ionicons5'
import type { ScriptExecutionResult } from '@/core/script-engine/types'

interface Props {
  /** 执行结果 */
  result: ScriptExecutionResult
}

const props = defineProps<Props>()

// 国际化和主题
const { t } = useI18n()
const themeStore = useThemeStore()
const message = useMessage()

// 主题颜色
const successColor = computed(() => themeStore.naiveTheme?.common?.successColor || '#18a058')
const errorColor = computed(() => themeStore.naiveTheme?.common?.errorColor || '#d03050')

/**
 * 格式化结果数据
 */
function formatResultData(): string {
  try {
    if (props.result.data === undefined) {
      return 'undefined'
    }

    if (props.result.data === null) {
      return 'null'
    }

    if (typeof props.result.data === 'string') {
      return `"${props.result.data}"`
    }

    if (typeof props.result.data === 'number' || typeof props.result.data === 'boolean') {
      return String(props.result.data)
    }

    return JSON.stringify(props.result.data, null, 2)
  } catch (error) {
    return `[Error formatting data: ${error}]`
  }
}

/**
 * 格式化时间戳
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour12: false,
    millisecond: true
  })
}

/**
 * 获取结果大小
 */
function getResultSize(): string {
  try {
    const jsonString = JSON.stringify(props.result.data)
    const bytes = new Blob([jsonString]).size

    if (bytes < 1024) {
      return `${bytes} B`
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`
    } else {
      return `${(bytes / 1024 / 1024).toFixed(1)} MB`
    }
  } catch (error) {
    return 'N/A'
  }
}

/**
 * 复制结果到剪贴板
 */
async function copyResult() {
  try {
    const resultText = formatResultData()
    await navigator.clipboard.writeText(resultText)
    message.success(t('scriptResult.copySuccess'))
  } catch (error) {
    message.error(t('scriptResult.copyError'))
  }
}

/**
 * 下载结果为文件
 */
function downloadResult() {
  try {
    const resultData = {
      success: props.result.success,
      data: props.result.data,
      executionTime: props.result.executionTime,
      logs: props.result.logs,
      error: props.result.error
        ? {
            name: props.result.error.name,
            message: props.result.error.message,
            stack: props.result.error.stack
          }
        : undefined,
      contextSnapshot: props.result.contextSnapshot,
      timestamp: new Date().toISOString()
    }

    const jsonString = JSON.stringify(resultData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url
    link.download = `script-result-${Date.now()}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(url)
    message.success(t('scriptResult.downloadSuccess'))
  } catch (error) {
    message.error(t('scriptResult.downloadError'))
  }
}
</script>

<style scoped>
.execution-result-panel {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-color);
  overflow: hidden;
}

.result-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--body-color);
}

.result-status {
  display: flex;
  align-items: center;
}

.result-actions {
  flex-shrink: 0;
}

.result-content {
  padding: 0;
}

.result-data,
.result-context {
  padding: 12px;
}

.result-logs {
  padding: 8px 12px;
}

.log-entry {
  display: grid;
  grid-template-columns: auto auto 1fr;
  gap: 12px;
  padding: 6px 0;
  border-bottom: 1px solid var(--divider-color);
  font-size: 11px;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-timestamp {
  color: var(--text-color-3);
  font-family: monospace;
  white-space: nowrap;
}

.log-level {
  font-weight: 500;
  color: var(--text-color-2);
  text-align: center;
  min-width: 50px;
}

.log-message {
  color: var(--text-color);
  word-break: break-word;
}

.log-args {
  grid-column: 1 / -1;
  margin-top: 4px;
  padding: 8px;
  background: var(--code-color);
  border-radius: 4px;
}

/* 日志级别颜色 */
.log-error .log-level {
  color: var(--error-color);
}

.log-warn .log-level {
  color: var(--warning-color);
}

.log-info .log-level {
  color: var(--info-color);
}

.log-debug .log-level {
  color: var(--text-color-3);
}

.result-error {
  padding: 12px;
}

.error-message {
  font-family: monospace;
  color: var(--error-color);
  margin-bottom: 8px;
}

.error-stack {
  margin-top: 12px;
}

.result-performance {
  padding: 8px 16px;
  border-top: 1px solid var(--border-color);
  background: var(--body-color);
}

.perf-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

/* 深色主题适配 */
[data-theme='dark'] .execution-result-panel {
  background: var(--card-color);
  border-color: var(--border-color);
}

[data-theme='dark'] .result-header,
[data-theme='dark'] .result-performance {
  background: var(--body-color);
  border-color: var(--border-color);
}

[data-theme='dark'] .log-args {
  background: var(--code-color);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .result-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .result-actions {
    align-self: flex-end;
  }

  .log-entry {
    grid-template-columns: 1fr;
    gap: 4px;
  }

  .log-timestamp,
  .log-level {
    text-align: left;
  }

  .result-performance {
    flex-direction: column;
    gap: 8px;
  }

  .perf-item {
    flex-direction: row;
    justify-content: space-between;
  }
}
</style>
