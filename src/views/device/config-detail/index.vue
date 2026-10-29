<script setup lang="ts">
import { h, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { NButton, NDataTable, NDescriptions, NDescriptionsItem, NEmpty, NPagination, NSpin } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useRouterPush } from '@/hooks/common/router'
import { $t } from '@/locales'
import { deviceNative, type Device } from '@/service/api/device-native'
import { templateNative, type DeviceAccessTemplate } from '@/service/api/template-native'
import AlarmInfo from './modules/alarm-info.vue'
import Automate from './modules/automate.vue'
import NativeTemplateDataProcessing from './modules/native-template-data-processing.vue'
import NativeTemplateExtendInfo from './modules/native-template-extend-info.vue'
import NativeTemplateProtocolConfig from './modules/native-template-protocol-config.vue'
import NativeTemplateSettings from './modules/native-template-settings.vue'

const { routerPushByKey } = useRouterPush()
const route = useRoute()
const configId = ref(typeof route.query.id === 'string' ? route.query.id : '')
const template = ref<DeviceAccessTemplate | null>(null)
const templateLoading = ref(false)
const templateError = ref('')
const deviceRows = ref<Device[]>([])
const deviceTotal = ref(0)
const devicePage = ref(1)
const devicePageSize = ref(20)
const devicesLoading = ref(false)
const devicesError = ref('')
let templateRequestSeq = 0
let devicesRequestSeq = 0

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
function requestedTabKey() {
  const requested = String(route.query.tab ?? '')
  return requested === tabKeys.automate || requested === tabKeys.alarm ? requested : ''
}
const activeName = ref(requestedTabKey() || tabKeys.associatedDevices)

const deviceKindLabel = (kind?: string) => {
  if (kind === 'standalone') return $t('generate.direct-connected-device')
  if (kind === 'gateway') return $t('generate.gateway')
  if (kind === 'subdevice') return $t('generate.gateway-sub-device')
  return kind || '—'
}

async function getTemplate() {
  const sequence = ++templateRequestSeq
  templateLoading.value = true
  templateError.value = ''
  template.value = null
  if (!configId.value) {
    templateError.value = '缺少设备模板 ID。'
    templateLoading.value = false
    return
  }
  try {
    const result = await templateNative.get(configId.value)
    if (sequence === templateRequestSeq) template.value = result.template
  } catch (error) {
    if (sequence === templateRequestSeq) {
      templateError.value = error instanceof Error ? error.message : '设备模板加载失败。'
    }
  } finally {
    if (sequence === templateRequestSeq) templateLoading.value = false
  }
}

async function getAssociatedDevices() {
  const sequence = ++devicesRequestSeq
  devicesLoading.value = true
  devicesError.value = ''
  if (!configId.value) {
    deviceRows.value = []
    deviceTotal.value = 0
    devicesError.value = '缺少设备模板 ID。'
    devicesLoading.value = false
    return
  }
  try {
    const result = await deviceNative.list({
      templateId: configId.value,
      page: devicePage.value,
      pageSize: devicePageSize.value
    })
    if (sequence === devicesRequestSeq) {
      deviceRows.value = result.items
      deviceTotal.value = result.total
    }
  } catch (error) {
    if (sequence === devicesRequestSeq) {
      deviceRows.value = []
      deviceTotal.value = 0
      devicesError.value = error instanceof Error ? error.message : '关联设备加载失败。'
    }
  } finally {
    if (sequence === devicesRequestSeq) devicesLoading.value = false
  }
}

function changeDevicePage(page: number) {
  devicePage.value = page
  void getAssociatedDevices()
}

function openDevice(id: string) {
  routerPushByKey('device_details', { query: { d_id: id } })
}

function editTemplate() {
  if (!template.value) return
  routerPushByKey('device_config-edit', { query: { id: configId.value } })
}

const deviceColumns: DataTableColumns<Device> = [
  {
    title: $t('custom.devicePage.deviceName'),
    key: 'name',
    render: row =>
      h(NButton, { text: true, type: 'primary', onClick: () => openDevice(row.id) }, { default: () => row.name || '—' })
  },
  { title: $t('page.irrigation.group.deviceCode'), key: 'deviceNumber' },
  { title: $t('generate.device-type'), key: 'deviceKind', render: row => deviceKindLabel(row.deviceKind) },
  { title: '管理状态', key: 'administrativeState' }
]

watch(
  () => route.query.id,
  value => {
    configId.value = typeof value === 'string' ? value : ''
    devicePage.value = 1
    activeName.value = requestedTabKey() || tabKeys.associatedDevices
    void getTemplate()
    void getAssociatedDevices()
  },
  { immediate: true }
)

watch(
  () => route.query.tab,
  () => {
    const requested = requestedTabKey()
    if (requested) activeName.value = requested
  }
)
</script>

<template>
  <div class="h-full overflow-auto">
    <NCard :title="template?.name || '设备模板'">
      <template #header-extra>
        <NButton type="primary" :disabled="!template" @click="editTemplate">{{ $t('common.edit') }}</NButton>
      </template>

      <NAlert type="warning" :show-icon="false" class="mb-4">
        关联设备、物模型、协议配置、数据处理、扩展信息、设备设置、自动化与告警已接原生链路；其中协议配置、数据处理、设备设置的运行验收仍在进行。
      </NAlert>
      <NAlert v-if="templateError" type="error" :show-icon="false" class="mb-4">
        {{ templateError }}
      </NAlert>
      <NSpin :show="templateLoading">
        <div v-if="template" class="mb-4 flex items-center gap-6">
          <span>{{ $t('generate.deviceAccessType') }}：{{ deviceKindLabel(template.configuration.deviceKind) }}</span>
          <span>
            物模型：
            <template v-if="template.configuration.model">
              {{ template.configuration.model.modelId }} · v{{ template.configuration.model.publishedRevision }}
            </template>
            <template v-else>未绑定</template>
          </span>
        </div>
      </NSpin>

      <n-tabs v-model:value="activeName" animated type="line">
        <n-tab-pane :name="tabKeys.associatedDevices" :tab="$t('common.associatedDevices')">
          <NAlert v-if="devicesError" type="error" :show-icon="false" class="mb-3">{{ devicesError }}</NAlert>
          <NSpin :show="devicesLoading">
            <NEmpty
              v-if="!devicesLoading && !devicesError && deviceRows.length === 0"
              description="此模板当前没有关联设备。"
            />
            <NDataTable v-else :columns="deviceColumns" :data="deviceRows" :pagination="false" />
            <NPagination
              v-if="deviceTotal > devicePageSize"
              class="mt-4 justify-end"
              :page="devicePage"
              :page-size="devicePageSize"
              :item-count="deviceTotal"
              @update:page="changeDevicePage"
            />
          </NSpin>
        </n-tab-pane>
        <n-tab-pane :name="tabKeys.thingModel" :tab="$t('common.thingModel')">
          <template v-if="template?.configuration.model">
            <NDescriptions bordered :column="2" size="small">
              <NDescriptionsItem label="物模型 ID">{{ template.configuration.model.modelId }}</NDescriptionsItem>
              <NDescriptionsItem label="已发布版本">
                v{{ template.configuration.model.publishedRevision }}
              </NDescriptionsItem>
            </NDescriptions>
            <p class="mt-3 text-gray-500">此处显示模板当前选择的已发布版本。修改请使用模板编辑页。</p>
          </template>
          <NEmpty v-else description="此模板当前未绑定物模型。" />
        </n-tab-pane>
        <n-tab-pane :name="tabKeys.protocolConfig" :tab="$t('common.protocolConfig')" display-directive="show:lazy">
          <NativeTemplateProtocolConfig :id="configId" @change="getTemplate" />
        </n-tab-pane>
        <n-tab-pane :name="tabKeys.dataProces" :tab="$t('common.dataProces')" display-directive="show:lazy">
          <NativeTemplateDataProcessing :id="configId" @change="getTemplate" />
        </n-tab-pane>
        <n-tab-pane :name="tabKeys.automate" :tab="$t('custom.device_details.automate')">
          <Automate :config_id="configId" />
        </n-tab-pane>
        <n-tab-pane :name="tabKeys.alarm" :tab="$t('route.alarm')">
          <AlarmInfo :config_id="configId" />
        </n-tab-pane>
        <n-tab-pane :name="tabKeys.extensionInfo" :tab="$t('generate.extension-info')" display-directive="show:lazy">
          <NativeTemplateExtendInfo :id="configId" @change="getTemplate" />
        </n-tab-pane>
        <n-tab-pane :name="tabKeys.devicesSetting" :tab="$t('common.devicesSetting')" display-directive="show:lazy">
          <NativeTemplateSettings :id="configId" @change="getTemplate" />
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
