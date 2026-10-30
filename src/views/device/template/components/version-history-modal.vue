<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NAlert, NButton, NCode, NCollapse, NCollapseItem, NDataTable, NEmpty, NSelect, NSpin } from 'naive-ui'
import ModelModal from './ModelModal.vue'
import { $t } from '@/locales'
import {
  thingModelNative,
  type ModelField,
  type SnapshotDetail,
  type VersionSummary
} from '@/service/api/thingmodel-native'

const props = defineProps<{ visible: boolean; templateId: string }>()
const emit = defineEmits<{ (event: 'update:visible', value: boolean): void }>()
const modalVisible = computed({ get: () => props.visible, set: (value: boolean) => emit('update:visible', value) })
const loading = ref(false)
const failed = ref(false)
const versions = ref<VersionSummary[]>([])
const selectedVersion = ref<number | null>(null)
const snapshot = ref<SnapshotDetail | null>(null)
let requestSequence = 0
const options = computed(() =>
  versions.value.map(item => ({ label: `v${item.publishedRevision}`, value: item.publishedRevision }))
)
const contentJson = computed(() => (snapshot.value ? JSON.stringify(snapshot.value.model, null, 2) : ''))
const kindNames = { TELEMETRY: '遥测', ATTRIBUTE: '属性', EVENT: '事件', COMMAND: '命令' }
const columns = [
  { title: '分类', key: 'kind', width: 80, render: (field: ModelField) => kindNames[field.kind] },
  {
    title: '名称',
    key: 'name',
    width: 150,
    ellipsis: { tooltip: true },
    render: (field: ModelField) => field.nameI18n.default
  },
  { title: '标识符', key: 'identifier', width: 180, ellipsis: { tooltip: true } },
  {
    title: '类型 / 参数',
    key: 'definition',
    minWidth: 280,
    ellipsis: { tooltip: true },
    render: (field: ModelField) =>
      'parameters' in field
        ? field.parameters?.items.map(item => `${item.nameI18n.default} (${item.identifier})`).join('、')
        : field.valueType.kind
  },
  { title: '单位', key: 'unit', width: 80, render: (field: ModelField) => field.unit || '—' }
]

const selectVersion = async (version: number | null) => {
  selectedVersion.value = version
  snapshot.value = null
  if (version === null || !props.templateId) return
  const sequence = ++requestSequence
  loading.value = true
  failed.value = false
  try {
    const result = await thingModelNative.version(props.templateId, version)
    if (sequence === requestSequence && props.visible && version === selectedVersion.value) snapshot.value = result
  } catch (error) {
    console.error('Failed to fetch native thing model version:', error)
    if (sequence === requestSequence && props.visible) failed.value = true
  } finally {
    if (sequence === requestSequence) loading.value = false
  }
}

const loadVersions = async () => {
  const sequence = ++requestSequence
  const modelID = props.templateId
  loading.value = true
  failed.value = false
  versions.value = []
  selectedVersion.value = null
  snapshot.value = null
  try {
    const result = await thingModelNative.versions(modelID, { page: 1, pageSize: 100 })
    if (sequence !== requestSequence || modelID !== props.templateId || !props.visible) return
    versions.value = [...result.items].sort((a, b) => b.publishedRevision - a.publishedRevision)
    if (versions.value.length) await selectVersion(versions.value[0].publishedRevision)
  } catch (error) {
    console.error('Failed to fetch native thing model versions:', error)
    if (sequence === requestSequence && modelID === props.templateId) failed.value = true
  } finally {
    if (sequence === requestSequence) loading.value = false
  }
}

watch(
  () => [props.visible, props.templateId] as const,
  ([visible, modelID]) => {
    if (visible && modelID) void loadVersions()
    else {
      requestSequence += 1
      loading.value = false
    }
  }
)
const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : '--')
</script>

<template>
  <ModelModal v-model:show="modalVisible" :title="$t('market.versionHistory')" :width="960" class="model-history-modal">
    <NSpin :show="loading">
      <p class="mb-4 text-gray-500">仅发布时生成版本；编辑草稿不会创建版本。</p>
      <NAlert v-if="failed" type="error" :title="$t('common.loadFailed')" class="mb-4">
        <NButton size="small" @click="selectedVersion === null ? loadVersions() : selectVersion(selectedVersion)">
          {{ $t('common.refresh') }}
        </NButton>
      </NAlert>
      <NEmpty v-else-if="!loading && versions.length === 0" :description="$t('common.noData')" />
      <div v-else-if="versions.length" class="flex flex-col gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <span class="font-medium">{{ $t('device_template.version') }}</span>
          <NSelect :value="selectedVersion" class="w-180px" :options="options" @update:value="selectVersion" />
          <span class="text-gray-500">
            {{ $t('market.publish.publishedAt') }}: {{ formatDate(snapshot?.createdAt) }}
          </span>
        </div>
        <div v-if="snapshot?.changelog" class="text-gray-500">{{ snapshot.changelog }}</div>
        <NDataTable
          v-if="snapshot"
          :columns="columns"
          :data="snapshot.model.fields"
          :row-key="(field: ModelField) => `${field.kind}:${field.identifier}`"
          :scroll-x="800"
        />
        <NCollapse v-if="contentJson">
          <NCollapseItem title="查看完整定义" name="definition">
            <NCode :code="contentJson" language="json" word-wrap />
          </NCollapseItem>
        </NCollapse>
      </div>
    </NSpin>
    <template #footer><NButton @click="modalVisible = false">关闭</NButton></template>
  </ModelModal>
</template>
