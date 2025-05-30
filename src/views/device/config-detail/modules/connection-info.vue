<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { NButton, NFormItem, NSelect } from 'naive-ui'
import {
  deviceConfigEdit,
  deviceConfigVoucherType,
  deviceProtocalServiceList,
  protocolPluginConfigForm
} from '@/service/api/device'
// protocolPluginConfigInput
import { $t } from '@/locales'
import FormInput from './form.vue'

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
})
</script>

<template>
  <div class="connection-box">
    <div class="connection-title">
      {{ $t('generate.through-protocol-access') }}
    </div>
    <n-scrollbar class="h-[400px] overflow-y-scroll">
      <NForm :model="extendForm" :rules="extendFormRules" label-placement="left" label-width="auto">
        <NFormItem :label="$t('generate.choose-protocol-or-Service')" path="protocol_type" class="w-300">
          <!-- <NSelect
            v-model:value="extendForm.protocol_type"
            :options="typeOptions"
            :placeholder="$t('generate.select-protocol-service')"
            label-field="name"
            value-field="service_identifier"
            @change="choseProtocolType"
          ></NSelect> -->
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
          <!-- <NSelect
            v-if="props.configInfo.device_type !== 1"
            v-model:value="extendForm.voucher_type"
            :options="connectOptions"
            :placeholder="$t('generate.select-authentication-type')"
          ></NSelect> -->
          <NInput
            v-if="props.configInfo.device_type !== 1"
            v-model:value="extendForm.voucher_type"
            :disabled="true"
            :placeholder="$t('generate.select-authentication-type')"
          />
        </NFormItem>
        <NFormItem>
          <!-- <NButton type="primary" @click="openForm">{{ $t('generate.data-parsing') }}</NButton> -->
          <FormInput v-model:protocol-config="protocol_config" :form-elements="formElements" :edit="true"></FormInput>
        </NFormItem>
        <NFormItem>
          <NButton type="primary" @click="handleSubmit">{{ $t('common.save') }}</NButton>
        </NFormItem>
        <NFlex justify="flex-end"></NFlex>
      </NForm>
    </n-scrollbar>
    <n-drawer v-model:show="active" height="90%" placement="bottom">
      <n-drawer-content :title="$t('generate.form-configuration')">
        <FormInput v-model:protocol-config="protocol_config" :form-elements="formElements"></FormInput>
      </n-drawer-content>
    </n-drawer>
  </div>
</template>

<style scoped lang="scss">
.connection-box {
  padding: 50px 10px;

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
</style>
