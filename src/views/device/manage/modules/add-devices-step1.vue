<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { FormInst } from 'naive-ui'
import { useDialog, useMessage } from 'naive-ui'
import { deviceAdd } from '@/service/api/device'
import { getMarketTemplates, installFromMarket } from '@/service/api/market'
import { $t } from '@/locales'
import MarketLoginModal from '../../config/modules/market-login-modal.vue'
import { useMarketAuth } from '../../config/composables/use-market-auth'

const props = defineProps<{
  configOptions: any[]
  nextCallback: () => void
  setIdCallback: (dId, cId, dobj) => void
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

    installedLocalOptions.value.push({
      id: deviceConfigId,
      name: data?.device_config?.name || option.name
    })
    applyLocalSelection(`local:${deviceConfigId}`)
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
    message.error(`${$t('market.installFailed')}: ${error?.message || ''}`)
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
  if (installLoading.value) return
  formRef.value?.validate(async errors => {
    if (!errors) {
      const res = await deviceAdd({ ...formValue.value, label: formValue.value.label.join(','), access_way: 'A' })
      const configId = formValue.value.device_config_id
      const deviceId = res.data.id
      props.setIdCallback(deviceId, configId, res.data.voucher)
      props.nextCallback()
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
          <n-input v-model:value="formValue.name" :placeholder="$t('custom.devicePage.inputDeviceName')" />
        </n-form-item>
        <n-form-item :label="$t('custom.devicePage.label')" path="label">
          <n-dynamic-tags v-model:value="formValue.label" />
        </n-form-item>
        <n-form-item :label="$t('device_template.equipmentConfig')" path="device_config_id">
          <n-select
            :value="selectedTemplateValue"
            :placeholder="$t('custom.devicePage.selectDeviceConfig')"
            :options="templateOptions"
            :loading="marketLoading"
            :disabled="installLoading"
            filterable
            @update:value="handleTemplateChange"
          />
        </n-form-item>
        <n-form-item>
          <n-button
            type="primary"
            attr-type="button"
            :loading="installLoading"
            :disabled="installLoading"
            @click="handleValidateClick"
          >
            {{ $t('custom.devicePage.saveAndNext') }}
          </n-button>
        </n-form-item>
      </n-form>
    </n-card>
    <MarketLoginModal ref="marketLoginRef" @login-success="onMarketLoginSuccess" />
  </div>
</template>

<style scoped></style>
