<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useLoading } from '@sa/hooks';
import { useDeviceDataStore } from '@/store/modules/device';
import Telemetry from '@/views/device/details/modules/telemetry/telemetry.vue';
import Join from '@/views/device/details/modules/join.vue';
import DeviceAnalysis from '@/views/device/details/modules/device-analysis.vue';
import Message from '@/views/device/details/modules/message.vue';
import Stats from '@/views/device/details/modules/stats.vue';
import EventReport from '@/views/device/details/modules/event-report.vue';
import CommandDelivery from '@/views/device/details/modules/command-delivery.vue';
import Automate from '@/views/device/details/modules/automate.vue';
import GiveAnAlarm from '@/views/device/details/modules/give-an-alarm.vue';
import User from '@/views/device/details/modules/user.vue';
import Settings from '@/views/device/details/modules/settings.vue';
import { $t } from '@/locales';
import { useAppStore } from '@/store/modules/app';
import { deviceDetail, deviceUpdate } from '@/service/api/device';

const { query } = useRoute();
const appStore = useAppStore();
const { d_id } = query;
const { loading, startLoading, endLoading } = useLoading();
const deviceDataStore = useDeviceDataStore();
let components = [
  { key: 'telemetry', name: () => $t('custom.device_details.telemetry'), component: Telemetry },
  { key: 'join', name: () => $t('custom.device_details.join'), component: Join },
  { key: 'device-analysis', name: () => $t('custom.device_details.deviceAnalysis'), component: DeviceAnalysis },
  { key: 'message', name: () => $t('custom.device_details.message'), component: Message },
  { key: 'stats', name: () => $t('custom.device_details.stats'), component: Stats },
  { key: 'event-report', name: () => $t('custom.device_details.eventReport'), component: EventReport },
  { key: 'command-delivery', name: () => $t('custom.device_details.commandDelivery'), component: CommandDelivery },
  { key: 'automate', name: () => $t('custom.device_details.automate'), component: Automate },
  { key: 'give-an-alarm', name: () => $t('custom.device_details.giveAnAlarm'), component: GiveAnAlarm },
  { key: 'user', name: () => $t('custom.device_details.user'), component: User },
  { key: 'settings', name: () => $t('custom.device_details.settings'), component: Settings }
];

const tabValue = ref<any>('telemetry');
const showDialog = ref(false);
const labels = ref<string[]>([]);
const device_color = ref('#ccc');
const device_type = ref('');
const icon_type = ref('');
const device_number = ref('');

const queryParams = reactive({
  label: '',
  id: '',
  name: '',
  device_number: '',
  description: ''
});
const changeTabs = v => {
  startLoading();

  tabValue.value = v;
  setTimeout(() => {
    endLoading();
  }, 500);
};
const editConfig = () => {
  showDialog.value = true;
};
const close = async () => {
  showDialog.value = false;
  deviceDataStore.fetchData(d_id as string);
};
const save = async () => {
  if (!deviceDataStore?.deviceData?.name) {
    window.NMessage.error($t('custom.devicePage.enterDeviceName'));
    return;
  }
  if (!deviceDataStore?.deviceData?.device_number) {
    window.NMessage.error($t('custom.devicePage.enterDeviceNumber'));
    return;
  }
  if (deviceDataStore?.deviceData?.device_number.length > 36) {
    window.NMessage.error($t('custom.devicePage.deviceNumberMax'));
    return;
  }
  device_number.value = deviceDataStore.deviceData.device_number;
  queryParams.id = deviceDataStore?.deviceData?.id;
  queryParams.name = deviceDataStore?.deviceData?.name;
  queryParams.device_number = deviceDataStore?.deviceData?.device_number;
  queryParams.label = labels.value.join(',');
  queryParams.description = deviceDataStore?.deviceData?.description;

  const { error } = await deviceUpdate(queryParams);
  if (!error) {
    showDialog.value = false;
    deviceDataStore.fetchData(d_id as string);
  }
};
const rules = {
  name: {
    required: true,
    message: $t('custom.devicePage.enterDeviceName'),
    trigger: 'blur'
  },
  device_number: {
    required: true,
    message: $t('custom.devicePage.enterDeviceNumber'),
    trigger: 'blur'
  }
};
const getDeviceDetail = async () => {
  const { data, error } = await deviceDetail(d_id);
  if (!error) {
    device_number.value = data.device_number;
    if (data.is_online !== 0) {
      device_color.value = 'rgb(2,153,52)';
      icon_type.value = 'rgb(2,153,52)';
    }
    if (data.device_config !== undefined) {
      device_type.value = data.device_config.device_type;
      if (device_type.value !== '2') {
        components = components.filter(item => item.key !== 'device-analysis');
      }
    } else {
      components = components.filter(item => item.key !== 'device-analysis');
    }
  }
};
onMounted(() => {
  getDeviceDetail();
  deviceDataStore.fetchData(d_id as string);
});
watch(
  () => appStore.locale,
  () => {
    console.log(appStore.locale);
    let temporary: any;
    // eslint-disable-next-line prefer-const
    temporary = tabValue.value;
    tabValue.value = '';
    setTimeout(() => {
      tabValue.value = temporary;
    }, 50);
  }
);
</script>

<template>
  <div>
    <n-card>
      <div>
        <div style="display: flex; margin-top: -5px">
          <span style="margin-right: 20px">{{ deviceDataStore?.deviceData?.name || '--' }}</span>
          <NButton v-show="true" type="primary" style="margin-top: -5px" @click="editConfig">
            {{ $t('common.edit') }}
          </NButton>
        </div>

        <n-modal v-model:show="showDialog" :title="$t('generate.issue-attribute')" class="w-[400px]">
          <n-card>
            <n-form :model="deviceDataStore.deviceData" :rules="rules">
              <div>
                <NH3>{{ $t('generate.modify-device-info') }}</NH3>
              </div>
              <n-form-item :label="$t('page.irrigation.group.deviceName')" path="name">
                <n-input v-model:value="deviceDataStore.deviceData.name" aria-required="true" />
              </n-form-item>
              <n-form-item :label="$t('generate.device-number')" path="device_number">
                <n-input v-model:value="deviceDataStore.deviceData.device_number" />
              </n-form-item>
              <n-form-item :label="$t('custom.devicePage.label')" path="label">
                <n-dynamic-tags v-model:value="labels" />
              </n-form-item>
              <n-form-item :label="$t('generate.device-description')">
                <!-- <n-input v-model:value="queryParams.deviceDescribe" type="textarea"/> -->
                <NInput v-model:value="deviceDataStore.deviceData.description" type="textarea" />
              </n-form-item>
              <n-space>
                <n-button @click="close">{{ $t('generate.cancel') }}</n-button>
                <n-button @click="save">{{ $t('common.save') }}</n-button>
              </n-space>
            </n-form>
          </n-card>
        </n-modal>

        <NFlex style="margin-top: 8px">
          <div class="mr-4">
            <span class="mr-2" style="color: #ccc">ID:</span>
            <span style="color: #ccc">{{ device_number || '--' }}</span>
          </div>
          <div class="mr-4" style="color: #ccc">
            <span class="mr-2">{{ $t('custom.device_details.deviceConfig') }}:</span>
            <span style="color: blue">{{ deviceDataStore?.deviceData?.device_config_name || '--' }}</span>
          </div>
          <div class="mr-4" style="display: flex">
            <!-- <span class="mr-2">{{ $t('generate.status') }}:</span> -->
            <SvgIcon
              local-icon="CellTowerRound"
              style="color: #ccc; margin-right: 5px"
              class="text-20px text-primary"
              :stroke="icon_type"
            />
            <span :style="{ color: device_color }">
              {{
                deviceDataStore?.deviceData?.is_online === 1
                  ? $t('custom.device_details.online')
                  : $t('custom.device_details.offline')
              }}
            </span>
          </div>
          <div class="mr-4" style="display: flex">
            <SvgIcon
              local-icon="AlertFilled"
              style="color: #ccc; margin-right: 5px"
              class="text-20px text-primary"
              :stroke="icon_type"
            />
            <!-- <span style="color: #ccc" class="mr-2">{{ $t('custom.device_details.alarm') }}:</span> -->

            <span style="color: #ccc">
              {{ $t('custom.device_details.noAlarm') }}
            </span>
          </div>
        </NFlex>
      </div>
      <n-divider title-placement="left"></n-divider>
      <div>
        <n-tabs v-model:value="tabValue" animated type="line" @update:value="changeTabs">
          <n-tab-pane v-for="component in components" :key="component.key" :tab="component.name" :name="component.key">
            <n-spin size="small" :show="loading">
              <component
                :is="component.component"
                :id="d_id as string"
                :device-config-id="deviceDataStore?.deviceData?.device_config_id || ''"
              />
            </n-spin>
          </n-tab-pane>
        </n-tabs>
      </div>
    </n-card>
  </div>
</template>

<style scoped></style>
