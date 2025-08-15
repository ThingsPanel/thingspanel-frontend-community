<template>
  <n-card title="脚本模板系统测试" class="template-test">
    <n-space vertical size="medium">
      <!-- 模板选择 -->
      <n-form-item label="选择模板" size="small">
        <n-select
          v-model:value="selectedTemplateId"
          :options="templateOptions"
          placeholder="请选择一个模板"
          clearable
          @update:value="onTemplateChange"
        />
      </n-form-item>

      <!-- 模板信息 -->
      <div v-if="selectedTemplate">
        <n-descriptions :column="2" size="small" bordered>
          <n-descriptions-item label="模板名称">
            {{ selectedTemplate.name }}
          </n-descriptions-item>
          <n-descriptions-item label="分类">
            <n-tag size="small">{{ selectedTemplate.category }}</n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="描述" :span="2">
            {{ selectedTemplate.description }}
          </n-descriptions-item>
          <n-descriptions-item label="创建时间" :span="2">
            {{ formatDate(selectedTemplate.createdAt) }}
          </n-descriptions-item>
        </n-descriptions>

        <!-- 模板代码预览 -->
        <n-card size="small" title="模板代码" embedded style="margin-top: 12px">
          <n-code
            :code="selectedTemplate.code"
            language="javascript"
            show-line-numbers
            style="max-height: 200px; overflow-y: auto"
          />
        </n-card>
      </div>

      <!-- 参数配置 -->
      <div v-if="selectedTemplate && selectedTemplate.parameters.length > 0">
        <n-text strong>参数配置</n-text>
        <n-form :model="templateParams" style="margin-top: 12px">
          <div v-for="param in selectedTemplate.parameters" :key="param.name" class="param-item">
            <n-form-item :label="param.name" :label-style="{ fontSize: '13px' }" size="small">
              <template #label>
                <n-space align="center" size="small">
                  <span>{{ param.name }}</span>
                  <n-tag :type="param.required ? 'error' : 'default'" size="tiny">
                    {{ param.required ? '必需' : '可选' }}
                  </n-tag>
                  <n-text depth="3" style="font-size: 11px">({{ param.type }})</n-text>
                  <n-tooltip v-if="param.description">
                    <template #trigger>
                      <n-icon size="14" style="cursor: help">
                        <InformationCircleOutline />
                      </n-icon>
                    </template>
                    {{ param.description }}
                  </n-tooltip>
                </n-space>
              </template>

              <!-- 根据参数类型显示不同输入组件 -->
              <component
                :is="getParamComponent(param.type)"
                v-model:value="templateParams[param.name]"
                :placeholder="getParamPlaceholder(param)"
                :disabled="executing"
                v-bind="getParamProps(param)"
              />
            </n-form-item>
          </div>
        </n-form>
      </div>

      <!-- 生成的代码预览 -->
      <div v-if="generatedCode">
        <n-card size="small" title="生成的代码" embedded>
          <template #header-extra>
            <n-button size="tiny" @click="copyGeneratedCode">复制代码</n-button>
          </template>
          <n-code
            :code="generatedCode"
            language="javascript"
            show-line-numbers
            style="max-height: 250px; overflow-y: auto"
          />
        </n-card>
      </div>

      <!-- 操作按钮 -->
      <n-space>
        <n-button
          type="primary"
          :loading="executing"
          :disabled="!selectedTemplateId || !isParamsValid"
          @click="executeTemplate"
        >
          <template #icon>
            <n-icon><PlayArrowRound /></n-icon>
          </template>
          执行模板
        </n-button>
        <n-button :disabled="!selectedTemplateId" @click="generateCode">生成代码</n-button>
        <n-button :disabled="executing" @click="resetParams">重置参数</n-button>
      </n-space>

      <!-- 执行结果 -->
      <n-card v-if="lastResult" size="small" title="执行结果" embedded>
        <template #header-extra>
          <n-tag :type="lastResult.success ? 'success' : 'error'" size="small">
            {{ lastResult.success ? '成功' : '失败' }}
          </n-tag>
        </template>

        <n-space vertical size="small">
          <n-descriptions :column="2" size="small">
            <n-descriptions-item label="执行时间">{{ lastResult.executionTime }}ms</n-descriptions-item>
            <n-descriptions-item label="使用模板">
              {{ selectedTemplate?.name }}
            </n-descriptions-item>
          </n-descriptions>

          <div v-if="lastResult.success && lastResult.data !== undefined">
            <n-text strong>执行结果:</n-text>
            <n-code
              :code="formatResult(lastResult.data)"
              language="json"
              show-line-numbers
              style="margin-top: 8px; max-height: 300px; overflow-y: auto"
            />
          </div>

          <div v-if="!lastResult.success && lastResult.error">
            <n-text strong type="error">错误信息:</n-text>
            <n-alert type="error" style="margin-top: 8px">
              {{ lastResult.error.message }}
            </n-alert>
          </div>
        </n-space>
      </n-card>
    </n-space>
  </n-card>
</template>

<script setup lang="ts">
/**
 * 脚本模板系统测试组件
 */

import { ref, computed, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { PlayArrowRound, InformationCircleOutline } from '@vicons/ionicons5'
import { defaultScriptEngine } from '@/core/script-engine'
import type { ScriptTemplate, ScriptExecutionResult } from '@/core/script-engine/types'

// 定义事件
const emit = defineEmits<{
  templateExecute: [templateId: string, result: ScriptExecutionResult]
}>()

const message = useMessage()

// 数据
const selectedTemplateId = ref<string>('')
const templateParams = ref<Record<string, any>>({})
const generatedCode = ref('')
const executing = ref(false)
const lastResult = ref<ScriptExecutionResult | null>(null)

// 获取所有模板
const allTemplates = computed(() => defaultScriptEngine.templateManager.getAllTemplates())

// 模板选项
const templateOptions = computed(() => {
  const grouped: Record<string, any[]> = {}

  allTemplates.value.forEach(template => {
    if (!grouped[template.category]) {
      grouped[template.category] = []
    }
    grouped[template.category].push({
      label: template.name,
      value: template.id
    })
  })

  return Object.keys(grouped).map(category => ({
    type: 'group',
    label: category,
    key: category,
    children: grouped[category]
  }))
})

// 当前选中的模板
const selectedTemplate = computed(() => {
  if (!selectedTemplateId.value) return null
  return defaultScriptEngine.templateManager.getTemplate(selectedTemplateId.value)
})

// 参数验证
const isParamsValid = computed(() => {
  if (!selectedTemplate.value) return false

  return selectedTemplate.value.parameters.every(param => {
    if (!param.required) return true
    const value = templateParams.value[param.name]
    return value !== undefined && value !== null && value !== ''
  })
})

/**
 * 模板变化处理
 */
const onTemplateChange = (templateId: string | null) => {
  if (!templateId) {
    templateParams.value = {}
    generatedCode.value = ''
    lastResult.value = null
    return
  }

  const template = defaultScriptEngine.templateManager.getTemplate(templateId)
  if (!template) return

  // 初始化参数为默认值
  const params: Record<string, any> = {}
  template.parameters.forEach(param => {
    params[param.name] = param.defaultValue
  })
  templateParams.value = params

  // 自动生成代码
  generateCode()
}

/**
 * 生成代码
 */
const generateCode = () => {
  if (!selectedTemplateId.value) return

  try {
    const code = defaultScriptEngine.templateManager.generateCode(selectedTemplateId.value, templateParams.value)
    generatedCode.value = code
    message.success('代码生成成功')
  } catch (error) {
    message.error(`代码生成失败: ${(error as Error).message}`)
    generatedCode.value = ''
  }
}

/**
 * 执行模板
 */
const executeTemplate = async () => {
  if (!selectedTemplateId.value || !isParamsValid.value) {
    message.error('请检查模板和参数配置')
    return
  }

  executing.value = true

  try {
    console.log('🚀 [ScriptTemplateTest] 执行模板:', selectedTemplateId.value, templateParams.value)

    const result = await defaultScriptEngine.executeTemplate(selectedTemplateId.value, templateParams.value)

    lastResult.value = result

    if (result.success) {
      message.success(`模板执行成功 (${result.executionTime}ms)`)
    } else {
      message.error(`模板执行失败: ${result.error?.message}`)
    }

    // 触发事件
    emit('templateExecute', selectedTemplateId.value, result)
  } catch (error) {
    console.error('❌ [ScriptTemplateTest] 模板执行异常:', error)
    message.error(`模板执行异常: ${(error as Error).message}`)
  } finally {
    executing.value = false
  }
}

/**
 * 重置参数
 */
const resetParams = () => {
  if (selectedTemplate.value) {
    const params: Record<string, any> = {}
    selectedTemplate.value.parameters.forEach(param => {
      params[param.name] = param.defaultValue
    })
    templateParams.value = params
    generateCode()
    message.success('参数已重置')
  }
}

/**
 * 复制生成的代码
 */
const copyGeneratedCode = async () => {
  if (!generatedCode.value) return

  try {
    await navigator.clipboard.writeText(generatedCode.value)
    message.success('代码已复制到剪贴板')
  } catch (error) {
    message.error('复制失败')
  }
}

/**
 * 获取参数组件
 */
const getParamComponent = (type: string) => {
  switch (type) {
    case 'number':
      return 'n-input-number'
    case 'boolean':
      return 'n-checkbox'
    case 'object':
    case 'array':
      return 'n-input'
    default:
      return 'n-input'
  }
}

/**
 * 获取参数占位符
 */
const getParamPlaceholder = (param: any) => {
  switch (param.type) {
    case 'string':
      return `请输入${param.name}`
    case 'number':
      return '请输入数字'
    case 'object':
      return '请输入JSON对象'
    case 'array':
      return '请输入JSON数组'
    default:
      return `请输入${param.name}`
  }
}

/**
 * 获取参数组件属性
 */
const getParamProps = (param: any) => {
  const props: any = {}

  switch (param.type) {
    case 'number':
      if (param.validation) {
        if (param.validation.min !== undefined) props.min = param.validation.min
        if (param.validation.max !== undefined) props.max = param.validation.max
      }
      break
    case 'string':
      if (param.validation && param.validation.enum) {
        // 如果有枚举值，使用选择器
        return {
          component: 'n-select',
          options: param.validation.enum.map((value: any) => ({
            label: String(value),
            value
          }))
        }
      }
      break
    case 'object':
    case 'array':
      props.type = 'textarea'
      props.rows = 3
      break
  }

  return props
}

/**
 * 格式化日期
 */
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
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

// 监听参数变化，自动重新生成代码
watch(
  () => templateParams.value,
  () => {
    if (selectedTemplateId.value) {
      generateCode()
    }
  },
  { deep: true }
)
</script>

<style scoped>
.template-test {
  height: fit-content;
}

.param-item {
  margin-bottom: 12px;
}

:deep(.n-form-item-label) {
  font-size: 13px;
}

:deep(.n-input__textarea-el) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}
</style>
