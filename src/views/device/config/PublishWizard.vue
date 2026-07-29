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
  NStep,
  NSteps,
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
import { useMarketAuth } from './composables/use-market-auth'

export interface OpenParams {
  dashboardIds?: string[]
}

export interface PublishWizardExpose {
  open: (params?: OpenParams) => void
  close: () => void
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

const bindingKeyPattern = /^[a-z][a-z0-9_]{2,63}$/
const bundleKeyPattern = /^[a-z][a-z0-9-]{2,63}$/
const versionPattern = /^[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/

const rolesValid = computed(() => {
  if (roles.value.length === 0) return false
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

function reset() {
  step.value = 1
  analysis.value = null
  roles.value = []
  result.value = null
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
  visible.value = true

  const dashboardIds = params?.dashboardIds ?? []
  if (dashboardIds.length !== 1) {
    message.warning('请从具体看板的操作菜单中选择“发布市场”')
    return
  }

  analyzing.value = true
  const { data, error } = await analyzeDashboardBundle(dashboardIds[0])
  analyzing.value = false
  if (error || !data) return

  analysis.value = data
  form.name = data.dashboardName
  form.bundleKey = suggestBundleKey(data.dashboardId)
  roles.value = data.deviceReferences.map(reference => ({
    sourceDeviceId: reference.sourceDeviceId,
    bindingKey: reference.suggestedBindingKey,
    displayName: reference.sourceDeviceName || reference.suggestedBindingKey
  }))

  if (roles.value.length === 0) {
    message.warning('该看板没有引用设备，当前不能发布为看板 Bundle')
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
    message.error('市场登录已失效，请关闭窗口后重新登录')
    return
  }

  submitting.value = true
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

  if (error || !data) return
  result.value = data
  step.value = 3
  emit('published', data)
  message.success('已提交市场审核')
}

defineExpose({ open, close } as PublishWizardExpose)
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    title="发布看板到市场"
    :mask-closable="false"
    style="width: 860px; max-width: 92vw"
  >
    <NSteps :current="step" class="mb-6">
      <NStep title="确认设备角色" />
      <NStep title="填写商品信息" />
      <NStep title="提交结果" />
    </NSteps>

    <NSpin :show="analyzing">
      <template v-if="step === 1">
        <NAlert type="info" class="mb-4">
          系统已分析该看板实际引用的设备。这里确认的是安装时要绑定的“设备角色”，不会把发布者的真实设备 ID 上传到市场。
        </NAlert>

        <NAlert v-if="!analysis && !analyzing" type="warning" class="mb-4">
          尚未选择具体看板，请关闭窗口后从看板列表的操作菜单进入。
        </NAlert>

        <template v-if="analysis">
          <NDescriptions bordered :column="2" class="mb-4">
            <NDescriptionsItem label="看板">{{ analysis.dashboardName }}</NDescriptionsItem>
            <NDescriptionsItem label="设备角色数">{{ roles.length }}</NDescriptionsItem>
          </NDescriptions>

          <NCard
            v-for="(reference, index) in analysis.deviceReferences"
            :key="reference.sourceDeviceId"
            size="small"
            class="mb-3"
          >
            <template #header>
              {{ reference.sourceDeviceName || reference.sourceDeviceId }}
            </template>
            <NForm label-placement="left" label-width="110">
              <NFormItem label="角色名称" required>
                <NInput v-model:value="roles[index].displayName" placeholder="例如：客厅温湿度设备" />
              </NFormItem>
              <NFormItem label="bindingKey" required>
                <NInput v-model:value="roles[index].bindingKey" placeholder="例如：living_room_sensor" />
              </NFormItem>
              <NFormItem label="设备模板">
                <span>{{ reference.deviceTemplateId }}</span>
              </NFormItem>
              <NFormItem label="看板所需字段">
                <NSpace>
                  <NTag
                    v-for="field in reference.requiredFields"
                    :key="`${field.kind}:${field.identifier}`"
                    size="small"
                  >
                    {{ field.name || field.identifier }}（{{ field.kind }}）
                  </NTag>
                </NSpace>
              </NFormItem>
            </NForm>
          </NCard>

          <NAlert v-if="roles.length === 0" type="error">
            当前看板没有可发布的设备引用，不能形成安装时的绑定向导。
          </NAlert>
          <NAlert v-else-if="!rolesValid" type="warning">
            bindingKey 必须以小写字母开头，只能包含小写字母、数字、下划线，长度 3～64，并且不能重复。
          </NAlert>
        </template>

        <div class="step-actions">
          <NButton @click="close">取消</NButton>
          <NButton type="primary" :disabled="!analysis || !rolesValid" @click="step = 2">下一步</NButton>
        </div>
      </template>

      <template v-else-if="step === 2">
        <NAlert type="info" class="mb-4">
          一个 Bundle 对应一个看板。提交后进入人工审核，审核通过后安装者才能在市场看到。
        </NAlert>
        <NForm :model="form" label-placement="left" label-width="110">
          <NFormItem label="商品名称" required>
            <NInput v-model:value="form.name" maxlength="100" show-count />
          </NFormItem>
          <NFormItem label="Bundle Key" required>
            <NInput v-model:value="form.bundleKey" placeholder="例如：factory-energy-dashboard" />
          </NFormItem>
          <NFormItem label="版本" required>
            <NInput v-model:value="form.version" placeholder="例如：1.0.0" />
          </NFormItem>
          <NFormItem label="分类" required>
            <NSelect v-model:value="form.category" :options="categoryOptions" />
          </NFormItem>
          <NFormItem label="描述">
            <NInput
              v-model:value="form.description"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 6 }"
              maxlength="2000"
              show-count
            />
          </NFormItem>
        </NForm>
        <NAlert v-if="!metadataValid" type="warning">
          Bundle Key 只能使用小写字母、数字和短横线并以字母开头；版本必须符合 1.0.0 格式。
        </NAlert>
        <div class="step-actions">
          <NButton @click="step = 1">上一步</NButton>
          <NButton type="primary" :disabled="!metadataValid" :loading="submitting" @click="submit">提交审核</NButton>
        </div>
      </template>

      <template v-else>
        <NAlert type="success" title="已提交人工审核" class="mb-4">
          这不代表已经上架。审核通过后，安装者才会在市场列表中看到这个看板 Bundle。
        </NAlert>
        <NDescriptions v-if="result" bordered :column="1">
          <NDescriptionsItem label="Bundle Key">{{ result.bundleKey }}</NDescriptionsItem>
          <NDescriptionsItem label="版本">{{ result.version }}</NDescriptionsItem>
          <NDescriptionsItem label="状态">{{ result.status }}</NDescriptionsItem>
          <NDescriptionsItem label="内容哈希">{{ result.contentHash }}</NDescriptionsItem>
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
</style>
