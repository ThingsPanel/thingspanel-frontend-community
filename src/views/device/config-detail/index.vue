<script lang="ts" setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { NButton } from 'naive-ui'
import { deviceConfigInfo } from '@/service/api/device'
import SettingInfo from '@/views/device/config-detail/modules/setting-info.vue'
import DataHandle from '@/views/device/config-detail/modules/data-handle.vue'
import { useRouterPush } from '@/hooks/common/router'
import { $t } from '@/locales'
import AssociatedDevices from './modules/associated-devices.vue'
import ExtendInfo from './modules/extend-info.vue'
import AttributeInfo from './modules/attribute-info.vue'
import ConnectionInfo from './modules/connection-info.vue'
import AlarmInfo from './modules/alarm-info.vue'
import Automate from './modules/automate.vue'

const { routerPushByKey } = useRouterPush()
const route = useRoute()
const configId = ref<string>(typeof route.query.id === 'string' ? route.query.id : '')

const configForm = ref<any>({
  id: typeof route.query.id === 'string' ? route.query.id : '',
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
})
const editConfig = () => {
  routerPushByKey('device_config-edit', { query: { id: configId.value } })
}
const getConfig = async () => {
  const res = await deviceConfigInfo({ id: configId.value })
  configForm.value = res.data
}
const tabKeys = {
  associatedDevices: 'associatedDevices',
  thingModel: 'thingModel',
  protocolConfig: 'protocolConfig',
  dataProces: 'dataProces',
  automate: 'automate',
  alarm: 'alarm',
  extensionInfo: 'extensionInfo',
  devicesSetting: 'devicesSetting'
}

const activeName = ref(tabKeys.associatedDevices)
if (configId.value) {
  getConfig()
  activeName.value = tabKeys.associatedDevices
}
</script>

<template>
  <div class="h-full overflow-auto">
    <NCard :title="configForm?.name || '--'">
      <template #header-extra>
        <NButton type="primary" @click="editConfig">{{ $t('common.edit') }}</NButton>
      </template>
      <div class="mb-4 flex">
        {{ $t('generate.deviceAccessType') }}
        <template v-if="configForm.device_type === '1'">{{ $t('generate.direct-connected-device') }}</template>
        <template v-if="configForm.device_type === '2'">{{ $t('generate.gateway') }}</template>
        <template v-if="configForm.device_type === '3'">{{ $t('generate.gateway-sub-device') }}</template>
        <div class="ml-20">
          物模型：
          <span v-if="configForm.native_thing_model_id">
            已绑定 · v{{ configForm.native_thing_model_revision }}
          </span>
          <span v-else-if="configForm.device_template_id">已绑定（当前版本信息暂不可读取）</span>
          <span v-else>未绑定</span>
        </div>
      </div>

      <n-tabs v-model:value="activeName" animated type="line">
        <n-tab-pane :name="tabKeys.associatedDevices" :tab="$t('common.associatedDevices')">
          <AssociatedDevices :device-config-id="configId" />
        </n-tab-pane>
        <n-tab-pane :name="tabKeys.thingModel" :tab="$t('common.thingModel')">
          <AttributeInfo :config-info="configForm" @up-date-config="getConfig" />
        </n-tab-pane>
        <n-tab-pane :name="tabKeys.protocolConfig" :tab="$t('common.protocolConfig')">
          <ConnectionInfo :config-info="configForm" @up-date-config="getConfig" />
        </n-tab-pane>
        <n-tab-pane :name="tabKeys.dataProces" :tab="$t('common.dataProces')">
          <DataHandle :config-info="configForm" />
        </n-tab-pane>
        <n-tab-pane :name="tabKeys.automate" :tab="$t('custom.device_details.automate')">
          <Automate :config_id="configId" />
        </n-tab-pane>
        <n-tab-pane :name="tabKeys.alarm" :tab="$t('route.alarm')">
          <AlarmInfo :config_id="configId" />
        </n-tab-pane>
        <n-tab-pane :name="tabKeys.extensionInfo" :tab="$t('generate.extension-info')">
          <ExtendInfo :config-info="configForm" @up-date-config="getConfig" />
        </n-tab-pane>
        <n-tab-pane :name="tabKeys.devicesSetting" :tab="$t('common.devicesSetting')">
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
.flex {
  display: flex;
}
.ml-20 {
  margin-left: 20px;
}
</style>
