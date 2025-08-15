<template>
  <n-card title="脚本执行器测试" class="executor-test">
    <n-space vertical size="medium">
      <!-- 脚本编辑器 -->
      <n-form-item label="JavaScript 代码" size="small">
        <n-input
          v-model:value="scriptCode"
          type="textarea"
          :rows="8"
          placeholder="请输入JavaScript代码..."
          :disabled="executing"
        />
      </n-form-item>

      <!-- 执行上下文 -->
      <n-form-item label="执行上下文 (JSON)" size="small">
        <n-input
          v-model:value="contextJson"
          type="textarea"
          :rows="3"
          placeholder='{"key": "value"}'
          :disabled="executing"
        />
      </n-form-item>

      <!-- 执行配置 -->
      <n-form-item label="执行配置" size="small">
        <n-space>
          <n-input-number
            v-model:value="timeout"
            :min="1000"
            :max="30000"
            :step="1000"
            placeholder="超时时间(ms)"
            style="width: 120px"
            :disabled="executing"
          />
          <n-checkbox v-model:checked="strictMode" :disabled="executing">严格模式</n-checkbox>
          <n-checkbox v-model:checked="asyncSupport" :disabled="executing">异步支持</n-checkbox>
        </n-space>
      </n-form-item>

      <!-- 快速示例 -->
      <n-form-item label="快速示例" size="small">
        <n-space>
          <n-button size="small" :disabled="executing" @click="loadExample('basic')">基础示例</n-button>
          <n-button size="small" :disabled="executing" @click="loadExample('async')">异步示例</n-button>
          <n-button size="small" :disabled="executing" @click="loadExample('data-processing')">数据处理</n-button>
          <n-button size="small" :disabled="executing" @click="loadExample('error')">错误示例</n-button>
        </n-space>
      </n-form-item>

      <!-- 执行按钮 -->
      <n-space>
        <n-button type="primary" :loading="executing" :disabled="!scriptCode.trim()" @click="executeScript">
          <template #icon>
            <n-icon><PlayArrowRound /></n-icon>
          </template>
          执行脚本
        </n-button>
        <n-button :disabled="executing" @click="clearAll">清空</n-button>
        <n-button :disabled="executing" @click="validateSyntax">语法检查</n-button>
      </n-space>

      <!-- 执行结果 -->
      <n-card v-if="lastResult" size="small" :title="resultTitle" embedded>
        <template #header-extra>
          <n-tag :type="lastResult.success ? 'success' : 'error'" size="small">
            {{ lastResult.success ? '成功' : '失败' }}
          </n-tag>
        </template>

        <n-space vertical size="small">
          <!-- 执行信息 -->
          <n-descriptions :column="3" size="small">
            <n-descriptions-item label="执行时间">{{ lastResult.executionTime }}ms</n-descriptions-item>
            <n-descriptions-item label="状态">
              {{ lastResult.success ? '成功' : '失败' }}
            </n-descriptions-item>
            <n-descriptions-item label="日志数量">
              {{ lastResult.logs.length }}
            </n-descriptions-item>
          </n-descriptions>

          <!-- 执行结果数据 -->
          <div v-if="lastResult.success && lastResult.data !== undefined">
            <n-text strong>执行结果:</n-text>
            <n-code :code="formatResult(lastResult.data)" language="json" show-line-numbers style="margin-top: 8px" />
          </div>

          <!-- 错误信息 -->
          <div v-if="!lastResult.success && lastResult.error">
            <n-text strong type="error">错误信息:</n-text>
            <n-alert type="error" style="margin-top: 8px">
              {{ lastResult.error.message }}
            </n-alert>
          </div>

          <!-- 执行日志 -->
          <div v-if="lastResult.logs.length > 0">
            <n-text strong>执行日志:</n-text>
            <div style="margin-top: 8px; max-height: 200px; overflow-y: auto">
              <div v-for="log in lastResult.logs" :key="log.timestamp" class="log-entry" :class="`log-${log.level}`">
                <n-text class="log-time">
                  {{ formatTime(log.timestamp) }}
                </n-text>
                <n-text class="log-level" :type="getLogType(log.level)">[{{ log.level.toUpperCase() }}]</n-text>
                <n-text class="log-message">
                  {{ log.message }}
                </n-text>
              </div>
            </div>
          </div>
        </n-space>
      </n-card>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
/**
 * 脚本执行器测试组件
 */

import { ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { PlayArrowRound } from '@vicons/material'
import { defaultScriptEngine } from '@/core/script-engine'
import type { ScriptExecutionResult } from '@/core/script-engine/types'

// 定义事件
const emit = defineEmits<{
  executionComplete: [result: ScriptExecutionResult]
}>()

const message = useMessage()

// 表单数据
const scriptCode = ref(`// 示例代码：生成随机数据
const count = 5;
const result = [];

for (let i = 0; i < count; i++) {
  result.push({
    id: i + 1,
    value: _utils.mockData.randomNumber(1, 100),
    name: \`项目\${i + 1}\`,
    timestamp: new Date().toISOString()
  });
}

console.log('生成了', count, '条数据');
return result;`)

const contextJson = ref('{"userId": "test-user", "environment": "test"}')
const timeout = ref(5000)
const strictMode = ref(true)
const asyncSupport = ref(true)

// 执行状态
const executing = ref(false)
const lastResult = ref<ScriptExecutionResult | null>(null)

// 计算属性
const resultTitle = computed(() => {
  if (!lastResult.value) return '执行结果'
  return `执行结果 - ${lastResult.value.executionTime}ms`
})

/**
 * 执行脚本
 */
const executeScript = async () => {
  if (!scriptCode.value.trim()) {
    message.error('请输入脚本代码')
    return
  }

  executing.value = true

  try {
    // 解析上下文
    let context = undefined
    if (contextJson.value.trim()) {
      try {
        context = JSON.parse(contextJson.value)
      } catch (error) {
        message.error('上下文JSON格式错误')
        return
      }
    }

    // 创建脚本配置
    const config = {
      code: scriptCode.value,
      timeout: timeout.value,
      strictMode: strictMode.value,
      asyncSupport: asyncSupport.value
    }

    console.log('🚀 [ScriptExecutorTest] 开始执行脚本:', config)

    // 执行脚本
    const result = await defaultScriptEngine.execute(config.code, context)

    lastResult.value = result

    if (result.success) {
      message.success(`脚本执行成功 (${result.executionTime}ms)`)
    } else {
      message.error(`脚本执行失败: ${result.error?.message}`)
    }

    // 触发事件
    emit('executionComplete', result)
  } catch (error) {
    console.error('❌ [ScriptExecutorTest] 脚本执行异常:', error)
    message.error(`脚本执行异常: ${(error as Error).message}`)
  } finally {
    executing.value = false
  }
}

/**
 * 语法检查
 */
const validateSyntax = () => {
  if (!scriptCode.value.trim()) {
    message.error('请输入脚本代码')
    return
  }

  const validation = defaultScriptEngine.validateScript(scriptCode.value)

  if (validation.valid) {
    message.success('语法检查通过')
  } else {
    message.error(`语法错误: ${validation.error}`)
  }
}

/**
 * 清空所有内容
 */
const clearAll = () => {
  scriptCode.value = ''
  contextJson.value = ''
  lastResult.value = null
  message.info('已清空所有内容')
}

/**
 * 加载示例代码
 */
const loadExample = (type: string) => {
  const examples = {
    basic: {
      code: `// 基础示例：计算数组总和
const numbers = [1, 2, 3, 4, 5];
const sum = numbers.reduce((a, b) => a + b, 0);
const average = sum / numbers.length;

console.log('数组:', numbers);
console.log('总和:', sum);
console.log('平均值:', average);

return {
  numbers,
  sum,
  average,
  timestamp: new Date().toISOString()
};`,
      context: '{"source": "basic-example"}'
    },
    async: {
      code: `// 异步示例：模拟API调用
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

console.log('开始异步操作...');

// 模拟异步任务
await delay(1000);
console.log('第一个任务完成');

await delay(500);
console.log('第二个任务完成');

const result = {
  status: 'completed',
  duration: 1500,
  tasks: ['task1', 'task2'],
  timestamp: new Date().toISOString()
};

console.log('所有任务完成:', result);
return result;`,
      context: '{"timeout": 10000}'
    },
    'data-processing': {
      code: `// 数据处理示例：分析销售数据
const salesData = [
  { month: '1月', sales: 12000, cost: 8000 },
  { month: '2月', sales: 15000, cost: 9000 },
  { month: '3月', sales: 18000, cost: 11000 },
  { month: '4月', sales: 14000, cost: 8500 },
  { month: '5月', sales: 22000, cost: 13000 }
];

// 计算利润
const processedData = salesData.map(item => ({
  ...item,
  profit: item.sales - item.cost,
  margin: ((item.sales - item.cost) / item.sales * 100).toFixed(2) + '%'
}));

// 统计总计
const totals = processedData.reduce((acc, item) => ({
  totalSales: acc.totalSales + item.sales,
  totalCost: acc.totalCost + item.cost,
  totalProfit: acc.totalProfit + item.profit
}), { totalSales: 0, totalCost: 0, totalProfit: 0 });

console.log('原始数据:', salesData);
console.log('处理后数据:', processedData);
console.log('统计总计:', totals);

return {
  original: salesData,
  processed: processedData,
  totals,
  analysis: {
    bestMonth: processedData.reduce((max, item) => 
      item.profit > max.profit ? item : max
    ),
    averageMargin: (totals.totalProfit / totals.totalSales * 100).toFixed(2) + '%'
  }
};`,
      context: '{"reportType": "monthly-analysis"}'
    },
    error: {
      code: `// 错误示例：演示错误处理
console.log('开始执行可能出错的代码...');

// 这将导致引用错误
const result = undefinedVariable.someProperty;

// 这行代码不会执行
console.log('如果你看到这条消息，说明上面的错误被处理了');

return result;`,
      context: '{"expectError": true}'
    }
  }

  const example = examples[type as keyof typeof examples]
  if (example) {
    scriptCode.value = example.code
    contextJson.value = example.context
    message.success(`已加载${type}示例`)
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
 * 格式化时间
 */
const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString()
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
</script>

<style scoped>
.executor-test {
  height: fit-content;
}

.log-entry {
  display: flex;
  gap: 8px;
  padding: 4px 8px;
  margin: 2px 0;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}

.log-time {
  color: var(--text-color-3);
  white-space: nowrap;
  min-width: 80px;
}

.log-level {
  font-weight: 600;
  min-width: 60px;
}

.log-message {
  flex: 1;
  word-break: break-word;
}

.log-error {
  background-color: rgba(255, 107, 107, 0.1);
}

.log-warn {
  background-color: rgba(255, 193, 7, 0.1);
}

.log-info {
  background-color: rgba(13, 110, 253, 0.1);
}

:deep(.n-input__textarea-el) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.4;
}
</style>
