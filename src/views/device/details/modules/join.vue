<script setup lang="ts">
import { defineProps, onMounted, reactive, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInst, FormRules } from 'naive-ui'
import { NButton, NForm, NFormItem, NInput, NSelect } from 'naive-ui'
import type { SelectMixedOption } from 'naive-ui/es/select/src/interface'
import {
  devicCeonnectForm,
  getDeviceConnectInfo,
  getPlugininfoByService,
  updateDeviceVoucher
} from '@/service/api/device'
import { useDeviceDataStore } from '@/store/modules/device'
import { $t } from '@/locales'
const router = useRouter()
// 定义支持的表单元素类型
type FormElementType = 'input' | 'table' | 'select'
const formRef = ref<FormInst | null>(null)

const formRules = ref<FormRules>({})

// 定义选项接口，适用于 select 类型的表单元素
interface Option {
  label: string
  value: number | string
}

// 定义验证规则接口
interface Validate {
  message: string // 验证失败时显示的错误消息
  required?: boolean // 指定字段是否必填
  rules?: string // 用于验证字段值的正则表达式规则
  type?: 'number' | 'string' | 'array' | 'boolean' | 'object' // 验证的类型
}

// 定义表单元素接口
interface FormElement {
  type: FormElementType // 表单元素的类型
  dataKey: string // 用于唯一标识表单元素的键
  label: string // 显示为表单元素标签的文本
  options?: Option[] // 下拉选择的枚举选项，仅 select 类型时有效
  placeholder?: string // 提示文本，仅 input 类型时有效
  validate?: Validate // 包含表单验证规则的对象
  array?: FormElement[] // 仅 table 类型时有效，定义表格列的配置
}

const deviceDataStore = useDeviceDataStore()

const props = defineProps<{
  id: string
}>()
const formElements = ref<FormElement[]>([])
const formData = reactive({})
const getFormJson = async () => {
  const res = await devicCeonnectForm({ device_id: props.id })

  formElements.value = res.data
}
const connectInfo = ref<object>({})
const feachConnectInfo = async () => {
  const res = await getDeviceConnectInfo({ device_id: props.id })
  connectInfo.value = res.data
}

const pluginInfo = ref<object>({})
const getPlugininfoByServiceReq = async str => {
  const { error, data } = await getPlugininfoByService(str)
  if (!error) {
    pluginInfo.value = data
  }
}

onMounted(async () => {
  await deviceDataStore.fetchData(props.id)
  const service_identifier = deviceDataStore?.deviceData?.device_config?.protocol_type
  if (service_identifier) {
    getPlugininfoByServiceReq({ service_identifier })
  }

  feachConnectInfo()
  getFormJson()
})

watchEffect(() => {
  const str = deviceDataStore?.deviceData?.voucher || '{}'
  const thejson = JSON.parse(str)
  if (formElements.value && Array.isArray(formElements.value)) {
    formElements.value.forEach(element => {
      if (element.type === 'table' && Array.isArray(element.array)) {
        element.array.forEach(subElement => {
          formRules.value[element.dataKey] = subElement.validate || {}
          formData[subElement.dataKey] ??= thejson[subElement.dataKey] || ''
        })
      } else {
        formRules.value[element.dataKey] = element.validate || {}
        formData[element.dataKey] = thejson[element.dataKey] || ''
      }
    })
  }
})

const handleSubmit = async () => {
  await formRef.value?.validate()
  await updateDeviceVoucher({
    device_id: props.id,
    voucher: JSON.stringify(formData)
  })
  window.$message?.success($t('common.updateSuccess'))
}
const copy = async param => {
  const element = document.getElementById(param.toString())
  const range = document.createRange()
  range.selectNodeContents(element!)
  const selection = document.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
  document.execCommand('Copy')
  window.$message?.success($t('theme.configOperation.copySuccess'))
}
const toServiceClick = () => {
  if (deviceDataStore?.deviceData?.access_way === 'B') {
    router.push(
      `/device/service-details?id=${pluginInfo.value.id}&service_type=${pluginInfo.value.service_type}&service_name=${pluginInfo.value.name}&service_identifier=${pluginInfo.value.service_identifier}`
    )
  }
}
</script>

<template>
  <div>
    <n-descriptions label-placement="left" :column="1" class="mt-6">
      <n-descriptions-item :label="$t('generate.access-method-service')">
        <div :class="deviceDataStore?.deviceData?.access_way === 'B' ? 'blue-text' : ''" @click="toServiceClick">
          {{ deviceDataStore?.deviceData?.device_config?.protocol_type || '--' }}
        </div>
      </n-descriptions-item>
    </n-descriptions>

    <NCard v-if="deviceDataStore?.deviceData?.access_way !== 'B'" class="mb-6 mt-6">
      <NForm ref="formRef" :rules="formRules" :model="formData">
        <template v-for="element in formElements" :key="element.dataKey">
          <div v-if="element.type === 'input'" class="form-item">
            <NFormItem :label="element.label" :path="element.dataKey" style="height: 50px">
              <NInput v-model:value="formData[element.dataKey]" :placeholder="element.placeholder" />
            </NFormItem>
          </div>
          <div v-if="element.type === 'select'" class="form-item">
            <NFormItem :label="element.label" :path="element.dataKey">
              <NSelect v-model:value="formData[element.dataKey]" :options="element.options as SelectMixedOption[]" />
            </NFormItem>
          </div>
          <div v-if="element.type === 'table'">
            <!--          <div class="table-label">{{ element.label }}</div>-->
            <div class="table-content">
              <template v-for="subElement in element.array" :key="subElement.dataKey">
                <div v-if="subElement.type === 'input'" class="table-item">
                  <NFormItem :label="subElement.label" :path="subElement.dataKey">
                    <NInput v-model:value="formData[subElement.dataKey]" :placeholder="subElement.placeholder" />
                  </NFormItem>
                </div>
                <div v-if="subElement.type === 'select'" class="table-item">
                  <NFormItem :label="subElement.label" :path="subElement.dataKey">
                    <NSelect
                      v-model:value="formData[subElement.dataKey]"
                      :options="subElement.options as SelectMixedOption[]"
                    />
                  </NFormItem>
                </div>
              </template>
            </div>
          </div>
        </template>
      </NForm>
    </NCard>
    <n-scrollbar v-if="deviceDataStore?.deviceData?.access_way !== 'B'" class="h-400px">
      <NCard>
        <NDescriptions :column="1">
          <NDescriptionsItem v-for="(value, key, index) in connectInfo" :key="key" :index="index" :label="key">
            <span :id="index.toString()" class="font-600" @click="copy(index)">{{ value }}</span>
          </NDescriptionsItem>
        </NDescriptions>
      </NCard>
    </n-scrollbar>
    <div v-if="deviceDataStore?.deviceData?.access_way !== 'B'" class="mt-4 w-full flex-center">
      <NButton type="primary" @click="handleSubmit">{{ $t('common.save') }}</NButton>
    </div>
  </div>
</template>

<style scoped>
.form-item {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.form-item > * {
  width: 100%;
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
.blue-text {
  color: blue;
  cursor: pointer;
}
</style>
