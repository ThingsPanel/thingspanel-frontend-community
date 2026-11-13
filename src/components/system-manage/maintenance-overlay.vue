<script setup lang="ts">
import { computed } from 'vue'
import { NButton, NProgress, NSpin } from 'naive-ui'
import { $t } from '@/locales'
import { hasSystemErrorText } from '@/utils/system-error'
import { useSystemManageStore } from '@/store/modules/system-manage'
import { clampPercent } from '@/utils/system-maintenance'

defineOptions({ name: 'MaintenanceOverlay' })

const store = useSystemManageStore()
const status = computed(() => store.status)
const outcome = computed(() => store.outcome)
const percent = computed(() => clampPercent(status.value?.percent))
const title = computed(() => {
  const kind = status.value?.kind
  return kind && ['restart', 'backup', 'restore', 'upgrade'].includes(kind)
    ? $t(`system-manage.maintenance.kind.${kind}`)
    : $t('system-manage.maintenance.title')
})
const STEPS = [
  'preflight',
  'staging_release',
  'snapshot',
  'stopping',
  'applying',
  'starting_new_version',
  'verifying',
  'rolling_back',
  'maintenance_on',
  'starting',
  'verifying_backup',
  'safety_snapshot',
  'restoring_databases',
  'restoring_files',
  'restoring_config',
  'collecting',
  'dumping',
  'packaging',
  'retention',
  'done'
]
/** Known steps get a translated label; unknown ones are shown as reported. */
const stepLabel = computed(() => {
  const step = status.value?.step
  if (!step) return '-'
  return STEPS.includes(step) ? $t(`system-manage.maintenance.steps.${step}`) : step
})
const failed = computed(() => ['rolled_back', 'needs_human', 'failed'].includes(outcome.value))
</script>

<template>
  <Teleport to="body">
    <div v-if="store.maintenance" class="maintenance-overlay" role="alertdialog" aria-live="polite">
      <div class="maintenance-card">
        <h2 class="maintenance-title">{{ title }}</h2>
        <p v-if="!failed" class="maintenance-sub">{{ $t('system-manage.maintenance.subtitle') }}</p>

        <template v-if="outcome === 'running'">
          <template v-if="!status">
            <NSpin size="small" />
            <p class="maintenance-sub">{{ $t('system-manage.maintenance.waiting') }}</p>
          </template>
          <template v-else>
            <NProgress type="line" :percentage="percent" indicator-placement="inside" processing />
            <p class="maintenance-row">
              <span>{{ $t('system-manage.maintenance.step') }}:</span>
              <b data-test="step">{{ stepLabel }}</b>
            </p>
            <p v-if="status.component" class="maintenance-row">
              <span>{{ $t('system-manage.maintenance.component') }}:</span>
              <b data-test="component">{{ status.component }}</b>
            </p>
          </template>
          <p v-if="store.unreachable" class="maintenance-warn">{{ $t('system-manage.maintenance.unreachable') }}</p>
        </template>

        <template v-else-if="outcome === 'done'">
          <NProgress type="line" :percentage="100" indicator-placement="inside" status="success" />
          <p class="maintenance-sub" data-test="done">{{ $t('system-manage.maintenance.done') }}</p>
        </template>

        <template v-else>
          <p v-if="outcome === 'rolled_back'" class="maintenance-error" data-test="rolled-back">
            {{ $t('system-manage.maintenance.rolledBack') }}
          </p>
          <template v-else-if="outcome === 'needs_human'">
            <p class="maintenance-error" data-test="needs-human">{{ $t('system-manage.maintenance.needsHuman') }}</p>
            <code class="maintenance-code">{{ $t('system-manage.maintenance.needsHumanCommand') }}</code>
          </template>
          <p v-else class="maintenance-error" data-test="failed">{{ $t('system-manage.maintenance.failed') }}</p>
          <p v-if="status?.code && hasSystemErrorText(status.code)" class="maintenance-error" data-test="error-text">
            {{ $t(`system-manage.errors.${status.code}`) }}
          </p>
          <p v-if="status?.code" class="maintenance-sub">
            {{ $t('system-manage.maintenance.code', { code: status.code }) }}
          </p>
          <!-- no retry: needs_human must not be retried; after a rollback the user reloads the page -->
          <NButton v-if="outcome !== 'needs_human'" type="primary" @click="store.leaveMaintenance()">
            {{ $t('system-manage.common.close') }}
          </NButton>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.maintenance-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(15 23 42 / 92%);
}
.maintenance-card {
  width: min(520px, 90vw);
  padding: 32px;
  border-radius: 12px;
  background: #fff;
  color: #1f2937;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.maintenance-title {
  margin: 0;
  font-size: 20px;
}
.maintenance-sub {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}
.maintenance-row {
  margin: 0;
  display: flex;
  gap: 8px;
  font-size: 14px;
}
.maintenance-warn {
  margin: 0;
  color: #b45309;
  font-size: 13px;
}
.maintenance-error {
  margin: 0;
  color: #b91c1c;
  font-size: 15px;
  font-weight: 600;
}
.maintenance-code {
  padding: 8px 10px;
  border-radius: 6px;
  background: #f3f4f6;
  font-size: 12px;
  word-break: break-all;
}
</style>
