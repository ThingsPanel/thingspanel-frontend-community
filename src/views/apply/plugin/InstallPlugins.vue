<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { catalogDescription, healthLabel } from './install-presentation'
import { nanoid } from '@sa/utils'
import {
  useThemeVars,
  NAlert,
  NButton,
  NCard,
  NModal,
  NCollapse,
  NCollapseItem,
  NDropdown,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NSpace,
  NSpin,
  NTag,
  NTimeline,
  NTimelineItem
} from 'naive-ui'
import {
  getInstallCatalog,
  getInstallation,
  installAction,
  installErrorCode,
  installErrorMessage,
  submitInstall,
  uninstallPlugin,
  updateInstallConfig,
  type CatalogItem,
  type Installation
} from '@/service/api/plugin-install'
import {
  buildConfig,
  errorText,
  isBusy,
  isHttpUrl,
  missingFields,
  stateView,
  stepLabel,
  stepProgress
} from './install-state'

const { locale } = useI18n()
const router = useRouter()
const themeVars = useThemeVars()
const description = (text: string) => catalogDescription(text, locale.value)
const health = (value: string | undefined) => healthLabel(value, locale.value)
const tx = (zh: string, en: string) => (locale.value.toLowerCase().startsWith('zh') ? zh : en)

const items = ref<CatalogItem[]>([])
const loading = ref(false)
const notice = ref('') // page-level problem: agent offline / not configured
const modal = reactive({
  open: false,
  item: null as CatalogItem | null,
  mode: 'install' as 'install' | 'config' | 'detail' | 'disable' | 'uninstall'
})
const form = reactive<Record<string, string>>({})
const submitting = ref(false)
const pendingAction = ref('')
const locked = computed(() => submitting.value || !!pendingAction.value)
let revision = 0
const formError = ref('')
const detail = ref<Installation | null>(null)
let timer: ReturnType<typeof setInterval> | undefined
let clickKey = ''

function describeError(error: unknown): string {
  const code = installErrorCode(error)
  if (code === 'AGENT_OFFLINE')
    return tx(
      '主机上的安装代理不在线，请确认安装器已启动。',
      'The host agent is offline. Make sure the installer agent is running.'
    )
  if (code === 'PLUGIN_INSTALL_NOT_CONFIGURED')
    return tx(
      '此主机尚未启用一键安装（未配置安装代理）。',
      'One-click install is not enabled on this host (no agent configured).'
    )
  if ((error as any)?.response?.status === 403)
    return tx(
      '只有租户管理员可以安装插件，请使用租户管理员账号登录。',
      'Only a tenant administrator can install plugins. Sign in with a tenant administrator account.'
    )
  if (code === 'BAD_STATE') return tx('当前状态下不能执行该操作。', 'This is not allowed in the current state.')
  return installErrorMessage(error) || tx('请求失败', 'Request failed')
}

async function load() {
  if (locked.value) return
  const version = revision
  loading.value = items.value.length === 0
  const { data, error } = await getInstallCatalog()
  loading.value = false
  if (version !== revision) return
  if (error) {
    notice.value = describeError(error)
    return
  }
  notice.value = ''
  items.value = data || []
  if (modal.open && modal.item) {
    const fresh = items.value.find(i => i.id === modal.item?.id)
    if (fresh) modal.item = fresh
    if (fresh?.installation) await refreshDetail(fresh.installation.id)
  }
}

async function refreshDetail(id: string) {
  const version = revision
  const { data } = await getInstallation(id)
  if (data && version === revision && modal.open && modal.item?.installation?.id === id) detail.value = data
}

const anyBusy = computed(() => items.value.some(i => isBusy(i.installation)))

function resetForm(item: CatalogItem) {
  Object.keys(form).forEach(k => delete form[k])
  for (const key of Object.keys(item.fields)) form[key] = item.installation?.config?.[key] ?? ''
  formError.value = ''
}

function openInstall(item: CatalogItem) {
  revision++
  modal.item = item
  modal.mode = item.installation && item.installation.state !== 'uninstalled' ? 'detail' : 'install'
  resetForm(item)
  clickKey = nanoid()
  detail.value = item.installation
  modal.open = true
  if (item.installation) void refreshDetail(item.installation.id)
}

function openConfig() {
  if (!modal.item) return
  resetForm(modal.item)
  if (detail.value) for (const k of Object.keys(modal.item.fields)) form[k] = detail.value.config?.[k] ?? ''
  modal.mode = 'config'
}

function closeModal() {
  if (locked.value) return
  revision++
  modal.open = false
  // never keep a typed secret around after the modal is closed
  Object.keys(form).forEach(k => (form[k] = ''))
}

function validate(item: CatalogItem): string {
  const have = detail.value?.secrets_set ?? item.installation?.secrets_set ?? []
  const missing = missingFields(item.fields, form, have)
  if (missing.length) return tx(`请填写：${missing.join('、')}`, `Please fill in: ${missing.join(', ')}`)
  for (const [key, spec] of Object.entries(item.fields)) {
    if (spec.validate === 'url' && form[key] && !isHttpUrl(form[key].trim()))
      return tx(`${key} 必须是 http(s) 地址`, `${key} must be an http(s) URL`)
  }
  return ''
}

function acceptResult(data: Installation) {
  detail.value = data
  if (modal.item) modal.item.installation = data
  const item = items.value.find(i => i.id === data.plugin_id)
  if (item) item.installation = data
}

async function onSubmit() {
  const item = modal.item
  if (!item || locked.value) return
  formError.value = validate(item)
  if (formError.value) return
  revision++
  submitting.value = true
  try {
    const config = buildConfig(item.fields, form)
    const result =
      modal.mode === 'config' && item.installation
        ? await updateInstallConfig(item.installation.id, config)
        : await submitInstall(item.id, config, clickKey)
    if (result.error) {
      formError.value = describeError(result.error)
      return
    }
    Object.keys(form).forEach(k => (form[k] = ''))
    clickKey = nanoid()
    acceptResult(result.data as Installation)
    modal.mode = 'detail'
  } catch (error) {
    formError.value = describeError(error)
  } finally {
    submitting.value = false
  }
  await load()
}

async function act(action: 'enable' | 'disable' | 'retry' | 'uninstall') {
  const id = detail.value?.id
  if (!id || locked.value) return
  revision++
  pendingAction.value = action
  formError.value = ''
  try {
    const { data, error } = action === 'uninstall' ? await uninstallPlugin(id) : await installAction(id, action)
    if (error) formError.value = describeError(error)
    else {
      acceptResult(data as Installation)
      modal.mode = 'detail'
    }
  } catch (error) {
    formError.value = describeError(error)
  } finally {
    pendingAction.value = ''
  }
  await load()
}

function selectAction(key: string, item?: CatalogItem) {
  if (locked.value) return
  if (item) openInstall(item)
  formError.value = ''
  if (key === 'config') openConfig()
  else if (key === 'disable' || key === 'uninstall') modal.mode = key
}

function actionOptions(item: CatalogItem) {
  if (!item.installation || isBusy(item.installation) || item.installation.state === 'uninstalled') return []
  return [
    ...(Object.keys(item.fields).length ? [{ label: tx('修改配置', 'Edit configuration'), key: 'config' }] : []),
    ...(item.installation.state === 'enabled' ? [{ label: tx('停用', 'Disable'), key: 'disable' }] : []),
    { label: tx('卸载', 'Uninstall'), key: 'uninstall' }
  ]
}

function backToDetail() {
  Object.keys(form).forEach(k => (form[k] = ''))
  formError.value = ''
  modal.mode = 'detail'
}

function reinstall() {
  if (!modal.item) return
  resetForm(modal.item)
  clickKey = nanoid()
  modal.mode = 'install'
}

function goToTemplates() {
  closeModal()
  void router.push({ name: 'device_config' })
}

// Site details first, secrets last (the server returns the fields in alphabetical order).
const fieldEntries = computed(() =>
  Object.entries(modal.item?.fields ?? {}).sort(
    ([ka, a], [kb, b]) => Number(a.secret) - Number(b.secret) || ka.localeCompare(kb)
  )
)
const progress = computed(() => (detail.value ? stepProgress(detail.value, detail.value.events ?? []) : []))
const detailView = computed(() => {
  const value = stateView(detail.value?.state, tx)
  if (detail.value?.state === 'installing')
    value.label = detail.value.desired === 'disabled' ? tx('停用中', 'Disabling') : tx('启用中', 'Enabling')
  return value
})
const isForm = computed(() => modal.mode === 'install' || modal.mode === 'config')
const isConfirmation = computed(() => modal.mode === 'disable' || modal.mode === 'uninstall')
const title = computed(() => {
  const name = modal.item?.display_name || ''
  const prefix = {
    install: tx('安装', 'Install'),
    config: tx('修改配置', 'Edit configuration'),
    disable: tx('停用', 'Disable'),
    uninstall: tx('卸载', 'Uninstall'),
    detail: ''
  }[modal.mode]
  return prefix ? `${prefix} · ${name}` : name
})
const expandedProgress = computed(() => isBusy(detail.value) || detail.value?.state === 'failed')
const stepStatusLabel = (status: string) =>
  ({
    done: tx('已完成', 'Completed'),
    active: tx('进行中', 'In progress'),
    failed: tx('失败', 'Failed'),
    waiting: tx('等待恢复，将自动重试', 'Waiting, retrying automatically'),
    todo: tx('待执行', 'Pending')
  })[status] || ''
const retryLabel = computed(() =>
  detail.value?.desired === 'absent'
    ? tx('重试卸载', 'Retry uninstall')
    : detail.value?.desired === 'disabled'
      ? tx('重试停用', 'Retry disable')
      : tx('重试启用', 'Retry enable')
)
const canOpenTemplates = computed(() => modal.item?.service_identifier === 'http' && router.hasRoute('device_config'))

onMounted(() => {
  void load()
  timer = setInterval(() => {
    if (anyBusy.value || modal.open) void load()
  }, 3000)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
  Object.keys(form).forEach(k => (form[k] = ''))
})
</script>

<template>
  <div class="install-plugins">
    <NAlert v-if="notice" type="warning" :bordered="false" class="mb-12px">{{ notice }}</NAlert>
    <NSpin :show="loading">
      <NEmpty
        v-if="!items.length && !loading && !notice"
        :description="tx('目录中暂无可安装的插件', 'No installable plugins in the catalog')"
      />
      <div class="grid">
        <NCard
          v-for="item in items"
          :key="item.id"
          :title="item.display_name"
          size="small"
          class="plugin-card"
          :data-testid="`plugin-${item.id}`"
        >
          <template #header-extra>
            <NTag :type="stateView(item.installation?.state, tx).type" size="small">
              {{ stateView(item.installation?.state, tx).label }}
            </NTag>
          </template>
          <p class="desc">{{ description(item.description) }}</p>
          <p class="meta">{{ tx('版本', 'Version') }} {{ item.version }}</p>
          <div class="card-footer">
            <span v-if="item.installation?.state === 'enabled'" class="meta">
              {{ tx('健康', 'Health') }}: {{ health(item.installation.health) }}
            </span>
            <span v-else />
            <NSpace align="center" :size="8">
              <NButton
                v-if="
                  item.installation?.state === 'enabled' &&
                  item.service_identifier === 'http' &&
                  router.hasRoute('device_config')
                "
                type="primary"
                size="small"
                @click="goToTemplates"
              >
                {{ tx('设备模板', 'Device templates') }}
              </NButton>
              <NButton
                :type="!item.installation || item.installation.state === 'uninstalled' ? 'primary' : 'default'"
                size="small"
                :disabled="locked"
                @click="openInstall(item)"
              >
                {{
                  !item.installation || item.installation.state === 'uninstalled'
                    ? tx('安装', 'Install')
                    : isBusy(item.installation)
                      ? tx('查看进度', 'View progress')
                      : tx('管理', 'Manage')
                }}
              </NButton>
              <NDropdown
                v-if="actionOptions(item).length"
                trigger="click"
                :options="actionOptions(item)"
                @select="key => selectAction(key, item)"
              >
                <NButton size="small" quaternary :disabled="locked">{{ tx('更多', 'More') }}</NButton>
              </NDropdown>
            </NSpace>
          </div>
        </NCard>
      </div>
    </NSpin>

    <NModal
      :show="modal.open"
      preset="card"
      :title="title"
      class="plugin-modal"
      :style="{ width: 'min(600px, calc(100vw - 32px))' }"
      :bordered="false"
      :closable="!locked"
      :close-on-esc="!locked"
      :mask-closable="false"
      @update:show="v => !v && closeModal()"
    >
      <div v-if="modal.item" :key="modal.mode" class="modal-body">
        <template v-if="isForm">
          <p v-if="modal.mode === 'install'" class="form-intro">{{ description(modal.item.description) }}</p>
          <NAlert v-if="modal.mode === 'config'" type="info" :bordered="false" class="mb-16px">
            {{
              detail?.state === 'enabled'
                ? tx(
                    '应用配置时，设备通信可能短暂中断。',
                    'Applying configuration may briefly interrupt device communication.'
                  )
                : tx('保存后将启用插件。', 'Saving will enable the plugin.')
            }}
          </NAlert>
          <NForm v-if="fieldEntries.length" label-placement="top" :disabled="locked" @submit.prevent="onSubmit">
            <NFormItem v-for="[key, spec] in fieldEntries" :key="key" :label="key" :required="spec.required">
              <NInput
                v-model:value="form[key]"
                :type="spec.secret ? 'password' : 'text'"
                :show-password-on="spec.secret ? 'click' : undefined"
                :input-props="{ autocomplete: spec.secret ? 'new-password' : 'off', name: `pui-${key}` }"
                :placeholder="
                  spec.secret && (detail?.secrets_set || []).includes(key)
                    ? tx('已设置，留空表示不修改', 'Already set; leave blank to keep it')
                    : spec.description
                "
              />
            </NFormItem>
          </NForm>
          <p v-else class="meta">
            {{ tx('无需配置，安装后自动启用。', 'No configuration required. Enables after installation.') }}
          </p>
        </template>
        <template v-else-if="isConfirmation">
          <NAlert :type="modal.mode === 'uninstall' ? 'error' : 'warning'" :bordered="false">
            {{
              modal.mode === 'uninstall'
                ? tx(
                    '卸载后将停止插件并清除插件配置，设备与历史数据保留。',
                    'Uninstalling stops the plugin and removes its configuration. Devices and history are kept.'
                  )
                : tx(
                    '停用后，依赖此插件的设备通信将中断，配置与历史数据保留。',
                    'Disabling interrupts communication for devices using this plugin. Configuration and history are kept.'
                  )
            }}
          </NAlert>
        </template>
        <template v-else-if="detail">
          <div class="status-summary" role="status">
            <NSpace align="center">
              <NTag :type="detailView.type">{{ detailView.label }}</NTag>
              <span v-if="detail.state === 'enabled'">
                {{ tx('健康检查', 'Health check') }}: {{ health(detail.health) }}
              </span>
              <span class="meta">{{ tx('版本', 'Version') }} {{ detail.version || modal.item.version }}</span>
            </NSpace>
            <p v-if="isBusy(detail)" class="meta">
              {{ tx('关闭窗口后，任务仍会继续。', 'The task continues after this window is closed.') }}
            </p>
          </div>
          <NAlert v-if="detail.state === 'pending_config'" type="warning" :bordered="false" class="mb-16px">
            {{ tx('请补全必填配置后启用。', 'Complete the required configuration to enable the plugin.') }}
          </NAlert>
          <NAlert
            v-if="detail.error_code"
            :type="detail.state === 'failed' ? 'error' : 'warning'"
            :bordered="false"
            class="mb-16px"
          >
            {{
              detail.error_code === 'agent_offline' && detail.state === 'failed'
                ? tx('主机安装代理离线，请恢复后重试。', 'The host agent is offline. Restore it and retry.')
                : errorText(detail.error_code, tx)
            }}
          </NAlert>
          <div v-if="detail.state === 'enabled' && canOpenTemplates" class="access-section">
            <div>
              <h3>{{ tx('设备接入', 'Device connection') }}</h3>
              <p class="meta">{{ tx('使用 HTTP 模板创建设备。', 'Create devices using an HTTP template.') }}</p>
            </div>
            <NButton type="primary" @click="goToTemplates">{{ tx('设备模板', 'Device templates') }}</NButton>
          </div>
          <div v-if="fieldEntries.length && detail.state !== 'uninstalled'" class="config-view">
            <div class="section-heading">
              <h3>{{ tx('配置', 'Configuration') }}</h3>
              <NButton v-if="!isBusy(detail)" text type="primary" :disabled="locked" @click="openConfig">
                {{ tx('修改', 'Edit') }}
              </NButton>
            </div>
            <div v-for="[key, spec] in fieldEntries" :key="key" class="row">
              <span class="k">{{ key }}</span>
              <span class="v">
                {{
                  spec.secret
                    ? detail.secrets_set.includes(key)
                      ? tx('已设置', 'Set')
                      : tx('未设置', 'Not set')
                    : detail.config[key] || '—'
                }}
              </span>
            </div>
          </div>
          <NCollapse
            v-if="progress.length"
            :key="`${detail.op_id}-${expandedProgress}`"
            :default-expanded-names="expandedProgress ? ['progress'] : []"
            class="operation-records"
          >
            <NCollapseItem
              name="progress"
              :title="expandedProgress ? tx('操作进度', 'Operation progress') : tx('最近操作记录', 'Latest operation')"
            >
              <NTimeline>
                <NTimelineItem
                  v-for="s in progress"
                  :key="s.step"
                  :type="
                    s.status === 'done'
                      ? 'success'
                      : s.status === 'failed'
                        ? 'error'
                        : s.status === 'waiting'
                          ? 'warning'
                          : s.status === 'active'
                            ? 'info'
                            : 'default'
                  "
                  :title="stepLabel(s.step, tx)"
                  :content="stepStatusLabel(s.status)"
                />
              </NTimeline>
            </NCollapseItem>
          </NCollapse>
        </template>
        <NAlert v-if="formError" type="error" :bordered="false" class="mt-16px" role="alert">{{ formError }}</NAlert>
      </div>
      <template #footer>
        <div class="modal-footer">
          <NDropdown
            v-if="modal.mode === 'detail' && modal.item && actionOptions(modal.item).length"
            trigger="click"
            :options="actionOptions(modal.item)"
            @select="key => selectAction(key)"
          >
            <NButton quaternary :disabled="locked">{{ tx('更多操作', 'More actions') }}</NButton>
          </NDropdown>
          <span v-else />
          <NSpace :key="modal.mode" justify="end">
            <NButton
              :disabled="locked"
              @click="
                (isForm && detail && detail.state !== 'uninstalled') || isConfirmation ? backToDetail() : closeModal()
              "
            >
              {{ isForm || isConfirmation ? tx('取消', 'Cancel') : tx('关闭', 'Close') }}
            </NButton>
            <NButton v-if="isForm" type="primary" :loading="submitting" :disabled="locked" @click="onSubmit">
              {{
                modal.mode === 'install'
                  ? tx('安装并启用', 'Install and enable')
                  : detail?.state === 'enabled'
                    ? tx('保存并应用', 'Save and apply')
                    : tx('保存并启用', 'Save and enable')
              }}
            </NButton>
            <NButton
              v-else-if="isConfirmation"
              :type="modal.mode === 'uninstall' ? 'error' : 'warning'"
              :loading="!!pendingAction"
              :disabled="locked"
              @click="act(modal.mode === 'uninstall' ? 'uninstall' : 'disable')"
            >
              {{ modal.mode === 'uninstall' ? tx('卸载', 'Uninstall') : tx('停用', 'Disable') }}
            </NButton>
            <template v-else-if="detail">
              <NButton
                v-if="detail.state === 'pending_config' && fieldEntries.length"
                type="primary"
                @click="openConfig"
              >
                {{ tx('完善配置', 'Complete configuration') }}
              </NButton>
              <NButton
                v-if="detail.state === 'failed'"
                type="primary"
                :loading="pendingAction === 'retry'"
                :disabled="locked"
                @click="act('retry')"
              >
                {{ retryLabel }}
              </NButton>
              <NButton
                v-if="detail.state === 'installed'"
                type="primary"
                :loading="pendingAction === 'enable'"
                :disabled="locked"
                @click="act('enable')"
              >
                {{ tx('启用', 'Enable') }}
              </NButton>
              <NButton v-if="detail.state === 'uninstalled'" type="primary" @click="reinstall">
                {{ tx('重新安装', 'Reinstall') }}
              </NButton>
            </template>
          </NSpace>
        </div>
      </template>
    </NModal>
  </div>
</template>

<style scoped>
.plugin-modal {
  max-height: calc(100dvh - 48px);
  display: flex;
  flex-direction: column;
}
.plugin-modal :deep(.n-card__content) {
  min-height: 0;
  overflow-y: auto;
}
.modal-footer,
.section-heading,
.access-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.modal-footer {
  flex-wrap: wrap;
}
.status-summary {
  margin-bottom: 20px;
}
.status-summary p {
  margin-top: 12px;
}
.status-summary .meta,
.access-section .meta {
  margin-bottom: 0;
}
h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px;
}
.form-intro {
  margin: 0 0 20px;
  line-height: 1.7;
}
.access-section,
.config-view {
  margin-bottom: 24px;
}
.operation-records {
  margin-top: 20px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
  gap: 16px;
}
.plugin-card {
  min-width: 0;
}
.plugin-card :deep(.n-card__content) {
  display: flex;
  flex-direction: column;
}
.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: auto;
  padding-top: 12px;
}
.card-footer .meta {
  margin-bottom: 0;
}
.desc {
  flex: 1;
  line-height: 1.6;
  overflow-wrap: anywhere;
  margin: 0 0 8px;
  color: v-bind('themeVars.textColor2');
}
.meta {
  margin: 0 0 8px;
  font-size: 12px;
  opacity: 0.7;
}
.config-view .row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid v-bind('themeVars.dividerColor');
}
.config-view .k {
  opacity: 0.7;
}
.config-view .v {
  max-width: 60%;
  overflow-wrap: anywhere;
  text-align: right;
}
</style>
