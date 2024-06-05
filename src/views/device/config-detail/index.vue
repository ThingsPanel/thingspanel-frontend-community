<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { NButton } from 'naive-ui';
import { deviceConfigInfo } from '@/service/api/device';
import SettingInfo from '@/views/device/config-detail/modules/setting-info.vue';
import DataHandle from '@/views/device/config-detail/modules/data-handle.vue';
import { useRouterPush } from '@/hooks/common/router';
import { $t } from '@/locales';
import AssociatedDevices from './modules/associated-devices.vue';
import ExtendInfo from './modules/extend-info.vue';
import AttributeInfo from './modules/attribute-info.vue';
import ConnectionInfo from './modules/connection-info.vue';
import AlarmInfo from './modules/alarm-info.vue';
import Automate from './modules/automate.vue';

const { routerPushByKey } = useRouterPush();
const route = useRoute();
const configId = ref(route.query.id || ('' as any));

const configForm = ref({
  id: route.query.id || '',
  additional_info: null,
  description: null,
  device_conn_type: null,
  device_template_id: null,
  device_type: '',
  name: '',
  protocol_config: null,
  protocol_type: null,
  remark: null,
  voucher_type: null
});
const editConfig = () => {
  routerPushByKey('device_config-edit', { query: { id: configId.value } });
};
const getConfig = async () => {
  const res = await deviceConfigInfo({ id: configId.value });
  console.log(res.data);
  configForm.value = res.data;
};

onMounted(async () => {
  // configId.value = <string>route.query.id || ''
  if (configId.value) {
    await getConfig();
  }
});
</script>

<template>
  <div class="h-full overflow-hidden">
    <NCard :title="configForm?.name || '--'">
      <template #header-extra>
        <NButton type="primary" @click="editConfig">{{ $t('common.edit') }}</NButton>
      </template>
      <div class="mb-4">
        {{ $t('generate.deviceAccessType') }}
        <template v-if="configForm.device_type === '1'">{{ $t('generate.direct-connected-device') }}</template>
        <template v-if="configForm.device_type === '2'">{{ $t('generate.gateway') }}</template>
        <template v-if="configForm.device_type === '3'">{{ $t('generate.gateway-sub-device') }}</template>
      </div>
      <n-tabs animated type="line">
        <n-tab-pane :name="$t('common.associatedDevices')" :tab="$t('common.associatedDevices')">
          <AssociatedDevices :device-config-id="configId" />
        </n-tab-pane>
        <n-tab-pane :name="$t('common.propertiesAndFunctions')" :tab="$t('common.propertiesAndFunctions')">
          <AttributeInfo :config-info="configForm" @up-date-config="getConfig" />
        </n-tab-pane>
        <n-tab-pane :name="$t('common.protocolConfig')" :tab="$t('common.protocolConfig')">
          <ConnectionInfo :config-info="configForm" @up-date-config="getConfig" />
        </n-tab-pane>
        <n-tab-pane :name="$t('common.dataProces')" :tab="$t('common.dataProces')">
          <DataHandle :config-info="configForm" />
        </n-tab-pane>
        <n-tab-pane :name="$t('custom.device_details.automate')" :tab="$t('custom.device_details.automate')">
          <Automate :config_id="configId" />
        </n-tab-pane>
        <n-tab-pane :name="$t('route.alarm')" :tab="$t('route.alarm')">
          <AlarmInfo :config_id="configId" />
        </n-tab-pane>
        <n-tab-pane :name="$t('generate.extension-info')" :tab="$t('generate.extension-info')">
          <ExtendInfo :config-info="configForm" @up-date-config="getConfig" />
        </n-tab-pane>
        <n-tab-pane :name="$t('common.devicesSetting')" :tab="$t('common.devicesSetting')">
          <SettingInfo :config-info="configForm" @change="getConfig" />
        </n-tab-pane>
      </n-tabs>
    </NCard>
  </div>
</template>

<style lang="scss" scoped>
:deep(.n-card-header__main) {
  width: auto;
  flex: none !important;
}

:deep(.n-card-header__extra) {
  flex: 1;
  margin-left: 20px;
}

:deep(.n-tabs) {
  height: calc(100% - 80px);
}
</style>
