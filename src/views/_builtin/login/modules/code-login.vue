<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { $t } from '@/locales'
import { useRouterPush } from '@/hooks/common/router'
import { useFormRules, useNaiveForm } from '@/hooks/common/form'
import { getImgCodeRule } from '@/utils/form/rule'
import useSmsCode from '@/hooks/business/use-sms-code'
import { useAuthStore } from '@/store/modules/auth'

defineOptions({
  name: 'CodeLogin'
})

const { locale } = useI18n()
const auth = useAuthStore()
const { toggleLoginModule } = useRouterPush()
const { formRef, validate } = useNaiveForm()

interface FormModel {
  phone: string
  code: string
  imgCode: string
}

const model: FormModel = reactive({
  phone: '',
  code: '',
  imgCode: ''
})
const { label, isCounting, loading: smsLoading, getSmsCode } = useSmsCode()

const imgCode = ref('')

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  const { formRules } = useFormRules()

  return {
    phone: formRules.phone,
    code: formRules.code,
    imgCode: getImgCodeRule(imgCode)
  }
})

function handleSmsCode() {
  getSmsCode(model.phone)
}

async function handleSubmit() {
  await validate()
  window.$message?.success("验证成功")
}
</script>

<template>
  <NForm ref="formRef" :key="locale" :model="model" :rules="rules" size="large" :show-label="false">
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
    <NFormItem path="imgCode">
      <NInput v-model:value="model.imgCode" :placeholder="请输入图形验证码" />
      <div class="pl-8px">
        <ImageVerify v-model:code="imgCode" />
      </div>
    </NFormItem>
    <NSpace vertical :size="18" class="w-full">
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
