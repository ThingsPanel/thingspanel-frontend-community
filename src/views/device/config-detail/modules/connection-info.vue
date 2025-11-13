<script setup lang="ts">
import { onMounted, ref, h, watch, computed } from 'vue'
import {
  deviceConfigEdit,
  deviceConfigVoucherType,
  deviceProtocalServiceList,
  protocolPluginConfigForm,
  getTopicMappingList,
  createTopicMapping,
  updateTopicMapping,
  deleteTopicMapping
} from '@/service/api/device'
// protocolPluginConfigInput
import { $t } from '@/locales'
import FormInput from './form.vue'
import TopicMappingModal from './components/topic-mapping-modal.vue'
import { NButton, NPopconfirm, NSpace, NDataTable, useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useI18n } from 'vue-i18n'

type FormElementType = 'input' | 'table' | 'select'

interface Option {
  label: string
  value: number | string
}

interface Validate {
  message: string // 验证失败时显示的错误消息
  required?: boolean // 指定字段是否必填
  rules?: string // 用于验证字段值的正则表达式规则
  type?: 'number' | 'string' | 'array' | 'boolean' | 'object' // 验证的类型
}

interface FormElement {
  type: FormElementType // 表单元素的类型
  dataKey: string // 用于唯一标识表单元素的键
  label: string // 显示为表单元素标签的文本
  options?: Option[] // 下拉选择的枚举选项，仅 select 类型时有效
  placeholder?: string // 提示文本，仅 input 类型时有效
  validate?: Validate // 包含表单验证规则的对象
  array?: FormElement[] // 仅 table 类型时有效，定义表格列的配置
}

const formElements = ref<FormElement[]>([])

interface Emits {
  (e: 'upDateConfig'): void
}

const emit = defineEmits<Emits>()

const typeOptions: any = ref([])
const active: any = ref(false)

interface Props {
  configInfo?: object | any
}

const props = withDefaults(defineProps<Props>(), {
  configInfo: null
})
const extendForm = ref({
  protocol_type: null,
  voucher_type: null
} as any)
const extendFormRules = ref({})
const protocol_config = ref({})

// 主题映射表格相关
interface TopicMapping {
  id?: string | number
  mapping_name: string
  direction: 'up' | 'down'
  description: string
  original_topic: string
  target_topic: string
  priority?: number
  enabled?: boolean
}

const topicMappingList = ref<TopicMapping[]>([])
const topicMappingModalVisible = ref(false)
const currentEditTopicMapping = ref<TopicMapping | null>(null)
const topicMappingLoading = ref(false)
const message = useMessage()
const { t } = useI18n()

const topicMappingColumns = computed<DataTableColumns<TopicMapping>>(() => [
  {
    title: t('generate.topicMapping.column.mappingName'),
    key: 'mapping_name',
    align: 'left'
  },
  {
    title: t('common.description'),
    key: 'description',
    align: 'left'
  },
  {
    title: t('generate.topicMapping.column.originalTopic'),
    key: 'original_topic',
    align: 'left'
  },
  {
    title: t('generate.topicMapping.column.targetTopic'),
    key: 'target_topic',
    align: 'left'
  },
  {
    title: t('common.actions'),
    key: 'actions',
    align: 'center',
    width: 150,
    render: row => {
      return h(NSpace, { justify: 'center' }, {
        default: () => [
          h(
            NButton,
            {
              type: 'primary',
              size: 'small',
              text: true,
              onClick: () => handleEditTopicMapping(row)
            },
            { default: () => t('common.edit') }
          ),
          h(
            NPopconfirm,
            {
              onPositiveClick: () => handleDeleteTopicMapping(row)
            },
            {
              default: () => t('common.confirmDelete'),
              trigger: () =>
                h(
                  NButton,
                  {
                    type: 'error',
                    size: 'small',
                    text: true
                  },
                  { default: () => t('common.delete') }
                )
            }
          )
        ]
      })
    }
  }
])

const handleEditTopicMapping = (row: TopicMapping) => {
  currentEditTopicMapping.value = { ...row }
  topicMappingModalVisible.value = true
}

const handleDeleteTopicMapping = async (row: TopicMapping) => {
  if (!row.id) return
  try {
    await deleteTopicMapping(row.id)
    await fetchTopicMappings()
  } catch (error) {
    message.error(t('generate.topicMapping.message.deleteFailed'))
  }
}

const handleAddTopicMapping = () => {
  currentEditTopicMapping.value = null
  topicMappingModalVisible.value = true
}

const normalizeTopicMapping = (item: any): TopicMapping => ({
  id: item.id,
  mapping_name: item.name ?? '',
  direction: item.direction === 'up' ? 'up' : 'down',
  description: item.description ?? '',
  original_topic: item.source_topic ?? '',
  target_topic: item.target_topic ?? '',
  priority: item.priority ?? 0,
  enabled: item.enabled ?? true
})

const fetchTopicMappings = async () => {
  if (!props.configInfo?.id) {
    topicMappingList.value = []
    return
  }
  topicMappingLoading.value = true
  try {
    const res = await getTopicMappingList({
      device_config_id: props.configInfo.id
    })
    const list = res.data.list
    topicMappingList.value = list.map((item: any) =>
      normalizeTopicMapping(item)
    )
  } catch (error) {
    message.error(t('generate.topicMapping.message.fetchFailed'))
  } finally {
    topicMappingLoading.value = false
  }
}

const handleSaveTopicMapping = async (data: TopicMapping) => {
  if (!props.configInfo?.id) return
  const payload = {
    device_config_id: props.configInfo.id,
    name: data.mapping_name?.trim(),
    direction: data.direction,
    source_topic: data.original_topic?.trim(),
    target_topic: data.target_topic?.trim(),
    description: data.description,
    priority: data.priority ?? 0,
    enabled: data.enabled ?? true
  }
  try {
    if (data.id) {
      await updateTopicMapping(data.id, payload)
      message.success(t('generate.topicMapping.message.updateSuccess'))
    } else {
      await createTopicMapping(payload)
      message.success(t('generate.topicMapping.message.createSuccess'))
    }
    currentEditTopicMapping.value = null
    await fetchTopicMappings()
  } catch (error) {
    message.error(t('generate.topicMapping.message.saveFailed'))
  }
}

const handleSubmit = async () => {
  const postData = props.configInfo
  postData.protocol_type = extendForm.value.protocol_type
  postData.voucher_type = extendForm.value.voucher_type
  postData.protocol_config = JSON.stringify(protocol_config.value)

  const res = await deviceConfigEdit(postData)
  if (!res.error) {
    // message.success('修改成功');
    emit('upDateConfig')
  }
}

const getProtocolList = async (deviceCode: string) => {
  const queryData = {
    device_type: deviceCode
  }
  const res = await deviceProtocalServiceList(queryData)
  typeOptions.value = [
    {
      type: 'group',
      name: $t('common.protocol'),
      key: 'protocol',
      children: res.data.protocol || []
    },
    {
      type: 'group',
      name: $t('common.service'),
      key: 'service',
      children: res.data.service || []
    }
  ]
}

const connectOptions = ref([] as any)
const getConfigForm = async data => {
  const res = await protocolPluginConfigForm({
    device_type: props.configInfo.device_type,
    protocol_type: data
  })
  formElements.value = res.data
}
const getVoucherType = async data => {
  connectOptions.value = []
  const res = await deviceConfigVoucherType({
    device_type: props.configInfo.device_type,
    protocol_type: data
  })
  if (res.data) {
    connectOptions.value = Object.keys(res.data).map(key => {
      return { label: key, value: res.data[key] }
    })
  }
}

// const openForm = () => {
//   active.value = true;
// };

// const choseProtocolType = async data => {
//   extendForm.value.voucher_type = null;
//   // connectOptions.value = [];
//   await getVoucherType(data);
//   await getConfigForm(data);
// };

onMounted(async () => {
  if (props.configInfo.protocol_config) {
    protocol_config.value = JSON.parse(props.configInfo.protocol_config)
  }
  getProtocolList(props.configInfo.device_type)
  extendForm.value = props.configInfo
  await getVoucherType(extendForm.value.protocol_type)

  await getConfigForm(extendForm.value.protocol_type)
  await fetchTopicMappings()
})

watch(
  () => props.configInfo?.id,
  async newId => {
    if (newId) {
      await fetchTopicMappings()
    } else {
      topicMappingList.value = []
    }
  }
)
</script>

<template>
  <div class="connection-box">
    <div class="text-18px">{{ $t('generate.through-protocol-access') }}</div>
    <NForm class="mt-4" :model="extendForm" :rules="extendFormRules" label-placement="left" label-width="auto">
      <NFormItem :label="$t('generate.choose-protocol-or-Service')" path="protocol_type" class="w-300">
        <NSelect
          v-model:value="extendForm.protocol_type"
          :placeholder="$t('generate.select-protocol-service')"
          label-field="name"
          :disabled="true"
          value-field="service_identifier"
        ></NSelect>
      </NFormItem>
      <NFormItem
        v-show="configInfo.device_type !== '3'"
        :label="$t('generate.authentication-type')"
        path="voucher_type"
        class="w-300"
      >
        <NInput
          v-if="props.configInfo.device_type !== 1"
          v-model:value="extendForm.voucher_type"
          :disabled="true"
          :placeholder="$t('generate.select-authentication-type')"
        />
      </NFormItem>
      <NFormItem v-if="formElements?.length > 0">
        <FormInput v-model:protocol-config="protocol_config" :form-elements="formElements" :edit="true"></FormInput>
      </NFormItem>
      <!-- 主题映射 -->
      <NFormItem class="topic-mapping-form-item">
        <div class="topic-mapping-section">
          <div class="topic-mapping-header">
            <div class="text-18px">{{ t('generate.topicMapping.sectionTitle') }}</div>
            <NButton type="primary" @click="handleAddTopicMapping">{{ t('common._add') }}</NButton>
          </div>
          <NDataTable
            :columns="topicMappingColumns"
            :data="topicMappingList"
            :bordered="false"
            :loading="topicMappingLoading"
            class="topic-mapping-table"
          />
        </div>
      </NFormItem>
      <NFormItem>
        <NButton type="primary" @click="handleSubmit">{{ $t('common.save') }}</NButton>
      </NFormItem>
      <NFlex justify="flex-end"></NFlex>
    </NForm>
    <n-drawer v-model:show="active" height="90%" placement="bottom">
      <n-drawer-content :title="$t('generate.form-configuration')">
        <FormInput v-model:protocol-config="protocol_config" :form-elements="formElements"></FormInput>
      </n-drawer-content>
    </n-drawer>
    <!-- 主题映射弹窗 -->
    <TopicMappingModal
      v-model:visible="topicMappingModalVisible"
      :edit-data="currentEditTopicMapping"
      @save="handleSaveTopicMapping"
    />
  </div>
</template>

<style scoped lang="scss">
.connection-box {

  .connection-title {
    font-size: 15px;
    font-weight: bold;
    margin-bottom: 20px;
  }

  .w-300 {
    width: 400px;
  }
}

.table-label {
  font-weight: bold;
  margin-bottom: 10px;
}

.table-content {
  margin-left: 20px;
}

.table-item {
  margin-bottom: 8px;
}

.topic-mapping-form-item {
  margin-top: 8px !important;
}

.topic-mapping-section {
  width: 100%;

  .topic-mapping-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;

    .topic-mapping-title {
      font-size: 15px;
      font-weight: bold;
    }
  }

  .topic-mapping-table {
    width: 100%;
  }
}
</style>
