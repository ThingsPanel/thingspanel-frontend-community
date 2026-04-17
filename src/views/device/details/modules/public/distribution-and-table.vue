<script setup lang="ts">
import { computed, defineExpose, getCurrentInstance, onMounted, reactive, ref } from 'vue'
import {
  type FormInst,
  type FormRules,
  NButton,
  NCard,
  NCheckbox,
  NDataTable,
  NFlex,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NIcon,
  NInput,
  NInputNumber,
  NModal,
  NPagination,
  NPopover,
  NSelect,
  NSwitch,
  NTabs,
  NTabPane
} from 'naive-ui'
import { useLoading } from '@sa/hooks'
import { Refresh } from '@vicons/ionicons5'
import type { FlatResponseFailData, FlatResponseSuccessData } from '@sa/axios'
import moment from 'moment'
import { commandDataById, commandDataPub, deviceCustomCommandsIdList, getAttributeDataSet } from '@/service/api'
import { $t } from '@/locales'
import { isJSON } from '@/utils/common/tool'
import { createLogger } from '@/utils/logger'
const logger = createLogger('Table')
const props = defineProps<{
  id: string
  noRefresh?: boolean
  isCommand?: boolean
  buttonName?: string
  tableColumns: any[] | undefined
  expect?: boolean
  submitApi?: (params: any) => Promise<FlatResponseSuccessData | FlatResponseFailData>
  expectApi?: (params: any) => Promise<FlatResponseSuccessData | FlatResponseFailData>
  fetchDataApi: (params: any) => Promise<FlatResponseSuccessData | FlatResponseFailData>
}>()
const tableData = ref<any[] | undefined>()
const page_coune = ref(0)
const the_page = ref(1)
const showDialog = ref(false)
const formRef = ref<FormInst | null>(null)
const formModel = reactive({
  commandValue: '',
  textValue: '',
  expected: false,
  time: null as number | null
})
const options = ref()
const { loading, startLoading, endLoading } = useLoading()
const paramsSelect = ref<any>([
  { label: 'true', value: true },
  { label: 'false', value: false }
])
const paramsData = ref<any>([])
const attributeList = ref<any[]>([])
const attributeLoading = ref(false)
const isTextArea = ref<any>(true)

// 新增：管理页签切换
const activeTab = ref('visual')
const rules = computed<FormRules>(() => {
  const r: FormRules = {}
  if (props.isCommand && isTextArea.value) {
    r.commandValue = {
      required: true,
      message: $t('page.manage.validation.commandIdentifierRequired'),
      trigger: ['input', 'blur']
    }
  }
  return r
})
const fetchDataFunction = async () => {
  startLoading()

  const { data, error } = await props.fetchDataApi({
    page: !props.noRefresh ? the_page.value : undefined,
    page_size: !props.noRefresh ? 4 : undefined,
    device_id: props.id
  })
  if (!error) {
    tableData.value = data?.value || data?.list || (Array.isArray(data) ? data : []) || []
    if (data?.count || data?.total) {
      page_coune.value = Math.ceil((data?.count || data?.total) / 4)
    }
    endLoading()
  }
}

const openDialog = async () => {
  showDialog.value = true
  if (!props.isCommand) {
    await loadAttributeList()
  }
}

const closeDialog = () => {
  showDialog.value = false
  formModel.textValue = ''
  paramsData.value = []
  formModel.commandValue = ''
  isTextArea.value = true
  formModel.expected = false
  formModel.time = null
  activeTab.value = 'visual'
  attributeList.value = []
  formRef.value?.restoreValidation()
}

const submit = async () => {
  try {
    await formRef.value?.validate()

    let parms
    const params: any = {}

    // 处理可视化配置页签的参数
    if (activeTab.value === 'visual') {
      if (props.isCommand && paramsData.value.length > 0) {
        paramsData.value.forEach((item: any) => {
          params[item.data_identifier] = item[item.data_identifier]
        })
        formModel.textValue = JSON.stringify(params)
      }
      if (!props.isCommand) {
        if (!hasAttributeSelection.value) {
          window.$message?.warning($t('generate.select-attribute-first'))
          return
        }
        const attributePayload = buildAttributePayload()
        formModel.textValue = JSON.stringify(attributePayload)
      }
    }

    // 统一要求载荷为合法 JSON（命令和属性下发都校验）
    if (formModel.textValue && !isJSON(formModel.textValue)) {
      window.$message?.error($t('generate.inputRightJson'))
      return
    }

    if (props.isCommand) {
      parms = {
        device_id: props.id,
        value: formModel.textValue ? formModel.textValue : null,
        identify: formModel.commandValue
      }
    } else {
      parms = { device_id: props.id, value: formModel.textValue ? formModel.textValue : null }
    }

    if (formModel.expected) {
      if (props.expectApi) {
        const expiry = formModel.time ? new Date().getTime() + formModel.time * 60 * 60 * 1000 : null
        await props.expectApi({
          device_id: props.id,
          payload: formModel.textValue ? formModel.textValue : null,
          send_type: props.isCommand ? 'command' : 'attribute',
          expiry: expiry ? moment(expiry).format('YYYY-MM-DDTHH:mm:ssZ') : null,
          identify: props.isCommand ? formModel.commandValue : null
        })
      }
    } else if (props.submitApi) {
      await props.submitApi(parms)
    }

    await fetchDataFunction()
    closeDialog()
  } catch (errors) {
    window.$message?.error($t('common.validateFail') || 'Validation failed, please check your input.')
    logger.error('Form validation failed:', errors)
  }
}

const onCommandChange = async (row: any) => {
  const parms = {
    device_id: props.id,
    value: row.instruct,
    identify: row.data_identifier
  }
  await commandDataPub(parms)
  fetchDataFunction()
}

const updatePage = (page: number) => {
  the_page.value = page
  fetchDataFunction()
}
const refresh = () => {
  the_page.value = 1
  fetchDataFunction()
}

defineExpose({ refresh })
const getOptions = async show => {
  if (show) {
    const res = await commandDataById(props.id)

    if (res && Array.isArray(res.data)) {
      options.value = res.data
    } else {
      options.value = []
    }
  }
}

// 新增：处理命令标识符输入（支持输入和选择）
const handleCommandInput = (value: string) => {
  formModel.commandValue = value
  // 如果输入的是现有选项，自动解析参数
  const option = options.value?.find((opt: any) => opt.data_identifier === value)
  if (option && option.params) {
    try {
      paramsData.value = JSON.parse(option.params)
    } catch (e) {
      logger.error('Failed to parse params for input command:', e)
      paramsData.value = []
    }
  } else {
    // 如果输入的是自定义命令标识符，清空参数数据
    paramsData.value = []
  }
}

const commandList = ref()

const getListData = async () => {
  const { data } = await deviceCustomCommandsIdList(props.id)
  commandList.value = data
}
onMounted(() => {
  props.isCommand && getListData()
  fetchDataFunction()
})
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})
const validationJson = computed(() => {
  // 统一做 JSON 校验（命令和属性下发）
  if (formModel.textValue && !isJSON(formModel.textValue)) {
    return 'error'
  }
  return undefined
})
const inputFeedback = computed(() => {
  if (formModel.textValue && !isJSON(formModel.textValue)) {
    return $t('generate.inputRightJson')
  }
  return ''
})

const hasAttributeSelection = computed(() => attributeList.value.some(item => item.checked))
const selectAllAttributes = computed({
  get: () => attributeList.value.length > 0 && attributeList.value.every((item: any) => item.checked),
  set: value => {
    attributeList.value.forEach(item => {
      item.checked = value
    })
  }
})
const isAttributeIndeterminate = computed(() => {
  const checkedCount = attributeList.value.filter(item => item.checked).length
  return checkedCount > 0 && checkedCount < attributeList.value.length
})

const isSubmitDisabled = computed(() => {
  // 条件1：如果是命令下发且命令标识符为空，则禁用
  if (props.isCommand && !formModel.commandValue) {
    return true
  }
  // 条件2：如果载荷文本框有内容但不是有效的 JSON，则禁用（命令和属性下发都校验）
  if (formModel.textValue && !isJSON(formModel.textValue)) {
    return true
  }
  return false
})

const visualTabLabel = computed(() =>
  props.isCommand ? $t('generate.visual-config') : $t('generate.attribute-config')
)
const customTabLabel = computed(() => (props.isCommand ? $t('generate.command-line') : $t('generate.custom-attribute')))

const formatAttributeValue = (value: any) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch (error) {
      logger.error('Failed to stringify attribute value:', error)
      return ''
    }
  }
  return value
}

const normalizeAttributeItem = (item: any) => {
  const type = (item.data_type || typeof item.value || 'string').toString().toLowerCase()
  return {
    ...item,
    checked: false,
    attributeType: type,
    inputValue: type === 'number' ? Number(item.value ?? '') : formatAttributeValue(item.value)
  }
}

const loadAttributeList = async () => {
  attributeLoading.value = true
  try {
    const { data, error } = await getAttributeDataSet({ device_id: props.id })
    if (!error) {
      const list = data?.value || data?.list || (Array.isArray(data) ? data : []) || []
      attributeList.value = list.map((item: any) => normalizeAttributeItem(item))
    } else {
      attributeList.value = []
    }
  } catch (err) {
    logger.error('loadAttributeList failed:', err)
    attributeList.value = []
  } finally {
    attributeLoading.value = false
  }
}

const parseBooleanValue = (value: any) => {
  if (typeof value === 'boolean') return value
  if (value === 'true' || value === '1' || value === 1) return true
  if (value === 'false' || value === '0' || value === 0) return false
  return Boolean(value)
}

const parseNumberValue = (value: any) => {
  if (typeof value === 'number') return value
  const num = Number(value)
  return Number.isNaN(num) ? value : num
}

const parseJsonValue = (value: any) => {
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch (error) {
    logger.warn('attribute payload JSON parse failed:', error)
    return value
  }
}

const getDescriptionText = (item: any) => item?.description_cn || item?.description || ''

const buildAttributePayload = () => {
  const payload: Record<string, any> = {}
  attributeList.value
    .filter(item => item.checked)
    .forEach(item => {
      const key = item.key || item.data_identifier || item.data_name
      if (!key) return
      let value = item.inputValue
      switch (item.attributeType) {
        case 'number':
          value = parseNumberValue(value)
          break
        case 'boolean':
          value = parseBooleanValue(value)
          break
        case 'object':
        case 'array':
        case 'json':
          value = parseJsonValue(value)
          break
        default:
          break
      }
      payload[key] = value
    })
  return payload
}
</script>

<template>
  <div class="">
    <div class="m-b-20px flex items-center">
      <NButton v-if="buttonName" type="primary" @click="openDialog">{{ buttonName }}</NButton>
      <div class="flex flex-1 flex-justify-end">
        <NButton v-if="!noRefresh" :bordered="false" class="justify-end" @click="refresh">
          <NIcon size="18">
            <Refresh />
          </NIcon>
          {{ $t('generate.refresh') }}
        </NButton>
      </div>
    </div>

    <NGrid v-if="isCommand" x-gap="20" y-gap="20" cols="1 s:2 m:3 l:4" responsive="screen">
      <NGridItem v-for="item in commandList" :key="item.id">
        <NButton
          size="large"
          :disabled="item.enable_status === 'disable'"
          class="title w-160px p-24px cursor-pointer ellipsis-text text-16px font-600"
          @click="onCommandChange(item)"
        >
          {{ item.buttom_name }}
        </NButton>
      </NGridItem>
    </NGrid>
    <NDataTable class="mb-4 mt-4" :loading="loading" :columns="tableColumns" :data="tableData" />
    <div class="flex flex-justify-end">
      <NPagination
        v-if="!noRefresh"
        :page-count="page_coune"
        :page="the_page"
        :page-size="4"
        @update:page="updatePage"
      />
    </div>
    <NModal v-if="submitApi" v-model:show="showDialog" :class="getPlatform ? 'w-90%' : 'w-450px'">
      <n-card :title="isCommand ? $t('generate.issueCommand') : $t('generate.issue-attribute')">
        <NForm ref="formRef" :model="formModel" :rules="rules" :label-placement="formModel.expected ? 'left' : 'top'">
          <div v-if="expect" class="flex">
            <NFormItem>
              <template #label>
                <div class="flex-ai-c flex">
                  {{ $t('generate.expectedMessage') }}
                  <n-popover trigger="hover">
                    <template #trigger>
                      <svg
                        style="width: 20px"
                        xmlns="http://www.w3.org/2000/svg"
                        xmlns:xlink="http://www.w3.org/1999/xlink"
                        viewBox="0 0 20 20"
                      >
                        <g fill="none">
                          <path
                            d="M10 2a8 8 0 1 1-3.613 15.14l-.121-.065l-3.645.91a.5.5 0 0 1-.62-.441v-.082l.014-.083l.91-3.644l-.063-.12a7.95 7.95 0 0 1-.83-2.887l-.025-.382L2 10a8 8 0 0 1 8-8zm0 1a7 7 0 0 0-6.106 10.425a.5.5 0 0 1 .063.272l-.014.094l-.756 3.021l3.024-.754a.502.502 0 0 1 .188-.01l.091.021l.087.039A7 7 0 1 0 10 3zm0 2.5a.5.5 0 0 1 .5.5v5.5a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm0 9a.75.75 0 1 0 0-1.5a.75.75 0 0 0 0 1.5z"
                            fill="currentColor"
                          ></path>
                        </g>
                      </svg>
                    </template>
                    <span>{{ $t('generate.expectedMessageTip') }}</span>
                  </n-popover>
                </div>
              </template>

              <n-switch v-model:value="formModel.expected" />
            </NFormItem>
            <NFormItem v-if="formModel.expected" :label="$t('generate.expirationTime')" class="ml-20px">
              <div class="flex-ai-c flex">
                <n-input-number v-model:value="formModel.time" :show-button="false" class="w-80px" />
                <div class="fs-0">{{ $t('generate.hour') }}</div>
              </div>
            </NFormItem>
          </div>
          <NFormItem
            v-if="isCommand"
            path="commandValue"
            :label="$t('generate.command-identifier')"
            required
            class="command-selector"
          >
            <NSelect
              v-model:value="formModel.commandValue"
              label-field="data_name"
              value-field="data_identifier"
              :options="options"
              filterable
              tag
              clearable
              :placeholder="$t('generate.command-identifier-placeholder')"
              @update:show="getOptions"
              @update:value="handleCommandInput"
            />
          </NFormItem>

          <!-- 切换页签：可视化配置和命令行 -->
          <NTabs v-model:value="activeTab" type="line" animated>
            <NTabPane name="visual" :tab="visualTabLabel">
              <template v-if="isCommand">
                <div v-if="formModel.commandValue !== ''">
                  <div v-for="item in paramsData" :key="item.id" class="form_box">
                    <div class="form_table">
                      <NFormItem :label="item.data_name" label-placement="left" label-width="80px" label-align="left">
                        <NInput v-if="item.param_type === 'string'" v-model:value="item[item.data_identifier]" />
                        <n-input-number
                          v-else-if="item.param_type === 'Number'"
                          v-model:value="item[item.data_identifier]"
                        />
                        <n-select
                          v-else-if="item.param_type === 'Boolean'"
                          v-model:value="item[item.data_identifier]"
                          :options="paramsSelect"
                        />
                        <n-select
                          v-else-if="item.param_type === 'Enum'"
                          v-model:value="item[item.data_identifier]"
                          :options="
                            item.enum_config?.map(v => {
                              return {
                                ...v,
                                label: v.desc
                              }
                            }) || []
                          "
                          :placeholder="$t('generate.please-select')"
                        />
                        <div class="description">
                          {{ $t('generate.description-label') }}：{{
                            getDescriptionText(item) || $t('generate.description-empty')
                          }}
                        </div>
                      </NFormItem>
                    </div>
                  </div>
                  <div v-if="paramsData.length === 0" class="empty-params">
                    <p>{{ $t('generate.no-params-available') }}</p>
                  </div>
                </div>
                <div v-else class="empty-params">
                  <p>{{ $t('generate.select-command-first') }}</p>
                </div>
              </template>
              <template v-else>
                <div v-if="attributeLoading" class="empty-params">
                  <p>{{ $t('generate.loading') }}</p>
                </div>
                <div v-else-if="attributeList.length">
                  <div class="attribute-toolbar">
                    <NCheckbox v-model:checked="selectAllAttributes" :indeterminate="isAttributeIndeterminate">
                      {{ $t('generate.select-all') }}
                    </NCheckbox>
                  </div>
                  <div v-for="item in attributeList" :key="item.key || item.id" class="attribute-row">
                    <div class="attribute-info">
                      <NCheckbox v-model:checked="item.checked">
                        <div class="attribute-label">
                          <div v-if="item.data_name" class="attribute-name">
                            {{ item.data_name }}
                          </div>
                          <div class="attribute-key">{{ item.key }}</div>
                        </div>
                      </NCheckbox>
                    </div>
                    <div class="attribute-input">
                      <NInput
                        v-model:value="item.inputValue"
                        :placeholder="$t('generate.attribute-value-placeholder')"
                        :disabled="!item.checked"
                      />
                    </div>
                  </div>
                  <div v-if="!hasAttributeSelection" class="attribute-helper">
                    {{ $t('generate.attribute-helper-text') }}
                  </div>
                </div>
                <div v-else class="empty-params">
                  <p>{{ $t('generate.no-attributes-available') }}</p>
                </div>
              </template>
            </NTabPane>
            <NTabPane name="command" :tab="customTabLabel">
              <NFormItem label="" :validation-status="validationJson" :feedback="inputFeedback">
                <NInput
                  v-model:value="formModel.textValue"
                  type="textarea"
                  :placeholder="isCommand ? $t('generate.or-enter-here') : $t('generate.custom-attribute-placeholder')"
                />
              </NFormItem>
            </NTabPane>
          </NTabs>
          <NFlex justify="end" class="button-group">
            <NButton @click="closeDialog">{{ $t('generate.cancel') }}</NButton>
            <NButton type="primary" :disabled="isSubmitDisabled" @click="submit">
              {{ $t('page.irrigation.distribute') }}
            </NButton>
          </NFlex>
        </NForm>
      </n-card>
    </NModal>
  </div>
</template>

<style lang="scss" scoped>
.form_box {
  width: 100%;
}

.title {
  font-weight: 900;
  font-size: 16px;
  margin-bottom: 10px;
}

.form_table {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;

  .n-form-item {
    flex: 1;
    margin-right: 0;

    :deep(.n-form-item-blank) {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .description {
      margin-top: 4px;
      font-size: 11px;
      color: #6b7280;
      line-height: 1.3;
    }

    // 输入框样式优化
    :deep(.n-input),
    :deep(.n-input-number),
    :deep(.n-select) {
      .n-input__input-el,
      .n-input-number-input,
      .n-base-selection {
        height: 32px;
        border-radius: 4px;
        font-size: 13px;
      }
    }

    // 文本域样式
    :deep(.n-input--textarea) {
      .n-input__textarea-el {
        min-height: 60px;
        border-radius: 4px;
        font-size: 13px;
        line-height: 1.4;
      }
    }
  }

  .n-input-number {
    width: 100%;
  }
}

.selectBtn {
  margin-left: 20px;
}

.empty-params {
  text-align: center;
  padding: 20px 16px;
  color: #999;

  p {
    margin: 0;
    font-size: 13px;
  }
}

.attribute-toolbar {
  margin-bottom: 12px;
}

.attribute-row {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid #f2f4f7;

  &:first-of-type {
    border-top: 1px solid #f2f4f7;
  }

  &:last-of-type {
    margin-bottom: 12px;
  }
}

.attribute-info {
  flex: 1;

  .attribute-label {
    display: flex;
    flex-direction: column;
    line-height: 1.3;
  }

  .attribute-name {
    font-weight: 500;
    color: #1f2937;
  }

  .attribute-key {
    font-size: 14px;
    color: #6b7280;
  }
}

.attribute-input {
  flex: 1.2;
}

.button-group {
  margin-top: 16px;
  gap: 12px;
}
</style>
