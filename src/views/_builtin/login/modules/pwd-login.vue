<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { NAutoComplete } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { $t } from '@/locales'
import { loginModuleRecord } from '@/constants/app'
import { useRouterPush } from '@/hooks/common/router'
import { useNaiveForm } from '@/hooks/common/form'
import { useAuthStore } from '@/store/modules/auth'
import { getFunction } from '@/service/api/setting'
// import { createLogger } from '@/utils/logger'

// const logger = createLogger('PwdLogin')

defineOptions({
  name: 'PwdLogin'
})

const { locale } = useI18n()
const isRememberPath = ref(true)
const rememberMe = ref(false)
const authStore = useAuthStore()
const { toggleLoginModule } = useRouterPush()
const { formRef, validate } = useNaiveForm()
const showYzm = ref(false)
const showZc = ref(false)

interface FormModel {
  userName: string
  password: string
}

const model: FormModel = reactive({
  userName: '',
  password: ''
})

const rules = computed<Record<keyof FormModel, App.Global.FormRule[]>>(() => {
  // 定义邮箱和手机号的正则表达式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const phoneRegex = /^1[3-9]\d{9}$/ // 中国大陆手机号基本格式

  return {
    userName: [
      {
        required: true,
        message: () => $t('form.userName.required'),
        trigger: ['blur'] // required 规则在 blur 时触发
      },
      {
        validator: (_rule, value) => {
          // 仅在有值时校验格式
          if (value && !emailRegex.test(value) && !phoneRegex.test(value)) {
            return Promise.reject(new Error($t('form.userName.invalidFormat'))) // 使用格式错误提示
          }
          return Promise.resolve() // 值为空或格式正确时通过
        },
        message: () => $t('form.userName.invalidFormat'), // 格式错误时的提示
        trigger: ['input', 'blur'] // input 时也校验格式，但不提示 required
      }
    ],
    password: [
      {
        required: true,
        message: () => $t('form.pwd.required'),
        trigger: ['input', 'blur']
      }
    ]
  }
})

// 常用邮箱后缀列表
const commonDomains = ['qq.com', '163.com', 'gmail.com', 'outlook.com', 'sina.com', 'hotmail.com', 'yahoo.com']

// 计算邮箱自动补全选项
const emailOptions = computed(() => {
  const userName = model.userName
  if (!userName || !userName.includes('@')) {
    return [] // 如果没有输入或不包含 @，则不提示
  }

  const parts = userName.split('@')
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

// const rememberPath = e => {
//   logger.info(e);
//   isRememberPath.value = !isRememberPath.value;
//   localStorage.setItem('isRememberPath', isRememberPath.value ? '1' : '0');
// };

async function handleSubmit() {
  // 先判断密码长度
  if (model.password.length < 6) {
    return // 仍然阻止提交
  }

  await validate()
  await authStore.login(model.userName.trim(), model.password)

  if (rememberMe.value) {
    localStorage.setItem('rememberMe', 'true')
    localStorage.setItem('rememberedUserName', model.userName.trim())
    localStorage.setItem('rememberedPassword', window.btoa(model.password))
  } else {
    localStorage.removeItem('rememberMe')
    localStorage.removeItem('rememberedUserName')
    localStorage.removeItem('rememberedPassword')
  }
}

async function getFunctionOption() {
  const { data } = await getFunction()
  if (data) {
    localStorage.setItem('enableZcAndYzm', JSON.stringify(data))
    showZc.value = data.find(v => v.name === 'enable_reg')?.enable_flag === 'enable'

    showYzm.value = data.find(v => v.name === 'use_captcha')?.enable_flag === 'enable'
  }
}

function loadSavedCredentials() {
  const savedRememberMe = localStorage.getItem('rememberMe')
  if (savedRememberMe === 'true') {
    rememberMe.value = true
    const savedUserName = localStorage.getItem('rememberedUserName')
    const savedPassword = localStorage.getItem('rememberedPassword')

    if (savedUserName) {
      model.userName = savedUserName
    }

    if (savedPassword) {
      model.password = window.atob(savedPassword)
    }
  }
}

// 从环境变量加载自动登录凭据
async function loadAutoLoginCredentials() {
  // 添加详细的调试信息
  console.log('=== 自动登录调试信息 ===')
  console.log('当前URL:', window.location.href)
  console.log('查询参数字符串:', window.location.search)
  
  // 检查路由参数
  const urlParams = new URLSearchParams(window.location.search)
  const autoLogin = urlParams.get('auto') === 'true'
  const urlUsername = urlParams.get('username')
  const urlPassword = urlParams.get('password')
  
  console.log('auto参数值:', urlParams.get('auto'))
  console.log('URL中的用户名:', urlUsername ? '已提供' : '未提供')
  console.log('URL中的密码:', urlPassword ? '已提供' : '未提供')
  console.log('是否满足自动登录条件:', autoLogin && urlUsername && urlPassword)
  
  // 只要URL参数中有账号密码且auto=true就允许自动登录
  if (autoLogin && urlUsername && urlPassword) {
    console.log('✅ 所有条件满足，开始自动登录...')
    console.log('使用账号:', urlUsername)
    
    // 设置表单数据
    model.userName = urlUsername
    model.password = urlPassword
    
    // 延迟一下确保组件完全挂载
    setTimeout(async () => {
      try {
        await authStore.login(model.userName.trim(), model.password)
        console.log('✅ 自动登录成功')
      } catch (error) {
        console.error('❌ 自动登录失败:', error)
        window.$message?.error('自动登录失败，请手动输入账号密码')
      }
    }, 500)
  } else {
    console.log('❌ 自动登录条件不满足:')
    if (!autoLogin) {
      console.log('  - URL中未包含 auto=true 参数')
    }
    if (!urlUsername) {
      console.log('  - URL中未提供用户名参数')
    }
    if (!urlPassword) {
      console.log('  - URL中未提供密码参数')
    }
    
    console.log('📝 使用方式: 在URL中传递账号密码: ?auto=true&username=test@example.com&password=123456')
    console.log('  当前URL示例: ' + window.location.origin + window.location.pathname + '?auto=true&username=test@example.com&password=123456')
  }
  console.log('=== 调试信息结束 ===')
}

onMounted(() => {
  const is_remember_rath = localStorage.getItem('isRememberPath')
  if (is_remember_rath === '0' || is_remember_rath === '1') {
    isRememberPath.value = is_remember_rath === '1'
  }
  getFunctionOption()
  loadSavedCredentials()
  loadAutoLoginCredentials()
})
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
      >
        <template #prefix>
          <svg class="w-18px h-18px ml--1" fill="#888" viewBox="0 0 24 24">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
            ></path>
          </svg>
        </template>
      </NAutoComplete>
    </NFormItem>
    <NFormItem path="password">
      <NInput
        v-model:value="model.password"
        class="h-40px"
        type="password"
        show-password-on="click"
        :placeholder="$t('page.login.common.passwordPlaceholder')"
      >
        <template #prefix>
          <svg class="w-18px h-18px ml--1" fill="#888" viewBox="0 0 24 24">
            <path
              d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
            ></path>
          </svg>
        </template>
      </NInput>
    </NFormItem>
    <NSpace vertical :size="18">
      <div class="flex-y-center justify-between">
        <NCheckbox v-model:checked="rememberMe">{{ $t('page.login.pwdLogin.rememberMe') }}</NCheckbox>
        <!--         <NButton quaternary @click="toggleLoginModule('reset-pwd')">-->
        <NButton quaternary @click="toggleLoginModule('reset-pwd')">
          {{ $t('page.login.pwdLogin.forgetPassword') }}
        </NButton>
      </div>
      <NButton
        style="border-radius: 8px"
        type="primary"
        size="large"
        block
        :loading="authStore.loginLoading"
        @click="handleSubmit"
      >
        {{ $t('route.login') }}
      </NButton>
      <!-- <NCheckbox :checked="isRememberPath" @update:checked="rememberPath">
        {{ $t('page.login.common.rememberPath') }}
      </NCheckbox> -->
      <n-divider title-placement="center" style="padding: 0px; margin: 0px">
        {{ $t('generate.or') }}
      </n-divider>
      <div class="flex-y-center justify-between gap-12px mt--4">
        <NButton v-if="showYzm" class="flex-1" block @click="toggleLoginModule('code-login')">
          {{ $t(loginModuleRecord['code-login']) }}
        </NButton>

        <NButton
          v-if="showZc"
          class="flex-1"
          block
          type="primary"
          quaternary
          @click="toggleLoginModule('register-email')"
        >
          <span class="text-#999">还没有账号?</span>
          {{ $t(loginModuleRecord.register) }}
        </NButton>
      </div>
    </NSpace>
    <!-- <OtherAccount @login="handleLoginOtherAccount" /> -->
  </NForm>
</template>

<style scoped></style>
