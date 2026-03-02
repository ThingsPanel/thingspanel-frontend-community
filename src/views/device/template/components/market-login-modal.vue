<script setup lang="ts">
import { ref, reactive } from 'vue'
import { NModal, NForm, NFormItem, NInput, NButton } from 'naive-ui'
import { $t } from '@/locales'
import { marketLogin } from '@/service/api/market'

const emit = defineEmits(['login-success'])

const visible = ref(false)
const loading = ref(false)
const formRef = ref<any>(null)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: { required: true, message: $t('market.username'), trigger: 'blur' },
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
    if (!res.error && res.data?.token) {
      sessionStorage.setItem('market_token', res.data.token)
      window.$message?.success($t('market.loginSuccess'))
      visible.value = false
      emit('login-success', res.data.token)
    } else {
      window.$message?.error($t('market.loginFailed'))
    }
  } catch (e: any) {
    window.$message?.error($t('market.loginFailed') + ': ' + (e?.message || ''))
  } finally {
    loading.value = false
  }
}

defineExpose({ open })
</script>

<template>
  <NModal v-model:show="visible" preset="dialog" :title="$t('market.loginTitle')" style="width: 420px">
    <NForm ref="formRef" :model="loginForm" :rules="loginRules" label-placement="left" label-width="80">
      <NFormItem :label="$t('market.username')" path="username">
        <NInput v-model:value="loginForm.username" :placeholder="$t('market.username')" />
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
    <template #action>
      <NButton @click="visible = false">{{ $t('common.cancel') }}</NButton>
      <NButton type="primary" :loading="loading" @click="handleLogin">{{ $t('market.login') }}</NButton>
    </template>
  </NModal>
</template>
