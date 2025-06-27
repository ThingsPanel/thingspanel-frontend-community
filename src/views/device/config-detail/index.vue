<script lang="ts" setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { NButton } from 'naive-ui'
import { deviceConfigInfo, deviceTemplateDetail } from '@/service/api/device'
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
const configId = ref(route.query.id || '')

const configForm = ref({
  id: route.query.id || '',
  additional_info: null,
  description: null,
  device_conn_type: null,
  device_template_id: null,
  device_template_name: '',
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
const getTemplateDetail = async (templateId: string) => {
  const res = await deviceTemplateDetail({ id: templateId })
  if (res.data) {
    configForm.value.device_template_name = res.data.name
  }
}
const getConfig = async () => {
  const res = await deviceConfigInfo({ id: configId.value })
  configForm.value = res.data
  if (configForm.value.device_template_id) {
    configForm.value.device_template_name = ''
    getTemplateDetail(configForm.value.device_template_id)
  }
}
const activeName = ref('关联设备')
// configId.value = <string>route.query.id || ''
if (configId.value) {
  getConfig()
  activeName.value = '关联设备'
}
const clickConfig: () => void = () => {
  routerPushByKey('device_template', {
    query: {
      id: configForm.value.device_template_id
    }
  })
}
</script>

<template>
  <div class="h-full overflow-hidden">
    <NCard :title="configForm?.name || '--'">
      <template #header-extra>
        <NButton type="primary" @click="editConfig">{{ "编辑" }}</NButton>
      </template>
      <div class="mb-4 flex">
        {{ "设备接入类型：" }}
        <template v-if="configForm.device_type === '1'">{{ "直连设备" }}</template>
        <template v-if="configForm.device_type === '2'">{{ "网关" }}</template>
        <template v-if="configForm.device_type === '3'">{{ "网关子设备" }}</template>
        <div class="ml-20">
          {{ "设备模型" }}：
          <span style="color: blue; cursor: pointer" @click="clickConfig">
            {{
              configForm.device_template_name || configForm.device_template_name === ''
                ? configForm.device_template_name
                : "未绑定"
            }}
          </span>
        </div>
      </div>

      <n-tabs v-model:value="activeName" animated type="line">
        <n-tab-pane :name="关联设备" :tab="关联设备">
          <AssociatedDevices :device-config-id="configId" />
        </n-tab-pane>
        <n-tab-pane :name="属性和功能" :tab="属性和功能">
          <AttributeInfo :config-info="configForm" @up-date-config="getConfig" />
        </n-tab-pane>
        <n-tab-pane :name="协议配置" :tab="协议配置">
          <ConnectionInfo :config-info="configForm" @up-date-config="getConfig" />
        </n-tab-pane>
        <n-tab-pane :name="数据处理" :tab="数据处理">
          <DataHandle :config-info="configForm" />
        </n-tab-pane>
        <n-tab-pane :name="自动化" :tab="自动化">
          <Automate :config_id="configId" />
        </n-tab-pane>
        <n-tab-pane :name="告警" :tab="告警">
          <AlarmInfo :config_id="configId" />
        </n-tab-pane>
        <n-tab-pane :name="扩展信息" :tab="扩展信息">
          <ExtendInfo :config-info="configForm" @up-date-config="getConfig" />
        </n-tab-pane>
        <n-tab-pane :name="设备设置" :tab="设备设置">
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
