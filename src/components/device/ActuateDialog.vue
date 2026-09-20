<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import {
  NModal,
  NForm,
  NFormItem,
  NButton,
  NSpace,
  NInputNumber,
  NSwitch,
  NSelect,
  NInput
} from 'naive-ui'
import { $t } from '@/locales'
import { deviceApi } from '@/service/thingmodel/device'
import type { ThingModelItem } from '@/service/thingmodel/types'

interface Props {
  visible: boolean
  deviceId: string
  item: ThingModelItem
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'success'): void
}>()

const submitting = ref(false)
const value = ref<any>(null)
const errorMsg = ref('')

const kind = computed(() => props.item?.value_type?.kind ?? 'STRING')
const constraint = computed(() => props.item?.value_type?.constraint ?? {})
const enumOptions = computed(() =>
  (props.item?.value_type?.enum_values ?? []).map((ev: any) => ({
    label: ev.label?.default ?? String(ev.code),
    value: ev.code
  }))
)

watch(
  () => props.visible,
  visible => {
    if (visible) {
      errorMsg.value = ''
      const k = kind.value
      if (k === 'BOOL') value.value = false
      else if (k === 'INT' || k === 'FLOAT') value.value = constraint.value.min ?? 0
      else if (k === 'ENUM') value.value = enumOptions.value[0]?.value ?? null
      else value.value = ''
    }
  }
)

function validate(): boolean {
  const k = kind.value
  const c = constraint.value
  if (k === 'INT' || k === 'FLOAT') {
    const num = Number(value.value)
    if (c.min !== undefined && num < c.min) {
      errorMsg.value = `最小值 ${c.min}`
      return false
    }
    if (c.max !== undefined && num > c.max) {
      errorMsg.value = `最大值 ${c.max}`
      return false
    }
  }
  errorMsg.value = ''
  return true
}

async function handleSubmit() {
  if (!validate()) return
  submitting.value = true
  try {
    await deviceApi.actuate(props.deviceId, {
      identifier: props.item.identifier,
      params: { value: value.value }
    })
    window.$message?.success($t('tmDevice.actuateSuccess'))
    emit('success')
    emit('update:visible', false)
  } catch (e: any) {
    const msg = e?.message ?? $t('tmDevice.actuateFailed')
    window.$message?.error(msg)
  } finally {
    submitting.value = false
  }
}

function handleClose() {
  emit('update:visible', false)
}

const displayName = computed(() => props.item?.name_i18n?.default ?? props.item?.identifier ?? '')
</script>

<template>
  <NModal
    :show="visible"
    preset="card"
    :title="$t('tmDevice.actuateTitle', { name: displayName })"
    style="width: 480px"
    :mask-closable="false"
    @update:show="handleClose"
  >
    <NForm label-placement="left" label-width="80px">
      <NFormItem :label="displayName" :feedback="errorMsg" :validation-status="errorMsg ? 'error' : undefined">
        <NInputNumber
          v-if="kind === 'FLOAT'"
          v-model:value="value"
          :min="constraint.min"
          :max="constraint.max"
          :step="constraint.step ?? 0.1"
          :precision="constraint.decimals ?? 2"
          style="width: 100%"
        />
        <NInputNumber
          v-else-if="kind === 'INT'"
          v-model:value="value"
          :min="constraint.min"
          :max="constraint.max"
          :step="constraint.step ?? 1"
          :precision="0"
          style="width: 100%"
        />
        <NSwitch v-else-if="kind === 'BOOL'" v-model:value="value" />
        <NSelect v-else-if="kind === 'ENUM'" v-model:value="value" :options="enumOptions" style="width: 100%" />
        <NInput v-else v-model:value="value" :maxlength="constraint.max_length" />
      </NFormItem>
    </NForm>

    <template #footer>
      <NSpace justify="end">
        <NButton @click="handleClose">{{ $t('common.cancel') }}</NButton>
        <NButton type="primary" :loading="submitting" @click="handleSubmit">
          {{ $t('tmDevice.actuate') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
