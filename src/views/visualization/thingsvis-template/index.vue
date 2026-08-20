<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  NAlert,
  NAvatar,
  NButton,
  NCard,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NPagination,
  NProgress,
  NSelect,
  NSpace,
  NSpin,
  NTag,
  NTooltip,
  useMessage
} from 'naive-ui'
import {
  createDashboardFromTemplate,
  getDashboardTemplateCompatibleDevices,
  getLocalDashboardTemplates,
  type CompatibleDeviceBinding,
  type LocalDashboardTemplate,
  type LocalDashboardTemplateStatus
} from '@/service/api/dashboard-template'

const router = useRouter()
const message = useMessage()

const loading = ref(false)
const templates = ref<LocalDashboardTemplate[]>([])
const total = ref(0)
const filters = reactive({
  keyword: '',
  source: null as LocalDashboardTemplate['source'] | null,
  status: null as LocalDashboardTemplateStatus | null,
  page: 1,
  pageSize: 12
})

const createVisible = ref(false)
const loadingDevices = ref(false)
const creating = ref(false)
const selectedTemplate = ref<LocalDashboardTemplate | null>(null)
const compatibleBindings = ref<CompatibleDeviceBinding[]>([])
const instanceName = ref('')
const selectedDevices = ref<Record<string, string | null>>({})

const sourceOptions = [
  { label: '资源中心下载', value: 'MARKET' },
  { label: '本地创建', value: 'LOCAL' }
]

const statusOptions = [
  { label: '可创建看板', value: 'READY' },
  { label: '缺少真实设备', value: 'MISSING_DEVICE' },
  { label: '已停用', value: 'DISABLED' }
]

const requiredCount = computed(() => compatibleBindings.value.filter(binding => binding.required).length)
const boundRequiredCount = computed(
  () => compatibleBindings.value.filter(binding => binding.required && selectedDevices.value[binding.bindingKey]).length
)
const canCreate = computed(
  () =>
    Boolean(instanceName.value.trim()) &&
    compatibleBindings.value.every(binding => !binding.required || Boolean(selectedDevices.value[binding.bindingKey]))
)

async function fetchTemplates() {
  loading.value = true
  try {
    const result = await getLocalDashboardTemplates({
      page: filters.page,
      pageSize: filters.pageSize,
      keyword: filters.keyword.trim() || undefined,
      source: filters.source || undefined,
      status: filters.status || undefined
    })
    if (result.error) {
      message.error(result.error.message)
      templates.value = []
      total.value = 0
      return
    }
    templates.value = result.data?.list ?? []
    total.value = result.data?.total ?? 0
  } finally {
    loading.value = false
  }
}

function search() {
  filters.page = 1
  void fetchTemplates()
}

function clearFilters() {
  filters.keyword = ''
  filters.source = null
  filters.status = null
  search()
}

async function openCreate(template: LocalDashboardTemplate) {
  selectedTemplate.value = template
  instanceName.value = `${template.name}实例`
  selectedDevices.value = {}
  compatibleBindings.value = []
  createVisible.value = true
  loadingDevices.value = true

  try {
    const result = await getDashboardTemplateCompatibleDevices(template.id)
    if (result.error) {
      message.error(result.error.message)
      return
    }

    compatibleBindings.value = result.data?.bindings ?? []
    for (const binding of compatibleBindings.value) {
      selectedDevices.value[binding.bindingKey] = binding.devices.length === 1 ? binding.devices[0].id : null
    }
  } finally {
    loadingDevices.value = false
  }
}

function goCreateDevice(binding: CompatibleDeviceBinding) {
  createVisible.value = false

  if (!binding.localDeviceConfigId) {
    void router.push({
      name: 'device_config-edit',
      query: {
        deviceTemplateId: binding.localDeviceTemplateId,
        from: 'dashboard-template',
        dashboardTemplateId: selectedTemplate.value?.id
      }
    })
    return
  }

  void router.push({
    name: 'device_manage',
    query: {
      deviceConfigId: binding.localDeviceConfigId,
      from: 'dashboard-template',
      dashboardTemplateId: selectedTemplate.value?.id
    }
  })
}

async function createDashboard() {
  if (!selectedTemplate.value || !canCreate.value) return

  creating.value = true
  try {
    const deviceBindings = compatibleBindings.value
      .map(binding => ({
        bindingKey: binding.bindingKey,
        localDeviceId: selectedDevices.value[binding.bindingKey]
      }))
      .filter((binding): binding is { bindingKey: string; localDeviceId: string } => Boolean(binding.localDeviceId))

    const result = await createDashboardFromTemplate(selectedTemplate.value.id, {
      name: instanceName.value.trim(),
      deviceBindings
    })
    if (result.error || !result.data) {
      message.error(result.error?.message || '创建看板失败')
      return
    }

    createVisible.value = false
    message.success('看板创建成功')
    await router.push({
      name: 'visualization_thingsvis-editor',
      query: {
        id: result.data.dashboardId,
        projectId: result.data.projectId
      }
    })
  } finally {
    creating.value = false
  }
}

function statusLabel(status: LocalDashboardTemplateStatus) {
  return statusOptions.find(option => option.value === status)?.label ?? status
}

function statusType(status: LocalDashboardTemplateStatus): 'success' | 'warning' | 'default' {
  if (status === 'READY') return 'success'
  if (status === 'MISSING_DEVICE') return 'warning'
  return 'default'
}

onMounted(() => {
  void fetchTemplates()
})
</script>

<template>
  <div class="dashboard-template-page">
    <NCard :bordered="false">
      <div class="page-header">
        <div>
          <h2>本地看板模板</h2>
          <p>管理从资源中心下载或本地创建的模板，绑定真实设备后创建可运行看板。</p>
        </div>
        <NTag type="info" :bordered="false">共 {{ total }} 个模板</NTag>
      </div>

      <div class="filters">
        <NInput
          v-model:value="filters.keyword"
          clearable
          placeholder="搜索模板名称..."
          style="width: 280px"
          @keyup.enter="search"
          @clear="search"
        >
          <template #prefix><icon-mdi:magnify /></template>
        </NInput>
        <NSelect
          v-model:value="filters.source"
          clearable
          placeholder="全部来源"
          :options="sourceOptions"
          style="width: 150px"
          @update:value="search"
        />
        <NSelect
          v-model:value="filters.status"
          clearable
          placeholder="全部状态"
          :options="statusOptions"
          style="width: 160px"
          @update:value="search"
        />
        <NButton @click="clearFilters">重置</NButton>
      </div>

      <NSpin :show="loading">
        <NEmpty
          v-if="!loading && templates.length === 0"
          description="暂无本地看板模板，请先从资源中心下载"
          class="empty"
        >
          <template #extra>
            <NButton type="primary" @click="router.push({ name: 'resource-hub_dashboard' })">前往资源中心</NButton>
          </template>
        </NEmpty>

        <div v-else class="template-grid">
          <NCard v-for="template in templates" :key="template.id" hoverable class="template-card">
            <div class="template-heading">
              <NAvatar :src="template.thumbnail" :size="48" round>
                {{ template.name.charAt(0) }}
              </NAvatar>
              <div class="template-title">
                <NTooltip>
                  <template #trigger>
                    <h3>{{ template.name }}</h3>
                  </template>
                  {{ template.name }}
                </NTooltip>
                <NSpace size="small">
                  <NTag size="small" :type="template.source === 'MARKET' ? 'info' : 'default'">
                    {{ template.source === 'MARKET' ? '资源中心下载' : '本地创建' }}
                  </NTag>
                  <NTag size="small" :type="statusType(template.status)">
                    {{ statusLabel(template.status) }}
                  </NTag>
                </NSpace>
              </div>
            </div>

            <p class="description">{{ template.description || '暂无描述' }}</p>

            <div class="template-meta">
              <span>版本 {{ template.version }}</span>
              <span>{{ template.bindings.length }} 个设备角色</span>
              <span>已创建 {{ template.instanceCount }} 个看板</span>
            </div>

            <div class="binding-summary">
              <div v-for="binding in template.bindings" :key="binding.bindingKey" class="binding-item">
                <span>{{ binding.displayName }}</span>
                <NTag size="tiny" :type="binding.required ? 'error' : 'default'">
                  {{ binding.required ? '必需' : '可选' }}
                </NTag>
              </div>
            </div>

            <div class="card-actions">
              <NButton type="primary" :disabled="template.status === 'DISABLED'" @click="openCreate(template)">
                创建看板
              </NButton>
            </div>
          </NCard>
        </div>
      </NSpin>

      <div v-if="total > filters.pageSize" class="pagination">
        <NPagination
          v-model:page="filters.page"
          :page-size="filters.pageSize"
          :item-count="total"
          @update:page="fetchTemplates"
        />
      </div>
    </NCard>

    <NModal
      v-model:show="createVisible"
      preset="card"
      title="从模板创建看板"
      style="width: min(760px, calc(100vw - 32px))"
      :mask-closable="!creating"
    >
      <NSpin :show="loadingDevices">
        <NForm label-placement="top">
          <NFormItem label="看板名称" required>
            <NInput v-model:value="instanceName" maxlength="100" show-count />
          </NFormItem>

          <div class="binding-progress">
            <div class="progress-title">
              <span>设备绑定</span>
              <span>{{ boundRequiredCount }} / {{ requiredCount }}</span>
            </div>
            <NProgress
              type="line"
              :percentage="requiredCount ? Math.round((boundRequiredCount / requiredCount) * 100) : 100"
              :show-indicator="false"
            />
          </div>

          <NAlert
            v-if="compatibleBindings.some(binding => binding.required && binding.devices.length === 0)"
            type="warning"
          >
            部分必需角色暂无兼容设备。请先基于对应设备模板创建真实设备，再返回创建看板。
          </NAlert>

          <div class="binding-list">
            <NCard v-for="binding in compatibleBindings" :key="binding.bindingKey" size="small">
              <div class="binding-row">
                <div class="binding-info">
                  <div class="binding-name">
                    <span v-if="binding.required" class="required">*</span>
                    {{ binding.displayName }}
                  </div>
                  <div class="binding-template">设备模板：{{ binding.localDeviceTemplateName }}</div>
                </div>
                <div class="binding-control">
                  <NSelect
                    v-model:value="selectedDevices[binding.bindingKey]"
                    clearable
                    filterable
                    :placeholder="binding.devices.length ? '选择真实设备' : '暂无兼容设备'"
                    :options="
                      binding.devices.map(device => ({
                        label: `${device.name}${device.online ? '（在线）' : '（离线）'}`,
                        value: device.id
                      }))
                    "
                    :disabled="binding.devices.length === 0"
                  />
                  <NButton v-if="binding.devices.length === 0" text type="primary" @click="goCreateDevice(binding)">
                    创建设备
                  </NButton>
                </div>
              </div>
            </NCard>
          </div>
        </NForm>
      </NSpin>

      <template #footer>
        <div class="modal-actions">
          <NButton :disabled="creating" @click="createVisible = false">取消</NButton>
          <NButton type="primary" :loading="creating" :disabled="!canCreate" @click="createDashboard">创建看板</NButton>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.dashboard-template-page {
  min-height: 100%;
  padding: 16px;
}

.page-header,
.filters,
.template-heading,
.card-actions,
.progress-title,
.binding-row,
.modal-actions {
  display: flex;
  align-items: center;
}

.page-header {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;

  h2 {
    margin: 0 0 6px;
    font-size: 20px;
  }

  p {
    margin: 0;
    color: #909399;
  }
}

.filters {
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
}

.empty {
  padding: 80px 0;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.template-card {
  height: 100%;
}

.template-heading {
  gap: 12px;
}

.template-title {
  min-width: 0;

  h3 {
    max-width: 220px;
    margin: 0 0 8px;
    overflow: hidden;
    font-size: 16px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.description {
  min-height: 42px;
  margin: 16px 0;
  overflow: hidden;
  color: #606266;
  line-height: 21px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.template-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  color: #909399;
  font-size: 12px;
}

.binding-summary {
  min-height: 48px;
  padding: 12px 0;
}

.binding-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0 8px 8px 0;
}

.card-actions,
.modal-actions {
  justify-content: flex-end;
  gap: 12px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

.binding-progress {
  margin-bottom: 16px;
}

.progress-title {
  justify-content: space-between;
  margin-bottom: 8px;
}

.binding-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.binding-row {
  justify-content: space-between;
  gap: 24px;
}

.binding-info {
  min-width: 180px;
}

.binding-name {
  font-weight: 600;
}

.required {
  margin-right: 4px;
  color: #d03050;
}

.binding-template {
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
}

.binding-control {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 12px;

  :deep(.n-select) {
    flex: 1;
  }
}

@media (max-width: 640px) {
  .page-header,
  .binding-row {
    align-items: stretch;
    flex-direction: column;
  }

  .binding-control {
    width: 100%;
  }
}
</style>
