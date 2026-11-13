<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { catalogDescription, healthLabel } from './install-presentation'
import { nanoid } from '@sa/utils'
import {
  NAlert,
  NButton,
  NCard,
  NDrawer,
  NDrawerContent,
  NEmpty,
  NForm,
  NFormItem,
  NInput,
  NPopconfirm,
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
const description = (text: string) => catalogDescription(text, locale.value)
const health = (value: string | undefined) => healthLabel(value, locale.value)
const tx = (zh: string, en: string) => (locale.value.toLowerCase().startsWith('zh') ? zh : en)

const items = ref<CatalogItem[]>([])
const loading = ref(false)
const notice = ref('') // page-level problem: agent offline / not configured
const drawer = reactive({
  open: false,
  item: null as CatalogItem | null,
  mode: 'install' as 'install' | 'config' | 'detail'
})
const form = reactive<Record<string, string>>({})
const submitting = ref(false)
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
  loading.value = items.value.length === 0
  const { data, error } = await getInstallCatalog()
  loading.value = false
  if (error) {
    notice.value = describeError(error)
    return
  }
  notice.value = ''
  items.value = data || []
  if (drawer.open && drawer.item) {
    const fresh = items.value.find(i => i.id === drawer.item?.id)
    if (fresh) drawer.item = fresh
    if (fresh?.installation) await refreshDetail(fresh.installation.id)
  }
}

async function refreshDetail(id: string) {
  const { data } = await getInstallation(id)
  if (data) detail.value = data
}

const anyBusy = computed(() => items.value.some(i => isBusy(i.installation)))

function resetForm(item: CatalogItem) {
  Object.keys(form).forEach(k => delete form[k])
  for (const key of Object.keys(item.fields)) form[key] = item.installation?.config?.[key] ?? ''
  formError.value = ''
}

function openInstall(item: CatalogItem) {
  drawer.item = item
  drawer.mode = item.installation && item.installation.state !== 'uninstalled' ? 'detail' : 'install'
  resetForm(item)
  clickKey = nanoid()
  detail.value = item.installation
  drawer.open = true
  if (item.installation) void refreshDetail(item.installation.id)
}

function openConfig() {
  if (!drawer.item) return
  resetForm(drawer.item)
  if (detail.value) for (const k of Object.keys(drawer.item.fields)) form[k] = detail.value.config?.[k] ?? ''
  drawer.mode = 'config'
}

function closeDrawer() {
  drawer.open = false
  // never keep a typed secret around after the drawer is closed
  Object.keys(form).forEach(k => (form[k] = ''))
}

function validate(item: CatalogItem): string {
  const have = detail.value?.secrets_set ?? item.installation?.secrets_set ?? []
  const missing = missingFields(item.fields, form, have)
  const requiredSet = drawer.mode === 'install'
  if (requiredSet && missing.length) return tx(`请填写：${missing.join('、')}`, `Please fill in: ${missing.join(', ')}`)
  for (const [key, spec] of Object.entries(item.fields)) {
    if (spec.validate === 'url' && form[key] && !isHttpUrl(form[key].trim()))
      return tx(`${key} 必须是 http(s) 地址`, `${key} must be an http(s) URL`)
  }
  return ''
}

async function onSubmit() {
  const item = drawer.item
  if (!item || submitting.value) return // a second click while the first is in flight does nothing
  formError.value = validate(item)
  if (formError.value) return
  submitting.value = true
  const config = buildConfig(item.fields, form)
  const result =
    drawer.mode === 'config' && item.installation
      ? await updateInstallConfig(item.installation.id, config)
      : await submitInstall(item.id, config, clickKey)
  submitting.value = false
  if (result.error) {
    formError.value = describeError(result.error)
    return
  }
  Object.keys(form).forEach(k => (form[k] = '')) // the secret is gone from the browser as soon as it is accepted
  clickKey = nanoid()
  detail.value = result.data as Installation
  drawer.mode = 'detail'
  await load()
}

async function act(action: 'enable' | 'disable' | 'retry') {
  const id = detail.value?.id
  if (!id) return
  const { data, error } = await installAction(id, action)
  if (error) formError.value = describeError(error)
  else detail.value = data as Installation
  await load()
}

async function onUninstall() {
  const id = detail.value?.id
  if (!id) return
  const { data, error } = await uninstallPlugin(id)
  if (error) formError.value = describeError(error)
  else detail.value = data as Installation
  await load()
}

// Site details first, secrets last (the server returns the fields in alphabetical order).
const fieldEntries = computed(() =>
  Object.entries(drawer.item?.fields ?? {}).sort(
    ([ka, a], [kb, b]) => Number(a.secret) - Number(b.secret) || ka.localeCompare(kb)
  )
)
const progress = computed(() => (detail.value ? stepProgress(detail.value, detail.value.events ?? []) : []))
const detailView = computed(() => stateView(detail.value?.state, tx))

onMounted(() => {
  void load()
  timer = setInterval(() => {
    if (anyBusy.value || drawer.open) void load()
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
            <NButton type="primary" size="small" @click="openInstall(item)">
              {{
                !item.installation || item.installation.state === 'uninstalled'
                  ? tx('安装', 'Install')
                  : tx('管理', 'Manage')
              }}
            </NButton>
          </div>
        </NCard>
      </div>
    </NSpin>

    <NDrawer :show="drawer.open" :width="'min(460px, 100vw)'" @update:show="v => !v && closeDrawer()">
      <NDrawerContent :title="drawer.item?.display_name" closable>
        <div v-if="drawer.item">
          <div v-if="drawer.mode !== 'detail'" key="form">
            <NAlert type="info" :bordered="false" class="mb-12px">
              {{
                tx(
                  '将在本机以独立容器运行该插件，并为它签发可撤销的运行身份。只需填写现场信息；令牌只保存在主机安装代理里，界面不会再显示。',
                  'The plugin runs as its own container with a revocable runtime identity. Only site details are needed; the token is kept by the host agent and never shown again.'
                )
              }}
            </NAlert>
            <NForm label-placement="top" @submit.prevent="onSubmit">
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
                <template #feedback>{{ spec.description }}</template>
              </NFormItem>
            </NForm>
            <NAlert v-if="formError" type="error" :bordered="false">{{ formError }}</NAlert>
          </div>

          <div v-else-if="detail" key="detail">
            <NSpace align="center" class="mb-12px">
              <NTag :type="detailView.type">{{ detailView.label }}</NTag>
              <span v-if="detail.state === 'enabled'">{{ tx('健康', 'Health') }}: {{ health(detail.health) }}</span>
            </NSpace>
            <NAlert v-if="detail.state === 'pending_config'" type="warning" :bordered="false" class="mb-12px">
              {{
                tx(
                  '已创建，但还有必填项没有填写；填写后会自动安装。',
                  'Created, but required fields are missing. It installs automatically once they are filled in.'
                )
              }}
            </NAlert>
            <NAlert
              v-if="detail.error_code"
              :type="detail.state === 'failed' ? 'error' : 'warning'"
              :bordered="false"
              class="mb-12px"
            >
              {{ errorText(detail.error_code, tx) }}
            </NAlert>
            <NTimeline v-if="detail.state !== 'pending_config'">
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
                        : 'default'
                "
                :content="stepLabel(s.step, tx)"
                :title="s.status === 'waiting' ? tx('等待中，将自动重试', 'Waiting, retrying automatically') : ''"
              />
            </NTimeline>
            <div class="config-view">
              <div v-for="[key, spec] in fieldEntries" :key="key" class="row">
                <span class="k">{{ key }}</span>
                <span class="v">
                  {{
                    spec.secret
                      ? detail.secrets_set.includes(key)
                        ? tx('已设置', 'Set')
                        : tx('未设置', 'Not set')
                      : detail.config[key] || '-'
                  }}
                </span>
              </div>
            </div>
            <NAlert v-if="formError" type="error" :bordered="false" class="mt-12px">{{ formError }}</NAlert>
          </div>
        </div>

        <template #footer>
          <NSpace v-if="drawer.mode !== 'detail'">
            <NButton type="primary" :loading="submitting" :disabled="submitting" @click="onSubmit">
              {{ drawer.mode === 'config' ? tx('保存', 'Save') : tx('安装', 'Install') }}
            </NButton>
            <NButton v-if="detail" @click="drawer.mode = 'detail'">{{ tx('返回', 'Back') }}</NButton>
          </NSpace>
          <NSpace v-else-if="detail">
            <NButton v-if="detail.state === 'pending_config'" type="primary" @click="openConfig">
              {{ tx('去填写', 'Fill in') }}
            </NButton>
            <NButton v-if="detail.state === 'failed'" type="primary" @click="act('retry')">
              {{ tx('重试', 'Retry') }}
            </NButton>
            <NButton v-if="detail.state === 'installed'" type="primary" @click="act('enable')">
              {{ tx('启用', 'Enable') }}
            </NButton>
            <NButton v-if="detail.state === 'enabled'" @click="act('disable')">{{ tx('停用', 'Disable') }}</NButton>
            <NButton v-if="!['installing', 'uninstalling', 'uninstalled'].includes(detail.state)" @click="openConfig">
              {{ tx('修改配置', 'Edit configuration') }}
            </NButton>
            <NPopconfirm
              v-if="!['uninstalling', 'uninstalled'].includes(detail.state)"
              :positive-text="tx('卸载', 'Uninstall')"
              :negative-text="tx('取消', 'Cancel')"
              @positive-click="onUninstall"
            >
              <template #trigger>
                <NButton type="error" ghost>{{ tx('卸载', 'Uninstall') }}</NButton>
              </template>
              {{
                tx(
                  '将停止插件并吊销其运行身份。已创建的设备与历史数据会保留；重新安装需要再次填写令牌。',
                  'This stops the plugin and revokes its identity. Devices and history are kept; reinstalling needs the token again.'
                )
              }}
            </NPopconfirm>
            <NButton v-if="detail.state === 'uninstalled'" type="primary" @click="drawer.mode = 'install'">
              {{ tx('重新安装', 'Reinstall') }}
            </NButton>
          </NSpace>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>

<style scoped>
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
  color: var(--text-color-2, #666);
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
  border-bottom: 1px solid rgb(226 232 240 / 60%);
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
