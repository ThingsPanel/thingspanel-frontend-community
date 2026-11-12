<script setup lang="ts">
import { computed, onBeforeUnmount, toRefs, watch } from 'vue'
import {
  NAlert,
  NButton,
  NCode,
  NCollapse,
  NCollapseItem,
  NDataTable,
  NEmpty,
  NPagination,
  NSelect,
  NSpin
} from 'naive-ui'
import ModelModal from './ModelModal.vue'
import { createVersionHistory } from '../native-version-history'
import { $t } from '@/locales'
import { thingModelNative, type ModelField } from '@/service/api/thingmodel-native'

const props = defineProps<{ visible: boolean; templateId: string }>()
const emit = defineEmits<{ (event: 'update:visible', value: boolean): void }>()
const modalVisible = computed({ get: () => props.visible, set: (value: boolean) => emit('update:visible', value) })
const history = createVersionHistory(thingModelNative)
onBeforeUnmount(history.close)
const { loading, failure, versions, selectedVersion, snapshot, page, pageSize, total } = toRefs(history.state)
const selectVersion = history.selectVersion
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

watch(
  () => [props.visible, props.templateId] as const,
  ([visible, modelID]) => {
    if (visible && modelID) void history.open(modelID)
    else history.close()
  },
  { immediate: true }
)
const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : '--')
</script>

<template>
  <ModelModal v-model:show="modalVisible" :title="$t('market.versionHistory')" :width="960" class="model-history-modal">
    <NSpin :show="loading">
      <p class="mb-4 text-gray-500">仅发布时生成版本；编辑草稿不会创建版本。</p>
      <NAlert v-if="failure" type="error" :title="$t('common.loadFailed')" class="mb-4">
        <NButton size="small" @click="history.retry">
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
      <NPagination
        v-if="total > pageSize"
        :page="page"
        :page-size="pageSize"
        :item-count="total"
        :disabled="loading"
        class="mt-4"
        @update:page="history.loadPage"
      />
    </NSpin>
    <template #footer><NButton @click="modalVisible = false">关闭</NButton></template>
  </ModelModal>
</template>
