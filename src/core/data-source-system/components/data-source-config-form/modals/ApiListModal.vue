<!--
  系统API选择弹窗组件
  用于显示和选择预定义的系统API接口
-->
<template>
  <n-modal
    v-model:show="visible"
    :title="$t('dataSource.apiList.title')"
    :size="modalSize"
    preset="card"
    :closable="true"
    :mask-closable="false"
    :close-on-esc="true"
    transform-origin="center"
    class="api-list-modal"
  >
    <!-- 搜索和过滤 -->
    <n-space vertical :size="16">
      <n-space :size="12">
        <n-input
          v-model:value="searchKeyword"
          :placeholder="$t('dataSource.apiList.searchPlaceholder')"
          clearable
          style="flex: 1"
        >
          <template #prefix>
            <n-icon><SearchOutline /></n-icon>
          </template>
        </n-input>

        <n-select
          v-model:value="filterCategory"
          :options="categoryOptions"
          :placeholder="$t('dataSource.apiList.filterCategory')"
          clearable
          style="width: 180px"
        />

        <n-select
          v-model:value="filterMethod"
          :options="methodOptions"
          :placeholder="$t('dataSource.apiList.filterMethod')"
          clearable
          style="width: 120px"
        />
      </n-space>

      <!-- API列表 -->
      <n-card>
        <template #header>
          <n-space justify="space-between" align="center">
            <span>{{ $t('dataSource.apiList.availableApis') }}</span>
            <n-space align="center" :size="8">
              <n-text :depth="3">
                {{
                  $t('dataSource.apiList.showingCount', {
                    current: filteredApis.length,
                    total: apiList.length
                  })
                }}
              </n-text>
              <n-button size="small" :loading="refreshing" @click="refreshApiList">
                <template #icon>
                  <n-icon><RefreshOutline /></n-icon>
                </template>
              </n-button>
            </n-space>
          </n-space>
        </template>

        <template v-if="filteredApis.length">
          <n-list bordered>
            <n-list-item
              v-for="api in paginatedApis"
              :key="api.id"
              class="api-list-item"
              :class="{ selected: selectedApi?.id === api.id }"
              @click="selectApi(api)"
            >
              <n-space justify="space-between" align="center">
                <n-space vertical :size="4">
                  <n-space align="center" :size="8">
                    <n-tag :type="getMethodTagType(api.method)" size="small">
                      {{ api.method }}
                    </n-tag>
                    <n-text strong>{{ api.name }}</n-text>
                    <n-tag v-if="api.category" type="info" size="small">
                      {{ api.category }}
                    </n-tag>
                  </n-space>

                  <n-text :depth="3" class="api-url">
                    {{ api.url }}
                  </n-text>

                  <n-text v-if="api.description" :depth="2" class="api-description">
                    {{ api.description }}
                  </n-text>
                </n-space>

                <n-space vertical align="end" :size="4">
                  <n-space :size="4">
                    <n-button size="tiny" :loading="previewingId === api.id" @click.stop="previewApi(api)">
                      <template #icon>
                        <n-icon><EyeOutline /></n-icon>
                      </template>
                    </n-button>
                    <n-button size="tiny" :loading="testingId === api.id" @click.stop="testApi(api)">
                      <template #icon>
                        <n-icon><PlayOutline /></n-icon>
                      </template>
                    </n-button>
                  </n-space>

                  <!-- API状态指示器 -->
                  <n-space align="center" :size="4">
                    <n-icon :color="getApiStatusColor(api.status)" size="12">
                      <EllipseOutline />
                    </n-icon>
                    <n-text :depth="3" style="font-size: 12px">
                      {{ getApiStatusText(api.status) }}
                    </n-text>
                  </n-space>
                </n-space>
              </n-space>
            </n-list-item>
          </n-list>

          <!-- 分页 -->
          <template v-if="totalPages > 1">
            <n-divider />
            <n-space justify="center">
              <n-pagination
                v-model:page="currentPage"
                :page-count="totalPages"
                :page-size="pageSize"
                show-size-picker
                :page-sizes="[10, 20, 50]"
                @update:page-size="handlePageSizeChange"
              />
            </n-space>
          </template>
        </template>

        <template v-else>
          <n-empty :description="$t('dataSource.apiList.noApis')" />
        </template>
      </n-card>

      <!-- API详情预览 -->
      <template v-if="previewApi && apiPreview">
        <n-card>
          <template #header>
            <n-space align="center" :size="8">
              <n-icon><DocumentTextOutline /></n-icon>
              <span>{{ $t('dataSource.apiList.preview') }} - {{ apiPreview.name }}</span>
            </n-space>
          </template>

          <n-tabs type="segment" animated>
            <n-tab-pane name="info" :tab="$t('dataSource.apiList.basicInfo')">
              <n-descriptions :column="2" bordered>
                <n-descriptions-item :label="$t('dataSource.apiList.method')">
                  <n-tag :type="getMethodTagType(apiPreview.method)">
                    {{ apiPreview.method }}
                  </n-tag>
                </n-descriptions-item>
                <n-descriptions-item :label="$t('dataSource.apiList.category')">
                  {{ apiPreview.category || '--' }}
                </n-descriptions-item>
                <n-descriptions-item :label="$t('dataSource.apiList.url')" :span="2">
                  <n-text code>{{ apiPreview.url }}</n-text>
                </n-descriptions-item>
                <n-descriptions-item :label="$t('dataSource.apiList.description')" :span="2">
                  {{ apiPreview.description || '--' }}
                </n-descriptions-item>
              </n-descriptions>
            </n-tab-pane>

            <n-tab-pane name="params" :tab="$t('dataSource.apiList.parameters')">
              <template v-if="apiPreview.parameters?.length">
                <n-data-table
                  :columns="parameterColumns"
                  :data="apiPreview.parameters"
                  :pagination="false"
                  size="small"
                />
              </template>
              <template v-else>
                <n-empty :description="$t('dataSource.apiList.noParameters')" />
              </template>
            </n-tab-pane>

            <n-tab-pane name="response" :tab="$t('dataSource.apiList.responseExample')">
              <template v-if="apiPreview.responseExample">
                <code-editor
                  :value="JSON.stringify(apiPreview.responseExample, null, 2)"
                  language="json"
                  :height="300"
                  :read-only="true"
                />
              </template>
              <template v-else>
                <n-empty :description="$t('dataSource.apiList.noResponseExample')" />
              </template>
            </n-tab-pane>
          </n-tabs>
        </n-card>
      </template>

      <!-- 测试结果 -->
      <template v-if="testResult">
        <n-card>
          <template #header>
            <n-space align="center" :size="8">
              <n-icon><FlaskOutline /></n-icon>
              <span>{{ $t('dataSource.apiList.testResult') }}</span>
              <n-tag :type="testResult.success ? 'success' : 'error'">
                {{ testResult.success ? $t('common.success') : $t('common.failed') }}
              </n-tag>
            </n-space>
          </template>

          <n-space vertical :size="12">
            <n-space align="center" :size="8">
              <n-text :depth="3">{{ $t('dataSource.detail.responseTime') }}:</n-text>
              <n-text>{{ testResult.responseTime }}ms</n-text>
            </n-space>

            <template v-if="testResult.error">
              <n-alert type="error" :show-icon="true">
                {{ testResult.error }}
              </n-alert>
            </template>

            <template v-if="testResult.data">
              <code-editor
                :value="JSON.stringify(testResult.data, null, 2)"
                language="json"
                :height="200"
                :read-only="true"
              />
            </template>
          </n-space>
        </n-card>
      </template>
    </n-space>

    <template #footer>
      <n-space justify="space-between" align="center">
        <n-space :size="8">
          <n-text v-if="selectedApi" :depth="3">{{ $t('dataSource.apiList.selected') }}: {{ selectedApi.name }}</n-text>
        </n-space>

        <n-space :size="12">
          <n-button @click="handleCancel">
            {{ $t('common.cancel') }}
          </n-button>
          <n-button type="primary" :disabled="!selectedApi" @click="handleConfirm">
            <template #icon>
              <n-icon><CheckmarkOutline /></n-icon>
            </template>
            {{ $t('common.confirm') }}
          </n-button>
        </n-space>
      </n-space>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
/**
 * 系统API选择弹窗组件
 * 提供系统预定义API的浏览、搜索、预览和选择功能
 * 支持API测试和参数配置
 */
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import {
  SearchOutline,
  RefreshOutline,
  EyeOutline,
  PlayOutline,
  EllipseOutline,
  DocumentTextOutline,
  FlaskOutline,
  CheckmarkOutline
} from '@vicons/ionicons5'
import ScriptEditor from '../ui/ScriptEditor.vue'

// 类型定义
interface SystemApi {
  id: string
  name: string
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  category?: string
  description?: string
  parameters?: ApiParameter[]
  responseExample?: any
  status?: 'active' | 'inactive' | 'deprecated' | 'testing'
  version?: string
  tags?: string[]
  headers?: Array<{ key: string; value: string }>
  rateLimit?: {
    requests: number
    period: string
  }
  authentication?: {
    type: 'none' | 'basic' | 'bearer' | 'apikey'
    required: boolean
  }
}

interface ApiParameter {
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required: boolean
  description?: string
  defaultValue?: any
  example?: any
}

interface ApiTestResult {
  success: boolean
  data?: any
  responseTime: number
  error?: string
}

interface Props {
  visible: boolean
  apiList?: SystemApi[]
  selectedApiId?: string
  category?: string
  size?: 'small' | 'medium' | 'large' | 'huge'
}

interface Emits {
  'update:visible': [value: boolean]
  select: [api: SystemApi]
  cancel: []
}

const props = withDefaults(defineProps<Props>(), {
  apiList: () => [],
  size: 'large'
})

const emit = defineEmits<Emits>()

// 国际化
const { t } = useI18n()
const message = useMessage()

// 状态管理
const searchKeyword = ref('')
const filterCategory = ref('')
const filterMethod = ref('')
const currentPage = ref(1)
const pageSize = ref(20)
const refreshing = ref(false)
const previewingId = ref('')
const testingId = ref('')

// 选择状态
const selectedApi = ref<SystemApi | null>(null)
const apiPreview = ref<SystemApi | null>(null)
const testResult = ref<ApiTestResult | null>(null)

// 计算属性
const visible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
})

const modalSize = computed(() => {
  const sizeMap = {
    small: '800px',
    medium: '1000px',
    large: '1200px',
    huge: '1400px'
  }
  return sizeMap[props.size]
})

// 分类选项
const categoryOptions = computed(() => {
  const categories = [...new Set(props.apiList.map(api => api.category).filter(Boolean))]
  return categories.map(cat => ({ label: cat, value: cat }))
})

// 方法选项
const methodOptions = computed(() => [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' }
])

// 过滤后的API列表
const filteredApis = computed(() => {
  let filtered = props.apiList

  // 搜索关键词过滤
  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(
      api =>
        api.name.toLowerCase().includes(keyword) ||
        api.url.toLowerCase().includes(keyword) ||
        api.description?.toLowerCase().includes(keyword) ||
        api.tags?.some(tag => tag.toLowerCase().includes(keyword))
    )
  }

  // 分类过滤
  if (filterCategory.value) {
    filtered = filtered.filter(api => api.category === filterCategory.value)
  }

  // 方法过滤
  if (filterMethod.value) {
    filtered = filtered.filter(api => api.method === filterMethod.value)
  }

  // 按状态和名称排序
  return filtered.sort((a, b) => {
    // 优先显示活跃状态的API
    const statusOrder = { active: 0, testing: 1, inactive: 2, deprecated: 3 }
    const aOrder = statusOrder[a.status || 'active']
    const bOrder = statusOrder[b.status || 'active']

    if (aOrder !== bOrder) return aOrder - bOrder
    return a.name.localeCompare(b.name)
  })
})

// 分页
const totalPages = computed(() => Math.ceil(filteredApis.value.length / pageSize.value))
const paginatedApis = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredApis.value.slice(start, end)
})

// 参数表格列定义
const parameterColumns = computed<DataTableColumns<ApiParameter>>(() => [
  {
    title: t('dataSource.apiList.paramName'),
    key: 'name',
    width: 120,
    render: row => {
      return row.required ? h('span', { style: 'color: red' }, `${row.name} *`) : row.name
    }
  },
  {
    title: t('dataSource.apiList.paramType'),
    key: 'type',
    width: 80,
    render: row => h('n-tag', { size: 'small' }, { default: () => row.type })
  },
  {
    title: t('dataSource.apiList.description'),
    key: 'description',
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: t('dataSource.apiList.example'),
    key: 'example',
    width: 150,
    render: row => {
      if (!row.example) return '--'
      return h('n-text', { code: true }, { default: () => JSON.stringify(row.example) })
    }
  }
])

// 监听器
watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      initializeModal()
    }
  }
)

watch(
  () => [searchKeyword.value, filterCategory.value, filterMethod.value],
  () => {
    currentPage.value = 1 // 重置到第一页
  }
)

// 生命周期
onMounted(() => {
  if (props.visible) {
    initializeModal()
  }
})

// 方法
/**
 * 初始化弹窗状态
 * 重置搜索条件和选择状态
 */
const initializeModal = () => {
  // 应用初始过滤条件
  if (props.category) {
    filterCategory.value = props.category
  }

  // 设置初始选择
  if (props.selectedApiId) {
    const api = props.apiList.find(api => api.id === props.selectedApiId)
    if (api) {
      selectedApi.value = api
    }
  }

  // 清除状态
  apiPreview.value = null
  testResult.value = null
  previewingId.value = ''
  testingId.value = ''
  currentPage.value = 1
}

/**
 * 获取HTTP方法标签类型
 * @param method HTTP方法
 */
const getMethodTagType = (method: string) => {
  const typeMap = {
    GET: 'info',
    POST: 'success',
    PUT: 'warning',
    DELETE: 'error',
    PATCH: 'default'
  }
  return typeMap[method as keyof typeof typeMap] || 'default'
}

/**
 * 获取API状态颜色
 * @param status API状态
 */
const getApiStatusColor = (status: string = 'active'): string => {
  const colorMap = {
    active: '#18a058',
    testing: '#f0a020',
    inactive: '#d03050',
    deprecated: '#909399'
  }
  return colorMap[status as keyof typeof colorMap] || '#18a058'
}

/**
 * 获取API状态文本
 * @param status API状态
 */
const getApiStatusText = (status: string = 'active'): string => {
  const textMap = {
    active: t('dataSource.apiList.status.active'),
    testing: t('dataSource.apiList.status.testing'),
    inactive: t('dataSource.apiList.status.inactive'),
    deprecated: t('dataSource.apiList.status.deprecated')
  }
  return textMap[status as keyof typeof textMap] || t('dataSource.apiList.status.active')
}

/**
 * 选择API
 * @param api 选中的API
 */
const selectApi = (api: SystemApi) => {
  selectedApi.value = api
  // 自动显示预览
  previewApi(api)
}

/**
 * 预览API详情
 * @param api 要预览的API
 */
const previewApi = async (api: SystemApi) => {
  previewingId.value = api.id
  try {
    // 模拟获取API详细信息（实际项目中可能需要从服务器获取）
    await new Promise(resolve => setTimeout(resolve, 500))
    apiPreview.value = api
  } catch (error: any) {
    message.error(t('dataSource.apiList.previewError'))
    console.error('预览API失败:', error)
  } finally {
    previewingId.value = ''
  }
}

/**
 * 测试API连接
 * @param api 要测试的API
 */
const testApi = async (api: SystemApi) => {
  testingId.value = api.id
  const startTime = Date.now()

  try {
    // 构建请求配置
    const requestConfig: RequestInit = {
      method: api.method,
      headers: {}
    }

    // 添加API预定义的请求头
    if (api.headers?.length) {
      api.headers.forEach(header => {
        requestConfig.headers![header.key] = header.value
      })
    }

    // 发送请求
    const response = await fetch(api.url, requestConfig)
    const responseTime = Date.now() - startTime
    const data = await response.json()

    testResult.value = {
      success: response.ok,
      data,
      responseTime,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`
    }

    if (response.ok) {
      message.success(t('dataSource.apiList.testSuccess'))
    } else {
      message.error(t('dataSource.apiList.testFailed'))
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    testResult.value = {
      success: false,
      responseTime,
      error: error.message || t('dataSource.apiList.testError')
    }
    message.error(t('dataSource.apiList.testError'))
  } finally {
    testingId.value = ''
  }
}

/**
 * 刷新API列表
 */
const refreshApiList = async () => {
  refreshing.value = true
  try {
    // 模拟刷新操作（实际项目中重新从服务器获取）
    await new Promise(resolve => setTimeout(resolve, 1000))
    message.success(t('dataSource.apiList.refreshSuccess'))
  } catch (error: any) {
    message.error(t('dataSource.apiList.refreshError'))
    console.error('刷新API列表失败:', error)
  } finally {
    refreshing.value = false
  }
}

/**
 * 处理分页大小变化
 * @param newPageSize 新的分页大小
 */
const handlePageSizeChange = (newPageSize: number) => {
  pageSize.value = newPageSize
  currentPage.value = 1
}

/**
 * 处理确认选择
 */
const handleConfirm = () => {
  if (!selectedApi.value) {
    message.warning(t('dataSource.apiList.pleaseSelect'))
    return
  }

  emit('select', selectedApi.value)
  visible.value = false
}

/**
 * 处理取消操作
 */
const handleCancel = () => {
  emit('cancel')
  visible.value = false
}
</script>

<style scoped>
.api-list-modal {
  max-height: 95vh;
  overflow-y: auto;
}

.api-list-item {
  cursor: pointer;
  transition: all 0.3s ease;
}

.api-list-item:hover {
  background-color: var(--hover-color);
}

.api-list-item.selected {
  background-color: var(--primary-color-pressed);
  border-color: var(--primary-color);
}

.api-url {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  word-break: break-all;
}

.api-description {
  font-size: 13px;
  line-height: 1.4;
  max-width: 400px;
}

:deep(.n-list-item) {
  padding: 12px 16px;
}

:deep(.n-data-table) {
  font-size: 13px;
}

:deep(.n-pagination) {
  justify-content: center;
}

:deep(.n-tabs-nav) {
  margin-bottom: 12px;
}

:deep(.n-descriptions-item-label) {
  font-weight: 500;
  color: var(--text-color);
}

:deep(.n-descriptions-item-content) {
  color: var(--text-color-2);
}

/* 主题适配 */
[data-theme='dark'] .api-list-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

[data-theme='dark'] .api-list-item.selected {
  background-color: rgba(24, 160, 88, 0.15);
  border-color: var(--primary-color);
}

[data-theme='dark'] .api-url {
  color: var(--text-color-3);
}

[data-theme='dark'] .api-description {
  color: var(--text-color-2);
}
</style>
