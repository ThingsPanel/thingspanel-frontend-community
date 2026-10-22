<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getNotificationDefaultPolicy, putNotificationDefaultPolicy } from '@/service/api/notification'
import type { NotificationDefaultPolicySummary, NotificationDefaultPolicyView } from '@/service/api/notification'
import { useAuthStore } from '@/store/modules/auth'

const auth = useAuthStore()
const { locale } = useI18n()
const tx = (zh: string, en: string) => (locale.value.toLowerCase().startsWith('zh') ? zh : en)
const view = ref<NotificationDefaultPolicyView | null>(null)
const draftNativeGroupId = ref('')
const loading = ref(false)
const saving = ref(false)
const errorText = ref('')
const successText = ref('')
const generation = ref(0)
let controller: AbortController | null = null

const selectedSummary = computed(() => view.value?.selected ?? null)
const policyOptions = computed(() => {
  const options: Array<{ label: string; value: string; disabled?: boolean }> = [
    { label: tx('不设置默认策略', 'No default policy'), value: '' },
    ...(view.value?.availablePolicies ?? []).map(policy => ({
      label: policy.name,
      value: policy.nativeGroupId
    }))
  ]
  const selected = selectedSummary.value
  if (selected && !options.some(option => option.value === selected.nativeGroupId)) {
    options.unshift({
      label: `${selected.name} · ${tx('当前不可用', 'Currently unavailable')}`,
      value: selected.nativeGroupId,
      disabled: true
    })
  }
  return options
})

function isCurrent(generationAtStart: number, signal: AbortSignal) {
  return generationAtStart === generation.value && !signal.aborted
}

async function load() {
  generation.value += 1
  const requestGeneration = generation.value
  controller?.abort()
  controller = new AbortController()
  const activeController = controller
  loading.value = true
  errorText.value = ''
  successText.value = ''
  try {
    const response = await getNotificationDefaultPolicy(activeController.signal)
    if (!isCurrent(requestGeneration, activeController.signal)) return
    if (!response.data)
      throw response.error ?? new Error(tx('默认策略响应为空。', 'The default policy response was empty.'))
    const result = response.data
    view.value = result
    draftNativeGroupId.value = result.selected?.nativeGroupId ?? ''
  } catch (error) {
    if (!isCurrent(requestGeneration, activeController.signal)) return
    errorText.value =
      error instanceof Error
        ? error.message
        : tx('无法读取默认通知策略，请刷新后重试。', 'Could not load the default policy. Refresh and try again.')
  } finally {
    if (isCurrent(requestGeneration, activeController.signal)) loading.value = false
  }
}

async function save() {
  if (!view.value || saving.value) return
  generation.value += 1
  const requestGeneration = generation.value
  controller?.abort()
  controller = new AbortController()
  const activeController = controller
  saving.value = true
  errorText.value = ''
  successText.value = ''
  try {
    const saved = await putNotificationDefaultPolicy(
      { nativeGroupId: draftNativeGroupId.value, expectedVersion: view.value.version },
      activeController.signal
    )
    if (!isCurrent(requestGeneration, activeController.signal)) return
    if (!saved.data) throw saved.error ?? new Error(tx('保存响应为空。', 'The save response was empty.'))
    // Read back the saved preference so the page reflects the server's current state.
    const readback = await getNotificationDefaultPolicy(activeController.signal)
    if (!isCurrent(requestGeneration, activeController.signal)) return
    if (!readback.data)
      throw (
        readback.error ??
        new Error(tx('保存成功，但无法读取最新状态。', 'Saved, but could not read back the latest state.'))
      )
    const current = readback.data
    view.value = current
    draftNativeGroupId.value = current.selected?.nativeGroupId ?? ''
    successText.value = tx(
      '默认通知策略已保存；此操作不会发送通知。',
      'Default policy saved. This does not send a notification.'
    )
  } catch (error) {
    if (!isCurrent(requestGeneration, activeController.signal)) return
    const status =
      (error as { response?: { status?: number }; status?: number; error?: { status?: number } })?.response?.status ??
      (error as { status?: number })?.status ??
      (error as { error?: { status?: number } })?.error?.status
    errorText.value =
      status === 409
        ? tx(
            '默认策略已被其他操作更新。请刷新后重新选择。',
            'The default policy changed elsewhere. Refresh and choose again.'
          )
        : error instanceof Error
          ? error.message
          : tx('保存失败，请刷新后重试。', 'Save failed. Refresh and try again.')
  } finally {
    if (isCurrent(requestGeneration, activeController.signal)) saving.value = false
  }
}

function policyStatus(policy: NotificationDefaultPolicySummary) {
  return policy.ready
    ? tx('可用于新告警', 'Ready for new alerts')
    : tx(
        '当前不可用；新告警将暂停发送，请检查服务配置',
        'Unavailable; sending for new alerts is paused. Check the service configuration.'
      )
}

function updateDraft(value: string | null) {
  draftNativeGroupId.value = value ?? ''
}

watch(
  () => [auth.token, auth.userInfo.tenant_id, auth.userInfo.id, auth.userInfo.userId],
  () => {
    generation.value += 1
    controller?.abort()
    controller = null
    view.value = null
    draftNativeGroupId.value = ''
    loading.value = false
    saving.value = false
    errorText.value = ''
    successText.value = ''
    if (auth.token) void load()
  }
)

onMounted(() => {
  if (auth.token) void load()
})
onBeforeUnmount(() => {
  generation.value += 1
  controller?.abort()
})
</script>

<template>
  <NCard class="mb-12px" :title="tx('租户默认通知策略', 'Tenant default policy')">
    <div class="mb-12px text-13px text-gray-500">
      {{
        tx(
          '未单独指定策略的告警会使用此默认值；没有默认值时，告警仍会记录，但不会发送通知。保存设置不会发送通知。',
          'Alerts without an explicit policy use this default. Without a default, alerts are still recorded but no notification is sent. Saving this setting does not send a notification.'
        )
      }}
    </div>
    <NAlert v-if="selectedSummary && !selectedSummary.ready" type="warning" class="mb-12px">
      {{ policyStatus(selectedSummary) }}
    </NAlert>
    <NAlert v-if="errorText" type="error" class="mb-12px">{{ errorText }}</NAlert>
    <NAlert v-if="successText" type="success" class="mb-12px">{{ successText }}</NAlert>
    <NSpace align="center" :size="12">
      <NSelect
        :value="draftNativeGroupId"
        class="min-w-260px"
        :loading="loading"
        :disabled="loading || saving || !view"
        :options="policyOptions"
        :placeholder="tx('无默认策略', 'No default policy')"
        clearable
        @update:value="updateDraft"
      />
      <NButton type="primary" :loading="saving" :disabled="loading || saving || !view" @click="save">
        {{ tx('保存默认策略', 'Save default policy') }}
      </NButton>
      <NButton :disabled="loading || saving" @click="load">{{ tx('刷新', 'Refresh') }}</NButton>
    </NSpace>
    <div v-if="selectedSummary" class="mt-10px text-13px">
      {{ tx('当前默认：', 'Current default: ') }}{{ selectedSummary.name }} · {{ policyStatus(selectedSummary) }}
    </div>
    <div v-else-if="view" class="mt-10px text-13px text-gray-500">
      {{ tx('当前没有默认策略。', 'No default policy is set.') }}
    </div>
  </NCard>
</template>
