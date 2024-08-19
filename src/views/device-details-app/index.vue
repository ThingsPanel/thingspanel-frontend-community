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
  <div>
    <n-card>
      <div>
        <div class="flex -mt-1">
          <span class="mr-5">{{ deviceData?.name || '--' }}</span>
        </div>

        <NFlex class="mt-2">
          <div class="mr-4 flex">
            <SvgIcon
              local-icon="CellTowerRound"
              style="margin-right: 5px"
              class="color-ccc text-20px text-primary"
              :stroke="icon_type"
            />
            <span :style="{ color: device_color }">
              {{
                deviceData?.is_online === 1 ? $t('custom.device_details.online') : $t('custom.device_details.offline')
              }}
            </span>
          </div>
          <div class="mr-4 flex">
            <SvgIcon local-icon="AlertFilled" class="color-ccc mr-1 text-20px text-primary" :stroke="icon_type" />
            <span class="color-ccc">
              {{ $t('custom.device_details.noAlarm') }}
            </span>
          </div>
          <div class="mr-4 flex">
            <span class="color-ccc">上报时间：{{ formatDateTime(deviceData?.update_at) || '--' }}</span>
          </div>
        </NFlex>
      </div>
      <n-divider title-placement="left"></n-divider>
      <div>
        <TelemetryDataCards
          v-if="showDefaultCards"
          :id="d_id as string"
          :card-height="cardHeight"
          :card-margin="cardMargin"
        />
        <CardRender
          v-if="showAppChart"
          ref="cr"
          :layout="layout"
          :is-preview="true"
          :col-num="3"
          :default-card-col="3"
          :row-height="85"
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
    </n-card>
  </div>
</template>

<style scoped>
.color-ccc {
  color: #ccc;
}
</style>
