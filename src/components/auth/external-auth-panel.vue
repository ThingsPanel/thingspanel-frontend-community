<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { NAlert, NButton, NCard, NFormItem, NInput, NSpace, NSpin } from 'naive-ui'
import {
  authEndpoint,
  externalAuth,
  getLoginOptions,
  type ExternalProvider,
  type ExternalResult
} from '@/service/api/external-auth'
import { fetchLogin } from '@/service/api/auth'
import { useAuthStore } from '@/store/modules/auth'
import { useRouteStore } from '@/store/modules/route'
import { passwordProof } from './password-proof'
import { consumeAuthReturn, rememberAuthReturn } from './navigation'
import { initializeExternalSession } from './session'

const props = defineProps<{ callback?: boolean }>()
const { t } = useI18n({
  useScope: 'local',
  messages: {
    'zh-CN': {
      title: '外部账号登录',
      bind: '绑定已有账号',
      explanation: '外部身份尚未绑定。请验证已有账号，随后再次确认外部身份；绑定后保留原来的设备和权限。',
      email: '已有账号',
      password: '账号密码',
      confirm: '验证账号并绑定',
      cancel: '返回账号登录',
      retry: '登录未完成，请重新登录或稍后重试。',
      forbidden: '当前账号不允许使用此登录方式。',
      done: '绑定成功',
      unavailable: '认证服务暂不可用，请稍后重试。'
    },
    'en-US': {
      title: 'External sign-in',
      bind: 'Link an existing account',
      explanation:
        'Verify your existing account, then confirm your external identity again. Your devices and permissions stay with your original account.',
      email: 'Existing account',
      password: 'Password',
      confirm: 'Verify and link account',
      cancel: 'Back to account sign-in',
      retry: 'Sign-in did not complete. Please sign in again or retry later.',
      forbidden: 'This sign-in method is not allowed for this account.',
      done: 'Account linked',
      unavailable: 'Authentication is temporarily unavailable. Please retry later.'
    }
  }
})
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const routes = useRouteStore()
const providers = ref<ExternalProvider[]>([])
const bindingProvider = ref('')
const email = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')
function fail(e: unknown) {
  error.value = t(
    e instanceof Error && e.message === 'AUTH_403'
      ? 'forbidden'
      : e instanceof Error && e.message === 'AUTH_503'
        ? 'unavailable'
        : 'retry'
  )
}
let issuedSession = false
async function enter() {
  try {
    await routes.initAuthRoute()
    if (!routes.isInitAuthRoute) throw new Error('AUTH_FAILED')
    await router.replace(consumeAuthReturn())
  } catch (e) {
    if (issuedSession) await auth.resetStore()
    throw e
  }
}
async function finish(session: Api.Auth.LoginToken) {
  issuedSession = true
  await initializeExternalSession(
    () => auth.loginByToken(session),
    () => auth.resetStore()
  )
}
async function link() {
  if (busy.value || !email.value || !password.value) return
  busy.value = true
  error.value = ''
  try {
    const { password: proof, salt } = passwordProof(password.value)
    const response = await fetchLogin(email.value, proof, salt)
    if (!response.data) throw new Error('AUTH_FAILED')
    await finish(response.data)
    const start = await externalAuth<{ url: string }>('/auth/external/bind/start', {
      provider: bindingProvider.value,
      password: proof,
      salt
    })
    password.value = ''
    const target = new URL(start.url)
    if (target.protocol !== 'https:') throw new Error('AUTH_FAILED')
    window.location.assign(target.href)
  } catch (e) {
    fail(e)
  } finally {
    password.value = ''
    busy.value = false
  }
}
onMounted(async () => {
  if (!props.callback) {
    try {
      const options = await getLoginOptions('web')
      providers.value = options.external.enabled ? options.external.providers : []
    } catch {
      providers.value = []
      // Optional discovery failure must not impersonate a password login failure.
      console.warn('[auth] Optional sign-in options could not be loaded.')
    }
    return
  }
  const params = new URLSearchParams(window.location.hash.slice(1))
  const ticket = params.get('ticket')
  const purpose = params.get('purpose')
  window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search)
  if (!ticket || !['login', 'bind'].includes(purpose || '')) {
    error.value = t('retry')
    return
  }
  busy.value = true
  try {
    if (purpose === 'bind') {
      await externalAuth('/auth/external/bind/complete', { ticket })
      await enter()
      return
    }
    const result = await externalAuth<ExternalResult>('/auth/external/exchange', { ticket })
    if ('status' in result) {
      bindingProvider.value = result.provider
      return
    }
    await finish(result)
    await enter()
  } catch (e) {
    fail(e)
  } finally {
    busy.value = false
  }
})
</script>

<template>
  <NCard v-if="callback" class="auth-result" :title="bindingProvider ? t('bind') : t('title')">
    <NSpace vertical :size="20">
      <NSpin v-if="busy" />
      <NAlert v-if="error" type="error" role="alert">{{ error }}</NAlert>
      <template v-if="bindingProvider">
        <p>{{ t('explanation') }}</p>
        <NFormItem :label="t('email')">
          <NInput
            v-model:value="email"
            :input-props="{ 'aria-label': t('email') }"
            autocomplete="username"
            :disabled="busy"
          />
        </NFormItem>
        <NFormItem :label="t('password')">
          <NInput
            v-model:value="password"
            :input-props="{ 'aria-label': t('password') }"
            type="password"
            autocomplete="current-password"
            :disabled="busy"
            @keydown.enter="link"
          />
        </NFormItem>
        <NButton block type="primary" :loading="busy" :disabled="!email || !password" @click="link">
          {{ t('confirm') }}
        </NButton>
      </template>
      <NButton block :disabled="busy" @click="router.replace('/login')">{{ t('cancel') }}</NButton>
    </NSpace>
  </NCard>
  <NSpace v-else-if="providers.length" vertical :size="12" class="mt-16px">
    <div class="text-center text-sm text-secondary">{{ t('title') }}</div>
    <NButton
      v-for="provider in providers"
      :key="provider.id"
      block
      tag="a"
      :href="authEndpoint('/auth/external/start?provider=' + encodeURIComponent(provider.id))"
      @click="rememberAuthReturn(route.query.redirect)"
    >
      {{ provider.label }}
    </NButton>
  </NSpace>
</template>

<style scoped>
.auth-result {
  width: min(440px, calc(100vw - 32px));
  margin: 12vh auto 32px;
}
</style>
