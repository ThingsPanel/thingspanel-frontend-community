<script setup lang="tsx">
import { computed, ref, watch } from 'vue'
import { MovingNumbers } from 'moving-numbers-vue3'
import dayjs from 'dayjs'
import { telemetryDataCurrent } from '@/service/api/device'
import { decorateNativeTelemetryRows } from '@/views/device/native-device-model-contract'
import { getReadingDisplayValue } from '@/utils/device-readings'
import { createLogger } from '@/utils/logger'
import type { PlatformField } from '@/utils/thingsvis/types'
const logger = createLogger('TelemetryData')

const props = defineProps<{
  id: string
  cardHeight: number
  cardMargin: number
  platformFields?: PlatformField[]
  nativeModelExpected?: boolean
}>()

const rawTelemetry = ref<DeviceManagement.telemetryData[]>([])
const telemetryData = computed(() => props.nativeModelExpected
  ? decorateNativeTelemetryRows(rawTelemetry.value, props.platformFields || [])
  : rawTelemetry.value)
const nowTime = ref(dayjs().format('YYYY-MM-DD HH:mm:ss'))
let requestSequence = 0

watch(() => props.id, async id => {
  const sequence = ++requestSequence
  rawTelemetry.value = []
  const { data, error } = await telemetryDataCurrent(id)
  if (sequence === requestSequence && !error && data) rawTelemetry.value = data
}, { immediate: true })

const setItemRef = (el: any) => {
  logger.info(el)
}

const isText = (item: DeviceManagement.telemetryData) => typeof item.value !== 'number' || Boolean(item.enum?.length)

const getValueClass = (value: unknown) => {
  const length = String(value ?? '').length
  return {
    'index-style': true,
    'index-style--medium': length > 16 && length <= 48,
    'index-style--long': length > 48
  }
}

</script>

<template>
  <n-grid :x-gap="cardMargin" :y-gap="cardMargin" cols="1 600:2 900:3 1200:4">
    <n-gi v-for="(i, index) in telemetryData" :key="i.key">
      <n-card class="telemetry-card" header-class="border-b h-36px" hoverable :style="{ minHeight: cardHeight + 'px' }">
        <div class="card-body">
          <span v-if="isText(i)" :class="getValueClass(getReadingDisplayValue(i))">{{ getReadingDisplayValue(i) }}</span>
          <MovingNumbers
            v-else
            :ref="setItemRef"
            :data-index="index"
            class="c1"
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
          <div class="telemetry-card__time">
            {{ i.ts ? dayjs(i.ts).format('YYYY-MM-DD HH:mm:ss') : nowTime }}
          </div>
        </template>
      </n-card>
    </n-gi>
  </n-grid>
</template>

<style lang="scss" scoped>
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

.card-body {
  min-width: 0;
  padding: 12px 22px;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.index-style {
  display: block;
  min-width: 0;
  max-width: 100%;
  font-size: 28px;
  line-height: 1.35;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.index-style--medium {
  font-size: 20px;
  line-height: 1.45;
}

.index-style--long {
  font-size: 15px;
  line-height: 1.55;
}

.c1 {
  font-size: 28px;
  line-height: 1.35;
}

.telemetry-card {
  height: auto !important;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
}

.telemetry-card :deep(.n-card__content) {
  flex: 1;
  min-width: 0;
}

.telemetry-card :deep(.n-card__footer) {
  margin-top: auto;
  padding-top: 10px;
}

.telemetry-card__time {
  color: #8a8f99;
  font-size: 13px;
  line-height: 1.4;
  text-align: right;
  white-space: nowrap;
}
</style>
