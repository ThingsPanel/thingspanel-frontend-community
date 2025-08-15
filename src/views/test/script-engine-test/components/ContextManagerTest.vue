<template>
  <n-card title="上下文管理器测试" class="context-test">
    <n-space vertical size="medium">
      <!-- 上下文列表 -->
      <div>
        <n-text strong>已有上下文</n-text>
        <n-data-table
          :columns="contextColumns"
          :data="contexts"
          size="small"
          style="margin-top: 8px"
          max-height="200px"
        />
      </div>

      <!-- 创建新上下文 -->
      <n-card size="small" title="创建上下文" embedded>
        <n-space vertical size="small">
          <n-form-item label="上下文名称" size="small">
            <n-input v-model:value="newContextName" placeholder="请输入上下文名称" :disabled="creating" />
          </n-form-item>

          <n-form-item label="初始变量 (JSON)" size="small">
            <n-input
              v-model:value="newContextVariables"
              type="textarea"
              :rows="3"
              placeholder='{"key": "value"}'
              :disabled="creating"
            />
          </n-form-item>

          <n-space>
            <n-button
              type="primary"
              size="small"
              :loading="creating"
              :disabled="!newContextName.trim()"
              @click="createContext"
            >
              创建上下文
            </n-button>
            <n-button size="small" @click="loadPresetContext">加载预设</n-button>
          </n-space>
        </n-space>
      </n-card>

      <!-- 上下文操作 -->
      <n-card v-if="selectedContext" size="small" title="上下文操作" embedded>
        <template #header-extra>
          <n-text depth="3" style="font-size: 12px">
            {{ selectedContext.name }}
          </n-text>
        </template>

        <n-space vertical size="small">
          <!-- 变量管理 -->
          <div>
            <n-text strong>变量管理</n-text>
            <div style="margin-top: 8px">
              <div v-for="[key, value] in Object.entries(selectedContext.variables)" :key="key" class="variable-item">
                <n-space align="center" justify="space-between">
                  <n-space align="center" size="small">
                    <n-text code>{{ key }}</n-text>
                    <n-text depth="3">=</n-text>
                    <n-text>{{ formatValue(value) }}</n-text>
                  </n-space>
                  <n-button size="tiny" type="error" quaternary @click="removeVariable(key)">删除</n-button>
                </n-space>
              </div>
            </div>

            <!-- 添加变量 -->
            <n-space style="margin-top: 8px" size="small">
              <n-input v-model:value="newVariableKey" placeholder="变量名" size="small" style="width: 100px" />
              <n-input v-model:value="newVariableValue" placeholder="变量值(JSON)" size="small" style="width: 150px" />
              <n-button
                size="small"
                :disabled="!newVariableKey.trim() || !newVariableValue.trim()"
                @click="addVariable"
              >
                添加
              </n-button>
            </n-space>
          </div>

          <!-- 上下文操作 -->
          <n-space>
            <n-button size="small" @click="cloneContext">克隆上下文</n-button>
            <n-button size="small" @click="exportContext">导出配置</n-button>
            <n-button size="small" type="error" :disabled="isSystemContext(selectedContext)" @click="deleteContext">
              删除上下文
            </n-button>
          </n-space>
        </n-space>
      </n-card>

      <!-- 上下文测试 -->
      <n-card v-if="selectedContext" size="small" title="上下文测试" embedded>
        <n-space vertical size="small">
          <n-form-item label="测试脚本" size="small">
            <n-input
              v-model:value="testScript"
              type="textarea"
              :rows="4"
              placeholder="请输入使用当前上下文的测试脚本"
            />
          </n-form-item>

          <n-space>
            <n-button
              type="primary"
              size="small"
              :loading="testing"
              :disabled="!testScript.trim()"
              @click="runContextTest"
            >
              运行测试
            </n-button>
            <n-button size="small" @click="loadTestExample">加载示例</n-button>
          </n-space>

          <!-- 测试结果 -->
          <div v-if="testResult">
            <n-text strong>测试结果:</n-text>
            <n-code :code="formatValue(testResult.data)" language="json" style="margin-top: 8px" />
          </div>
        </n-space>
      </n-card>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
/**
 * 上下文管理器测试组件
 */

import { ref, computed, onMounted } from 'vue'
import { useMessage, useDialog } from 'naive-ui'
import { defaultScriptEngine } from '@/core/script-engine'
import type { ScriptExecutionContext, ScriptExecutionResult } from '@/core/script-engine/types'

const message = useMessage()
const dialog = useDialog()

// 数据
const contexts = ref<ScriptExecutionContext[]>([])
const selectedContextId = ref<string>('')
const newContextName = ref('')
const newContextVariables = ref('{}')
const creating = ref(false)
const testing = ref(false)

// 变量管理
const newVariableKey = ref('')
const newVariableValue = ref('')

// 测试脚本
const testScript = ref(`// 使用上下文变量的测试脚本
console.log('当前用户:', currentUser);
console.log('应用名称:', appName);
console.log('环境:', environment);

// 使用内置函数
const id = generateId();
console.log('生成的ID:', id);

// 返回综合信息
return {
  context: {
    user: currentUser,
    app: appName,
    env: environment
  },
  generatedId: id,
  timestamp: formatDate(getCurrentDate()),
  allVariables: Object.keys(this).filter(key => !key.startsWith('_'))
};`)

const testResult = ref<ScriptExecutionResult | null>(null)

// 计算属性
const selectedContext = computed(() => {
  return contexts.value.find(ctx => ctx.id === selectedContextId.value) || null
})

// 表格列定义
const contextColumns = [
  {
    title: '名称',
    key: 'name',
    width: 120
  },
  {
    title: '变量数量',
    key: 'variables',
    width: 80,
    render: (row: ScriptExecutionContext) => Object.keys(row.variables).length
  },
  {
    title: '函数数量',
    key: 'functions',
    width: 80,
    render: (row: ScriptExecutionContext) => Object.keys(row.functions).length
  },
  {
    title: '创建时间',
    key: 'createdAt',
    width: 140,
    render: (row: ScriptExecutionContext) => new Date(row.createdAt).toLocaleString()
  },
  {
    title: '操作',
    key: 'actions',
    width: 100,
    render: (row: ScriptExecutionContext) => {
      return h('div', [
        h(
          'n-button',
          {
            size: 'tiny',
            type: selectedContextId.value === row.id ? 'primary' : 'default',
            onClick: () => selectContext(row.id)
          },
          selectedContextId.value === row.id ? '已选中' : '选择'
        )
      ])
    }
  }
]

/**
 * 加载上下文列表
 */
const loadContexts = () => {
  contexts.value = defaultScriptEngine.contextManager.getAllContexts()
  console.log('🔄 [ContextManagerTest] 加载上下文列表:', contexts.value.length)
}

/**
 * 选择上下文
 */
const selectContext = (contextId: string) => {
  selectedContextId.value = contextId
  console.log('✅ [ContextManagerTest] 选择上下文:', contextId)
}

/**
 * 创建上下文
 */
const createContext = async () => {
  if (!newContextName.value.trim()) {
    message.error('请输入上下文名称')
    return
  }

  creating.value = true

  try {
    // 解析变量JSON
    let variables = {}
    if (newContextVariables.value.trim()) {
      try {
        variables = JSON.parse(newContextVariables.value)
      } catch (error) {
        message.error('变量JSON格式错误')
        return
      }
    }

    // 创建上下文
    const context = defaultScriptEngine.contextManager.createContext(newContextName.value, variables)

    console.log('✅ [ContextManagerTest] 创建上下文:', context)
    message.success('上下文创建成功')

    // 刷新列表并选中新创建的上下文
    loadContexts()
    selectedContextId.value = context.id

    // 清空表单
    newContextName.value = ''
    newContextVariables.value = '{}'
  } catch (error) {
    console.error('❌ [ContextManagerTest] 创建上下文失败:', error)
    message.error(`创建上下文失败: ${(error as Error).message}`)
  } finally {
    creating.value = false
  }
}

/**
 * 加载预设上下文
 */
const loadPresetContext = () => {
  const presets = [
    {
      name: '测试环境上下文',
      variables: {
        environment: 'test',
        debugMode: true,
        apiUrl: 'https://api-test.example.com',
        userId: 'test-user-123'
      }
    },
    {
      name: '数据分析上下文',
      variables: {
        dataSource: 'analytics',
        sampleSize: 1000,
        timeRange: '7d',
        metrics: ['views', 'clicks', 'conversions']
      }
    },
    {
      name: 'IoT设备上下文',
      variables: {
        deviceType: 'sensor',
        protocol: 'mqtt',
        sampleRate: 5000,
        location: 'building-a-floor-2'
      }
    }
  ]

  // 随机选择一个预设
  const preset = presets[Math.floor(Math.random() * presets.length)]
  newContextName.value = preset.name
  newContextVariables.value = JSON.stringify(preset.variables, null, 2)

  message.success(`已加载预设: ${preset.name}`)
}

/**
 * 添加变量
 */
const addVariable = () => {
  if (!selectedContext.value || !newVariableKey.value.trim() || !newVariableValue.value.trim()) {
    return
  }

  try {
    // 解析变量值
    let value: any
    try {
      value = JSON.parse(newVariableValue.value)
    } catch {
      // 如果不是有效JSON，当作字符串处理
      value = newVariableValue.value
    }

    // 添加变量
    const success = defaultScriptEngine.contextManager.addVariable(
      selectedContext.value.id,
      newVariableKey.value,
      value
    )

    if (success) {
      message.success('变量添加成功')
      loadContexts() // 刷新列表
      newVariableKey.value = ''
      newVariableValue.value = ''
    } else {
      message.error('变量添加失败')
    }
  } catch (error) {
    message.error(`添加变量失败: ${(error as Error).message}`)
  }
}

/**
 * 移除变量
 */
const removeVariable = (key: string) => {
  if (!selectedContext.value) return

  dialog.warning({
    title: '确认删除',
    content: `确定要删除变量 "${key}" 吗？`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      const success = defaultScriptEngine.contextManager.removeVariable(selectedContext.value!.id, key)

      if (success) {
        message.success('变量删除成功')
        loadContexts()
      } else {
        message.error('变量删除失败')
      }
    }
  })
}

/**
 * 克隆上下文
 */
const cloneContext = () => {
  if (!selectedContext.value) return

  dialog.create({
    title: '克隆上下文',
    content: () => {
      const nameRef = ref(`${selectedContext.value!.name} - 副本`)
      return h('div', [
        h('n-input', {
          value: nameRef.value,
          onUpdateValue: (value: string) => {
            nameRef.value = value
          },
          placeholder: '请输入新上下文名称'
        })
      ])
    },
    positiveText: '克隆',
    negativeText: '取消',
    onPositiveClick: () => {
      const newName = `${selectedContext.value!.name} - 副本`
      const cloned = defaultScriptEngine.contextManager.cloneContext(selectedContext.value!.id, newName)

      if (cloned) {
        message.success('上下文克隆成功')
        loadContexts()
        selectedContextId.value = cloned.id
      } else {
        message.error('上下文克隆失败')
      }
    }
  })
}

/**
 * 导出上下文配置
 */
const exportContext = async () => {
  if (!selectedContext.value) return

  const config = {
    name: selectedContext.value.name,
    variables: selectedContext.value.variables,
    exportTime: new Date().toISOString()
  }

  try {
    await navigator.clipboard.writeText(JSON.stringify(config, null, 2))
    message.success('上下文配置已复制到剪贴板')
  } catch (error) {
    message.error('导出失败')
  }
}

/**
 * 删除上下文
 */
const deleteContext = () => {
  if (!selectedContext.value || isSystemContext(selectedContext.value)) return

  dialog.warning({
    title: '确认删除',
    content: `确定要删除上下文 "${selectedContext.value.name}" 吗？此操作不可撤销。`,
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: () => {
      const success = defaultScriptEngine.contextManager.deleteContext(selectedContext.value!.id)

      if (success) {
        message.success('上下文删除成功')
        selectedContextId.value = ''
        loadContexts()
      } else {
        message.error('上下文删除失败')
      }
    }
  })
}

/**
 * 判断是否为系统上下文
 */
const isSystemContext = (context: ScriptExecutionContext): boolean => {
  const systemContexts = ['默认上下文', '数据处理上下文', 'IoT设备上下文']
  return systemContexts.includes(context.name)
}

/**
 * 运行上下文测试
 */
const runContextTest = async () => {
  if (!selectedContext.value || !testScript.value.trim()) {
    message.error('请选择上下文并输入测试脚本')
    return
  }

  testing.value = true

  try {
    // 执行脚本，使用选中的上下文
    const result = await defaultScriptEngine.executor.execute(
      {
        code: testScript.value,
        timeout: 5000
      },
      selectedContext.value
    )

    testResult.value = result

    if (result.success) {
      message.success(`测试执行成功 (${result.executionTime}ms)`)
    } else {
      message.error(`测试执行失败: ${result.error?.message}`)
    }
  } catch (error) {
    console.error('❌ [ContextManagerTest] 测试执行异常:', error)
    message.error(`测试执行异常: ${(error as Error).message}`)
  } finally {
    testing.value = false
  }
}

/**
 * 加载测试示例
 */
const loadTestExample = () => {
  testScript.value = `// 上下文变量访问测试
console.log('=== 上下文变量测试 ===');
console.log('所有变量:', Object.keys(this));

// 测试内置函数
const randomNum = random();
const currentTime = getCurrentTime();
const formattedTime = formatDate(new Date());

console.log('随机数:', randomNum);
console.log('当前时间戳:', currentTime);
console.log('格式化时间:', formattedTime);

// 测试数据处理函数
const testArray = [1, 2, 3, 4, 5];
const doubled = arrayMap(testArray, x => x * 2);
const filtered = arrayFilter(testArray, x => x > 2);

console.log('原数组:', testArray);
console.log('翻倍后:', doubled);
console.log('过滤后:', filtered);

return {
  contextInfo: {
    variableCount: Object.keys(this).length,
    hasGenerateId: typeof generateId === 'function',
    hasCurrentUser: typeof currentUser !== 'undefined'
  },
  randomValue: randomNum,
  timeInfo: {
    timestamp: currentTime,
    formatted: formattedTime
  },
  arrayTest: {
    original: testArray,
    doubled,
    filtered
  }
};`

  message.success('已加载测试示例')
}

/**
 * 格式化值显示
 */
const formatValue = (value: any): string => {
  if (typeof value === 'string') {
    return value.length > 50 ? `"${value.substring(0, 50)}..."` : `"${value}"`
  }
  if (typeof value === 'object') {
    try {
      const str = JSON.stringify(value, null, 2)
      return str.length > 200 ? `${str.substring(0, 200)}...` : str
    } catch {
      return '[Object]'
    }
  }
  return String(value)
}

// 组件挂载时加载数据
onMounted(() => {
  loadContexts()

  // 自动选择第一个上下文
  if (contexts.value.length > 0) {
    selectedContextId.value = contexts.value[0].id
  }
})
</script>

<style scoped>
.context-test {
  height: fit-content;
}

.variable-item {
  padding: 8px 12px;
  border-radius: 4px;
  background-color: var(--fill-color);
  margin: 4px 0;
}

:deep(.n-input__textarea-el) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}
</style>
