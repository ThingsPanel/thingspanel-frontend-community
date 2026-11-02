<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import {
  NAlert,
  NButton,
  NEmpty,
  NForm,
  NFormItem,
  NImage,
  NInputNumber,
  NSelect,
  NSpace,
  NSpin,
  NSwitch,
  NTag,
  useMessage
} from 'naive-ui'
import { fileAssetsNative } from '@/service/api/file-assets-native'
import { templateNative, type DeviceAccessTemplate } from '@/service/api/template-native'
import {
  clearTemplateConfigurationAttempt,
  configurationErrorStatus,
  createTemplateConfigurationAttempt,
  getTemplateConfigurationAttempt,
  getTemplateConfigurationSessionGeneration,
  isCurrentTemplateConfigurationSession,
  markTemplateConfigurationUnknown,
  shouldRetainConfigurationAttempt,
  syncTemplateConfigurationSession,
  type TemplateConfigurationAttempt,
  type TemplatePatchScope
} from '@/service/api/template-configuration-attempt'
import {
  ONLINE_MODE_OPTIONS,
  administrativeStateNotice,
  buildAccessPolicyConfiguration,
  buildAdministrativeStatePatch,
  buildImageAssetPatch,
  readAccessPolicy,
  validateAccessPolicy,
  type TemplateAccessPolicy
} from '@/service/api/template-settings-state'
import { canManageDeviceGroups } from '@/service/api/device-group-editor-state'
import { nativeCredentialIdentityParts } from '@/views/device/details/modules/native-device-credentials-flow'
import { useAuthStore } from '@/store/modules/auth'

interface Props {
  id: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ change: [] }>()
const authStore = useAuthStore()
const message = useMessage()

const MAX_COVER_BYTES = 5 * 1024 * 1024

const template = ref<DeviceAccessTemplate | null>(null)
const rawText = ref('')
const etag = ref('')
const loading = ref(false)
const loadError = ref('')
const saving = ref(false)
const uploading = ref(false)
const coverUrl = ref('')
const coverError = ref('')
const policy = ref<TemplateAccessPolicy>({ autoRegister: false, onlineMode: 'transport', onlineTimeoutSeconds: 60 })
const policyError = ref('')
const coverInput = ref<HTMLInputElement | null>(null)
const pendingAttempt = ref<TemplateConfigurationAttempt | null>(null)
let localSequence = 0
let activeTemplateId = props.id
let disposed = false

const canWrite = computed(() => canManageDeviceGroups(authStore.userInfo.roles))
const busy = computed(() => saving.value || uploading.value || Boolean(pendingAttempt.value))
const administrativeState = computed(() => template.value?.administrativeState ?? 'enabled')
const isDisabled = computed(() => administrativeState.value === 'disabled')
const hasCover = computed(() => Boolean(template.value?.imageAssetId))

const onlineModeOptions = ONLINE_MODE_OPTIONS.map(option => ({ label: option.label, value: option.value }))

function currentSessionIs(generation: number, templateId: string, sequence?: number) {
  return (
    isCurrentTemplateConfigurationSession(generation) &&
    !disposed &&
    props.id === templateId &&
    activeTemplateId === templateId &&
    (sequence === undefined || sequence === localSequence)
  )
}

async function loadCover(templateId: string, assetId: string | null, generation: number) {
  coverUrl.value = ''
  coverError.value = ''
  if (!assetId) return
  try {
    const { asset } = await fileAssetsNative.get(assetId)
    if (!currentSessionIs(generation, templateId)) return
    coverUrl.value = asset.downloadUrl || ''
    if (!asset.downloadUrl) coverError.value = '封面文件暂时无法预览，可重新上传。'
  } catch (error) {
    if (!currentSessionIs(generation, templateId)) return
    coverError.value = error instanceof Error ? error.message : '封面加载失败。'
  }
}

async function loadTemplate(templateId = props.id) {
  const sequence = ++localSequence
  const generation = getTemplateConfigurationSessionGeneration()
  loading.value = true
  loadError.value = ''
  try {
    const result = await templateNative.getRaw(templateId)
    if (!currentSessionIs(generation, templateId, sequence)) return
    template.value = result.template
    rawText.value = result.rawText
    etag.value = result.etag
    const next = readAccessPolicy(result.template)
    if (next) policy.value = next
    pendingAttempt.value = pendingFor(templateId)
    void loadCover(templateId, result.template.imageAssetId ?? null, generation)
  } catch (error) {
    if (currentSessionIs(generation, templateId, sequence)) {
      loadError.value = error instanceof Error ? error.message : '模板设置加载失败。'
    }
  } finally {
    if (currentSessionIs(generation, templateId, sequence)) loading.value = false
  }
}

function pendingFor(templateId: string): TemplateConfigurationAttempt | null {
  for (const scope of ['accessPolicy', 'administrativeState', 'imageAssetId'] as TemplatePatchScope[]) {
    const attempt = getTemplateConfigurationAttempt(templateId, scope)
    if (attempt) return attempt
  }
  return null
}

/** Sends the exact frozen PATCH body; only the cover/state/policy scopes use this. */
async function sendAttempt(attempt: TemplateConfigurationAttempt) {
  if (saving.value) return
  const generation = attempt.generation
  const templateId = attempt.templateId
  saving.value = true
  policyError.value = ''
  try {
    const result = await templateNative.patchBody(templateId, attempt.configurationJson, attempt.etag, attempt.key)
    if (!currentSessionIs(generation, templateId)) return
    clearTemplateConfigurationAttempt(templateId, attempt.member, generation)
    pendingAttempt.value = null
    template.value = result.template
    etag.value = result.etag
    message.success('模板设置已保存。')
    emit('change')
    await loadTemplate(templateId)
  } catch (error) {
    if (!currentSessionIs(generation, templateId)) return
    const status = configurationErrorStatus(error)
    if (!shouldRetainConfigurationAttempt(status, attempt.previouslyUnknown)) {
      clearTemplateConfigurationAttempt(templateId, attempt.member, generation)
      pendingAttempt.value = null
      if (status === 412) {
        message.warning('模板已被修改，已重新读取最新设置，请确认后再次提交。')
        await loadTemplate(templateId)
      } else if (status === 409) {
        const conflict = '模板当前状态不允许此更改，请刷新后重试。'
        policyError.value = conflict
        message.error(conflict)
      } else {
        const rejection = error instanceof Error ? error.message : '模板设置未被接受，请检查输入。'
        policyError.value = rejection
        message.error(rejection)
      }
      return
    }
    const retained = markTemplateConfigurationUnknown(templateId, attempt.member, generation)
    pendingAttempt.value = retained || attempt
    message.error('保存结果尚未确认。请重试同一请求；请求内容和并发标识保持不变。')
  } finally {
    if (currentSessionIs(generation, templateId)) saving.value = false
  }
}

async function startAttempt(scope: TemplatePatchScope, bodyJson: string) {
  if (!etag.value || !props.id) {
    message.error('模板尚未读取，暂时不能保存。')
    return
  }
  const generation = getTemplateConfigurationSessionGeneration()
  const attempt = createTemplateConfigurationAttempt(
    props.id,
    scope,
    bodyJson,
    etag.value,
    globalThis.crypto.randomUUID(),
    generation
  )
  pendingAttempt.value = attempt
  await sendAttempt(attempt)
}

async function retryUnknown() {
  const attempt = pendingAttempt.value || pendingFor(props.id)
  if (!attempt || saving.value || !attempt.previouslyUnknown) return
  pendingAttempt.value = attempt
  await sendAttempt(attempt)
}

async function savePolicy() {
  if (busy.value) return
  policyError.value = ''
  const validation = validateAccessPolicy(policy.value)
  if (validation) {
    policyError.value = validation
    return
  }
  if (!rawText.value) {
    message.error('模板尚未读取，暂时不能保存。')
    return
  }
  let configurationJson: string
  try {
    configurationJson = buildAccessPolicyConfiguration(rawText.value, policy.value)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '无法生成配置内容。')
    return
  }
  await startAttempt('accessPolicy', `{"configuration":${configurationJson}}`)
}

async function toggleAdministrativeState() {
  if (busy.value) return
  await startAttempt('administrativeState', buildAdministrativeStatePatch(isDisabled.value ? 'enabled' : 'disabled'))
}

async function uploadCover(file: File) {
  if (busy.value) return
  coverError.value = ''
  if (!file.type.startsWith('image/')) {
    coverError.value = '封面必须是图片文件。'
    return
  }
  if (file.size > MAX_COVER_BYTES) {
    coverError.value = '封面图片不能超过 5 MB。'
    return
  }
  const templateId = props.id
  const generation = getTemplateConfigurationSessionGeneration()
  uploading.value = true
  try {
    const { asset } = await fileAssetsNative.upload(file, globalThis.crypto.randomUUID())
    if (!currentSessionIs(generation, templateId)) return
    await startAttempt('imageAssetId', buildImageAssetPatch(asset.id))
  } catch (error) {
    if (!currentSessionIs(generation, templateId)) return
    coverError.value = error instanceof Error ? error.message : '封面上传失败。'
  } finally {
    if (currentSessionIs(generation, templateId)) uploading.value = false
  }
}

async function removeCover() {
  if (busy.value) return
  await startAttempt('imageAssetId', buildImageAssetPatch(null))
}

function onCoverPicked(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) void uploadCover(file)
}

function pickCover() {
  if (busy.value || !canWrite.value) return
  coverInput.value?.click()
}

function guardPendingNavigation(): boolean {
  if (!pendingFor(props.id)) return true
  message.warning('此模板设置保存结果尚未确认；请先在当前标签重试同一请求。')
  return false
}

onBeforeRouteLeave(() => guardPendingNavigation())
onBeforeRouteUpdate((to, from) => {
  if (String(to.query.id || '') !== String(from.query.id || '') && !guardPendingNavigation()) return false
})

const identity = computed(() => nativeCredentialIdentityParts(authStore.userInfo))
watch(
  [() => Boolean(authStore.token), () => identity.value.subjectId, () => identity.value.tenantId],
  ([loggedIn, subjectId, tenantId]) => {
    const changed = syncTemplateConfigurationSession(Boolean(loggedIn), subjectId, tenantId)
    if (changed) {
      localSequence += 1
      pendingAttempt.value = null
      saving.value = false
      uploading.value = false
      loading.value = false
      template.value = null
      rawText.value = ''
      etag.value = ''
      coverUrl.value = ''
      void loadTemplate()
    } else {
      pendingAttempt.value = pendingFor(props.id)
      if (!template.value) void loadTemplate()
    }
  },
  { immediate: true, flush: 'sync' }
)

watch(
  () => props.id,
  id => {
    if (id === activeTemplateId) return
    activeTemplateId = id
    localSequence += 1
    pendingAttempt.value = null
    saving.value = false
    loading.value = false
    template.value = null
    rawText.value = ''
    etag.value = ''
    coverUrl.value = ''
    coverError.value = ''
    policyError.value = ''
    void loadTemplate(id)
  },
  { flush: 'sync' }
)

onBeforeUnmount(() => {
  disposed = true
  localSequence += 1
})
</script>

<template>
  <div>
    <NAlert v-if="pendingAttempt" type="warning" :show-icon="false" class="mb-3">
      模板 {{ pendingAttempt.templateId }} 的设置保存结果尚未确认。
      <NButton v-if="!saving" size="small" type="warning" :disabled="saving" class="ml-2" @click="retryUnknown">
        重试同一请求
      </NButton>
    </NAlert>
    <NAlert v-if="loadError" type="error" :show-icon="false" class="mb-3">{{ loadError }}</NAlert>

    <NSpin :show="loading">
      <NSpace vertical>
        <NAlert v-if="!canWrite" type="info" :show-icon="false">当前账号没有设备模板写权限，本页仅可查看。</NAlert>

        <section>
          <h4 class="mb-2">封面</h4>
          <NSpace align="center">
            <NImage v-if="coverUrl" :src="coverUrl" width="96" height="96" object-fit="cover" />
            <NEmpty v-else size="small" description="未设置封面" class="w-40" />
            <NSpace vertical>
              <NSpace>
                <NButton :disabled="!canWrite || busy" :loading="uploading" @click="pickCover">上传封面</NButton>
                <NButton v-if="hasCover" :disabled="!canWrite || busy" @click="removeCover">移除封面</NButton>
              </NSpace>
              <span class="text-gray-500">支持图片文件，最大 5 MB；保存后列表按 FileAsset 授权读取。</span>
            </NSpace>
          </NSpace>
          <input ref="coverInput" type="file" accept="image/*" class="hidden" @change="onCoverPicked" />
          <NAlert v-if="coverError" type="error" :show-icon="false" class="mt-2">{{ coverError }}</NAlert>
        </section>

        <section>
          <h4 class="mb-2">注册与在线策略</h4>
          <NAlert v-if="policyError" type="error" :show-icon="false" class="mb-2">{{ policyError }}</NAlert>
          <NForm label-placement="left" label-width="140px">
            <NFormItem label="自动注册">
              <NSpace vertical>
                <NSwitch v-model:value="policy.autoRegister" :disabled="!canWrite || busy" />
                <span class="text-gray-500">开启后允许凭据策略自动登记新设备。</span>
              </NSpace>
            </NFormItem>
            <NFormItem label="在线判定方式">
              <NSelect v-model:value="policy.onlineMode" :options="onlineModeOptions" :disabled="!canWrite || busy" />
            </NFormItem>
            <NFormItem label="判定超时（秒）">
              <NInputNumber
                v-model:value="policy.onlineTimeoutSeconds"
                :min="1"
                :max="86400"
                :disabled="!canWrite || busy"
              />
            </NFormItem>
            <NSpace>
              <NButton type="primary" :loading="saving" :disabled="!canWrite || busy || !template" @click="savePolicy">
                保存注册与在线策略
              </NButton>
            </NSpace>
          </NForm>
        </section>

        <section>
          <h4 class="mb-2">启用状态</h4>
          <NSpace align="center">
            <NTag :type="isDisabled ? 'warning' : 'success'" size="small">
              {{ isDisabled ? '已停用' : '已启用' }}
            </NTag>
            <span class="text-gray-500">{{ administrativeStateNotice(administrativeState) }}</span>
            <NButton :disabled="!canWrite || busy || !template" @click="toggleAdministrativeState">
              {{ isDisabled ? '启用模板' : '停用模板' }}
            </NButton>
          </NSpace>
        </section>
      </NSpace>
    </NSpin>
  </div>
</template>
