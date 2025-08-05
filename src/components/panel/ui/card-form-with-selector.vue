<template>
  <div>
    <NTabs v-if="state.selectCard" v-model:value="state.tab" type="line" animated>
      <NTabPane v-if="state.selectCard.type === 'chart'" name="dataSource" :tab="$t('card.dataSource')">
        <div :class="`${mobile ? '' : 'h-[calc(100vh_-_150px)] '} overflow-y-auto py-5`">
          <NForm>
            <!-- 时间范围和聚合范围选择 -->
            <NSelect
              v-if="state.data.dataSource.isSupportTimeRange"
              v-model:value="state.data.dataSource.dataTimeRange"
              clearable
              :options="dataTimeRangeOptions || []"
              :placeholder="$t('card.selectDataTimeFrame')"
              @update:value="updateTime"
            />
            <NSelect
              v-if="state.data.dataSource.isSupportAggregate"
              v-model:value="state.data.dataSource.dataAggregateRange"
              clearable
              filterable
              :options="dataAggregateRangeOptions || []"
              :placeholder="$t('card.selectDataAggregationRange')"
            />

            <!-- 设备数量选择 -->
            <div v-if="state.data.dataSource?.origin === 'device' || state.data.dataSource?.origin === 'system'">
              <n-input-number
                v-model:value="deviceCount"
                :disabled="props?.deviceWebChartConfig?.length !== 0"
                :min="1"
                :hidden="state.data.dataSource.sourceNum === 1"
                :max="state.data.dataSource.sourceNum || 9"
                class="m-b-2 w-360px"
              >
                <template #prefix>
                  <span class="text-#999">{{ $t('generate.device-num-count') }}</span>
                </template>
              </n-input-number>

              <!-- 使用新的DeviceMetricsSelector组件 -->
              <div class="device-selectors-container">
                <div
                  v-for="(item, i) in state.data.dataSource.deviceSource"
                  v-show="i <= deviceCount - 1"
                  :key="i"
                  class="device-selector-item mb-4 p-4 border rounded-lg"
                >
                  <h4 class="text-lg font-medium mb-3">设备 {{ i + 1 }}</h4>
                  <DeviceMetricsSelector
                    v-model="item"
                    :device-options="deviceOption"
                    :disabled="props?.deviceWebChartConfig?.length !== 0"
                    :show-aggregate-function="state.data.dataSource.isSupportAggregate"
                    :is-no-aggregate="isNoAggregate"
                    @device-change="(deviceId, device) => onDeviceChange(deviceId, device, item)"
                    @metrics-change="(metricsId, metrics) => onMetricsChange(metricsId, metrics, item)"
                  />
                </div>
              </div>
            </div>
          </NForm>
        </div>
      </NTabPane>

      <NTabPane v-if="!!state.selectCard?.configForm" name="config" :tab="$t('card.componentSettings')">
        <div :class="`${mobile ? '' : 'overflow-y-auto'} py-5`">
          <div class="max-w-[600px]">
            <ConfigCtx v-model:config="state.data.config" mode="insert">
              <component :is="state.selectCard?.configForm" :data="state.data" />
            </ConfigCtx>
          </div>
        </div>
      </NTabPane>

      <NTabPane name="basic" :tab="$t('card.basicSettings')">
        <NForm>
          <NFormItem :label="$t('page.manage.menu.form.title')">
            <div class="flex items-center">
              <div class="w-36">
                <NCheckbox v-model:checked="state.data.basicSettings.showTitle">
                  {{ $t('generate.display-title') }}
                </NCheckbox>
              </div>
              <NInput
                v-if="state.data.basicSettings.showTitle"
                v-model:value="state.data.basicSettings.title"
                @keydown.enter.prevent
              />
            </div>
          </NFormItem>
        </NForm>
      </NTabPane>
    </NTabs>
  </div>
</template>

<script lang="tsx" setup>
import { computed, reactive, ref, watch } from 'vue'
import type { SelectOption } from 'naive-ui'
import { usePanelStore } from '@/store/modules/panel'
import ConfigCtx from '@/components/panel/ui/config-ctx.vue'
import DeviceMetricsSelector from '@/components/DeviceMetricsSelector.vue'
import type { ICardData, ICardDefine } from '@/components/panel/card'
import { $t } from '@/locales'

const copy = (obj: object) => JSON.parse(JSON.stringify(obj))

const props = defineProps<{
  mobile?: boolean
  deviceWebChartConfig: any
}>()

const store = usePanelStore()
const defData = {
  cardId: '',
  type: 'builtin',
  title: '',
  config: {} as any,
  basicSettings: {} as any,
  dataSource: {
    origin: 'device',
    systemSource: [{}],
    deviceSource: [{}]
  } as any
}

const dataTimeRangeOptions = [
  { label: $t('common.last_5m'), value: 'last_5m' },
  { label: $t('common.last_15m'), value: 'last_15m' },
  { label: $t('common.last_30m'), value: 'last_30m' },
  { label: $t('common.lastHours1'), value: 'last_1h' },
  { label: $t('common.lastHours3'), value: 'last_3h' },
  { label: $t('common.lastHours6'), value: 'last_6h' },
  { label: $t('common.lastHours12'), value: 'last_12h' },
  { label: $t('common.lastHours24'), value: 'last_24h' },
  { label: $t('common.lastDays3'), value: 'last_3d' },
  { label: $t('common.lastDays7'), value: 'last_7d' },
  { label: $t('common.lastDays15'), value: 'last_15d' },
  { label: $t('common.lastDays30'), value: 'last_30d' },
  { label: $t('common.lastDays60'), value: 'last_60d' },
  { label: $t('common.lastDays90'), value: 'last_90d' }
]

const dataAggregateRangeOptions = [
  { label: $t('common.notAggre'), value: 'no_aggregate', disabled: false },
  { label: $t('common.seconds30'), value: '30s', disabled: false },
  { label: $t('common.minute1'), value: '1m', disabled: false },
  { label: $t('common.minute2'), value: '2m', disabled: false },
  { label: $t('common.minutes5'), value: '5m', disabled: false },
  { label: $t('common.minutes10'), value: '10m', disabled: false },
  { label: $t('common.minutes30'), value: '30m', disabled: false },
  { label: $t('common.hours1'), value: '1h', disabled: false },
  { label: $t('common.hours3'), value: '3h', disabled: false },
  { label: $t('common.hours6'), value: '6h', disabled: false },
  { label: $t('common.days1'), value: '1d', disabled: false },
  { label: $t('common.days7'), value: '7d', disabled: false },
  { label: '1月', value: '1mo', disabled: false }
]

const state = reactive({
  tab: 'device',
  selectCard: null as null | ICardDefine,
  data: copy(defData)
})

const deviceOption = ref<SelectOption[]>([])
const deviceCount = ref()

const findCard = (id: string) => {
  const cIds = id.split('-')
  const cId = `${cIds[0]}-${cIds[1]}`
  return store.$state.cardMap.get(cId) || null
}

const updateDisabledOptions = (timeFrame: string) => {
  const disableBeforeIndex: { [key: string]: number } = {
    最近3小时: 1,
    最近6小时: 2,
    最近12小时: 3,
    最近24小时: 4,
    最近3天: 5,
    最近7天: 6,
    最近15天: 7,
    最近30天: 7,
    最近60天: 8,
    最近90天: 9,
    最近6个月: 9,
    最近1年: 12,
    今天: 4,
    昨天: 4,
    前天: 4,
    上周今日: 4,
    本周: 6,
    上周: 6,
    本月: 7,
    上个月: 7,
    今年: 12,
    去年: 12
  }

  dataAggregateRangeOptions.forEach((item, index, array) => {
    if (!disableBeforeIndex[timeFrame]) {
      item.disabled = false
      state.data.dataSource.dataAggregateRange = 'no_aggregate'
      return
    }

    item.disabled = index < (disableBeforeIndex[timeFrame] || 0)
    if (index < (disableBeforeIndex[timeFrame] || 0)) {
      state.data.dataSource.dataAggregateRange = array[index + 1].value as string
    }
  })
}

const updateTime = (_v: number, o: SelectOption) => {
  updateDisabledOptions(o.label as string)
}

const emit = defineEmits<{
  (e: 'update', data: ICardData): void
}>()

watch(
  () => state.data,
  data => {
    emit('update', data as any)
  },
  { deep: true }
)

const deviceCountUpdate = v => {
  state.data.dataSource.deviceCount = v
  if (state.data.dataSource.deviceSource.length < v) {
    for (let i = 0; i <= v - state.data.dataSource.deviceSource.length + 1; i++) {
      state.data.dataSource.deviceSource.push({})
    }
  } else if (state.data.dataSource.deviceSource.length > v) {
    state.data.dataSource.deviceSource.splice(v, state.data.dataSource.deviceSource.length - v)
  }
}

const onDeviceChange = (deviceId: string, device: any, item: any) => {
  item.deviceId = deviceId
  item.name = device.name
  console.log('设备选择变化:', deviceId, device)
}

const onMetricsChange = (metricsId: string, metrics: any, item: any) => {
  item.metricsId = metricsId
  item.metricsName = metrics.label || metrics.key
  item.metricsType = metrics.data_source_type
  item.metricsDataType = metrics.data_type
  console.log('指标选择变化:', metricsId, metrics)
}

const isNoAggregate = computed(() => state.data.dataSource.dataAggregateRange === 'no_aggregate')

defineExpose({
  setCard: (data?: ICardData) => {
    state.selectCard = null
    state.data = copy(data || defData)

    setTimeout(() => {
      state.selectCard = findCard(state.data.cardId)
      if (state.data.type === 'chart') state.tab = 'dataSource'
      else if (state.selectCard?.configForm) state.tab = 'config'
      else state.tab = 'basic'
    })

    deviceCount.value = state?.data?.dataSource?.deviceSource?.length || 1
  }
})

watch(
  () => state.data.cardId,
  cardId => {
    if (props?.deviceWebChartConfig?.length > 0) {
      state.data.dataSource.deviceSource = props?.deviceWebChartConfig?.filter(
        item => item.data.cardId === cardId
      )[0]?.data?.dataSource?.deviceSource
    }
  }
)

watch(deviceCount, v => {
  deviceCountUpdate(v)
})
</script>

<style scoped>
.device-selectors-container {
  margin-top: 1rem;
}

.device-selector-item {
  background: #fafafa;
  border: 1px solid #e5e7eb;
}

.device-selector-item:hover {
  border-color: #d1d5db;
}
</style>
