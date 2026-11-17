<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useMessage } from 'naive-ui'
import MqttLoginFields from '@/views/device/shared/mqtt-login-fields.vue'
import type { Device } from '@/service/api/device-native'
import { DeviceCredentialNativeError, deviceCredentialsNative } from '@/service/api/device-credentials-native'
import type { DeviceCredentialSecret } from '@/service/api/device-credentials-native'
import { deviceRuntimeNative } from '@/service/api/device-runtime-native'
import type { ConnectionInfo } from '@/service/api/device-runtime-native-transport'
import type { FirstCredentialKind } from './native-device-registration'

const props = defineProps<{
  device: Device
  credentialKind: FirstCredentialKind | null
  onBack: () => void
  onDetails: () => void
}>()

const message = useMessage()
const issuing = ref(false)
const refreshing = ref(false)
const denied = ref(false)
const errorText = ref('')
const result = ref<DeviceCredentialSecret | null>(null)
const connection = ref<ConnectionInfo | null>(null)
const requestKey = `first-credential-${props.device.id}`
let timer: ReturnType<typeof setInterval> | undefined

async function issueCredential() {
  if (!props.credentialKind || issuing.value || denied.value || result.value) return
  issuing.value = true
  errorText.value = ''
  try {
    const response = await deviceCredentialsNative.create(props.device.id, { kind: props.credentialKind }, requestKey)
    result.value = response.credential
    void refreshConnection()
  } catch (error) {
    denied.value = error instanceof DeviceCredentialNativeError && error.status === 403
    errorText.value = denied.value
      ? '设备已保存。请让有权限的管理员在设备详情的「连接」页生成登录信息。'
      : '暂时无法确认登录信息是否已生成。可以在这里重试，设备只会登记一次。'
  } finally {
    issuing.value = false
  }
}

async function refreshConnection() {
  if (refreshing.value) return
  refreshing.value = true
  const current = result.value
  try {
    await Promise.allSettled([
      deviceRuntimeNative.readConnectionInfo(props.device.id).then(info => {
        connection.value = info
      }),
      current &&
        deviceCredentialsNative.list(props.device.id, { page: 1, pageSize: 20 }).then(page => {
          const credential = page.items.find(item => item.id === current.credential.id)
          if (credential) result.value = { ...current, credential, secret: credential.secret ?? current.secret }
        })
    ])
  } finally {
    refreshing.value = false
  }
}

async function copy(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    message.success('已复制')
  } catch {
    message.warning('无法访问剪贴板，请选中文字后复制。')
  }
}

onMounted(() => {
  if (props.credentialKind) void issueCredential()
  let remaining = 24
  timer = setInterval(() => {
    if (--remaining <= 0 || (result.value && result.value.credential.status !== 'pending')) clearInterval(timer)
    else if (result.value) void refreshConnection()
  }, 5000)
})
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <n-card title="设备已创建" :bordered="false">
    <p class="mb-4">{{ device.name }} · {{ device.deviceNumber }}</p>
    <n-alert v-if="issuing" type="info" class="mb-4">正在生成设备登录信息…</n-alert>
    <n-alert v-else-if="errorText" type="warning" class="mb-4">
      {{ errorText }}
      <n-button v-if="!denied" size="small" class="ml-2" @click="issueCredential">重试生成</n-button>
    </n-alert>
    <template v-if="result">
      <n-alert :type="result.credential.status === 'active' ? 'success' : 'info'" class="mb-4">
        {{
          result.credential.status === 'active'
            ? '登录信息已生效。使用下方信息登录 MQTT。'
            : result.credential.status === 'revoked'
              ? '这组登录信息已撤销，请到设备详情查看。'
              : '登录信息已生成，正在等待设备平台确认下发。'
        }}
      </n-alert>
      <template v-if="result.credential.status !== 'revoked'">
        <n-descriptions title="MQTT 连接信息" bordered :column="1" class="mb-3">
          <n-descriptions-item label="服务器地址">
            {{ connection?.endpoint || '请使用部署环境提供的 MQTT 地址' }}
            <n-button v-if="connection?.endpoint" text class="ml-2" @click="copy(connection.endpoint)">
              复制地址
            </n-button>
          </n-descriptions-item>
        </n-descriptions>
        <MqttLoginFields
          :kind="result.credential.kind"
          :public-identifier="result.credential.publicIdentifier"
          :secret="result.secret"
        />
      </template>
    </template>
    <n-alert v-else-if="!credentialKind" type="info" class="mb-4">
      请到设备详情的「连接」页查看此设备的接入方式。
    </n-alert>
    <div class="mt-4 flex flex-wrap justify-end gap-2">
      <n-button :disabled="issuing" @click="onBack">返回设备列表</n-button>
      <n-button v-if="result" :loading="refreshing" @click="refreshConnection">刷新连接状态</n-button>
      <n-button type="primary" :disabled="issuing" @click="onDetails">打开连接设置</n-button>
    </div>
  </n-card>
</template>
