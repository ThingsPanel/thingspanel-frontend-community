<script setup lang="tsx">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import type { NumberAnimationInst } from 'naive-ui'
import dayjs from 'dayjs'
import { useWebSocket } from '@vueuse/core'
import { MovingNumbers } from 'moving-numbers-vue3'
import { deviceRuntimeNative } from '@/service/api/device-runtime-native'
import NativeDeviceSimulator from './native-device-simulator.vue'
import { latestRowsFromReadings } from '@/service/api/device-runtime-rows'
import { localStg } from '@/utils/storage'
import { getWebsocketServerUrl, isJSON } from '@/utils/common/tool'
import { deviceBindingRequiresNativeModel, resolveDeviceNativeModel } from '@/views/device/native-model-consumption'
import { decorateNativeTelemetryRows } from '@/views/device/native-device-model-contract'
import { getReadingDisplayValue } from '@/utils/device-readings'
const props = defineProps<{
  id: string
  deviceData?: Record<string, any>
}>()

let wsUrl = getWebsocketServerUrl()
wsUrl += '/telemetry/datas/current/ws'

const telemetryData = ref<DeviceManagement.telemetryData[]>([])
const nativeTelemetryFields = ref(new Map<string, any>())
const nativeMetadataError = ref('')
const truncated = ref(false)
let nativeMetadataRequestId = 0
const initTelemetryData = ref<any>()
const numberAnimationInstRef = ref<NumberAnimationInst[] | []>([])
const nowTime = ref<any>()
const cardHeight = ref(160) // 卡片的高度
const cardMargin = ref(15) // 卡片的间距
const { close, open } = useWebSocket(wsUrl, {
  immediate: false,
  autoReconnect: true,
  heartbeat: {
    message: 'ping',
    interval: 8000,
    pongTimeout: 3000
  },
  onConnected(ws: WebSocket) {
    // The server binds the device from the first message of each connection.
    ws.send(JSON.stringify({ device_id: props.id, token: localStg.get('token') }))
  },
  // eslint-disable-next-line
  onMessage(ws: WebSocket, event: MessageEvent) {
    if (event.data && event.data !== 'pong') {
      if (!isJSON(event.data)) return
      const info = JSON.parse(event.data)
      const currTelemetryKey = telemetryData.value
        .map(item => {
          return item.key === 'systime' ? false : item.key
        })
        .filter(item => Boolean(item))
      const newData = telemetryData.value.map(item => {
        return {
          ...item,
          value:
            info[item.key] === null || info[item.key] === undefined || info[item.key] === ''
              ? item.value
              : info[item.key],
          ts: info[item.key] && info.systime ? info.systime : item.ts || ''
        }
      })
      const newTelemetry: any[] = []
      for (const key in info) {
        if (key !== 'systime' && !currTelemetryKey.includes(key)) {
          const { key: _originKey, label: _label, ...rest } = initTelemetryData.value || {}
          newTelemetry.push({
            ...rest,
            key,
            value: info[key],
            ts: info.systime,
            unit: ''
          })
        }
      }
      telemetryData.value = decorateTelemetry([...newData, ...newTelemetry])
    }
  }
})

const fetchError = ref('')
// 当前值来自原生 readings（latestOnly）；Community 适配器只提供最新值，没有历史、聚合或总数窗口。
const fetchTelemetry = async () => {
  let page
  try {
    page = await deviceRuntimeNative.listReadings(props.id, {
      kind: 'telemetry',
      latestOnly: true,
      page: 1,
      pageSize: 100
    })
  } catch (error) {
    fetchError.value = error instanceof Error ? error.message : '遥测读取失败'
    return
  }
  fetchError.value = ''
  const rows = latestRowsFromReadings(page, 'telemetry')
  truncated.value = rows.truncated
  telemetryData.value = decorateTelemetry(
    rows.list.map(row => ({ key: row.key, ts: row.ts, value: row.value, unit: '', device_id: props.id })) as any
  )
  initTelemetryData.value = telemetryData.value[0] || {} // 存储一份模板
  initTelemetryData.value.device_id = props.id
}
const setItemRef = el => {
  if (el) {
    const index = el.$attrs['data-index']
    numberAnimationInstRef.value[index] = el
  }
}
const isEnumTelemetry = (item: DeviceManagement.telemetryData) =>
  item.data_type?.toLowerCase() === 'enum' && Array.isArray(item.enum)

const getTelemetryDisplayValue = getReadingDisplayValue

const isTextTelemetry = (item: DeviceManagement.telemetryData) =>
  isEnumTelemetry(item) || typeof item.value !== 'number'

function decorateTelemetry(rows: DeviceManagement.telemetryData[]) {
  if (!deviceBindingRequiresNativeModel(props.deviceData?.device_config)) return rows
  return decorateNativeTelemetryRows(rows, [...nativeTelemetryFields.value.values()])
}

async function loadNativeTelemetryMetadata() {
  const requestId = ++nativeMetadataRequestId
  try {
    const resolved = await resolveDeviceNativeModel(props.deviceData?.device_config)
    if (requestId !== nativeMetadataRequestId) return
    nativeMetadataError.value =
      !resolved && deviceBindingRequiresNativeModel(props.deviceData?.device_config)
        ? '此设备模板尚未绑定固定版本的原生物模型，展示原始遥测标识。'
        : ''
    nativeTelemetryFields.value = new Map(
      (resolved?.platformFields || []).filter(field => field.dataType === 'telemetry').map(field => [field.id, field])
    )
    telemetryData.value = decorateTelemetry(telemetryData.value)
  } catch (error) {
    if (requestId !== nativeMetadataRequestId) return
    nativeTelemetryFields.value = new Map()
    nativeMetadataError.value = error instanceof Error ? error.message : '读取设备绑定的物模型失败'
    telemetryData.value = decorateTelemetry(telemetryData.value)
    console.error('[DeviceTelemetry] 加载绑定物模型字段失败:', error)
  }
}

watch([() => props.id, () => props.deviceData?.device_config], () => void loadNativeTelemetryMetadata(), {
  immediate: true,
  deep: true
})

let disposed = false
onMounted(async () => {
  await fetchTelemetry()
  if (!disposed) open()
})

onUnmounted(() => {
  disposed = true
  close()
})
</script>

<template>
  <n-card class="w-full">
    <n-alert v-if="nativeMetadataError" type="error" :show-icon="false" class="mb-4">
      {{ nativeMetadataError }}
    </n-alert>
    <n-alert v-if="fetchError" type="warning" :show-icon="false" class="mb-4">{{ fetchError }}</n-alert>
    <n-alert v-if="truncated" type="info" :show-icon="false" class="mb-4">仅显示前 100 个遥测值。</n-alert>
    <n-alert type="info" :show-icon="false" class="mb-4">
      目前显示当前值和原始历史（单次最多 24 小时）；删除最新值、历史曲线暂不可用。
    </n-alert>
    <NativeDeviceSimulator :id="props.id" />

    <!-- 第二行 -->
    <n-card class="mb-4">
      <n-grid :x-gap="cardMargin" :y-gap="cardMargin" cols="1 600:2 900:3 1200:4">
        <n-gi v-for="(i, index) in telemetryData" :key="i.tenant_id">
          <n-card header-class="border-b h-36px" hoverable :style="{ height: cardHeight + 'px' }">
            <div class="telemetry-card-body">
              <n-tooltip v-if="isTextTelemetry(i)" trigger="hover" placement="top">
                <template #trigger>
                  <span class="value-display-ellipsis" style="font-size: 24px">
                    {{ getTelemetryDisplayValue(i) }}
                  </span>
                </template>
                <div style="max-width: 300px; word-break: break-all">
                  {{ getTelemetryDisplayValue(i) }}
                  <template v-if="isEnumTelemetry(i)">（{{ i.value }}）</template>
                </div>
              </n-tooltip>
              <MovingNumbers
                v-else
                :ref="setItemRef"
                :data-index="index"
                :m-num="i.value"
                :quantile-show="true"
              ></MovingNumbers>
              <span v-if="i.unit">{{ i.unit }}</span>
            </div>
            <template #header>
              <div class="line1" :title="i.key">
                <template v-if="i.label">
                  <span v-if="i.label">{{ i.label }}</span>
                  <span>({{ i.key }})</span>
                </template>
                <template v-else>
                  <span>{{ i.key }}</span>
                </template>
              </div>
            </template>
            <template #footer>
              <div class="flex justify-end">
                {{ i.ts ? dayjs(i.ts).format('YYYY-MM-DD HH:mm:ss') : nowTime }}
              </div>
            </template>
          </n-card>
        </n-gi>
      </n-grid>
    </n-card>
  </n-card>
</template>

<style lang="scss">
.line1 {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  span {
    &:nth-child(2) {
      color: #ccc;
      padding-left: 5px;
    }
  }
}

.telemetry-card-body {
  padding: 10px 0 10px;
  display: flex;
  align-items: end;
  gap: 4px;

  span {
    &:first-child {
      font-size: 32px;
      line-height: 1;
    }
  }
}
.ml-20px {
  margin-left: 20px;
}
.flex-ai-c {
  align-items: center;
}
.w-80px {
  width: 80px;
}
.fs-0 {
  flex-shrink: 0;
}
.chart-table-dialog {
  width: 80%;
  max-width: 1000px;
}

.value-display-ellipsis {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-all; /* Or 'break-word' if preferred */
}

.simulation-layout-modal {
  width: min(920px, calc(100vw - 48px));
}

.simulation-layout-modal--platform {
  width: min(1040px, 90vw);
}

.simulation-layout-card {
  max-height: min(82vh, 760px);
  display: flex;
  flex-direction: column;
}

.simulation-layout-card > .n-card__content {
  min-height: 0;
  padding: 20px 24px 18px;
  overflow: auto;
}

.simulation-layout-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.simulation-layout-form .n-alert {
  margin-bottom: 0;
}

.simulation-layout-section {
  margin-bottom: 0;
  padding: 14px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.simulation-layout-section .n-form-item:last-child {
  margin-bottom: 0;
}

.simulation-data-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.simulation-data-input .n-input__textarea-el {
  min-height: 150px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.55;
}

.simulation-advanced-section {
  padding-block: 12px;
}

.simulation-advanced-section .n-collapse-transition {
  margin-top: 12px;
}

.simulation-advanced-fields .n-form-item {
  display: grid;
  grid-template-columns: 280px minmax(0, 480px);
  align-items: center;
  justify-content: start;
  column-gap: 12px;
}

.simulation-advanced-fields .n-form-item-label {
  width: 100%;
  justify-content: flex-start;
  padding-right: 0;
  overflow-wrap: anywhere;
  white-space: normal;
}

.simulation-advanced-fields .n-form-item-blank,
.simulation-advanced-fields .n-input-number {
  width: 100%;
}

.simulation-layout-actions {
  padding-top: 2px;
}

.simulation-error {
  margin-top: 0;
  padding: 10px 12px;
  border: 1px solid rgba(208, 48, 80, 0.22);
  border-radius: 6px;
  background: rgba(208, 48, 80, 0.06);
}

@media (max-width: 768px) {
  .simulation-layout-modal,
  .simulation-layout-modal--platform {
    width: calc(100vw - 24px);
  }

  .simulation-layout-card > .n-card__content {
    padding: 16px;
  }

  .simulation-data-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .simulation-advanced-fields .n-form-item {
    grid-template-columns: 1fr;
    row-gap: 6px;
  }
}
</style>
