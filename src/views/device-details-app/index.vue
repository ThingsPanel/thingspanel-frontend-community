<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ThingsVisWidget from '@/components/thingsvis/ThingsVisWidget.vue';
import { extractPlatformFields } from '@/utils/thingsvis/platform-fields';
import { normalizeThingsVisHistoryBindings } from '@/utils/thingsvis/normalize-history-bindings';
import { $t, setLocale } from '@/locales';
import { deviceDetail, deviceTemplateDetail, telemetryDataCurrent, getAttributeDataSet } from '@/service/api/device';
import { telemetryApi, attributesApi, eventsApi, commandsApi } from '@/service/api';
import { formatDateTime } from '@/utils/common/datetime';
import { localStg } from '@/utils/storage';
import type { PlatformField } from '@/utils/thingsvis/types';
import TelemetryDataCards from './telemetryDataCards.vue';
import { useHistoryBackfill } from '@/hooks/thingsvis/useHistoryBackfill';
import { useRealtimePush } from '@/hooks/thingsvis/useRealtimePush';
import { useAlarmPush } from '@/hooks/thingsvis/useAlarmPush';

const route = useRoute();
const router = useRouter();
const { d_id, token, lang } = route.query;
const deviceData: any = ref({});

if (token) {
  localStg.set('token', token as string);

  const hash = window.location.hash;
  if (hash.includes('token=')) {
    const [path, queryStr] = hash.split('?');
    if (queryStr) {
      const params = new URLSearchParams(queryStr);
      params.delete('token');
      const newQuery = params.toString();
      const newHash = path + (newQuery ? `?${newQuery}` : '');
      const newUrl = window.location.href.replace(hash, newHash);
      window.history.replaceState({}, '', newUrl);
    }
  }
}

if (!localStg.get('token')) {
  router.push({ name: 'login' });
}

if (lang) {
  setLocale(lang as App.I18n.LangType);
}

const icon_type = ref('');
const device_number = ref('');
const showDefaultCards = ref(false);
const showAppChart = ref(false);
const cardHeight = ref(160);
const cardMargin = ref(15);

const initialConfig = ref<any>(null);
const platformFields = ref<PlatformField[]>([]);
const currentData = ref<Record<string, any>>({});
const viewerPlatformDevices = computed(() => {
  if (!d_id || platformFields.value.length === 0) return [];
  return [
    {
      deviceId: d_id as string,
      deviceName: deviceData.value?.name || device_number.value || 'Device',
      fields: platformFields.value
    }
  ];
});

const visWidgetRef = ref<InstanceType<typeof ThingsVisWidget> | null>(null);
const deviceIdRef = computed(() => d_id as string);

const realtimePush = ref<ReturnType<typeof useRealtimePush> | null>(null);
const alarmPush = ref<ReturnType<typeof useAlarmPush> | null>(null);
const historyBackfill = ref<ReturnType<typeof useHistoryBackfill> | null>(null);

const pushDataToVis = (fields: Record<string, unknown>) => {
  if (Object.keys(fields).length === 0) return;
  currentData.value = {
    ...currentData.value,
    ...fields
  };
  visWidgetRef.value?.pushPlatformData(fields, d_id as string);
};

const pushHistoryToVis = (fieldId: string, history: Array<{ value: unknown; ts: number }>) => {
  visWidgetRef.value?.pushHistory(fieldId, history, d_id as string);
};

const fetchDeviceData = async () => {
  if (!showAppChart.value) return;

  try {
    const hasAttributes = platformFields.value.some(f => f.dataType === 'attribute');

    const [telemetryRes, attributeRes] = await Promise.all([
      telemetryDataCurrent(d_id as string),
      hasAttributes ? getAttributeDataSet({ device_id: d_id as string }) : Promise.resolve({ data: [] })
    ]);

    const telemetryList = telemetryRes?.data || [];
    const attributeList = attributeRes?.data || [];

    const kvMap: Record<string, any> = {};
    const processItem = (item: any) => {
      if (item?.key !== undefined) {
        kvMap[item.key] = item.value;
      } else if (item?.label !== undefined) {
        if (!kvMap[item.label]) kvMap[item.label] = item.value;
      }
    };

    if (Array.isArray(telemetryList)) telemetryList.forEach(processItem);
    if (Array.isArray(attributeList)) attributeList.forEach(processItem);

    const dataMap: Record<string, any> = {};
    platformFields.value.forEach(field => {
      const val = kvMap[field.id] ?? kvMap[field.name];
      if (val !== undefined) {
        dataMap[field.id] = val;
      }
    });

    if (Object.keys(dataMap).length > 0) {
      currentData.value = {
        ...currentData.value,
        ...dataMap
      };
      pushDataToVis(dataMap);
    }
  } catch (error) {
    console.error('[DeviceDetailsApp] 获取设备数据失败:', error);
  }
};

const getDeviceDetail = async () => {
  const { data, error } = await deviceDetail(d_id);
  if (error) return;

  deviceData.value = data;
  device_number.value = data.device_number;
  icon_type.value = data.is_online !== 0 ? 'rgb(2,153,52)' : '#ccc';
  showDefaultCards.value = false;
  showAppChart.value = false;
  initialConfig.value = null;

  if (!data.device_config?.device_template_id) {
    showDefaultCards.value = true;
    return;
  }

  const templateId = data.device_config.device_template_id;
  const res = await deviceTemplateDetail({ id: templateId });
  if (!res.data) {
    showDefaultCards.value = true;
    return;
  }

  const [telemetryRes, attributesRes, eventsRes, commandsRes] = await Promise.all([
    telemetryApi({ page: 1, page_size: 1000, device_template_id: templateId }),
    attributesApi({ page: 1, page_size: 1000, device_template_id: templateId }),
    eventsApi({ page: 1, page_size: 1000, device_template_id: templateId }),
    commandsApi({ page: 1, page_size: 1000, device_template_id: templateId })
  ]);

  const telemetryList = Array.isArray(telemetryRes?.data?.list)
    ? telemetryRes.data.list
    : Array.isArray(telemetryRes?.data)
      ? telemetryRes.data
      : [];

  const attributesList = Array.isArray(attributesRes?.data?.list)
    ? attributesRes.data.list
    : Array.isArray(attributesRes?.data)
      ? attributesRes.data
      : [];

  const eventsList = Array.isArray(eventsRes?.data?.list)
    ? eventsRes.data.list
    : Array.isArray(eventsRes?.data)
      ? eventsRes.data
      : [];

  const commandsList = Array.isArray(commandsRes?.data?.list)
    ? commandsRes.data.list
    : Array.isArray(commandsRes?.data)
      ? commandsRes.data
      : [];

  const platformSource = {
    telemetry: telemetryList,
    attributes: attributesList,
    events: eventsList,
    commands: commandsList
  };

  const extractedFields = extractPlatformFields(platformSource);
  platformFields.value = extractedFields.length > 0 ? extractedFields : extractPlatformFields(res.data);

  if (!res.data.app_chart_config) {
    showDefaultCards.value = true;
    return;
  }

  try {
    const configJson = normalizeThingsVisHistoryBindings(JSON.parse(res.data.app_chart_config));

    if (configJson.dataSources && Array.isArray(configJson.dataSources)) {
      configJson.dataSources.forEach((ds: any) => {
        if (ds.type === 'PLATFORM_FIELD') {
          ds.config = ds.config || {};
          ds.config.deviceId = d_id as string;
        }
      });
    }

    initialConfig.value = configJson;
    showAppChart.value = true;

    realtimePush.value?.stop();
    alarmPush.value?.stop();

    realtimePush.value = useRealtimePush(deviceIdRef, platformFields, pushDataToVis, fetchDeviceData);
    alarmPush.value = useAlarmPush(deviceIdRef, platformFields, pushDataToVis, pushHistoryToVis);
    historyBackfill.value = useHistoryBackfill(deviceIdRef, platformFields, pushHistoryToVis);

    realtimePush.value.start();
    alarmPush.value.start();
  } catch (e) {
    console.warn('解析 app_chart_config 失败', e);
    showDefaultCards.value = true;
  }
};

const onVisReady = async () => {
  if (historyBackfill.value) await historyBackfill.value.backfill();
  if (alarmPush.value) await alarmPush.value.backfillAlarmHistory();

  setTimeout(async () => {
    await fetchDeviceData();
  }, 500);
};

onMounted(() => {
  getDeviceDetail();
});

onBeforeUnmount(() => {
  realtimePush.value?.stop();
  alarmPush.value?.stop();
});
</script>

<template>
  <div class="mx-auto max-w-md rounded-3xl bg-gray-50 p-6 shadow-lg">
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl text-gray-900 font-semibold">{{ deviceData?.name || '--' }}</h1>
      <div class="flex items-center">
        <SvgIcon
          local-icon="CellTowerRound"
          style="margin-right: 5px"
          class="color-ccc text-20px text-primary"
          :stroke="icon_type"
        />
        <span class="text-sm text-blue-500 font-medium">
          {{ deviceData?.is_online === 1 ? $t('custom.device_details.online') : $t('custom.device_details.offline') }}
        </span>
        <template v-if="deviceData?.alarmStatus === true">
          <SvgIcon
            local-icon="AlertFilled"
            style="color: #ee0808; margin-right: 5px"
            class="text-20px text-primary"
            :stroke="icon_type"
          />
          <span style="color: #ee0808">{{ $t('custom.device_details.alarm') }}</span>
        </template>
      </div>
    </div>

    <div class="mb-6 text-sm text-gray-500">
      {{ $t('custom.device_details.lastUpdate') }}: {{ formatDateTime(deviceData?.ts) || '--' }}
    </div>

    <n-divider title-placement="left"></n-divider>

    <TelemetryDataCards
      v-if="showDefaultCards"
      :id="d_id as string"
      :card-height="cardHeight"
      :card-margin="cardMargin"
    />
    <div v-if="showAppChart" class="device-details-app__viewer">
      <ThingsVisWidget
        ref="visWidgetRef"
        mode="viewer"
        :config="initialConfig"
        :data="currentData"
        :platform-fields="platformFields"
        :platform-devices="viewerPlatformDevices"
        height="min(620px, calc(100vh - 220px))"
        :buffer-size="100"
        :device-id="d_id as string"
        @ready="onVisReady"
      />
    </div>
  </div>
</template>

<style scoped>
.color-ccc {
  color: #ccc;
}

.device-details-app__viewer {
  width: calc(100% + 20px);
  margin-left: -10px;
  border-radius: 20px;
  overflow: hidden;
}

.device-details-app__viewer :deep(.thingsvis-widget-container) {
  min-height: 420px;
}

:root {
  --n-padding-left: 0px;
  --n-padding-right: 0px;
}

:deep(.n-card__content) {
  padding-left: 5px !important;
  padding-right: 5px !important;
}
</style>
