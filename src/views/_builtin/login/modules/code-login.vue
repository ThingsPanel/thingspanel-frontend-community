<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { $t } from '@/locales';
import { useRouterPush } from '@/hooks/common/router';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { getImgCodeRule } from '@/utils/form/rule';
import useSmsCode from '@/hooks/business/use-sms-code';
import { useAuthStore } from '@/store/modules/auth';
defineOptions({
  name: 'CodeLogin'
});

const auth = useAuthStore();
const { toggleLoginModule } = useRouterPush();
const { formRef, validate } = useNaiveForm();

interface FormModel {
  phone: string;
  code: string;
  imgCode: string;
}

const model: FormModel = reactive({
  phone: '',
  code: '',
  imgCode: ''
});
const { label, isCounting, loading: smsLoading, getSmsCode } = useSmsCode();

const imgCode = ref('');

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  const { formRules } = useFormRules(); // inside computed to make locale reactive

  return {
    phone: formRules.phone,
    code: formRules.code,
    imgCode: getImgCodeRule(imgCode)
  };
});

function handleSmsCode() {
  getSmsCode(model.phone);
}

async function handleSubmit() {
  await validate();
  window.$message?.success($t('page.login.common.validateSuccess'));
}
</script>

<template>
  <NForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false">
    <NFormItem path="phone">
      <NInput v-model:value="model.phone" :placeholder="$t('page.login.common.phonePlaceholder')" />
    </NFormItem>
    <NFormItem path="code">
      <div class="w-full flex-y-center">
        <NInput v-model:value="model.code" :placeholder="$t('page.login.common.codePlaceholder')" />
        <div class="w-18px"></div>
        <NButton size="large" :disabled="isCounting" :loading="smsLoading" @click="handleSmsCode">
          {{ label }}
        </NButton>
      </div>
    </NFormItem>
    <NFormItem path="imgCode">
      <NInput v-model:value="model.imgCode" :placeholder="$t('page.login.codeLogin.imageCodePlaceholder')" />
      <div class="pl-8px">
        <ImageVerify v-model:code="imgCode" />
      </div>
    </NFormItem>
    <NSpace vertical :size="18" class="w-full">
      <NButton type="primary" size="large" round block :loading="auth.loginLoading" @click="handleSubmit">
        {{ $t('common.confirm') }}
      </NButton>
      <NButton size="large" round block @click="toggleLoginModule('pwd-login')">
        {{ $t('page.login.common.back') }}
      </NButton>
    </NSpace>
  </NForm>
</template>

<style scoped></style>
