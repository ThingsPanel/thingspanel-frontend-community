<script setup lang="ts">
import { computed, reactive, ref, toRefs } from 'vue';
import { $t } from '@/locales';
import { useRouterPush } from '@/hooks/common/router';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import useSmsCode from '@/hooks/business/use-sms-code';
import { useAuthStore } from '@/store/modules/auth';
import { getConfirmPwdRule } from '@/utils/form/rule';
import { fetchEmailCode, registerByEmail } from '@/service/api/auth'; // 导入相关函数
import { localStg } from '@/utils/storage';

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
  try {
    await validate();

    const resp = (await registerByEmail({
      email: model.email,
      verify_code: model.code,
      password: model.pwd,
      confirm_password: model.confirmPwd,
      phone_prefix: '+86',
      phone_number: model.phone
    })) as any;

    // 检查响应状态，只有在成功时才显示成功消息
    if (resp.code > 200000 || resp.error) {
      // 显示错误消息
      window.$message?.error(resp.message || $t('page.login.register.registerError'));
    } else {
      // 显示成功消息并处理登录
      window.$message?.success($t('page.login.register.registerSuccess'));

      // 如果响应中有 token，直接使用它进行登录
      if (resp.data && resp.data.token) {
        // 存储 token 和过期时间
        localStg.set('token', resp.data.token);
        const expires_in = Date.now() + (resp.data.expires_in || 360000) * 1000;
        localStg.set('token_expires_in', expires_in.toString());

        // 重载页面以应用新 token
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        // 如果没有 token，则跳转到登录页面
        setTimeout(() => {
          toggleLoginModule('pwd-login');
        }, 1500);
      }
    }
  } catch (error: any) {
    // 处理验证失败或其他异常
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
