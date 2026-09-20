<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  NAlert,
  NButton,
  NCard,
  NDataTable,
  NSelect,
  NSpace,
  NSpin,
  useMessage
} from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import { getTemplat, putTemplat } from '@/service/api/system-data'
import { checkThingmodelAvailability, thingModelApi, thingModelItemApi } from '@/service/thingmodel'
import type { ThingModelItem } from '@/service/thingmodel/types'
import {
  extractLegacyThingModelBinding,
  serializeLegacyThingModelBinding
} from '@/views/device/template/thing-model-binding'
import { $t } from '@/locales'

const emit = defineEmits(['update:stepCurrent', 'update:modalVisible'])

const props = defineProps({
  stepCurrent: { type: Number, required: true },
  modalVisible: { type: Boolean, required: true },
  deviceTemplateId: { type: String, required: true }
})

const message = useMessage()
const loading = ref(false)
const saving = ref(false)
const encoreAvailable = ref(false)
const selectedThingModelId = ref<string | null>(null)
const thingModelOptions = ref<SelectOption[]>([])
const bindingItems = ref<ThingModelItem[]>([])
const currentBindingLabel = ref('')

const itemColumns = [
  { title: $t('generate.field-type'), key: 'type', width: 120 },
  { title: $t('generate.fieldName'), key: 'identifier', width: 160 },
  { title: $t('generate.field-label'), key: 'name', ellipsis: { tooltip: true } }
]

const itemTableData = computed(() =>
  bindingItems.value.map(item => ({
    type: item.type,
    identifier: item.identifier,
    name: item.name_i18n?.default || item.identifier
  }))
)

async function loadPublishedThingModels() {
  if (!encoreAvailable.value) {
    thingModelOptions.value = []
    return
  }

  try {
    const res = await thingModelApi.list({ page_size: 200 })
    const items = (res as any).items ?? (res as any).data?.items ?? []
    thingModelOptions.value = items
      .filter((tm: { current_snapshot_id?: string }) => tm.current_snapshot_id)
      .map((tm: { id: string; name: string }) => ({
        label: tm.name,
        value: tm.id
      }))
  } catch {
    thingModelOptions.value = []
  }
}

async function loadCurrentBinding() {
  if (!props.deviceTemplateId) return

  loading.value = true
  bindingItems.value = []
  currentBindingLabel.value = ''
  selectedThingModelId.value = null

  try {
    const { data, error } = await getTemplat(props.deviceTemplateId)
    if (error || !data) return

    const binding = extractLegacyThingModelBinding(data)
    if (!binding?.thingModelId) return

    selectedThingModelId.value = binding.thingModelId

    if (!encoreAvailable.value) {
      currentBindingLabel.value = binding.thingModelId
      return
    }

    const [thingModelRes, itemsRes] = await Promise.all([
      thingModelApi.get(binding.thingModelId),
      thingModelItemApi.list(binding.thingModelId, { page_size: 500 })
    ])
    const thingModel = (thingModelRes as any).data ?? thingModelRes
    const items = (itemsRes as any).items ?? (itemsRes as any).data?.items ?? []
    const snapshotId = binding.thingModelSnapshotId || thingModel?.current_snapshot_id

    currentBindingLabel.value = snapshotId
      ? `${thingModel?.name || binding.thingModelId}（snapshot: ${String(snapshotId).slice(0, 8)}）`
      : `${thingModel?.name || binding.thingModelId}`
    bindingItems.value = items
  } finally {
    loading.value = false
  }
}

async function saveBinding(thingModelId: string | null) {
  if (!props.deviceTemplateId) return false

  saving.value = true
  try {
    const { data, error } = await getTemplat(props.deviceTemplateId)
    if (error || !data) {
      message.error($t('common.saveFailed'))
      return false
    }

    let remark = ''
    if (thingModelId) {
      const thingModelRes = await thingModelApi.get(thingModelId)
      const thingModel = (thingModelRes as any).data ?? thingModelRes
      if (!thingModel?.current_snapshot_id) {
        message.warning($t('device_template.thingModelBindDesc'))
        return false
      }
      remark = serializeLegacyThingModelBinding({
        thingModelId,
        thingModelSnapshotId: thingModel.current_snapshot_id,
        snapshotVersion: null
      })
    }

    const saveRes = await putTemplat({
      ...data,
      remark
    })

    if (saveRes.error) {
      message.error($t('common.saveFailed'))
      return false
    }

    message.success($t('common.saveSuccess'))
    await loadCurrentBinding()
    return true
  } catch {
    message.error($t('common.saveFailed'))
    return false
  } finally {
    saving.value = false
  }
}

async function handleSelectionChange(value: string | null) {
  const previous = selectedThingModelId.value
  selectedThingModelId.value = value
  const ok = await saveBinding(value)
  if (!ok) {
    selectedThingModelId.value = previous
  }
}

const back = () => emit('update:stepCurrent', 4)

const next = async () => {
  emit('update:stepCurrent', 6)
}

const cancellation = () => emit('update:modalVisible', false)

onMounted(async () => {
  encoreAvailable.value = await checkThingmodelAvailability()
  await loadPublishedThingModels()
  await loadCurrentBinding()
})
</script>

<template>
  <div class="step-thing-model-bind">
    <NCard :title="$t('device_template.thingModelBind')">
      <p class="mb-3 text-gray-600">{{ $t('device_template.thingModelBindDesc') }}</p>

      <NAlert v-if="!encoreAvailable" type="warning" class="mb-4">
        Encore 物模型服务不可达，此步骤暂时只能查看已有绑定。
      </NAlert>

      <NSpin :show="loading || saving">
        <NSpace vertical size="large">
          <div>
            <div class="mb-2">{{ $t('deviceTemplate.thingModelRef') }}</div>
            <NSelect
              v-model:value="selectedThingModelId"
              :options="thingModelOptions"
              :disabled="!encoreAvailable"
              clearable
              filterable
              :placeholder="$t('common.selectPlaceholder')"
              @update:value="handleSelectionChange"
            />
          </div>

          <div v-if="currentBindingLabel">
            <div class="mb-2">{{ $t('generate.bound-encore-thing-model') }}：{{ currentBindingLabel }}</div>
            <NDataTable
              v-if="itemTableData.length"
              :columns="itemColumns"
              :data="itemTableData"
              :bordered="false"
              size="small"
            />
          </div>
        </NSpace>
      </NSpin>
    </NCard>

    <div class="actions-bar">
      <NButton type="primary" @click="next">{{ $t('device_template.nextStep') }}</NButton>
      <NButton class="m-r3" ghost type="primary" @click="back">{{ $t('device_template.back') }}</NButton>
      <NButton class="m-r3" @click="cancellation">{{ $t('generate.cancel') }}</NButton>
    </div>
  </div>
</template>

<style scoped lang="scss">
.step-thing-model-bind {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.actions-bar {
  display: flex;
  flex-direction: row-reverse;
  gap: 12px;
  margin-top: 16px;
}
</style>
