<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { NAlert, NButton, NModal, NSpace, NSpin, NTag } from 'naive-ui'
import { $t } from '@/locales'
import { SystemApiError, systemApi } from '@/service/api/system'
import type { UpdateItem, UpdatesResult } from '@/service/api/system'
import {
  getInstallCatalog,
  getInstallation,
  installAction,
  installErrorCode,
  upgradeInstall
} from '@/service/api/plugin-install'
import type { CatalogItem } from '@/service/api/plugin-install'
import { createPluginUpgrader, isUpgradeBusy, upgradablePlugins } from '@/utils/plugin-upgrade'
import type { PluginUpgradeRowState } from '@/utils/plugin-upgrade'
import { hasSystemErrorText } from '@/utils/system-error'
import { useSystemManageStore } from '@/store/modules/system-manage'

defineOptions({ name: 'UpdatesDialog' })
const show = defineModel<boolean>('show', { required: true })

const store = useSystemManageStore()

// R7: plugin rows. A failing catalog (503 not configured / agent offline / 403) only hides these rows.
const plugins = ref<CatalogItem[]>([])
const pluginState = reactive<Record<string, PluginUpgradeRowState>>({})
const upgrader = createPluginUpgrader({
  upgrade: upgradeInstall,
  retry: id => installAction(id, 'retry'),
  getInstallation,
  errorCode: installErrorCode,
  onChange: (id, st) => {
    pluginState[id] = st
  }
})
onBeforeUnmount(() => upgrader.dispose())

async function loadPlugins() {
  plugins.value = []
  const { data, error } = await getInstallCatalog()
  if (!error) plugins.value = upgradablePlugins(data)
}

function pluginErrorText(code?: string) {
  if (!code) return ''
  return ['UP_TO_DATE', 'BAD_STATE', 'AGENT_OFFLINE', 'REQUEST_FAILED'].includes(code)
    ? $t(`system-manage.updates.plugins.errors.${code}`)
    : $t('system-manage.updates.plugins.errorCode', { code })
}

function upgradePlugin(item: CatalogItem) {
  const id = item.installation?.id
  if (!id) return
  window.$dialog?.warning({
    title: $t('system-manage.updates.upgrade'),
    content: $t('system-manage.updates.plugins.upgradeConfirm', { name: item.display_name, to: item.version }),
    positiveText: $t('system-manage.common.confirm'),
    negativeText: $t('system-manage.common.cancel'),
    onPositiveClick() {
      void upgrader.start(id)
    }
  })
}
const loading = ref(false)
const result = ref<UpdatesResult | undefined>()
const loadError = ref('')
const upgrading = ref(false)
const actionError = ref('')

const KNOWN_ERRORS = ['updates_manifest_rejected', 'updates_fetch_failed', 'updates_not_configured']
const errorText = computed(() => {
  const code = result.value?.error
  if (!code) return ''
  return KNOWN_ERRORS.includes(code)
    ? $t(`system-manage.updates.error.${code}`)
    : $t('system-manage.updates.error.unknown', { code })
})

watch(show, async open => {
  if (!open) return
  result.value = undefined
  loadError.value = ''
  actionError.value = ''
  loading.value = true
  void loadPlugins()
  try {
    result.value = await systemApi.updates()
  } catch (e) {
    loadError.value = e instanceof Error ? e.message : $t('system-manage.common.failed')
  } finally {
    loading.value = false
  }
})

function upgrade(item: UpdateItem) {
  if (!item.latest) return
  const to = item.latest
  window.$dialog?.warning({
    title: $t('system-manage.updates.upgrade'),
    content: $t('system-manage.updates.upgradeConfirm', { version: to }),
    positiveText: $t('system-manage.common.confirm'),
    negativeText: $t('system-manage.common.cancel'),
    async onPositiveClick() {
      upgrading.value = true
      actionError.value = ''
      try {
        const { operation } = await systemApi.upgrade(to)
        show.value = false
        store.startOperation(operation)
      } catch (e) {
        if (e instanceof SystemApiError && e.maintenance) show.value = false
        else if (e instanceof SystemApiError && e.detailCode === 'system_busy')
          actionError.value = $t('system-manage.common.busy')
        else if (e instanceof SystemApiError && hasSystemErrorText(e.detailCode))
          actionError.value = $t(`system-manage.errors.${e.detailCode}`)
        else actionError.value = e instanceof Error ? e.message : $t('system-manage.common.failed')
      } finally {
        upgrading.value = false
      }
    }
  })
}

const isInstallerOnly = (item: UpdateItem) => item.instructions === 'upgrade_with_installer'
</script>

<template>
  <NModal v-model:show="show" preset="card" :title="$t('system-manage.updates.title')" style="width: 640px">
    <NSpin :show="loading">
      <NSpace vertical :size="12" style="min-height: 80px">
        <NAlert v-if="loadError" type="error">{{ loadError }}</NAlert>
        <NAlert v-if="errorText" type="warning" data-test="updates-error">{{ errorText }}</NAlert>
        <NAlert v-if="actionError" type="error">{{ actionError }}</NAlert>
        <div v-for="item in result?.items ?? []" :key="item.kind" class="update-row" :data-test="`row-${item.kind}`">
          <div class="update-main">
            <b>
              {{ item.kind === 'platform' ? $t('system-manage.updates.platform') : $t('system-manage.updates.agent') }}
            </b>
            <span>{{ $t('system-manage.updates.current') }}: {{ item.current || '-' }}</span>
            <span v-if="item.update_available && item.latest">
              {{ $t('system-manage.updates.latest') }}:
              <NTag type="success" size="small">{{ item.latest }}</NTag>
            </span>
            <span v-else-if="!isInstallerOnly(item)">{{ $t('system-manage.updates.upToDate') }}</span>
          </div>
          <div v-if="isInstallerOnly(item)" class="update-hint" data-test="installer-hint">
            {{ $t('system-manage.updates.agentInstaller') }}
          </div>
          <template v-else-if="item.update_available && item.can_upgrade">
            <NButton type="primary" size="small" :loading="upgrading" data-test="upgrade-button" @click="upgrade(item)">
              {{ $t('system-manage.updates.upgrade') }}
            </NButton>
            <div class="update-hint">{{ $t('system-manage.updates.upgradeHint') }}</div>
          </template>
        </div>
        <div v-for="item in plugins" :key="item.id" class="update-row" :data-test="`row-plugin-${item.id}`">
          <div class="update-main">
            <b>{{ $t('system-manage.updates.plugins.row', { name: item.display_name }) }}</b>
            <span>
              {{
                $t('system-manage.updates.plugins.versions', {
                  from: item.installation?.version || '-',
                  to: item.version
                })
              }}
            </span>
          </div>
          <template v-for="st in [pluginState[item.installation?.id ?? '']]" :key="'s'">
            <NButton
              v-if="!st || st.phase === 'idle' || isUpgradeBusy(st.phase) || st.phase === 'success' || st.apiError"
              type="primary"
              size="small"
              :disabled="isUpgradeBusy(st?.phase) || st?.phase === 'success'"
              :loading="isUpgradeBusy(st?.phase)"
              data-test="plugin-upgrade-button"
              @click="upgradePlugin(item)"
            >
              {{ $t('system-manage.updates.upgrade') }}
            </NButton>
            <NButton
              v-else
              type="warning"
              size="small"
              data-test="plugin-retry-button"
              @click="item.installation && upgrader.start(item.installation.id, 'retry')"
            >
              {{ $t('system-manage.updates.plugins.retry') }}
            </NButton>
            <div
              v-if="st?.phase === 'installing' || st?.phase === 'starting'"
              class="update-hint"
              data-test="plugin-installing"
            >
              {{ $t('system-manage.updates.plugins.installing') }}
              <span v-if="st.opStep">({{ st.opStep }})</span>
            </div>
            <div v-else-if="st?.phase === 'success'" class="update-hint" data-test="plugin-success">
              {{ $t('system-manage.updates.plugins.success', { version: st.version || item.version }) }}
            </div>
            <div v-else-if="st?.phase === 'failed'" class="update-hint" data-test="plugin-failed">
              {{ $t('system-manage.updates.plugins.failed') }} — {{ pluginErrorText(st.errorCode) }}
              <span v-if="st.opStep">· {{ $t('system-manage.updates.plugins.step', { step: st.opStep }) }}</span>
            </div>
            <div v-else-if="st?.phase === 'timeout'" class="update-hint">
              {{ $t('system-manage.updates.plugins.timeout') }}
            </div>
          </template>
        </div>
      </NSpace>
    </NSpin>
  </NModal>
</template>

<style scoped>
.update-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 16px;
  padding: 10px 0;
  border-bottom: 1px solid rgb(128 128 128 / 20%);
}
.update-main {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  flex: 1;
}
.update-hint {
  flex-basis: 100%;
  font-size: 12px;
  opacity: 0.7;
}
</style>
