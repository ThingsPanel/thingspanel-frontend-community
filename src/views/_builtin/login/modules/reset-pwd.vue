<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { $t } from '@/locales';
import { useRouterPush } from '@/hooks/common/router';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import useSmsCode from '@/hooks/business/use-sms-code';
import { useAuthStore } from '@/store/modules/auth';
import { editUserPassWord, fetchEmailCodeByEmail } from '@/service/api/auth';

defineOptions({
  name: 'ResetPwd'
});

const auth = useAuthStore();
const { toggleLoginModule } = useRouterPush();
const { formRef, validate } = useNaiveForm();
const readOnly = ref(true);
const confirmPassWord = ref('');
interface FormModel {
  email: string;
  verify_code: string;
  password: string;
  is_register: number;
}

const model: FormModel = reactive({
  email: '',
  verify_code: '',
  password: '',
  is_register: 2
});
const { label, isCounting, loading: smsLoading, start, isValidEmail } = useSmsCode();

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  const { formRules } = useFormRules(); // inside computed to make locale reactive

  return {
    email: formRules.email,
    verify_code: formRules.code,
    password: [
      {
        validator: (rule, value) => {
          if (value.length < 6) {
            return Promise.reject(rule.message);
          }
          if (!/[a-z]/.test(value)) {
            return Promise.reject(rule.message);
          }
          return Promise.resolve();
        },
        message: $t('form.pwd.tip'),
        trigger: ['input', 'blur']
      }
    ],
    is_register: formRules.pwd
  };
});

async function handleSmsCode() {
  if (model.email) {
    if (await isValidEmail(model.email)) {
      const { error } = await fetchEmailCodeByEmail(model.email);
      if (!error) {
        start();
        window.$message?.success($t('custom.grouping_details.operationSuccess'));
      }
    }
  } else {
    window.$message?.error($t('page.manage.user.form.userEmail'));
  }
}
async function handleSubmit() {
  await validate();
  if (model.password === confirmPassWord.value) {
    const { error } = await editUserPassWord(model);
    if (!error) {
      window.$message?.success($t('page.login.common.validateSuccess'));
      toggleLoginModule('pwd-login');
    }
  } else {
    window.$message?.error($t('form.manycheck.required'));
  }
}

setTimeout(() => {
  readOnly.value = false;
}, 1000);
</script>

<template>
  <NForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false">
    <NFormItem path="email">
      <NInput v-model:value="model.email" :placeholder="$t('page.manage.user.form.userEmail')" />
    </NFormItem>
    <NFormItem path="code">
      <div class="w-full flex-y-center">
        <NInput
          v-model:value="model.verify_code"
          :readonly="readOnly"
          :placeholder="$t('page.login.common.codePlaceholder')"
        />
        <div class="w-18px"></div>
        <NButton size="large" :disabled="isCounting" :loading="smsLoading" @click="handleSmsCode">
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
    <NFormItem path="confirmPwd">
      <NInput
        v-model:value="confirmPassWord"
        type="password"
        show-password-on="click"
        :placeholder="$t('page.login.common.confirmPasswordPlaceholder')"
      />
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
