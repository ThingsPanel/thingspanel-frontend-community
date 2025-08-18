<template>
  <div class="data-source-config-form">
    <n-collapse :default-expanded-names="[props.dataSources[0]?.key]" accordion>
      <n-collapse-item v-for="dataSource in props.dataSources" :key="dataSource.key" :name="dataSource.key">
        <template #header>
          <div class="data-source-header">
            <span>{{ dataSource.name || dataSource.key }} ({{ getDataTypeText(dataSource) }})</span>
            <!-- 🔥 新增：示例数据提示图标 -->
            <n-tooltip placement="right" trigger="hover">
              <template #trigger>
                <n-icon size="16" class="example-data-icon">
                  <InformationCircleOutline />
                </n-icon>
              </template>
              <div class="example-data-tooltip">
                <div class="tooltip-title">示例数据格式:</div>
                <div class="example-code-container">
                  <pre class="example-code">{{ getExampleDataCode(dataSource) }}</pre>
                </div>
              </div>
            </n-tooltip>
          </div>
        </template>
        <!-- 数据源配置内容 -->
        <div class="data-source-content">
          <n-space vertical :size="16">
            <!-- 原始数据管理 -->
            <div>
              <n-text strong>原始数据管理:</n-text>
              <n-space vertical :size="8" style="margin-top: 8px">
                <!-- 添加原始数据按钮 - 弹窗形式 -->
                <n-button type="dashed" size="small" class="add-data-btn" @click="openAddRawDataModal(dataSource.key)">
                  <template #icon>
                    <n-icon size="14">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                      </svg>
                    </n-icon>
                  </template>
                  添加数据项
                </n-button>

                <!-- 原始数据列表 -->
                <div v-if="dataValues[dataSource.key]?.rawDataList?.length > 0" class="raw-data-list">
                  <n-text depth="3" style="font-size: 12px">
                    原始数据列表 ({{ dataValues[dataSource.key].rawDataList.length }} 项):
                  </n-text>
                  <n-space vertical :size="4" style="margin-top: 4px">
                    <div
                      v-for="rawDataItem in dataValues[dataSource.key].rawDataList"
                      :key="rawDataItem.id"
                      class="raw-data-item-compact"
                    >
                      <n-space align="center" justify="space-between">
                        <n-space align="center" :size="8">
                          <span class="raw-data-name">{{ rawDataItem.name }}</span>
                          <!-- 🔥 新增：显示数据项类型 -->
                          <n-tag :type="getDataItemTypeColor(rawDataItem.type)" size="small" round>
                            {{ rawDataItem.type?.toUpperCase() || 'JSON' }}
                          </n-tag>
                        </n-space>
                        <n-space :size="4">
                          <n-button
                            size="tiny"
                            quaternary
                            type="info"
                            class="compact-btn"
                            @click="viewRawDataDetail(dataSource.key, rawDataItem.id)"
                          >
                            查看
                          </n-button>
                          <!-- 🔥 新增：编辑按钮 -->
                          <n-button
                            size="tiny"
                            quaternary
                            type="warning"
                            class="compact-btn"
                            @click="editRawData(dataSource.key, rawDataItem.id)"
                          >
                            编辑
                          </n-button>
                          <n-button
                            size="tiny"
                            quaternary
                            type="error"
                            class="compact-btn"
                            @click="deleteRawData(dataSource.key, rawDataItem.id)"
                          >
                            删除
                          </n-button>
                        </n-space>
                      </n-space>
                    </div>
                  </n-space>
                </div>
                <n-text v-else depth="3" style="font-size: 12px">暂无原始数据项</n-text>
              </n-space>
            </div>

            <!-- 操作按钮 -->
            <n-space :size="8">
              <n-button @click="resetData(dataSource.key)">重置为默认</n-button>
              <n-button type="info" @click="showCurrentFinalData(dataSource.key)">查看当前数据源最终数据</n-button>
            </n-space>
          </n-space>
        </div>
      </n-collapse-item>
    </n-collapse>
  </div>

  <!-- 添加/编辑原始数据弹窗 - 左右分栏布局 -->
  <n-modal
    v-model:show="showAddRawDataModal"
    preset="dialog"
    :title="isEditMode ? '编辑数据项' : '添加数据项'"
    style="width: 1400px"
  >
    <n-grid :cols="2" :x-gap="12">
      <!-- 左侧：数据获取区域 -->
      <n-grid-item>
        <n-space vertical :size="4">
          <n-text strong style="font-size: 13px; color: var(--primary-color)">📥 数据获取</n-text>

          <!-- 基本信息 -->
          <n-grid :cols="2" :x-gap="6">
            <n-grid-item>
              <n-form-item label="名称" size="small" :label-width="50">
                <n-input v-model:value="newRawDataName" placeholder="用户数据" clearable size="small" />
              </n-form-item>
            </n-grid-item>
            <n-grid-item>
              <n-form-item label="类型" size="small" :label-width="50">
                <n-space :size="4">
                  <n-tag
                    v-for="type in ['json', 'http', 'websocket']"
                    :key="type"
                    :type="newRawDataType === type ? 'primary' : 'default'"
                    :bordered="newRawDataType !== type"
                    checkable
                    :checked="newRawDataType === type"
                    style="cursor: pointer; user-select: none"
                    size="small"
                    @click="newRawDataType = type as RawDataItemType"
                  >
                    {{ type.toUpperCase() }}
                  </n-tag>
                </n-space>
              </n-form-item>
            </n-grid-item>
          </n-grid>

          <!-- 数据录入区域 -->
          <n-card size="small" :bordered="false" style="background: var(--hover-color); margin: 2px 0">
            <template #header>
              <n-text depth="2" style="font-size: 11px">数据录入</n-text>
            </template>

            <!-- JSON数据输入 -->
            <div v-if="newRawDataType === 'json'">
              <n-form-item label="JSON数据" size="small" :label-width="60" style="margin-bottom: 2px">
                <n-input
                  v-model:value="newRawDataJsonContent"
                  type="textarea"
                  :rows="8"
                  :placeholder="getJsonPlaceholder()"
                  size="small"
                  style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace; font-size: 11px"
                  @input="updatePreviewData"
                />
              </n-form-item>
            </div>

            <!-- HTTP数据输入 -->
            <div v-else-if="newRawDataType === 'http'">
              <n-space vertical :size="3">
                <n-form-item label="请求URL" size="small" :label-width="60" style="margin-bottom: 2px">
                  <n-input
                    v-model:value="newRawDataHttpUrl"
                    placeholder="https://api.example.com/data"
                    clearable
                    size="small"
                    @input="updatePreviewData"
                  />
                </n-form-item>
                <n-form-item label="请求方法" size="small" :label-width="60" style="margin-bottom: 2px">
                  <n-select
                    v-model:value="newRawDataHttpMethod"
                    :options="[
                      { label: 'GET', value: 'GET' },
                      { label: 'POST', value: 'POST' },
                      { label: 'PUT', value: 'PUT' },
                      { label: 'DELETE', value: 'DELETE' }
                    ]"
                    size="small"
                    @update:value="updatePreviewData"
                  />
                </n-form-item>
                <n-form-item label="请求头" size="small" :label-width="60" style="margin-bottom: 0">
                  <n-input
                    v-model:value="newRawDataHttpHeaders"
                    type="textarea"
                    :rows="3"
                    placeholder='{"Content-Type": "application/json"}'
                    size="small"
                    style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace; font-size: 11px"
                    @input="updatePreviewData"
                  />
                </n-form-item>
              </n-space>
            </div>

            <!-- WebSocket数据输入 -->
            <div v-else-if="newRawDataType === 'websocket'">
              <n-space vertical :size="3">
                <n-form-item label="WebSocket URL" size="small" :label-width="80" style="margin-bottom: 2px">
                  <n-input
                    v-model:value="newRawDataWebsocketUrl"
                    placeholder="ws://localhost:8080/ws"
                    clearable
                    size="small"
                    @input="updatePreviewData"
                  />
                </n-form-item>
                <n-form-item label="协议" size="small" :label-width="80" style="margin-bottom: 0">
                  <n-input
                    v-model:value="newRawDataWebsocketProtocols"
                    placeholder="protocol1,protocol2"
                    clearable
                    size="small"
                    @input="updatePreviewData"
                  />
                </n-form-item>
              </n-space>
            </div>
          </n-card>

          <!-- 数据展示区域 -->
          <n-card size="small" :bordered="false" style="background: var(--hover-color); margin: 2px 0">
            <template #header>
              <n-text depth="2" style="font-size: 11px">原始数据预览</n-text>
            </template>
            <n-code
              :code="previewOriginalData"
              language="json"
              style="max-height: 220px; overflow-y: auto; font-size: 10px"
              :show-line-numbers="false"
            />
          </n-card>
        </n-space>
      </n-grid-item>

      <!-- 右侧：数据处理区域 -->
      <n-grid-item>
        <n-space vertical :size="4">
          <n-text strong style="font-size: 13px; color: var(--success-color)">⚙️ 数据处理</n-text>

          <!-- 处理配置区域 -->
          <n-card size="small" :bordered="false" style="background: var(--hover-color); margin: 2px 0">
            <template #header>
              <n-text depth="2" style="font-size: 11px">处理配置</n-text>
            </template>

            <n-space vertical :size="3">
              <!-- 过滤路径 -->
              <n-form-item label="过滤路径" size="small" :label-width="60" style="margin-bottom: 2px">
                <n-input
                  v-model:value="currentFilterPath"
                  placeholder="$.data.list"
                  clearable
                  size="small"
                  @input="updatePreviewData"
                />
              </n-form-item>

              <!-- 处理脚本 -->
              <n-form-item size="small" :label-width="60" style="margin-bottom: 0">
                <template #label>
                  <n-space :size="2" align="center">
                    <span style="font-size: 11px">处理脚本</span>
                    <n-tooltip placement="top" trigger="hover">
                      <template #trigger>
                        <n-icon size="10" style="color: var(--info-color); cursor: help">
                          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                            <path
                              d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                            <path
                              d="M12 17h.01"
                              stroke="currentColor"
                              stroke-width="2"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                            />
                          </svg>
                        </n-icon>
                      </template>
                      <div style="max-width: 260px">
                        <div style="font-weight: 600; margin-bottom: 4px; font-size: 11px">📝 脚本编写指南</div>
                        <div style="font-size: 10px; line-height: 1.2">
                          <p style="margin: 2px 0">
                            <strong>可用变量：</strong>
                            <br />
                            • data - 输入数据
                          </p>
                          <p style="margin: 2px 0">
                            <strong>常用操作：</strong>
                            <br />
                            • 修改字段：data.newField = data.oldField
                            <br />
                            • 删除字段：delete data.fieldName
                            <br />
                            • 返回结果：return data
                          </p>
                          <p style="margin: 2px 0">
                            <strong>注意：</strong>
                            使用 var 定义变量
                          </p>
                        </div>
                      </div>
                    </n-tooltip>
                  </n-space>
                </template>
                <Codemirror
                  v-model:value="currentProcessScript"
                  :options="{
                    mode: 'javascript',
                    theme: 'default',
                    lineNumbers: true,
                    lineWrapping: true,
                    foldGutter: true,
                    gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
                    tabSize: 2,
                    indentUnit: 2,
                    smartIndent: true,
                    autoCloseBrackets: true,
                    matchBrackets: true,
                    highlightActiveLineGutter: true,
                    highlightSelectionMatches: { showToken: /\w/, annotateScrollbar: true }
                  }"
                  :height="200"
                  @change="updatePreviewData"
                />
              </n-form-item>
            </n-space>
          </n-card>

          <!-- 处理结果区域 -->
          <n-card size="small" :bordered="false" style="background: var(--hover-color); margin: 2px 0">
            <template #header>
              <n-space justify="space-between" align="center" style="margin: 0">
                <n-text depth="2" style="font-size: 11px">处理结果</n-text>
                <n-tag :type="previewStatus.type" size="small" style="font-size: 10px">
                  {{ previewStatus.text }}
                </n-tag>
              </n-space>
            </template>

            <n-space vertical :size="2">
              <n-code
                :code="previewProcessedData"
                language="json"
                style="max-height: 250px; overflow-y: auto; font-size: 10px"
                :show-line-numbers="false"
              />

              <!-- 处理状态消息 -->
              <div v-if="previewStatus.message" style="margin-top: 2px">
                <n-text depth="3" style="font-size: 10px">
                  {{ previewStatus.message }}
                </n-text>
              </div>
            </n-space>
          </n-card>
        </n-space>
      </n-grid-item>
    </n-grid>

    <template #action>
      <n-space :size="12" justify="end">
        <n-button size="medium" @click="cancelEdit">取消</n-button>
        <n-button
          size="medium"
          type="primary"
          :disabled="!newRawDataName || !newRawDataName.trim()"
          @click="handleConfirmClick"
        >
          {{ isEditMode ? '保存修改' : '确认添加' }}
        </n-button>
      </n-space>
    </template>
  </n-modal>

  <!-- 查看最终数据弹窗 -->
  <n-modal v-model:show="showFinalDataModal" preset="dialog" title="当前数据源最终数据" style="width: 600px">
    <n-space vertical :size="12">
      <n-text>数据源 "{{ currentDataSourceKey }}" 的当前最终数据：</n-text>
      <n-code
        :code="currentFinalData"
        language="json"
        :show-line-numbers="true"
        style="max-height: 400px; overflow-y: auto"
      />
    </n-space>
    <template #action>
      <n-button @click="showFinalDataModal = false">关闭</n-button>
    </template>
  </n-modal>

  <!-- 查看原始数据详情弹窗 -->
  <n-modal v-model:show="showRawDataDetailModal" preset="dialog" title="原始数据详情" style="width: 600px">
    <n-space vertical :size="12">
      <n-text>数据项 "{{ currentRawDataName }}" 的详细内容：</n-text>
      <n-code
        :code="currentRawDataDetail"
        language="json"
        :show-line-numbers="true"
        style="max-height: 400px; overflow-y: auto"
      />
    </n-space>
    <template #action>
      <n-button @click="showRawDataDetailModal = false">关闭</n-button>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
/**
 * 数据源配置表单 - 极简重写版本
 * 目标：实现基础数据流闭环
 */

import { ref, reactive, watch, computed, onMounted } from 'vue'
import {
  NCollapse,
  NCollapseItem,
  NSpace,
  NText,
  NCode,
  NButton,
  NTooltip,
  NIcon,
  NModal,
  NCard,
  NInput,
  NList,
  NListItem,
  NThing,
  NTime,
  NFormItem,
  NAlert,
  NTag,
  NGrid,
  NGridItem
} from 'naive-ui'
import { InformationCircleOutline } from '@vicons/ionicons5'
// import { configurationManager } from '../ConfigurationManager'

// 🔥 使用项目已有的 CodeMirror 编辑器
import Codemirror from 'codemirror-editor-vue3'

// 🔥 新增：导入脚本引擎
import { defaultScriptEngine } from '@/core/script-engine'

interface DataSource {
  key: string
  name?: string
  description?: string
  fieldMappings?: Record<string, any>
  fieldsToMap?: Array<{ key: string; targetProperty: string }>
}

interface Props {
  selectedWidgetId?: string // 修改为匹配 ConfigurationPanel 传递的属性名
  dataSources: DataSource[]
}

interface Emits {
  (e: 'update', config: any): void
  (e: 'request-current-data', widgetId: string): void // 🔥 新增：请求当前数据
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 🔥 新增：原始数据项类型枚举
type RawDataItemType = 'json' | 'http' | 'websocket'

// 🔥 新增：原始数据项接口（增加类型字段）
interface RawDataItem {
  id: string
  name: string
  type: RawDataItemType // 数据项类型
  data: any
  config?: {
    // 根据类型存储不同的配置
    jsonData?: string // json类型的数据
    httpConfig?: {
      // http类型的配置
      url: string
      method: string
      headers?: Record<string, string>
    }
    websocketConfig?: {
      // websocket类型的配置
      url: string
      protocols?: string[]
    }
  }
  createdAt: string
  isActive: boolean
}

// 🔥 修改：数据结构接口 - 原始数据项完全独立
interface DataSourceValue {
  currentData: any // 最终数据（完全独立）
  rawDataList: RawDataItem[] // 原始数据列表（完全独立，不影响最终数据）
}

// 数据存储 - 🔥 修改：支持原始数据列表
const dataValues = reactive<Record<string, DataSourceValue>>({})

// 🔥 弹窗状态管理
const showAddRawDataModal = ref(false)
const currentDataSourceKey = ref('')
const newRawDataName = ref('')

// 🔥 新增：数据项类型选择相关状态
const newRawDataType = ref<RawDataItemType>('json')
const newRawDataJsonContent = ref('')
const newRawDataHttpUrl = ref('')
const newRawDataHttpMethod = ref('GET')
const newRawDataHttpHeaders = ref('')
const newRawDataWebsocketUrl = ref('')
const newRawDataWebsocketProtocols = ref('')

// 🔥 新增：查看最终数据相关状态
const showFinalDataModal = ref(false)
const currentFinalData = ref('')

// 🔥 新增：查看原始数据详情相关状态
const showRawDataDetailModal = ref(false)
const currentRawDataDetail = ref('')
const currentRawDataName = ref('')

// 🔥 简化：直接的状态管理
const currentFilterPath = ref('')
const currentProcessScript = ref('')

// 🔥 新增：编辑模式状态管理
const isEditMode = ref(false)
const editingDataSourceKey = ref('')
const editingRawDataId = ref('')

// 🔥 新增：数据预览状态
const previewOriginalData = ref('{}')
const previewProcessedData = ref('{}')
const previewStatus = ref({ type: 'default', text: '等待处理', message: '' })

/**
 * 🔥 新增：更新数据预览
 */
const updatePreviewData = async () => {
  try {
    // 1. 获取原始数据
    let originalData = {}
    if (newRawDataJsonContent.value.trim()) {
      try {
        originalData = JSON.parse(newRawDataJsonContent.value)
      } catch (error) {
        previewStatus.value = { type: 'error', text: 'JSON错误', message: 'JSON格式不正确' }
        previewOriginalData.value = '{"error": "JSON格式错误"}'
        previewProcessedData.value = '{"error": "JSON格式错误"}'
        return
      }
    }

    previewOriginalData.value = JSON.stringify(originalData, null, 2)

    // 2. 应用数据处理
    let processedData = originalData

    // 应用过滤路径
    if (currentFilterPath.value.trim()) {
      try {
        processedData = applyDataFilter(processedData, currentFilterPath.value)
      } catch (error) {
        previewStatus.value = { type: 'warning', text: '过滤警告', message: '过滤路径可能有误' }
      }
    }

    // 应用处理脚本
    if (currentProcessScript.value.trim()) {
      try {
        processedData = await applyProcessScript(processedData, currentProcessScript.value)
        previewStatus.value = { type: 'success', text: '处理成功', message: '数据已处理' }
      } catch (error) {
        previewStatus.value = { type: 'error', text: '脚本错误', message: '脚本执行失败' }
      }
    } else {
      previewStatus.value = { type: 'info', text: '无脚本', message: '未设置处理脚本' }
    }

    previewProcessedData.value = JSON.stringify(processedData, null, 2)
  } catch (error) {
    previewStatus.value = { type: 'error', text: '预览错误', message: '数据预览失败' }
    previewProcessedData.value = '{"error": "预览失败"}'
  }
}

/**
 * 获取数据类型文本描述
 */
const getDataTypeText = (dataSource: DataSource) => {
  // 根据 fieldsToMap 判断期望的数据类型
  if (dataSource.fieldsToMap && dataSource.fieldsToMap.length > 0) {
    const targetProperty = dataSource.fieldsToMap[0].targetProperty
    if (targetProperty.includes('array') || targetProperty.includes('Array')) {
      return '数组'
    }
    if (targetProperty.includes('object') || targetProperty.includes('Object')) {
      return '对象'
    }
  }

  // 根据 key 判断
  if (dataSource.key.toLowerCase().includes('array')) return '数组'
  if (dataSource.key.toLowerCase().includes('object')) return '对象'

  return '数据'
}

/**
 * 获取默认数据 - 🔥 修改：统一返回空对象
 */
const getDefaultData = (dataSourceKey: string) => {
  const dataSource = props.dataSources.find(ds => ds.key === dataSourceKey)
  if (!dataSource) return {}

  // 🔥 修复：优先从 fieldMappings 中获取 defaultValue
  if (dataSource.fieldMappings) {
    // 查找匹配的字段映射
    const targetFieldMapping = Object.values(dataSource.fieldMappings).find(
      (mapping: any) => mapping.targetField === dataSourceKey || mapping.type
    )

    if (targetFieldMapping && targetFieldMapping.defaultValue !== undefined) {
      console.log(`🔧 [DEBUG-Config] 使用组件定义的默认值 (${dataSourceKey}):`, targetFieldMapping.defaultValue)
      return targetFieldMapping.defaultValue
    }
  }

  // 🔥 修改：统一返回空对象，不再使用示例数据
  return {}
}

/**
 * 格式化显示数据 - 🔥 修改：显示当前激活的数据
 */
const getFormattedData = (dataSourceKey: string) => {
  const dataSourceValue = dataValues[dataSourceKey]

  // 🔥 调试：打印数据状态
  console.log(`🔧 [DEBUG-Config] getFormattedData(${dataSourceKey}):`, {
    dataSourceValue,
    hasCurrentData: !!dataSourceValue?.currentData,
    currentData: dataSourceValue?.currentData,
    dataValuesKeys: Object.keys(dataValues)
  })

  if (!dataSourceValue?.currentData) {
    console.warn(`⚠️ [DEBUG-Config] 数据源 ${dataSourceKey} 没有currentData，dataSourceValue:`, dataSourceValue)
    return '暂无数据'
  }

  try {
    return JSON.stringify(dataSourceValue.currentData, null, 2)
  } catch {
    return String(dataSourceValue.currentData)
  }
}

/**
 * 🔥 修改：获取示例数据代码用于悬停提示 - 统一返回空对象
 */
const getExampleDataCode = (dataSource: DataSource) => {
  // 从 fieldMappings 中获取 defaultValue
  if (dataSource.fieldMappings) {
    const firstMapping = Object.values(dataSource.fieldMappings)[0] as any
    if (firstMapping && firstMapping.defaultValue !== undefined) {
      try {
        return JSON.stringify(firstMapping.defaultValue, null, 2)
      } catch {
        return JSON.stringify(firstMapping.defaultValue)
      }
    }
  }

  // 🔥 修改：统一返回空对象格式
  return '{}'
}

/**
 * 重置数据为默认 - 🔥 修改：支持新的数据结构
 */
const resetData = (dataSourceKey: string) => {
  const defaultData = getDefaultData(dataSourceKey)

  // 🔥 修改：更新数据结构
  if (!dataValues[dataSourceKey]) {
    dataValues[dataSourceKey] = {
      currentData: defaultData,
      rawDataList: []
    }
  } else {
    dataValues[dataSourceKey].currentData = defaultData
  }

  console.log('🔧 [DEBUG-Config] 重置数据:', { dataSourceKey, data: dataValues[dataSourceKey] })
  sendUpdate()
}

// 上次发送的配置，用于防止重复发送
let lastSentConfig: string | null = null

/**
 * 发送配置更新 - 🔥 修改：原始数据项与最终数据完全分离
 */
const sendUpdate = () => {
  const dataSourceBindings: Record<string, any> = {}

  // 🔥 修改：构建兼容原有格式的配置结构
  props.dataSources.forEach(dataSource => {
    const dataSourceValue = dataValues[dataSource.key]
    if (dataSourceValue) {
      // 🔥 保持原有的结构，但增强数据内容
      dataSourceBindings[dataSource.key] = {
        // 保持原有的字段
        rawData: dataSourceValue.currentData ? JSON.stringify(dataSourceValue.currentData) : undefined,

        // 🔥 新增：增强的数据源配置
        enhancedConfig: {
          // 原始数据项列表
          rawDataList: dataSourceValue.rawDataList || [],
          // 元数据
          metadata: {
            hasRawDataList: (dataSourceValue.rawDataList?.length || 0) > 0,
            rawDataCount: dataSourceValue.rawDataList?.length || 0,
            lastUpdated: new Date().toISOString(),
            version: '2.1'
          },
          // 数据源类型信息
          dataSourceInfo: {
            key: dataSource.key,
            name: dataSource.name,
            description: dataSource.description,
            fieldMappings: dataSource.fieldMappings,
            fieldsToMap: dataSource.fieldsToMap
          }
        }
      }
    }
  })

  // 🔥 保持兼容的配置结构，同时增强功能
  const config = {
    dataSourceBindings,
    // 🔥 新增：系统级配置
    systemConfig: {
      version: '2.1',
      features: ['rawDataManagement', 'scriptProcessing', 'dataFiltering'],
      lastConfigUpdate: new Date().toISOString(),
      selectedWidgetId: props.selectedWidgetId
    }
  }
  const configHash = JSON.stringify(config)

  // 🔥 关键修复：只在配置真正变化时才发送
  if (configHash !== lastSentConfig) {
    console.log('🔧 [DEBUG-Config] 检测到配置变化，发送更新:', {
      selectedWidgetId: props.selectedWidgetId,
      bindingKeys: Object.keys(dataSourceBindings),
      hasDataChanged: configHash !== lastSentConfig,
      config
    })

    lastSentConfig = configHash
    emit('update', config)
  } else {
    console.log('🔧 [DEBUG-Config] 配置未变化，跳过发送:', {
      selectedWidgetId: props.selectedWidgetId,
      bindingKeys: Object.keys(dataSourceBindings)
    })
  }
}

/**
 * 初始化数据 - 🔥 修复：优先使用当前运行时数据
 */
const initializeData = () => {
  console.log('🔧 [DEBUG-Config] 初始化数据源数据:', {
    selectedWidgetId: props.selectedWidgetId,
    dataSourcesCount: props.dataSources.length,
    dataSourceKeys: props.dataSources.map(ds => ds.key)
  })

  // 🔥 重置配置缓存，允许新的配置发送
  lastSentConfig = null

  // 🔥 核心修复：先请求当前运行时数据
  if (props.selectedWidgetId) {
    console.log('🔄 [DataSourceConfigForm] 请求当前运行时数据:', props.selectedWidgetId)
    emit('request-current-data', props.selectedWidgetId)

    // 给父组件一点时间响应，然后再尝试恢复
    setTimeout(() => {
      attemptDataRestore()
    }, 50)
  } else {
    // 没有选中组件，使用默认数据
    useDefaultData()
  }
}

/**
 * 尝试数据恢复（从存储的配置）
 */
const attemptDataRestore = () => {
  let hasRestoredData = false

  if (props.selectedWidgetId) {
    try {
      console.log('🔍 [DEBUG-Restore] 开始尝试恢复配置:', props.selectedWidgetId)
      // const savedConfig = configurationManager.getConfiguration(props.selectedWidgetId)
      // console.log('🔍 [DEBUG-Restore] ConfigurationManager返回的完整配置:', savedConfig)

      // 尝试从多种数据结构恢复
      let dataSourceBindings = null

      // TODO: 实现配置恢复逻辑
      // if (savedConfig?.dataSource?.config?.dataSourceBindings) {
      //   dataSourceBindings = savedConfig.dataSource.config.dataSourceBindings
      //   console.log('🔧 [DEBUG-Config] 从dataSource.config恢复数据:', dataSourceBindings)
      // } else if (savedConfig?.dataSourceBindings) {
      //   dataSourceBindings = savedConfig.dataSourceBindings
      //   console.log('🔧 [DEBUG-Config] 从dataSourceBindings直接恢复数据:', dataSourceBindings)
      // }

      if (dataSourceBindings && Object.keys(dataSourceBindings).length > 0) {
        // 恢复每个数据源的保存数据
        Object.entries(dataSourceBindings).forEach(([key, binding]: [string, any]) => {
          if (binding?.rawData) {
            try {
              // 🔥 修复：检查保存的数据结构格式
              const parsedRawData = JSON.parse(binding.rawData)

              // 🔥 修复：根据数据结构决定如何恢复
              if (parsedRawData && typeof parsedRawData === 'object' && parsedRawData.currentData !== undefined) {
                // 新数据结构：包含 currentData 和 rawDataList
                dataValues[key] = {
                  currentData: parsedRawData.currentData,
                  rawDataList: parsedRawData.rawDataList || []
                }
                console.log(`🔧 [DEBUG-Config] 恢复新数据结构 ${key}:`, dataValues[key])
              } else {
                // 旧数据结构：直接是数据内容
                dataValues[key] = {
                  currentData: parsedRawData,
                  rawDataList: []
                }
                console.log(`🔧 [DEBUG-Config] 恢复旧数据结构并转换 ${key}:`, dataValues[key])
              }

              // 🔥 修复：同时从原始数据列表配置中恢复
              if (binding.rawDataList) {
                dataValues[key].rawDataList = binding.rawDataList
                console.log(`🔧 [DEBUG-Config] 恢复原始数据列表 ${key}:`, binding.rawDataList)
              }

              hasRestoredData = true
            } catch (error) {
              console.warn(`⚠️ [DEBUG-Config] 恢复数据源 ${key} 失败:`, error)
              // 🔥 修复：恢复失败时使用默认数据结构
              const defaultData = getDefaultData(key)
              dataValues[key] = {
                currentData: defaultData,
                rawDataList: []
              }
            }
          }
        })
      }
    } catch (error) {
      console.warn('⚠️ [DEBUG-Config] 配置恢复失败:', error)
    }
  }

  // 如果没有恢复到数据，使用默认数据
  if (!hasRestoredData) {
    useDefaultData()
  }

  // 🔥 修复：只在没有恢复到数据时发送初始配置
  // 恢复数据时不发送，避免重复发送相同配置
  if (!hasRestoredData) {
    console.log('🔧 [DEBUG-Config] 使用默认数据，发送初始配置')
    sendUpdate()
  } else {
    console.log('🔧 [DEBUG-Config] 数据已恢复，不发送重复配置')
    // 🔥 修复：更新 lastSentConfig 以避免后续重复发送
    const dataSourceBindings: Record<string, any> = {}
    props.dataSources.forEach(dataSource => {
      const dataSourceValue = dataValues[dataSource.key]
      if (dataSourceValue?.currentData !== undefined) {
        dataSourceBindings[dataSource.key] = {
          rawData: JSON.stringify(dataSourceValue.currentData),
          rawDataList: dataSourceValue.rawDataList || [],
          metadata: {
            hasRawDataList: dataSourceValue.rawDataList?.length > 0
            // 移除 activeRawDataId，因为原始数据项不影响最终数据
          }
        }
      }
    })
    lastSentConfig = JSON.stringify({ dataSourceBindings })
  }
}

/**
 * 使用默认数据 - 🔥 修改：支持新的数据结构
 */
const useDefaultData = () => {
  console.log('🔥 [DEBUG-Config] 使用默认数据初始化 - 新数据结构')
  props.dataSources.forEach(dataSource => {
    const defaultData = getDefaultData(dataSource.key)
    dataValues[dataSource.key] = {
      currentData: defaultData,
      rawDataList: []
    }
    console.log(`🔧 [DEBUG-Config] 初始化数据源: ${dataSource.key}`, dataValues[dataSource.key])
  })
}

// 🔥 原始数据管理函数

/**
 * 🔥 新增：获取复杂JSON示例
 */
const getJsonPlaceholder = () => {
  return `{
  "name": "张三",
  "age": 25,
  "email": "zhangsan@example.com"
}`
}

/**
 * 🔥 新增：获取JSON示例的默认值（用于初始化输入框）
 */
const getJsonDefaultValue = () => {
  return getJsonPlaceholder()
}

// 🔥 新增：数据处理核心函数

/**
 * 应用数据过滤路径
 */
const applyDataFilter = (data: any, filterPath: string): any => {
  if (!filterPath || filterPath.trim() === '') return data

  try {
    // 简单的JSONPath实现
    let current = data
    let cleanPath = filterPath.replace(/^\$\.?/, '').trim()

    if (!cleanPath) return data

    // 按点分割，但要处理数组索引
    const parts = cleanPath.split(/\.|\[|\]/).filter(part => part !== '')

    for (const part of parts) {
      if (current === null || current === undefined) return null

      // 处理数组索引
      if (/^\d+$/.test(part)) {
        const index = parseInt(part)
        if (Array.isArray(current) && index >= 0 && index < current.length) {
          current = current[index]
        } else {
          return null
        }
      } else {
        // 处理对象属性
        if (typeof current === 'object' && current !== null && part in current) {
          current = current[part]
        } else {
          return null
        }
      }
    }

    return current
  } catch (error) {
    console.warn('🔧 [DataFilter] 过滤路径解析失败:', error)
    return data // 失败时返回原数据
  }
}

/**
 * 应用处理脚本
 */
const applyProcessScript = async (data: any, script: string): Promise<any> => {
  if (!script || script.trim() === '') return data

  try {
    console.log('🔧 [ProcessScript] 执行脚本:', script.substring(0, 100))

    // 🔥 修复：创建数据的深拷贝，避免修改原始数据
    const dataCopy = JSON.parse(JSON.stringify(data))

    // 使用脚本引擎执行
    const result = await defaultScriptEngine.execute(script, { data: dataCopy })

    if (result.success) {
      console.log('✅ [ProcessScript] 脚本执行成功')
      return result.data
    } else {
      console.error('❌ [ProcessScript] 脚本执行失败:', result.error)
      console.warn('🔧 [ProcessScript] 返回原始数据')
      return data // 失败时返回原数据
    }
  } catch (error) {
    console.error('❌ [ProcessScript] 脚本执行异常:', error)
    console.warn('🔧 [ProcessScript] 返回原始数据')
    return data // 异常时返回原数据
  }
}

/**
 * 完整的数据处理流程：原始数据 -> 过滤 -> 脚本处理
 */
const processRawData = async (rawData: any, config: any): Promise<any> => {
  let processedData = rawData

  // 1. 应用数据过滤
  if (config?.filterPath) {
    processedData = applyDataFilter(processedData, config.filterPath)
    console.log('🔧 [DataProcess] 过滤后数据:', processedData)
  }

  // 2. 应用处理脚本
  if (config?.processScript) {
    processedData = await applyProcessScript(processedData, config.processScript)
    console.log('🔧 [DataProcess] 脚本处理后数据:', processedData)
  }

  return processedData
}

/**
 * 🔥 新增：获取数据项类型对应的颜色
 */
const getDataItemTypeColor = (
  type: RawDataItemType
): 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error' => {
  switch (type) {
    case 'json':
      return 'success'
    case 'http':
      return 'info'
    case 'websocket':
      return 'warning'
    default:
      return 'default'
  }
}

/**
 * 🔥 新增：根据类型生成数据
 */
const generateDataFromType = (type: RawDataItemType) => {
  console.log('🔧 [DEBUG-GenerateData] 生成数据，类型:', type, '内容:', newRawDataJsonContent.value.substring(0, 50))

  switch (type) {
    case 'json':
      // JSON 类型：如果用户输入了内容，尝试解析，否则返回空对象
      if (newRawDataJsonContent.value.trim()) {
        try {
          return JSON.parse(newRawDataJsonContent.value)
        } catch (error) {
          console.warn('JSON 解析失败，使用空对象:', error)
          return {}
        }
      }
      return {}

    case 'http':
      // HTTP 类型：返回默认HTTP配置结构
      return {
        url: newRawDataHttpUrl.value || '',
        method: newRawDataHttpMethod.value || 'GET',
        headers: newRawDataHttpHeaders.value ? JSON.parse(newRawDataHttpHeaders.value || '{}') : {},
        status: 'ready',
        lastFetch: null
      }

    case 'websocket':
      // WebSocket 类型：返回默认WebSocket配置结构
      return {
        url: newRawDataWebsocketUrl.value || '',
        protocols: newRawDataWebsocketProtocols.value
          ? newRawDataWebsocketProtocols.value.split(',').map(p => p.trim())
          : [],
        readyState: 'connecting',
        lastMessage: null
      }

    default:
      return {}
  }
}

/**
 * 🔥 简化：根据类型生成配置（包含过滤路径和处理脚本）
 */
const generateConfigFromType = (type: RawDataItemType) => {
  const baseConfig = {
    filterPath: currentFilterPath.value.trim() || undefined,
    processScript: currentProcessScript.value.trim() || undefined
  }

  switch (type) {
    case 'json':
      return {
        ...baseConfig,
        jsonData: newRawDataJsonContent.value || ''
      }

    case 'http':
      return {
        ...baseConfig,
        httpConfig: {
          url: newRawDataHttpUrl.value || '',
          method: newRawDataHttpMethod.value || 'GET',
          headers: newRawDataHttpHeaders.value ? JSON.parse(newRawDataHttpHeaders.value || '{}') : {}
        }
      }

    case 'websocket':
      return {
        ...baseConfig,
        websocketConfig: {
          url: newRawDataWebsocketUrl.value || '',
          protocols: newRawDataWebsocketProtocols.value
            ? newRawDataWebsocketProtocols.value.split(',').map(p => p.trim())
            : []
        }
      }

    default:
      return baseConfig
  }
}

/**
 * 打开添加原始数据弹窗
 */
const openAddRawDataModal = (dataSourceKey: string) => {
  // 🔥 新增：重置编辑模式状态（确保是添加模式）
  resetEditMode()

  currentDataSourceKey.value = dataSourceKey
  newRawDataName.value = ''

  // 🔥 修改：重置表单状态并设置JSON默认值
  newRawDataType.value = 'json'
  newRawDataJsonContent.value = getJsonDefaultValue() // 设置默认JSON内容
  newRawDataHttpUrl.value = ''
  newRawDataHttpMethod.value = 'GET'
  newRawDataHttpHeaders.value = ''
  newRawDataWebsocketUrl.value = ''
  newRawDataWebsocketProtocols.value = ''

  // 🔥 简化：重置过滤路径和添加示例处理脚本
  currentFilterPath.value = ''
  currentProcessScript.value = `// 示例：把第一个key变成username
var keys = Object.keys(data);
if (keys.length > 0) {
  var firstKey = keys[0];
  var firstValue = data[firstKey];
  delete data[firstKey];
  data.username = firstValue;
}
return data;`

  // 🔥 新增：初始化数据预览
  updatePreviewData()

  showAddRawDataModal.value = true
}

/**
 * 快速添加原始数据 - 极简交互，直接添加（备用）
 */
const quickAddRawData = (dataSourceKey: string) => {
  // 🔥 修复：确保数据源存在且rawDataList是数组
  if (!dataValues[dataSourceKey]) {
    dataValues[dataSourceKey] = {
      currentData: getDefaultData(dataSourceKey),
      rawDataList: []
    }
  }

  if (!dataValues[dataSourceKey].rawDataList || !Array.isArray(dataValues[dataSourceKey].rawDataList)) {
    dataValues[dataSourceKey].rawDataList = []
  }

  // 生成简洁的数据项名称
  const itemCount = dataValues[dataSourceKey].rawDataList.length + 1
  const itemName = `数据项${itemCount}`

  // 🔥 修改：创建新的原始数据项，包含类型信息
  const newRawDataItem: RawDataItem = {
    id: `raw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: itemName,
    type: 'json', // 快速添加默认为 JSON 类型
    data: {}, // 空对象，完全独立
    config: { jsonData: '' }, // 默认JSON配置
    createdAt: new Date().toISOString(),
    isActive: false
  }

  // 添加到列表
  dataValues[dataSourceKey].rawDataList.push(newRawDataItem)

  console.log('🔧 [DEBUG-Config] 快速添加数据项:', {
    dataSourceKey,
    itemName,
    totalCount: dataValues[dataSourceKey].rawDataList.length
  })
}

/**
 * 添加原始数据（弹窗版本）- 🔥 支持复杂配置
 */
const addRawData = () => {
  console.log('🔧 [DEBUG-AddRawData] addRawData 函数开始执行:', {
    newRawDataName: newRawDataName.value,
    trimmed: newRawDataName.value.trim(),
    currentDataSourceKey: currentDataSourceKey.value
  })

  if (!newRawDataName.value.trim()) {
    console.warn('🔧 [DEBUG-AddRawData] 原始数据名称不能为空')
    return
  }

  const dataSourceKey = currentDataSourceKey.value

  console.log('🔧 [DEBUG-AddRawData] 检查数据源Key:', {
    dataSourceKey,
    hasDataSource: !!dataValues[dataSourceKey],
    allDataKeys: Object.keys(dataValues)
  })

  // 🔥 修复：确保数据源存在且rawDataList是数组
  if (!dataValues[dataSourceKey]) {
    dataValues[dataSourceKey] = {
      currentData: getDefaultData(dataSourceKey),
      rawDataList: []
    }
  }

  if (!dataValues[dataSourceKey].rawDataList || !Array.isArray(dataValues[dataSourceKey].rawDataList)) {
    dataValues[dataSourceKey].rawDataList = []
  }

  // 🔥 修改：根据类型生成数据和配置
  const generatedData = generateDataFromType(newRawDataType.value)
  const generatedConfig = generateConfigFromType(newRawDataType.value)

  // 创建新的原始数据项 - 使用用户输入的名称和类型
  const newRawDataItem: RawDataItem = {
    id: `raw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: newRawDataName.value.trim(),
    type: newRawDataType.value, // 🔥 新增：保存类型
    data: generatedData, // 🔥 修改：根据类型生成数据
    config: generatedConfig, // 🔥 新增：保存配置
    createdAt: new Date().toISOString(),
    isActive: false
  }

  // 添加到列表
  dataValues[dataSourceKey].rawDataList.push(newRawDataItem)

  console.log('🔧 [DEBUG-Config] 添加数据项（弹窗版本）:', {
    dataSourceKey,
    newItem: newRawDataItem,
    totalCount: dataValues[dataSourceKey].rawDataList.length
  })

  // 🔥 修复：调用 sendUpdate 通知外部组件数据变化
  sendUpdate()

  console.log('🔧 [DEBUG-AddRawData] 准备关闭弹窗并重置表单')

  // 关闭弹窗并重置表单
  showAddRawDataModal.value = false
  newRawDataName.value = ''

  // 🔥 新增：重置类型选择相关状态
  newRawDataType.value = 'json'
  newRawDataJsonContent.value = ''
  newRawDataHttpUrl.value = ''
  newRawDataHttpMethod.value = 'GET'
  newRawDataHttpHeaders.value = ''
  newRawDataWebsocketUrl.value = ''
  newRawDataWebsocketProtocols.value = ''

  console.log('🔧 [DEBUG-Config] 数据项已添加，已通知更新')
}

/**
 * 删除原始数据 - 🔥 修改：原始数据项完全独立，不影响最终数据
 */
const deleteRawData = (dataSourceKey: string, rawDataId: string) => {
  const dataSourceValue = dataValues[dataSourceKey]
  if (!dataSourceValue) return

  // 找到要删除的项的索引
  const itemIndex = dataSourceValue.rawDataList.findIndex(item => item.id === rawDataId)
  if (itemIndex === -1) return

  const deletedItem = dataSourceValue.rawDataList[itemIndex]

  // 删除项
  dataSourceValue.rawDataList.splice(itemIndex, 1)

  console.log('🔧 [DEBUG-Config] 删除独立原始数据项:', {
    dataSourceKey,
    rawDataId,
    deletedItem,
    remainingCount: dataSourceValue.rawDataList.length
  })

  // 🔥 修改：原始数据项不影响最终数据，所以不需要调用 sendUpdate()
  console.log('🔧 [DEBUG-Config] 原始数据项已删除，不影响最终数据')
}

// 🔥 新增：查看当前数据源最终数据
const showCurrentFinalData = (dataSourceKey: string) => {
  const dataSourceValue = dataValues[dataSourceKey]
  if (dataSourceValue?.currentData) {
    try {
      currentFinalData.value = JSON.stringify(dataSourceValue.currentData, null, 2)
    } catch {
      currentFinalData.value = String(dataSourceValue.currentData)
    }
  } else {
    currentFinalData.value = '暂无数据'
  }

  currentDataSourceKey.value = dataSourceKey
  showFinalDataModal.value = true
}

// 🔥 修改：查看数据详情 - 显示处理后的数据
const viewRawDataDetail = async (dataSourceKey: string, rawDataId: string) => {
  const dataSourceValue = dataValues[dataSourceKey]
  if (!dataSourceValue) return

  const targetItem = dataSourceValue.rawDataList.find(item => item.id === rawDataId)
  if (!targetItem) return

  try {
    // 应用数据处理逻辑
    const processedData = await processRawData(targetItem.data, targetItem.config)

    // 显示处理后的数据
    currentRawDataDetail.value = JSON.stringify(processedData, null, 2)
    console.log('🔧 [ViewData] 原始数据:', targetItem.data)
    console.log('🔧 [ViewData] 处理后数据:', processedData)
  } catch {
    currentRawDataDetail.value = String(targetItem.data)
  }

  currentRawDataName.value = targetItem.name
  showRawDataDetailModal.value = true
}

// 🔥 新增：编辑数据项
const editRawData = (dataSourceKey: string, rawDataId: string) => {
  const dataSourceValue = dataValues[dataSourceKey]
  if (!dataSourceValue) return

  const targetItem = dataSourceValue.rawDataList.find(item => item.id === rawDataId)
  if (!targetItem) return

  // 进入编辑模式
  isEditMode.value = true
  editingDataSourceKey.value = dataSourceKey
  editingRawDataId.value = rawDataId

  // 填充表单数据
  newRawDataName.value = targetItem.name
  newRawDataType.value = targetItem.type

  // 根据类型填充对应的数据
  switch (targetItem.type) {
    case 'json':
      newRawDataJsonContent.value = targetItem.config?.jsonData || JSON.stringify(targetItem.data, null, 2)
      break
    case 'http':
      newRawDataHttpUrl.value = targetItem.config?.httpConfig?.url || ''
      newRawDataHttpMethod.value = targetItem.config?.httpConfig?.method || 'GET'
      newRawDataHttpHeaders.value = targetItem.config?.httpConfig?.headers
        ? JSON.stringify(targetItem.config.httpConfig.headers)
        : ''
      break
    case 'websocket':
      newRawDataWebsocketUrl.value = targetItem.config?.websocketConfig?.url || ''
      newRawDataWebsocketProtocols.value = targetItem.config?.websocketConfig?.protocols
        ? targetItem.config.websocketConfig.protocols.join(',')
        : ''
      break
  }

  // 填充过滤路径和处理脚本
  currentFilterPath.value = targetItem.config?.filterPath || ''
  currentProcessScript.value = targetItem.config?.processScript || ''

  console.log('🔧 [EditData] 进入编辑模式:', {
    dataSourceKey,
    rawDataId,
    targetItem,
    editMode: true
  })

  showAddRawDataModal.value = true
}

// 🔥 新增：保存编辑
const saveEdit = () => {
  if (!isEditMode.value || !editingDataSourceKey.value || !editingRawDataId.value) return

  const dataSourceValue = dataValues[editingDataSourceKey.value]
  if (!dataSourceValue) return

  const targetItemIndex = dataSourceValue.rawDataList.findIndex(item => item.id === editingRawDataId.value)
  if (targetItemIndex === -1) return

  const targetItem = dataSourceValue.rawDataList[targetItemIndex]

  // 更新基本信息
  targetItem.name = newRawDataName.value.trim()
  targetItem.type = newRawDataType.value

  // 根据类型生成新的数据和配置
  targetItem.data = generateDataFromType(newRawDataType.value)
  targetItem.config = generateConfigFromType(newRawDataType.value)

  console.log('🔧 [SaveEdit] 保存编辑:', {
    dataSourceKey: editingDataSourceKey.value,
    rawDataId: editingRawDataId.value,
    updatedItem: targetItem
  })

  // 退出编辑模式并关闭弹窗
  resetEditMode()
  showAddRawDataModal.value = false
}

// 🔥 新增：取消编辑
const cancelEdit = () => {
  resetEditMode()
  showAddRawDataModal.value = false
}

// 🔥 新增：重置编辑模式状态
const resetEditMode = () => {
  isEditMode.value = false
  editingDataSourceKey.value = ''
  editingRawDataId.value = ''

  // 清空表单数据
  newRawDataName.value = ''
  newRawDataType.value = 'json'
  newRawDataJsonContent.value = ''
  newRawDataHttpUrl.value = ''
  newRawDataHttpMethod.value = 'GET'
  newRawDataHttpHeaders.value = ''
  newRawDataWebsocketUrl.value = ''
  newRawDataWebsocketProtocols.value = ''
  currentFilterPath.value = ''
  currentProcessScript.value = ''
}

// 🔥 新增：统一的确认点击处理函数
const handleConfirmClick = () => {
  console.log('🔧 [DEBUG-Click] 确认按钮被点击:', {
    isEditMode: isEditMode.value,
    newRawDataName: newRawDataName.value,
    currentDataSourceKey: currentDataSourceKey.value
  })

  if (isEditMode.value) {
    console.log('🔧 [DEBUG-Click] 执行编辑保存')
    saveEdit()
  } else {
    console.log('🔧 [DEBUG-Click] 执行添加数据')
    addRawData()
  }
}

// 组件挂载时初始化
onMounted(() => {
  initializeData()
})

// 🔥 监听 selectedWidgetId 变化，重新初始化
watch(
  () => props.selectedWidgetId,
  (newId, oldId) => {
    if (newId && newId !== oldId) {
      console.log('🔄 [DataSourceConfigForm] selectedWidgetId 变化，重新初始化:', { oldId, newId })
      initializeData()
    }
  },
  { immediate: false }
)

// 监听 props 变化，重新初始化
watch(
  () => props.dataSources,
  () => {
    initializeData()
  },
  { deep: true }
)

// 🔥 调试：监听dataValues变化
watch(
  () => dataValues,
  newDataValues => {
    console.log('🔧 [DEBUG-Config] dataValues变化:', {
      keys: Object.keys(newDataValues),
      values: newDataValues
    })
  },
  { deep: true, immediate: true }
)
</script>

<style scoped>
.data-source-config-form {
  width: 100%;
}

.data-source-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.example-data-icon {
  color: var(--text-color-3);
  margin-left: 8px;
  cursor: help;
  transition: color 0.2s;
}

.example-data-icon:hover {
  color: var(--primary-color);
}

.example-data-tooltip {
  max-width: 350px;
  padding: 4px 0;
}

.tooltip-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 8px;
  opacity: 0.9;
}

.example-code-container {
  background: var(--code-color, var(--card-color));
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.example-code {
  margin: 0;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.4;
  color: var(--text-color);
  background: transparent;
  overflow-x: auto;
  white-space: pre;
  max-height: 200px;
  overflow-y: auto;
}

/* 明暗主题适配 */
[data-theme='dark'] .example-code-container {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme='dark'] .example-code {
  color: rgba(255, 255, 255, 0.9);
}

[data-theme='light'] .example-code-container {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme='light'] .example-code {
  color: rgba(0, 0, 0, 0.85);
}

/* 滚动条美化 */
.example-code::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.example-code::-webkit-scrollbar-track {
  background: transparent;
}

.example-code::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}

.example-code::-webkit-scrollbar-thumb:hover {
  background: var(--text-color-3);
}

.data-source-content {
  padding: 16px;
  background: var(--card-color);
  border-radius: 6px;
  border: 1px solid var(--border-color);
}

/* 添加按钮样式 - 极简经济设计 */
.add-data-btn {
  width: 100%;
  border-style: dashed;
  border-width: 1px;
  background: transparent;
  transition: all 0.2s ease;
  font-size: 12px;
  height: 28px;
  color: var(--text-color-3);
}

.add-data-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: var(--primary-color-hover);
}

.add-data-btn:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color-pressed);
}

/* 原始数据列表样式 */
.raw-data-list {
  max-height: 200px;
  overflow-y: auto;
}

.raw-data-item-compact {
  padding: 6px 10px;
  border: 1px solid var(--border-color);
  border-radius: 3px;
  margin-bottom: 3px;
  transition: all 0.15s;
  background-color: var(--card-color);
  font-size: 12px;
}

.raw-data-item-compact:hover {
  border-color: var(--primary-color);
  background-color: var(--hover-color);
}

/* 紧凑按钮样式 */
.compact-btn {
  min-width: 36px;
  height: 20px;
  font-size: 10px;
  padding: 0 6px;
  border-radius: 3px;
}

.compact-btn:hover {
  transform: none;
  box-shadow: none;
}

.raw-data-name {
  font-weight: 500;
  color: var(--text-color);
}

/* 🔥 新增：动态表单区域样式 - 紧凑化布局 */
.dynamic-form-area {
  margin-top: 6px;
  border: 1px dashed var(--border-color);
  border-radius: 4px;
  padding: 8px;
  background: var(--hover-color);
  transition: all 0.2s ease;
  min-height: 60px;
}

.dynamic-form-area:hover {
  border-color: var(--primary-color);
  background: var(--primary-color-hover);
}

/* 弹窗内部表单项紧凑化 */
.dynamic-form-area .n-form-item {
  margin-bottom: 0;
}

/* 弹窗文本区域优化 */
.dynamic-form-area .n-input__textarea-el {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', 'Consolas', monospace;
  font-size: 12px;
  line-height: 1.4;
}

/* 类型标签样式调整 */
.dynamic-form-area .n-tag {
  transition: all 0.15s ease;
}

.dynamic-form-area .n-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 明暗主题适配 */
[data-theme='dark'] .dynamic-form-area {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.1);
}

[data-theme='dark'] .dynamic-form-area:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: var(--primary-color);
}

[data-theme='light'] .dynamic-form-area {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.08);
}

[data-theme='light'] .dynamic-form-area:hover {
  background: rgba(0, 0, 0, 0.03);
  border-color: var(--primary-color);
}

/* 🔥 简化：移除复杂样式，使用标准表单样式 */
</style>
