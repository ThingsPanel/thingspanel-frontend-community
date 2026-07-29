<script lang="ts" setup>
import { computed, onMounted, onUpdated, reactive, ref } from 'vue'
// eslint-disable-next-line vue/prefer-import-from-vue
import type { UnwrapRefSimple } from '@vue/reactivity'
import type { ICardData, ICardDefine } from '@/components/panel/card'
import { PanelCards } from '@/components/panel'
import { deviceTemplateSelect } from '@/service/api'
import { $t } from '@/locales'
import barPoster from '@/card/chart-card/bar/poster.png'
import curvePoster from '@/card/chart-card/curve/poster.png'
import demoPoster from '@/card/chart-card/demo/poster.png'
import digitIndicatorPoster from '@/card/chart-card/digit-indicator/poster.png'
import digitSetterPoster from '@/card/chart-card/digit-setter/poster.png'
import dispatchDataPoster from '@/card/chart-card/dispatch-data/poster.png'
import instrumentPanelPoster from '@/card/chart-card/instrument-panel/poster.png'
import stateDisplayPoster from '@/card/chart-card/state-display/poster.png'
import switchPoster from '@/card/chart-card/switch/poster.png'
import tablePoster from '@/card/chart-card/table/poster.png'
import textInfoPoster from '@/card/chart-card/text-info/poster.png'
import videoPlayerPoster from '@/card/chart-card/video-player/poster.png'

const props = defineProps<{
  class?: string | undefined
  data?: ICardData | null
}>()
const tabValue = ref('builtin')
const tabList = [
  { tab: $t('card.systemTab'), type: 'builtin' },
  { tab: $t('card.deviceTab'), type: 'device' },
  { tab: $t('card.pluginTab'), type: 'plugin' },
  { tab: $t('card.chartTab'), type: 'chart' }
]

const priorityCardIds = ref(['chart-demo', 'chart-digit'])
const sortedPanelCards = computed(() => {
  const result = {}
  Object.keys(PanelCards).forEach(key => {
    result[key] = [...PanelCards[key]].sort((a, b) => {
      const indexA = priorityCardIds.value.indexOf(a.id)
      const indexB = priorityCardIds.value.indexOf(b.id)
      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1
      return indexA - indexB
    })
  })
  return result
})

const state = reactive({
  curCardData: null as null | Record<string, any>
})
// $emit是内置变量 不可以使用$emit 作为变量名
const emit = defineEmits<{
  (e: 'selectCard', value: any): void
}>()

const selectCard = item => {
  state.curCardData = {
    cardId: item.cardId,
    type: item.type,
    title: item.title,
    config: item.config || {},
    basicSettings: item.basicSettings || {},
    dataSource: item.dataSource || {
      origin: 'system',
      systemSource: [{}],
      deviceSource: [{}]
    }
  }
  emit('selectCard', JSON.parse(JSON.stringify(state.curCardData)))
}
const getImagePath = item => {
  const cardType = item.data.cardId.match(
    /bar|curve|demo|digit|digitsetter|dispatch|humidity|instrument-panel|state|switch|table|temprature|text|videoplayer/
  )

  if (!cardType) {
    return demoPoster
  }

  if (cardType[0] === 'curve') {
    return curvePoster
  } else if (cardType[0] === 'switch') {
    return switchPoster
  } else if (cardType[0] === 'videoplayer') {
    return videoPlayerPoster
  } else if (cardType[0] === 'bar') {
    return barPoster
  } else if (cardType[0] === 'digit') {
    return digitIndicatorPoster
  } else if (cardType[0] === 'digitsetter') {
    return digitSetterPoster
  } else if (cardType[0] === 'dispatch') {
    return dispatchDataPoster
  } else if (cardType[0] === 'instrument-panel') {
    return instrumentPanelPoster
  } else if (cardType[0] === 'state') {
    return stateDisplayPoster
  } else if (cardType[0] === 'table') {
    return tablePoster
  } else if (cardType[0] === 'text') {
    return textInfoPoster
  }
  return demoPoster
}
const selectFinalCard = (item: ICardDefine) => {
  state.curCardData = {
    cardId: item.id,
    type: item.type,
    title: item.title,
    config: item.preset?.config || {},
    layout: item.preset?.iCardViewDefault,
    basicSettings: item.preset?.basicSettings || {},
    dataSource: item.preset?.dataSource || {
      origin: 'system',
      systemSource: [{}],
      deviceSource: [{}]
    }
  }
  emit('selectCard', JSON.parse(JSON.stringify(state.curCardData)))
}

const deviceOptions = ref<UnwrapRefSimple<any>[]>()
const webChartConfig = ref<any>([])
const availableCardIds = ref<string[]>([])
const deviceSelectId = ref<string | null>(null)

const handleTabUpdate = (value: string) => {
  if (state.curCardData) {
    state.curCardData.cardId = ''
  }
  availableCardIds.value = []
  webChartConfig.value = []
  deviceSelectId.value = null
  tabValue.value = value
  if (process.env.NODE_ENV === 'development') {
  }
}

const getDeviceOptions = async () => {
  const { data, error } = await deviceTemplateSelect()
  if (!error && data) {
    deviceOptions.value = [...data].reverse()
  } else {
    deviceOptions.value = []
  }
}
const collectData = (v, o) => {
  if (o?.web_chart_config) {
    webChartConfig.value = JSON.parse(o.web_chart_config)
    availableCardIds.value = webChartConfig.value.map(item => {
      item.data.dataSource.deviceSource.forEach(item1 => {
        item1.deviceId = v
      })

      return item.data.cardId
    })
  }
}

onUpdated(() => {
  if (!(props?.data?.dataSource?.deviceSource && props?.data?.dataSource?.deviceSource?.length > 0)) {
    availableCardIds.value = []
  }
})

onMounted(() => {
  const initialDeviceId = props?.data?.dataSource?.deviceSource?.[0]?.deviceId
  if (initialDeviceId) {
    deviceSelectId.value = initialDeviceId
    if (process.env.NODE_ENV === 'development') {
    }
    collectData(
      deviceSelectId.value,
      deviceOptions.value?.find(item => item.device_id === deviceSelectId.value)
    )
  } else {
    if (process.env.NODE_ENV === 'development') {
    }
  }
  if (!deviceSelectId.value) {
    availableCardIds.value = []
  }

  tabValue.value = props?.data?.type || 'builtin'
  getDeviceOptions()
})
</script>

<template>
  <div :class="props.class">
    <div class="h-full overflow-y-auto">
      <n-scrollbar style="height: 100%; padding: 4px">
        <NTabs
          type="line"
          default-value="builtin"
          :value="tabValue"
          animated
          class="h-full"
          @update:value="handleTabUpdate"
        >
          <NTabPane v-for="item1 in tabList" :key="item1.type" class="h-full" :name="item1.type" :tab="item1.tab">
            {{}}
            <div v-if="item1.tab === '设备'">
              <NSelect
                v-model:value="deviceSelectId"
                :placeholder="$t('generate.select-device')"
                :options="deviceOptions"
                filterable
                clearable
                value-field="device_id"
                label-field="device_name"
                @update:value="
                  (value, option) => {
                    if (state.curCardData) {
                      state.curCardData.cardId = ''
                    }
                    collectData(value, option)
                  }
                "
              ></NSelect>
            </div>
            <n-scrollbar style="height: 100%; padding: 4px">
              <div v-if="item1.tab === '设备'">
                <n-grid :x-gap="10" :y-gap="10" cols="1 240:1 480:2 720:3">
                  <n-gi v-for="item in webChartConfig" :key="item.data.cardId" class="min-w-240px p-4px">
                    <div
                      v-if="item.data.cardId.indexOf('chart') != -1"
                      class="cursor-pointer overflow-hidden border rounded p-0px duration-200"
                      :style="
                        item.data.cardId === state?.curCardData?.cardId
                          ? 'border-color: #2d3d88'
                          : 'border-color: #DEE0E5'
                      "
                      @click="selectCard(item.data)"
                    >
                      <div class="text-center font-medium leading-8 dark:bg-zinc-900" style="background-color: #efefef">
                        {{ item.data.dataSource?.deviceSource?.[0]?.metricsName || $t(item.data.title) }}
                      </div>
                      <div class="h-148px w-full flex items-center justify-center p-8px">
                        <img :src="getImagePath(item)" style="width: 90%; height: 100%; object-fit: contain" />
                      </div>
                    </div>
                  </n-gi>
                </n-grid>
              </div>
              <div v-else>
                <n-grid :x-gap="10" :y-gap="10" cols="1 240:1 480:2 720:3">
                  <n-gi v-for="item in sortedPanelCards[item1.type]" :key="item.id" class="min-w-240px p-4px">
                    <div
                      class="cursor-pointer overflow-hidden border rounded p-0px duration-200"
                      :style="
                        item.id === state?.curCardData?.cardId ? 'border-color: #2d3d88' : 'border-color: #DEE0E5'
                      "
                      @click="selectFinalCard(item)"
                    >
                      <div class="text-center font-medium leading-8 dark:bg-zinc-900" style="background-color: #efefef">
                        {{ $t(item.title) }}
                      </div>
                      <div class="h-148px w-full flex items-center justify-center p-8px">
                        <img :src="item.poster" alt="" style="width: 90%; height: 100%; object-fit: contain" />
                      </div>
                    </div>
                  </n-gi>
                </n-grid>
              </div>
            </n-scrollbar>
          </NTabPane>
        </NTabs>
      </n-scrollbar>
    </div>
  </div>
</template>
