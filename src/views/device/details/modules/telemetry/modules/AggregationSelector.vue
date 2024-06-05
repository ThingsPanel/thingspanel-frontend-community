<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { TimeOutline } from '@vicons/ionicons5';
import { Circle24Regular, Target20Regular } from '@vicons/fluent';
import { addYears, differenceInDays, differenceInHours, differenceInMonths } from 'date-fns';
import { $t } from '@/locales';
const emit = defineEmits<{
  (event: 'update:value', value): void;
}>();
const props = defineProps<{
  device_id: string;
  thekey: string;
}>();

interface AggregationData {
  device_id: string;
  key: string;
  aggregate_window: string;
  time_range: string;
  start_time?: number;
  end_time?: number;
  aggregate_function?: string;
}

const aggregation_data = ref<AggregationData>({
  device_id: props.device_id,
  key: props.thekey,
  aggregate_window: 'no_aggregate',
  time_range: 'last_1h'
});
const dateRange = ref<[number, number] | null>(null);
const timeOptions = [
  { label: $t('common.custom'), value: 'custom' },
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
  { label: $t('common.lastDays90'), value: 'last_90d' },
  { label: $t('common.halfYear'), value: 'last_6m' },
  { label: $t('common.lastYears1'), value: 'last_1y' }
];
const timeWeighting = {
  custom: 0,
  last_5m: 0,
  last_15m: 0,
  last_30m: 0,
  last_1h: 0,
  last_3h: 1,
  last_6h: 2,
  last_12h: 3,
  last_24h: 4,
  last_3d: 5,
  last_7d: 6,
  last_15d: 7,
  last_30d: 8,
  last_60d: 9,
  last_90d: 10,
  last_6m: 11,
  last_1y: 12
};
const aggregationIntervalOptions = [
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
  { label: $t('common.months1'), value: '1mo', disabled: false }
];
const statisticsOptions = [
  { label: $t('common.average'), value: 'avg', disabled: false },
  { label: $t('generate.max-value'), value: 'max', disabled: false }
];

const aggregationTtemToFalse = (weight: number) => {
  aggregationIntervalOptions.forEach((item, index) => {
    if (index < weight) {
      item.disabled = true;
    } else {
      item.disabled = false;
    }
    if (index < weight + 1) {
      aggregation_data.value.aggregate_window = item.value;
      if (aggregation_data.value.aggregate_window !== 'no_aggregate' && !aggregation_data.value.aggregate_function) {
        aggregation_data.value.aggregate_function = 'avg';
      }
      if (aggregation_data.value.aggregate_window === 'no_aggregate') {
        aggregation_data.value.aggregate_function = undefined;
      }
    }
  });
};

function onChangeTime(v) {
  console.log(v, 'custom');
  if (v !== 'custom') {
    aggregation_data.value.start_time = undefined;
    aggregation_data.value.end_time = undefined;
    dateRange.value = null;
  }
  aggregationTtemToFalse(timeWeighting[v]);
  if (v) emit('update:value', aggregation_data.value);
}

function onChangeAggregation(v) {
  if (v !== 'no_aggregate' && !aggregation_data.value.aggregate_function) {
    aggregation_data.value.aggregate_function = 'avg';
  }
  if (v === 'no_aggregate') {
    aggregation_data.value.aggregate_function = undefined;
  }
  emit('update:value', aggregation_data.value);
}

function onChangeStatistics() {
  emit('update:value', aggregation_data.value);
}

function getWeightNumber(diffHours, diffDays, diffMonths) {
  if (diffHours <= 1) return timeWeighting.last_1h; // 处理小于1小时的情况
  if (diffHours <= 3) return timeWeighting.last_3h;
  if (diffHours <= 6) return timeWeighting.last_6h;
  if (diffHours <= 12) return timeWeighting.last_12h;
  if (diffHours <= 24) return timeWeighting.last_24h;
  if (diffDays <= 3) return timeWeighting.last_3d;
  if (diffDays <= 7) return timeWeighting.last_7d;
  if (diffDays <= 15) return timeWeighting.last_15d;
  if (diffDays <= 30) return timeWeighting.last_30d;
  if (diffDays <= 60) return timeWeighting.last_60d;
  if (diffDays <= 90) return timeWeighting.last_90d;
  if (diffMonths <= 6) return timeWeighting.last_6m;
  if (diffMonths <= 12) return timeWeighting.last_1y;

  return timeWeighting.last_1y; // 对于超过1年的情况，默认返回最后一个权重
}

const checkDateRange = value => {
  console.log(value);
  const [start, end] = value;
  if (start && end && addYears(start, 1) < end) {
    dateRange.value = null;
    window.NMessage.error($t('common.withinOneYear'));
  } else {
    aggregation_data.value.start_time = start;
    aggregation_data.value.end_time = end;

    const diffHours = differenceInHours(end, start);
    const diffDays = differenceInDays(end, start);
    const diffMonths = differenceInMonths(end, start);
    let weight = 0;

    weight = getWeightNumber(diffHours, diffDays, diffMonths);
    aggregationTtemToFalse(weight);
  }
};
onMounted(() => {
  emit('update:value', aggregation_data.value);
});
</script>

<template>
  <NFlex justify="start" :size="4">
    <n-popselect
      v-model:value="aggregation_data.time_range"
      scrollable
      :options="timeOptions"
      trigger="click"
      @update:value="onChangeTime"
    >
      <n-icon size="24" :color="aggregation_data.time_range !== 'custom' ? '#0e7a0d' : ''">
        <TimeOutline />
      </n-icon>
    </n-popselect>
    <n-date-picker
      v-if="aggregation_data.time_range === 'custom'"
      v-model:value="dateRange"
      size="small"
      class="w-300px"
      type="datetimerange"
      @update:value="checkDateRange"
    />
    <n-popselect
      v-model:value="aggregation_data.aggregate_window"
      scrollable
      :options="aggregationIntervalOptions"
      trigger="click"
      @update:value="onChangeAggregation"
    >
      <n-icon size="24" :color="aggregation_data.aggregate_window !== 'no_aggregate' ? '#0e7a0d' : ''">
        <Target20Regular />
      </n-icon>
    </n-popselect>

    <!-- Corrected the property name here -->
    <n-popselect
      v-if="aggregation_data.aggregate_window !== 'no_aggregate'"
      v-model:value="aggregation_data.aggregate_function"
      :options="statisticsOptions"
      trigger="click"
      @update:value="onChangeStatistics"
    >
      <n-icon size="24" :color="aggregation_data.aggregate_function ? '#0e7a0d' : ''">
        <Circle24Regular />
      </n-icon>
    </n-popselect>
  </NFlex>
</template>

<style scoped></style>
