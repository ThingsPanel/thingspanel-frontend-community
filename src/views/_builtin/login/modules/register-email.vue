<script setup lang="ts">
import { computed, reactive, ref, toRefs } from 'vue';
import { $t } from '@/locales';
import { useRouterPush } from '@/hooks/common/router';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import useSmsCode from '@/hooks/business/use-sms-code';
import { useAuthStore } from '@/store/modules/auth';
import { getConfirmPwdRule } from '@/utils/form/rule';
import { validPasswordByExp } from '@/utils/common/tool';
import { fetchEmailCode, registerByEmail } from '@/service/api/auth'; // 导入相关函数

defineOptions({
  name: 'RegisterPage'
});

const auth = useAuthStore();
const { toggleLoginModule } = useRouterPush();
const { formRef, validate } = useNaiveForm();

interface FormModel {
  email: string; // 添加邮箱字段
  phone: string; // 添加电话号码字段
  code: string;
  pwd: string;
  confirmPwd: string;
}

const model: FormModel = reactive({
  email: '', // 初始化邮箱字段
  phone: '', // 初始化电话号码字段
  code: '',
  pwd: '',
  confirmPwd: ''
});
const { label, isCounting, loading: smsLoading, start } = useSmsCode();

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  const { formRules } = useFormRules(); // inside computed to make locale reactive

  return {
    email: formRules.email, // 添加邮箱规则
    phone: formRules.phone, // 添加电话号码规则
    code: formRules.code,
    pwd: [
      {
        validator: (rule, value) => {
          if (value.length < 8 || value.length > 18) {
            return Promise.reject(rule.message);
          }
          if (!validPasswordByExp(value)) {
            return Promise.reject(rule.message);
          }
          return Promise.resolve();
        },
        message: $t('form.pwd.tip'),
        trigger: ['input', 'blur']
      }
    ],
    confirmPwd: getConfirmPwdRule(toRefs(model).pwd)
  };
});

const agreement = ref(false);

function handleSmsCode() {
  // 调用 fetchEmailCode 函数获取验证码
  fetchEmailCode(model.email)
    .then(() => {
      window.$message?.success($t('page.login.common.codeSent'));
      start(); // 开始计时
    })
    .catch(error => {
      window.$message?.error(error.message || $t('page.login.common.codeError'));
    });
}

async function handleSubmit() {
  await validate();
  try {
    await registerByEmail({
      email: model.email,
      verify_code: model.code,
      password: model.pwd,
      confirm_password: model.confirmPwd,
      phone_prefix: '+86', // 如果需要，可以添加手机前缀
      phone_number: model.phone // 使用输入的电话号码
    });
    window.$message?.success($t('page.login.register.registerSuccess'));
    // 处理注册成功后的逻辑，例如跳转到登录页面
  } catch (error) {
    window.$message?.error(error.message || $t('page.login.register.registerError'));
  }
}
</script>

<template>
  <NForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false">
    <NFormItem path="email">
      <NInput v-model:value="model.email" :placeholder="$t('page.login.register.emailPlaceholder')" />
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
    <NFormItem path="phone">
      <NInput v-model:value="model.phone" :placeholder="$t('page.login.common.phonePlaceholder')" />
    </NFormItem>

    <NFormItem path="pwd">
      <NInput
        v-model:value="model.pwd"
        type="password"
        show-password-on="click"
        :placeholder="$t('page.login.common.passwordPlaceholder')"
      />
    </NFormItem>
    <NFormItem path="confirmPwd">
      <NInput
        v-model:value="model.confirmPwd"
        type="password"
        show-password-on="click"
        :placeholder="$t('page.login.common.confirmPasswordPlaceholder')"
      />
    </NFormItem>

    <NSpace vertical :size="18" class="w-full">
      <LoginAgreement v-model:value="agreement" />
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
