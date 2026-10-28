<script setup lang="tsx">
import { computed, getCurrentInstance, h, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { NDataTable, NEmpty, NTag } from 'naive-ui'
import type { NumberAnimationInst } from 'naive-ui'
import dayjs from 'dayjs'
import { Activity } from '@vicons/tabler'
import { DocumentOnePage24Regular } from '@vicons/fluent'
import { useWebSocket } from '@vueuse/core'
import { MovingNumbers } from 'moving-numbers-vue3'
import {
  getSimulationInit,
  getTelemetryLogList,
  sendSimulationData,
  telemetryDataCurrent,
  telemetryDataDel
} from '@/service/api'
import { localStg } from '@/utils/storage'
import { $t } from '@/locales'
import { getWebsocketServerUrl, isJSON } from '@/utils/common/tool'
import { demoTelemetry, demoTelemetryLogs, isDeviceDetailDemo } from '@/utils/device-detail-demo-data'
import { deviceBindingRequiresNativeModel, resolveDeviceNativeModel } from '@/views/device/native-model-consumption'
import { decorateNativeTelemetryRows } from '@/views/device/native-device-model-contract'
import { getReadingDisplayValue } from '@/utils/device-readings'
import HistoryData from './modules/history-data.vue'
import TimeSeriesData from './modules/time-series-data.vue'
import { useLoading } from '~/packages/hooks'
const props = defineProps<{
  id: string
  deviceData?: Record<string, any>
}>()

let wsUrl = getWebsocketServerUrl()
wsUrl += '/telemetry/datas/current/ws'
const showLogDialog = ref(false)
const showHistory = ref(false)
const telemetryId = ref()
const telemetryKey = ref()
const telemetryName = ref()
const telemetryUnit = ref()
const modelType = ref<string>('')

const operationType = ref('')
const sendResult = ref('')
const tableData = ref([])

const tableThemeOverrides = {
  borderColor: 'var(--border-color)',
  borderRadius: '10px',
  fontSizeMedium: '14px',
  lineHeight: '1.5',
  thColor: 'var(--body-color)',
  thColorHover: 'var(--body-color)',
  thFontWeight: '400',
  thTextColor: 'var(--text-color)',
  tdColor: 'var(--card-color)',
  tdColorHover: 'var(--primary-color-suppl)',
  tdColorSorting: 'var(--primary-color-suppl)',
  tdTextColor: 'var(--text-color)',
  thPaddingMedium: '12px',
  tdPaddingMedium: '13px 12px'
}

const telemetryLogRowKey = (row: any) => `${row.created_at}-${row.data}-${row.username ?? ''}`

const telemetryData = ref<DeviceManagement.telemetryData[]>([])
const nativeTelemetryFields = ref(new Map<string, any>())
const nativeMetadataError = ref('')
let nativeMetadataRequestId = 0
const initTelemetryData = ref<any>()
const numberAnimationInstRef = ref<NumberAnimationInst[] | []>([])
const nowTime = ref<any>()
const { loading, startLoading, endLoading } = useLoading()
const total = ref(0)
const showLog = computed(() => {
  const data = props.deviceData
  if (!data || Object.keys(data).length === 0) return false
  return data.device_config ? data.device_config.protocol_type === 'MQTT' : true
})
const operationOptions = [
  { label: $t('custom.device_details.whole'), value: '' },
  { label: $t('custom.device_details.manualOperation'), value: '1' },
  { label: $t('custom.device_details.triggerOperation'), value: '2' }
  // 其他操作类型选项...
]
const resultOptions = [
  { label: $t('custom.device_details.whole'), value: '' },
  { label: $t('custom.devicePage.success'), value: '1' },
  { label: $t('custom.devicePage.fail'), value: '2' }
  // 其他发送结果选项...
]
const cardHeight = ref(160) // 卡片的高度
const cardMargin = ref(15) // 卡片的间距
const log_page = ref(1)
const showError = ref(false)
const erroMessage = ref('')
const showAdvanced = ref(false)
const simulationForm = reactive({
  username: '',
  password: '',
  client_id: '',
  server: '',
  port: 1883,
  topic: 'devices/telemetry',
  topic_options: [] as { label: string; value: string }[],
  default_data: '{"_data1": 25.5, "_data2": 60}',
  event_default_data: '{"method":"FindAnimal","params":{"count":2,"animalType":"cat"}}',
  normal_default_data: '{"_data1": 25.5, "_data2": 60}'
})
const simulationLoading = ref(false)

const token = localStg.get('token')

const { status, send, close } = useWebSocket(wsUrl, {
  heartbeat: {
    message: 'ping',
    interval: 8000,
    pongTimeout: 3000
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
          const { key: _originKey, label: _label, ...rest } = initTelemetryData.value
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

const columns = [
  {
    title: $t('custom.device_details.command'),
    minWidth: '140px',
    key: 'data'
  },
  {
    title: $t('custom.device_details.operationType'),
    key: 'operation_type',
    minWidth: '140px',
    render: row => (row.operation_type === '1' ? $t('custom.device_details.manualOperation') : $t('card.triggerAction'))
  },
  {
    title: $t('custom.device_details.operationUsers'),
    minWidth: '140px',
    key: 'username',
    render: row => (row.operation_type === '1' ? row.username : $t('generate.system'))
  },
  {
    title: $t('custom.device_details.operationTime'),
    key: 'created_at',
    minWidth: '140px',
    render: row => dayjs(row.created_at).format('YYYY-MM-DD HH:mm:ss')
  },
  {
    title: $t('custom.device_details.sendResults'),
    minWidth: '140px',
    key: 'status',
    render: row => {
      const success = row.status === '1'
      return h(
        NTag,
        { type: success ? 'success' : 'error', size: 'small' },
        {
          default: () => (success ? $t('custom.devicePage.success') : $t('custom.devicePage.fail'))
        }
      )
    }
  }
]
const requestSimulationInit = async () => {
  const defaultData = '{"_data1": 25.5, "_data2": 60}'
  const eventDefaultData = '{"method":"FindAnimal","params":{"count":2,"animalType":"cat"}}'
  const { data, error } = await getSimulationInit({
    device_id: props.id
  })
  if (!error && data) {
    simulationForm.username = data.username || ''
    simulationForm.password = data.password || ''
    simulationForm.client_id = data.client_id || ''
    simulationForm.server = data.server || ''
    simulationForm.port = data.port || 1883
    simulationForm.topic = data.topic || 'devices/telemetry'
    simulationForm.topic_options = data.topic_options || []
    simulationForm.default_data = data.default_data || defaultData
    simulationForm.event_default_data = data.event_default_data || eventDefaultData
    simulationForm.normal_default_data = data.default_data || defaultData
  } else {
    simulationForm.default_data = defaultData
    simulationForm.event_default_data = eventDefaultData
    simulationForm.normal_default_data = defaultData
  }
}

const openUpLog = () => {
  showError.value = false
  showLogDialog.value = true
  showAdvanced.value = false
  requestSimulationInit()
}

const sendSimulationDataByForm = async () => {
  if (!simulationForm.default_data) {
    window.$message?.error($t('custom.device_details.sendInputData'))
    return
  }
  simulationLoading.value = true
  const { error } = await sendSimulationData({
    device_id: props.id,
    data: simulationForm.default_data,
    server: simulationForm.server,
    port: simulationForm.port,
    topic: simulationForm.topic
  })
  simulationLoading.value = false
  if (!error) {
    showLogDialog.value = false
    showError.value = false
    window.$message?.success($t('custom.devicePage.success'))
  } else {
    showError.value = true
    erroMessage.value = error?.response?.data?.message || error?.message || ''
  }
}

const copySimulationData = async () => {
  if (!simulationForm.default_data) return
  try {
    await navigator.clipboard.writeText(simulationForm.default_data)
    window.$message?.success('复制成功')
  } catch {
    window.$message?.error('复制失败')
  }
}

const formatSimulationData = () => {
  if (!simulationForm.default_data) return
  if (!isJSON(simulationForm.default_data)) {
    window.$message?.warning('当前内容不是 JSON，无需格式化')
    return
  }
  simulationForm.default_data = JSON.stringify(JSON.parse(simulationForm.default_data), null, 2)
}

const clearSimulationData = () => {
  simulationForm.default_data = ''
}
const fetchData = async () => {
  startLoading()
  const { data, error } = await getTelemetryLogList({
    page: log_page.value,
    page_size: 5,
    device_id: props.id,
    operation_type: operationType.value,
    status: sendResult.value
  })
  if (!error) {
    const list = data?.value || data?.list || []
    tableData.value = list.length > 0 || !isDeviceDetailDemo(props.id) ? list : demoTelemetryLogs()
    total.value = Math.max(1, Math.ceil((data?.count || tableData.value.length) / 5))
    endLoading()
  }
}

const fetchTelemetry = async () => {
  const { data, error } = await telemetryDataCurrent(props.id)
  if (!error && data) {
    telemetryData.value = decorateTelemetry(data.length > 0 || !isDeviceDetailDemo(props.id) ? data : demoTelemetry())
    initTelemetryData.value = telemetryData.value[0] || {} // 存储一份模板
    initTelemetryData.value.device_id = props.id
    const dataw = {
      // eslint-disable-next-line no-constant-binary-expression
      device_id: props.id,
      token
    }

    send(JSON.stringify(dataw))
  }
}
const setItemRef = el => {
  if (el) {
    const index = el.$attrs['data-index']
    numberAnimationInstRef.value[index] = el
  }
}
const options = ref([
  {
    label: $t('custom.device_details.deleteAttribute'),
    key: '1'
  }
])

const delparam: any = ref({})

const handleDeleteTable = async () => {
  const { error }: any = await telemetryDataDel(delparam.value)

  if (!error) {
    fetchTelemetry()
  }
}

const handleSelect = (key, item) => {
  if (String(key) === '1') {
    delparam.value = {
      key: item.key,
      device_id: props.id
    }
    handleDeleteTable()
  }
}
const onTapTableTools = (i: any) => {
  if (typeof i.value === 'number' && !isEnumTelemetry(i)) {
    modelType.value = $t('custom.device_details.sequential')
    telemetryKey.value = i.key
    telemetryName.value = i.label
    telemetryId.value = i.device_id
    telemetryUnit.value = i.unit
    showHistory.value = true
  }
}

const isEnumTelemetry = (item: DeviceManagement.telemetryData) =>
  item.data_type?.toLowerCase() === 'enum' && Array.isArray(item.enum)

const getTelemetryDisplayValue = getReadingDisplayValue

const isTextTelemetry = (item: DeviceManagement.telemetryData) =>
  isEnumTelemetry(item) || typeof item.value !== 'number'

const isColor = (i: any) => {
  if (typeof i.value !== 'number' || isEnumTelemetry(i)) {
    return '#cccccc'
  }
  return ''
}

function decorateTelemetry(rows: DeviceManagement.telemetryData[]) {
  if (!deviceBindingRequiresNativeModel(props.deviceData?.device_config)) return rows
  return decorateNativeTelemetryRows(rows, [...nativeTelemetryFields.value.values()])
}

async function loadNativeTelemetryMetadata() {
  const requestId = ++nativeMetadataRequestId
  try {
    const resolved = await resolveDeviceNativeModel(props.deviceData?.device_config)
    if (requestId !== nativeMetadataRequestId) return
    nativeMetadataError.value = !resolved && deviceBindingRequiresNativeModel(props.deviceData?.device_config)
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

watch(
  [() => props.id, () => props.deviceData?.device_config],
  () => void loadNativeTelemetryMetadata(),
  { immediate: true, deep: true }
)

// 监听 Topic 变化，自动切换对应格式的数据
watch(
  () => simulationForm.topic,
  val => {
    if (!val) return
    if (val.includes('/event/')) {
      simulationForm.default_data = simulationForm.event_default_data
    } else {
      simulationForm.default_data = simulationForm.normal_default_data
    }
  }
)
onMounted(() => {
  fetchData()
  fetchTelemetry()
})

onUnmounted(() => {
  if (status.value === 'OPEN') {
    close()
  }
})

const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance()
  return proxy.getPlatform()
})

</script>

<template>
  <n-card class="w-full">
    <n-alert v-if="nativeMetadataError" type="error" :show-icon="false" class="mb-4">
      {{ nativeMetadataError }}
    </n-alert>
    <!-- 第一行 -->
    <NFlex justify="end">
      <n-button v-if="showLog" type="primary" class="mb-4" @click="openUpLog">
        {{ $t('generate.simulate-report-data') }}
      </n-button>
    </NFlex>

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
            <template #header-extra>
              <div class="h-24px w-120px flex items-center justify-end">
                <NIcon
                  size="24"
                  @click="
                    () => {
                      modelType = $t('custom.device_details.history')
                      telemetryKey = i.key
                      telemetryName = i.label
                      telemetryUnit = i.unit
                      telemetryId = i.device_id
                      showHistory = true
                    }
                  "
                >
                  <DocumentOnePage24Regular />
                </NIcon>
                <NDivider vertical />
                <NIcon size="24" :color="isColor(i)" @click="onTapTableTools(i)">
                  <Activity />
                </NIcon>
                <NDivider vertical />
                <n-dropdown trigger="click" :options="options" @select="handleSelect($event, i)">
                  <span class="inline-flex cursor-pointer items-center justify-center">
                    <SvgIcon icon="mdi:dots-horizontal" class="text-20px" />
                  </span>
                </n-dropdown>
              </div>
            </template>
          </n-card>
        </n-gi>
      </n-grid>
    </n-card>

    <!-- 第三行 -->
    <n-space>
      <n-select
        v-model:value="operationType"
        :options="operationOptions"
        style="width: 200px"
        @update:value="fetchData"
      />
      <n-select v-model:value="sendResult" :options="resultOptions" style="width: 200px" @update:value="fetchData" />
    </n-space>

    <!-- 第四行 -->

    <NDataTable
      class="device-detail-table mt-4"
      :loading="loading"
      :columns="columns"
      :data="tableData"
      size="medium"
      :theme-overrides="tableThemeOverrides"
      :bordered="true"
      :bottom-bordered="true"
      :single-column="false"
      :single-line="true"
      :scroll-x="920"
      :row-key="telemetryLogRowKey"
      :pagination="false"
    >
      <template #empty>
        <NEmpty size="small" :description="$t('common.noData')" />
      </template>
    </NDataTable>
    <div class="mt-4 w-full flex justify-end">
      <n-pagination
        :page-count="total"
        :page-size="5"
        @update:page="
          page => {
            log_page = page
            fetchData()
          }
        "
      />
    </div>
    <n-modal
      v-model:show="showLogDialog"
      :title="'模拟上报数据'"
      :class="getPlatform ? 'simulation-layout-modal simulation-layout-modal--platform' : 'simulation-layout-modal'"
    >
      <n-card class="simulation-layout-card">
        <n-form class="simulation-layout-form" label-placement="left">
          <!-- 提示信息 -->
          <n-alert type="info" class="m-b-15px" :show-icon="true">
            填写模拟数据并发送，平台将模拟设备上报数据，用于测试数据流、自动化规则、告警通知等。
          </n-alert>

          <!-- 认证信息（三列并排，只读展示） -->
          <div class="simulation-layout-section">
            <div class="m-b-8px font-600">认证信息（自动填充，无需修改）</div>
            <n-grid :cols="3" :x-gap="12" responsive="screen" :screen="{ s: 1 }">
              <n-gi>
                <n-form-item label="用户名" :show-feedback="false">
                  <n-input :value="simulationForm.username" readonly class="bg-gray-50" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="密码" :show-feedback="false">
                  <n-input :value="simulationForm.password ? '••••••••' : ''" readonly class="bg-gray-50" />
                </n-form-item>
              </n-gi>
              <n-gi>
                <n-form-item label="客户端ID" :show-feedback="false">
                  <n-input :value="simulationForm.client_id" readonly class="bg-gray-50" />
                </n-form-item>
              </n-gi>
            </n-grid>
          </div>

          <!-- 上报数据 -->
          <div class="simulation-layout-section">
            <div class="simulation-data-header m-b-8px">
              <div class="font-600">数据</div>
              <n-space :size="8">
                <n-button size="small" secondary :disabled="!simulationForm.default_data" @click="copySimulationData">
                  复制
                </n-button>
                <n-button size="small" secondary :disabled="!simulationForm.default_data" @click="formatSimulationData">
                  格式化
                </n-button>
                <n-button size="small" secondary :disabled="!simulationForm.default_data" @click="clearSimulationData">
                  清空
                </n-button>
              </n-space>
            </div>
            <n-form-item>
              <n-input
                v-model:value="simulationForm.default_data"
                type="textarea"
                :rows="5"
                class="simulation-data-input"
              />
            </n-form-item>
          </div>

          <!-- 高级选项 -->
          <div class="simulation-layout-section simulation-advanced-section">
            <div
              class="cursor-pointer flex items-center gap-8px m-b-8px font-600"
              @click="showAdvanced = !showAdvanced"
            >
              <span>高级选项</span>
              <n-icon>
                <svg viewBox="0 0 16 16" width="16" height="16">
                  <path
                    :d="showAdvanced ? 'M4 10l4-4 4 4' : 'M4 6l4 4 4-4'"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </n-icon>
            </div>
            <n-collapse-transition :show="showAdvanced">
              <div class="simulation-advanced-fields flex flex-col gap-12px">
                <n-form-item label="服务器" label-align="left" :show-feedback="false">
                  <n-input v-model:value="simulationForm.server" />
                </n-form-item>
                <n-form-item label="端口" label-align="left" :show-feedback="false">
                  <n-input-number v-model:value="simulationForm.port" :min="1" :max="65535" />
                </n-form-item>
                <n-form-item label-align="left" :label="`Topic（${simulationForm.topic}）`" :show-feedback="false">
                  <n-select
                    v-model:value="simulationForm.topic"
                    :options="simulationForm.topic_options"
                    placeholder="选择 Topic"
                  />
                </n-form-item>
              </div>
            </n-collapse-transition>
          </div>

          <!-- 操作按钮 -->
          <n-space class="simulation-layout-actions" justify="end">
            <n-button @click="showLogDialog = false">{{ $t('generate.cancel') }}</n-button>
            <n-button type="primary" :loading="simulationLoading" @click="sendSimulationDataByForm">
              {{ $t('generate.send') }}
            </n-button>
          </n-space>

          <!-- 错误信息 -->
          <div v-if="showError" class="mt-10px w-100% flex items-center gap-5px simulation-error">
            <SvgIcon local-icon="AlertFilled" style="color: red; flex-shrink: 0" class="text-20px" />
            <span style="display: inline-block; word-break: break-all">
              {{ erroMessage }}
            </span>
          </div>
        </n-form>
      </n-card>
    </n-modal>
    <n-modal v-model:show="showHistory" :title="$t('generate.telemetry-history-data')">
      <NCard style="width: 80%">
        <HistoryData
          v-if="modelType === $t('custom.device_details.history')"
          :device-id="telemetryId"
          :the-key="telemetryKey"
          :the-name="telemetryName"
          :the-unit="telemetryUnit"
        />
        <TimeSeriesData
          v-if="modelType === $t('custom.device_details.sequential')"
          :device-id="telemetryId"
          :the-key="telemetryKey"
          :the-name="telemetryName"
          :the-unit="telemetryUnit"
        />
      </NCard>
    </n-modal>
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
