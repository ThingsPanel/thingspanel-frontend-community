<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { useMessage } from 'naive-ui'
import { useAuthStore } from '@/store/modules/auth'
import {
  deviceInfoNative,
  encodeInfoPayload,
  type DeviceInfoSnapshot,
  type InfoScalarTokens
} from '@/service/api/device-info-native'
import { templateNative } from '@/service/api/template-native'
import type { CustomFieldDefinition } from '@/service/api/template-custom-fields-state'
import TencentMap from './public/tencent-map.vue'
import { nativeCredentialIdentityParts } from './native-device-credentials-flow'
import {
  applyDeviceInfoFieldDrafts,
  clearDeviceInfoAttempt,
  createDeviceInfoAttempt,
  deviceInfoAttemptRevision,
  getDeviceInfoLocationValidationError,
  getDeviceInfoAttempt,
  getDeviceInfoAttemptForSession,
  getDeviceInfoSessionGeneration,
  isActiveDeviceInfoTarget,
  isCurrentDeviceInfoSession,
  isCurrentDeviceInfoTarget,
  makeDeviceInfoFieldDraft,
  makeDeviceInfoLocationDraft,
  makeDeviceInfoLocationTokens,
  markDeviceInfoAttemptUnknown,
  shouldRetainDeviceInfoAttempt,
  syncDeviceInfoSession,
  syncDeviceInfoTarget,
  type DeviceInfoFieldDraft,
  type DeviceInfoSaveAttempt
} from './device-info-state'

const props = defineProps<{ id: string; deviceConfigId: string; deviceData?: Record<string, unknown> }>()
const emit = defineEmits<{ change: [] }>()
const message = useMessage()
const authStore = useAuthStore()
const snapshot = ref<DeviceInfoSnapshot | null>(null)
const frozenAttempt = shallowRef<DeviceInfoSaveAttempt | null>(null)
const definitions = ref<CustomFieldDefinition[]>([])
const drafts = ref<Record<string, DeviceInfoFieldDraft>>({})
const locationDraft = ref({ latitude: '', longitude: '', address: '' })
const clearLocation = ref(false)
const showMap = ref(false)
const loading = ref(false)
const saving = ref(false)
const pageError = ref('')
const validationError = ref('')
const refreshRequired = ref(false)
const revision = ref(0)
const dirtyFieldKeys = ref(new Set<string>())
const dirtyLocationKeys = ref(new Set<'latitude' | 'longitude' | 'address'>())
let sessionGeneration = 0
let targetGeneration = 0
let loadGeneration = 0
let inFlight = false

const templateId = computed(() => props.deviceConfigId || null)
const pendingAttempt = computed(() => {
  revision.value
  deviceInfoAttemptRevision.value
  return (
    frozenAttempt.value ??
    getDeviceInfoAttempt(props.id, templateId.value, sessionGeneration, targetGeneration) ??
    getDeviceInfoAttemptForSession(sessionGeneration)
  )
})
const hasPendingAttempt = computed(() => Boolean(pendingAttempt.value))
function attemptKey(): string {
  return `device-info-${globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`
}

function initDrafts(result: DeviceInfoSnapshot) {
  const next: Record<string, DeviceInfoFieldDraft> = Object.create(null)
  for (const field of definitions.value) {
    next[field.key] = makeDeviceInfoFieldDraft(
      field.type,
      Object.prototype.hasOwnProperty.call(result.customFieldTokens, field.key),
      result.customFieldTokens[field.key]
    )
  }
  drafts.value = next
  locationDraft.value = makeDeviceInfoLocationDraft(result.locationTokens)
  clearLocation.value = false
  dirtyFieldKeys.value = new Set()
  dirtyLocationKeys.value = new Set()
}

function resetTarget() {
  snapshot.value = null
  definitions.value = []
  drafts.value = {}
  locationDraft.value = { latitude: '', longitude: '', address: '' }
  clearLocation.value = false
  showMap.value = false
  dirtyFieldKeys.value = new Set()
  dirtyLocationKeys.value = new Set()
  pageError.value = ''
  validationError.value = ''
  refreshRequired.value = false
}

async function loadInfo(keepDirtyDraft = false) {
  const deviceId = props.id
  const currentTemplate = templateId.value
  const previousDrafts = drafts.value
  const previousLocationDraft = locationDraft.value
  const previousClearLocation = clearLocation.value
  const dirtyFields = new Set(dirtyFieldKeys.value)
  const dirtyLocations = new Set(dirtyLocationKeys.value)
  const request = ++loadGeneration
  const session = sessionGeneration
  const target = targetGeneration
  loading.value = true
  pageError.value = ''
  refreshRequired.value = true
  try {
    const nextSnapshot = await deviceInfoNative.get(deviceId)
    let nextDefinitions: CustomFieldDefinition[] = []
    if ((nextSnapshot.device.templateId ?? null) !== currentTemplate) {
      if (request === loadGeneration && isCurrentDeviceInfoSession(session)) {
        snapshot.value = null
        refreshRequired.value = true
        pageError.value = '设备绑定模板已变化，请等待详情刷新后再编辑。'
        emit('change')
      }
      return
    }
    if (currentTemplate) {
      const { template } = await templateNative.get(currentTemplate)
      nextDefinitions = template.configuration.customFieldDefinitions ?? []
    }
    if (
      request !== loadGeneration ||
      !isCurrentDeviceInfoSession(session) ||
      !isCurrentDeviceInfoTarget(deviceId, currentTemplate, target)
    )
      return
    snapshot.value = nextSnapshot
    definitions.value = nextDefinitions
    refreshRequired.value = false
    initDrafts(nextSnapshot)
    if (keepDirtyDraft) {
      const nextDrafts = Object.assign(Object.create(null), drafts.value) as Record<string, DeviceInfoFieldDraft>
      for (const key of dirtyFields) {
        if (Object.prototype.hasOwnProperty.call(previousDrafts, key)) {
          Object.defineProperty(nextDrafts, key, {
            value: previousDrafts[key],
            enumerable: true,
            configurable: true,
            writable: true
          })
        }
      }
      drafts.value = nextDrafts
      const nextLocation = { ...locationDraft.value }
      for (const key of dirtyLocations) nextLocation[key] = previousLocationDraft[key]
      locationDraft.value = nextLocation
      clearLocation.value = previousClearLocation
      dirtyFieldKeys.value = dirtyFields
      dirtyLocationKeys.value = dirtyLocations
    }
    revision.value += 1
  } catch (error) {
    if (
      request === loadGeneration &&
      isCurrentDeviceInfoSession(session) &&
      isCurrentDeviceInfoTarget(deviceId, currentTemplate, target)
    ) {
      pageError.value = error instanceof Error ? error.message : '设备信息暂时无法读取。'
    }
  } finally {
    if (request === loadGeneration) loading.value = false
  }
}

watch(
  [
    () => Boolean(authStore.token),
    () => nativeCredentialIdentityParts(authStore.userInfo).subjectId,
    () => nativeCredentialIdentityParts(authStore.userInfo).tenantId
  ],
  ([loggedIn, subjectId, tenantId]) => {
    syncDeviceInfoSession(loggedIn, subjectId, tenantId)
    sessionGeneration = getDeviceInfoSessionGeneration()
    loadGeneration += 1
    saving.value = false
    inFlight = false
    resetTarget()
    frozenAttempt.value = getDeviceInfoAttemptForSession(sessionGeneration) ?? null
    if (loggedIn && props.id) {
      targetGeneration = syncDeviceInfoTarget(props.id, templateId.value)
      void loadInfo()
    }
  },
  { immediate: true, flush: 'sync' }
)

watch([() => props.id, templateId], ([deviceId, currentTemplate], [oldId, oldTemplate]) => {
  if (deviceId === oldId && currentTemplate === oldTemplate) return
  const priorAttempt = getDeviceInfoAttempt(oldId, oldTemplate, sessionGeneration, targetGeneration)
  if (priorAttempt) frozenAttempt.value = priorAttempt
  targetGeneration = syncDeviceInfoTarget(deviceId, currentTemplate)
  loadGeneration += 1
  resetTarget()
  if (authStore.token && deviceId) void loadInfo()
})

function guardPendingNavigation(): boolean {
  if (!authStore.token) return true
  if (!hasPendingAttempt.value) return true
  message.warning('设备信息保存结果尚未确认，请先重试同一请求。')
  return false
}

onBeforeRouteLeave(guardPendingNavigation)
onBeforeRouteUpdate((to, from) => {
  const nextId = String(to.query.d_id ?? '')
  const currentId = String(from.query.d_id ?? '')
  return nextId !== currentId ? guardPendingNavigation() : true
})

onBeforeUnmount(() => {
  loadGeneration += 1
})

function fieldPlaceholder(field: CustomFieldDefinition): string {
  if (field.defaultValue === null) return '默认值为空（未写入设备）'
  if (typeof field.defaultValue === 'string') return field.defaultValue || '默认空字符串（未写入设备）'
  return String(field.defaultValue)
}

function setFieldMode(key: string, mode: DeviceInfoFieldDraft['mode']) {
  const current = Object.prototype.hasOwnProperty.call(drafts.value, key)
    ? drafts.value[key]
    : { mode: 'unset' as const, text: '' }
  const next: Record<string, DeviceInfoFieldDraft> = Object.assign(Object.create(null), drafts.value)
  Object.defineProperty(next, key, {
    value: { ...current, mode },
    enumerable: true,
    configurable: true,
    writable: true
  })
  drafts.value = next
  dirtyFieldKeys.value = new Set([...dirtyFieldKeys.value, key])
}

function updateFieldText(field: CustomFieldDefinition, value: string | number | null) {
  const text = field.type === 'number' ? (value === null ? '' : String(value)) : String(value ?? '')
  const current = Object.prototype.hasOwnProperty.call(drafts.value, field.key)
    ? drafts.value[field.key]
    : { mode: 'unset' as const, text: '' }
  const next: Record<string, DeviceInfoFieldDraft> = Object.assign(Object.create(null), drafts.value)
  Object.defineProperty(next, field.key, {
    value: { ...current, mode: 'value', text },
    enumerable: true,
    configurable: true,
    writable: true
  })
  drafts.value = next
  dirtyFieldKeys.value = new Set([...dirtyFieldKeys.value, field.key])
}

function setLocationValue(key: 'latitude' | 'longitude' | 'address', value: string) {
  locationDraft.value = { ...locationDraft.value, [key]: value }
  dirtyLocationKeys.value = new Set([...dirtyLocationKeys.value, key])
  clearLocation.value = false
}

function setClearLocation(value: boolean) {
  clearLocation.value = value
}

function chooseMapPosition(position: { lat: number; lng: number }) {
  if (!canEdit.value) return
  locationDraft.value = {
    ...locationDraft.value,
    latitude: String(position.lat),
    longitude: String(position.lng)
  }
  dirtyLocationKeys.value = new Set([...dirtyLocationKeys.value, 'latitude', 'longitude'])
  clearLocation.value = false
  showMap.value = false
}

function openMap() {
  if (!canEdit.value) return
  const error = getDeviceInfoLocationValidationError(locationDraft.value)
  if (error) {
    message.error(error)
    return
  }
  showMap.value = true
}

function isLocationChanged(): boolean {
  if (!snapshot.value) return false
  if (clearLocation.value) return snapshot.value.locationTokens !== null
  if (dirtyLocationKeys.value.size === 0) return false
  try {
    const baselineDraft = makeDeviceInfoLocationDraft(snapshot.value.locationTokens)
    const mergedDraft = { ...baselineDraft }
    for (const key of dirtyLocationKeys.value) mergedDraft[key] = locationDraft.value[key]
    const next = makeDeviceInfoLocationTokens(mergedDraft, snapshot.value.locationTokens)
    const before = snapshot.value.locationTokens
    if (before === null) return Object.values(next).some(token => token !== 'null' && token !== '""')
    return Object.keys(next).some(key => next[key] !== before[key]) || Object.keys(before).some(key => !(key in next))
  } catch {
    return true
  }
}

function buildPayload(): { payloadJSON: string; hasChanges: boolean } {
  if (!snapshot.value) throw new Error('设备信息尚未加载。')
  const dirtyDrafts: Record<string, DeviceInfoFieldDraft> = Object.create(null)
  for (const key of dirtyFieldKeys.value) {
    if (Object.prototype.hasOwnProperty.call(drafts.value, key)) dirtyDrafts[key] = drafts.value[key]
  }
  const fields = applyDeviceInfoFieldDrafts(snapshot.value.customFieldTokens, definitions.value, dirtyDrafts)
  let locationChanged = false
  let location: InfoScalarTokens | null | undefined
  if (clearLocation.value && snapshot.value.locationTokens !== null) {
    location = null
    locationChanged = true
  } else if (!clearLocation.value && isLocationChanged()) {
    const mergedDraft = { ...makeDeviceInfoLocationDraft(snapshot.value.locationTokens) }
    for (const key of dirtyLocationKeys.value) mergedDraft[key] = locationDraft.value[key]
    location = makeDeviceInfoLocationTokens(mergedDraft, snapshot.value.locationTokens)
    locationChanged = true
  }
  const hasChanges = fields.changed || locationChanged
  return {
    payloadJSON: hasChanges
      ? encodeInfoPayload(fields.changed ? fields.tokens : undefined, locationChanged ? location : undefined)
      : '',
    hasChanges
  }
}

async function submitAttempt(existing = pendingAttempt.value) {
  if (inFlight || saving.value) return
  const attempt = existing
  if (!attempt) return
  inFlight = true
  saving.value = true
  validationError.value = ''
  const session = attempt.sessionGeneration
  try {
    const result = await deviceInfoNative.update(attempt.deviceId, attempt.payloadJSON, attempt.etag, attempt.key)
    if (!isCurrentDeviceInfoSession(session)) return
    clearDeviceInfoAttempt(attempt)
    revision.value += 1
    if (!isActiveDeviceInfoTarget(attempt.deviceId, attempt.templateId)) {
      if (frozenAttempt.value === attempt) frozenAttempt.value = null
      message.success(`原设备 ${attempt.deviceId} 的保存已完成；当前设备内容未被覆盖。`)
      return
    }
    if (frozenAttempt.value === attempt) frozenAttempt.value = null
    snapshot.value = result
    initDrafts(result)
    revision.value += 1
    message.success('设备信息已保存。')
    emit('change')
    await loadInfo()
  } catch (error) {
    if (!isCurrentDeviceInfoSession(session)) return
    const status =
      typeof error === 'object' && error && 'status' in error
        ? Number((error as { status?: unknown }).status)
        : undefined
    const retained = shouldRetainDeviceInfoAttempt(status, attempt.previouslyUnknown)
    if (retained) {
      const unknown = markDeviceInfoAttemptUnknown(attempt)
      if (unknown) {
        revision.value += 1
        if (frozenAttempt.value === attempt) frozenAttempt.value = unknown
        message.error(`设备 ${attempt.deviceId} 的保存结果尚未确认。请使用原请求重试。`)
      }
    } else {
      clearDeviceInfoAttempt(attempt)
      revision.value += 1
      if (frozenAttempt.value === attempt) frozenAttempt.value = null
      if (!isActiveDeviceInfoTarget(attempt.deviceId, attempt.templateId)) {
        message.error(`设备 ${attempt.deviceId} 的原请求未保存；请在原设备上下文重新确认。`)
        return
      }
      if (status === 412) {
        refreshRequired.value = true
        message.warning('设备资料已被其他操作更新；已刷新服务器值，请核对后重新保存。')
        await loadInfo(true)
      } else {
        pageError.value = error instanceof Error ? error.message : '设备信息保存失败。'
      }
    }
  } finally {
    if (isCurrentDeviceInfoSession(session)) {
      saving.value = false
      inFlight = false
    }
  }
}

async function save() {
  if (hasPendingAttempt.value) {
    await retryUnknown()
    return
  }
  if (inFlight || !snapshot.value) return
  try {
    const { payloadJSON, hasChanges } = buildPayload()
    if (!hasChanges) {
      message.info('没有需要保存的变化。')
      return
    }
    const attempt = createDeviceInfoAttempt(
      props.id,
      templateId.value,
      payloadJSON,
      snapshot.value.etag,
      attemptKey(),
      sessionGeneration,
      targetGeneration
    )
    frozenAttempt.value = attempt
    await submitAttempt(attempt)
  } catch (error) {
    validationError.value = error instanceof Error ? error.message : '设备信息无法保存。'
  }
}

async function retryUnknown() {
  const attempt = pendingAttempt.value
  if (!attempt?.previouslyUnknown) return
  await submitAttempt(attempt)
}

function displayValue(field: CustomFieldDefinition): string {
  const draft = drafts.value[field.key]
  if (!draft || draft.mode === 'unset') return '未赋值'
  if (draft.mode === 'null') return 'null'
  if (field.type === 'boolean') return draft.text
  return draft.text
}

const canEdit = computed(
  () => Boolean(snapshot.value) && !loading.value && !saving.value && !refreshRequired.value && !hasPendingAttempt.value
)
</script>

<template>
  <div class="device-info-page" :data-revision="revision">
    <n-alert v-if="pageError" type="error" :show-icon="false" class="mb-12px">{{ pageError }}</n-alert>
    <n-alert v-if="hasPendingAttempt" type="warning" :show-icon="false" class="mb-12px">
      设备 {{ pendingAttempt?.deviceId }}{{ pendingAttempt?.templateId ? ` / 模板 ${pendingAttempt.templateId}` : '' }}
      的保存结果尚未确认。原请求已冻结，请勿修改表单。
      <n-button
        v-if="pendingAttempt?.previouslyUnknown"
        size="small"
        type="warning"
        :disabled="saving"
        class="ml-8px"
        @click="retryUnknown"
      >
        重试同一请求
      </n-button>
    </n-alert>
    <n-spin :show="loading">
      <div v-if="snapshot" class="device-info-content">
        <section class="info-section">
          <h3>位置</h3>
          <div class="location-fields">
            <n-form-item label="纬度">
              <n-input
                :value="locationDraft.latitude"
                :disabled="!canEdit || clearLocation"
                placeholder="与经度成对填写"
                @update:value="value => setLocationValue('latitude', value)"
              />
            </n-form-item>
            <n-form-item label="经度">
              <n-input
                :value="locationDraft.longitude"
                :disabled="!canEdit || clearLocation"
                placeholder="与纬度成对填写"
                @update:value="value => setLocationValue('longitude', value)"
              />
            </n-form-item>
            <n-form-item label="地址">
              <n-input
                :value="locationDraft.address"
                :disabled="!canEdit || clearLocation"
                placeholder="可仅填写地址"
                @update:value="value => setLocationValue('address', value)"
              />
            </n-form-item>
          </div>
          <n-checkbox :checked="clearLocation" :disabled="!canEdit" @update:checked="setClearLocation">
            清空整个位置
          </n-checkbox>
          <n-button v-if="!clearLocation" :disabled="!canEdit" class="mt-12px" @click="openMap">地图选点</n-button>
          <div v-else class="muted">保存后位置将为 null。</div>
          <n-modal v-model:show="showMap" class="flex-center" :class="'max-w-720px'">
            <n-card class="map-modal-card">
              <TencentMap
                v-if="showMap"
                class="map-modal"
                :latitude="locationDraft.latitude"
                :longitude="locationDraft.longitude"
                @position-selected="chooseMapPosition"
              />
            </n-card>
          </n-modal>
        </section>

        <section v-if="templateId" class="info-section">
          <h3>扩展信息</h3>
          <n-empty v-if="definitions.length === 0" description="当前模板没有扩展字段。" />
          <div v-for="field in definitions" :key="field.key" class="field-row">
            <div class="field-heading">
              <strong>{{ field.name }}</strong>
              <code>{{ field.key }}</code>
              <n-tag v-if="!field.enabled" size="small">已停用，只读保留</n-tag>
              <span v-if="field.description" class="muted">{{ field.description }}</span>
            </div>
            <div v-if="!field.enabled" class="readonly-value">
              {{
                Object.prototype.hasOwnProperty.call(snapshot.customFieldTokens, field.key)
                  ? displayValue(field)
                  : '未赋值'
              }}
            </div>
            <template v-else>
              <div class="field-controls">
                <n-select
                  v-if="field.type === 'boolean'"
                  :value="
                    drafts[field.key]?.mode === 'null'
                      ? null
                      : drafts[field.key]?.mode === 'unset'
                        ? undefined
                        : drafts[field.key]?.text
                  "
                  :options="[
                    { label: 'true', value: 'true' },
                    { label: 'false', value: 'false' }
                  ]"
                  clearable
                  :disabled="!canEdit"
                  :placeholder="fieldPlaceholder(field)"
                  @update:value="
                    value => (value === null ? setFieldMode(field.key, 'null') : updateFieldText(field, value))
                  "
                />
                <n-select
                  v-else-if="field.type === 'enum'"
                  :value="drafts[field.key]?.mode === 'value' ? drafts[field.key]?.text : null"
                  :options="field.enumValues.map(item => ({ label: item.label, value: item.value }))"
                  clearable
                  :disabled="!canEdit"
                  :placeholder="drafts[field.key]?.mode === 'null' ? 'null' : fieldPlaceholder(field)"
                  @update:value="
                    value => (value === null ? setFieldMode(field.key, 'null') : updateFieldText(field, value))
                  "
                />
                <n-input
                  v-else
                  :value="drafts[field.key]?.mode === 'value' ? drafts[field.key]?.text : ''"
                  :disabled="!canEdit || drafts[field.key]?.mode === 'null'"
                  :placeholder="drafts[field.key]?.mode === 'null' ? 'null' : fieldPlaceholder(field)"
                  @update:value="value => updateFieldText(field, value)"
                />
                <n-button quaternary size="small" :disabled="!canEdit" @click="setFieldMode(field.key, 'null')">
                  设为空值
                </n-button>
                <n-button quaternary size="small" :disabled="!canEdit" @click="setFieldMode(field.key, 'unset')">
                  恢复模板默认
                </n-button>
              </div>
              <div class="muted">
                当前：{{ displayValue(field) }} · {{ field.type
                }}{{
                  drafts[field.key]?.mode === 'unset'
                    ? ` · 默认 ${fieldPlaceholder(field)}（仅显示，不会自动写入）`
                    : ''
                }}
              </div>
            </template>
          </div>
        </section>

        <n-alert v-if="validationError" type="error" :show-icon="false" class="mb-12px">{{ validationError }}</n-alert>
      </div>
      <div class="actions">
        <n-button type="primary" :disabled="!canEdit" :loading="saving" @click="save">保存设备信息</n-button>
        <n-button :disabled="loading || saving || hasPendingAttempt" @click="loadInfo(true)">刷新</n-button>
      </div>
    </n-spin>
  </div>
</template>

<style scoped>
.device-info-page {
  padding: 12px;
}
.info-section {
  margin-bottom: 20px;
  padding: 16px;
  border: 1px solid var(--n-border-color);
  border-radius: 8px;
}
.info-section h3 {
  margin: 0 0 14px;
  font-size: 16px;
}
.location-fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.map-modal-card {
  width: min(720px, 90vw);
}
.map-modal {
  width: 100%;
  height: 440px;
}
.field-row {
  padding: 12px 0;
  border-top: 1px solid var(--n-border-color);
}
.field-heading,
.field-controls,
.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.field-controls > :first-child {
  flex: 1;
  min-width: 180px;
}
.muted,
.readonly-value {
  color: var(--n-text-color-3);
  font-size: 12px;
}
.readonly-value {
  margin-top: 8px;
  font-size: 14px;
}
.actions {
  justify-content: flex-end;
  margin-top: 16px;
}
@media (max-width: 760px) {
  .location-fields {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
