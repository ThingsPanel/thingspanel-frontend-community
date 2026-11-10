<script setup lang="ts">
import { onBeforeUnmount, reactive, ref, watch, watchEffect } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import { NAlert, NButton, NForm, NFormItem, NInput, NSelect, NSpin } from 'naive-ui'
import type { SelectMixedOption } from 'naive-ui/es/select/src/interface'
import { devicCeonnectForm, getDeviceConnectInfo, updateDeviceVoucher } from '@/service/api/device'
import { $t } from '@/locales'

const formRef = ref<FormInst | null>(null)

const formRules = ref<FormRules>({})
// 定义支持的表单元素类型
type FormElementType = 'input' | 'table' | 'select'

// 定义选项接口，适用于 select 类型的表单元素
interface Option {
  label: string
  value: number | string
}

// 定义验证规则接口
interface Validate {
  message?: string // 验证失败时显示的错误消息
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

const props = defineProps<{
  nextCallback: () => void
  device_id: string
  formData: object
  setIsSuccess: (flag: boolean) => void
}>()

// eslint-disable-next-line vue/no-dupe-keys
const formData = reactive({})
const formElements = ref<FormElement[]>([])
const connectInfo = ref<object>({})
const loading = ref(true)
const loadFailed = ref(false)
const saving = ref(false)
let loadVersion = 0
const loadConfiguration = async () => {
  const version = ++loadVersion
  loading.value = true
  loadFailed.value = false
  formElements.value = []
  connectInfo.value = {}
  Object.keys(formData).forEach(key => delete formData[key])
  formRules.value = {}
  try {
    const [form, info] = await Promise.all([
      devicCeonnectForm({ device_id: props.device_id }),
      getDeviceConnectInfo({ device_id: props.device_id })
    ])
    if (version !== loadVersion) return
    if (form.error || info.error || (form.data != null && !Array.isArray(form.data))) throw new Error('configuration')
    // A successful null form means no independent credentials (e.g. a child device).
    formElements.value = form.data || []
    connectInfo.value = info.data || {}
  } catch {
    if (version === loadVersion) loadFailed.value = true
  } finally {
    if (version === loadVersion) loading.value = false
  }
}
watch(() => props.device_id, loadConfiguration, { immediate: true })
onBeforeUnmount(() => {
  loadVersion++
})
watchEffect(() => {
  if (formElements.value.length) {
    formElements.value.forEach(element => {
      if (element.type === 'table' && Array.isArray(element.array)) {
        element.array.forEach(subElement => {
          formRules.value[element.dataKey] = subElement.validate || {}
          formData[subElement.dataKey] ??= props.formData[subElement.dataKey] || ''
        })
      } else {
        formRules.value[element.dataKey] = element.validate || {}
        formData[element.dataKey] ??= props.formData[element.dataKey] || ''
      }
    })
  }
})

const handleSubmit = async () => {
  if (loading.value || loadFailed.value || saving.value) return
  if (!formElements.value.length) {
    props.setIsSuccess(true)
    props.nextCallback()
    return
  }
  await formRef.value?.validate()
  saving.value = true
  try {
    const res = await updateDeviceVoucher({
      device_id: props.device_id,
      voucher: JSON.stringify(formData)
    })
    props.setIsSuccess(!res.error)
    props.nextCallback()
  } finally {
    saving.value = false
  }
}
const copy = event => {
  const input = event.target
  input.select()
  document.execCommand('copy')
  window.$message?.success($t('theme.configOperation.copySuccess'))
}
</script>

<template>
  <NForm ref="formRef" :rules="formRules" :model="formData">
    <NAlert v-if="loadFailed" type="error" class="mb-4">
      {{ $t('custom.devicePage.connectionLoadFailed') }}
      <NButton text type="primary" @click="loadConfiguration">{{ $t('custom.devicePage.retryConnection') }}</NButton>
    </NAlert>
    <NSpin :show="loading">
      <n-scrollbar style="max-height: 360px" content-style="padding: 4px 0">
        <template v-for="element in formElements" :key="element.dataKey">
          <div v-if="element.type === 'input'" class="form-item">
            <NFormItem :label="element.label" :path="element.dataKey">
              <NInput
                id="input"
                v-model:value="formData[element.dataKey]"
                :placeholder="element.placeholder"
                @click="copy"
              />
            </NFormItem>
          </div>
          <div v-if="element.type === 'select'" class="form-item">
            <NFormItem :label="element.label" :path="element.dataKey">
              <NSelect v-model:value="formData[element.dataKey]" :options="element.options as SelectMixedOption[]" />
            </NFormItem>
          </div>
          <div v-if="element.type === 'table'">
            <div class="table-label">{{ element.label }}</div>
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

        <NCard
          v-if="!loading && !loadFailed && Object.keys(connectInfo).length"
          :title="$t('custom.devicePage.connectInfo')"
          size="small"
        >
          <NDescriptions :column="1">
            <NDescriptionsItem v-for="(value, key) in connectInfo" :key="key" :label="key">
              <span class="break-words whitespace-pre-wrap">{{ value }}</span>
            </NDescriptionsItem>
          </NDescriptions>
        </NCard>
      </n-scrollbar>
    </NSpin>
    <div class="mt-4 w-full flex-center">
      <NButton type="primary" :disabled="loading || loadFailed" :loading="saving" @click="handleSubmit">
        {{ formElements.length ? $t('custom.devicePage.saveAndNext') : $t('common.complete') }}
      </NButton>
    </div>
  </NForm>
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
</style>
