<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { NAlert, NButton, NCard, NForm, NFormItem, NInput, NInputNumber, NSpace } from 'naive-ui'
import {
  deviceSimulatorNative,
  DeviceSimulatorNativeError,
  FIRST_PROFILE_ETAG,
  type SimulationRun
} from '@/service/api/device-simulator-native'
import { newIdempotencyKey } from '@/service/api/device-write-attempt'

/**
 * 模拟上报（遥测）。流程：保存配置 → 创建会话 → 发送 → 关闭会话。
 * 运行是同步的：单次最多 20 条，且不按间隔发送；只支持遥测。
 */
const props = defineProps<{ id: string }>()

const MAX_SYNC = 20
const payloadText = ref('{\n  "temperature": 25\n}')
const messageCount = ref(1)
const loading = ref(false)
const sending = ref(false)
const error = ref('')
const result = ref<SimulationRun | null>(null)
const etag = ref(FIRST_PROFILE_ETAG)
const profileVersion = ref(0)

function describe(e: unknown): string {
  if (e instanceof DeviceSimulatorNativeError && e.status === 412) return '配置已被修改，请刷新后重试。'
  return e instanceof Error ? e.message : String(e)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const found = await deviceSimulatorNative.getProfile(props.id)
    if (found) {
      etag.value = found.etag
      profileVersion.value = found.profile.resourceVersion
      payloadText.value = JSON.stringify(found.profile.payload, null, 2)
    } else {
      etag.value = FIRST_PROFILE_ETAG
      profileVersion.value = 0
    }
  } catch (e) {
    error.value = describe(e)
  } finally {
    loading.value = false
  }
}

function parsePayload(): Record<string, unknown> | null {
  try {
    const value = JSON.parse(payloadText.value)
    if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>
  } catch {
    // fall through
  }
  error.value = '数据必须是 JSON 对象，例如 {"temperature": 25}。'
  return null
}

async function send() {
  error.value = ''
  result.value = null
  const payload = parsePayload()
  if (!payload) return
  const count = Math.min(Math.max(Math.trunc(messageCount.value || 1), 1), MAX_SYNC)
  sending.value = true
  let sessionId: string | null = null
  try {
    const saved = await deviceSimulatorNative.saveProfile(
      props.id,
      { kind: 'telemetry', payload, topicPurpose: 'telemetry', intervalSeconds: 5, messageLimit: Math.max(count, 1) },
      etag.value,
      newIdempotencyKey()
    )
    etag.value = saved.etag
    profileVersion.value = saved.profile.resourceVersion
    const session = await deviceSimulatorNative.createSession(
      props.id,
      saved.profile.resourceVersion,
      newIdempotencyKey()
    )
    sessionId = session.id
    result.value = await deviceSimulatorNative.run(props.id, session.id, count, newIdempotencyKey())
  } catch (e) {
    error.value = describe(e)
  } finally {
    if (sessionId) {
      try {
        await deviceSimulatorNative.closeSession(props.id, sessionId)
      } catch {
        // an unclosed session expires on its own
      }
    }
    sending.value = false
  }
}

onMounted(load)
watch(() => props.id, load)
</script>

<template>
  <NCard title="模拟上报" size="small" class="mb-4">
    <NSpace vertical>
      <NAlert type="info" :show-icon="false">
        以该设备的身份向平台发送遥测数据，用于调试。单次最多 {{ MAX_SYNC }} 条，连续发送，不按间隔；目前仅支持遥测。
      </NAlert>
      <NAlert v-if="error" type="error" :show-icon="false">{{ error }}</NAlert>
      <NForm label-placement="left" label-width="80">
        <NFormItem label="数据">
          <NInput
            v-model:value="payloadText"
            type="textarea"
            :rows="5"
            :disabled="loading || sending"
            style="font-family: Consolas, 'Courier New', monospace"
          />
        </NFormItem>
        <NFormItem label="条数">
          <NInputNumber v-model:value="messageCount" :min="1" :max="MAX_SYNC" :disabled="loading || sending" />
        </NFormItem>
        <NButton type="primary" :loading="sending" :disabled="loading" @click="send">发送</NButton>
      </NForm>
      <NAlert v-if="result" :type="result.state === 'succeeded' ? 'success' : 'error'" :show-icon="false">
        已发送 {{ result.sent }} 条，失败 {{ result.failed }} 条。
        <template v-if="result.error">{{ result.error.detail }}</template>
      </NAlert>
    </NSpace>
  </NCard>
</template>
