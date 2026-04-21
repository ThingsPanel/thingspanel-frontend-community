<script setup lang="ts">
import { ref, reactive } from 'vue'
import { NModal, NForm, NFormItem, NInput, NButton } from 'naive-ui'
import { $t } from '@/locales'
import { marketLogin } from '@/service/api/market'
import { useMarketAuth } from '../composables/use-market-auth'

const { setToken } = useMarketAuth()

const emit = defineEmits(['login-success'])

const visible = ref(false)
const loading = ref(false)
const formRef = ref<any>(null)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: { required: true, message: () => $t('market.usernamePlaceholder'), trigger: 'blur' },
  password: { required: true, message: $t('market.password'), trigger: 'blur' }
}

const open = () => {
  loginForm.username = ''
  loginForm.password = ''
  visible.value = true
}

const handleLogin = async () => {
  await formRef.value?.validate()
  loading.value = true
  try {
    const res: any = await marketLogin({ username: loginForm.username, password: loginForm.password })
    const token = res?.token || res?.data?.token
    if (token) {
      setToken(token)
      window.$message?.success($t('market.loginSuccess'))
      visible.value = false
      emit('login-success', token)
    }
  } catch (e: any) {
    // error toast 已由 axios 拦截器 onError 统一处理，无需重复弹窗
  } finally {
    loading.value = false
  }
}

const handleGoToRegister = () => {
  // Opening the market portal registration page
  // The port 18083 is the Portal's host port as per deployment_info.md
  const marketUrl = window.location.origin.replace(/:\d+$/, ':18083') + '/register'
  window.open(marketUrl, '_blank')
}

defineExpose({ open })
</script>

<template>
  <NModal v-model:show="visible" preset="dialog" :title="$t('market.loginTitle')" style="width: 420px">
    <NForm ref="formRef" :model="loginForm" :rules="loginRules" label-placement="left" label-width="80">
      <NFormItem :label="$t('market.username')" path="username">
        <NInput v-model:value="loginForm.username" :placeholder="$t('market.usernamePlaceholder')" />
      </NFormItem>
      <NFormItem :label="$t('market.password')" path="password">
        <NInput
          v-model:value="loginForm.password"
          type="password"
          :placeholder="$t('market.password')"
          show-password-on="click"
        />
      </NFormItem>
    </NForm>
    <div style="margin-top: 10px; text-align: right">
      <span>{{ $t('market.noAccount') }}</span>
      <NButton text type="primary" style="margin-left: 4px" @click="handleGoToRegister">
        {{ $t('market.goToRegister') }}
      </NButton>
    </div>
    <template #action>
      <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
      <NButton type="primary" :loading="loading" @click="handleLogin">{{ $t('market.login') }}</NButton>
    </template>
  </NModal>
</template>
