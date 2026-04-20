<script setup lang="ts">
import { computed, onMounted, reactive, watch, toRefs } from 'vue'
import { NAutoComplete, NButton, NForm, NFormItem, NInput, NSpace } from 'naive-ui'
import { $t } from '@/locales'
import { useFormRules, useNaiveForm } from '@/hooks/common/form'
import { useAuthStore } from '@/store/modules/auth'
import { fetchSuperAdminInit } from '@/service/api/auth'
import { getConfirmPwdRule } from '@/utils/form/rule'

defineOptions({
  name: 'SuperAdminRegisterPage'
})

interface Props {
  marketUrl?: string
  marketEmail?: string
  marketRegistered?: boolean
  marketSource?: string
}

const props = withDefaults(defineProps<Props>(), {
  marketUrl: '',
  marketEmail: '',
  marketRegistered: false,
  marketSource: ''
})

const auth = useAuthStore()
const { formRef, validate } = useNaiveForm()
const fallbackMarketUrl = import.meta.env.VITE_MARKET_URL || 'https://r.thingspanel.cn'

interface FormModel {
  email: string
  pwd: string
  confirmPwd: string
}

const model: FormModel = reactive({
  email: props.marketEmail || '',
  pwd: '',
  confirmPwd: ''
})

const marketUrl = computed(() => {
  const configured = (props.marketUrl || fallbackMarketUrl).trim()
  if (!configured) return fallbackMarketUrl
  if (configured.includes('localhost') || configured.includes('127.0.0.1') || configured.includes('0.0.0.0')) {
    return fallbackMarketUrl
  }
  return configured
})

const emailLocked = computed(() => props.marketEmail.trim() !== '')

const canSubmit = computed(() => {
  return model.email.trim() !== '' && model.pwd.trim() !== '' && model.confirmPwd.trim() !== '' && model.pwd.length >= 6
})

const commonDomains = ['qq.com', '163.com', 'gmail.com', 'outlook.com', 'sina.com', 'hotmail.com', 'yahoo.com']

const emailOptions = computed(() => {
  const email = model.email
  if (!email || !email.includes('@')) {
    return []
  }
  const parts = email.split('@')
  const username = parts[0]
  const domainInput = parts[1] || ''
  if (username === '') {
    return []
  }
  const filteredDomains = commonDomains.filter(domain => domain.startsWith(domainInput) && domain !== domainInput)
  return filteredDomains.map(domain => `${username}@${domain}`)
})

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  const { formRules } = useFormRules()
  return {
    email: formRules.email,
    pwd: [
      {
        validator: (_rule, value) => {
          if (value.length < 6) {
            return Promise.reject(new Error($t('form.pwd.tip')))
          }
          if (!/[a-z]/.test(value)) {
            return Promise.reject(new Error($t('form.pwd.tip')))
          }
          return Promise.resolve()
        },
        message: () => $t('form.pwd.tip'),
        trigger: ['input', 'blur']
      }
    ],
    confirmPwd: getConfirmPwdRule(toRefs(model).pwd)
  }
})

function buildMarketRegisterUrl() {
  const base = marketUrl.value
  const url = base.endsWith('/register') ? new URL(base) : new URL('/register', base)
  url.searchParams.set('callback', window.location.href)
  url.searchParams.set('return_to', window.location.href)
  return url.toString()
}

function goToMarketRegister() {
  window.location.href = buildMarketRegisterUrl()
}

async function handleSubmit() {
  try {
    await validate()
    const resp = (await fetchSuperAdminInit({
      email: model.email.trim(),
      password: model.pwd,
      market_registered: props.marketRegistered,
      market_email: props.marketEmail.trim() || model.email.trim(),
      market_source: props.marketSource || 'horizon'
    })) as any

    if (resp?.error) {
      const code = resp?.error?.code ?? resp?.code
      if (code === 200055) {
        window.$message?.warning('该邮箱尚未完成市场注册，无法继续初始化')
        goToMarketRegister()
        return
      }
    }

    if (!resp.error) {
      window.$message?.success('本地初始化成功')
      if (resp.data && resp.data.token) {
        // 通过 loginByToken 完成登录流程，确保 userInfo 被正确存储到 localStorage
        // 这样 thingsvisAuthService.waitForUserInfo() 能正确获取用户信息
        const loginToken: Api.Auth.LoginToken = {
          token: resp.data.token,
          refreshToken: resp.data.refreshToken || '',
          expires_in: resp.data.expires_in || 3600
        }
        await auth.loginByToken(loginToken)

        setTimeout(() => {
          window.location.href = '/'
        }, 500)
      }
    }
  } catch (error: any) {
    const code = error.response?.data?.code
    const msg = error.response?.data?.message
    if (code === 200055) {
      window.$message.warning(msg || '该邮箱尚未完成市场注册，无法继续初始化')
      goToMarketRegister()
    } else {
      window.$message.error(msg || error?.message || '本地初始化失败，请检查邮箱和密码后重试')
      console.error('Initialization failed:', error)
    }
  }
}

watch(
  () => props.marketEmail,
  value => {
    if (value) {
      model.email = value
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (props.marketEmail) {
    model.email = props.marketEmail
  }
})
</script>

<template>
  <NForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false" autocomplete="off">
    <NFormItem path="email">
      <NAutoComplete
        v-model:value="model.email"
        :disabled="emailLocked"
        :options="emailOptions"
        :placeholder="$t('page.login.register.emailPlaceholder')"
        clearable
        autocomplete="off"
        @keydown.enter="handleSubmit"
      />
    </NFormItem>
    <NFormItem path="pwd">
      <NInput
        v-model:value="model.pwd"
        type="password"
        show-password-on="click"
        :placeholder="$t('page.login.common.passwordPlaceholder')"
        autocomplete="new-password"
      />
    </NFormItem>
    <NFormItem path="confirmPwd">
      <NInput
        v-model:value="model.confirmPwd"
        type="password"
        show-password-on="click"
        :placeholder="$t('page.login.common.confirmPasswordPlaceholder')"
        autocomplete="new-password"
      />
    </NFormItem>

    <NSpace vertical :size="18" class="w-full">
      <NButton
        type="primary"
        size="large"
        round
        block
        :loading="auth.loginLoading"
        :disabled="!canSubmit"
        @click="handleSubmit"
      >
        {{ $t('common.confirm') }}
      </NButton>
    </NSpace>
  </NForm>
</template>

<style scoped>
.w-full {
  width: 100%;
}

input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px white inset !important;
  -webkit-text-fill-color: inherit !important;
  transition: background-color 5000s ease-in-out 0s;
}
</style>
