<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { notificationV2, NotificationClientError } from '@/service/api/notification-v2'

const props = defineProps<{ plugin: string }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const { locale } = useI18n()
const tx = (zh: string, en: string) => (locale.value.startsWith('zh') ? zh : en)
const smtp = computed(() => props.plugin === 'thingspanel.smtp')
const address = ref('')
const savedAddress = ref('')
const secret = ref('')
const hasSecret = ref(false)
const version = ref<number | null>(null)
const busy = ref(false)
const error = ref('')
const needsSecret = computed(() => !smtp.value && (!hasSecret.value || address.value.trim() !== savedAddress.value))
async function read() {
  busy.value = true
  error.value = ''
  version.value = null
  secret.value = ''
  try {
    const { data } = await notificationV2.providerSettings(props.plugin)
    address.value = savedAddress.value = data.address
    hasSecret.value = data.hasSecret
    version.value = data.version
  } catch {
    error.value = tx(
      '无法读取插件配置，请检查插件服务后重试。',
      'Could not load settings. Check the plugin service and retry.'
    )
  } finally {
    busy.value = false
  }
}
async function save() {
  if (version.value === null || busy.value) return
  busy.value = true
  error.value = ''
  try {
    await notificationV2.saveProviderSettings(props.plugin, {
      version: version.value,
      address: address.value.trim(),
      ...(secret.value ? { secret: secret.value } : {})
    })
    secret.value = ''
    emit('saved')
    emit('close')
  } catch (e) {
    if (e instanceof NotificationClientError && e.httpStatus === 409) {
      version.value = null
      error.value = tx('配置已更新，请重新读取。', 'Settings changed. Reload before saving.')
    } else {
      error.value = tx('保存失败，请核对服务地址和配置后重试。', 'Save failed. Check the service address and settings.')
    }
  } finally {
    busy.value = false
  }
}
onMounted(read)
</script>
<template>
  <NModal
    show
    preset="card"
    class="w-560px max-w-95vw"
    :title="smtp ? tx('邮箱服务配置', 'Email service settings') : tx('App 推送配置', 'App push settings')"
    :mask-closable="!busy"
    @update:show="emit('close')"
  >
    <NForm label-placement="top" :disabled="busy || version === null" @submit.prevent="save">
      <NFormItem
        :label="
          smtp
            ? tx('允许的 SMTP 服务器和端口', 'Allowed SMTP hosts and ports')
            : tx('UniPush 云函数地址', 'UniPush function URL')
        "
      >
        <NInput v-model:value="address" :placeholder="smtp ? 'smtp.163.com:465' : 'https://…'" />
      </NFormItem>
      <NFormItem v-if="!smtp" :label="tx('云函数调用凭据', 'Cloud credential')">
        <NInput
          v-model:value="secret"
          type="password"
          autocomplete="new-password"
          :placeholder="
            needsSecret
              ? tx('请输入调用凭据', 'Enter credential')
              : tx('已保存，留空可保留', 'Saved. Leave blank to keep')
          "
        />
      </NFormItem>
    </NForm>
    <NAlert v-if="error" type="error">{{ error }}</NAlert>
    <template #footer>
      <NSpace justify="end">
        <NButton @click="emit('close')">{{ tx('关闭', 'Close') }}</NButton>
        <NButton v-if="version === null && error" @click="read">{{ tx('重新读取', 'Reload') }}</NButton>
        <NButton
          type="primary"
          :loading="busy"
          :disabled="version === null || !address.trim() || (needsSecret && !secret)"
          @click="save"
        >
          {{ tx('保存', 'Save') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
