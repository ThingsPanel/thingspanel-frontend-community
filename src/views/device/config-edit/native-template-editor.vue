<script setup lang="ts">
import { computed, h, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NAlert,
  NButton,
  NCard,
  NCheckbox,
  NDataTable,
  NDynamicTags,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NPagination,
  NPopconfirm,
  NRadio,
  NRadioGroup,
  NSelect,
  NSpace,
  NSpin,
  NTag,
  useMessage,
  type DataTableColumns,
  type FormInst,
  type FormRules
} from 'naive-ui'
import {
  createOperationKey,
  thingModelNative,
  type ModelSummary,
  type VersionSummary
} from '@/service/api/thingmodel-native'
import { TemplateNativeError, templateNative } from '@/service/api/template-native'
import { useAuthStore } from '@/store/modules/auth'
import { canManageDeviceGroups } from '@/service/api/device-group-editor-state'
import type {
  CreateDeviceAccessTemplate,
  DeviceAccessTemplate,
  UpdateDeviceAccessTemplate
} from '@/service/api/template-native'

type TemplateConfiguration = DeviceAccessTemplate['configuration']
type DeviceKind = TemplateConfiguration['deviceKind']
type CredentialKind = TemplateConfiguration['access']['credentialPolicy']['kind']
type OnlineMode = TemplateConfiguration['access']['onlinePolicy']['mode']
type ConnectionDirection = TemplateConfiguration['access']['connectionDirection']

const route = useRoute()
const router = useRouter()
const message = useMessage()
const authStore = useAuthStore()
const canWrite = computed(() => canManageDeviceGroups(authStore.userInfo.roles))
const formRef = ref<FormInst>()
const templateID = computed(() => (typeof route.query.id === 'string' ? route.query.id : ''))
const isEdit = computed(() => templateID.value.length > 0)
const pageTitle = computed(() => (isEdit.value ? '编辑设备模板' : '新建设备模板'))

const loading = ref(false)
const saving = ref(false)
const loadError = ref('')
const conflict = ref(false)
const etag = ref('')
const original = ref<DeviceAccessTemplate | null>(null)
const configurationBase = ref<TemplateConfiguration | null>(null)
const protocolEditable = ref(true)
const modelLabel = ref('')

const form = reactive({
  name: '',
  description: '',
  brand: '',
  productName: '',
  modelNumber: '',
  tags: [] as string[],
  deviceKind: 'standalone' as DeviceKind
})
const selectedModelID = ref('')
const selectedRevision = ref<number | null>(null)

function searchModels() {
  modelPage.value = 1
  loadModels()
}

function clearModelSelection() {
  selectedModelID.value = ''
  selectedRevision.value = null
  modelLabel.value = ''
}
const credentialKind = ref<CredentialKind>('none')
const autoRegister = ref(false)
const connectionDirection = ref<ConnectionDirection>('device_to_platform')
const onlineMode = ref<OnlineMode>('transport')
const timeoutSeconds = ref<number | null>(60)

const modelPickerVisible = ref(false)
const versionPickerVisible = ref(false)
const modelLoading = ref(false)
const versionLoading = ref(false)
const modelSearch = ref('')
const modelPage = ref(1)
const modelPageSize = 20
const modelTotal = ref(0)
const modelRows = ref<ModelSummary[]>([])
const activePickerModel = ref<ModelSummary | null>(null)
const versionPage = ref(1)
const versionPageSize = 20
const versionTotal = ref(0)
const versionRows = ref<VersionSummary[]>([])
const pickerRevision = ref<number | null>(null)

const rules: FormRules = {
  name: [
    {
      validator: (_rule, value: string) => typeof value === 'string' && value.trim().length > 0,
      message: '请输入模板名称',
      trigger: ['input', 'blur']
    }
  ]
}

let routeEpoch = 0
let loadSequence = 0
let modelSequence = 0
let versionSequence = 0
let writeSequence = 0
let pendingCreate: { fingerprint: string; key: string } | null = null
let pendingUpdate: { fingerprint: string; key: string } | null = null

const credentialOptions = [
  { label: '无额外凭据', value: 'none' },
  { label: 'Token', value: 'token' },
  { label: '用户名和密码', value: 'username_password' },
  { label: 'X.509 证书', value: 'x509' }
]
const onlineModeOptions = [
  { label: '传输状态', value: 'transport' },
  { label: '心跳', value: 'heartbeat' },
  { label: '活动状态', value: 'activity' }
]
const directionOptions = [
  { label: '设备到平台', value: 'device_to_platform' },
  { label: '平台到设备', value: 'platform_to_device' }
]
const modelColumns: DataTableColumns<ModelSummary> = [
  { title: '物模型名称', key: 'name', ellipsis: { tooltip: true } },
  {
    title: '最新已发布版本',
    key: 'publishedRevision',
    width: 150,
    render: row =>
      row.publishedRevision
        ? `v${row.publishedRevision} · ${row.lifecycle === 'DRAFT' ? '有已发布版本' : row.lifecycle === 'ARCHIVED' ? '已归档' : '已发布'}`
        : '暂无已发布版本'
  },
  {
    title: '操作',
    key: 'action',
    width: 110,
    render: row =>
      h(
        NButton,
        {
          size: 'small',
          type: 'primary',
          disabled: !canWrite.value || !canChooseModelVersions(row),
          onClick: () => void chooseModel(row)
        },
        { default: () => '选择版本' }
      )
  }
]

function nullable(value: string): string | null {
  return value === '' ? null : value
}

function nullableFormValue(value: string, previous: string | null): string | null {
  if (value === (previous ?? '')) return previous
  return nullable(value)
}

function cloneConfiguration(value: TemplateConfiguration): TemplateConfiguration {
  return JSON.parse(JSON.stringify(value)) as TemplateConfiguration
}

function defaultConfiguration(): TemplateConfiguration {
  return {
    deviceKind: form.deviceKind,
    model: null,
    access: {
      mode: 'direct',
      protocol: 'mqtt',
      providerId: null,
      parameters: {},
      credentialPolicy: { kind: credentialKind.value, autoRegister: autoRegister.value },
      onlinePolicy: { mode: onlineMode.value, timeoutSeconds: timeoutSeconds.value ?? 60 },
      connectionDirection: connectionDirection.value,
      serviceInstanceId: null
    },
    topicMappings: [],
    processingScripts: [],
    customFieldDefinitions: []
  }
}

function isEditableMqtt(configuration: TemplateConfiguration): boolean {
  return (
    configuration.access.mode === 'direct' &&
    configuration.access.protocol === 'mqtt' &&
    configuration.access.providerId === null &&
    configuration.access.serviceInstanceId === null
  )
}

function buildConfiguration(): TemplateConfiguration {
  const next = configurationBase.value ? cloneConfiguration(configurationBase.value) : defaultConfiguration()
  next.deviceKind = form.deviceKind
  next.model =
    selectedModelID.value && selectedRevision.value !== null
      ? { modelId: selectedModelID.value, publishedRevision: selectedRevision.value }
      : null
  next.access.credentialPolicy = {
    ...next.access.credentialPolicy,
    kind: credentialKind.value,
    autoRegister: autoRegister.value
  }
  next.access.connectionDirection = connectionDirection.value
  next.access.onlinePolicy = {
    ...next.access.onlinePolicy,
    mode: onlineMode.value,
    timeoutSeconds: timeoutSeconds.value ?? 60
  }
  return next
}

function resetCreateForm() {
  original.value = null
  configurationBase.value = null
  etag.value = ''
  protocolEditable.value = true
  loadError.value = ''
  conflict.value = false
  form.name = ''
  form.description = ''
  form.brand = ''
  form.productName = ''
  form.modelNumber = ''
  form.tags = []
  form.deviceKind = 'standalone'
  selectedModelID.value = ''
  selectedRevision.value = null
  modelLabel.value = ''
  credentialKind.value = 'none'
  autoRegister.value = false
  connectionDirection.value = 'device_to_platform'
  onlineMode.value = 'transport'
  timeoutSeconds.value = 60
}

async function loadTemplate(id: string, epoch: number) {
  const sequence = ++loadSequence
  loading.value = true
  loadError.value = ''
  try {
    const result = await templateNative.get(id)
    if (epoch !== routeEpoch || sequence !== loadSequence || templateID.value !== id) return
    const template = result.template
    original.value = template
    configurationBase.value = cloneConfiguration(template.configuration)
    etag.value = result.etag
    protocolEditable.value = isEditableMqtt(template.configuration)
    form.name = template.name
    form.description = template.description ?? ''
    form.brand = template.brand ?? ''
    form.productName = template.productName ?? ''
    form.modelNumber = template.modelNumber ?? ''
    form.tags = [...template.tags]
    form.deviceKind = template.configuration.deviceKind
    selectedModelID.value = template.configuration.model?.modelId ?? ''
    selectedRevision.value = template.configuration.model?.publishedRevision ?? null
    credentialKind.value = template.configuration.access.credentialPolicy.kind
    autoRegister.value = template.configuration.access.credentialPolicy.autoRegister
    connectionDirection.value = template.configuration.access.connectionDirection
    onlineMode.value = template.configuration.access.onlinePolicy.mode
    timeoutSeconds.value = template.configuration.access.onlinePolicy.timeoutSeconds
    modelLabel.value = selectedModelID.value ? `已绑定物模型 · v${selectedRevision.value}` : ''
    if (selectedModelID.value) {
      const modelID = selectedModelID.value
      void thingModelNative
        .get(modelID)
        .then(detail => {
          if (epoch === routeEpoch && sequence === loadSequence && selectedModelID.value === modelID) {
            modelLabel.value = `${detail.draft.name} · v${selectedRevision.value}`
          }
        })
        .catch(() => {
          if (epoch === routeEpoch && sequence === loadSequence && selectedModelID.value === modelID) {
            modelLabel.value = `物模型名称暂不可用 · v${selectedRevision.value}`
          }
        })
    }
  } catch (error) {
    if (epoch !== routeEpoch || sequence !== loadSequence || templateID.value !== id) return
    loadError.value = error instanceof Error ? error.message : '模板加载失败，请重试。'
  } finally {
    if (epoch === routeEpoch && sequence === loadSequence && templateID.value === id) loading.value = false
  }
}

watch(
  () => route.query.id,
  rawID => {
    const epoch = ++routeEpoch
    ++writeSequence
    ++modelSequence
    ++versionSequence
    modelPickerVisible.value = false
    versionPickerVisible.value = false
    saving.value = false
    conflict.value = false
    formRef.value?.restoreValidation()
    if (typeof rawID === 'string' && rawID) {
      resetCreateForm()
      void loadTemplate(rawID, epoch)
    } else {
      ++loadSequence
      loading.value = false
      resetCreateForm()
    }
  },
  { immediate: true }
)

async function loadModels() {
  const sequence = ++modelSequence
  modelLoading.value = true
  try {
    const result = await thingModelNative.list({
      page: modelPage.value,
      pageSize: modelPageSize,
      query: modelSearch.value.trim() || undefined
    })
    if (sequence !== modelSequence || !modelPickerVisible.value) return
    modelRows.value = result.items
    modelTotal.value = result.total
  } catch {
    if (sequence === modelSequence) message.error('已发布物模型加载失败，请稍后重试。')
  } finally {
    if (sequence === modelSequence) modelLoading.value = false
  }
}

function openModelPicker() {
  if (!canWrite.value || !protocolEditable.value || (isEdit.value && (!original.value || Boolean(loadError.value))))
    return
  modelPickerVisible.value = true
  modelPage.value = 1
  void loadModels()
}

async function chooseModel(model: ModelSummary) {
  if (!canWrite.value || !canChooseModelVersions(model)) return
  activePickerModel.value = model
  versionPage.value = 1
  pickerRevision.value = selectedModelID.value === model.modelID ? selectedRevision.value : model.publishedRevision
  const sequence = ++versionSequence
  versionLoading.value = true
  versionPickerVisible.value = true
  try {
    const result = await thingModelNative.versions(model.modelID, {
      page: versionPage.value,
      pageSize: versionPageSize
    })
    if (
      sequence !== versionSequence ||
      !versionPickerVisible.value ||
      activePickerModel.value?.modelID !== model.modelID
    )
      return
    versionRows.value = result.items
    versionTotal.value = result.total
    if (!versionRows.value.some(version => version.publishedRevision === pickerRevision.value)) {
      pickerRevision.value = versionRows.value[0]?.publishedRevision ?? null
    }
  } catch {
    if (sequence === versionSequence) {
      versionPickerVisible.value = false
      message.error('物模型已发布版本加载失败，请稍后重试。')
    }
  } finally {
    if (sequence === versionSequence) versionLoading.value = false
  }
}

function canChooseModelVersions(model: ModelSummary): boolean {
  return model.lifecycle !== 'ARCHIVED' && model.publishedRevision !== null && model.publishedRevision > 0
}

async function loadVersions(page = versionPage.value) {
  const model = activePickerModel.value
  if (!model) return
  versionPage.value = page
  const sequence = ++versionSequence
  versionLoading.value = true
  try {
    const result = await thingModelNative.versions(model.modelID, { page, pageSize: versionPageSize })
    if (
      sequence !== versionSequence ||
      !versionPickerVisible.value ||
      activePickerModel.value?.modelID !== model.modelID
    )
      return
    versionRows.value = result.items
    versionTotal.value = result.total
  } catch {
    if (sequence === versionSequence) message.error('物模型版本读取失败，请稍后重试。')
  } finally {
    if (sequence === versionSequence) versionLoading.value = false
  }
}

function confirmModelVersion() {
  const model = activePickerModel.value
  if (
    !canWrite.value ||
    !model ||
    !canChooseModelVersions(model) ||
    pickerRevision.value === null ||
    !versionRows.value.some(row => row.publishedRevision === pickerRevision.value)
  )
    return
  selectedModelID.value = model.modelID
  selectedRevision.value = pickerRevision.value
  modelLabel.value = `${model.name} · v${pickerRevision.value}`
  versionPickerVisible.value = false
  modelPickerVisible.value = false
}

function changedTemplateFields(): UpdateDeviceAccessTemplate {
  const saved = original.value
  if (!saved) return {}
  const patch: UpdateDeviceAccessTemplate = {}
  if (form.name.trim() !== saved.name) patch.name = form.name.trim()
  const description = nullableFormValue(form.description, saved.description)
  if (description !== saved.description) patch.description = description
  const brand = nullableFormValue(form.brand, saved.brand)
  if (brand !== saved.brand) patch.brand = brand
  const productName = nullableFormValue(form.productName, saved.productName)
  if (productName !== saved.productName) patch.productName = productName
  const modelNumber = nullableFormValue(form.modelNumber, saved.modelNumber)
  if (modelNumber !== saved.modelNumber) patch.modelNumber = modelNumber
  if (JSON.stringify(form.tags) !== JSON.stringify(saved.tags)) patch.tags = [...form.tags]
  if (protocolEditable.value) {
    const configuration = buildConfiguration()
    if (JSON.stringify(configuration) !== JSON.stringify(saved.configuration)) patch.configuration = configuration
  }
  return patch
}

function keyForWrite(kind: 'create' | 'update', fingerprint: string): string {
  const pending = kind === 'create' ? pendingCreate : pendingUpdate
  if (pending?.fingerprint === fingerprint) return pending.key
  const next = { fingerprint, key: createOperationKey() }
  if (kind === 'create') pendingCreate = next
  else pendingUpdate = next
  return next.key
}

async function save() {
  if (!canWrite.value) {
    message.error('只有租户管理员可以修改设备模板。')
    return
  }
  if (isEdit.value && (!original.value || Boolean(loadError.value))) return
  if (saving.value || loading.value) return
  try {
    await formRef.value?.validate()
  } catch {
    return
  }
  if (
    protocolEditable.value &&
    (timeoutSeconds.value === null ||
      !Number.isInteger(timeoutSeconds.value) ||
      timeoutSeconds.value < 1 ||
      timeoutSeconds.value > 86400)
  ) {
    message.error('在线策略时长须为 1 到 86400 秒。')
    return
  }
  if (form.tags.length > 32) {
    message.error('标签最多支持32个。')
    return
  }
  const epoch = routeEpoch
  const sequence = ++writeSequence
  saving.value = true
  conflict.value = false
  try {
    if (!isEdit.value) {
      const body: CreateDeviceAccessTemplate = {
        name: form.name.trim(),
        description: nullable(form.description),
        brand: nullable(form.brand),
        productName: nullable(form.productName),
        modelNumber: nullable(form.modelNumber),
        tags: [...form.tags],
        configuration: buildConfiguration()
      }
      const fingerprint = JSON.stringify(body)
      const result = await templateNative.create(body, keyForWrite('create', fingerprint))
      if (epoch !== routeEpoch || sequence !== writeSequence) return
      pendingCreate = null
      message.success('模板已保存，正在读取最新内容。')
      await router.replace({ path: route.path, query: { ...route.query, id: result.template.id } })
      return
    }

    const id = templateID.value
    const patch = changedTemplateFields()
    if (!Object.keys(patch).length) {
      message.info('没有需要保存的修改。')
      return
    }
    const fingerprint = `${id}\n${etag.value}\n${JSON.stringify(patch)}`
    await templateNative.update(id, patch, etag.value, keyForWrite('update', fingerprint))
    if (epoch !== routeEpoch || sequence !== writeSequence) return
    pendingUpdate = null
    const reloadEpoch = routeEpoch
    try {
      await loadTemplate(id, reloadEpoch)
      if (reloadEpoch === routeEpoch) {
        if (loadError.value) message.warning('模板已保存，但最新内容读取失败，请重新加载确认。')
        else message.success('模板已保存。')
      }
    } catch {
      message.warning('模板已保存，但最新内容读取失败，请重新加载确认。')
    }
  } catch (error) {
    if (epoch !== routeEpoch || sequence !== writeSequence) return
    if (error instanceof TemplateNativeError && error.status === 412) {
      conflict.value = true
      message.warning('模板已被其他人修改。当前输入已保留，请选择重新加载后再编辑。')
    } else {
      message.error(error instanceof Error ? error.message : '模板保存失败，请重试。')
    }
  } finally {
    if (epoch === routeEpoch && sequence === writeSequence) saving.value = false
  }
}

async function reloadAfterConflict() {
  if (!templateID.value) return
  await loadTemplate(templateID.value, routeEpoch)
  if (!loadError.value) conflict.value = false
}

function goBack() {
  void router.back()
}
</script>

<template>
  <div class="native-template-editor">
    <NCard :title="pageTitle">
      <NSpin :show="loading">
        <NAlert v-if="!canWrite" type="warning" class="mb-4" title="当前账号没有编辑权限">
          只有租户管理员可以创建或修改设备模板。你仍可查看已有模板内容。
        </NAlert>
        <NAlert v-if="loadError" type="error" class="mb-4" :title="loadError">
          <NButton size="small" type="primary" @click="templateID && loadTemplate(templateID, routeEpoch)">
            重新加载
          </NButton>
        </NAlert>
        <NAlert v-if="conflict" type="warning" class="mb-4" title="模板已被修改">
          当前输入仍保留。重新加载会放弃未保存修改，并读取最新内容与版本。
          <NPopconfirm @positive-click="reloadAfterConflict">
            <template #trigger>
              <NButton size="small" type="warning">重新加载并放弃当前修改</NButton>
            </template>
            重新加载将覆盖当前输入，是否继续？
          </NPopconfirm>
        </NAlert>

        <NForm
          ref="formRef"
          :model="form"
          :rules="rules"
          :disabled="loading || saving || !canWrite || Boolean(loadError) || (isEdit && !original)"
          label-placement="left"
          label-width="120"
        >
          <NFormItem label="模板名称" path="name" class="editor-width">
            <NInput v-model:value="form.name" maxlength="128" show-count placeholder="请输入模板名称" />
          </NFormItem>
          <NFormItem label="描述" class="editor-width">
            <NInput
              v-model:value="form.description"
              type="textarea"
              maxlength="2000"
              show-count
              placeholder="可填写模板说明"
            />
          </NFormItem>
          <NFormItem label="品牌" class="editor-width">
            <NInput v-model:value="form.brand" maxlength="64" placeholder="可选" />
          </NFormItem>
          <NFormItem label="产品名称" class="editor-width">
            <NInput v-model:value="form.productName" maxlength="128" placeholder="可选" />
          </NFormItem>
          <NFormItem label="型号" class="editor-width">
            <NInput v-model:value="form.modelNumber" maxlength="64" placeholder="可选" />
          </NFormItem>
          <NFormItem label="标签" class="editor-width">
            <NDynamicTags v-model:value="form.tags" :max="32" />
          </NFormItem>

          <NFormItem v-if="!isEdit" label="设备类型" class="editor-width">
            <NRadioGroup v-model:value="form.deviceKind">
              <NSpace>
                <NRadio value="standalone">直连设备</NRadio>
                <NRadio value="gateway">网关</NRadio>
                <NRadio value="subdevice">网关子设备</NRadio>
              </NSpace>
            </NRadioGroup>
          </NFormItem>
          <NFormItem v-else label="设备类型" class="editor-width">
            <NTag>
              {{
                form.deviceKind === 'standalone' ? '直连设备' : form.deviceKind === 'gateway' ? '网关' : '网关子设备'
              }}
            </NTag>
          </NFormItem>

          <div class="section-title">接入配置</div>
          <NAlert v-if="isEdit && !protocolEditable" type="warning" class="mb-4 editor-width">
            此模板使用当前页面暂不支持编辑的协议配置。协议与物模型信息仅供查看；保存基本资料时会保留完整现有配置。
          </NAlert>
          <NFormItem label="协议" class="editor-width">
            <NInput
              :value="
                configurationBase
                  ? `${configurationBase.access.mode} · ${configurationBase.access.protocol}`
                  : 'direct · MQTT'
              "
              disabled
            />
          </NFormItem>
          <NFormItem label="物模型版本" class="editor-width">
            <NSpace align="center">
              <span>{{ modelLabel || '未选择物模型' }}</span>
              <NButton
                size="small"
                :disabled="!canWrite || !protocolEditable || saving || Boolean(loadError) || (isEdit && !original)"
                @click="openModelPicker"
              >
                选择物模型版本
              </NButton>
              <NButton
                v-if="selectedModelID"
                size="small"
                quaternary
                :disabled="!canWrite || !protocolEditable || saving || Boolean(loadError) || (isEdit && !original)"
                @click="clearModelSelection"
              >
                清除
              </NButton>
            </NSpace>
          </NFormItem>
          <NFormItem label="凭据类型" class="editor-width">
            <NSelect
              v-model:value="credentialKind"
              :options="credentialOptions"
              :disabled="!protocolEditable || saving"
            />
          </NFormItem>
          <NFormItem label="自动注册" class="editor-width">
            <NCheckbox v-model:checked="autoRegister" :disabled="!protocolEditable || saving">启用自动注册</NCheckbox>
          </NFormItem>
          <NFormItem label="连接方向" class="editor-width">
            <NSelect
              v-model:value="connectionDirection"
              :options="directionOptions"
              :disabled="!protocolEditable || saving"
            />
          </NFormItem>
          <NFormItem label="在线策略" class="editor-width">
            <NSpace>
              <NSelect
                v-model:value="onlineMode"
                :options="onlineModeOptions"
                class="online-mode"
                :disabled="!protocolEditable || saving"
              />
              <NInputNumber
                v-model:value="timeoutSeconds"
                :min="1"
                :max="86400"
                :disabled="!protocolEditable || saving"
              />
              <span class="unit-label">秒</span>
            </NSpace>
          </NFormItem>

          <NSpace justify="end" class="editor-width">
            <NButton :disabled="saving" @click="goBack">返回</NButton>
            <NButton
              type="primary"
              :loading="saving"
              :disabled="!canWrite || loading || Boolean(loadError) || (isEdit && !original)"
              @click="save"
            >
              保存
            </NButton>
          </NSpace>
        </NForm>
      </NSpin>
    </NCard>

    <NModal v-model:show="modelPickerVisible" preset="card" title="选择物模型" class="picker-modal">
      <NSpace class="mb-3" justify="space-between">
        <NInput v-model:value="modelSearch" clearable placeholder="搜索物模型名称" @keydown.enter="searchModels" />
        <NButton type="primary" @click="searchModels">搜索</NButton>
      </NSpace>
      <NSpin :show="modelLoading">
        <NDataTable :columns="modelColumns" :data="modelRows" :row-key="row => row.modelID" :pagination="false" />
        <NEmpty v-if="!modelRows.length && !modelLoading" class="py-6" description="没有可选择的已发布物模型" />
        <NPagination
          v-if="modelTotal > modelPageSize"
          v-model:page="modelPage"
          :page-size="modelPageSize"
          :item-count="modelTotal"
          class="mt-4 justify-end"
          @update:page="loadModels"
        />
      </NSpin>
    </NModal>

    <NModal v-model:show="versionPickerVisible" preset="card" title="选择已发布版本" class="picker-modal">
      <p v-if="activePickerModel" class="mb-3">{{ activePickerModel.name }}</p>
      <NSpin :show="versionLoading">
        <NRadioGroup v-model:value="pickerRevision" class="version-list">
          <NSpace vertical>
            <NRadio v-for="version in versionRows" :key="version.publishedRevision" :value="version.publishedRevision">
              v{{ version.publishedRevision }} · {{ new Date(version.createdAt).toLocaleString() }}
            </NRadio>
          </NSpace>
        </NRadioGroup>
        <NEmpty v-if="!versionRows.length && !versionLoading" class="py-6" description="没有已发布版本" />
        <NSpace class="mt-4" justify="space-between">
          <NPagination
            v-if="versionTotal > versionPageSize"
            v-model:page="versionPage"
            :page-size="versionPageSize"
            :item-count="versionTotal"
            @update:page="loadVersions"
          />
          <NSpace>
            <NButton @click="versionPickerVisible = false">取消</NButton>
            <NButton
              type="primary"
              :disabled="
                !canWrite ||
                pickerRevision === null ||
                versionLoading ||
                !versionRows.some(row => row.publishedRevision === pickerRevision)
              "
              @click="confirmModelVersion"
            >
              使用此版本
            </NButton>
          </NSpace>
        </NSpace>
      </NSpin>
    </NModal>
  </div>
</template>

<style scoped lang="scss">
.native-template-editor {
  min-height: 100%;
}

.editor-width {
  width: min(680px, 100%);
}

.section-title {
  margin: 20px 0 14px;
  font-size: 16px;
  font-weight: 600;
}

.picker-modal {
  width: min(720px, calc(100vw - 32px));
}

.online-mode {
  width: 180px;
}

.unit-label {
  align-self: center;
  color: var(--n-text-color-3);
}

.version-list {
  display: block;
  max-height: 360px;
  overflow: auto;
}
</style>
