<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { NAutoComplete, NButton, NForm, NFormItem, NInput, NSpace } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { $t } from '@/locales'
import { useRouterPush } from '@/hooks/common/router'
import { useFormRules, useNaiveForm } from '@/hooks/common/form'
import useSmsCode from '@/hooks/business/use-sms-code'
import { useAuthStore } from '@/store/modules/auth'
import { editUserPassWord, fetchEmailCodeByEmail } from '@/service/api/auth'

defineOptions({
  name: 'ResetPwd'
})

const { locale } = useI18n()
const auth = useAuthStore()
const { toggleLoginModule } = useRouterPush()
const { formRef, validate } = useNaiveForm()
const readOnly = ref(true)

interface FormModel {
  email: string
  verify_code: string
  password: string
}

const model: FormModel = reactive({
  email: '',
  verify_code: '',
  password: ''
})

// 常用邮箱后缀列表
const commonDomains = ['qq.com', '163.com', 'gmail.com', 'outlook.com', 'sina.com', 'hotmail.com', 'yahoo.com']

// 计算邮箱自动补全选项
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

const { label, isCounting, loading: smsLoading, start, isValidEmail } = useSmsCode()

// 判断表单是否可以提交
const canSubmit = computed(() => {
  return (
    model.email.trim() !== '' &&
    model.verify_code.trim() !== '' &&
    model.password.trim() !== '' &&
    model.password.length >= 6
  )
})

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  const { formRules } = useFormRules()

  return {
    email: formRules.email,
    verify_code: formRules.code,
    password: [
      {
        validator: (rule, value) => {
          if (value.length < 6) {
            return Promise.reject(rule.message)
          }
          if (!/[a-z]/.test(value)) {
            return Promise.reject(rule.message)
          }
          return Promise.resolve()
        },
        message: $t('form.pwd.tip'),
        trigger: ['input', 'blur']
      }
    ]
  }
})

async function handleSmsCode() {
  if (model.email) {
    if (await isValidEmail(model.email)) {
      const { error } = await fetchEmailCodeByEmail(model.email)
      if (!error) {
        start()
        window.$message?.success($t('page.login.common.codeSent'))
      }
    }
  } else {
    window.$message?.error($t('form.email.required'))
  }
}

async function handleSubmit() {
  try {
    await validate()

    const { error } = await editUserPassWord({
      email: model.email,
      verify_code: model.verify_code,
      password: model.password,
      is_register: 2
    })

    if (!error) {
      window.$message?.success($t('page.login.common.validateSuccess'))
      toggleLoginModule('pwd-login')
    }
  } catch (error) {
    console.error('Reset password failed:', error)
  }
}

setTimeout(() => {
  readOnly.value = false
}, 1000)
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
    <NFormItem path="verify_code">
      <div class="w-full flex-y-center">
        <NInput
          v-model:value="model.verify_code"
          :readonly="readOnly"
          :placeholder="$t('page.login.common.codePlaceholder')"
          autocomplete="off"
        />
        <div class="w-18px"></div>
        <NButton
          size="large"
          :disabled="isCounting || !model.email.trim()"
          :loading="smsLoading"
          @click="handleSmsCode"
        >
          {{ label }}
        </NButton>
      </div>
    </NFormItem>

    <NFormItem path="password">
      <div class="w-full">
        <NInput
          v-model:value="model.password"
          type="password"
          autocomplete="new-password"
          show-password-on="click"
          :placeholder="$t('page.login.common.passwordPlaceholder')"
        />
        <div class="mt-1 text-xs text-gray-500">{{ $t('form.pwd.tip') }}</div>
      </div>
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
      <NButton size="large" round block @click="toggleLoginModule('pwd-login')">
        {{ $t('page.login.common.back') }}
      </NButton>
    </NSpace>
  </NForm>
</template>

<style scoped>
/* 保留这个样式，防止自动填充背景变黄 */
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus,
input:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px white inset !important;
  -webkit-text-fill-color: inherit !important;
  transition: background-color 5000s ease-in-out 0s;
}
</style>
