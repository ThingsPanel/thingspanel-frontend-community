<script setup lang="tsx">
import { onMounted, ref } from 'vue';
import { MovingNumbers } from 'moving-numbers-vue3';
import { Activity } from '@vicons/tabler';
import { DocumentOnePage24Regular } from '@vicons/fluent';
import dayjs from 'dayjs';
import { $t } from '@/locales';
import { telemetryDataCurrent } from '@/service/api/device'; // 假设此路径正确
import { createLogger } from '@/utils/logger';
import HistoryData from '../device/details/modules/telemetry/modules/history-data.vue';
import TimeSeriesData from '../device/details/modules/telemetry/modules/time-series-data.vue';
const logger = createLogger('TelemetryData');

const props = defineProps<{
  id: string;
  cardHeight: number;
  cardMargin: number;
}>();

const telemetryData = ref<any[]>([]);
const initTelemetryData = ref<any>();
const nowTime = ref(dayjs(new Date().getTime()).format('YYYY-MM-DD HH:mm:ss'));

const showHistory = ref(false);
const telemetryId = ref();
const telemetryKey = ref();
const modelType = ref<string>('');

const fetchTelemetry = async () => {
  const { data, error } = await telemetryDataCurrent(props.id);
  if (!error && data) {
    telemetryData.value = data;
    initTelemetryData.value = data[0] || {};
    initTelemetryData.value.device_id = props.id;
  }
};

const setItemRef = (el: any) => {
  logger.info(el);
};

const isColor = (i: any) => {
  if (typeof i.value === 'string') {
    return '#cccccc';
  }
  return '';
};

const getValueClass = (value: unknown) => {
  const length = String(value ?? '').length;
  return {
    'index-style': true,
    'index-style--medium': length > 16 && length <= 48,
    'index-style--long': length > 48
  };
};

const onTapTableTools = (i: any) => {
  if (typeof i.value === 'number') {
    modelType.value = $t('custom.device_details.sequential');
    telemetryKey.value = i.key;
    telemetryId.value = i.device_id;
    showHistory.value = true;
  }
};

// 在组件挂载时调用 fetchTelemetry 获取数据
onMounted(() => {
  fetchTelemetry();
});
</script>

<template>
  <n-grid :x-gap="cardMargin" :y-gap="cardMargin" cols="1 600:2 900:3 1200:4">
    <n-gi v-for="(i, index) in telemetryData" :key="i.tenant_id">
      <n-card
        class="telemetry-card"
        header-class="border-b h-36px"
        hoverable
        :style="{ minHeight: cardHeight + 'px' }"
      >
        <div class="card-body">
          <span v-if="isColor(i)" :class="getValueClass(i.value)">{{ i.value }}</span>
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
        <template #header-extra>
          <div class="h-24px w-96px flex items-center justify-end">
            <NIcon
              size="24"
              @click="
                () => {
                  modelType = $t('custom.device_details.history');
                  telemetryKey = i.key;
                  telemetryId = i.device_id;
                  showHistory = true;
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
          </div>
        </template>
      </n-card>
    </n-gi>
  </n-grid>
  <n-modal v-model:show="showHistory" :title="$t('generate.telemetry-history-data')" class="w-90%">
    <NCard>
      <HistoryData
        v-if="modelType === $t('custom.device_details.history')"
        :device-id="telemetryId"
        :the-key="telemetryKey"
      />
      <TimeSeriesData
        v-if="modelType === $t('custom.device_details.sequential')"
        :device-id="telemetryId"
        :the-key="telemetryKey"
      />
    </NCard>
  </n-modal>
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
