<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  NAlert,
  NButton,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NForm,
  NFormItem,
  NInput,
  NModal,
  NSelect,
  NSpace,
  NSpin,
  NTag,
  useMessage
} from 'naive-ui'
import {
  analyzeDashboardBundle,
  publishDashboardBundle,
  type AnalyzeDashboardBundleResponse,
  type DashboardBundleRole,
  type PublishDashboardBundleResponse
} from '@/service/api/dashboard-market'
import { getMarketBundleDetail } from '@/service/api/market-bundle'
import { useMarketAuth } from './composables/use-market-auth'

export interface OpenParams {
  dashboardIds?: string[]
}

export interface PublishWizardExpose {
  open(params?: OpenParams): void
  close(): void
}

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  published: [result: PublishDashboardBundleResponse]
}>()

const message = useMessage()
const { getToken } = useMarketAuth()

const visible = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

const step = ref(1)
const analyzing = ref(false)
const submitting = ref(false)
const analysis = ref<AnalyzeDashboardBundleResponse | null>(null)
const roles = ref<DashboardBundleRole[]>([])
const result = ref<PublishDashboardBundleResponse | null>(null)
const operationError = ref('')
const versionConflictSuggestion = ref('')

const form = reactive({
  bundleKey: '',
  version: '1.0.0',
  name: '',
  category: 'other',
  description: ''
})

const categoryOptions = [
  { label: '工业', value: 'industrial' },
  { label: '智慧农业', value: 'agriculture' },
  { label: '智慧城市', value: 'smart-city' },
  { label: '能源', value: 'energy' },
  { label: '智能家居', value: 'smart-home' },
  { label: '其他', value: 'other' }
]

const bindingKeyPattern = /^[a-z][a-z0-9-]{2,63}$/
const bundleKeyPattern = /^[a-z][a-z0-9-]{2,63}$/
const versionPattern = /^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/

const rolesValid = computed(() => {
  if (roles.value.length === 0) return true
  const keys = new Set<string>()
  return roles.value.every(role => {
    const valid =
      role.displayName.trim() !== '' && bindingKeyPattern.test(role.bindingKey) && !keys.has(role.bindingKey)
    keys.add(role.bindingKey)
    return valid
  })
})

const metadataValid = computed(
  () =>
    bundleKeyPattern.test(form.bundleKey) &&
    versionPattern.test(form.version) &&
    form.name.trim() !== '' &&
    form.category !== ''
)

function nextPatchVersion(version: string) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/)
  if (!match) return '1.0.1'
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`
}

function compareVersions(left: string, right: string) {
  const parse = (value: string) =>
    value
      .split(/[.-]/)
      .slice(0, 3)
      .map(part => Number(part) || 0)
  const leftParts = parse(left)
  const rightParts = parse(right)
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) return leftParts[index] - rightParts[index]
  }
  return 0
}

function getErrorDetail(error: unknown) {
  const source = error as {
    message?: string
    data?: unknown
    response?: { data?: { message?: string; data?: unknown } }
  }
  const responseData = source?.response?.data
  const detailSource = source?.data ?? responseData?.data
  if (typeof detailSource === 'string') return detailSource
  if (detailSource && typeof detailSource === 'object') {
    const details = detailSource as Record<string, unknown>
    if (typeof details.detail === 'string') return details.detail
    if (typeof details.error === 'string') return details.error
  }
  return responseData?.message || source?.message || '发布失败，请稍后重试'
}

function isVersionConflict(error: unknown) {
  if (getErrorDetail(error).includes('BUNDLE_VERSION_CONFLICT')) return true
  try {
    return JSON.stringify(error).includes('BUNDLE_VERSION_CONFLICT')
  } catch {
    return false
  }
}

function applySuggestedVersion() {
  if (!versionConflictSuggestion.value) return
  form.version = versionConflictSuggestion.value
  versionConflictSuggestion.value = ''
  operationError.value = ''
}

function referenceForRole(role: DashboardBundleRole) {
  return analysis.value?.deviceReferences.find(reference => reference.sourceDeviceId === role.sourceDeviceId)
}

function reset() {
  step.value = 1
  analysis.value = null
  roles.value = []
  result.value = null
  operationError.value = ''
  versionConflictSuggestion.value = ''
  form.bundleKey = ''
  form.version = '1.0.0'
  form.name = ''
  form.category = 'other'
  form.description = ''
}

function suggestBundleKey(dashboardId: string) {
  const normalized = dashboardId
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return /^[a-z]/.test(normalized) && normalized.length >= 3
    ? normalized.slice(0, 64)
    : `dashboard-${normalized}`.slice(0, 64)
}

async function open(params?: OpenParams) {
  reset()

  const dashboardIds = params?.dashboardIds ?? []
  if (dashboardIds.length !== 1) {
    message.warning('请在要发布的看板卡片上点击“发布”')
    return
  }

  visible.value = true
  analyzing.value = true
  operationError.value = ''
  try {
    const { data, error } = await analyzeDashboardBundle(dashboardIds[0])
    if (error || !data) {
      operationError.value = error?.message || '看板分析失败，请稍后重试'
      message.error(operationError.value)
      return
    }

    analysis.value = data
    form.name = data.dashboardName
    form.bundleKey = suggestBundleKey(data.dashboardId)
    roles.value = data.deviceReferences.map(reference => ({
      sourceDeviceId: reference.sourceDeviceId,
      bindingKey: reference.suggestedBindingKey,
      displayName: reference.sourceDeviceName || reference.suggestedBindingKey
    }))

    const detailResult = await getMarketBundleDetail(form.bundleKey)
    const publishedVersions = detailResult.data?.versions.map(item => item.version) || []
    if (publishedVersions.length > 0) {
      const latestVersion = [...publishedVersions].sort(compareVersions).at(-1)
      if (latestVersion) form.version = nextPatchVersion(latestVersion)
    }
  } catch (error) {
    const requestError = error as {
      message?: string
      response?: { data?: { message?: string; data?: unknown } }
    }
    const detail = requestError.response?.data?.data
    operationError.value =
      (typeof detail === 'string' ? detail : '') ||
      requestError.response?.data?.message ||
      requestError.message ||
      '看板分析请求失败'
    message.error(operationError.value)
  } finally {
    analyzing.value = false
  }
}

function close() {
  visible.value = false
  reset()
}

async function submit() {
  if (!analysis.value || !rolesValid.value || !metadataValid.value) return

  const marketToken = getToken()
  if (!marketToken) {
    message.error('资源中心登录已失效，请关闭窗口后重新登录')
    return
  }

  submitting.value = true
  operationError.value = ''
  const { data, error } = await publishDashboardBundle({
    dashboardId: analysis.value.dashboardId,
    bundleKey: form.bundleKey,
    version: form.version,
    name: form.name.trim(),
    category: form.category,
    description: form.description.trim(),
    marketToken,
    deviceRoles: roles.value.map(role => ({
      sourceDeviceId: role.sourceDeviceId,
      bindingKey: role.bindingKey,
      displayName: role.displayName.trim()
    }))
  })
  submitting.value = false

  if (error || !data) {
    if (isVersionConflict(error)) {
      versionConflictSuggestion.value = nextPatchVersion(form.version)
      operationError.value = `版本 ${form.version} 已存在，但模板内容已经变化。请发布为新版本。`
    } else {
      operationError.value = getErrorDetail(error)
    }
    message.error(operationError.value)
    return
  }
  result.value = data
  step.value = 2
  emit('published', data)
  message.success('已提交市场审核')
}

defineExpose({ open, close } as PublishWizardExpose)
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    title="发布看板模板"
    :mask-closable="false"
    style="width: 680px; max-width: 92vw"
  >
    <NSpin :show="analyzing">
      <NAlert v-if="operationError" type="error" title="操作失败" class="mb-4" closable @close="operationError = ''">
        {{ operationError }}
        <template v-if="versionConflictSuggestion">
          <div class="conflict-action">
            <NButton type="primary" size="small" @click="applySuggestedVersion">
              使用 {{ versionConflictSuggestion }}
            </NButton>
          </div>
        </template>
      </NAlert>

      <template v-if="step === 1">
        <template v-if="analysis">
          <NForm :model="form" label-placement="left" label-width="90">
            <NFormItem label="模板名称" required>
              <NInput v-model:value="form.name" maxlength="100" show-count />
            </NFormItem>
            <NFormItem label="模板标识" required>
              <NInput v-model:value="form.bundleKey" readonly />
            </NFormItem>
            <NFormItem label="发布版本" required>
              <NInput
                v-model:value="form.version"
                placeholder="例如 1.0.0"
                @update:value="versionConflictSuggestion = ''"
              />
            </NFormItem>
            <NFormItem label="分类" required>
              <NSelect v-model:value="form.category" :options="categoryOptions" />
            </NFormItem>
            <NFormItem label="模板介绍">
              <NInput
                v-model:value="form.description"
                type="textarea"
                placeholder="简单介绍这个看板适合什么场景"
                :autosize="{ minRows: 4, maxRows: 7 }"
                maxlength="2000"
                show-count
              />
            </NFormItem>
            <NFormItem v-if="roles.length > 0" label="设备依赖">
              <div class="role-list">
                <div class="dependency-summary">安装时需要绑定 {{ roles.length }} 个设备角色</div>
                <NCard v-for="role in roles" :key="role.sourceDeviceId" size="small">
                  <div class="role-title">
                    <span>{{ referenceForRole(role)?.sourceDeviceName || role.displayName }}</span>
                    <NTag size="small" type="info">必需</NTag>
                  </div>
                  <NFormItem label="安装角色名称" label-width="100" class="role-form-item">
                    <NInput v-model:value="role.displayName" maxlength="50" />
                  </NFormItem>
                  <div class="role-key">角色标识：{{ role.bindingKey }}</div>
                  <NSpace v-if="referenceForRole(role)?.requiredFields.length" size="small" class="field-tags">
                    <NTag
                      v-for="field in referenceForRole(role)?.requiredFields"
                      :key="`${field.kind}:${field.identifier}`"
                      size="small"
                    >
                      {{ field.name || field.identifier }}
                    </NTag>
                  </NSpace>
                  <div v-else class="role-key">该角色未引用具体物模型字段</div>
                </NCard>
              </div>
            </NFormItem>
            <NFormItem v-else label="设备依赖">
              <NAlert type="warning" :show-icon="true" class="dependency-free-alert">
                该看板不引用具体设备，将作为无设备依赖的通用看板发布，安装后无需绑定设备。如果看板调用了租户或系统级接口，安装账号需具备对应权限。
              </NAlert>
            </NFormItem>
          </NForm>

          <NAlert v-if="roles.length > 0 && !rolesValid" type="warning" class="mb-4">
            看板中的设备配置不完整，请返回编辑器检查后再发布。
          </NAlert>

          <div class="step-actions">
            <NButton :disabled="submitting" @click="close">取消</NButton>
            <NButton type="primary" :disabled="!metadataValid || !rolesValid" :loading="submitting" @click="submit">
              提交审核
            </NButton>
          </div>
        </template>
      </template>

      <template v-else>
        <NAlert type="success" title="已提交审核" class="mb-4">审核通过后，这份看板模板会出现在市场中。</NAlert>
        <NDescriptions v-if="result" bordered :column="1">
          <NDescriptionsItem label="模板名称">{{ form.name }}</NDescriptionsItem>
          <NDescriptionsItem label="发布版本">{{ result.version }}</NDescriptionsItem>
          <NDescriptionsItem label="设备角色">{{ roles.length }} 个</NDescriptionsItem>
          <NDescriptionsItem label="当前状态">等待审核</NDescriptionsItem>
        </NDescriptions>
        <div class="step-actions end">
          <NButton type="primary" @click="close">完成</NButton>
        </div>
      </template>
    </NSpin>
  </NModal>
</template>

<style scoped>
.step-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--n-border-color);
}

.step-actions.end {
  justify-content: flex-end;
}

.conflict-action {
  margin-top: 12px;
}

.role-list {
  display: grid;
  width: 100%;
  gap: 12px;
}

.dependency-summary,
.role-key {
  color: var(--n-text-color-3);
  font-size: 12px;
}

.role-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-weight: 600;
}

.role-form-item {
  margin-bottom: 8px;
}

.field-tags {
  margin-top: 10px;
}

.dependency-free-alert {
  width: 100%;
}
</style>
