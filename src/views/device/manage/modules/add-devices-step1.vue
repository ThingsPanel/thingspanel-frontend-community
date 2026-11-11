<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { FormInst } from 'naive-ui'
import { useDialog, useMessage } from 'naive-ui'
import { deviceNative, DeviceNativeError } from '@/service/api/device-native'
import type { CreateDevice, Device } from '@/service/api/device-native'
import { templateNative } from '@/service/api/template-native'
import { getMarketTemplates, getMarketTemplateDetail, installFromMarket } from '@/service/api/market'
import { marketTemplateCompatibility } from '../../config/market-template-compatibility'
import {
  createNativeDeviceRegistrationAttempt,
  shouldRetainNativeDeviceRegistrationAttempt
} from './native-device-registration'
import { $t } from '@/locales'
import MarketLoginModal from '../../config/modules/market-login-modal.vue'
import { useMarketAuth } from '../../config/composables/use-market-auth'

const props = defineProps<{
  configOptions: any[]
  initialConfigId?: string
  nextCallback: () => void
  // eslint-disable-next-line no-unused-vars
  setDeviceCallback: (device: Device) => void
}>()
const formRef = ref<FormInst | null>(null)
const message = useMessage()
const dialog = useDialog()
const { isLoggedIn, getToken, clearToken } = useMarketAuth()
const marketLoginRef = ref<InstanceType<typeof MarketLoginModal>>()
const marketOptions = ref<any[]>([])
const installedLocalOptions = ref<any[]>([])
const selectedTemplateValue = ref('')
const pendingMarketOption = ref<any | null>(null)
const marketLoading = ref(false)
const installLoading = ref(false)
const creating = ref(false)
const createAttempt = ref<{ payload: CreateDevice; key: string } | null>(null)
const createOutcomeUnknown = ref(false)
const confirmedDevice = ref<Device | null>(null)
const formValue = ref({
  name: '',
  label: [],
  device_config_id: ''
})
const rules = {
  name: {
    required: true,
    message: $t('custom.devicePage.enterDeviceName'),
    trigger: 'blur'
  }
}

const localOptions = computed(() => {
  const optionMap = new Map<string, any>()
  ;[...(props.configOptions || []), ...installedLocalOptions.value].forEach(option => {
    if (option?.id) {
      optionMap.set(option.id, option)
    }
  })
  return Array.from(optionMap.values())
})

const templateOptions = computed(() => {
  const options: any[] = [
    {
      label: $t('custom.devicePage.unlimitedDeviceConfig'),
      value: ''
    }
  ]

  if (localOptions.value.length > 0) {
    options.push({
      type: 'group',
      label: $t('device_template.localTemplates'),
      key: 'local-templates',
      children: localOptions.value.map(option => ({
        label: option.name,
        value: `local:${option.id}`,
        source: 'local',
        deviceConfigId: option.id
      }))
    })
  }

  if (marketOptions.value.length > 0) {
    options.push({
      type: 'group',
      label: $t('device_template.marketTemplates'),
      key: 'market-templates',
      children: marketOptions.value.map(option => ({
        label: option.name,
        value: `market:${option.id}`,
        source: 'market',
        marketTemplateId: option.id,
        version: option.version
      }))
    })
  }

  return options
})

const fetchMarketTemplateOptions = async () => {
  marketLoading.value = true
  try {
    const res: any = await getMarketTemplates({
      page: 1,
      page_size: 99,
      sort_by: 'latest'
    })
    if (res.error) {
      message.warning($t('market.loadFailed'))
      return
    }
    marketOptions.value = res.data?.list || (Array.isArray(res.data) ? res.data : [])
  } catch {
    message.warning($t('market.loadFailed'))
  } finally {
    marketLoading.value = false
  }
}

const applyLocalSelection = (value: string) => {
  pendingMarketOption.value = null
  selectedTemplateValue.value = value
  formValue.value.device_config_id = value.startsWith('local:') ? value.slice('local:'.length) : ''
}

function applyInitialConfigSelection() {
  const configId = props.initialConfigId
  if (!configId || formValue.value.device_config_id || !localOptions.value.some(option => option.id === configId)) {
    return
  }
  applyLocalSelection(`local:${configId}`)
}

watch([() => props.initialConfigId, localOptions], applyInitialConfigSelection, { immediate: true })

const showMissingPlugins = (plugins: any[]) => {
  if (!plugins?.length) return

  const pluginNames = plugins
    .map(plugin => {
      const version = plugin.min_version ? ` (≥${plugin.min_version})` : ''
      const required = plugin.required ? $t('market.pluginRequired') : $t('market.pluginOptional')
      return `${plugin.plugin_name}${version} [${required}]`
    })
    .join('\n')

  dialog.warning({
    title: $t('market.missingPluginsTitle'),
    content: `${$t('market.missingPluginsMessage')}\n\n${pluginNames}\n\n${$t('market.contactAdmin')}`,
    positiveText: $t('common.confirm')
  })
}

const doInstallPendingTemplate = async () => {
  const option = pendingMarketOption.value
  const token = getToken()
  if (!option || !token || installLoading.value) return

  installLoading.value = true
  try {
    const detailRes: any = await getMarketTemplateDetail(option.id)
    const compatibility = detailRes.error ? 'unavailable' : marketTemplateCompatibility(detailRes.data, option.version)
    if (compatibility !== 'native') {
      throw new Error(
        $t(compatibility === 'legacy' ? 'market.compatibility.legacy' : 'market.compatibility.unavailable')
      )
    }
    const res: any = await installFromMarket({
      market_template_id: option.id,
      version: option.version,
      market_token: token
    })
    if (res.error) {
      throw new Error(res.error?.msg || $t('market.installFailed'))
    }

    const data = res.data
    const deviceConfigId = data?.device_config_id || data?.device_config?.id
    if (!deviceConfigId) {
      throw new Error($t('market.installFailed'))
    }

    const { template } = await templateNative.get(deviceConfigId)
    installedLocalOptions.value.push({
      id: template.id,
      name: template.name,
      deviceKind: template.configuration.deviceKind,
      accessMode: template.configuration.access.mode,
      protocol: template.configuration.access.protocol
    })
    applyLocalSelection(`local:${template.id}`)
    message.success($t('market.installSuccess'))
    showMissingPlugins(data?.missing_plugins || [])
  } catch (error: any) {
    if (error?.response?.status === 401) {
      clearToken()
      installLoading.value = false
      message.error($t('market.tokenExpired'))
      marketLoginRef.value?.open()
      return
    }
    pendingMarketOption.value = null
    message.error(error?.message || $t('market.installFailed'))
  } finally {
    installLoading.value = false
  }
}

const beginMarketTemplateInstall = (option: any) => {
  pendingMarketOption.value = option
  if (!isLoggedIn()) {
    marketLoginRef.value?.open()
    return
  }
  void doInstallPendingTemplate()
}

const handleTemplateChange = (value: string) => {
  if (!value.startsWith('market:')) {
    applyLocalSelection(value)
    return
  }

  const marketTemplateId = value.slice('market:'.length)
  const option = marketOptions.value.find(item => item.id === marketTemplateId)
  if (!option) return

  dialog.warning({
    title: $t('market.installConfirmTitle'),
    content: `${option.name}\n${$t('market.downloadRequired')}`,
    positiveText: $t('market.downloadAndUse'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => {
      beginMarketTemplateInstall(option)
    }
  })
}

const onMarketLoginSuccess = () => {
  void doInstallPendingTemplate()
}

function handleValidateClick(e: MouseEvent) {
  e.preventDefault()
  if (installLoading.value || creating.value) return
  if (confirmedDevice.value) {
    try {
      props.setDeviceCallback(confirmedDevice.value)
      props.nextCallback()
    } catch {
      message.warning('设备已登记，但页面暂未切换。请重试查看登记结果。')
    }
    return
  }
  formRef.value?.validate(async errors => {
    if (!errors) {
      creating.value = true
      let postStarted = Boolean(createAttempt.value)
      const previouslyUnknown = createOutcomeUnknown.value
      let createdDevice: Device | null = null
      try {
        if (!createAttempt.value) {
          const templateId = formValue.value.device_config_id
          const template = templateId ? (await templateNative.get(templateId)).template : null
          createAttempt.value = createNativeDeviceRegistrationAttempt(
            {
              name: formValue.value.name,
              tags: formValue.value.label,
              deviceKind: template?.configuration.deviceKind ?? 'standalone',
              ...(templateId ? { templateId } : {})
            },
            globalThis.crypto.randomUUID()
          )
        }

        const attempt = createAttempt.value
        if (!attempt) throw new Error('设备登记请求未准备好。')
        postStarted = true
        const result = await deviceNative.create(attempt.payload, attempt.key)
        createdDevice = result.device
      } catch (error) {
        const status = error instanceof DeviceNativeError ? error.status : undefined
        const retainAttempt = postStarted && shouldRetainNativeDeviceRegistrationAttempt(status, previouslyUnknown)
        createOutcomeUnknown.value = retainAttempt
        if (!retainAttempt) {
          createAttempt.value = null
        }
        message.error(
          createOutcomeUnknown.value
            ? `登记结果仍未确认${status ? `（接口状态 ${status}）` : ''}。请用相同内容重试，系统会复用原请求编号。`
            : error instanceof Error
              ? error.message
              : '设备登记失败'
        )
        return
      } finally {
        creating.value = false
      }

      if (!createdDevice) return
      createAttempt.value = null
      createOutcomeUnknown.value = false
      confirmedDevice.value = createdDevice
      try {
        props.setDeviceCallback(confirmedDevice.value)
        props.nextCallback()
      } catch {
        message.warning('设备已登记，但页面暂未切换。请返回设备列表刷新查看。')
      }
    } else {
      message.error($t('custom.devicePage.validationFailed'))
    }
  })
}

onMounted(() => {
  void fetchMarketTemplateOptions()
})
</script>

<template>
  <div>
    <n-card :bordered="false">
      <n-form ref="formRef" :label-width="80" :model="formValue" :rules="rules" size="small">
        <n-form-item :label="$t('custom.devicePage.deviceName')" path="name">
          <n-input
            v-model:value="formValue.name"
            :placeholder="$t('custom.devicePage.inputDeviceName')"
            :disabled="Boolean(createAttempt || confirmedDevice)"
          />
        </n-form-item>
        <n-form-item :label="$t('custom.devicePage.label')" path="label">
          <n-dynamic-tags v-model:value="formValue.label" :disabled="Boolean(createAttempt || confirmedDevice)" />
        </n-form-item>
        <n-form-item :label="$t('device_template.equipmentConfig')" path="device_config_id">
          <n-select
            :value="selectedTemplateValue"
            :placeholder="$t('custom.devicePage.selectDeviceConfig')"
            :options="templateOptions"
            :loading="marketLoading"
            :disabled="installLoading || Boolean(createAttempt || confirmedDevice)"
            filterable
            @update:value="handleTemplateChange"
          />
        </n-form-item>
        <n-form-item>
          <n-button
            type="primary"
            attr-type="button"
            :loading="installLoading || creating"
            :disabled="installLoading || creating"
            @click="handleValidateClick"
          >
            {{
              createOutcomeUnknown
                ? '用原内容重试登记'
                : confirmedDevice
                  ? '继续查看登记结果'
                  : $t('custom.devicePage.saveAndNext')
            }}
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>
    <MarketLoginModal ref="marketLoginRef" @login-success="onMarketLoginSuccess" />
  </div>
</template>

<style scoped></style>
