<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onMounted, ref, watch } from 'vue'
import { type FormInst, NButton, useDialog } from 'naive-ui'
import { PencilOutline as editIcon, TrashOutline as trashIcon } from '@vicons/ionicons5'
import MonacoEditor from 'monaco-editor-vue3';
import {
  dataScriptAdd,
  dataScriptDel,
  dataScriptEdit,
  dataScriptQuiz,
  getDataScriptList,
  setDeviceScriptEnable
} from '@/service/api/device'
import { $t } from '@/locales'
import { useI18n } from 'vue-i18n'
import { createLogger } from '@/utils/logger'
const logger = createLogger('DataHandle')

// 获取国际化函数
const { t } = useI18n()
// const message = useMessage();
const dialog = useDialog()

interface Props {
  configInfo?: object | any
}

const props = withDefaults(defineProps<Props>(), {
  configInfo: null
})
const configFormRef = ref<HTMLElement & FormInst>()

const modalTitle = ref($t('generate.add'))
const configForm: any = ref({})
const scripTypeOpt = ref([
  {
    label: $t('custom.devicePage.reportPreprocessing'),
    value: 'A'
  },
  {
    label: $t('custom.devicePage.transmissionPreprocessing'),
    value: 'B'
  },
  {
    label: $t('custom.devicePage.attributeReporting'),
    value: 'C'
  },
  {
    label: $t('custom.devicePage.attributeDistribution'),
    value: 'D'
  },
  {
    label: $t('custom.devicePage.commandDeliveryPreprocessing'),
    value: 'E'
  },
  {
    label: $t('custom.devicePage.eventReportPreprocessing'),
    value: 'F'
  }
])

function defaultConfigForm() {
  return {
    id: null,
    content: `function encodeInp(msg,topic) 
 -- 说明：该函数为编码函数，将输入的消息编码为平台可识别的消息格式或者设备可识别的消息格式，请根据实际需求编写编码逻辑 
 -- 入参：输入的msg，可以是任意数据类型的字符串。 
 -- 出参：返回值为编码后的消息,需要是json字符串形式 
 -- 注意：string与jsonObj互转需导入json库：local json = require("json") 
 -- 例，string转jsonObj：local jsonData = json.decode(msgString) 
 -- 例，jsonObj转string：local jsonStr = json.encode(jsonTable) 
 local json = require("json") 
 local jsonData = json.decode(msg) 
 -- 例 if jsonData.temp then 
 -- 例 jsonData.temp = jsonData.temp * 10 
 -- 例 end 
 local newJsonString = json.encode(jsonData) 
 return newJsonString 
 end`,
    description: null,
    device_config_id: null,
    enable_flag: 'Y',
    analog_input: null,
    last_analog_input: null,
    name: null,
    remark: null,
    script_type: null,
    resolt_analog_input: ''
  }
}

// Monaco Editor 配置
const editorOptions = ref({
  automaticLayout: true,
  theme: 'vs',
  language: 'lua',
  fontSize: 14,
  lineHeight: 20,
  fontFamily: 'Consolas, "Courier New", monospace',
  wordWrap: 'on',
  lineNumbers: 'on',
  glyphMargin: true,
  folding: true,
  lineDecorationsWidth: 10,
  lineNumbersMinChars: 3,
  minimap: {
    enabled: true,
    side: 'right',
    size: 'proportional',
    showSlider: 'mouseover'
  },
  scrollBeyondLastLine: false,
  readOnly: false,
  cursorStyle: 'line',
  cursorBlinking: 'blink',
  renderWhitespace: 'selection',
  renderControlCharacters: false,
  fontLigatures: true,
  suggestOnTriggerCharacters: true,
  acceptSuggestionOnEnter: 'on',
  tabCompletion: 'on',
  wordBasedSuggestions: true,
  parameterHints: {
    enabled: true
  },
  quickSuggestions: {
    other: true,
    comments: false,
    strings: false
  },
  bracketPairColorization: {
    enabled: true
  },
  guides: {
    bracketPairs: true,
    indentation: true
  },
  formatOnPaste: true,
  formatOnType: true
});

// 编辑器实例引用
const editorRef = ref(null);

// 编辑器工具栏功能
const formatCode = () => {
  if (editorRef.value) {
    editorRef.value.getAction('editor.action.formatDocument').run();
  }
};

const toggleMinimap = () => {
  editorOptions.value.minimap.enabled = !editorOptions.value.minimap.enabled;
};

const toggleWordWrap = () => {
  editorOptions.value.wordWrap = editorOptions.value.wordWrap === 'on' ? 'off' : 'on';
};

const changeFontSize = (delta: number) => {
  const newSize = editorOptions.value.fontSize + delta;
  if (newSize >= 10 && newSize <= 24) {
    editorOptions.value.fontSize = newSize;
  }
};

const configFormRules = ref({
  name: {
    required: true,
    message: $t('generate.enter-title'),
    trigger: 'blur'
  },
  content: {
    required: true,
    message: $t('generate.parse-script'),
    trigger: 'blur'
  },
  enable_flag: {
    required: true,
    message: $t('common.select'),
    trigger: 'change'
  },
  script_type: {
    required: true,
    message: $t('generate.select-processing-type'),
    trigger: 'change'
  }
})
const showModal = ref(false)

const openModal = (type: any, item: any) => {
  modalTitle.value = type
  // 先用默认值初始化表单
  configForm.value = defaultConfigForm()

  if (modalTitle.value === $t('common.edit')) {
    // 编辑模式：加载选中项的数据
    configForm.value = JSON.parse(JSON.stringify(item))
  } else {
    // 添加模式：检查筛选器是否有值
    if (queryData.value.script_type) {
      // 如果筛选器有值，则将该值预设给表单的 script_type 字段
      configForm.value.script_type = queryData.value.script_type
    }
  }
  // 先设置 showModal 为 true，让模态框和表单开始渲染
  showModal.value = true

  // 使用 nextTick 确保 VDOM 更新和组件挂载完成后执行
  nextTick(() => {
    // 清除可能由初始数据绑定触发的校验提示
    configFormRef.value?.restoreValidation()
  })
}

const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})
const bodyStyle = ref({
  width: getPlatform.value ? '90%' : '800px'
})
const queryData: any = ref({
  device_config_id: '',
  script_type: '',
  page: 1,
  page_size: 10
})

interface DataScriptItem {
  id: string
  name: string
  content: string
  description: string
  device_config_id: string
  enable_flag: string
  script_type: string
}
const dataScriptList = ref<Array<DataScriptItem>>([])
const dataScriptTotal = ref(0)
const queryDataScriptList = async () => {
  queryData.value.device_config_id = props.configInfo.id
  const res = await getDataScriptList(queryData.value)
  dataScriptList.value = res.data.list
  dataScriptTotal.value = res.data.total
}
const findScriptType = (scriptType: any) => {
  if (scriptType) {
    return scripTypeOpt.value.find((data: any) => {
      return scriptType === data.value
    })?.label
  }
  return ''
}
const searchDataScript = () => {
  queryData.value.page = 1
  queryDataScriptList()
}

const handleChange = async (item: object) => {
  await setDeviceScriptEnable(item)
}
const handleClose = () => {
  configFormRef.value?.restoreValidation()
  showModal.value = false
}
// 提交表单
const handleSubmit = async () => {
  await configFormRef?.value?.validate()
  configForm.value.device_config_id = props.configInfo.id
  if (!configForm.value.id) {
    const res = await dataScriptAdd(configForm.value)
    if (!res.error) {
      // message.success('新增成功');
      handleClose()
      searchDataScript()
    }
  } else {
    const res = await dataScriptEdit(configForm.value)
    if (!res.error) {
      handleClose()
      // message.success('修改成功');
      searchDataScript()
    }
  }
}
const deleteData = async (item: any) => {
  dialog.warning({
    title: $t('common.tip'),
    content: $t('common.deleteProcessing'),
    positiveText: $t('device_template.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      await dataScriptDel({ id: item.id })
      // message.success($t('custom.grouping_details.operationSuccess'));
      searchDataScript()
    }
  })
}
const doQuiz = async () => {
  await configFormRef?.value?.validate()

  try {
    const response = await dataScriptQuiz(configForm.value)
    
    // 添加详细调试信息
    console.log('调试响应完整对象:', response)
    console.log('response的所有属性:', Object.keys(response))
    
    // 检查是否是错误响应结构 {data: null, error: {...}}
    if (response.error && response.data === null) {
      console.log('检测到错误响应结构:', response.error)
      // 处理网络错误或后端错误
        const errorInfo = response.error
        const errorMessage = errorInfo.message || t('page.dataForward.requestFailed')
        configForm.value.resolt_analog_input = `${t('page.dataForward.debugFailed')}\n${t('page.dataForward.errorType')}: ${errorInfo.name || 'Unknown'}\n${t('page.dataForward.errorCode')}: ${errorInfo.code || 'N/A'}\n${t('page.dataForward.errorMessage')}: ${errorMessage}`
      return
    }
    
    // 检查响应结构，可能是嵌套的
    let actualResponse = response
    
    // 如果response.data存在且包含code属性，说明真正的响应在response.data中
    if (response.data && typeof response.data === 'object' && 'code' in response.data) {
      actualResponse = response.data
      console.log('检测到嵌套响应结构，使用response.data作为实际响应')
    }
    
    console.log('实际响应对象:', actualResponse)
    console.log('actualResponse.code类型:', typeof actualResponse.code, '值:', actualResponse.code)
    console.log('actualResponse.data类型:', typeof actualResponse.data, '值:', actualResponse.data)
    console.log('actualResponse.message:', actualResponse.message)
    
    // 根据返回的code值决定显示内容
    // 使用宽松比较，因为code可能是字符串"200"
    if (actualResponse.code == 200 || actualResponse.code === '200') {
      // code为200时显示data的值
      if (typeof actualResponse.data === 'string') {
          // 如果data是字符串，直接显示（包括"null"字符串）
          configForm.value.resolt_analog_input = actualResponse.data === 'null' ? t('page.dataForward.debugSuccessWithNull') : actualResponse.data
        } else if (actualResponse.data === null || actualResponse.data === undefined) {
          // 如果data是null或undefined
          configForm.value.resolt_analog_input = t('page.dataForward.debugSuccessWithNull')
      } else {
        // 如果data是对象，转换为JSON字符串
        configForm.value.resolt_analog_input = JSON.stringify(actualResponse.data, null, 2)
      }
    } else {
      // code不为200时显示错误信息
        // 优先显示message，如果message为空则显示默认错误信息
        const errorMessage = actualResponse.message || t('page.dataForward.noErrorMessage')
        configForm.value.resolt_analog_input = `${t('page.dataForward.debugFailed')}\ncode: ${actualResponse.code}\nmessage: ${errorMessage}`
    }
  } catch (error) {
      // 处理请求异常
      console.error('调试请求异常:', error)
      configForm.value.resolt_analog_input = t('page.dataForward.debugRequestFailed') + ': ' + (error.message || t('page.dataForward.unknownError'))
    }
}


watch(queryData.value, () => queryDataScriptList(), { deep: true })

onMounted(() => {
  queryDataScriptList()
})
</script>

<template>
  <div class="m-b-20px flex items-center gap-20px">
    <n-select v-model:value="queryData.script_type" :options="scripTypeOpt" class="max-w-40" clearable />
    <NButton type="primary" @click="openModal($t('common.add'), null)">
      {{ $t('generate.add-data-processing') }}
    </NButton>
  </div>
  <n-empty v-if="dataScriptList.length === 0" size="huge" :description="$t('common.nodata')"></n-empty>
  <NGrid v-else x-gap="20" y-gap="20" cols="1 s:2 m:3 l:4" responsive="screen">
    <NGridItem v-for="item in dataScriptList" :key="item.id">
      <NCard hoverable style="height: 180px">
        <div class="item-name item-center flex">
          <div class="flex-1">
            {{ item.name }}
          </div>
          <NSwitch
            v-model:value="item.enable_flag"
            checked-value="Y"
            unchecked-value="N"
            @update-value="handleChange(item)"
          />
        </div>
        <div class="h-80px flex-1">
          <div class="item-desc description">{{ item.description }}</div>
          <div class="item-desc">{{ findScriptType(item.script_type) }}</div>
        </div>
        <NFlex justify="end">
          <NButton tertiary circle type="info" @click="openModal($t('common.edit'), item)">
            <template #icon>
              <n-icon>
                <editIcon />
              </n-icon>
            </template>
          </NButton>
          <NButton circle tertiary type="error" @click="deleteData(item)">
            <template #icon>
              <n-icon>
                <trashIcon />
              </n-icon>
            </template>
          </NButton>
        </NFlex>
      </NCard>
    </NGridItem>
  </NGrid>

  <n-modal
    v-model:show="showModal"
    preset="dialog"
    :width="800"
    :title="modalTitle + $t('common.dataProces')"
    :show-icon="false"
    :style="bodyStyle"
    :closable="false"
  >
    <NForm
      ref="configFormRef"
      class="flex-wrap"
      :class="getPlatform ? 'flex-col' : 'flex'"
      :model="configForm"
      :rules="configFormRules"
      label-placement="left"
      label-width="auto"
    >
      <NFormItem :class="getPlatform ? 'w-100%' : 'w-50%'" :label="$t('page.manage.menu.form.title')" path="name">
        <NInput v-model:value="configForm.name" :placeholder="$t('generate.enter-title')" />
      </NFormItem>
      <NFormItem :class="getPlatform ? 'w-100%' : 'w-50%'" :label="$t('generate.processing-type')" path="script_type">
        <NSelect
          v-model:value="configForm.script_type"
          :options="scripTypeOpt"
          :placeholder="$t('generate.select-processing-type')"
        ></NSelect>
      </NFormItem>
      <NFormItem class="w-100%" :label="$t('device_template.table_header.description')" path="description">
        <NInput
          v-model:value="configForm.description"
          type="textarea"
          :rows="2"
          :placeholder="$t('generate.enter-description')"
        />
      </NFormItem>
      <NFormItem class="w-100%" :label="$t('generate.parse-script')" :rules="configFormRules" path="content">
        <div class="editor-container">
          <!-- 编辑器工具栏 -->
          <div class="editor-toolbar">
            <div class="toolbar-left">
              <NButton size="small" tertiary @click="formatCode">
                <template #icon>
                  <n-icon><svg viewBox="0 0 24 24"><path fill="currentColor" d="M9.5 15.5L4.5 10.5L9.5 5.5L8.09 4.09L1.5 10.68L8.09 17.27L9.5 15.5ZM14.5 8.5L19.5 13.5L14.5 18.5L15.91 19.91L22.5 13.32L15.91 6.73L14.5 8.5Z"/></svg></n-icon>
                </template>
                格式化
              </NButton>
              <NButton size="small" tertiary @click="toggleWordWrap">
                <template #icon>
                  <n-icon><svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 19h6v-2H4v2zM20 5H4v2h16V5zm-3 6H4v2h13.25c1.1 0 2 .9 2 2s-.9 2-2 2H15v-2l-3 3l3 3v-2h2.25c2.3 0 4.25-2.05 4.25-4.5S19.55 11 17.25 11z"/></svg></n-icon>
                </template>
                自动换行
              </NButton>
              <NButton size="small" tertiary @click="toggleMinimap">
                <template #icon>
                  <n-icon><svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 3h18v18H3V3zm16 16V5H5v14h14zM7 7h2v2H7V7zm0 4h2v2H7v-2zm0 4h2v2H7v-2zm4-8h6v2h-6V7zm0 4h6v2h-6v-2zm0 4h6v2h-6v-2z"/></svg></n-icon>
                </template>
                小地图
              </NButton>
            </div>
            <div class="toolbar-right">
              <NButton size="small" tertiary @click="changeFontSize(-1)">
                <template #icon>
                  <n-icon><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 13H5v-2h14v2z"/></svg></n-icon>
                </template>
              </NButton>
              <span class="font-size-display">{{ editorOptions.fontSize }}px</span>
              <NButton size="small" tertiary @click="changeFontSize(1)">
                <template #icon>
                  <n-icon><svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg></n-icon>
                </template>
              </NButton>
            </div>
          </div>
          <!-- Monaco Editor -->
          <div class="editor-wrapper">
            <MonacoEditor
              ref="editorRef"
              v-model:value="configForm.content"
              :options="editorOptions"
              height="300"
              language="lua"
              class="custom-monaco-editor"
            />
          </div>
        </div>
      </NFormItem>
      <NFormItem
        v-if="0"
        class="w-100%"
        :label="$t('page.manage.setting.dataClearSetting.form.enabled')"
        path="enable_flag"
      >
        <NSwitch v-model:value="configForm.enable_flag" checked-value="Y" unchecked-value="N" />
      </NFormItem>
      <NFormItem class="w-100%" :label="$t('generate.simulate-input')" path="last_analog_input">
        <NInput v-model:value="configForm.last_analog_input" type="textarea" :rows="2" />
      </NFormItem>
      <NFormItem class="w-100%" :label="$t('generate.debug-run-result')" path="resolt_analog_input">
        <NInput v-model:value="configForm.resolt_analog_input" :rows="5" :disabled="true" type="textarea" />
      </NFormItem>
      <NFormItem>
        <NButton type="primary" @click="doQuiz">{{ $t('common.debug') }}</NButton>
      </NFormItem>
    </NForm>
    <NFlex justify="end">
      <NButton @click="handleClose">{{ $t('generate.cancel') }}</NButton>
      <NButton type="primary" @click="handleSubmit">{{ $t('common.save') }}</NButton>
    </NFlex>
  </n-modal>
</template>

<style scoped lang="scss">
.alarm-box {
  display: flex;
  flex-flow: row;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
  padding: 10px 40px;

  .alarm-item {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    padding: 18px;
    flex: 0 0 23%;
    margin-right: calc(30% / 3);
    margin-bottom: 30px;

    .item-name {
      display: flex;
      flex-flow: row;
      align-items: center;
      justify-content: space-between;
    }

    .item-desc {
      margin: 15px 0;
    }

    .item-operate {
      display: flex;
      flex-flow: row;
      justify-content: space-between;
      align-items: center;
    }
  }
}

.description {
  height: 40px;
  word-break: break-all;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

/* 编辑器容器样式 */
.editor-container {
  width: 100%;
  border: 1px solid #e0e0e6;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e0e0e6;
  min-height: 40px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.font-size-display {
  font-size: 12px;
  color: #666;
  min-width: 35px;
  text-align: center;
}

.editor-wrapper {
  position: relative;
  background: #fff;
  width: 100%;
}

.custom-monaco-editor {
  border: none !important;
  width: 100% !important;
}

/* 编辑器工具栏按钮样式优化 */
.editor-toolbar .n-button {
  height: 28px;
  padding: 0 8px;
  font-size: 12px;
}

.editor-toolbar .n-button .n-icon {
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .editor-toolbar {
    flex-direction: column;
    gap: 8px;
    padding: 12px;
  }
  
  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: center;
  }
}
</style>
