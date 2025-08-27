<!--
  数据详情弹窗组件
  用于查看和编辑原始数据和处理后数据的详细信息
-->
<template>
  <n-modal
    v-model:show="visible"
    :title="modalTitle"
    :size="modalSize"
    preset="card"
    :closable="true"
    :mask-closable="false"
    :close-on-esc="true"
    transform-origin="center"
    class="data-detail-modal"
  >
    <n-tabs v-model:value="activeTab" type="line" animated>
      <!-- 基本信息标签页 -->
      <n-tab-pane name="basic" :tab="$t('dataSource.detail.basicInfo')">
        <n-space vertical :size="16">
          <n-descriptions :column="2" bordered>
            <n-descriptions-item :label="$t('dataSource.detail.name')">
              {{ dataItem.name || '--' }}
            </n-descriptions-item>
            <n-descriptions-item :label="$t('dataSource.detail.type')">
              <n-tag :type="getTypeTagType(dataItem.dataType)">
                {{ getTypeLabel(dataItem.dataType) }}
              </n-tag>
            </n-descriptions-item>
            <n-descriptions-item :label="$t('dataSource.detail.source')">
              <n-space align="center" :size="8">
                <n-icon>
                  <AddOutline v-if="dataItem.sourceType === 'manual'" />
                  <CloudDownloadOutline v-else-if="dataItem.sourceType === 'api'" />
                  <ClipboardOutline v-else-if="dataItem.sourceType === 'clipboard'" />
                  <CodeOutline v-else />
                </n-icon>
                <span>{{ getSourceLabel(dataItem.sourceType) }}</span>
              </n-space>
            </n-descriptions-item>
            <n-descriptions-item :label="$t('dataSource.detail.priority')">
              <n-rate :value="dataItem.priority || 5" readonly :count="10" size="small" />
              <n-text :depth="3">({{ dataItem.priority || 5 }}/10)</n-text>
            </n-descriptions-item>
            <n-descriptions-item :label="$t('dataSource.detail.createdAt')">
              {{ formatDateTime(dataItem.createdAt) }}
            </n-descriptions-item>
            <n-descriptions-item :label="$t('dataSource.detail.updatedAt')">
              {{ formatDateTime(dataItem.updatedAt) }}
            </n-descriptions-item>
            <n-descriptions-item :label="$t('dataSource.detail.description')" :span="2">
              {{ dataItem.description || $t('dataSource.detail.noDescription') }}
            </n-descriptions-item>
          </n-descriptions>

          <!-- 标签 -->
          <template v-if="dataItem.tags?.length">
            <n-divider title-placement="left">
              {{ $t('dataSource.detail.tags') }}
            </n-divider>
            <n-space :size="8">
              <n-tag v-for="tag in dataItem.tags" :key="tag" type="info" size="small">
                {{ tag }}
              </n-tag>
            </n-space>
          </template>

          <!-- 过期设置 -->
          <template v-if="dataItem.expireTime && dataItem.expireTime > 0">
            <n-divider title-placement="left">
              {{ $t('dataSource.detail.expiration') }}
            </n-divider>
            <n-alert type="info" :show-icon="true">
              <template #icon>
                <n-icon><TimeOutline /></n-icon>
              </template>
              {{
                $t('dataSource.detail.expireInfo', {
                  time: dataItem.expireTime,
                  remaining: getRemainingTime()
                })
              }}
            </n-alert>
          </template>
        </n-space>
      </n-tab-pane>

      <!-- 数据内容标签页 -->
      <n-tab-pane name="data" :tab="$t('dataSource.detail.dataContent')">
        <n-space vertical :size="16">
          <!-- 数据统计 -->
          <n-card size="small" embedded>
            <n-space :size="16">
              <n-statistic :label="$t('dataSource.detail.dataSize')" :value="getDataSize(dataItem.value)" />
              <n-statistic :label="$t('dataSource.detail.dataLength')" :value="getDataLength(dataItem.value)" />
              <n-statistic :label="$t('dataSource.detail.lastUpdated')" :value="getRelativeTime(dataItem.updatedAt)" />
            </n-space>
          </n-card>

          <!-- 数据显示 -->
          <n-card>
            <template #header>
              <n-space justify="space-between" align="center">
                <span>{{ $t('dataSource.detail.rawData') }}</span>
                <n-space :size="8">
                  <n-button size="small" :loading="copying" @click="copyDataToClipboard">
                    <template #icon>
                      <n-icon><CopyOutline /></n-icon>
                    </template>
                    {{ $t('common.copy') }}
                  </n-button>
                  <n-button size="small" :loading="downloading" @click="downloadData">
                    <template #icon>
                      <n-icon><DownloadOutline /></n-icon>
                    </template>
                    {{ $t('common.download') }}
                  </n-button>
                  <n-button size="small" @click="toggleDataFormat">
                    <template #icon>
                      <n-icon><EyeOutline /></n-icon>
                    </template>
                    {{
                      displayFormat === 'formatted'
                        ? $t('dataSource.detail.rawView')
                        : $t('dataSource.detail.formattedView')
                    }}
                  </n-button>
                </n-space>
              </n-space>
            </template>

            <template v-if="dataItem.dataType === 'json'">
              <code-editor
                :value="getDisplayValue()"
                language="json"
                :height="400"
                :read-only="!editMode"
                @validate="handleDataValidation"
              />
            </template>
            <template v-else>
              <n-input
                :value="getDisplayValue()"
                type="textarea"
                :rows="20"
                :readonly="!editMode"
                @update:value="handleDataValueChange"
              />
            </template>

            <n-text v-if="dataValidationError" type="error" :depth="3">
              {{ dataValidationError }}
            </n-text>
          </n-card>
        </n-space>
      </n-tab-pane>

      <!-- 元数据标签页 -->
      <n-tab-pane name="metadata" :tab="$t('dataSource.detail.metadata')">
        <n-space vertical :size="16">
          <!-- API响应元数据 -->
          <template v-if="dataItem.metadata?.apiResponse">
            <n-card>
              <template #header>
                <n-space align="center" :size="8">
                  <n-icon><CloudDownloadOutline /></n-icon>
                  <span>{{ $t('dataSource.detail.apiMetadata') }}</span>
                </n-space>
              </template>
              <n-descriptions :column="1" bordered>
                <n-descriptions-item :label="$t('dataSource.detail.apiUrl')">
                  <n-text code>{{ dataItem.metadata.apiResponse.url }}</n-text>
                </n-descriptions-item>
                <n-descriptions-item :label="$t('dataSource.detail.method')">
                  <n-tag>{{ dataItem.metadata.apiResponse.method }}</n-tag>
                </n-descriptions-item>
                <n-descriptions-item :label="$t('dataSource.detail.responseTime')">
                  <n-text>{{ dataItem.metadata.apiResponse.responseTime }}ms</n-text>
                </n-descriptions-item>
                <n-descriptions-item
                  v-if="dataItem.metadata.apiResponse.headers?.length"
                  :label="$t('dataSource.detail.headers')"
                >
                  <n-space vertical :size="4">
                    <n-text v-for="header in dataItem.metadata.apiResponse.headers" :key="header.key" code :depth="3">
                      {{ header.key }}: {{ header.value }}
                    </n-text>
                  </n-space>
                </n-descriptions-item>
              </n-descriptions>
            </n-card>
          </template>

          <!-- 剪贴板来源元数据 -->
          <template v-if="dataItem.metadata?.clipboardSource">
            <n-card>
              <template #header>
                <n-space align="center" :size="8">
                  <n-icon><ClipboardOutline /></n-icon>
                  <span>{{ $t('dataSource.detail.clipboardMetadata') }}</span>
                </n-space>
              </template>
              <n-descriptions :column="1" bordered>
                <n-descriptions-item :label="$t('dataSource.detail.detectedFormat')">
                  <n-tag>{{ dataItem.metadata.clipboardSource.detectedFormat }}</n-tag>
                </n-descriptions-item>
                <n-descriptions-item :label="$t('dataSource.detail.originalLength')">
                  <n-text>{{ dataItem.metadata.clipboardSource.originalLength }} {{ $t('common.characters') }}</n-text>
                </n-descriptions-item>
              </n-descriptions>
            </n-card>
          </template>

          <!-- 处理历史记录 -->
          <template v-if="dataItem.metadata?.processingHistory?.length">
            <n-card>
              <template #header>
                <n-space align="center" :size="8">
                  <n-icon><GitBranchOutline /></n-icon>
                  <span>{{ $t('dataSource.detail.processingHistory') }}</span>
                </n-space>
              </template>
              <n-timeline>
                <n-timeline-item
                  v-for="(record, index) in dataItem.metadata.processingHistory"
                  :key="index"
                  :type="record.success ? 'success' : 'error'"
                  :title="record.operation"
                  :content="record.description"
                  :time="formatDateTime(record.timestamp)"
                />
              </n-timeline>
            </n-card>
          </template>

          <!-- 通用元数据 -->
          <n-card>
            <template #header>
              <n-space align="center" :size="8">
                <n-icon><InformationCircleOutline /></n-icon>
                <span>{{ $t('dataSource.detail.generalMetadata') }}</span>
              </n-space>
            </template>
            <template v-if="Object.keys(filteredMetadata).length">
              <code-editor
                :value="JSON.stringify(filteredMetadata, null, 2)"
                language="json"
                :height="200"
                :read-only="true"
              />
            </template>
            <template v-else>
              <n-empty :description="$t('dataSource.detail.noMetadata')" />
            </template>
          </n-card>
        </n-space>
      </n-tab-pane>

      <!-- 编辑模式标签页 -->
      <n-tab-pane v-if="allowEdit" name="edit" :tab="$t('dataSource.detail.edit')">
        <n-space vertical :size="16">
          <n-alert type="warning" :show-icon="true">
            <template #icon>
              <n-icon><WarningOutline /></n-icon>
            </template>
            {{ $t('dataSource.detail.editWarning') }}
          </n-alert>

          <n-form ref="editFormRef" :model="editFormData" :rules="editValidationRules" label-placement="top">
            <n-space vertical :size="12">
              <n-form-item :label="$t('dataSource.detail.name')" path="name">
                <n-input
                  v-model:value="editFormData.name"
                  :placeholder="$t('dataSource.rawData.dataNamePlaceholder')"
                />
              </n-form-item>

              <n-form-item :label="$t('dataSource.detail.description')" path="description">
                <n-input
                  v-model:value="editFormData.description"
                  type="textarea"
                  :rows="3"
                  :placeholder="$t('dataSource.rawData.descriptionPlaceholder')"
                  :maxlength="200"
                  show-count
                />
              </n-form-item>

              <n-form-item :label="$t('dataSource.detail.tags')" path="tags">
                <n-dynamic-tags
                  v-model:value="editFormData.tags"
                  :max="10"
                  :placeholder="$t('dataSource.rawData.addTag')"
                />
              </n-form-item>

              <n-form-item :label="$t('dataSource.detail.priority')" path="priority">
                <n-slider
                  v-model:value="editFormData.priority"
                  :min="1"
                  :max="10"
                  :step="1"
                  :marks="priorityMarks"
                  show-tooltip
                />
              </n-form-item>

              <n-form-item :label="$t('dataSource.detail.expireTime')" path="expireTime">
                <n-input-number
                  v-model:value="editFormData.expireTime"
                  :min="0"
                  :placeholder="$t('dataSource.rawData.expireTimePlaceholder')"
                  style="width: 100%"
                >
                  <template #suffix>
                    <span>{{ $t('common.minutes') }}</span>
                  </template>
                </n-input-number>
              </n-form-item>

              <n-form-item>
                <n-checkbox
                  v-model:checked="editFormData.enableValidation"
                  :label="$t('dataSource.rawData.enableValidation')"
                />
              </n-form-item>
            </n-space>
          </n-form>
        </n-space>
      </n-tab-pane>

      <!-- 数据操作标签页 -->
      <n-tab-pane name="operations" :tab="$t('dataSource.detail.operations')">
        <n-space vertical :size="16">
          <!-- 数据验证 -->
          <n-card>
            <template #header>
              <n-space align="center" :size="8">
                <n-icon><CheckmarkCircleOutline /></n-icon>
                <span>{{ $t('dataSource.detail.validation') }}</span>
              </n-space>
            </template>
            <n-space vertical :size="12">
              <n-button :loading="validating" @click="validateData">
                <template #icon>
                  <n-icon><PlayOutline /></n-icon>
                </template>
                {{ $t('dataSource.detail.validateData') }}
              </n-button>

              <template v-if="validationResult">
                <n-alert :type="validationResult.valid ? 'success' : 'error'" :show-icon="true">
                  <template #icon>
                    <n-icon>
                      <CheckmarkCircleOutline v-if="validationResult.valid" />
                      <CloseCircleOutline v-else />
                    </n-icon>
                  </template>
                  {{ validationResult.message }}
                </n-alert>

                <template v-if="validationResult.details?.length">
                  <n-collapse>
                    <n-collapse-item :title="$t('dataSource.detail.validationDetails')" name="details">
                      <n-list>
                        <n-list-item v-for="(detail, index) in validationResult.details" :key="index">
                          <n-space align="center" :size="8">
                            <n-icon :color="detail.level === 'error' ? 'red' : 'orange'">
                              <CloseCircleOutline v-if="detail.level === 'error'" />
                              <WarningOutline v-else />
                            </n-icon>
                            <n-text>{{ detail.message }}</n-text>
                          </n-space>
                        </n-list-item>
                      </n-list>
                    </n-collapse-item>
                  </n-collapse>
                </template>
              </template>
            </n-space>
          </n-card>

          <!-- 数据转换 -->
          <n-card>
            <template #header>
              <n-space align="center" :size="8">
                <n-icon><SwapHorizontalOutline /></n-icon>
                <span>{{ $t('dataSource.detail.dataTransform') }}</span>
              </n-space>
            </template>
            <n-space vertical :size="12">
              <n-form-item :label="$t('dataSource.detail.targetFormat')">
                <n-select
                  v-model:value="transformTarget"
                  :options="transformOptions"
                  :placeholder="$t('dataSource.detail.selectFormat')"
                />
              </n-form-item>

              <n-button :loading="transforming" :disabled="!transformTarget" @click="transformData">
                <template #icon>
                  <n-icon><SwapHorizontalOutline /></n-icon>
                </template>
                {{ $t('dataSource.detail.transform') }}
              </n-button>

              <template v-if="transformResult">
                <n-card size="small" embedded>
                  <template #header>
                    <span>{{ $t('dataSource.detail.transformResult') }}</span>
                  </template>
                  <code-editor
                    :value="transformResult"
                    :language="getTransformLanguage(transformTarget)"
                    :height="200"
                    :read-only="true"
                  />
                </n-card>
              </template>
            </n-space>
          </n-card>

          <!-- 数据预处理 -->
          <n-card>
            <template #header>
              <n-space align="center" :size="8">
                <n-icon><LayersOutline /></n-icon>
                <span>{{ $t('dataSource.detail.preprocessing') }}</span>
              </n-space>
            </template>
            <n-space vertical :size="12">
              <n-checkbox-group v-model:value="preprocessingOptions">
                <n-space vertical :size="8">
                  <n-checkbox value="trim" :label="$t('dataSource.detail.trimWhitespace')" />
                  <n-checkbox value="removeEmpty" :label="$t('dataSource.detail.removeEmpty')" />
                  <n-checkbox value="deduplication" :label="$t('dataSource.detail.deduplication')" />
                  <n-checkbox value="normalize" :label="$t('dataSource.detail.normalize')" />
                </n-space>
              </n-checkbox-group>

              <n-button :loading="preprocessing" :disabled="!preprocessingOptions.length" @click="applyPreprocessing">
                <template #icon>
                  <n-icon><ConstructOutline /></n-icon>
                </template>
                {{ $t('dataSource.detail.applyPreprocessing') }}
              </n-button>

              <template v-if="preprocessingResult">
                <n-card size="small" embedded>
                  <template #header>
                    <span>{{ $t('dataSource.detail.preprocessingResult') }}</span>
                  </template>
                  <n-space vertical :size="8">
                    <n-space align="center" :size="8">
                      <n-text :depth="3">{{ $t('dataSource.detail.originalSize') }}:</n-text>
                      <n-text>{{ preprocessingResult.originalSize }}</n-text>
                    </n-space>
                    <n-space align="center" :size="8">
                      <n-text :depth="3">{{ $t('dataSource.detail.processedSize') }}:</n-text>
                      <n-text>{{ preprocessingResult.processedSize }}</n-text>
                    </n-space>
                    <code-editor
                      :value="preprocessingResult.data"
                      :language="dataItem.dataType === 'json' ? 'json' : 'text'"
                      :height="150"
                      :read-only="true"
                    />
                  </n-space>
                </n-card>
              </template>
            </n-space>
          </n-card>
        </n-space>
      </n-tab-pane>
    </n-tabs>

    <template #footer>
      <n-space justify="space-between" align="center">
        <n-space :size="8">
          <n-switch v-if="allowEdit" v-model:value="editMode" :round="false">
            <template #checked>{{ $t('dataSource.detail.editMode') }}</template>
            <template #unchecked>{{ $t('dataSource.detail.viewMode') }}</template>
          </n-switch>
        </n-space>

        <n-space :size="12">
          <n-button @click="handleClose">
            {{ $t('common.close') }}
          </n-button>
          <n-button
            v-if="allowEdit && editMode"
            type="primary"
            :loading="saving"
            :disabled="!canSave"
            @click="handleSave"
          >
            <template #icon>
              <n-icon><SaveOutline /></n-icon>
            </template>
            {{ $t('common.save') }}
          </n-button>
        </n-space>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
/**
 * 数据详情弹窗组件
 * 提供数据查看、编辑、验证、转换和预处理功能
 * 支持多种数据类型和来源的元数据展示
 */
import { computed, reactive, ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'
import {
  AddOutline,
  CloudDownloadOutline,
  ClipboardOutline,
  CodeOutline,
  TimeOutline,
  CopyOutline,
  DownloadOutline,
  EyeOutline,
  GitBranchOutline,
  InformationCircleOutline,
  CheckmarkCircleOutline,
  CloseCircleOutline,
  WarningOutline,
  PlayOutline,
  SwapHorizontalOutline,
  LayersOutline,
  ConstructOutline,
  SaveOutline
} from '@vicons/ionicons5'
import ScriptEditor from '../ui/ScriptEditor.vue'

// 类型定义
interface RawDataItem {
  id?: string
  name: string
  value: any
  dataType: 'string' | 'number' | 'boolean' | 'json' | 'text'
  sourceType: 'manual' | 'api' | 'clipboard' | 'script'
  description?: string
  tags?: string[]
  priority?: number
  expireTime?: number
  enableValidation?: boolean
  metadata?: Record<string, any>
  createdAt?: Date
  updatedAt?: Date
}

interface ValidationResult {
  valid: boolean
  message: string
  details?: Array<{
    level: 'error' | 'warning'
    message: string
    path?: string
  }>
}

interface PreprocessingResult {
  data: string
  originalSize: number
  processedSize: number
  operations: string[]
}

interface Props {
  visible: boolean
  dataItem?: RawDataItem
  allowEdit?: boolean
  size?: 'small' | 'medium' | 'large' | 'huge'
}

interface Emits {
  'update:visible': [value: boolean]
  save: [data: RawDataItem]
  close: []
}

const props = withDefaults(defineProps<Props>(), {
  allowEdit: true,
  size: 'large',
  dataItem: undefined
})

const emit = defineEmits<Emits>()

// 国际化
const { t } = useI18n()
const message = useMessage()

// 表单引用
const editFormRef = ref<FormInst>()

// 状态管理
const activeTab = ref('basic')
const editMode = ref(false)
const saving = ref(false)
const copying = ref(false)
const downloading = ref(false)
const validating = ref(false)
const transforming = ref(false)
const preprocessing = ref(false)

// 显示和编辑状态
const displayFormat = ref<'formatted' | 'raw'>('formatted')
const dataValidationError = ref('')

// 验证和转换结果
const validationResult = ref<ValidationResult | null>(null)
const transformTarget = ref('')
const transformResult = ref('')
const preprocessingOptions = ref<string[]>([])
const preprocessingResult = ref<PreprocessingResult | null>(null)

// 编辑表单数据
const editFormData = reactive({
  name: '',
  description: '',
  tags: [] as string[],
  priority: 5,
  expireTime: 0,
  enableValidation: true
})

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
})

const modalTitle = computed(() => {
  return props.dataItem?.name
    ? `${t('dataSource.detail.title')} - ${props.dataItem.name}`
    : t('dataSource.detail.title')
})

const modalSize = computed(() => {
  const sizeMap = {
    small: '600px',
    medium: '900px',
    large: '1200px',
    huge: '1400px'
  }
  return sizeMap[props.size]
})

const canSave = computed(() => {
  return editFormData.name.trim().length >= 2
})

const priorityMarks = computed(() => ({
  1: t('dataSource.rawData.priority.low'),
  5: t('dataSource.rawData.priority.normal'),
  10: t('dataSource.rawData.priority.high')
}))

const transformOptions = computed(() => [
  { label: 'JSON', value: 'json' },
  { label: 'CSV', value: 'csv' },
  { label: 'XML', value: 'xml' },
  { label: 'YAML', value: 'yaml' },
  { label: 'Plain Text', value: 'text' }
])

const filteredMetadata = computed(() => {
  const metadata = { ...(props.dataItem?.metadata || {}) }
  // 移除已在其他标签页显示的元数据
  delete metadata.apiResponse
  delete metadata.clipboardSource
  delete metadata.processingHistory
  return metadata
})

const editValidationRules = computed<FormRules>(() => ({
  name: [
    {
      required: true,
      message: t('dataSource.rawData.validation.nameRequired'),
      trigger: 'blur'
    },
    {
      min: 2,
      max: 50,
      message: t('dataSource.rawData.validation.nameLength'),
      trigger: 'blur'
    }
  ]
}))

// 监听器
watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      initializeForm()
      activeTab.value = 'basic'
      editMode.value = false
    }
  }
)

watch(
  () => props.dataItem,
  newData => {
    if (newData && props.visible) {
      initializeForm()
    }
  },
  { deep: true }
)

// 方法
/**
 * 初始化表单数据
 * 从props中复制数据到编辑表单
 */
const initializeForm = () => {
  Object.assign(editFormData, {
    name: props.dataItem?.name || '',
    description: props.dataItem?.description || '',
    tags: props.dataItem?.tags || [],
    priority: props.dataItem?.priority || 5,
    expireTime: props.dataItem?.expireTime || 0,
    enableValidation: props.dataItem?.enableValidation !== false
  })

  // 清除验证和转换结果
  validationResult.value = null
  transformResult.value = ''
  preprocessingResult.value = null
  dataValidationError.value = ''
}

/**
 * 获取类型标签样式
 * @param dataType 数据类型
 */
const getTypeTagType = (dataType: string) => {
  const typeMap = {
    string: 'default',
    number: 'info',
    boolean: 'success',
    json: 'warning',
    text: 'default'
  }
  return typeMap[dataType as keyof typeof typeMap] || 'default'
}

/**
 * 获取类型标签文本
 * @param dataType 数据类型
 */
const getTypeLabel = (dataType: string): string => {
  return t(`dataSource.dataType.${dataType}`)
}

/**
 * 获取数据来源标签文本
 * @param sourceType 数据来源类型
 */
const getSourceLabel = (sourceType: string): string => {
  const sourceMap = {
    manual: t('dataSource.rawData.manual'),
    api: t('dataSource.rawData.fromApi'),
    clipboard: t('dataSource.rawData.fromClipboard'),
    script: t('dataSource.rawData.fromScript')
  }
  return sourceMap[sourceType as keyof typeof sourceMap] || sourceType
}

/**
 * 格式化日期时间
 * @param date 日期对象
 */
const formatDateTime = (date: Date | string | undefined): string => {
  if (!date) return '--'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 获取相对时间
 * @param date 日期对象
 */
const getRelativeTime = (date: Date | string | undefined): string => {
  if (!date) return '--'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))

  if (diffMins < 1) return t('dataSource.detail.justNow')
  if (diffMins < 60) return t('dataSource.detail.minutesAgo', { minutes: diffMins })
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return t('dataSource.detail.hoursAgo', { hours: diffHours })
  const diffDays = Math.floor(diffHours / 24)
  return t('dataSource.detail.daysAgo', { days: diffDays })
}

/**
 * 获取剩余时间
 */
const getRemainingTime = (): string => {
  if (!props.dataItem?.expireTime || !props.dataItem?.createdAt) return '--'

  const createdTime =
    typeof props.dataItem.createdAt === 'string' ? new Date(props.dataItem.createdAt) : props.dataItem.createdAt
  const expireTime = new Date(createdTime.getTime() + props.dataItem.expireTime * 60 * 1000)
  const now = new Date()
  const remainingMs = expireTime.getTime() - now.getTime()

  if (remainingMs <= 0) return t('dataSource.detail.expired')

  const remainingMins = Math.floor(remainingMs / (1000 * 60))
  if (remainingMins < 60) return t('dataSource.detail.minutesRemaining', { minutes: remainingMins })
  const remainingHours = Math.floor(remainingMins / 60)
  return t('dataSource.detail.hoursRemaining', { hours: remainingHours })
}

/**
 * 获取数据大小
 * @param data 数据
 */
const getDataSize = (data: any): string => {
  const str = typeof data === 'string' ? data : JSON.stringify(data)
  const bytes = new Blob([str]).size
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * 获取数据长度
 * @param data 数据
 */
const getDataLength = (data: any): number => {
  if (Array.isArray(data)) return data.length
  if (typeof data === 'object' && data !== null) return Object.keys(data).length
  if (typeof data === 'string') return data.length
  return 0
}

/**
 * 获取显示值
 */
const getDisplayValue = (): string => {
  const data = props.dataItem?.value || ''
  if (displayFormat.value === 'formatted' && props.dataItem?.dataType === 'json') {
    try {
      return JSON.stringify(data, null, 2)
    } catch {
      return String(data)
    }
  }
  return typeof data === 'string' ? data : JSON.stringify(data)
}

/**
 * 切换显示格式
 */
const toggleDataFormat = () => {
  displayFormat.value = displayFormat.value === 'formatted' ? 'raw' : 'formatted'
}

/**
 * 处理数据值变化
 * @param value 新的数据值
 */
const handleDataValueChange = (value: string) => {
  // 在编辑模式下更新数据值
  if (editMode.value) {
    try {
      if (props.dataItem?.dataType === 'json') {
        JSON.parse(value)
        dataValidationError.value = ''
      }
    } catch (error) {
      dataValidationError.value = t('dataSource.rawData.validation.jsonFormatError')
    }
  }
}

/**
 * 处理数据验证
 * @param error 验证错误信息
 */
const handleDataValidation = (error: string) => {
  dataValidationError.value = error
}

/**
 * 复制数据到剪贴板
 */
const copyDataToClipboard = async () => {
  if (!navigator.clipboard) {
    message.error(t('dataSource.rawData.clipboardNotSupported'))
    return
  }

  copying.value = true
  try {
    const data = getDisplayValue()
    await navigator.clipboard.writeText(data)
    message.success(t('dataSource.detail.copySuccess'))
  } catch (error: any) {
    message.error(t('dataSource.detail.copyError'))
    console.error('复制失败:', error)
  } finally {
    copying.value = false
  }
}

/**
 * 下载数据为文件
 */
const downloadData = () => {
  downloading.value = true
  try {
    const data = getDisplayValue()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${props.dataItem?.name || 'data'}.${props.dataItem?.dataType === 'json' ? 'json' : 'txt'}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    message.success(t('dataSource.detail.downloadSuccess'))
  } catch (error: any) {
    message.error(t('dataSource.detail.downloadError'))
    console.error('下载失败:', error)
  } finally {
    downloading.value = false
  }
}

/**
 * 验证数据
 */
const validateData = async () => {
  validating.value = true
  try {
    const data = props.dataItem?.value || ''
    const details: ValidationResult['details'] = []

    // 基本类型验证
    if (props.dataItem?.dataType === 'json') {
      try {
        JSON.parse(typeof data === 'string' ? data : JSON.stringify(data))
      } catch (error) {
        details.push({
          level: 'error',
          message: t('dataSource.detail.validation.invalidJson'),
          path: 'value'
        })
      }
    } else if (props.dataItem?.dataType === 'number') {
      if (isNaN(Number(data))) {
        details.push({
          level: 'error',
          message: t('dataSource.detail.validation.invalidNumber'),
          path: 'value'
        })
      }
    }

    // 数据大小检查
    const size = new Blob([getDisplayValue()]).size
    if (size > 1024 * 1024) {
      // 1MB
      details.push({
        level: 'warning',
        message: t('dataSource.detail.validation.largeSizeWarning'),
        path: 'size'
      })
    }

    // 过期时间检查
    if (props.dataItem?.expireTime && props.dataItem?.createdAt) {
      const expireTime = new Date(props.dataItem.createdAt.getTime() + props.dataItem.expireTime * 60 * 1000)
      if (expireTime < new Date()) {
        details.push({
          level: 'warning',
          message: t('dataSource.detail.validation.dataExpired'),
          path: 'expireTime'
        })
      }
    }

    validationResult.value = {
      valid: details.filter(d => d.level === 'error').length === 0,
      message:
        details.length === 0
          ? t('dataSource.detail.validation.allValid')
          : t('dataSource.detail.validation.hasIssues', { count: details.length }),
      details
    }

    message.success(t('dataSource.detail.validationComplete'))
  } catch (error: any) {
    validationResult.value = {
      valid: false,
      message: t('dataSource.detail.validation.error'),
      details: [
        {
          level: 'error',
          message: error.message || t('dataSource.detail.validation.unknownError')
        }
      ]
    }
    message.error(t('dataSource.detail.validationError'))
  } finally {
    validating.value = false
  }
}

/**
 * 获取转换语言
 * @param format 目标格式
 */
const getTransformLanguage = (format: string): string => {
  const languageMap = {
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    csv: 'csv',
    text: 'text'
  }
  return languageMap[format as keyof typeof languageMap] || 'text'
}

/**
 * 转换数据格式
 */
const transformData = async () => {
  if (!transformTarget.value) return

  transforming.value = true
  try {
    const data = props.dataItem?.value || ''
    let result = ''

    switch (transformTarget.value) {
      case 'json':
        result = JSON.stringify(data, null, 2)
        break
      case 'csv':
        if (Array.isArray(data)) {
          const headers = Object.keys(data[0] || {})
          result =
            headers.join(',') +
            '\n' +
            data.map(row => headers.map(h => JSON.stringify(row[h] || '')).join(',')).join('\n')
        } else {
          result = Object.entries(data)
            .map(([k, v]) => `${k},${v}`)
            .join('\n')
        }
        break
      case 'xml':
        result = convertToXml(data)
        break
      case 'yaml':
        result = convertToYaml(data)
        break
      case 'text':
        result = typeof data === 'string' ? data : JSON.stringify(data, null, 2)
        break
      default:
        result = JSON.stringify(data, null, 2)
    }

    transformResult.value = result
    message.success(t('dataSource.detail.transformSuccess'))
  } catch (error: any) {
    message.error(t('dataSource.detail.transformError'))
    console.error('数据转换失败:', error)
  } finally {
    transforming.value = false
  }
}

/**
 * 应用预处理
 */
const applyPreprocessing = async () => {
  if (!preprocessingOptions.value.length) return

  preprocessing.value = true
  try {
    let data = getDisplayValue()
    const originalSize = data.length
    const operations: string[] = []

    // 应用预处理选项
    if (preprocessingOptions.value.includes('trim')) {
      data = data.trim()
      operations.push(t('dataSource.detail.trimWhitespace'))
    }

    if (preprocessingOptions.value.includes('removeEmpty')) {
      data = data
        .split('\n')
        .filter(line => line.trim())
        .join('\n')
      operations.push(t('dataSource.detail.removeEmpty'))
    }

    if (preprocessingOptions.value.includes('deduplication')) {
      const lines = data.split('\n')
      const uniqueLines = [...new Set(lines)]
      data = uniqueLines.join('\n')
      operations.push(t('dataSource.detail.deduplication'))
    }

    if (preprocessingOptions.value.includes('normalize')) {
      // 标准化空白字符
      data = data.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n')
      operations.push(t('dataSource.detail.normalize'))
    }

    preprocessingResult.value = {
      data,
      originalSize,
      processedSize: data.length,
      operations
    }

    message.success(t('dataSource.detail.preprocessingSuccess'))
  } catch (error: any) {
    message.error(t('dataSource.detail.preprocessingError'))
    console.error('预处理失败:', error)
  } finally {
    preprocessing.value = false
  }
}

/**
 * 转换为XML格式
 * @param data 数据对象
 */
const convertToXml = (data: any): string => {
  const convertValue = (value: any, key: string = 'root'): string => {
    if (value === null || value === undefined) {
      return `<${key}></${key}>`
    }
    if (typeof value === 'object') {
      if (Array.isArray(value)) {
        return value.map((item, index) => convertValue(item, `${key}_${index}`)).join('')
      } else {
        const content = Object.entries(value)
          .map(([k, v]) => convertValue(v, k))
          .join('')
        return `<${key}>${content}</${key}>`
      }
    }
    return `<${key}>${value}</${key}>`
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n${convertValue(data)}`
}

/**
 * 转换为YAML格式
 * @param data 数据对象
 */
const convertToYaml = (data: any, indent: number = 0): string => {
  const spaces = '  '.repeat(indent)

  if (data === null || data === undefined) {
    return 'null'
  }
  if (typeof data === 'string') {
    return data.includes('\n')
      ? `|\n${data
          .split('\n')
          .map(line => spaces + '  ' + line)
          .join('\n')}`
      : data
  }
  if (typeof data === 'number' || typeof data === 'boolean') {
    return String(data)
  }
  if (Array.isArray(data)) {
    return data.map(item => `${spaces}- ${convertToYaml(item, indent + 1)}`).join('\n')
  }
  if (typeof data === 'object') {
    return Object.entries(data)
      .map(([key, value]) => `${spaces}${key}: ${convertToYaml(value, indent + 1)}`)
      .join('\n')
  }
  return String(data)
}

/**
 * 处理保存操作
 */
const handleSave = async () => {
  if (!editFormRef.value) return

  try {
    await editFormRef.value.validate()
  } catch (errors) {
    message.error(t('dataSource.rawData.validation.formError'))
    return
  }

  saving.value = true
  try {
    const updatedData: RawDataItem = {
      ...props.dataItem,
      ...editFormData,
      updatedAt: new Date()
    }

    emit('save', updatedData)
    message.success(t('common.saveSuccess'))
    editMode.value = false
  } catch (error: any) {
    message.error(error.message || t('common.saveFailed'))
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

/**
 * 处理关闭操作
 */
const handleClose = () => {
  emit('close')
  visible.value = false
}
</script>

<style scoped>
.data-detail-modal {
  max-height: 95vh;
  overflow-y: auto;
}

:deep(.n-descriptions) {
  --n-th-color: var(--card-color);
}

:deep(.n-descriptions-item-label) {
  font-weight: 500;
  color: var(--text-color);
}

:deep(.n-descriptions-item-content) {
  color: var(--text-color-2);
}

/* 统计项布局样式 */
.data-detail-modal :deep(.n-space) {
  display: flex;
  flex-wrap: wrap;
}

.data-detail-modal :deep(.n-statistic) {
  min-width: 150px;
  flex: 1;
}

:deep(.n-tabs-nav) {
  margin-bottom: 16px;
}

:deep(.n-tab-pane) {
  padding: 0;
}

:deep(.n-timeline-item-content) {
  margin-left: 8px;
}

/* 主题适配 */
[data-theme='dark'] :deep(.n-descriptions) {
  --n-th-color: var(--card-color);
  --n-td-color: var(--body-color);
}

[data-theme='dark'] :deep(.n-statistic-label) {
  color: var(--text-color-2);
}

[data-theme='dark'] :deep(.n-statistic-value) {
  color: var(--text-color);
}
</style>
