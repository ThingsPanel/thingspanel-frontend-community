<template>
  <div class="script-engine-test">
    <n-card title="脚本引擎测试平台" class="mb-4">
      <template #header-extra>
        <n-space>
          <n-tag type="success" size="small">v{{ engineVersion }}</n-tag>
          <n-button size="small" @click="refreshStats">
            <template #icon>
              <n-icon><MaterialSymbolsRefresh /></n-icon>
            </template>
            刷新统计
          </n-button>
        </n-space>
      </template>

      <n-space vertical size="large">
        <!-- 引擎统计信息 -->
        <n-card size="small" title="引擎统计" embedded>
          <n-grid :cols="4" :x-gap="12">
            <n-grid-item>
              <n-statistic label="总执行次数" :value="stats.executor.totalExecutions" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="成功率" :value="successRate" suffix="%" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="平均执行时间" :value="stats.executor.averageExecutionTime" suffix="ms" />
            </n-grid-item>
            <n-grid-item>
              <n-statistic label="可用模板数" :value="stats.templates.total" />
            </n-grid-item>
          </n-grid>
        </n-card>

        <!-- 功能测试区 -->
        <n-grid :cols="2" :x-gap="16">
          <!-- 脚本执行器测试 -->
          <n-grid-item>
            <ScriptExecutorTest @execution-complete="handleExecutionComplete" />
          </n-grid-item>

          <!-- 模板系统测试 -->
          <n-grid-item>
            <ScriptTemplateTest @template-execute="handleTemplateExecution" />
          </n-grid-item>
        </n-grid>

        <!-- 高级功能测试 -->
        <n-grid :cols="2" :x-gap="16">
          <!-- 上下文管理测试 -->
          <n-grid-item>
            <ContextManagerTest />
          </n-grid-item>

          <!-- 安全沙箱测试 -->
          <n-grid-item>
            <SecuritySandboxTest />
          </n-grid-item>
        </n-grid>

        <!-- 执行历史 -->
        <ExecutionHistoryPanel :executions="executionHistory" />
      </n-space>
    </n-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 脚本引擎测试主页面
 * 提供完整的脚本引擎功能测试界面
 */

import { ref, computed, onMounted } from 'vue'
import { useMessage } from 'naive-ui'
import { MaterialSymbolsRefresh } from '@vicons/material'
import { defaultScriptEngine } from '@/core/script-engine'
import type { ScriptExecutionResult } from '@/core/script-engine/types'

// 导入测试组件
import ScriptExecutorTest from './components/ScriptExecutorTest.vue'
import ScriptTemplateTest from './components/ScriptTemplateTest.vue'
import ContextManagerTest from './components/ContextManagerTest.vue'
import SecuritySandboxTest from './components/SecuritySandboxTest.vue'
import ExecutionHistoryPanel from './components/ExecutionHistoryPanel.vue'

const message = useMessage()

// 引擎信息
const engineVersion = ref('1.0.0')

// 统计信息
const stats = ref(defaultScriptEngine.getExecutionStats())

// 执行历史
const executionHistory = ref<
  Array<{
    id: string
    timestamp: number
    type: 'direct' | 'template'
    code?: string
    templateId?: string
    result: ScriptExecutionResult
  }>
>([])

// 计算成功率
const successRate = computed(() => {
  const total = stats.value.executor.totalExecutions
  if (total === 0) return 0
  return Math.round((stats.value.executor.successfulExecutions / total) * 100)
})

/**
 * 刷新统计信息
 */
const refreshStats = () => {
  stats.value = defaultScriptEngine.getExecutionStats()
  message.success('统计信息已刷新')
}

/**
 * 处理脚本执行完成
 */
const handleExecutionComplete = (result: ScriptExecutionResult) => {
  // 添加到执行历史
  executionHistory.value.unshift({
    id: `exec-${Date.now()}`,
    timestamp: Date.now(),
    type: 'direct',
    result
  })

  // 保持历史记录在100条以内
  if (executionHistory.value.length > 100) {
    executionHistory.value = executionHistory.value.slice(0, 100)
  }

  // 刷新统计
  refreshStats()
}

/**
 * 处理模板执行
 */
const handleTemplateExecution = (templateId: string, result: ScriptExecutionResult) => {
  // 添加到执行历史
  executionHistory.value.unshift({
    id: `template-${Date.now()}`,
    timestamp: Date.now(),
    type: 'template',
    templateId,
    result
  })

  // 保持历史记录在100条以内
  if (executionHistory.value.length > 100) {
    executionHistory.value = executionHistory.value.slice(0, 100)
  }

  // 刷新统计
  refreshStats()
}

/**
 * 组件挂载时的初始化
 */
onMounted(() => {
  console.log('🧪 [ScriptEngineTest] 脚本引擎测试页面已加载')
  refreshStats()
})
</script>

<style scoped>
.script-engine-test {
  padding: 16px;
  max-width: 1400px;
  margin: 0 auto;
}

:deep(.n-card) {
  border-radius: 8px;
}

:deep(.n-statistic .n-statistic-value) {
  font-weight: 600;
}

:deep(.n-statistic .n-statistic-label) {
  font-size: 12px;
  opacity: 0.8;
}
</style>
