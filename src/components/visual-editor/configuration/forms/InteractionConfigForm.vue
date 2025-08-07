<template>
  <div class="interaction-config-form">
    <div v-if="!hasInteractions" class="no-interaction-message">
      <n-alert type="info" size="small" :title="$t('config.interaction.noInteractions')" closable>
        {{ $t('config.interaction.noInteractionsDesc') }}
      </n-alert>

      <div class="add-interaction-actions">
        <n-space>
          <n-button size="small" @click="addInteraction('onClick')">
            {{ $t('config.interaction.addClick') }}
          </n-button>
          <n-button size="small" @click="addInteraction('onHover')">
            {{ $t('config.interaction.addHover') }}
          </n-button>
          <n-button size="small" @click="addInteraction('onDoubleClick')">
            {{ $t('config.interaction.addDoubleClick') }}
          </n-button>
        </n-space>
      </div>
    </div>

    <n-form
      v-else
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-placement="left"
      label-width="auto"
      size="small"
      class="config-form"
    >
      <!-- 交互事件配置 -->
      <template v-for="(eventConfig, eventName) in formData" :key="eventName">
        <div class="interaction-section">
          <div class="interaction-header">
            <h4 class="section-title">
              {{ getEventLabel(eventName) }}
            </h4>
            <n-button size="tiny" quaternary type="error" @click="removeInteraction(eventName)">
              {{ $t('common.remove') }}
            </n-button>
          </div>

          <n-form-item :label="$t('config.interaction.enabled')" :path="`${eventName}.enabled`">
            <n-switch v-model:value="eventConfig.enabled" :disabled="readonly" @update:value="handleChange" />
          </n-form-item>

          <template v-if="eventConfig.enabled !== false">
            <n-form-item :label="$t('config.interaction.type')" :path="`${eventName}.type`">
              <n-select
                v-model:value="eventConfig.type"
                :options="interactionTypeOptions"
                :disabled="readonly"
                clearable
                @update:value="value => handleTypeChange(eventName, value)"
              />
            </n-form-item>

            <!-- 无交互 -->
            <div v-if="eventConfig.type === 'none'" class="interaction-config">
              <n-alert type="info" size="small" :title="$t('config.interaction.none.title')">
                {{ $t('config.interaction.none.desc') }}
              </n-alert>
            </div>

            <!-- 外部链接 -->
            <div v-else-if="eventConfig.type === 'link'" class="interaction-config">
              <n-form-item :label="$t('config.interaction.link.url')" :path="`${eventName}.payload.url`">
                <n-input
                  v-model:value="eventConfig.payload.url"
                  :placeholder="$t('config.interaction.link.url.placeholder')"
                  :readonly="readonly"
                  clearable
                  @update:value="handleChange"
                />
              </n-form-item>

              <n-form-item :label="$t('config.interaction.link.newTab')" :path="`${eventName}.payload.newTab`">
                <n-switch
                  v-model:value="eventConfig.payload.newTab"
                  :disabled="readonly"
                  @update:value="handleChange"
                />
              </n-form-item>
            </div>

            <!-- 内部路由 -->
            <div v-else-if="eventConfig.type === 'internal_route'" class="interaction-config">
              <n-form-item :label="$t('config.interaction.route.path')" :path="`${eventName}.payload.route`">
                <n-input
                  v-model:value="eventConfig.payload.route"
                  :placeholder="$t('config.interaction.route.path.placeholder')"
                  :readonly="readonly"
                  clearable
                  @update:value="handleChange"
                />
              </n-form-item>

              <n-form-item :label="$t('config.interaction.route.params')" :path="`${eventName}.payload.routeParams`">
                <n-input
                  v-model:value="eventConfig.payload.routeParams"
                  type="textarea"
                  :rows="3"
                  :placeholder="$t('config.interaction.route.params.placeholder')"
                  :readonly="readonly"
                  class="json-input"
                  @update:value="handleChange"
                />
              </n-form-item>
            </div>

            <!-- 模态框 -->
            <div v-else-if="eventConfig.type === 'modal'" class="interaction-config">
              <n-form-item
                :label="$t('config.interaction.modal.title')"
                :path="`${eventName}.payload.modalConfig.title`"
              >
                <n-input
                  v-model:value="eventConfig.payload.modalConfig.title"
                  :placeholder="$t('config.interaction.modal.title.placeholder')"
                  :readonly="readonly"
                  clearable
                  @update:value="handleChange"
                />
              </n-form-item>

              <n-form-item
                :label="$t('config.interaction.modal.content')"
                :path="`${eventName}.payload.modalConfig.content`"
              >
                <n-input
                  v-model:value="eventConfig.payload.modalConfig.content"
                  type="textarea"
                  :rows="4"
                  :placeholder="$t('config.interaction.modal.content.placeholder')"
                  :readonly="readonly"
                  @update:value="handleChange"
                />
              </n-form-item>

              <n-form-item :label="$t('config.interaction.modal.size')">
                <n-space>
                  <n-input-number
                    v-model:value="eventConfig.payload.modalConfig.width"
                    :min="200"
                    :max="1200"
                    :readonly="readonly"
                    placeholder="宽度"
                    @update:value="handleChange"
                  />
                  <n-input-number
                    v-model:value="eventConfig.payload.modalConfig.height"
                    :min="150"
                    :max="800"
                    :readonly="readonly"
                    placeholder="高度"
                    @update:value="handleChange"
                  />
                </n-space>
              </n-form-item>
            </div>

            <!-- 抽屉 -->
            <div v-else-if="eventConfig.type === 'drawer'" class="interaction-config">
              <n-form-item
                :label="$t('config.interaction.drawer.title')"
                :path="`${eventName}.payload.drawerConfig.title`"
              >
                <n-input
                  v-model:value="eventConfig.payload.drawerConfig.title"
                  :placeholder="$t('config.interaction.drawer.title.placeholder')"
                  :readonly="readonly"
                  clearable
                  @update:value="handleChange"
                />
              </n-form-item>

              <n-form-item
                :label="$t('config.interaction.drawer.placement')"
                :path="`${eventName}.payload.drawerConfig.placement`"
              >
                <n-select
                  v-model:value="eventConfig.payload.drawerConfig.placement"
                  :options="drawerPlacementOptions"
                  :disabled="readonly"
                  @update:value="handleChange"
                />
              </n-form-item>

              <n-form-item
                :label="$t('config.interaction.drawer.width')"
                :path="`${eventName}.payload.drawerConfig.width`"
              >
                <n-input-number
                  v-model:value="eventConfig.payload.drawerConfig.width"
                  :min="200"
                  :max="800"
                  :readonly="readonly"
                  @update:value="handleChange"
                />
              </n-form-item>
            </div>

            <!-- 自定义脚本 -->
            <div v-else-if="eventConfig.type === 'custom_script'" class="interaction-config">
              <n-form-item :label="$t('config.interaction.script.code')" :path="`${eventName}.payload.script`">
                <n-input
                  v-model:value="eventConfig.payload.script"
                  type="textarea"
                  :rows="6"
                  :placeholder="$t('config.interaction.script.code.placeholder')"
                  :readonly="readonly"
                  class="code-input"
                  @update:value="handleChange"
                />
              </n-form-item>

              <n-form-item>
                <n-space>
                  <n-button size="small" :loading="testing" @click="testScript(eventName)">
                    {{ $t('config.interaction.script.test') }}
                  </n-button>
                  <n-button size="small" @click="insertScriptTemplate(eventName)">
                    {{ $t('config.interaction.script.template') }}
                  </n-button>
                </n-space>
              </n-form-item>
            </div>

            <!-- 发出事件 -->
            <div v-else-if="eventConfig.type === 'emit_event'" class="interaction-config">
              <n-form-item :label="$t('config.interaction.event.name')" :path="`${eventName}.payload.eventName`">
                <n-input
                  v-model:value="eventConfig.payload.eventName"
                  :placeholder="$t('config.interaction.event.name.placeholder')"
                  :readonly="readonly"
                  clearable
                  @update:value="handleChange"
                />
              </n-form-item>

              <n-form-item :label="$t('config.interaction.event.data')" :path="`${eventName}.payload.eventData`">
                <n-input
                  v-model:value="eventConfig.payload.eventData"
                  type="textarea"
                  :rows="3"
                  :placeholder="$t('config.interaction.event.data.placeholder')"
                  :readonly="readonly"
                  class="json-input"
                  @update:value="handleChange"
                />
              </n-form-item>
            </div>

            <!-- 高级选项 -->
            <div v-if="showAdvanced" class="advanced-options">
              <n-form-item :label="$t('config.interaction.condition')" :path="`${eventName}.condition`">
                <n-input
                  v-model:value="eventConfig.condition"
                  type="textarea"
                  :rows="2"
                  :placeholder="$t('config.interaction.condition.placeholder')"
                  :readonly="readonly"
                  class="code-input"
                  @update:value="handleChange"
                />
              </n-form-item>
            </div>
          </template>
        </div>
      </template>

      <!-- 添加交互按钮 -->
      <div class="add-interaction-section">
        <h4 class="section-title">{{ $t('config.interaction.addNew') }}</h4>
        <n-space>
          <n-dropdown :options="addInteractionOptions" @select="addInteraction">
            <n-button size="small" dashed>
              {{ $t('config.interaction.addInteraction') }}
            </n-button>
          </n-dropdown>
        </n-space>
      </div>

      <!-- 操作按钮 -->
      <div class="form-actions">
        <n-space>
          <n-button size="small" @click="handleReset">
            {{ $t('common.reset') }}
          </n-button>
          <n-button v-if="showAdvanced !== undefined" size="small" @click="$emit('toggle-advanced')">
            {{ showAdvanced ? $t('config.hideAdvanced') : $t('config.showAdvanced') }}
          </n-button>
        </n-space>
      </div>
    </n-form>
  </div>
</template>

<script setup lang="ts">
/**
 * 交互配置表单组件
 * 负责配置组件的交互行为，支持多种交互类型
 */

import { ref, reactive, watch, computed } from 'vue'
import {
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSwitch,
  NSelect,
  NButton,
  NSpace,
  NAlert,
  NDropdown,
  FormInst,
  FormRules,
  useMessage
} from 'naive-ui'
import type {
  InteractionConfiguration,
  ConfigFormProps,
  ConfigFormEmits,
  ValidationResult,
  InteractionConfig
} from '../types'

interface Props extends ConfigFormProps<InteractionConfiguration> {
  /** 是否显示高级选项 */
  showAdvanced?: boolean
}

interface Emits extends ConfigFormEmits<InteractionConfiguration> {
  (event: 'toggle-advanced'): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({}),
  readonly: false,
  showAdvanced: false
})

const emit = defineEmits<Emits>()

// 消息提示
const message = useMessage()

// 表单引用
const formRef = ref<FormInst>()

// 测试状态
const testing = ref(false)

// 表单数据
const formData = reactive<InteractionConfiguration>({
  ...props.modelValue
})

// 交互类型选项
const interactionTypeOptions = [
  { label: '无', value: 'none' },
  { label: '外部链接', value: 'link' },
  { label: '内部路由', value: 'internal_route' },
  { label: '模态框', value: 'modal' },
  { label: '抽屉', value: 'drawer' },
  { label: '自定义脚本', value: 'custom_script' },
  { label: '发出事件', value: 'emit_event' }
]

// 抽屉位置选项
const drawerPlacementOptions = [
  { label: '左侧', value: 'left' },
  { label: '右侧', value: 'right' },
  { label: '顶部', value: 'top' },
  { label: '底部', value: 'bottom' }
]

// 添加交互选项
const addInteractionOptions = [
  { label: '点击事件', key: 'onClick' },
  { label: '悬停事件', key: 'onHover' },
  { label: '双击事件', key: 'onDoubleClick' },
  { label: '右键事件', key: 'onRightClick' }
]

// 表单验证规则
const formRules: FormRules = {
  // 根据交互类型动态生成验证规则
}

// 计算是否有交互配置
const hasInteractions = computed(() => {
  return Object.keys(formData).length > 0
})

// 监听外部值变化
watch(
  () => props.modelValue,
  newValue => {
    if (newValue && JSON.stringify(newValue) !== JSON.stringify(formData)) {
      Object.assign(formData, newValue)
    }
  },
  { deep: true }
)

// 获取事件标签
const getEventLabel = (eventName: string): string => {
  const labels: Record<string, string> = {
    onClick: '点击事件',
    onHover: '悬停事件',
    onDoubleClick: '双击事件',
    onRightClick: '右键事件'
  }
  return labels[eventName] || eventName
}

// 创建默认交互配置
const createDefaultInteractionConfig = (type: string = 'none'): InteractionConfig => {
  const baseConfig: InteractionConfig = {
    type: type as any,
    enabled: true,
    payload: {}
  }

  // 根据类型设置默认 payload
  switch (type) {
    case 'link':
      baseConfig.payload = { url: '', newTab: true }
      break
    case 'internal_route':
      baseConfig.payload = { route: '', routeParams: '{}' }
      break
    case 'modal':
      baseConfig.payload = {
        modalConfig: {
          title: '模态框标题',
          content: '模态框内容',
          width: 400,
          height: 300
        }
      }
      break
    case 'drawer':
      baseConfig.payload = {
        drawerConfig: {
          title: '抽屉标题',
          placement: 'right',
          width: 300
        }
      }
      break
    case 'custom_script':
      baseConfig.payload = { script: '' }
      break
    case 'emit_event':
      baseConfig.payload = { eventName: '', eventData: '{}' }
      break
  }

  return baseConfig
}

// 添加交互
const addInteraction = (eventName: string) => {
  if (formData[eventName as keyof InteractionConfiguration]) {
    message.warning(`${getEventLabel(eventName)} 已存在`)
    return
  }

  formData[eventName as keyof InteractionConfiguration] = createDefaultInteractionConfig() as any
  handleChange()
}

// 移除交互
const removeInteraction = (eventName: string) => {
  delete formData[eventName as keyof InteractionConfiguration]
  handleChange()
}

// 处理交互类型变化
const handleTypeChange = (eventName: string, type: string) => {
  const eventConfig = formData[eventName as keyof InteractionConfiguration] as InteractionConfig
  if (eventConfig) {
    eventConfig.type = type as any
    // 重置 payload
    const defaultConfig = createDefaultInteractionConfig(type)
    eventConfig.payload = defaultConfig.payload
    handleChange()
  }
}

// 处理表单变化
const handleChange = () => {
  if (props.readonly) return

  // 发出配置更新事件
  const newConfig = { ...formData }
  emit('update:modelValue', newConfig)
  emit('change', newConfig, props.modelValue)
}

// 测试脚本
const testScript = async (eventName: string) => {
  testing.value = true
  try {
    // 这里应该调用实际的脚本测试逻辑
    await new Promise(resolve => setTimeout(resolve, 1000))
    message.success('脚本测试成功')
  } catch (error) {
    message.error('脚本测试失败')
  } finally {
    testing.value = false
  }
}

// 插入脚本模板
const insertScriptTemplate = (eventName: string) => {
  const template = `// 交互脚本
// 可以访问以下变量:
// - widget: 当前组件实例
// - event: 事件对象
// - context: 上下文数据

console.log('交互被触发', { widget, event, context })

// 在这里编写你的交互逻辑
// 例如：显示消息、修改数据、调用API等

return true // 返回 true 表示处理成功`

  const eventConfig = formData[eventName as keyof InteractionConfiguration] as InteractionConfig
  if (eventConfig && eventConfig.payload) {
    eventConfig.payload.script = template
    handleChange()
  }
}

// 重置表单
const handleReset = () => {
  if (props.readonly) return

  Object.keys(formData).forEach(key => {
    delete formData[key as keyof InteractionConfiguration]
  })

  emit('update:modelValue', {})
}

// 暴露验证方法
const validate = async (): Promise<ValidationResult> => {
  // 这里可以添加更复杂的验证逻辑
  return {
    valid: true,
    errors: undefined,
    warnings: undefined
  }
}

// 暴露公共方法
defineExpose({
  validate,
  reset: handleReset
})
</script>

<style scoped>
.interaction-config-form {
  padding: 0;
}

.no-interaction-message {
  padding: 16px;
  text-align: center;
}

.add-interaction-actions {
  margin-top: 12px;
}

.config-form {
  width: 100%;
}

.interaction-section {
  margin-bottom: 20px;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-color);
}

.interaction-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color);
  margin: 0;
}

.interaction-config {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-color);
}

.advanced-options {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed var(--warning-color);
  background: var(--warning-color-suppl);
  padding: 12px;
  border-radius: 4px;
}

.json-input,
.code-input {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
}

.add-interaction-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed var(--border-color);
}

.form-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

/* 只读状态样式 */
.interaction-config-form :deep(.n-input[readonly]),
.interaction-config-form :deep(.n-input-number[readonly]),
.interaction-config-form :deep(.n-switch[disabled]),
.interaction-config-form :deep(.n-select[disabled]) {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
