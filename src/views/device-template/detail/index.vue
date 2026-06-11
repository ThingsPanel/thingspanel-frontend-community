<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NButton,
  NCard,
  NTabs,
  NTabPane,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSwitch,
  NAlert,
  NSpace,
  NSpin,
  NTag,
  NDivider,
  NGrid,
  NGi
} from 'naive-ui'
import { deviceTemplateApi } from '@/service/thingmodel/device-template'
import { thingModelApi } from '@/service/thingmodel/thing-model'
import type { DeviceTemplate, ThingModel, Device } from '@/service/thingmodel/types'
import { $t } from '@/locales'
import StateMachineButtons from '@/components/device-template/StateMachineButtons.vue'
import TagsEditor from '@/components/device-template/TagsEditor.vue'

const route = useRoute()
const router = useRouter()

const id = computed(() => route.query.id as string | undefined)
const isNew = computed(() => !id.value)

// Loading states
const loading = ref(false)
const saving = ref(false)
const thingModelsLoading = ref(false)
const versionsLoading = ref(false)

// Data
const template = reactive<Partial<DeviceTemplate>>({
  name: '',
  brand: '',
  product_name: '',
  model_number: '',
  image_url: '',
  thing_model_id: '',
  thing_model_snapshot_id: '',
  protocol_type: undefined,
  protocol_config: undefined,
  voucher_type: undefined,
  connection_type: undefined,
  auto_register: false,
  online_config: undefined,
  tags: [],
  extras: undefined,
  description_i18n: { default: '' },
  status: 'DRAFT'
})

// ThingModel picker
const publishedThingModels = ref<ThingModel[]>([])
const thingModelVersions = ref<any[]>([])
const selectedThingModelId = ref<string>('')
const selectedVersion = ref<number | null>(null)
const showVersionWarning = ref(false)

const selectedThingModelIsDraft = computed(() => {
  if (!selectedThingModelId.value) return false
  const m = publishedThingModels.value.find(x => x.id === selectedThingModelId.value)
  return m?.status === 'DRAFT'
})

// Devices list (read-only)
const devices = ref<Device[]>([])
const devicesTotal = ref(0)
const devicesLoading = ref(false)

// JSON text helpers
const protocolConfigText = ref('')
const onlineConfigText = ref('')
const extrasText = ref('')

function jsonTextFromObj(obj?: Record<string, any> | null): string {
  if (!obj) return ''
  try {
    return JSON.stringify(obj, null, 2)
  } catch {
    return ''
  }
}

function objFromJsonText(text: string): Record<string, any> | undefined {
  if (!text.trim()) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

function syncJsonFields() {
  protocolConfigText.value = jsonTextFromObj(template.protocol_config)
  onlineConfigText.value = jsonTextFromObj(template.online_config)
  extrasText.value = jsonTextFromObj(template.extras)
}

// ThingModel selector options — show all (PUBLISHED first, DRAFT labeled)
const thingModelOptions = computed(() =>
  publishedThingModels.value.map(m => ({
    label: m.status === 'PUBLISHED' ? m.name : `${m.name} [${$t('thingModel.status.DRAFT')}]`,
    value: m.id!,
    disabled: false
  }))
)

const versionOptions = computed(() =>
  thingModelVersions.value.map((v: any) => ({
    label: `v${v.version}${v.changelog ? ' - ' + v.changelog : ''}`,
    value: v.version
  }))
)

const protocolOptions = [
  { label: 'MQTT', value: 'MQTT' },
  { label: 'HTTP', value: 'HTTP' },
  { label: 'CoAP', value: 'COAP' },
  { label: 'Modbus', value: 'MODBUS' }
]

const connectionTypeOptions = [
  { label: $t('deviceTemplate.connectionDirect'), value: 'DIRECT' },
  { label: $t('deviceTemplate.connectionGateway'), value: 'GATEWAY' }
]

async function fetchThingModels() {
  thingModelsLoading.value = true
  try {
    const res = await thingModelApi.list({ page: 1, page_size: 500 })
    if (res.data) {
      const all = res.data.items || []
      // Published first, then drafts
      publishedThingModels.value = [
        ...all.filter((m: ThingModel) => m.status === 'PUBLISHED'),
        ...all.filter((m: ThingModel) => m.status === 'DRAFT')
      ]
    }
  } catch {
    // ignore
  } finally {
    thingModelsLoading.value = false
  }
}

async function fetchVersions(tmId: string) {
  if (!tmId) {
    thingModelVersions.value = []
    return
  }
  versionsLoading.value = true
  try {
    const res = await thingModelApi.versions(tmId)
    thingModelVersions.value = (res as any).data?.items || (res as any).items || (res as any).data || res || []
  } catch {
    thingModelVersions.value = []
  } finally {
    versionsLoading.value = false
  }
}

async function fetchTemplate() {
  if (!id.value) return
  loading.value = true
  try {
    const res = await deviceTemplateApi.get(id.value)
    if (res.data) {
      const data = res.data
      Object.assign(template, data)
      selectedThingModelId.value = data.thing_model_id || ''
      // Find version number from snapshot
      if (selectedThingModelId.value) {
        await fetchVersions(selectedThingModelId.value)
      }
      syncJsonFields()
    }
  } catch {
    window.$message?.error($t('common.loadFailure'))
  } finally {
    loading.value = false
  }
}

async function fetchDevices() {
  if (!id.value) return
  devicesLoading.value = true
  try {
    // Devices list not directly available per template via this API;
    // show placeholder count from template extras if available
    devices.value = []
    devicesTotal.value = 0
  } catch {
    devices.value = []
  } finally {
    devicesLoading.value = false
  }
}

// Watch thing model selection
watch(selectedThingModelId, async (newId, oldId) => {
  if (!newId) {
    thingModelVersions.value = []
    selectedVersion.value = null
    template.thing_model_id = ''
    template.thing_model_snapshot_id = ''
    return
  }
  template.thing_model_id = newId
  if (newId !== oldId) {
    await fetchVersions(newId)
    // Auto-select latest version
    if (thingModelVersions.value.length > 0) {
      const latest = thingModelVersions.value[0]
      selectedVersion.value = latest.version
      template.thing_model_snapshot_id = latest.snapshot_id || latest.id || String(latest.version)
    }
  }
})

watch(selectedVersion, (v) => {
  if (v === null) return
  const ver = thingModelVersions.value.find((x: any) => x.version === v)
  if (ver) {
    if (template.status === 'PUBLISHED') {
      showVersionWarning.value = true
    }
    template.thing_model_snapshot_id = ver.snapshot_id || ver.id || String(ver.version)
  }
})

function buildSavePayload(): DeviceTemplate {
  return {
    ...template,
    protocol_config: objFromJsonText(protocolConfigText.value),
    online_config: objFromJsonText(onlineConfigText.value),
    extras: objFromJsonText(extrasText.value)
  } as DeviceTemplate
}

async function handleSave() {
  if (!template.name?.trim()) {
    window.$message?.error($t('deviceTemplate.nameRequired'))
    return
  }
  saving.value = true
  try {
    const payload = buildSavePayload()
    if (isNew.value) {
      const res = await deviceTemplateApi.create(payload)
      window.$message?.success($t('common.addSuccess'))
      if (res.data?.id) {
        router.replace({ path: '/device-template/detail', query: { id: res.data.id } })
      }
    } else {
      await deviceTemplateApi.update(id.value!, payload)
      window.$message?.success($t('common.editSuccess'))
    }
  } catch (e: any) {
    window.$message?.error(e?.message || $t('common.error'))
  } finally {
    saving.value = false
  }
}

async function handlePublish() {
  if (!id.value) return
  try {
    await deviceTemplateApi.publish(id.value)
    window.$message?.success($t('common.publishSuccess'))
    await fetchTemplate()
  } catch (e: any) {
    window.$message?.error(e?.message || $t('common.error'))
  }
}

async function handleArchive() {
  if (!id.value) return
  try {
    await deviceTemplateApi.archive(id.value)
    window.$message?.success($t('deviceTemplate.archiveSuccess'))
    await fetchTemplate()
  } catch (e: any) {
    window.$message?.error(e?.message || $t('common.error'))
  }
}

async function handleDeriveDraft() {
  if (!id.value) return
  try {
    const res = await deviceTemplateApi.deriveDraft(id.value)
    window.$message?.success($t('deviceTemplate.deriveDraftSuccess'))
    if (res.data?.id) {
      router.push({ path: '/device-template/detail', query: { id: res.data.id } })
    }
  } catch (e: any) {
    window.$message?.error(e?.message || $t('common.error'))
  }
}

async function handleDelete() {
  if (!id.value) return
  try {
    await deviceTemplateApi.delete(id.value)
    window.$message?.success($t('deviceTemplate.deleteSuccess'))
    router.push('/device-template')
  } catch (e: any) {
    window.$message?.error(e?.message || $t('common.error'))
  }
}

const statusType = computed(() => {
  switch (template.status) {
    case 'PUBLISHED':
      return 'success'
    case 'ARCHIVED':
      return 'warning'
    default:
      return 'default'
  }
})

watch(id, (newId, oldId) => {
  if (newId && newId !== oldId) {
    fetchTemplate()
  }
})

onMounted(async () => {
  await fetchThingModels()
  if (!isNew.value) {
    await fetchTemplate()
    fetchDevices()
  }
})
</script>

<template>
  <div class="p-4">
    <NSpin :show="loading">
      <!-- Header status bar -->
      <div class="mb-4 flex items-center gap-4">
        <NButton text @click="router.push('/device-template')">
          ← {{ $t('deviceTemplate.list') }}
        </NButton>
        <NDivider vertical />
        <span class="text-lg font-medium">
          {{ isNew ? $t('deviceTemplate.create') : (template.name || $t('deviceTemplate.detail')) }}
        </span>
        <NTag v-if="!isNew" :type="statusType" size="small">
          {{ $t(`deviceTemplate.status.${template.status || 'DRAFT'}`) }}
        </NTag>
        <div class="flex-1" />

        <!-- State machine actions -->
        <StateMachineButtons
          v-if="!isNew"
          :status="(template.status as any) || 'DRAFT'"
          :bound-devices-count="devicesTotal"
          @publish="handlePublish"
          @derive-draft="handleDeriveDraft"
          @archive="handleArchive"
          @delete="handleDelete"
        />

        <!-- Save button -->
        <NButton
          v-if="template.status !== 'ARCHIVED'"
          type="primary"
          :loading="saving"
          @click="handleSave"
        >
          {{ $t('common.save') }}
        </NButton>
      </div>

      <!-- Tabs -->
      <NCard>
        <NTabs type="line" animated>
          <!-- Tab 1: Identity & Thing Model -->
          <NTabPane name="identity" :tab="$t('deviceTemplate.tabIdentity')">
            <NForm label-placement="left" label-width="120px" class="mt-4">
              <NGrid :cols="2" :x-gap="24">
                <NGi>
                  <NFormItem :label="$t('deviceTemplate.name')" required>
                    <NInput
                      v-model:value="template.name"
                      :placeholder="$t('deviceTemplate.namePlaceholder')"
                      :disabled="template.status === 'ARCHIVED'"
                    />
                  </NFormItem>
                </NGi>
                <NGi>
                  <NFormItem :label="$t('deviceTemplate.brand')">
                    <NInput
                      v-model:value="template.brand"
                      :placeholder="$t('deviceTemplate.brandPlaceholder')"
                      :disabled="template.status === 'ARCHIVED'"
                    />
                  </NFormItem>
                </NGi>
                <NGi>
                  <NFormItem :label="$t('deviceTemplate.productName')">
                    <NInput
                      v-model:value="template.product_name"
                      :placeholder="$t('deviceTemplate.productNamePlaceholder')"
                      :disabled="template.status === 'ARCHIVED'"
                    />
                  </NFormItem>
                </NGi>
                <NGi>
                  <NFormItem :label="$t('deviceTemplate.modelNumber')">
                    <NInput
                      v-model:value="template.model_number"
                      :placeholder="$t('deviceTemplate.modelNumberPlaceholder')"
                      :disabled="template.status === 'ARCHIVED'"
                    />
                  </NFormItem>
                </NGi>
                <NGi :span="2">
                  <NFormItem :label="$t('deviceTemplate.imageUrl')">
                    <NInput
                      v-model:value="template.image_url"
                      :placeholder="$t('deviceTemplate.imageUrlPlaceholder')"
                      :disabled="template.status === 'ARCHIVED'"
                    />
                  </NFormItem>
                </NGi>
                <NGi :span="2">
                  <NFormItem :label="$t('deviceTemplate.description')">
                    <NInput
                      :value="template.description_i18n?.default"
                      type="textarea"
                      :rows="3"
                      :placeholder="$t('deviceTemplate.descriptionPlaceholder')"
                      :disabled="template.status === 'ARCHIVED'"
                      @update:value="v => template.description_i18n = { default: v }"
                    />
                  </NFormItem>
                </NGi>
              </NGrid>

              <NDivider>{{ $t('deviceTemplate.thingModelBinding') }}</NDivider>

              <NAlert v-if="showVersionWarning" type="warning" class="mb-4" closable @close="showVersionWarning = false">
                {{ $t('deviceTemplate.versionChangeWarning') }}
              </NAlert>
              <NAlert v-if="selectedThingModelIsDraft" type="info" class="mb-4">
                {{ $t('deviceTemplate.thingModelDraftHint') }}
              </NAlert>

              <NGrid :cols="2" :x-gap="24">
                <NGi>
                  <NFormItem :label="$t('deviceTemplate.thingModelRef')">
                    <NSelect
                      v-model:value="selectedThingModelId"
                      :options="thingModelOptions"
                      :loading="thingModelsLoading"
                      :placeholder="$t('common.selectPlaceholder')"
                      :disabled="template.status === 'ARCHIVED'"
                      filterable
                      clearable
                    />
                  </NFormItem>
                </NGi>
                <NGi>
                  <NFormItem :label="$t('deviceTemplate.snapshotVersion')">
                    <NSelect
                      v-model:value="selectedVersion"
                      :options="versionOptions"
                      :loading="versionsLoading"
                      :disabled="!selectedThingModelId || template.status === 'ARCHIVED'"
                      :placeholder="$t('common.selectPlaceholder')"
                    />
                  </NFormItem>
                </NGi>
              </NGrid>
            </NForm>
          </NTabPane>

          <!-- Tab 2: Protocol -->
          <NTabPane name="protocol" :tab="$t('deviceTemplate.tabProtocol')">
            <NForm label-placement="left" label-width="120px" class="mt-4">
              <NGrid :cols="2" :x-gap="24">
                <NGi>
                  <NFormItem :label="$t('deviceTemplate.protocol')">
                    <NSelect
                      v-model:value="template.protocol_type"
                      :options="protocolOptions"
                      :placeholder="$t('common.selectPlaceholder')"
                      :disabled="template.status === 'ARCHIVED'"
                      clearable
                    />
                  </NFormItem>
                </NGi>
                <NGi>
                  <NFormItem :label="$t('deviceTemplate.voucherType')">
                    <NInput
                      v-model:value="template.voucher_type"
                      :placeholder="$t('common.input') + $t('deviceTemplate.voucherType')"
                      :disabled="template.status === 'ARCHIVED'"
                    />
                  </NFormItem>
                </NGi>
                <NGi>
                  <NFormItem :label="$t('deviceTemplate.connectionType')">
                    <NSelect
                      v-model:value="template.connection_type"
                      :options="connectionTypeOptions"
                      :placeholder="$t('common.selectPlaceholder')"
                      :disabled="template.status === 'ARCHIVED'"
                      clearable
                    />
                  </NFormItem>
                </NGi>
                <NGi :span="2">
                  <NFormItem :label="$t('deviceTemplate.protocolConfig')">
                    <NInput
                      v-model:value="protocolConfigText"
                      type="textarea"
                      :rows="8"
                      :placeholder="$t('common.enterJson')"
                      :disabled="template.status === 'ARCHIVED'"
                      font-family="monospace"
                    />
                  </NFormItem>
                </NGi>
              </NGrid>
            </NForm>
          </NTabPane>

          <!-- Tab 3: Tags & Extras -->
          <NTabPane name="tags" :tab="$t('deviceTemplate.tabTags')">
            <NForm label-placement="left" label-width="120px" class="mt-4">
              <NFormItem :label="$t('deviceTemplate.tags')">
                <TagsEditor
                  :model-value="template.tags || []"
                  @update:model-value="v => template.tags = v"
                />
              </NFormItem>
              <NFormItem :label="$t('deviceTemplate.extras')">
                <NInput
                  v-model:value="extrasText"
                  type="textarea"
                  :rows="8"
                  :placeholder="$t('common.enterJson')"
                  :disabled="template.status === 'ARCHIVED'"
                />
              </NFormItem>
            </NForm>
          </NTabPane>

          <!-- Tab 4: Settings -->
          <NTabPane name="settings" :tab="$t('deviceTemplate.tabSettings')">
            <NForm label-placement="left" label-width="140px" class="mt-4">
              <NFormItem :label="$t('deviceTemplate.autoRegister')">
                <NSwitch
                  :value="template.auto_register"
                  :disabled="template.status === 'ARCHIVED'"
                  @update:value="v => template.auto_register = v"
                />
              </NFormItem>
              <NFormItem :label="$t('deviceTemplate.onlineConfig')">
                <NInput
                  v-model:value="onlineConfigText"
                  type="textarea"
                  :rows="8"
                  :placeholder="$t('common.enterJson')"
                  :disabled="template.status === 'ARCHIVED'"
                />
              </NFormItem>
            </NForm>
          </NTabPane>

          <!-- Tab 5: Devices (read-only) -->
          <NTabPane v-if="!isNew" name="devices" :tab="$t('deviceTemplate.tabDevices')">
            <NSpin :show="devicesLoading">
              <div class="mt-4">
                <div class="mb-2 text-gray-500 text-sm">
                  {{ $t('deviceTemplate.devicesTotal', { count: devicesTotal }) }}
                </div>
                <div v-if="devices.length === 0 && !devicesLoading" class="text-gray-400 py-8 text-center">
                  {{ $t('deviceTemplate.noDevices') }}
                </div>
                <div v-else class="flex flex-wrap gap-2">
                  <NTag v-for="device in devices" :key="device.id" size="small">
                    {{ device.sn || device.id }}
                  </NTag>
                  <span v-if="devicesTotal > devices.length" class="text-gray-400 text-sm">
                    {{ $t('deviceTemplate.devicesMore', { count: devicesTotal - devices.length }) }}
                  </span>
                </div>
              </div>
            </NSpin>
          </NTabPane>
        </NTabs>
      </NCard>
    </NSpin>
  </div>
</template>
