<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { NAutoComplete, NButton, NForm, NFormItem, NInput, NSpace } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { $t } from '@/locales'
import { useRouterPush } from '@/hooks/common/router'
import { useFormRules, useNaiveForm } from '@/hooks/common/form'
import useSmsCode from '@/hooks/business/use-sms-code'
import { useAuthStore } from '@/store/modules/auth'
import { fetchEmailCode, registerByEmail } from '@/service/api/auth'
import { localStg } from '@/utils/storage'

defineOptions({
  name: 'RegisterPage'
})

const { locale } = useI18n()
const auth = useAuthStore()
const { toggleLoginModule } = useRouterPush()
const { formRef, validate } = useNaiveForm()

interface FormModel {
  email: string
  phone: string
  code: string
  pwd: string
  country_code: string
}

const model: FormModel = reactive({
  email: '',
  phone: '',
  code: '',
  pwd: '',
  country_code: '+86'
})
const { label, isCounting, loading: smsLoading, start } = useSmsCode()

// 判断表单是否可以提交
const canSubmit = computed(() => {
  return model.email.trim() !== '' && model.code.trim() !== '' && model.pwd.trim() !== '' && model.pwd.length >= 6
})

// 常用邮箱后缀列表
const commonDomains = ['qq.com', '163.com', 'gmail.com', 'outlook.com', 'sina.com', 'hotmail.com', 'yahoo.com']

// 计算邮箱自动补全选项
const emailOptions = computed(() => {
  const email = model.email
  if (!email || !email.includes('@')) {
    return [] // 如果没有输入或不包含 @，则不提示
  }

  const parts = email.split('@')
  const username = parts[0]
  const domainInput = parts[1] || '' // @ 后面的部分

  if (username === '') {
    return [] // 如果 @ 前面为空，则不提示
  }

  // 过滤常用域名，基于用户在 @ 后输入的内容
  const filteredDomains = commonDomains.filter(
    domain => domain.startsWith(domainInput) && domain !== domainInput // 只有当域名部分匹配且不等于完整域名时才提示
  )

  // 生成完整的邮箱建议
  return filteredDomains.map(domain => `${username}@${domain}`)
})

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  const { formRules } = useFormRules()

  return {
    email: formRules.email,
    phone: formRules.phoneWithCountryCode,
    code: formRules.code,
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
    ]
  }
})

function handleSmsCode() {
  // 调用 fetchEmailCode 函数获取验证码
  fetchEmailCode(model.email)
    .then((res: any) => {
      if (process.env.NODE_ENV === 'development') {
      }
      const { error } = res
      if (!error) {
        start() // 开始计时
        window.$message?.success($t('page.login.common.codeSent'))
      }
    })
    .catch(error => {
      // 错误处理已经在 useSmsCode 中完成，这里不需要重复处理
      console.error('Failed to send verification code:', error)
    })
}

// 处理按钮点击
function handleButtonClick() {
  handleSubmit()
}

async function handleSubmit() {
  try {
    await validate()

    const resp = (await registerByEmail({
      email: model.email,
      verify_code: model.code,
      password: model.pwd,
      phone_prefix: model.country_code,
      phone_number: model.phone
    })) as any

    // 只在注册成功时显示消息并处理后续操作
    if (!resp.error) {
      window.$message?.success($t('page.login.register.registerSuccess'))

      // 如果响应中有 token，直接使用它进行登录
      if (resp.data && resp.data.token) {
        // 存储 token 和过期时间
        localStg.set('token', resp.data.token)
        const expires_in = Date.now() + (resp.data.expires_in || 360000) * 1000
        localStg.set('token_expires_in', expires_in.toString())

        // 重载页面以应用新 token
        setTimeout(() => {
          window.location.href = '/'
        }, 1500)
      } else {
        // 如果没有 token，则跳转到登录页面
        setTimeout(() => {
          toggleLoginModule('pwd-login')
        }, 1500)
      }
    }
  } catch (error: any) {
    // 不显示错误消息，静默失败
    console.error('Registration failed:', error)
  }
}

const countryCodeOptions = [
  { label: '+86', value: '+86' },
  { label: '+1', value: '+1' },
  { label: '+44', value: '+44' },
  { label: '+33', value: '+33' },
  { label: '+49', value: '+49' },
  { label: '+39', value: '+39' },
  { label: '+34', value: '+34' },
  { label: '+7', value: '+7' },
  { label: '+81', value: '+81' },
  { label: '+82', value: '+82' },
  { label: '+65', value: '+65' },
  { label: '+60', value: '+60' },
  { label: '+66', value: '+66' },
  { label: '+84', value: '+84' },
  { label: '+62', value: '+62' },
  { label: '+63', value: '+63' },
  { label: '+91', value: '+91' },
  { label: '+61', value: '+61' },
  { label: '+64', value: '+64' },
  { label: '+55', value: '+55' },
  { label: '+52', value: '+52' },
  { label: '+54', value: '+54' },
  { label: '+27', value: '+27' },
  { label: '+20', value: '+20' },
  { label: '+971', value: '+971' },
  { label: '+966', value: '+966' },
  { label: '+90', value: '+90' },
  { label: '+31', value: '+31' },
  { label: '+46', value: '+46' },
  { label: '+47', value: '+47' },
  { label: '+45', value: '+45' },
  { label: '+41', value: '+41' },
  { label: '+43', value: '+43' },
  { label: '+32', value: '+32' },
  { label: '+351', value: '+351' },
  { label: '+30', value: '+30' },
  { label: '+48', value: '+48' },
  { label: '+420', value: '+420' },
  { label: '+36', value: '+36' },
  { label: '+385', value: '+385' },
  { label: '+852', value: '+852' },
  { label: '+853', value: '+853' },
  { label: '+886', value: '+886' }
]
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
    <NFormItem path="code">
      <div class="w-full flex-y-center">
        <NInput v-model:value="model.code" :placeholder="$t('page.login.common.codePlaceholder')" autocomplete="off" />
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
    <NFormItem path="phone">
      <div class="flex gap-2">
        <NSelect
          v-model:value="model.country_code"
          :options="countryCodeOptions"
          class="w-32"
          :placeholder="$t('page.login.common.countryCodePlaceholder')"
        />
        <NInput
          v-model:value="model.phone"
          :placeholder="$t('page.login.common.phonePlaceholder')"
          autocomplete="off"
        />
      </div>
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

    <NSpace vertical :size="18" class="w-full">
      <NButton
        type="primary"
        size="large"
        round
        block
        :loading="auth.loginLoading"
        :disabled="!canSubmit"
        @click="handleButtonClick"
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
