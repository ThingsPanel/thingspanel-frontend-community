<script setup lang="ts">
import { computed, reactive } from 'vue'
import { NAutoComplete, NButton, NForm, NFormItem, NInput } from 'naive-ui'
import { $t } from '@/locales'
import { useFormRules, useNaiveForm } from '@/hooks/common/form'
import { useAuthStore } from '@/store/modules/auth'
import { fetchSuperAdminInit } from '@/service/api/auth'

defineOptions({
  name: 'SuperAdminRegisterPage'
})

const auth = useAuthStore()
const { formRef, validate } = useNaiveForm()

interface FormModel {
  email: string
  pwd: string
}

const model: FormModel = reactive({
  email: '',
  pwd: ''
})

const canSubmit = computed(() => {
  return model.email.trim() !== '' && model.pwd.trim() !== ''
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
        required: true,
        message: () => $t('form.pwd.required'),
        trigger: ['input', 'blur']
      }
    ]
  }
})

async function handleSubmit() {
  try {
    await validate()
    const resp = (await fetchSuperAdminInit({
      email: model.email.trim(),
      password: model.pwd
    })) as any

    if (resp?.error) {
      window.$message?.error(resp.error?.msg || resp.error?.message || '本地初始化失败，请检查邮箱和密码后重试')
      return
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
    const msg = error.response?.data?.message
    window.$message.error(msg || error?.message || '本地初始化失败，请检查邮箱和密码后重试')
    console.error('Initialization failed:', error)
  }
}
</script>

<template>
  <NForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false" autocomplete="off">
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
  </NForm>
</template>

<style scoped>
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px white inset !important;
  -webkit-text-fill-color: inherit !important;
  transition: background-color 5000s ease-in-out 0s;
}
</style>
