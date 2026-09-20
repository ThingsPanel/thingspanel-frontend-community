<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  NTabs,
  NTabPane,
  NTag,
  NSpin,
  NDataTable,
  NSpace,
  NButton,
  NInput,
  NAlert,
  NDescriptions,
  NDescriptionsItem,
  NForm,
  NFormItem
} from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { $t } from '@/locales'
import { deviceApi } from '@/service/thingmodel/device'
import { deviceTemplateApi } from '@/service/thingmodel/device-template'
import { productApi } from '@/service/thingmodel/product'
import { useDeviceLatestValues } from '@/composables/useDeviceLatestValues'
import type { Device, DeviceTemplate, Product, ThingModelItem } from '@/service/thingmodel/types'
import ActuateDialog from '@/components/device/ActuateDialog.vue'

// ─── Route ────────────────────────────────────────────────────────────────────

const route = useRoute()
const deviceId = computed(() => String(route.query.id ?? ''))

// ─── State ───────────────────────────────────────────────────────────────────

const device = ref<Device | null>(null)
const template = ref<DeviceTemplate | null>(null)
const product = ref<Product | null>(null)
const loadingBasic = ref(false)
const activeTab = ref('basic')

// Tab2 — latest values
const { values: latestValues, loading: latestLoading } = useDeviceLatestValues(deviceId)

// Tab3 — command
const cmdIdentifier = ref('')
const cmdParamsStr = ref('{}')
const cmdSending = ref(false)
const cmdError = ref('')

// ActuateDialog (for structured actuate)
const actuateVisible = ref(false)
const actuateItem = ref<ThingModelItem | null>(null)

// ─── Helpers ─────────────────────────────────────────────────────────────────

type OnlineStatus = 'online' | 'offline' | 'unactivated'

function getOnlineStatus(): OnlineStatus {
  if (!device.value) return 'unactivated'
  const activated = (device.value as any).activate_flag
  if (!activated || activated === 'inactive') return 'unactivated'
  const online = (device.value as any).is_online
  return online ? 'online' : 'offline'
}

function statusType(status: OnlineStatus) {
  if (status === 'online') return 'success'
  if (status === 'offline') return 'error'
  return 'default'
}

function statusLabel(status: OnlineStatus) {
  if (status === 'online') return $t('tmDevice.online')
  if (status === 'offline') return $t('tmDevice.offline')
  return $t('tmDevice.unactivated')
}

// ─── Latest values table ──────────────────────────────────────────────────────

interface LatestRow {
  key: string
  value: any
  updatedAt: string
}

const latestRows = computed<LatestRow[]>(() => {
  const raw = latestValues.value
  if (!raw) return []
  return Object.entries(raw).map(([key, val]) => {
    if (typeof val === 'object' && val !== null && 'value' in val) {
      return { key, value: val.value, updatedAt: val.ts ?? val.updated_at ?? '—' }
    }
    return { key, value: val, updatedAt: '—' }
  })
})

const latestColumns: DataTableColumns<LatestRow> = [
  { title: 'Key', key: 'key' },
  { title: $t('tmDevice.currentValue'), key: 'value', render: row => String(row.value ?? '—') },
  { title: $t('tmDevice.lastUpdated'), key: 'updatedAt' }
]

// ─── Command tab ──────────────────────────────────────────────────────────────

async function sendCommand() {
  cmdError.value = ''
  if (!cmdIdentifier.value) {
    cmdError.value = 'identifier is required'
    return
  }
  let params: Record<string, any> = {}
  try {
    params = JSON.parse(cmdParamsStr.value)
  } catch {
    cmdError.value = 'params must be valid JSON'
    return
  }
  cmdSending.value = true
  try {
    await deviceApi.actuate(deviceId.value, { identifier: cmdIdentifier.value, params })
    window.$message?.success($t('tmDevice.actuateSuccess'))
  } catch (e: any) {
    window.$message?.error(e?.message ?? $t('tmDevice.actuateFailed'))
  } finally {
    cmdSending.value = false
  }
}

// ─── Load data ────────────────────────────────────────────────────────────────

async function loadDevice() {
  if (!deviceId.value) return
  loadingBasic.value = true
  try {
    const d = await deviceApi.get(deviceId.value)
    device.value = d

    // load template
    if ((d as any).device_template_id) {
      try {
        template.value = await deviceTemplateApi.get((d as any).device_template_id)
      } catch {
        // ignore
      }
    }

    // load product
    if ((d as any).product_id) {
      try {
        product.value = await productApi.get((d as any).product_id)
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  } finally {
    loadingBasic.value = false
  }
}

onMounted(() => {
  loadDevice()
})

watch(deviceId, () => {
  loadDevice()
})
</script>

<template>
  <div class="p-4">
    <NSpin :show="loadingBasic">
      <NTabs v-model:value="activeTab" type="line" animated>
        <!-- Tab 1: Basic Info -->
        <NTabPane name="basic" :tab="$t('tmDevice.tabBasic')">
          <div class="p-4">
            <NDescriptions label-placement="left" :column="1" bordered>
              <NDescriptionsItem :label="$t('tmDevice.sn')">
                {{ (device as any)?.sn ?? '—' }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('tmDevice.template')">
                {{ template?.name ?? (device as any)?.device_template_id ?? '—' }}
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('tmDevice.product')">
                {{ product?.name ?? (device as any)?.product_id ?? '—' }}
              </NDescriptionsItem>
              <NDescriptionsItem label="Status">
                <NTag :type="statusType(getOnlineStatus())" size="small">
                  {{ statusLabel(getOnlineStatus()) }}
                </NTag>
              </NDescriptionsItem>
              <NDescriptionsItem :label="$t('tmDevice.activatedAt')">
                {{ (device as any)?.activated_at ?? '—' }}
              </NDescriptionsItem>
            </NDescriptions>
          </div>
        </NTabPane>

        <!-- Tab 2: Properties & Events -->
        <NTabPane name="properties" :tab="$t('tmDevice.tabProperties')">
          <div class="p-4">
            <NSpin :show="latestLoading">
              <NDataTable
                :columns="latestColumns"
                :data="latestRows"
                size="small"
                :bordered="true"
              />
            </NSpin>
          </div>
        </NTabPane>

        <!-- Tab 3: Commands -->
        <NTabPane name="commands" :tab="$t('tmDevice.tabCommands')">
          <div class="p-4" style="max-width: 560px">
            <NForm label-placement="left" label-width="110px">
              <NFormItem label="Identifier">
                <NInput v-model:value="cmdIdentifier" placeholder="e.g. set_mode" />
              </NFormItem>
              <NFormItem label="Params (JSON)">
                <NInput
                  v-model:value="cmdParamsStr"
                  type="textarea"
                  :rows="4"
                  placeholder='{"value": 1}'
                />
              </NFormItem>
              <NFormItem>
                <NSpace>
                  <NButton type="primary" :loading="cmdSending" @click="sendCommand">
                    {{ $t('tmDevice.actuate') }}
                  </NButton>
                </NSpace>
              </NFormItem>
            </NForm>
            <NAlert v-if="cmdError" type="error" :title="cmdError" />
          </div>
        </NTabPane>

        <!-- Tab 4: Logs -->
        <NTabPane name="logs" :tab="$t('tmDevice.tabLogs')">
          <div class="p-4">
            <NAlert type="info" title="actuate 历史待接入" />
          </div>
        </NTabPane>
      </NTabs>
    </NSpin>

    <!-- ActuateDialog for structured commands -->
    <ActuateDialog
      v-if="actuateItem"
      v-model:visible="actuateVisible"
      :device-id="deviceId"
      :item="actuateItem"
      @success="() => {}"
    />
  </div>
</template>
