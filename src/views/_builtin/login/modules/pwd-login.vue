<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { NAutoComplete } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import { $t } from '@/locales';
import { loginModuleRecord } from '@/constants/app';
import { useRouterPush } from '@/hooks/common/router';
import { useFormRules, useNaiveForm } from '@/hooks/common/form';
import { useAuthStore } from '@/store/modules/auth';
import { getFunction } from '@/service/api/setting';
import { createLogger } from '@/utils/logger';

const logger = createLogger('PwdLogin');

defineOptions({
  name: 'PwdLogin'
});

const { locale } = useI18n();
const isRememberPath = ref(true);
const rememberMe = ref(false);
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
  userName: '',
  password: ''
});

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  const { formRules } = useFormRules();
  return {
    userName: formRules.userName,
    password: [
      {
        validator: (_rule, value) => {
          if (value.length < 6) {
            return Promise.reject(new Error($t('form.pwd.lenMin6')));
          }
          return Promise.resolve();
        },
        message: () => $t('form.pwd.lenMin6'),
        trigger: ['input', 'blur']
      }
    ]
  };
});

// 常用邮箱后缀列表
const commonDomains = ['qq.com', '163.com', 'gmail.com', 'outlook.com', 'sina.com', 'hotmail.com', 'yahoo.com'];

// 计算邮箱自动补全选项
const emailOptions = computed(() => {
  const userName = model.userName;
  if (!userName || !userName.includes('@')) {
    return []; // 如果没有输入或不包含 @，则不提示
  }

  const parts = userName.split('@');
  const username = parts[0];
  const domainInput = parts[1] || ''; // @ 后面的部分

  if (username === '') {
    return []; // 如果 @ 前面为空，则不提示
  }

  // 过滤常用域名，基于用户在 @ 后输入的内容
  const filteredDomains = commonDomains.filter(
    domain => domain.startsWith(domainInput) && domain !== domainInput // 只有当域名部分匹配且不等于完整域名时才提示
  );

  // 生成完整的邮箱建议
  return filteredDomains.map(domain => `${username}@${domain}`);
});

const rememberPath = e => {
  logger.info(e);
  isRememberPath.value = !isRememberPath.value;
  localStorage.setItem('isRememberPath', isRememberPath.value ? '1' : '0');
};

async function handleSubmit() {
  // 先判断密码长度
  if (model.password.length < 6) {
    window.$message?.error($t('form.pwd.lenMin6'));
    return;
  }

  await validate();
  await authStore.login(model.userName.trim(), model.password);

  if (rememberMe.value) {
    localStorage.setItem('rememberMe', 'true');
    localStorage.setItem('rememberedUserName', model.userName.trim());
    localStorage.setItem('rememberedPassword', window.btoa(model.password));
  } else {
    localStorage.removeItem('rememberMe');
    localStorage.removeItem('rememberedUserName');
    localStorage.removeItem('rememberedPassword');
  }
}

async function getFunctionOption() {
  const { data } = await getFunction();
  if (data) {
    localStorage.setItem('enableZcAndYzm', JSON.stringify(data));
    showZc.value = data.find(v => v.name === 'enable_reg')?.enable_flag === 'enable';

    showYzm.value = data.find(v => v.name === 'use_captcha')?.enable_flag === 'enable';
  }
}

function loadSavedCredentials() {
  const savedRememberMe = localStorage.getItem('rememberMe');
  if (savedRememberMe === 'true') {
    rememberMe.value = true;
    const savedUserName = localStorage.getItem('rememberedUserName');
    const savedPassword = localStorage.getItem('rememberedPassword');

    if (savedUserName) {
      model.userName = savedUserName;
    }

    if (savedPassword) {
      model.password = window.atob(savedPassword);
    }
  }
}

onMounted(() => {
  const is_remember_rath = localStorage.getItem('isRememberPath');
  if (is_remember_rath === '0' || is_remember_rath === '1') {
    isRememberPath.value = is_remember_rath === '1';
  }
  getFunctionOption();
  loadSavedCredentials();
});
</script>

<template>
  <NForm ref="formRef" :key="locale" :model="model" :rules="rules" size="large" :show-label="false">
    <NFormItem path="userName">
      <NAutoComplete
        v-model:value="model.userName"
        :options="emailOptions"
        :placeholder="$t('page.login.common.userNamePlaceholder')"
        clearable
        @keydown.enter="handleSubmit"
      />
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
        <NCheckbox v-model:checked="rememberMe">{{ $t('page.login.pwdLogin.rememberMe') }}</NCheckbox>
        <!--         <NButton quaternary @click="toggleLoginModule('reset-pwd')">-->
        <NButton quaternary @click="toggleLoginModule('reset-pwd')">
          {{ $t('page.login.pwdLogin.forgetPassword') }}
        </NButton>
      </div>
      <NButton type="primary" size="large" round block :loading="authStore.loginLoading" @click="handleSubmit">
        {{ $t('common.confirm') }}
      </NButton>
      <NCheckbox :checked="isRememberPath" @update:checked="rememberPath">
        {{ $t('generate.remember-path') }}
      </NCheckbox>
      <div class="flex-y-center justify-between gap-12px">
        <NButton v-if="showYzm" class="flex-1" block @click="toggleLoginModule('code-login')">
          {{ $t(loginModuleRecord['code-login']) }}
        </NButton>
        <NButton v-if="showZc" class="flex-1" block @click="toggleLoginModule('register-email')">
          {{ $t(loginModuleRecord.register) }}
        </NButton>
      </div>
    </NSpace>
    <!-- <OtherAccount @login="handleLoginOtherAccount" /> -->
  </NForm>
</template>

<style scoped></style>
