<script setup lang="ts">
import { nextTick, reactive, ref } from 'vue'
import { NButton, NForm, NFormItem, NIcon, NInput, NModal } from 'naive-ui'
import { LockClosedOutline, PersonOutline, StorefrontOutline } from '@vicons/ionicons5'
import { $t } from '@/locales'
import { marketLogin } from '@/service/api/market'
import { useMarketAuth } from '../composables/use-market-auth'

const { setToken } = useMarketAuth()

const emit = defineEmits(['login-success'])

const visible = ref(false)
const loading = ref(false)
const formRef = ref<any>(null)
const usernameInputRef = ref<any>(null)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: { required: true, message: () => $t('market.usernamePlaceholder'), trigger: 'blur' },
  password: { required: true, message: $t('market.password'), trigger: 'blur' }
}

const open = () => {
  loginForm.username = ''
  loginForm.password = ''
  visible.value = true
  nextTick(() => usernameInputRef.value?.focus())
}

const handleLogin = async () => {
  await formRef.value?.validate()
  loading.value = true
  try {
    const res: any = await marketLogin({ username: loginForm.username, password: loginForm.password })
    const auth = res?.data || res
    const token = auth?.token
    if (token) {
      setToken(token, auth.refresh_token, auth.expires_in, auth.expires_at)
      window.$message?.success($t('market.loginSuccess'))
      visible.value = false
      emit('login-success', token)
    }
  } catch {
    // error toast 已由 axios 拦截器 onError 统一处理，无需重复弹窗
  } finally {
    loading.value = false
  }
}

const handleGoToRegister = () => {
  // Opening the market portal registration page
  // The port 18083 is the Portal's host port as per deployment_info.md
  const marketUrl = window.location.origin.replace(/:\d+$/, ':18083') + '/register'
  window.open(marketUrl, '_blank')
}

defineExpose({ open })
</script>

<template>
  <NModal
    v-model:show="visible"
    preset="card"
    class="market-login-modal"
    :bordered="false"
    :segmented="false"
    :auto-focus="false"
    style="width: min(440px, calc(100vw - 32px))"
  >
    <div class="market-login-header">
      <div class="market-login-logo">
        <NIcon :size="26"><StorefrontOutline /></NIcon>
      </div>
      <div>
        <h2>{{ $t('market.loginTitle') }}</h2>
        <p>{{ $t('market.loginSubtitle') }}</p>
      </div>
    </div>

    <NForm
      ref="formRef"
      :model="loginForm"
      :rules="loginRules"
      label-placement="top"
      :show-require-mark="false"
      @keydown.enter.prevent="handleLogin"
    >
      <NFormItem :label="$t('market.username')" path="username">
        <NInput
          ref="usernameInputRef"
          v-model:value="loginForm.username"
          size="large"
          :placeholder="$t('market.usernamePlaceholder')"
          autocomplete="username"
        >
          <template #prefix><NIcon :component="PersonOutline" /></template>
        </NInput>
      </NFormItem>
      <NFormItem :label="$t('market.password')" path="password">
        <NInput
          v-model:value="loginForm.password"
          size="large"
          type="password"
          :placeholder="$t('market.passwordPlaceholder')"
          show-password-on="click"
          autocomplete="current-password"
        >
          <template #prefix><NIcon :component="LockClosedOutline" /></template>
        </NInput>
      </NFormItem>

      <NButton class="market-login-submit" type="primary" size="large" block :loading="loading" @click="handleLogin">
        {{ $t('market.login') }}
      </NButton>
    </NForm>

    <div class="market-login-footer">
      <span>{{ $t('market.noAccount') }}</span>
      <NButton text type="primary" @click="handleGoToRegister">{{ $t('market.goToRegister') }}</NButton>
    </div>
  </NModal>
</template>

<style scoped>
:global(.market-login-modal.n-card) {
  border-radius: 18px;
  box-shadow: 0 24px 64px rgb(15 23 42 / 18%);
}

:global(.market-login-modal .n-card-header) {
  padding: 18px 20px 0;
}

:global(.market-login-modal .n-card__content) {
  padding: 28px 32px 30px;
}

.market-login-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 28px;
}

.market-login-logo {
  display: flex;
  flex: 0 0 52px;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  color: #fff;
  background: linear-gradient(145deg, #4f6bff, #7065f5);
  border-radius: 15px;
  box-shadow: 0 10px 22px rgb(79 107 255 / 28%);
}

.market-login-header h2 {
  margin: 0;
  color: var(--n-title-text-color);
  font-size: 20px;
  font-weight: 650;
  line-height: 1.4;
}

.market-login-header p {
  margin: 4px 0 0;
  color: #8b93a7;
  font-size: 13px;
}

.market-login-submit {
  height: 44px;
  margin-top: 6px;
  border-radius: 9px;
  font-weight: 600;
  box-shadow: 0 8px 18px rgb(79 107 255 / 20%);
}

.market-login-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 22px;
  color: #8b93a7;
  font-size: 13px;
}

@media (max-width: 520px) {
  :global(.market-login-modal .n-card__content) {
    padding: 24px 22px 26px;
  }
}
</style>
