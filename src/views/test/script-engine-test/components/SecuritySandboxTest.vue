<template>
  <n-card title="安全沙箱测试" class="sandbox-test">
    <n-space vertical size="medium">
      <!-- 安全测试示例 -->
      <div>
        <n-text strong>安全测试示例</n-text>
        <n-space style="margin-top: 8px">
          <n-button
            v-for="test in securityTests"
            :key="test.name"
            size="small"
            :type="test.dangerous ? 'error' : 'default'"
            @click="loadSecurityTest(test)"
          >
            {{ test.name }}
          </n-button>
        </n-space>
      </div>

      <!-- 代码编辑器 -->
      <n-form-item label="测试代码" size="small">
        <n-input
          v-model:value="testCode"
          type="textarea"
          :rows="8"
          placeholder="请输入要测试的代码..."
          :disabled="testing"
        />
      </n-form-item>

      <!-- 安全检查结果 */
      <n-card v-if="securityCheck" size="small" title="安全检查结果" embedded>
        <template #header-extra>
          <n-tag :type="securityCheck.safe ? 'success' : 'error'" size="small">
            {{ securityCheck.safe ? '安全' : '不安全' }}
          </n-tag>
        </template>

        <div v-if="!securityCheck.safe && securityCheck.issues.length > 0">
          <n-text strong type="error">发现的安全问题:</n-text>
          <n-list style="margin-top: 8px">
            <n-list-item v-for="(issue, index) in securityCheck.issues" :key="index">
              <n-thing>
                <template #avatar>
                  <n-icon color="red">
                    <WarningOutlined />
                  </n-icon>
                </template>
                <template #header>
                  安全问题 {{ index + 1 }}
                </template>
                <template #description>
                  {{ issue }}
                </template>
              </n-thing>
            </n-list-item>
          </n-list>
        </div>

        <div v-else-if="securityCheck.safe">
          <n-text type="success">
            ✅ 代码通过安全检查，可以安全执行
          </n-text>
        </div>
      </n-card>

      <!-- 操作按钮 -->
      <n-space>
        <n-button :disabled="!testCode.trim()" @click="checkSecurity">
          <template #icon>
            <n-icon><SecurityScanOutlined /></n-icon>
          </template>
          安全检查
        </n-button>
        <n-button type="primary" :loading="testing" :disabled="!testCode.trim()" @click="runSecurityTest">
          <template #icon>
            <n-icon><PlayArrowRound /></n-icon>
          </template>
          执行测试
        </n-button>
        <n-button :disabled="testing" @click="clearTest">清空</n-button>
      </n-space>

      <!-- 执行结果 -->
      <n-card v-if="testResult" size="small" title="执行结果" embedded>
        <template #header-extra>
          <n-tag :type="testResult.success ? 'success' : 'error'" size="small">
            {{ testResult.success ? '成功' : '失败' }}
          </n-tag>
        </template>

        <n-space vertical size="small">
          <n-descriptions :column="3" size="small">
            <n-descriptions-item label="执行时间">{{ testResult.executionTime }}ms</n-descriptions-item>
            <n-descriptions-item label="状态">
              {{ testResult.success ? '成功' : '失败' }}
            </n-descriptions-item>
            <n-descriptions-item label="安全性">
              {{ securityCheck?.safe ? '安全' : '不安全' }}
            </n-descriptions-item>
          </n-descriptions>

          <div v-if="testResult.success && testResult.data !== undefined">
            <n-text strong>执行结果:</n-text>
            <n-code :code="formatResult(testResult.data)" language="json" show-line-numbers style="margin-top: 8px" />
          </div>

          <div v-if="!testResult.success && testResult.error">
            <n-text strong type="error">错误信息:</n-text>
            <n-alert type="error" style="margin-top: 8px">
              {{ testResult.error.message }}
            </n-alert>
          </div>

          <div v-if="testResult.logs.length > 0">
            <n-text strong>执行日志:</n-text>
            <div style="margin-top: 8px; max-height: 150px; overflow-y: auto">
              <div v-for="log in testResult.logs" :key="log.timestamp" class="log-entry">
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

      <!-- 沙箱配置 -->
      <n-card size="small" title="沙箱配置" embedded>
        <n-space vertical size="small">
          <n-descriptions :column="2" size="small">
            <n-descriptions-item label="沙箱状态">
              <n-tag type="success" size="small">已启用</n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="允许eval">
              <n-tag type="error" size="small">禁止</n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="允许Function">
              <n-tag type="error" size="small">禁止</n-tag>
            </n-descriptions-item>
            <n-descriptions-item label="原型污染保护">
              <n-tag type="success" size="small">已启用</n-tag>
            </n-descriptions-item>
          </n-descriptions>

          <div>
            <n-text strong>允许的全局对象:</n-text>
            <div style="margin-top: 4px">
              <n-tag v-for="global in allowedGlobals" :key="global" size="small" style="margin: 2px" type="info">
                {{ global }}
              </n-tag>
            </div>
          </div>

          <div>
            <n-text strong>禁止的全局对象:</n-text>
            <div style="margin-top: 4px">
              <n-tag v-for="blocked in blockedGlobals" :key="blocked" size="small" style="margin: 2px" type="error">
                {{ blocked }}
              </n-tag>
            </div>
          </div>
        </n-space>
      </n-card>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
/**
 * 安全沙箱测试组件
 */

import { ref } from 'vue'
import { useMessage } from 'naive-ui'
import { PlayArrowRound, WarningOutlined, SecurityScanOutlined } from '@vicons/material'
import { defaultScriptEngine } from '@/core/script-engine'
import { defaultSandboxConfig } from '@/core/script-engine/sandbox'
import type { ScriptExecutionResult } from '@/core/script-engine/types'

const message = useMessage()

// 数据
const testCode = ref('')
const testing = ref(false)
const testResult = ref<ScriptExecutionResult | null>(null)
const securityCheck = ref<{ safe: boolean; issues: string[] } | null>(null)

// 沙箱配置信息
const allowedGlobals = ref(defaultSandboxConfig.allowedGlobals)
const blockedGlobals = ref(defaultSandboxConfig.blockedGlobals)

// 安全测试示例
const securityTests = ref([
  {
    name: '正常代码',
    dangerous: false,
    code: `// 正常的数学计算
const a = 10;
const b = 20;
const result = Math.sqrt(a * a + b * b);
console.log('计算结果:', result);
return { input: { a, b }, result };`
  },
  {
    name: '内置函数测试',
    dangerous: false,
    code: `// 测试内置工具函数
const randomNum = _utils.mockData.randomNumber(1, 100);
const randomStr = _utils.mockData.randomString(8);
const now = _utils.timeUtils.now();

console.log('随机数:', randomNum);
console.log('随机字符串:', randomStr);
console.log('当前时间:', now);

return {
  randomNumber: randomNum,
  randomString: randomStr,
  timestamp: now
};`
  },
  {
    name: 'eval攻击',
    dangerous: true,
    code: `// 尝试使用eval函数
const maliciousCode = "console.log('恶意代码执行!')";
eval(maliciousCode);
return "如果你看到这个，说明eval没有被阻止";`
  },
  {
    name: 'Function构造器',
    dangerous: true,
    code: `// 尝试使用Function构造器
const func = new Function('return "危险代码执行"');
return func();`
  },
  {
    name: '全局对象访问',
    dangerous: true,
    code: `// 尝试访问window对象
try {
  console.log('尝试访问window:', typeof window);
  return window.location.href;
} catch (e) {
  console.log('window访问被阻止:', e.message);
}

// 尝试访问process对象
try {
  console.log('尝试访问process:', typeof process);
  return process.env;
} catch (e) {
  console.log('process访问被阻止:', e.message);
}

return "全局对象访问测试完成";`
  },
  {
    name: '原型污染',
    dangerous: true,
    code: `// 尝试原型污染
try {
  Object.prototype.polluted = 'dangerous';
  console.log('原型污染尝试执行');
  return "原型污染成功";
} catch (e) {
  console.log('原型污染被阻止:', e.message);
  return "原型污染失败";
}`
  },
  {
    name: 'constructor访问',
    dangerous: true,
    code: `// 尝试通过constructor访问
try {
  const str = '';
  const Constructor = str.constructor.constructor;
  const dangerousFunc = Constructor('return "通过constructor执行代码"');
  return dangerousFunc();
} catch (e) {
  console.log('constructor访问被阻止:', e.message);
  return "constructor访问失败";
}`
  },
  {
    name: '异步操作测试',
    dangerous: false,
    code: `// 测试异步操作
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

console.log('开始异步测试...');
await delay(100);
console.log('延时100ms完成');

const promises = [
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3)
];

const results = await Promise.all(promises);
console.log('Promise.all结果:', results);

return {
  message: '异步操作测试完成',
  results: results,
  timestamp: Date.now()
};`
  }
])

/**
 * 加载安全测试
 */
const loadSecurityTest = (test: any) => {
  testCode.value = test.code
  securityCheck.value = null
  testResult.value = null

  message.info(`已加载测试: ${test.name}`)

  // 自动进行安全检查
  setTimeout(checkSecurity, 100)
}

/**
 * 安全检查
 */
const checkSecurity = () => {
  if (!testCode.value.trim()) {
    message.error('请输入测试代码')
    return
  }

  try {
    const result = defaultScriptEngine.checkScriptSecurity(testCode.value)
    securityCheck.value = result

    if (result.safe) {
      message.success('代码安全检查通过')
    } else {
      message.warning(`发现 ${result.issues.length} 个安全问题`)
    }
  } catch (error) {
    message.error(`安全检查失败: ${(error as Error).message}`)
  }
}

/**
 * 执行安全测试
 */
const runSecurityTest = async () => {
  if (!testCode.value.trim()) {
    message.error('请输入测试代码')
    return
  }

  // 先进行安全检查
  if (!securityCheck.value) {
    checkSecurity()
  }

  testing.value = true

  try {
    console.log('🧪 [SecuritySandboxTest] 执行安全测试')

    // 执行代码（沙箱会自动进行安全检查）
    const result = await defaultScriptEngine.execute(testCode.value)

    testResult.value = result

    if (result.success) {
      message.success(`测试执行成功 (${result.executionTime}ms)`)
    } else {
      message.error(`测试执行失败: ${result.error?.message}`)
    }
  } catch (error) {
    console.error('❌ [SecuritySandboxTest] 测试执行异常:', error)
    message.error(`测试执行异常: ${(error as Error).message}`)
  } finally {
    testing.value = false
  }
}

/**
 * 清空测试
 */
const clearTest = () => {
  testCode.value = ''
  securityCheck.value = null
  testResult.value = null
  message.info('已清空测试内容')
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
.sandbox-test {
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

:deep(.n-input__textarea-el) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.4;
}
</style>
