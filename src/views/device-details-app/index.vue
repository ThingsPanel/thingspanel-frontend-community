<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import type { ICardView } from '@/components/panel/card';
import { $t } from '@/locales';
import { deviceDetail, deviceTemplateDetail } from '@/service/api/device';
import { formatDateTime } from '@/utils/common/datetime';
import { localStg } from '@/utils/storage';
import TelemetryDataCards from './telemetryDataCards.vue';

const { query } = useRoute();
const { d_id, token } = query;
const deviceData: any = ref({});

if (token) {
  localStg.set('token', token as string);
}

const device_color = ref('#ccc');
const device_type = ref('');
const icon_type = ref('');
const device_number = ref('');
const layout = ref<ICardView[]>([]);
const showDefaultCards = ref(false);
const showAppChart = ref(false);
const cardHeight = ref(160); // 卡片的高度
const cardMargin = ref(15); // 卡片的间距

const getDeviceDetail = async () => {
  const { data, error } = await deviceDetail(d_id);
  if (!error) {
    deviceData.value = data;
    device_number.value = data.device_number;
    if (data.is_online !== 0) {
      device_color.value = 'rgb(2,153,52)';
      icon_type.value = 'rgb(2,153,52)';
    }
    if (data.device_config !== undefined) {
      device_type.value = data.device_config.device_type;
    }
    const res = await deviceTemplateDetail({ id: data.device_config.device_template_id });
    if (res.data) {
      if (res.data.app_chart_config) {
        const configJson = JSON.parse(res.data.app_chart_config);
        if (configJson.length > 0) {
          configJson.forEach(item => {
            item.data?.dataSource?.deviceSource?.forEach(device => {
              device.deviceId = d_id;
            });
          });
          layout.value = [...configJson];
          showAppChart.value = true;
        } else {
          showDefaultCards.value = true;
        }
      } else {
        showDefaultCards.value = true;
      }
    }
  }
};
onMounted(() => {
  getDeviceDetail();
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

    <div class="mb-6 text-sm text-gray-500">最后更新: {{ formatDateTime(deviceData?.update_at) || '--' }}</div>

    <n-divider title-placement="left"></n-divider>

    <TelemetryDataCards
      v-if="showDefaultCards"
      :id="d_id as string"
      :card-height="cardHeight"
      :card-margin="cardMargin"
    />
    <div v-if="showAppChart" style="width: calc(100% + 20px); margin-left: -10px">
      <CardRender
        ref="cr"
        class="card-render"
        :layout="layout"
        :is-preview="true"
        :col-num="4"
        :default-card-col="4"
        :row-height="85"
        :breakpoints="{ lg: 780, md: 500, sm: 0 }"
        :cols="{ lg: 12, md: 6, sm: 4 }"
      />
    </div>
    <!--
    <div>
      <n-tabs v-model:value="tabValue" animated type="line" @update:value="changeTabs">
        <n-tab-pane v-for="component in components" :key="component.key" :tab="component.name" :name="component.key">
          <n-spin size="small" :show="loading">
            <component
              :is="component.component"
              :id="d_id as string"
              :device-config-id="deviceData?.device_config_id || ''"
            />
          </n-spin>
        </n-tab-pane>
      </n-tabs>
    </div>
    -->
  </div>
</template>

<style scoped>
.color-ccc {
  color: #ccc;
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
