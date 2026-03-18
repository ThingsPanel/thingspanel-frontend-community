<script setup lang="ts">
import { computed, reactive } from 'vue'
import { NAutoComplete, NButton, NForm, NFormItem, NInput, NSpace } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { $t } from '@/locales'
import { useRouterPush } from '@/hooks/common/router'
import { useFormRules, useNaiveForm } from '@/hooks/common/form'
import { useAuthStore } from '@/store/modules/auth'
import { fetchMarketRegister } from '@/service/api/auth'
import { localStg } from '@/utils/storage'

defineOptions({
  name: 'SuperAdminRegisterPage'
})

const { locale } = useI18n()
const auth = useAuthStore()
const { toggleLoginModule } = useRouterPush()
const { formRef, validate } = useNaiveForm()

/** 超管注册：仅邮箱+密码（市场已注册邮箱），不要 IoT 邮箱验证码 */
interface FormModel {
  email: string
  pwd: string
  confirmPwd: string
}

const model: FormModel = reactive({
  email: '',
  pwd: '',
  confirmPwd: ''
})

const marketUrl = import.meta.env.VITE_MARKET_URL || 'http://localhost:5173'

const canSubmit = computed(() => {
  return model.email.trim() !== '' && model.pwd.trim() !== '' && model.pwd.length >= 6 && model.confirmPwd === model.pwd
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
    confirmPwd: [
      {
        validator: (_rule, value) => {
          if (value !== model.pwd) {
            return Promise.reject(new Error('两次输入密码不一致'))
          }
          return Promise.resolve()
        },
        message: '两次输入密码不一致',
        trigger: 'blur'
      }
    ]
  }
})

async function handleSubmit() {
  try {
    await validate()
    const resp = (await fetchMarketRegister({
      email: model.email,
      password: model.pwd
    })) as any

    if (!resp.error) {
      window.$message?.success('注册成功')
      if (resp.data && resp.data.token) {
        localStg.set('token', resp.data.token)
        const expires_in = Date.now() + (resp.data.expires_in || 360000) * 1000
        localStg.set('token_expires_in', expires_in.toString())
        setTimeout(() => {
          window.location.href = '/'
        }, 1500)
      }
    }
  } catch (error: any) {
    const code = error.response?.data?.code
    const msg = error.response?.data?.message
    // 200055：邮箱未在市场注册（勿用 200050，与功能模板删除等业务码冲突）
    if (code === 200055) {
      window.$message.warning(msg || '该邮箱未在市场注册，请先点击下方链接去市场注册')
    } else {
      window.$message.error(msg || error?.message || '注册失败')
      console.error('Registration failed:', error)
    }
  }
}

function goToMarketRegister() {
  window.open(`${marketUrl}/register`, '_blank')
}
</script>

<template>
  <NForm ref="formRef" :key="locale" :model="model" :rules="rules" size="large" :show-label="false" autocomplete="off">
    <NFormItem path="email">
      <NAutoComplete
        v-model:value="model.email"
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
        placeholder="请再次输入密码"
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

      <div class="market-tip">
        <span>请使用已在市场注册的邮箱；没有市场账号？</span>
        <NButton text type="primary" @click="goToMarketRegister">去市场注册</NButton>
      </div>

      <NButton size="large" round block @click="toggleLoginModule('pwd-login')">
        {{ $t('page.login.common.back') }}
      </NButton>
    </NSpace>
  </NForm>
</template>

<style scoped>
.w-full {
  width: 100%;
}

.market-tip {
  text-align: center;
  color: #999;
  font-size: 13px;
  line-height: 1.5;
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
