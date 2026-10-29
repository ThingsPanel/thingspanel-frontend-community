<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
  externalAuth,
  type ProviderConfig,
  type ProviderSetting,
  type ProviderSettingsView
} from '@/service/api/external-auth'
import { passwordProof } from '@/components/auth/password-proof'

const { locale } = useI18n()
const tx = (zh: string, en: string) => (locale.value.toLowerCase().startsWith('zh') ? zh : en)
const route = useRoute()
const router = useRouter()
const view = ref<ProviderSettingsView | null>(null)
const loading = ref(false)
const busy = ref(false)
const error = ref('')
const result = ref('')
const modal = ref(false)
const editing = ref<ProviderSetting | null>(null)
const operation = ref('save')
const config = ref<ProviderConfig>(emptyConfig())
const secret = ref('')
const password = ref('')
const code = ref('')
const modalError = ref('')
const kinds = computed(() => [
  { label: tx('微信小程序', 'WeChat Mini Program'), value: 'wechat-mini' },
  { label: tx('企业登录（OIDC）', 'Enterprise sign-in (OIDC)'), value: 'oidc' },
  { label: tx('网站微信扫码', 'WeChat website sign-in'), value: 'wechat-web' }
])
const names: Record<string, string[]> = {
  save: ['配置登录方式', 'Configure sign-in method'],
  validate: ['校验配置', 'Validate configuration'],
  test: ['测试登录', 'Test sign-in'],
  enable: ['启用登录方式', 'Enable sign-in method'],
  disable: ['停用登录方式', 'Disable sign-in method']
}
const modalTitle = computed(() => tx(...(names[operation.value] as [string, string])))
function emptyConfig(): ProviderConfig {
  return { id: '', label: '', kind: 'wechat-mini', tenantIds: [] }
}
function message(e: unknown) {
  const fields = (e as { fields?: string[] })?.fields
  if (fields?.length) {
    const labels: Record<string, string> = {
      id: tx('内部标识', 'Identifier'),
      label: tx('显示名称', 'Display name'),
      tenantIds: tx('允许使用的租户', 'Allowed tenants'),
      appId: 'AppID',
      appSecret: 'AppSecret',
      clientId: 'Client ID',
      clientSecret: 'Client Secret',
      issuer: 'Issuer',
      authorizeUrl: tx('授权地址', 'Authorization URL'),
      tokenUrl: tx('令牌地址', 'Token URL'),
      jwksUrl: 'JWKS URL',
      redirectUrl: tx('回调地址', 'Callback URL')
    }
    return (
      tx('请补全或修正：', 'Complete or correct: ') +
      fields.map(field => labels[field] || tx('配置字段', 'Configuration field')).join('、')
    )
  }
  const key = e instanceof Error ? e.message : ''
  if (key === 'AUTH_401') return tx('密码错误或登录已过期，请重新验证。', 'Incorrect password or expired session.')
  if (key === 'AUTH_403')
    return tx('请检查配置、租户范围和操作权限。', 'Check the configuration, tenant scope and permissions.')
  if (key === 'AUTH_409')
    return tx(
      '配置已更新，或当前版本尚未通过真实登录测试。请刷新后重试。',
      'Configuration changed or this revision has not passed a real sign-in test. Refresh and retry.'
    )
  return tx(
    '认证配置服务暂不可用。账号密码入口不受此页面操作影响，请检查部署配置后重试。',
    'Authentication configuration is unavailable. Check the deployment and retry.'
  )
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    view.value = await externalAuth<ProviderSettingsView>('/auth/admin/providers')
  } catch (e) {
    error.value = message(e)
  } finally {
    loading.value = false
  }
}
function open(row: ProviderSetting | null, action = 'save') {
  editing.value = row
  operation.value = action
  config.value = row ? { ...row.config, tenantIds: [...row.config.tenantIds] } : emptyConfig()
  secret.value = ''
  password.value = ''
  code.value = ''
  modalError.value = ''
  modal.value = true
}
function clearSecrets() {
  secret.value = ''
  password.value = ''
  code.value = ''
}
async function submit() {
  if (busy.value || !password.value) return
  modalError.value = ''
  busy.value = true
  try {
    const draft: ProviderConfig = {
      ...config.value,
      tenantIds: [...new Set(config.value.tenantIds)]
    }
    if (operation.value === 'save' && (!/^[a-z][a-z0-9_-]{0,63}$/.test(draft.id) || !draft.label.trim())) {
      modalError.value = tx(
        '请填写显示名称；内部标识以小写字母开头，只能包含小写字母、数字、连字符和下划线。',
        'Enter a display name and a lowercase identifier using letters, digits, hyphens or underscores.'
      )
      return
    }
    if (draft.kind === 'oidc') {
      draft.clientSecret = secret.value
      draft.appSecret = ''
    } else {
      draft.appSecret = secret.value
      draft.clientSecret = ''
    }
    if (draft.kind !== 'wechat-mini') draft.redirectUrl = view.value?.callbackUrl || ''
    const proof = passwordProof(password.value)
    const response = await externalAuth<{ url?: string }>('/auth/admin/providers', {
      operation: operation.value,
      id: draft.id,
      expectedRevision: editing.value?.revision || 0,
      ...(operation.value === 'save' ? { config: draft } : {}),
      ...proof,
      code: code.value
    })
    clearSecrets()
    if (response.url) {
      const target = new URL(response.url)
      if (target.protocol !== 'https:') throw new Error('AUTH_FAILED')
      window.location.assign(target.href)
      return
    }
    modal.value = false
    result.value =
      operation.value === 'validate'
        ? editing.value?.testedRevision === editing.value?.revision
          ? tx(
              '配置校验通过，当前版本已有成功的真实登录测试记录。',
              'Configuration validated. This revision already has a successful sign-in test.'
            )
          : tx(
              '字段校验通过。启用前仍需完成真实登录测试。',
              'Configuration validated. A real sign-in test is still required before enabling.'
            )
        : operation.value === 'save'
          ? tx(
              '草稿已保存，尚未改变已生效配置。请校验并测试此版本。',
              'Draft saved. The active configuration is unchanged. Validate and test this revision.'
            )
          : tx('操作成功。', 'Operation completed.')
    await load()
  } catch (e) {
    modalError.value = message(e)
  } finally {
    password.value = ''
    busy.value = false
  }
}
function status(row: ProviderSetting) {
  if (row.enabled)
    return row.publishedRevision === row.revision
      ? tx('已启用', 'Enabled')
      : tx('已启用 · 有未发布修改', 'Enabled · unpublished changes')
  if (row.testedRevision === row.revision) return tx('测试通过 · 未启用', 'Tested · disabled')
  if (row.validatedRevision === row.revision) return tx('待真实登录测试', 'Sign-in test required')
  return tx('草稿 · 未启用', 'Draft · disabled')
}
onMounted(async () => {
  if (route.query.authTest) {
    result.value =
      route.query.authTest === 'success'
        ? tx(
            '本次提供方身份测试已完成，请刷新列表核对测试版本后启用。',
            'Provider test completed. Verify the tested revision before enabling.'
          )
        : tx(
            '测试未完成，配置保持原状态。请检查提供方配置后重新测试。',
            'Test did not complete. The active configuration is unchanged.'
          )
    const query = { ...route.query }
    delete query.authTest
    await router.replace({ query })
  }
  await load()
})
</script>

<template>
  <section class="auth-settings">
    <div class="settings-heading">
      <div>
        <h2>{{ tx('登录与认证', 'Sign-in and authentication') }}</h2>
        <p>
          {{
            tx(
              '管理第三方登录。完成配置和真实测试后，再向用户开放入口。',
              'Configure and test external sign-in before making it available to users.'
            )
          }}
        </p>
      </div>
      <NButton :loading="loading" @click="load">{{ tx('刷新', 'Refresh') }}</NButton>
    </div>
    <div class="local-method">
      <div>
        <strong>{{ tx('账号密码', 'Account and password') }}</strong>
        <p>
          {{
            tx(
              '使用现有平台账号，保留管理员恢复入口。',
              'Uses existing platform accounts and preserves administrator recovery.'
            )
          }}
        </p>
      </div>
      <NTag type="success" :bordered="false">{{ tx('已保留', 'Available') }}</NTag>
    </div>
    <NAlert v-if="error" type="error" class="mb-16px">{{ error }}</NAlert>
    <NAlert v-if="result" type="info" closable class="mb-16px" @close="result = ''">{{ result }}</NAlert>
    <NAlert v-if="view && !view.editable" type="info" class="mb-16px">
      {{
        view.reason === 'native_auth_not_enabled'
          ? tx(
              '第三方认证尚未部署启用，当前使用原账号登录。请由运维完成统一认证部署后配置来源。',
              'External authentication is not deployed. Complete the authentication deployment before configuring providers.'
            )
          : tx(
              '配置由部署文件管理。启用后台编辑前，需在服务器配置独立的认证设置加密密钥。',
              'Configuration is deployment-managed. Configure the provider encryption key on the server to enable editing.'
            )
      }}
    </NAlert>
    <div class="settings-heading compact">
      <h3>{{ tx('第三方登录方式', 'External sign-in methods') }}</h3>
      <NButton type="primary" :disabled="!view?.editable" @click="open(null)">
        {{ tx('添加登录方式', 'Add sign-in method') }}
      </NButton>
    </div>
    <NSpin :show="loading">
      <NEmpty
        v-if="!view?.providers.length"
        class="empty-methods"
        :description="
          tx(
            '尚未配置第三方登录，用户仍可使用账号密码登录。',
            'No external sign-in methods configured. Account and password sign-in remains available.'
          )
        "
      />
      <div v-for="row in view?.providers" :key="row.config.id" class="provider-row">
        <div class="provider-copy">
          <strong>{{ row.config.label }}</strong>
          <p>{{ kinds.find(k => k.value === row.config.kind)?.label }} · {{ row.config.id }}</p>
          <p>
            {{ tx('草稿版本', 'Draft revision') }} {{ row.revision }}
            <span v-if="row.testedAt">
              · {{ tx('最近测试', 'Last tested') }} {{ new Date(row.testedAt).toLocaleString() }}
            </span>
          </p>
        </div>
        <div class="provider-actions">
          <NTag :type="row.enabled ? 'success' : 'default'" :bordered="false">{{ status(row) }}</NTag>
          <NSpace :size="8">
            <NButton size="small" :disabled="!view?.editable" @click="open(row)">{{ tx('配置', 'Configure') }}</NButton>
            <NButton size="small" @click="open(row, 'validate')">{{ tx('校验', 'Validate') }}</NButton>
            <NButton size="small" @click="open(row, 'test')">{{ tx('测试登录', 'Test sign-in') }}</NButton>
            <NButton
              v-if="!row.enabled || row.publishedRevision !== row.revision"
              size="small"
              type="primary"
              :disabled="row.testedRevision !== row.revision"
              @click="open(row, 'enable')"
            >
              {{ tx('启用此版本', 'Enable revision') }}
            </NButton>
            <NButton v-if="row.enabled" size="small" @click="open(row, 'disable')">{{ tx('停用', 'Disable') }}</NButton>
          </NSpace>
        </div>
      </div>
    </NSpin>
    <div v-for="item in view?.diagnostics" :key="item.id" class="text-error mt-12px">
      {{ item.id }}：{{
        tx(
          '部署来源配置无效，已隔离；请检查私密配置文件。',
          'Invalid deployment provider configuration; provider isolated. Check the private configuration.'
        )
      }}
      ({{ item.code }})
    </div>
    <NModal
      v-model:show="modal"
      preset="card"
      :title="modalTitle"
      class="auth-config-modal"
      :style="{ width: 'min(720px, calc(100vw - 32px))', maxHeight: 'calc(100dvh - 40px)', overflowY: 'auto' }"
      :mask-closable="!busy"
      :close-on-esc="!busy"
      @after-leave="clearSecrets"
    >
      <NForm label-placement="top" @submit.prevent="submit">
        <template v-if="operation === 'save'">
          <div class="form-grid">
            <NFormItem :label="tx('方式类型', 'Method')">
              <NSelect v-model:value="config.kind" :options="kinds" :disabled="!!editing" @update:value="secret = ''" />
            </NFormItem>
            <NFormItem :label="tx('内部标识', 'Identifier')">
              <NInput v-model:value="config.id" :disabled="!!editing" placeholder="wechat-mini" :maxlength="64" />
            </NFormItem>
          </div>
          <NFormItem :label="tx('显示名称', 'Display name')">
            <NInput
              v-model:value="config.label"
              :placeholder="tx('例如：微信登录', 'For example: Sign in with WeChat')"
              :maxlength="80"
            />
          </NFormItem>
          <template v-if="config.kind === 'oidc'">
            <NFormItem label="Issuer">
              <NInput v-model:value="config.issuer" placeholder="https://idp.example.com" />
            </NFormItem>
            <NFormItem label="Client ID"><NInput v-model:value="config.clientId" /></NFormItem>
          </template>
          <NFormItem v-else label="AppID"><NInput v-model:value="config.appId" /></NFormItem>
          <NFormItem :label="config.kind === 'oidc' ? 'Client Secret' : 'AppSecret'">
            <NInput
              v-model:value="secret"
              type="password"
              show-password-on="click"
              autocomplete="new-password"
              :placeholder="
                editing?.secretConfigured
                  ? tx('已配置；留空保留原密钥', 'Configured; leave empty to retain')
                  : tx('填写服务端密钥', 'Enter server secret')
              "
            />
          </NFormItem>
          <NFormItem :label="tx('允许使用的租户', 'Allowed tenants')">
            <NSelect
              v-model:value="config.tenantIds"
              multiple
              filterable
              :options="view?.tenants?.map(t => ({ label: t.name, value: t.id })) || []"
              :placeholder="
                tx('请选择租户；用户仍使用原有权限', 'Select tenants; existing user permissions are preserved')
              "
            />
          </NFormItem>
          <template v-if="config.kind === 'oidc'">
            <NCollapse>
              <NCollapseItem :title="tx('提供方端点', 'Provider endpoints')" name="endpoints">
                <NFormItem :label="tx('授权地址', 'Authorization URL')">
                  <NInput v-model:value="config.authorizeUrl" />
                </NFormItem>
                <NFormItem :label="tx('令牌地址', 'Token URL')"><NInput v-model:value="config.tokenUrl" /></NFormItem>
                <NFormItem label="JWKS URL"><NInput v-model:value="config.jwksUrl" /></NFormItem>
              </NCollapseItem>
            </NCollapse>
          </template>
          <NFormItem
            v-if="config.kind !== 'wechat-mini'"
            :label="tx('回调地址（登记到身份提供方）', 'Callback URL (register with your provider)')"
          >
            <NInput :value="view?.callbackUrl" readonly />
          </NFormItem>
          <p class="field-help">
            {{
              tx(
                '保存为草稿，不会立即开放登录。变更身份或令牌端点时，需重新填写密钥。',
                'Saving creates a draft. Re-enter the secret when changing the identity or token endpoint.'
              )
            }}
          </p>
        </template>
        <template v-else>
          <p class="mb-16px">
            <strong>{{ config.label }}</strong>
            · {{ tx('配置版本', 'Configuration revision') }} {{ editing?.revision }}
          </p>
          <NAlert v-if="operation === 'test'" type="info" class="mb-16px">
            {{
              config.kind === 'wechat-mini'
                ? tx(
                    '使用测试小程序取得新的登录 code。测试只验证身份，不创建账号或绑定。',
                    'Obtain a fresh login code from the test mini program. The test does not create or link accounts.'
                  )
                : tx(
                    '将跳转到身份提供方完成真实登录。测试不会绑定账号或签发平台会话。',
                    'Complete a real provider sign-in. The test does not link accounts or issue a platform session.'
                  )
            }}
          </NAlert>
          <NFormItem
            v-if="operation === 'test' && config.kind === 'wechat-mini'"
            :label="tx('一次性测试 code', 'One-time test code')"
          >
            <NInput v-model:value="code" type="password" autocomplete="off" />
          </NFormItem>
          <p v-if="operation === 'disable'" class="field-help">
            {{
              tx(
                '停用后隐藏入口并禁止新登录、绑定和未完成事务；已登录会话按现有有效期处理。',
                'Disabling prevents new sign-ins, links and pending transactions. Existing sessions retain their normal lifetime.'
              )
            }}
          </p>
        </template>
        <NFormItem :label="tx('当前管理员密码', 'Current administrator password')">
          <NInput
            v-model:value="password"
            type="password"
            :input-props="{
              autocomplete: 'current-password',
              'aria-label': tx('当前管理员密码', 'Current administrator password')
            }"
            :disabled="busy"
          />
        </NFormItem>
        <NAlert v-if="modalError" type="error" class="mb-16px">{{ modalError }}</NAlert>
        <NSpace justify="end">
          <NButton :disabled="busy" @click="modal = false">{{ tx('取消', 'Cancel') }}</NButton>
          <NButton type="primary" attr-type="submit" :loading="busy" :disabled="!password">
            {{ operation === 'save' ? tx('保存草稿', 'Save draft') : modalTitle }}
          </NButton>
        </NSpace>
      </NForm>
    </NModal>
  </section>
</template>

<style scoped>
.auth-settings {
  max-width: 1120px;
  padding: 8px 0 20px;
}
.settings-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
h2 {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}
h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
}
p {
  margin: 6px 0 0;
  color: var(--n-text-color-3, #767c87);
  line-height: 1.6;
}
.local-method {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border: 1px solid var(--n-border-color, #e5e7eb);
  border-radius: 8px;
  margin-bottom: 24px;
}
.compact {
  align-items: center;
  margin-bottom: 12px;
}
.provider-row {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 20px 0;
  border-top: 1px solid var(--n-border-color, #e5e7eb);
}
.provider-copy {
  min-width: 0;
  overflow-wrap: anywhere;
}
.provider-actions {
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 12px;
}
.empty-methods {
  padding: 40px 16px;
  border: 1px dashed var(--n-border-color, #e5e7eb);
  border-radius: 8px;
}
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.field-help {
  margin-bottom: 16px;
  font-size: 13px;
}
@media (max-width: 760px) {
  .provider-row {
    flex-direction: column;
    gap: 12px;
  }
  .provider-actions {
    align-items: flex-start;
  }
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0;
  }
}
</style>
