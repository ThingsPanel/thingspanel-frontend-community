<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { $t } from '@/locales';
import { loginModuleRecord } from '@/constants/app';
import { useRouterPush } from '@/hooks/common/router';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { useAuthStore } from '@/store/modules/auth';

defineOptions({
  name: 'PwdLogin'
});

const isRememberPath = ref(true);
const authStore = useAuthStore();
const { toggleLoginModule } = useRouterPush();
const { formRef, validate } = useNaiveForm();
const showYzm = ref(false);
const showZc = ref(false);

interface FormModel {
  userName: string;
  password: string;
}

const model: FormModel = reactive({
  userName: 'super@super.cn',
  password: '123456'
});

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  const { formRules } = useFormRules(); // inside computed to make locale reactive

  return {
    userName: formRules.userName,
    password: formRules.pwd
  };
});
const rememberPath = e => {
  console.log(e);
  isRememberPath.value = !isRememberPath.value;
  localStorage.setItem('isRememberPath', isRememberPath.value ? '1' : '0');
};

async function handleSubmit() {
  await validate();
  await authStore.login(model.userName.trim(), model.password);
}

// function handleLoginOtherAccount(param: { userName: string; password: string }) {
//   const { userName, password } = param;
//   authStore.login(userName, password);
// }

onMounted(() => {
  const is_remember_rath = localStorage.getItem('isRememberPath');
  if (is_remember_rath === '0' || is_remember_rath === '1') {
    isRememberPath.value = is_remember_rath === '1';
  }
  const data = localStorage.getItem('enableZcAndYzm') as string;
  if (data) {
    const param = JSON.parse(data);
    console.log(param);
    if (param !== undefined && param !== null && param.includes('enable_reg')) {
      showZc.value = param.enable_reg;
    }
    if (param !== undefined && param !== null && param.includes('use_captcha')) {
      showYzm.value = param.use_captcha;
    }
  }
});
</script>

<template>
  <NForm ref="formRef" :model="model" :rules="rules" size="large" :show-label="false">
    <NFormItem path="userName">
      <NInput v-model:value="model.userName" :placeholder="$t('page.login.common.userNamePlaceholder')" />
    </NFormItem>
    <NFormItem path="password">
      <NInput
        v-model:value="model.password"
        type="password"
        show-password-on="click"
        :placeholder="$t('page.login.common.passwordPlaceholder')"
      />
    </NFormItem>
    <NSpace vertical :size="24">
      <div class="flex-y-center justify-between">
        <NCheckbox>{{ $t('page.login.pwdLogin.rememberMe') }}</NCheckbox>
        <!--         <NButton quaternary @click="toggleLoginModule('reset-pwd')">-->
        <NButton quaternary>
          {{ $t('page.login.pwdLogin.forgetPassword') }}
        </NButton>
      </div>
      <NButton type="primary" size="large" round block :loading="authStore.loginLoading" @click="handleSubmit">
        {{ $t('common.confirm') }}
      </NButton>
      <NCheckbox :checked="isRememberPath" @update:checked="rememberPath">
        {{ $t('generate.remember-last-path') }}
      </NCheckbox>
      <div class="flex-y-center justify-between gap-12px">
        <NButton v-if="showYzm" class="flex-1" block @click="toggleLoginModule('code-login')">
          {{ $t(loginModuleRecord['code-login']) }}
        </NButton>
        <NButton v-if="showZc" class="flex-1" block @click="toggleLoginModule('register')">
          {{ $t(loginModuleRecord.register) }}
        </NButton>
      </div>
    </NSpace>
    <!-- <OtherAccount @login="handleLoginOtherAccount" /> -->
  </NForm>
</template>

<style scoped></style>
