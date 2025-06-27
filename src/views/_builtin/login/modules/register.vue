<script setup lang="ts">
import { computed, reactive, ref, toRefs } from 'vue'
import { $t } from '@/locales'
import { useRouterPush } from '@/hooks/common/router'
import { useFormRules, useNaiveForm } from '@/hooks/common/form'
import useSmsCode from '@/hooks/business/use-sms-code'
import { useAuthStore } from '@/store/modules/auth'
import { getConfirmPwdRule } from '@/utils/form/rule'
import { validPasswordByExp } from '@/utils/common/tool'

defineOptions({
  name: 'RegisterPage'
})

const auth = useAuthStore()
const { toggleLoginModule } = useRouterPush()
const { formRef, validate } = useNaiveForm()

interface FormModel {
  phone: string
  code: string
  pwd: string
  confirmPwd: string
}

const model: FormModel = reactive({
  phone: '',
  code: '',
  pwd: '',
  confirmPwd: ''
})
const { label, isCounting, loading: smsLoading, start } = useSmsCode()

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  const { formRules } = useFormRules() // inside computed to make locale reactive

  return {
    phone: formRules.phone,
    code: formRules.code,
    pwd: [
      {
        validator: (rule, value) => {
          if (value.length < 8 || value.length > 18) {
            return Promise.reject(rule.message)
          }
          if (!validPasswordByExp(value)) {
            return Promise.reject(rule.message)
          }
          return Promise.resolve()
        },
        message: "密码为6-18位字符，需包含字母、数字",
        trigger: ['input', 'blur']
      }
    ],
    confirmPwd: getConfirmPwdRule(toRefs(model).pwd)
  }
})
const agreement = ref(false)
// function handleSmsCode() {
//   getSmsCode(model.phone)
// }

function handleSmsCode() {
  start()
}
async function handleSubmit() {
  await validate()
  window.$message?.success("验证成功")
}
</script>

<template>
  <NForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false">
    <NFormItem path="phone">
      <NInput v-model:value="model.phone" :placeholder="请输入手机号" />
    </NFormItem>
    <NFormItem path="code">
      <div class="w-full flex-y-center">
        <NInput v-model:value="model.code" :placeholder="请输入验证码" />
        <div class="w-18px"></div>
        <NButton size="large" :disabled="isCounting" :loading="smsLoading" @click="handleSmsCode">
          {{ label }}
        </NButton>
      </div>
    </NFormItem>

    <NFormItem path="pwd">
      <NInput
        v-model:value="model.pwd"
        type="password"
        show-password-on="click"
        :placeholder="请输入密码"
      />
    </NFormItem>
    <NFormItem path="confirmPwd">
      <NInput
        v-model:value="model.confirmPwd"
        type="password"
        show-password-on="click"
        :placeholder="请确认密码"
      />
    </NFormItem>

    <NSpace vertical :size="18" class="w-full">
      <LoginAgreement v-model:value="agreement" />
      <NButton type="primary" size="large" round block :loading="auth.loginLoading" @click="handleSubmit">
        {{ "确认" }}
      </NButton>
      <NButton size="large" round block @click="toggleLoginModule('pwd-login')">
        {{ "返回" }}
      </NButton>
    </NSpace>
  </NForm>
</template>

<style scoped></style>
