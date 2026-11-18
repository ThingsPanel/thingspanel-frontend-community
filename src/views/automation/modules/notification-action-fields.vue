<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { NFormItem, NInput, NSelect } from 'naive-ui'
import { $t } from '@/locales'
import { getNotificationDefaultPolicy, type NotificationDefaultPolicySummary } from '@/service/api/notification'

defineProps<{ path: string }>()
const policy = defineModel<string | null>('policy')
const revision = defineModel<number>('revision')
const content = defineModel<string | null>('content')
const policies = ref<NotificationDefaultPolicySummary[]>([])
const loading = ref(false)
const failed = ref(false)
const controller = new AbortController()
const options = computed(() => {
  const items = policies.value.map(p => ({ label: p.name, value: p.nativeGroupId, disabled: false }))
  if (policy.value && !items.some(item => item.value === policy.value)) {
    items.push({ label: $t('common.notificationPolicyUnavailable'), value: policy.value, disabled: true })
  }
  return items
})
async function load() {
  if (loading.value) return
  loading.value = true
  failed.value = false
  try {
    const response = await getNotificationDefaultPolicy(controller.signal)
    if (!response.data || response.error) throw new Error()
    policies.value = response.data.availablePolicies.filter(p => p.ready)
  } catch {
    failed.value = !controller.signal.aborted
  } finally {
    loading.value = false
  }
}
function selectPolicy(id: string) {
  policy.value = id
  revision.value = policies.value.find(p => p.nativeGroupId === id)?.groupRevision
}
onMounted(load)
onBeforeUnmount(() => controller.abort())
</script>

<template>
  <NFormItem
    :label="$t('common.notificationPolicy')"
    :path="path"
    :rule="{ required: true, message: $t('common.select'), trigger: 'change' }"
    :validation-status="failed ? 'error' : undefined"
    :feedback="failed ? $t('common.notificationPolicyLoadFailed') : undefined"
  >
    <NSelect
      :value="policy"
      :options="options"
      :loading="loading"
      filterable
      class="w-240px"
      @update:value="selectPolicy"
      @update:show="show => show && failed && load()"
    />
  </NFormItem>
  <NFormItem :label="$t('common.notificationContent')">
    <NInput v-model:value="content" class="w-260px" />
  </NFormItem>
</template>
