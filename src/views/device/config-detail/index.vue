<script lang="ts" setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { NButton } from 'naive-ui'
import { loadPublishedSnapshot } from '@/service/api/native-template-binding'
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
const modelName = ref('')
let configRequest = 0
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
  const request = ++configRequest
  const res = await deviceConfigInfo({ id: configId.value })
  if (request !== configRequest) return
  configForm.value = res.data
  modelName.value = ''
  const { native_thing_model_id: modelID, native_thing_model_revision: revision } = res.data || {}
  if (modelID && revision) {
    try {
      const snapshot = await loadPublishedSnapshot(modelID, revision)
      if (request === configRequest) modelName.value = snapshot.model.name
    } catch {
      // Keep the binding identifier and navigation available when metadata cannot be read.
    }
  }
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
      <div class="template-summary">
        <div class="summary-item">
          <span class="summary-label">设备接入类型</span>
          <span class="summary-value">
            <template v-if="configForm.device_type === '1'">{{ $t('generate.direct-connected-device') }}</template>
            <template v-else-if="configForm.device_type === '2'">{{ $t('generate.gateway') }}</template>
            <template v-else-if="configForm.device_type === '3'">{{ $t('generate.gateway-sub-device') }}</template>
            <template v-else>--</template>
          </span>
        </div>
        <div class="summary-item summary-model">
          <span class="summary-label">关联物模型</span>
          <div v-if="configForm.native_thing_model_id" class="model-binding">
            <RouterLink
              class="model-link"
              :to="{ path: '/device/thingsmodel/detail', query: { id: configForm.native_thing_model_id } }"
              :title="modelName || configForm.native_thing_model_id"
            >
              {{ modelName || configForm.native_thing_model_id }}
              <span aria-hidden="true" class="link-arrow">↗</span>
            </RouterLink>
            <NTag v-if="configForm.native_thing_model_revision" size="small" :bordered="false" type="primary">
              v{{ configForm.native_thing_model_revision }}
            </NTag>
          </div>
          <span v-else class="summary-empty">
            {{ configForm.device_template_id ? '绑定信息暂不可读取' : '未绑定物模型' }}
          </span>
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
.template-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 24px 48px;
  margin-bottom: 20px;
  padding: 18px 22px;
  border: 1px solid var(--n-border-color);
  border-radius: 10px;
  background: var(--n-color-embedded);
}
.summary-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 140px;
}
.summary-model {
  flex: 1;
  min-width: 0;
}
.summary-label {
  font-size: 12px;
  color: var(--n-text-color-3);
}
.summary-value {
  font-size: 14px;
  font-weight: 500;
}
.model-binding {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.model-link {
  color: var(--n-color-target, #646cff);
  font-weight: 500;
  overflow-wrap: anywhere;
}
.model-link:hover {
  text-decoration: underline;
}
.model-link:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 4px;
  border-radius: 2px;
}
.link-arrow {
  margin-left: 4px;
}
.summary-empty {
  color: var(--n-text-color-3);
}
@media (max-width: 640px) {
  .template-summary {
    flex-direction: column;
    gap: 18px;
    padding: 16px;
  }
}
</style>
