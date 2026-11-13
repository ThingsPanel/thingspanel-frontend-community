<script setup lang="ts">
import { ref, watch } from 'vue'
import { NAlert, NButton, NModal, NRadio, NRadioGroup, NSpace, NSpin } from 'naive-ui'
import { $t } from '@/locales'
import { SystemApiError, systemApi } from '@/service/api/system'
import type { CheckConfigResult, RestartScope } from '@/service/api/system'
import { useSystemManageStore } from '@/store/modules/system-manage'

defineOptions({ name: 'RestartDialog' })
const show = defineModel<boolean>('show', { required: true })

const store = useSystemManageStore()
const checking = ref(false)
const check = ref<CheckConfigResult | undefined>()
const checkError = ref('')
const scope = ref<RestartScope>('control')
const submitting = ref(false)
const error = ref('')

watch(show, async open => {
  if (!open) return
  check.value = undefined
  checkError.value = ''
  error.value = ''
  scope.value = 'control'
  checking.value = true
  try {
    check.value = await systemApi.checkConfig()
  } catch (e) {
    // Unknown state: do not let the user restart blindly.
    checkError.value = e instanceof SystemApiError ? e.message : $t('system-manage.common.unreachable')
  } finally {
    checking.value = false
  }
})

const canRestart = () => !checking.value && !submitting.value && !checkError.value && check.value?.ok !== false

async function restart() {
  submitting.value = true
  error.value = ''
  try {
    const { operation } = await systemApi.restart(scope.value)
    show.value = false
    store.startOperation(operation)
  } catch (e) {
    if (e instanceof SystemApiError && e.maintenance) {
      show.value = false
    } else if (e instanceof SystemApiError && e.detailCode === 'system_busy') {
      error.value = $t('system-manage.common.busy')
    } else {
      error.value = e instanceof Error ? e.message : $t('system-manage.common.failed')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <NModal
    v-model:show="show"
    preset="card"
    :title="$t('system-manage.restart.title')"
    style="width: 520px"
    :mask-closable="!submitting"
  >
    <NSpin :show="checking">
      <NSpace vertical :size="16">
        <NAlert
          v-if="check && check.ok === false"
          type="error"
          :title="$t('system-manage.restart.configBad')"
          data-test="config-bad"
        >
          <div v-if="check.service">{{ $t('system-manage.restart.configComponent', { service: check.service }) }}</div>
          <div v-if="check.code">{{ $t('system-manage.restart.configCode', { code: check.code }) }}</div>
        </NAlert>
        <NAlert v-else-if="check?.skipped" type="warning">{{ $t('system-manage.restart.configSkipped') }}</NAlert>
        <NAlert v-if="checkError" type="error">{{ checkError }}</NAlert>
        <NRadioGroup v-model:value="scope" name="restart-scope">
          <NSpace vertical>
            <NRadio value="control">{{ $t('system-manage.restart.scopeControl') }}</NRadio>
            <NRadio value="full">{{ $t('system-manage.restart.scopeFull') }}</NRadio>
          </NSpace>
        </NRadioGroup>
        <NAlert v-if="error" type="error">{{ error }}</NAlert>
      </NSpace>
    </NSpin>
    <template #footer>
      <NSpace justify="end">
        <NButton :disabled="submitting" @click="show = false">{{ $t('system-manage.common.cancel') }}</NButton>
        <NButton
          type="warning"
          :disabled="!canRestart()"
          :loading="submitting"
          data-test="restart-button"
          @click="restart"
        >
          {{ $t('system-manage.restart.action') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>
