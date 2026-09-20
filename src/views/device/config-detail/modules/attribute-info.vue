<script setup lang="tsx">
import { computed, onMounted, ref, watch } from 'vue'
import { NDataTable, NFlex, NSpin, useMessage } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { deviceConfigEdit, deviceConfigInfo, deviceConfigMenu, deviceTemplateDetail } from '@/service/api/device'
import { deviceTemplate } from '@/service/api/device-template-model'
import { checkThingmodelAvailability, thingModelApi, thingModelItemApi } from '@/service/thingmodel'
import type { ThingModelItem } from '@/service/thingmodel/types'
import { extractLegacyThingModelBinding } from '@/views/device/template/thing-model-binding'
import { useRouterPush } from '@/hooks/common/router'
import { $t } from '@/locales'

const emit = defineEmits<{ upDateConfig: [] }>()
const { routerPushByKey } = useRouterPush()
const message = useMessage()

interface Props {
  configInfo?: object | any
}

const props = withDefaults(defineProps<Props>(), {
  configInfo: null
})

type TemplateSource = 'legacy' | 'encore'

interface TemplateOption {
  id: string
  name: string
  source: TemplateSource
}

const UNBIND_VALUE = ''

const selectValue = ref<string>(UNBIND_VALUE)
const selectOptions = ref<SelectOption[]>([])
const encoreAvailable = ref(false)
const optionsLoading = ref(false)
const bindingLoading = ref(false)
const thingModelToLegacyMap = ref<Map<string, { id: string; name: string }>>(new Map())

const bindingStatus = ref<{
  bound: boolean
  thingModelName?: string
  snapshotId?: string
  items: ThingModelItem[]
} | null>(null)

const itemColumns = [
  { title: $t('generate.field-type'), key: 'type', width: 120 },
  { title: $t('generate.fieldName'), key: 'identifier', width: 160 },
  { title: $t('generate.field-label'), key: 'name', ellipsis: { tooltip: true } }
]

const selectThemeOverrides = {
  peers: {
    InternalSelectMenu: {
      height: '600px'
    }
  }
}

const itemTableData = computed(() => {
  if (!bindingStatus.value?.items.length) return []
  return bindingStatus.value.items.map(item => ({
    type: item.type,
    identifier: item.identifier,
    name: item.name_i18n?.default || item.identifier
  }))
})

function encodeOptionValue(source: TemplateSource, id: string) {
  return `${source}:${id}`
}

function decodeOptionValue(value: string | null | undefined) {
  if (!value) return null
  const separatorIndex = value.indexOf(':')
  if (separatorIndex <= 0) return null
  const source = value.slice(0, separatorIndex) as TemplateSource
  const id = value.slice(separatorIndex + 1)
  if ((source === 'legacy' || source === 'encore') && id) {
    return { source, id }
  }
  return null
}

function buildGroupedOptions(legacyList: TemplateOption[], encoreList: TemplateOption[]): SelectOption[] {
  const groups: SelectOption[] = [
    {
      type: 'group',
      label: $t('generate.legacy-templates'),
      key: 'legacy',
      children: legacyList.map(item => ({
        label: item.name,
        value: encodeOptionValue('legacy', item.id)
      }))
    }
  ]

  if (encoreAvailable.value && encoreList.length) {
    groups.push({
      type: 'group',
      label: $t('generate.encore-thing-models'),
      key: 'encore',
      children: encoreList.map(item => ({
        label: item.name,
        value: encodeOptionValue('encore', item.id)
      }))
    })
  }

  return [
    { label: $t('generate.unbind'), value: UNBIND_VALUE },
    ...groups
  ]
}

async function refreshThingModelToLegacyMap() {
  try {
    const res = await deviceTemplate({ page: 1, page_size: 200 })
    const list = Array.isArray(res.data?.list) ? res.data.list : []
    const map = new Map<string, { id: string; name: string }>()
    list.forEach((tpl: { id: string; name: string; remark?: string | null }) => {
      const binding = extractLegacyThingModelBinding(tpl)
      if (binding?.thingModelId) {
        map.set(binding.thingModelId, { id: tpl.id, name: tpl.name })
      }
    })
    thingModelToLegacyMap.value = map
  } catch {
    thingModelToLegacyMap.value = new Map()
  }
}

async function loadEncoreThingModels(search = '') {
  if (!encoreAvailable.value) return [] as TemplateOption[]

  try {
    const res = await thingModelApi.list({ page_size: 200, search: search || undefined })
    const items = (res as any).items ?? (res as any).data?.items ?? []
    return items
      .filter((tm: { current_snapshot_id?: string }) => tm.current_snapshot_id)
      .map((tm: { id: string; name: string }) => ({
        id: tm.id,
        name: tm.name,
        source: 'encore' as const
      }))
  } catch {
    return [] as TemplateOption[]
  }
}

async function loadLegacyTemplates(name = '') {
  const res = await deviceConfigMenu({ name })
  const list = Array.isArray(res.data) ? res.data : []
  return list.map((item: { id: string; name: string }) => ({
    id: item.id,
    name: item.name,
    source: 'legacy' as const
  }))
}

async function getTableData(name = '') {
  optionsLoading.value = true
  try {
    const [legacyList, encoreList] = await Promise.all([loadLegacyTemplates(name), loadEncoreThingModels(name)])
    selectOptions.value = buildGroupedOptions(legacyList, encoreList)
  } finally {
    optionsLoading.value = false
  }
}

async function loadBindingStatus(templateId: string) {
  bindingLoading.value = true
  bindingStatus.value = null

  try {
    const res = await deviceTemplateDetail({ id: templateId })
    const template = res.data
    const binding = extractLegacyThingModelBinding(template)

    if (!binding?.thingModelId) {
      bindingStatus.value = { bound: false, items: [] }
      return
    }

    if (!encoreAvailable.value) {
      bindingStatus.value = {
        bound: true,
        thingModelName: binding.thingModelId,
        snapshotId: binding.thingModelSnapshotId,
        items: []
      }
      return
    }

    const [thingModelRes, itemsRes] = await Promise.all([
      thingModelApi.get(binding.thingModelId),
      thingModelItemApi.list(binding.thingModelId, { page_size: 500 })
    ])
    const thingModel = (thingModelRes as any).data ?? thingModelRes
    const items = (itemsRes as any).items ?? (itemsRes as any).data?.items ?? []

    bindingStatus.value = {
      bound: true,
      thingModelName: thingModel?.name || binding.thingModelId,
      snapshotId: binding.thingModelSnapshotId || thingModel?.current_snapshot_id,
      items
    }
  } catch {
    bindingStatus.value = { bound: false, items: [] }
  } finally {
    bindingLoading.value = false
  }
}

async function bindLegacyTemplate(templateId: string) {
  const res = await deviceConfigEdit({ device_template_id: templateId, id: props.configInfo.id })
  if (!res.error) {
    emit('upDateConfig')
    await loadBindingStatus(templateId)
  }
}

async function choseTemp(value: string) {
  const decoded = decodeOptionValue(value)
  const previousValue = selectValue.value

  if (!decoded) {
    const res = await deviceConfigEdit({ device_template_id: '', id: props.configInfo.id })
    if (!res.error) {
      emit('upDateConfig')
      bindingStatus.value = null
    } else {
      selectValue.value = previousValue
    }
    return
  }

  if (decoded.source === 'legacy') {
    await bindLegacyTemplate(decoded.id)
    return
  }

  const legacyTemplate = thingModelToLegacyMap.value.get(decoded.id)
  if (!legacyTemplate) {
    message.warning($t('generate.encore-no-legacy-template'))
    selectValue.value = previousValue
    return
  }

  await bindLegacyTemplate(legacyTemplate.id)
  selectValue.value = encodeOptionValue('legacy', legacyTemplate.id)
}

function searchPlug(value: string) {
  getTableData(value)
}

function toTemplate() {
  routerPushByKey('device_template')
}

function toBindTemplate(templateId: string) {
  routerPushByKey('device_template', { query: { id: templateId } })
}

watch(selectValue, value => {
  const decoded = decodeOptionValue(value)
  if (decoded?.source === 'legacy' && decoded.id) {
    loadBindingStatus(decoded.id)
    return
  }
  bindingStatus.value = null
})

onMounted(async () => {
  encoreAvailable.value = await checkThingmodelAvailability()
  await refreshThingModelToLegacyMap()
  await getTableData('')

  const res = await deviceConfigInfo({ id: props.configInfo.id })
  const templateId = res.data?.device_template_id
  selectValue.value = templateId ? encodeOptionValue('legacy', templateId) : UNBIND_VALUE
})
</script>

<template>
  <div class="attribute-box">
    <NFlex align="center">
      <div>{{ $t('generate.bind-device-function-template') }}</div>
      <NSelect
        v-model:value="selectValue"
        class="w-300px"
        :options="selectOptions"
        :loading="optionsLoading"
        :theme-overrides="selectThemeOverrides"
        filterable
        @update:value="choseTemp"
        @search="searchPlug"
      />
      <div class="to-create" @click="toTemplate">{{ $t('generate.not-found-create') }}</div>
    </NFlex>

    <div v-if="decodeOptionValue(selectValue)?.source === 'legacy' && decodeOptionValue(selectValue)?.id" class="binding-status m-tb-10">
      <NSpin :show="bindingLoading">
        <template v-if="bindingStatus">
          <div v-if="bindingStatus.bound" class="m-b-10">
            <div class="binding-title">
              {{ $t('generate.bound-encore-thing-model') }}：
              <strong>{{ bindingStatus.thingModelName }}</strong>
              <span v-if="bindingStatus.snapshotId" class="snapshot-id">
                （snapshot: {{ bindingStatus.snapshotId.slice(0, 8) }}）
              </span>
            </div>
            <NDataTable
              v-if="bindingStatus.items.length"
              class="m-tb-10"
              size="small"
              :columns="itemColumns"
              :data="itemTableData"
              :max-height="320"
            />
          </div>
          <div v-else class="unbound-status">
            <span>{{ $t('generate.template-not-bound-encore') }}</span>
            <span
              class="to-create ml-2"
              @click="toBindTemplate(decodeOptionValue(selectValue)!.id)"
            >
              {{ $t('generate.go-bind-thing-model') }}
            </span>
          </div>
        </template>
      </NSpin>
    </div>
  </div>
</template>

<style scoped lang="scss">
.attribute-box {
  padding: 50px 10px;

  .to-create {
    color: #999999;
  }

  .to-create:hover {
    cursor: pointer;
    text-decoration: underline;
    color: #646cff;
  }

  .binding-title {
    font-size: 14px;
    color: #333;
  }

  .snapshot-id {
    color: #666;
    font-size: 13px;
  }

  .unbound-status {
    font-size: 14px;
    color: #666;
  }

  .m-b-10 {
    margin-bottom: 10px;
  }
}

.pagination-box {
  display: flex;
  justify-content: flex-end;
}

.m-tb-10 {
  margin: 10px 0;
}

.w-300px {
  width: 300px;
  margin: 0 15px;
}

.ml-2 {
  margin-left: 8px;
}

.w-500 {
  width: 500px;
}
</style>
