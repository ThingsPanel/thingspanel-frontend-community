<script setup lang="ts">
import { computed, reactive, ref, toRefs } from 'vue'
import { NAutoComplete, NButton, NForm, NFormItem, NInput } from 'naive-ui'
import { $t } from '@/locales'
import { useFormRules, useNaiveForm } from '@/hooks/common/form'
import { useAuthStore } from '@/store/modules/auth'
import { fetchSuperAdminInit } from '@/service/api/auth'
import { getConfirmPwdRule } from '@/utils/form/rule'

defineOptions({
  name: 'SuperAdminRegisterPage'
})

const auth = useAuthStore()
const { formRef, validate } = useNaiveForm()

interface FormModel {
  userName: string
  pwd: string
  confirmPwd: string
}

const model: FormModel = reactive({
  userName: '',
  pwd: '',
  confirmPwd: ''
})
const submitting = ref(false)

const canSubmit = computed(() => {
  return model.userName.trim() !== '' && model.pwd.trim() !== '' && model.confirmPwd.trim() !== ''
})

const commonDomains = ['qq.com', '163.com', 'gmail.com', 'outlook.com', 'sina.com', 'hotmail.com', 'yahoo.com']

const emailOptions = computed(() => {
  const email = model.userName
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
    userName: formRules.email,
    pwd: [
      {
        required: true,
        message: () => $t('form.pwd.required'),
        trigger: ['input', 'blur']
      },
      {
        validator: (_rule, value: string) => {
          const validSpecialChars = `!@#$%^&*()_+-=[]{};\\':"|,./<>?`
          const hasInvalidChar = [...value].some(char => !/[A-Za-z0-9]/.test(char) && !validSpecialChars.includes(char))
          if (hasInvalidChar) {
            return Promise.reject(new Error('密码只能包含英文字母、数字和常用特殊字符'))
          }
          if (value.length < 6 || !/[a-z]/.test(value) || !/\d/.test(value)) {
            return Promise.reject(new Error('密码至少6位，且必须包含小写字母和数字'))
          }
          return Promise.resolve()
        },
        trigger: ['input', 'blur']
      }
    ],
    confirmPwd: getConfirmPwdRule(toRefs(model).pwd)
  }
})

async function handleSubmit() {
  if (submitting.value) return

  try {
    await validate()
    submitting.value = true
    const resp = (await fetchSuperAdminInit({
      email: model.userName.trim(),
      password: model.pwd,
      confirm_password: model.confirmPwd
    })) as any

    if (resp?.error) {
      window.$message?.error(resp.error?.msg || resp.error?.message || '本地初始化失败，请检查邮箱和密码后重试')
      return
    }

    if (!resp.data?.token) {
      window.$message?.error('超管创建接口未返回登录凭证，请刷新后重新登录')
      return
    }

    const loginToken: Api.Auth.LoginToken = {
      token: resp.data.token,
      refreshToken: resp.data.refreshToken || '',
      expires_in: resp.data.expires_in || 3600
    }
    const { loop } = await auth.loginByToken(loginToken)
    if (!loop) {
      window.$message?.error('超管已创建，但自动登录失败，即将返回登录页')
      setTimeout(() => window.location.reload(), 1000)
      return
    }

    window.$message?.success('超管创建成功')
    window.location.href = '/'
  } catch (error: any) {
    const msg = error?.error?.message || error?.response?.data?.message
    window.$message.error(msg || error?.message || '本地初始化失败，请检查邮箱和密码后重试')
    console.error('Initialization failed:', error)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <NForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false" autocomplete="off">
    <NFormItem path="userName">
      <NAutoComplete
        v-model:value="model.userName"
        :options="emailOptions"
        placeholder="请输入用户名（邮箱）"
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
        @keydown.enter="handleSubmit"
      />
    </NFormItem>
    <div class="mb-4 text-xs text-gray-500">密码至少6位，且必须包含小写字母和数字</div>

    <NButton
      type="primary"
      size="large"
      round
      block
      :loading="submitting || auth.loginLoading"
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
