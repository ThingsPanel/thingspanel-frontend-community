<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { NAlert, NButton, NCard, NForm, NFormItem, NInput, NSpace, NSpin, NTabPane, NTabs } from 'naive-ui'
import { $t } from '@/locales'
import { createOperationKey, thingModelNative, ThingModelNativeError, type ModelDetail, type ModelDraft, type ModelCommandResult } from '@/service/api/thingmodel-native'
import NativeModelDefinition from '@/views/device/template/NativeModelDefinition.vue'
import VersionHistoryModal from '@/views/device/template/components/version-history-modal.vue'
import NativeModelProfile from '@/views/device/template/components/NativeModelProfile.vue'
import WebChartConfig from '@/views/device/template/components/step/web-chart-config.vue'
import AppChartConfig from '@/views/device/template/components/step/app-chart-config.vue'
import { EMPTY_NATIVE_RESOURCES, nativeModelFieldsToPlatformFields, normalizeResourcesDocument, stableFingerprint } from '@/views/device/template/native-model-resources'
import type { NativeChartResourcesPort, NativeChartUpdateOptions } from '@/views/device/template/native-chart-resource-port'
import type { ModelResources, NativeModelProfile as NativeProfile } from '@/service/api/thingmodel-native'

const route = useRoute()
const router = useRouter()
const modelID = computed(() => typeof route.query.id === 'string' ? route.query.id : '')
const loading = ref(false)
const saving = ref(false)
const publishing = ref(false)
const loadFailed = ref(false)
const modelNotFound = ref(false)
const detail = ref<ModelDetail | null>(null)
const basicForm = reactive({ name: '', description: '', category: '' })
const resourcesState = ref<ModelResources | null>(null)
const profileForm = ref<NativeProfile>({ ...EMPTY_NATIVE_RESOURCES.profile, tags: [] })
const resourcesSaving = ref(false)
const profileConflict = ref(false)
const activeTab = ref('basic')
const versionHistoryVisible = ref(false)
const publishVisible = ref(false)
const changelog = ref('')
const saveError = ref('')
const publishResult = ref<ModelCommandResult | null>(null)
let loadSequence = 0
let pendingSave: { modelID: string; fingerprint: string; key: string } | null = null
let pendingPublish: { modelID: string; fingerprint: string; key: string } | null = null
let pendingResourcesSave: { modelID: string; fingerprint: string; key: string } | null = null
const mutationGeneration = ref(0)
const draft = computed(() => detail.value?.draft)
const title = computed(() => draft.value?.name || '物模型')
const savedFingerprint = ref('')
const platformFields = computed(() => draft.value ? nativeModelFieldsToPlatformFields(draft.value) : [])
const draftDirty = computed(() => Boolean(draft.value && (
  basicForm.name !== draft.value.name ||
  basicForm.description !== (draft.value.descriptionI18n?.default ?? '') ||
  basicForm.category !== (draft.value.category ?? '')
)))
const profileDirty = computed(() => Boolean(resourcesState.value && fingerprint(profileForm.value) !== fingerprint(resourcesState.value.profile)))
const basicDirty = computed(() => draftDirty.value || profileDirty.value)
const syncProfileForm = (profile: NativeProfile) => { profileForm.value = { ...profile, tags: [...profile.tags] } }
const observeResources = (loaded: ModelResources) => {
  const next = normalizeResourcesDocument(loaded)
  const previous = resourcesState.value
  const hasLocalProfileEdit = Boolean(previous && fingerprint(profileForm.value) !== fingerprint(previous.profile))
  const remoteProfileChanged = Boolean(previous && fingerprint(previous.profile) !== fingerprint(next.profile))
  if (hasLocalProfileEdit && remoteProfileChanged) profileConflict.value = true
  if (!hasLocalProfileEdit) {
    syncProfileForm(next.profile)
    profileConflict.value = false
  }
  resourcesState.value = { ...loaded, ...next }
}

const syncBasicForm = (model: ModelDraft) => {
  basicForm.name = model.name
  basicForm.description = model.descriptionI18n?.default ?? ''
  basicForm.category = model.category ?? ''
}

const fingerprint = stableFingerprint
const loadModel = async (targetID = modelID.value, preserveSameIDKeys = false) => {
  const sequence = ++loadSequence
  mutationGeneration.value += 1
  detail.value = null
  basicForm.name = ''
  basicForm.description = ''
  basicForm.category = ''
  resourcesState.value = null
  syncProfileForm(EMPTY_NATIVE_RESOURCES.profile)
  profileConflict.value = false
  versionHistoryVisible.value = false
  publishVisible.value = false
  saveError.value = ''
  publishResult.value = null
  loadFailed.value = false
  modelNotFound.value = false
  saving.value = false
  publishing.value = false
  if (!preserveSameIDKeys || pendingSave?.modelID !== targetID) pendingSave = null
  if (!preserveSameIDKeys || pendingPublish?.modelID !== targetID) pendingPublish = null
  if (!preserveSameIDKeys || pendingResourcesSave?.modelID !== targetID) pendingResourcesSave = null
  if (!targetID) {
    loading.value = false
    loadFailed.value = true
    modelNotFound.value = true
    return
  }
  loading.value = true
  try {
    const [result, resources] = await Promise.all([thingModelNative.get(targetID), thingModelNative.getResources(targetID)])
    if (sequence !== loadSequence || modelID.value !== result.modelID) return
    detail.value = result
    observeResources(resources)
    syncBasicForm(result.draft)
    savedFingerprint.value = fingerprint(result.draft)
    if (!preserveSameIDKeys) {
      pendingSave = null
      pendingPublish = null
      pendingResourcesSave = null
    }
    publishResult.value = null
  } catch (error) {
    console.error('Failed to load native thing model:', error)
    if (sequence === loadSequence) { loadFailed.value = true; modelNotFound.value = error instanceof ThingModelNativeError && error.status === 404 }
  } finally { if (sequence === loadSequence) loading.value = false }
}

const saveDraft = async (nextDraft: ModelDraft, onSuccess?: () => void, syncBasicAfterSave = false, includeResources = false): Promise<boolean> => {
  if (!detail.value || detail.value.modelID !== modelID.value || loading.value || loadFailed.value || saving.value || publishing.value) return false
  const current = detail.value
  const operationGeneration = mutationGeneration.value
  const resourcesToSave = includeResources && resourcesState.value ? normalizeResourcesDocument({
    ...resourcesState.value,
    profile: { ...profileForm.value, tags: [...profileForm.value.tags] }
  }) : undefined
  const request = {
    modelID: current.modelID,
    expectedDraftRevision: current.draftRevision,
    model: nextDraft,
    ...(resourcesToSave ? { expectedResourcesRevision: resourcesState.value!.revision, resources: resourcesToSave } : {})
  }
  const requestFingerprint = fingerprint(request)
  if (!pendingSave || pendingSave.modelID !== current.modelID || pendingSave.fingerprint !== requestFingerprint) pendingSave = { modelID: current.modelID, fingerprint: requestFingerprint, key: createOperationKey() }
  saving.value = true
  saveError.value = ''
  try {
    const result = await thingModelNative.update(request, pendingSave.key)
    if (result.status === 'CONFLICT' || result.status === 'FAILED') {
      throw new Error(result.errorMessage || (result.status === 'CONFLICT' ? '草稿已被其他编辑者更新，请重新读取后再保存。' : '物模型保存失败。'))
    }
    if (operationGeneration !== mutationGeneration.value || current.modelID !== modelID.value) return false
    // The command receipt may be replayed after a lost response. Confirm the stored revision
    // before closing the editor or advancing the page's CAS token.
    const [readBack, resourcesReadBack] = await Promise.all([
      thingModelNative.get(current.modelID),
      resourcesToSave ? thingModelNative.getResources(current.modelID) : Promise.resolve(null)
    ])
    if (readBack.draftRevision !== result.draftRevision) throw new Error('保存回执与当前草稿版本不一致，请刷新后重试。')
    if (resourcesToSave && resourcesReadBack) {
      if (result.resourcesRevision !== undefined && resourcesReadBack.revision !== result.resourcesRevision) throw new Error('资源保存回执与当前版本不一致，请重新读取后重试。')
      if (fingerprint(normalizeResourcesDocument(resourcesReadBack)) !== fingerprint(resourcesToSave)) throw new Error('资源保存结果与提交内容不一致，请重新读取后重试。')
    }
    if (modelID.value !== current.modelID) return false
    detail.value = readBack
    if (resourcesReadBack) {
      resourcesState.value = { ...resourcesReadBack, ...normalizeResourcesDocument(resourcesReadBack) }
      syncProfileForm(resourcesState.value.profile)
      profileConflict.value = false
    }
    if (syncBasicAfterSave) syncBasicForm(readBack.draft)
    savedFingerprint.value = fingerprint(readBack.draft)
    pendingSave = null
    window.$message?.success($t('common.saveSuccess'))
    onSuccess?.()
    return true
  } catch (error) {
    if (operationGeneration !== mutationGeneration.value || current.modelID !== modelID.value) return false
    console.error('Failed to save native thing model:', error)
    saveError.value = error instanceof Error ? error.message : $t('common.saveFailed')
    window.$message?.error(saveError.value)
    return false
  } finally { if (operationGeneration === mutationGeneration.value) saving.value = false }
}

const nativeResourcePort: NativeChartResourcesPort = {
  async load() {
    const currentID = modelID.value
    const loaded = await thingModelNative.getResources(currentID)
    if (currentID !== modelID.value) throw new Error('物模型已切换，请重新加载资源。')
    observeResources(loaded)
    return { resources: normalizeResourcesDocument(loaded), revision: loaded.revision }
  },
  async update(mutator, options?: NativeChartUpdateOptions) {
    const currentID = modelID.value
    const latest = await thingModelNative.getResources(currentID)
    if (currentID !== modelID.value) throw new Error('物模型已切换，请重新加载资源。')
    observeResources(latest)
    const resources = normalizeResourcesDocument(latest)
    const next = normalizeResourcesDocument(mutator(resources))
    const requestFingerprint = fingerprint({ modelID: currentID, expectedRevision: latest.revision, resources: next })
    if (fingerprint(resources) === fingerprint(next)) {
      pendingResourcesSave = null
      resourcesState.value = { ...latest, ...resources }
      return { resources, revision: latest.revision }
    }
    if (options && latest.revision !== options.openedRevision && fingerprint(resources[options.conflictKey]) !== fingerprint(options.openedValue)) {
      throw new Error('图表配置已被其他编辑者修改，请重新打开图表后再保存。')
    }
    if (!pendingResourcesSave || pendingResourcesSave.modelID !== currentID || pendingResourcesSave.fingerprint !== requestFingerprint) {
      pendingResourcesSave = { modelID: currentID, fingerprint: requestFingerprint, key: createOperationKey() }
    }
    const result = await thingModelNative.updateResources(
      { modelID: currentID, expectedRevision: latest.revision, resources: next },
      pendingResourcesSave.key
    )
    if (result.status === 'CONFLICT' || result.status === 'FAILED') {
      throw new Error(result.errorMessage || '资源已被其他编辑者更新，请重新读取后保存。')
    }
    const readBack = await thingModelNative.getResources(currentID)
    if (result.resourcesRevision !== undefined && readBack.revision !== result.resourcesRevision) {
      throw new Error('资源保存回执与当前版本不一致，请重新读取后重试。')
    }
    const confirmed = normalizeResourcesDocument(readBack)
    if (fingerprint(confirmed) !== fingerprint(next)) throw new Error('资源保存结果与提交内容不一致，请重新读取后重试。')
    if (currentID !== modelID.value) throw new Error('物模型已切换，请重新加载资源。')
    pendingResourcesSave = null
    observeResources(readBack)
    return { resources: confirmed, revision: readBack.revision }
  }
}

const cloneModelDraft = (value: ModelDraft): ModelDraft => JSON.parse(JSON.stringify(value)) as ModelDraft
const saveBasicInfo = async () => {
  if (!draft.value || !resourcesState.value) return
  if (profileConflict.value) {
    saveError.value = '基本信息已被其他编辑者更新。请先处理页面提示，再保存。'
    return
  }
  const nextDraft = cloneModelDraft(draft.value)
  nextDraft.name = basicForm.name.trim()
  nextDraft.descriptionI18n = basicForm.description.trim()
    ? { ...(nextDraft.descriptionI18n ?? { default: '' }), default: basicForm.description.trim() }
    : null
  nextDraft.category = basicForm.category.trim() || null
  resourcesSaving.value = true
  try {
    await saveDraft(nextDraft, undefined, true, true)
  } finally { resourcesSaving.value = false }
}
const useLatestProfile = () => {
  if (!resourcesState.value) return
  syncProfileForm(resourcesState.value.profile)
  profileConflict.value = false
  saveError.value = ''
}
const canPublish = computed(() => Boolean(detail.value && resourcesState.value && detail.value.modelID === modelID.value && !loading.value && !loadFailed.value && !basicDirty.value && !saving.value && !resourcesSaving.value && !publishing.value && fingerprint(draft.value) === savedFingerprint.value))
const doPublish = async () => {
  const current = detail.value
  if (!current || current.modelID !== modelID.value || loading.value || loadFailed.value || !canPublish.value) return
  const operationGeneration = mutationGeneration.value
  const body = { modelID: current.modelID, expectedDraftRevision: current.draftRevision, expectedResourcesRevision: resourcesState.value!.revision, changelog: changelog.value.trim() || undefined }
  const requestFingerprint = fingerprint(body)
  if (!pendingPublish || pendingPublish.modelID !== current.modelID || pendingPublish.fingerprint !== requestFingerprint) pendingPublish = { modelID: current.modelID, fingerprint: requestFingerprint, key: createOperationKey() }
  publishing.value = true
  publishResult.value = null
  try {
    const result = await thingModelNative.publish(body, pendingPublish.key)
    if (result.status === 'CONFLICT' || result.status === 'FAILED') {
      throw new Error(result.errorMessage || (result.status === 'CONFLICT' ? '草稿已被更新，请重新读取后再发布。' : '发布失败。'))
    }
    if (operationGeneration !== mutationGeneration.value || current.modelID !== modelID.value) return
    const readBack = await thingModelNative.get(current.modelID)
    if (readBack.publishedRevision !== result.publishedRevision) throw new Error('发布回执与当前已发布版本不一致，请刷新后重试。')
    if (modelID.value !== current.modelID) return
    pendingPublish = null
    publishResult.value = result
    detail.value = readBack
    publishVisible.value = false
    window.$message?.success(result.consumerState === 'PENDING' ? '版本已发布，尚未应用到设备模板。' : $t('common.publishSuccess'))
  } catch (error) {
    if (operationGeneration !== mutationGeneration.value || current.modelID !== modelID.value) return
    console.error('Failed to publish native thing model:', error)
    window.$message?.error(error instanceof Error ? error.message : $t('common.publishFailed'))
  } finally { if (operationGeneration === mutationGeneration.value) publishing.value = false }
}

watch(modelID, () => { activeTab.value = 'basic'; void loadModel(modelID.value, false) })
onMounted(() => void loadModel())
const goBack = () => router.push('/device/thingsmodel')
</script>

<template>
  <div class="h-full overflow-auto">
    <NSpin :show="loading">
      <NCard :title="title">
        <template #header-extra>
          <NSpace>
            <NButton @click="goBack">{{ $t('common.backToList') }}</NButton>
            <NButton :disabled="!detail" @click="versionHistoryVisible = true">{{ $t('market.versionHistory') }}</NButton>
            <NButton type="primary" :disabled="!canPublish" @click="publishVisible = true">{{ $t('generate.publish') }}</NButton>
          </NSpace>
        </template>
        <NAlert type="info" class="mb-4">保存只更新草稿。设备使用已绑定的发布版本；发布后需到设备模板更新绑定。</NAlert>
        <NAlert v-if="loadFailed" type="error" :title="$t('common.loadFailed')" class="mb-4">
          <div class="flex items-center gap-3"><span>{{ modelNotFound ? '找不到此物模型，或你没有访问权限，请返回列表选择。' : '读取物模型失败。' }}</span><NButton size="small" @click="modelNotFound ? goBack() : loadModel(modelID, true)">{{ modelNotFound ? $t('common.backToList') : $t('common.refresh') }}</NButton></div>
        </NAlert>
        <NAlert v-if="saveError" type="error" class="mb-4">
          <div class="flex items-center justify-between gap-3"><span>{{ saveError }}</span><NButton size="small" @click="loadModel(modelID, true)">重新读取最新草稿</NButton></div>
        </NAlert>
        <NAlert v-if="basicDirty" type="warning" class="mb-4">基础信息有未保存的修改，请先保存后再发布。</NAlert>
        <NAlert v-if="profileConflict" type="warning" title="基本信息已更新">
          <NSpace align="center"><span>其他编辑者已修改基本信息。你的输入仍保留，请选择使用最新资料后再编辑保存。</span><NButton size="small" @click="useLatestProfile">使用最新资料</NButton></NSpace>
        </NAlert>
        <NAlert v-if="publishResult?.consumerState === 'PENDING'" type="warning" class="mb-4">版本已发布，尚未应用到设备模板。</NAlert>
        <NTabs v-model:value="activeTab" animated type="line">
          <NTabPane name="basic" :tab="$t('device_template.basicInfo')">
            <NForm v-if="draft" :model="basicForm" label-placement="left" label-width="100">
              <NFormItem label="名称"><NInput v-model:value="basicForm.name" :disabled="saving || resourcesSaving || publishing" :input-props="{ 'aria-label': '名称' }" /></NFormItem>
              <NFormItem label="描述"><NInput v-model:value="basicForm.description" type="textarea" :disabled="saving || resourcesSaving || publishing" :input-props="{ 'aria-label': '描述' }" /></NFormItem>
              <NFormItem label="分类"><NInput v-model:value="basicForm.category" :disabled="saving || resourcesSaving || publishing" :input-props="{ 'aria-label': '分类' }" /></NFormItem>
              <NativeModelProfile v-model="profileForm" :disabled="saving || resourcesSaving || publishing" />
              <NButton type="primary" :loading="saving || resourcesSaving" :disabled="publishing || profileConflict || !basicDirty" @click="saveBasicInfo">{{ $t('common.save') }}</NButton>
            </NForm>
          </NTabPane>
          <NTabPane name="model" :tab="$t('device_template.modelDefinition')">
            <NativeModelDefinition v-if="draft" :model="draft" :saving="saving || publishing" @save="saveDraft" />
          </NTabPane>
          <NTabPane name="web-chart" :tab="$t('device_template.webChartConfiguration')">
            <WebChartConfig
              :step-current="0"
              :modal-visible="true"
              :device-template-id="modelID"
              :is-edit-mode="true"
              :native-resource-port="nativeResourcePort"
              :native-platform-fields="platformFields"
              :native-resources-revision="resourcesState?.revision"
            />
          </NTabPane>
          <NTabPane name="app-chart" :tab="$t('device_template.appChartConfiguration')">
            <AppChartConfig
              :step-current="0"
              :modal-visible="true"
              :device-template-id="modelID"
              :is-edit-mode="true"
              :native-resource-port="nativeResourcePort"
              :native-platform-fields="platformFields"
              :native-resources-revision="resourcesState?.revision"
            />
          </NTabPane>
        </NTabs>
      </NCard>
    </NSpin>
    <VersionHistoryModal v-model:visible="versionHistoryVisible" :template-id="modelID" />
    <NModal v-model:show="publishVisible" preset="card" title="发布物模型" class="w-600px" :mask-closable="!publishing" :close-on-esc="!publishing">
      <p class="mb-3">发布后会生成一个新版本，之后可以在版本历史中查看。</p>
      <NFormItem label="发布说明"><NInput v-model:value="changelog" type="textarea" :disabled="publishing" :input-props="{ 'aria-label': '发布说明' }" /></NFormItem>
      <NSpace justify="end"><NButton :disabled="publishing" @click="publishVisible = false">{{ $t('common.cancel') }}</NButton><NButton type="primary" :loading="publishing" @click="doPublish">{{ $t('generate.publish') }}</NButton></NSpace>
    </NModal>
  </div>
</template>
