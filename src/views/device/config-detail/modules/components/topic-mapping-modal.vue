<script setup lang="ts">
import { ref, watch, computed, h } from 'vue'
import { NModal, NForm, NFormItem, NInput, NSelect, NButton, NPopover, useMessage, NText } from 'naive-ui'
import type { FormInst, FormRules, SelectRenderLabel, SelectRenderTag } from 'naive-ui'
import { useI18n } from 'vue-i18n'

interface TopicMapping {
  id?: string | number
  mapping_name: string
  direction: 'up' | 'down'
  original_topic: string
  target_topic: string
  data_identifier?: string
  description: string
  priority?: number
  enabled?: boolean
}

interface Props {
  visible: boolean
  editData?: TopicMapping | null
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  editData: null
})

interface Emits {
  (e: 'update:visible', visible: boolean): void
  (e: 'save', data: TopicMapping): void
}

const emit = defineEmits<Emits>()

const message = useMessage()
const formRef = ref<FormInst | null>(null)
const { t } = useI18n()

const formData = ref<TopicMapping>({
  mapping_name: '',
  direction: 'down',
  original_topic: '',
  target_topic: '',
  data_identifier: '',
  description: '',
  priority: 0,
  enabled: true
})

interface TopicOptionSource {
  value: string
  label: string
  descriptionKey: string
}

const dataDirectionOptions = computed(() => [
  {
    label: t('generate.topicMapping.direction.down'),
    value: 'down'
  },
  {
    label: t('generate.topicMapping.direction.up'),
    value: 'up'
  }
])

const uplinkTopicOptionSource: TopicOptionSource[] = [
  {
    label: 'devices/telemetry',
    value: 'devices/telemetry',
    descriptionKey: 'generate.topicMapping.options.uplink.devicesTelemetry'
  },
  {
    label: 'devices/attributes/{message_id}',
    value: 'devices/attributes/{message_id}',
    descriptionKey: 'generate.topicMapping.options.uplink.devicesAttributes'
  },
  {
    label: 'devices/event/{message_id}',
    value: 'devices/event/{message_id}',
    descriptionKey: 'generate.topicMapping.options.uplink.devicesEvent'
  },
  {
    label: 'ota/devices/progress',
    value: 'ota/devices/progress',
    descriptionKey: 'generate.topicMapping.options.uplink.otaProgress'
  },
  {
    label: 'gateway/telemetry',
    value: 'gateway/telemetry',
    descriptionKey: 'generate.topicMapping.options.uplink.gatewayTelemetry'
  },
  {
    label: 'gateway/attributes/{message_id}',
    value: 'gateway/attributes/{message_id}',
    descriptionKey: 'generate.topicMapping.options.uplink.gatewayAttributes'
  },
  {
    label: 'gateway/event/{message_id}',
    value: 'gateway/event/{message_id}',
    descriptionKey: 'generate.topicMapping.options.uplink.gatewayEvent'
  },
  {
    label: 'devices/command/response/{message_id}',
    value: 'devices/command/response/{message_id}',
    descriptionKey: 'generate.topicMapping.options.uplink.devicesCommandResponse'
  },
  {
    label: 'devices/attributes/set/response/{message_id}',
    value: 'devices/attributes/set/response/{message_id}',
    descriptionKey: 'generate.topicMapping.options.uplink.devicesAttributesResponse'
  },
  {
    label: 'gateway/command/response/{message_id}',
    value: 'gateway/command/response/{message_id}',
    descriptionKey: 'generate.topicMapping.options.uplink.gatewayCommandResponse'
  },
  {
    label: 'gateway/attributes/set/response/{message_id}',
    value: 'gateway/attributes/set/response/{message_id}',
    descriptionKey: 'generate.topicMapping.options.uplink.gatewayAttributesResponse'
  }
]

const downlinkTopicOptionSource: TopicOptionSource[] = [
  {
    label: 'devices/telemetry/control/{device_number}',
    value: 'devices/telemetry/control/{device_number}',
    descriptionKey: 'generate.topicMapping.options.downlink.devicesTelemetryControl'
  },
  {
    label: 'devices/attributes/set/{device_number}/+',
    value: 'devices/attributes/set/{device_number}/+',
    descriptionKey: 'generate.topicMapping.options.downlink.devicesAttributesSet'
  },
  {
    label: 'devices/attributes/get/{device_number}',
    value: 'devices/attributes/get/{device_number}',
    descriptionKey: 'generate.topicMapping.options.downlink.devicesAttributesGet'
  },
  {
    label: 'devices/command/{device_number}/+',
    value: 'devices/command/{device_number}/+',
    descriptionKey: 'generate.topicMapping.options.downlink.devicesCommand'
  },
  {
    label: 'ota/devices/inform/{device_number}',
    value: 'ota/devices/inform/{device_number}',
    descriptionKey: 'generate.topicMapping.options.downlink.otaInform'
  },
  {
    label: 'gateway/telemetry/control/{device_number}',
    value: 'gateway/telemetry/control/{device_number}',
    descriptionKey: 'generate.topicMapping.options.downlink.gatewayTelemetryControl'
  },
  {
    label: 'gateway/attributes/set/{device_number}/+',
    value: 'gateway/attributes/set/{device_number}/+',
    descriptionKey: 'generate.topicMapping.options.downlink.gatewayAttributesSet'
  },
  {
    label: 'gateway/attributes/get/{device_number}',
    value: 'gateway/attributes/get/{device_number}',
    descriptionKey: 'generate.topicMapping.options.downlink.gatewayAttributesGet'
  },
  {
    label: 'gateway/command/{device_number}/+',
    value: 'gateway/command/{device_number}/+',
    descriptionKey: 'generate.topicMapping.options.downlink.gatewayCommand'
  },
  {
    label: 'devices/attributes/response/{device_number}/+',
    value: 'devices/attributes/response/{device_number}/+',
    descriptionKey: 'generate.topicMapping.options.downlink.devicesAttributesResponse'
  },
  {
    label: 'devices/event/response/{device_number}/+',
    value: 'devices/event/response/{device_number}/+',
    descriptionKey: 'generate.topicMapping.options.downlink.devicesEventResponse'
  },
  {
    label: 'gateway/attributes/response/{device_number}/+',
    value: 'gateway/attributes/response/{device_number}/+',
    descriptionKey: 'generate.topicMapping.options.downlink.gatewayAttributesResponse'
  },
  {
    label: 'gateway/event/response/{device_number}/+',
    value: 'gateway/event/response/{device_number}/+',
    descriptionKey: 'generate.topicMapping.options.downlink.gatewayEventResponse'
  }
]

const uplinkTopicOptions = computed(() =>
  uplinkTopicOptionSource.map(option => ({
    label: option.label,
    value: option.value,
    description: t(option.descriptionKey)
  }))
)

const downlinkTopicOptions = computed(() =>
  downlinkTopicOptionSource.map(option => ({
    label: option.label,
    value: option.value,
    description: t(option.descriptionKey)
  }))
)

const targetTopicOptions = computed(() =>
  formData.value.direction === 'up' ? uplinkTopicOptions.value : downlinkTopicOptions.value
)

const showDataIdentifier = computed(() => formData.value.target_topic === 'devices/command/{device_number}/+')

const rules = computed<FormRules>(() => ({
  mapping_name: [
    {
      required: true,
      message: t('generate.topicMapping.validation.mappingName'),
      trigger: 'blur'
    }
  ],
  direction: [
    {
      required: true,
      message: t('generate.topicMapping.validation.direction'),
      trigger: 'change'
    }
  ],
  original_topic: [
    {
      required: true,
      message: t('generate.topicMapping.validation.originalTopic'),
      trigger: 'blur'
    }
  ],
  target_topic: [
    {
      required: true,
      message: t('generate.topicMapping.validation.targetTopic'),
      trigger: 'change'
    }
  ],
  data_identifier: [
    {
      validator: () => {
        if (!showDataIdentifier.value) return true
        return !!formData.value.data_identifier
      },
      message: t('generate.topicMapping.validation.dataIdentifier'),
      trigger: ['blur', 'change']
    }
  ]
}))

// 控制弹窗显示
const modalVisible = computed({
  get() {
    return props.visible
  },
  set(value) {
    emit('update:visible', value)
  }
})

// 监听编辑数据变化
watch(
  () => props.editData,
  newData => {
    if (newData) {
      formData.value = {
        id: newData.id,
        mapping_name: newData.mapping_name || '',
        direction: newData.direction || 'down',
        original_topic: newData.original_topic || '',
        target_topic: newData.target_topic || '',
        data_identifier: newData.data_identifier || '',
        description: newData.description || '',
        priority: newData.priority ?? 0,
        enabled: newData.enabled ?? true
      }
    } else {
      // 重置表单
      formData.value = {
        mapping_name: '',
        direction: 'down',
        original_topic: '',
        target_topic: '',
        data_identifier: '',
        description: '',
        priority: 0,
        enabled: true
      }
    }
  },
  { immediate: true }
)

// 监听数据方向变化，重置目标主题
watch(
  () => formData.value.direction,
  () => {
    formData.value.target_topic = ''
  }
)

watch(
  () => formData.value.target_topic,
  value => {
    if (value !== 'devices/command/{device_number}/+') {
      formData.value.data_identifier = ''
    }
  }
)

// 监听弹窗显示状态，关闭时重置表单
watch(
  () => props.visible,
  visible => {
    if (!visible) {
      formRef.value?.restoreValidation()
      if (!props.editData) {
        formData.value = {
          mapping_name: '',
          direction: 'down',
          original_topic: '',
          target_topic: '',
        data_identifier: '',
          description: '',
          priority: 0,
          enabled: true
        }
      }
    }
  }
)

// 保存
const handleSave = async () => {
  try {
    await formRef.value?.validate()
    emit('save', { ...formData.value })
    modalVisible.value = false
  } catch (error) {
    message.error(t('generate.topicMapping.message.validateForm'))
  }
}

// 取消
const handleCancel = () => {
  modalVisible.value = false
}

// 渲染目标主题标签（下拉选项中的显示）
const renderTopicLabel: SelectRenderLabel = (option) => {
  const topicOption = option as { label: string; value: string; description: string }
  return h(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center'
      }
    },
    [
      h(
        'div',
        {
          style: {
            flex: 1,
            padding: '4px 0'
          }
        },
        [
          h('div', { style: { fontSize: '14px', color: '#333', lineHeight: '1.5' } }, topicOption.label as string),
          h(
            NText,
            { depth: 3, tag: 'div', style: { fontSize: '12px', lineHeight: '1.4', marginTop: '2px' } },
            {
              default: () => topicOption.description as string
            }
          )
        ]
      )
    ]
  )
}

// 渲染目标主题标签（选中后显示在输入框中）
const renderTopicTag: SelectRenderTag = ({ option }) => {
  const topicOption = option as { label: string; value: string; description: string }
  return h(
    'div',
    {
      style: {
        display: 'flex',
        alignItems: 'center'
      }
    },
    [
      h('div', { style: { fontSize: '14px' } }, topicOption.label as string)
    ]
  )
}
</script>

<template>
  <NModal
    v-model:show="modalVisible"
    preset="dialog"
    :title="editData ? t('generate.topicMapping.modal.editTitle') : t('generate.topicMapping.modal.createTitle')"
    style="width: 600px"
    :mask-closable="false"
    :showIcon="false"
  >
    <NForm
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-placement="left"
      label-align="left"
      label-width="auto"
      class="mt-6"
      require-mark-placement="right-hanging"
    >
      <NFormItem :label="t('generate.topicMapping.form.mappingName')" path="mapping_name">
        <NInput v-model:value="formData.mapping_name" :placeholder="t('generate.topicMapping.placeholder.input')" />
      </NFormItem>

      <NFormItem :label="t('generate.topicMapping.form.direction')" path="direction">
        <NSelect
          v-model:value="formData.direction"
          :options="dataDirectionOptions"
          :placeholder="t('generate.topicMapping.placeholder.selectDirection')"
        />
      </NFormItem>

      <NFormItem :label="t('generate.topicMapping.form.originalTopic')" path="original_topic">
        <NInput v-model:value="formData.original_topic" :placeholder="t('generate.topicMapping.placeholder.input')" />
        <template #feedback>
          <div class="form-tip">
            <NPopover trigger="click">
              <template #trigger>
                <NButton text size="small" class="text-primary">
                  {{ t('generate.topicMapping.viewGuide') }}</NButton>
              </template>
              <div class="detailed-tip">
                <template v-if="formData.direction === 'up'">
                  <div class="tip-title">{{ t('generate.topicMapping.tips.uplink.title') }}</div>
                  <div class="tip-content">
                    <div class="tip-section">
                      <div class="tip-label">{{ t('generate.topicMapping.tips.definitionLabel') }}</div>
                      <div class="tip-text">{{ t('generate.topicMapping.tips.uplink.definition') }}</div>
                    </div>
                    <div class="tip-section">
                      <div class="tip-label">{{ t('generate.topicMapping.tips.exampleLabel') }}</div>
                      <div class="tip-text">{{ t('generate.topicMapping.tips.uplink.example') }}</div>
                    </div>
                    <div class="tip-section">
                      <div class="tip-label">{{ t('generate.topicMapping.tips.messageIdLabel') }}</div>
                      <div class="tip-text">{{ t('generate.topicMapping.tips.uplink.messageIdLine1') }}</div>
                      <div class="tip-text">{{ t('generate.topicMapping.tips.uplink.messageIdLine2') }}</div>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="tip-title">{{ t('generate.topicMapping.tips.downlink.title') }}</div>
                  <div class="tip-content">
                    <div class="tip-section">
                      <div class="tip-label">{{ t('generate.topicMapping.tips.definitionLabel') }}</div>
                      <div class="tip-text">{{ t('generate.topicMapping.tips.downlink.definition') }}</div>
                    </div>
                    <div class="tip-section">
                      <div class="tip-label">{{ t('generate.topicMapping.tips.exampleLabel') }}</div>
                      <div class="tip-text">{{ t('generate.topicMapping.tips.downlink.example') }}</div>
                    </div>
                  </div>
                </template>
              </div>
            </NPopover>
          </div>
        </template>
      </NFormItem>

      <NFormItem :label="t('generate.topicMapping.form.targetTopic')" path="target_topic" class="mt-4">
        <NSelect
          v-model:value="formData.target_topic"
          :options="targetTopicOptions"
          :placeholder="t('generate.topicMapping.placeholder.selectTarget')"
          :render-label="renderTopicLabel"
          :render-tag="renderTopicTag"
        />
      </NFormItem>

      <NFormItem
        v-if="showDataIdentifier"
        :label="t('generate.topicMapping.form.dataIdentifier')"
        path="data_identifier"
      >
        <NInput v-model:value="formData.data_identifier" :placeholder="t('generate.topicMapping.placeholder.input')" />
      </NFormItem>

      <NFormItem :label="t('generate.topicMapping.form.description')" path="description">
        <NInput
          v-model:value="formData.description"
          :placeholder="t('generate.topicMapping.placeholder.input')"
          type="textarea"
          :rows="3"
        />
      </NFormItem>
    </NForm>

    <template #action>
      <div class="modal-footer">
        <NButton @click="handleCancel">{{ t('common.cancel') }}</NButton>
        <NButton type="primary" @click="handleSave">{{ t('common.save') }}</NButton>
      </div>
    </template>
  </NModal>
</template>

<style scoped lang="scss">
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: #999;
  line-height: 1.5;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.detailed-tip {
  min-width: 450px;
  width: 750px;
  padding: 8px 12px;
  
  .tip-title {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin-bottom: 8px;
  }
  
  .tip-content {
    font-size: 14px;
    line-height: 1.6;
  }
  
  .tip-section {
    margin-bottom: 12px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .tip-label {
    font-weight: 500;
    color: #333;
    margin-bottom: 4px;
  }
  
  .tip-text {
    color: #666;
    margin-bottom: 6px;
    padding-left: 8px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.topic-option {
  padding: 4px 0;
  
  .topic-option-label {
    font-size: 14px;
    color: #333;
    line-height: 1.5;
    margin-bottom: 2px;
  }
  
  .topic-option-desc {
    font-size: 12px;
    color: #999;
    line-height: 1.4;
  }
}
</style>

