<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import { deviceConfigInfo } from '@/service/api/device'
import { $t } from '@/locales'
import { localStg } from '@/utils/storage'
import ThingsVisWidget from '@/components/thingsvis/ThingsVisWidget.vue'
import { canonicalizeThingsVisConfig } from '@/utils/thingsvis/chart-config-normalizer'
import { normalizeAppChartConfig } from '@/utils/thingsvis/chart-config-initialization'
import { extractPlatformFields } from '@/utils/thingsvis/platform-fields'
import {
  loadPublishedSnapshot,
  loadPublishedThingModels,
  loadPublishedVersions,
  saveNativeThingModelBinding
} from '@/service/api/native-template-binding'
import type { DeviceConfigNativeBinding } from '@/service/api/native-template-binding'
import type { ModelSummary, SnapshotDetail, VersionSummary } from '@/service/api/thingmodel-native-transport'
import { fromNativeField } from '@/views/device/template/native-field-mapping'

type BoundSnapshot = SnapshotDetail & { modelID: string }
interface Props { configInfo?: DeviceConfigNativeBinding | null }
const props = withDefaults(defineProps<Props>(), { configInfo: null })
const emit = defineEmits<{ (event: 'upDateConfig'): void }>()
const message = useMessage()
const models = ref<ModelSummary[]>([])
const versions = ref<VersionSummary[]>([])
const selectedModelID = ref('')
const selectedRevision = ref<number | null>(null)
const preview = ref<BoundSnapshot | null>(null)
const loading = ref(false)
const saving = ref(false)
let selectionRequestSeq = 0
let snapshotRequestSeq = 0

const fieldKinds = ['TELEMETRY', 'ATTRIBUTE', 'EVENT', 'COMMAND'] as const
const fieldKindLabels: Record<(typeof fieldKinds)[number], string> = { TELEMETRY: '遥测', ATTRIBUTE: '属性', EVENT: '事件', COMMAND: '命令' }
const fieldsByKind = computed(() => Object.fromEntries(fieldKinds.map(kind => [kind, preview.value?.model.fields.filter(field => field.kind === kind) ?? []])))
const fieldName = (field: { nameI18n: { default: string; locales?: Record<string, string> }; identifier: string }) =>
  field.nameI18n?.locales?.[String(localStg.get('lang') || '')] || field.nameI18n?.default || field.identifier
const platformFields = computed(() => {
  const fields = preview.value?.model.fields ?? []
  return extractPlatformFields({
    telemetry: fields.filter(field => field.kind === 'TELEMETRY').map(fromNativeField),
    attributes: fields.filter(field => field.kind === 'ATTRIBUTE').map(fromNativeField),
    events: fields.filter(field => field.kind === 'EVENT').map(fromNativeField),
    commands: fields.filter(field => field.kind === 'COMMAND').map(fromNativeField)
  })
})
const platformDevices = computed(() => [{
  deviceId: '__template__', deviceName: 'Thing model', groupId: '__template__', groupName: 'Thing model fields',
  fields: platformFields.value, presets: []
}])
const webChartPreview = computed(() => {
  const config = preview.value?.resources.webChartConfig
  if (!config) return null
  try { return canonicalizeThingsVisConfig(config) } catch { return config }
})
const appChartPreview = computed(() => {
  const config = preview.value?.resources.appChartConfig
  if (!config || typeof config !== 'object' || Array.isArray(config)) return null
  try { return normalizeAppChartConfig(config as Record<string, unknown>) } catch { return config }
})

async function loadCurrentSnapshot() {
  const requestSeq = ++snapshotRequestSeq
  const configID = props.configInfo?.id
  const modelID = props.configInfo?.native_thing_model_id
  const revision = props.configInfo?.native_thing_model_revision
  const snapshotID = props.configInfo?.native_thing_model_snapshot_id
  if (!modelID || !revision) { preview.value = null; loading.value = false; return }
  loading.value = true
  preview.value = null
  try {
    const snapshot = await loadPublishedSnapshot(modelID, revision) as BoundSnapshot
    if (requestSeq !== snapshotRequestSeq ||
        configID !== props.configInfo?.id ||
        modelID !== props.configInfo?.native_thing_model_id ||
        revision !== props.configInfo?.native_thing_model_revision ||
        snapshotID !== props.configInfo?.native_thing_model_snapshot_id) return
    preview.value = snapshot
  } catch (error) {
    if (requestSeq !== snapshotRequestSeq) return
    preview.value = null
    message.error(error instanceof Error ? error.message : '读取已绑定版本失败')
  } finally { if (requestSeq === snapshotRequestSeq) loading.value = false }
}

async function chooseModel(value: string | null) {
  const requestSeq = ++selectionRequestSeq
  const modelID = value || ''
  selectedModelID.value = modelID
  versions.value = []
  selectedRevision.value = null
  if (!modelID) return
  try {
    const loadedVersions = await loadPublishedVersions(modelID)
    if (requestSeq !== selectionRequestSeq) return
    versions.value = loadedVersions
    const current = modelID === props.configInfo?.native_thing_model_id ? props.configInfo?.native_thing_model_revision : null
    selectedRevision.value = current && versions.value.some(item => item.publishedRevision === current)
      ? current
      : versions.value[0]?.publishedRevision ?? null
  } catch (error) { if (requestSeq === selectionRequestSeq) message.error(error instanceof Error ? error.message : '加载已发布版本失败') }
}

async function saveBinding() {
  if (!props.configInfo) return
  saving.value = true
  try {
    let selected: { modelID: string; snapshotID: string; publishedRevision: number } | null = null
    if (selectedModelID.value && selectedRevision.value != null) {
      const snapshot = await loadPublishedSnapshot(selectedModelID.value, selectedRevision.value)
      selected = { modelID: snapshot.modelID, snapshotID: snapshot.snapshotID, publishedRevision: snapshot.publishedRevision }
    }
    const result = await saveNativeThingModelBinding(props.configInfo, selected)
    if (result.error) throw new Error((result as any).message || '保存失败')
    const saved = await deviceConfigInfo({ id: props.configInfo.id })
    const savedConfig = saved.data
    if (selected) {
      if (savedConfig.native_thing_model_id !== selected.modelID ||
          savedConfig.native_thing_model_snapshot_id !== selected.snapshotID ||
          savedConfig.native_thing_model_revision !== selected.publishedRevision) {
        throw new Error('保存结果未能确认，请刷新后检查')
      }
    } else if (savedConfig.native_thing_model_id || savedConfig.native_thing_model_snapshot_id || savedConfig.native_thing_model_revision) {
      throw new Error('解绑结果未能确认，请刷新后检查')
    }
    message.success($t('common.saveSuccess'))
    emit('upDateConfig')
  } catch (error) { message.error(error instanceof Error ? error.message : '保存失败') }
  finally { saving.value = false }
}

watch(
  () => [props.configInfo?.native_thing_model_id, props.configInfo?.native_thing_model_revision],
  async ([modelID]) => {
    await loadCurrentSnapshot()
    if (typeof modelID === 'string' && modelID) await chooseModel(modelID)
    else { selectedModelID.value = ''; versions.value = []; selectedRevision.value = null }
  },
  { immediate: true }
)
onMounted(async () => {
  try { models.value = await loadPublishedThingModels() }
  catch (error) { message.error(error instanceof Error ? error.message : '读取物模型列表失败') }
})
</script>

<template>
  <div class="attribute-box">
    <div class="binding-row">
      <span>绑定物模型版本</span>
      <n-select
        :value="selectedModelID"
        class="picker"
        :options="models.map(model => ({ label: model.name, value: model.modelID }))"
        clearable
        :disabled="saving"
        filterable
        placeholder="选择已发布的物模型"
        @update:value="chooseModel"
      />
      <n-select
        v-if="selectedModelID"
        v-model:value="selectedRevision"
        class="revision-picker"
        :options="versions.map(version => ({ label: `v${version.publishedRevision}`, value: version.publishedRevision }))"
        :disabled="saving"
        placeholder="选择版本"
      />
      <n-button type="primary" :loading="saving" :disabled="!configInfo || (!!selectedModelID && selectedRevision == null)" @click="saveBinding">
      保存
      </n-button>
    </div>
    <n-alert v-if="configInfo?.device_template_id && !configInfo?.native_thing_model_id" type="warning" class="legacy-note">
      已绑定（当前版本信息暂不可读取）。选择并保存已发布版本后，将更新当前关联。
    </n-alert>
    <n-alert v-if="configInfo?.native_thing_model_id" type="info" class="legacy-note">
      已绑定 {{ preview?.model.name || configInfo.native_thing_model_id }}，版本 v{{ configInfo.native_thing_model_revision }}。
    </n-alert>
    <n-spin :show="loading" class="snapshot-content">
      <div v-if="preview">
      <n-descriptions bordered :column="2" size="small" title="物模型信息">
        <n-descriptions-item label="名称">{{ preview.model.name }}</n-descriptions-item>
        <n-descriptions-item label="版本">v{{ preview.publishedRevision }}</n-descriptions-item>
        <n-descriptions-item label="作者">{{ preview.resources.profile.author || '—' }}</n-descriptions-item>
        <n-descriptions-item label="品牌 / 型号">{{ preview.resources.profile.brand || '—' }} / {{ preview.resources.profile.modelNumber || '—' }}</n-descriptions-item>
        <n-descriptions-item label="物模型版本">{{ preview.resources.profile.version || '—' }}</n-descriptions-item>
        <n-descriptions-item label="标签">{{ preview.resources.profile.tags.join('、') || '—' }}</n-descriptions-item>
      </n-descriptions>
      <n-collapse class="section-card">
        <n-collapse-item title="版本标识" name="snapshot-identifiers">
          <div>物模型 ID：{{ preview.modelID }}</div>
          <div>快照 ID：{{ preview.snapshotID }}</div>
        </n-collapse-item>
      </n-collapse>
      <n-card v-for="kind in fieldKinds" :key="kind" size="small" :title="`${fieldKindLabels[kind]}（${fieldsByKind[kind].length}）`" class="section-card">
        <n-empty v-if="!fieldsByKind[kind].length" description="暂无字段" />
        <n-data-table v-else :columns="[
          { title: '名称', key: 'name', render: (row: any) => fieldName(row) },
          { title: '标识符', key: 'identifier' },
          { title: '权限', key: 'access', render: (row: any) => [row.access.read && '可读', row.access.write && '可写', row.access.observe && '可上报'].filter(Boolean).join('、') || '—' },
          { title: '数据类型', key: 'valueType', render: (row: any) => row.valueType?.kind || (row.parameters ? '参数' : '—') }
        ]" :data="fieldsByKind[kind]" :pagination="false" />
      </n-card>
      <n-card size="small" title="Web 图表预览" class="section-card">
        <ThingsVisWidget v-if="webChartPreview" mode="viewer" :config="webChartPreview" :platform-fields="platformFields" :platform-devices="platformDevices" device-id="__template__" height="700px" />
        <n-empty v-else description="暂无图表配置" />
      </n-card>
      <n-card size="small" title="App 图表预览" class="section-card">
        <ThingsVisWidget v-if="appChartPreview" mode="viewer" :config="appChartPreview" :platform-fields="platformFields" :platform-devices="platformDevices" device-id="__template__" height="700px" />
        <n-empty v-else description="暂无图表配置" />
      </n-card>
      </div>
      <n-empty v-else-if="!configInfo?.native_thing_model_id && !loading" description="未绑定" class="empty-state" />
    </n-spin>
  </div>
</template>

<style scoped lang="scss">
.attribute-box { padding: 20px 10px; }
.binding-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.picker { width: 360px; }
.revision-picker { width: 320px; }
.legacy-note, .section-card { margin-top: 16px; }
.snapshot-content { margin-top: 20px; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; }
.empty-state { padding: 36px; }
</style>
