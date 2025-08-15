<template>
  <n-card title="执行历史" class="history-panel">
    <template #header-extra>
      <n-space size="small">
        <n-text depth="3" style="font-size: 12px">共 {{ executions.length }} 条记录</n-text>
        <n-button size="tiny" :disabled="executions.length === 0" @click="clearHistory">清空历史</n-button>
      </n-space>
    </template>

    <div v-if="executions.length === 0" class="empty-state">
      <n-empty description="暂无执行记录" />
    </div>

    <n-list v-else>
      <n-list-item v-for="execution in executions" :key="execution.id" class="execution-item">
        <n-thing>
          <template #avatar>
            <n-avatar
              :style="{
                backgroundColor: execution.result.success ? 'var(--success-color)' : 'var(--error-color)'
              }"
            >
              <n-icon>
                <CheckCircleOutlined v-if="execution.result.success" />
                <ErrorOutlined v-else />
              </n-icon>
            </n-avatar>
          </template>

          <template #header>
            <n-space align="center" justify="space-between">
              <span>
                {{ execution.type === 'template' ? '模板执行' : '脚本执行' }}
              </span>
              <n-text depth="3" style="font-size: 11px">
                {{ formatTime(execution.timestamp) }}
              </n-text>
            </n-space>
          </template>

          <template #header-extra>
            <n-space size="small">
              <n-tag :type="execution.result.success ? 'success' : 'error'" size="tiny">
                {{ execution.result.success ? '成功' : '失败' }}
              </n-tag>
              <n-text depth="3" style="font-size: 11px">{{ execution.result.executionTime }}ms</n-text>
            </n-space>
          </template>

          <template #description>
            <n-space vertical size="small">
              <!-- 执行信息 -->
              <div>
                <n-text v-if="execution.type === 'template'" depth="2">模板ID: {{ execution.templateId }}</n-text>
                <n-text v-else depth="2">脚本长度: {{ getCodeLength(execution) }} 字符</n-text>
              </div>

              <!-- 展开按钮 -->
              <n-button size="tiny" text @click="toggleExpanded(execution.id)">
                {{ expandedItems.has(execution.id) ? '收起详情' : '查看详情' }}
                <template #icon>
                  <n-icon>
                    <ExpandMoreOutlined
                      :style="{ transform: expandedItems.has(execution.id) ? 'rotate(180deg)' : 'rotate(0deg)' }"
                    />
                  </n-icon>
                </template>
              </n-button>

              <!-- 详细信息 -->
              <div v-if="expandedItems.has(execution.id)" class="execution-details">
                <n-divider style="margin: 8px 0" />

                <!-- 执行结果 -->
                <div v-if="execution.result.success && execution.result.data !== undefined">
                  <n-text strong>执行结果:</n-text>
                  <n-code
                    :code="formatResult(execution.result.data)"
                    language="json"
                    style="margin-top: 4px; max-height: 200px; overflow-y: auto"
                  />
                </div>

                <!-- 错误信息 -->
                <div v-if="!execution.result.success && execution.result.error">
                  <n-text strong type="error">错误信息:</n-text>
                  <n-alert type="error" style="margin-top: 4px" size="small">
                    {{ execution.result.error.message }}
                  </n-alert>
                </div>

                <!-- 执行日志 -->
                <div v-if="execution.result.logs && execution.result.logs.length > 0">
                  <n-text strong>执行日志 ({{ execution.result.logs.length }} 条):</n-text>
                  <div class="logs-container">
                    <div
                      v-for="log in execution.result.logs"
                      :key="log.timestamp"
                      class="log-entry"
                      :class="`log-${log.level}`"
                    >
                      <n-text class="log-level" :type="getLogType(log.level)">[{{ log.level.toUpperCase() }}]</n-text>
                      <n-text class="log-message">
                        {{ log.message }}
                      </n-text>
                    </div>
                  </div>
                </div>

                <!-- 操作按钮 -->
                <n-space style="margin-top: 8px" size="small">
                  <n-button size="tiny" @click="copyResult(execution)">复制结果</n-button>
                  <n-button size="tiny" @click="rerunExecution(execution)">重新执行</n-button>
                  <n-button size="tiny" type="error" @click="deleteExecution(execution.id)">删除记录</n-button>
                </n-space>
              </div>
            </n-space>
          </template>
        </n-thing>
      </n-list-item>
    </n-list>
  </n-card>
</template>

<script setup lang="ts">
/**
 * 执行历史面板组件
 */

import { ref, computed } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { CheckCircleOutlined, ErrorOutlined, ExpandMoreOutlined } from '@vicons/material'
import type { ScriptExecutionResult } from '@/core/script-engine/types'

// 定义属性
interface ExecutionRecord {
  id: string
  timestamp: number
  type: 'direct' | 'template'
  code?: string
  templateId?: string
  result: ScriptExecutionResult
}

interface Props {
  executions: ExecutionRecord[]
}

// 定义事件
const emit = defineEmits<{
  rerun: [execution: ExecutionRecord]
  delete: [id: string]
  clear: []
}>()

const props = defineProps<Props>()
const message = useMessage()
const dialog = useDialog()

// 展开状态
const expandedItems = ref(new Set<string>())

/**
 * 切换展开状态
 */
const toggleExpanded = (id: string) => {
  if (expandedItems.value.has(id)) {
    expandedItems.value.delete(id)
  } else {
    expandedItems.value.add(id)
  }
}

/**
 * 获取代码长度
 */
const getCodeLength = (execution: ExecutionRecord): number => {
  if (execution.type === 'template') return 0
  return execution.code?.length || 0
}

/**
 * 格式化时间
 */
const formatTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) {
    // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) {
    // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) {
    // 24小时内
    return `${Math.floor(diff / 3600000)}小时前`
  } else {
    return new Date(timestamp).toLocaleString()
  }
}

/**
 * 格式化执行结果
 */
const formatResult = (data: any): string => {
  try {
    return JSON.stringify(data, null, 2)
  } catch {
    return String(data)
  }
}

/**
 * 获取日志类型颜色
 */
const getLogType = (level: string) => {
  const types: Record<string, any> = {
    log: 'default',
    info: 'info',
    warn: 'warning',
    error: 'error',
    debug: 'success'
  }
  return types[level] || 'default'
}

/**
 * 复制执行结果
 */
const copyResult = async (execution: ExecutionRecord) => {
  try {
    const result = {
      type: execution.type,
      timestamp: execution.timestamp,
      success: execution.result.success,
      executionTime: execution.result.executionTime,
      data: execution.result.data,
      error: execution.result.error?.message,
      logs: execution.result.logs
    }

    await navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    message.success('执行结果已复制到剪贴板')
  } catch (error) {
    message.error('复制失败')
  }
}

/**
 * 重新执行
 */
const rerunExecution = (execution: ExecutionRecord) => {
  emit('rerun', execution)
}

/**
 * 删除执行记录
 */
const deleteExecution = (id: string) => {
  dialog.warning({
    title: '确认删除',
    content: '确定要删除这条执行记录吗？',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      emit('delete', id)
      expandedItems.value.delete(id)
      message.success('执行记录已删除')
    }
  })
}

/**
 * 清空历史记录
 */
const clearHistory = () => {
  dialog.warning({
    title: '确认清空',
    content: '确定要清空所有执行历史记录吗？此操作不可撤销。',
    positiveText: '清空',
    negativeText: '取消',
    onPositiveClick: () => {
      emit('clear')
      expandedItems.value.clear()
      message.success('执行历史已清空')
    }
  })
}
</script>

<style scoped>
.history-panel {
  height: fit-content;
}

.empty-state {
  padding: 40px 0;
  text-align: center;
}

.execution-item {
  border-bottom: 1px solid var(--divider-color);
}

.execution-item:last-child {
  border-bottom: none;
}

.execution-details {
  padding: 8px 0;
}

.logs-container {
  margin-top: 4px;
  max-height: 150px;
  overflow-y: auto;
  background-color: var(--code-color);
  border-radius: 4px;
  padding: 8px;
}

.log-entry {
  display: flex;
  gap: 8px;
  margin: 2px 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 11px;
}

.log-level {
  font-weight: 600;
  min-width: 50px;
}

.log-message {
  flex: 1;
  word-break: break-word;
}

.log-error {
  color: var(--error-color);
}

.log-warn {
  color: var(--warning-color);
}

.log-info {
  color: var(--info-color);
}

.log-debug {
  color: var(--success-color);
}

:deep(.n-list-item__main) {
  width: 100%;
}

:deep(.n-thing) {
  width: 100%;
}

:deep(.n-code) {
  font-size: 11px;
}
</style>
