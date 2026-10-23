<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { NAlert, NButton, NCard, NEmpty, NFormItem, NInput, NModal, NSpace, NTag } from 'naive-ui'
import { externalAuth, type ExternalBinding, type ExternalProvider } from '@/service/api/external-auth'
import { useAuthStore } from '@/store/modules/auth'
import { passwordProof } from './password-proof'
import { rememberAuthReturn } from './navigation'

const { t } = useI18n({
  useScope: 'local',
  messages: {
    'zh-CN': {
      title: '第三方账号',
      description: '绑定后可使用第三方账号登录，设备和权限仍属于当前平台账号。',
      refresh: '刷新',
      empty: '暂未配置第三方登录',
      linked: '已绑定',
      released: '已解绑',
      blocked: '管理员已停用',
      link: '绑定',
      unlink: '解绑',
      password: '当前平台账号密码',
      confirm: '确认并继续',
      cancel: '取消',
      unlinkHelp:
        '解绑后所有设备上的平台登录态将失效，请使用账号密码重新登录。身份仍保留在当前账号，可再次验证后绑定。',
      linkHelp: '验证当前账号密码后，将跳转至第三方完成身份确认。',
      blockedHelp: '管理员停用的身份需联系管理员批准恢复。',
      miniHelp: '微信小程序的绑定请在小程序内完成。',
      failed: '操作失败，请重试。',
      unavailable: '认证服务暂不可用，请稍后重试。',
      wrong: '密码错误或登录已过期，请核对密码或重新登录。',
      conflict: '该身份已被绑定或停用，请联系管理员。',
      forbidden: '当前账号无权执行此操作。',
      date: '绑定时间',
      unlinked: '解绑成功，请使用账号密码重新登录。'
    },
    'en-US': {
      title: 'Linked accounts',
      description: 'Sign in with a linked account while keeping your existing devices and permissions.',
      refresh: 'Refresh',
      empty: 'No external sign-in methods configured',
      linked: 'Linked',
      released: 'Unlinked',
      blocked: 'Disabled by administrator',
      link: 'Link',
      unlink: 'Unlink',
      password: 'Current platform password',
      confirm: 'Confirm and continue',
      cancel: 'Cancel',
      unlinkHelp:
        'Unlinking revokes platform sessions on all devices. Sign in again with your password. This identity stays reserved for your account and can be linked again after verification.',
      linkHelp: 'Verify your current password, then confirm your identity at the provider.',
      blockedHelp: 'An administrator must approve recovery of a disabled identity.',
      miniHelp: 'Link WeChat Mini Program identities in the mini program.',
      failed: 'Operation failed. Please retry.',
      unavailable: 'Authentication is temporarily unavailable.',
      wrong: 'Incorrect password or expired session. Verify your password or sign in again.',
      conflict: 'This identity is already linked or disabled. Contact your administrator.',
      forbidden: 'This operation is not allowed for your account.',
      date: 'Linked on',
      unlinked: 'Account unlinked. Sign in again with your password.'
    }
  }
})
const auth = useAuthStore()
const router = useRouter()
const providers = ref<ExternalProvider[]>([])
const bindings = ref<ExternalBinding[]>([])
const loading = ref(false)
const busy = ref(false)
const error = ref('')
const modalError = ref('')
const password = ref('')
const selected = ref<{ provider: string; bindingId?: string } | null>(null)
const showModal = computed({
  get: () => selected.value !== null,
  set: (v: boolean) => {
    if (!v && !busy.value) {
      selected.value = null
      password.value = ''
      modalError.value = ''
    }
  }
})
const label = (id: string) => providers.value.find(p => p.id === id)?.label || id
const available = computed(() =>
  providers.value.filter(p => p.kind !== 'wechat-mini' && !bindings.value.some(b => b.provider === p.id && b.enabled))
)
function message(e: unknown) {
  const code = e instanceof Error ? e.message : ''
  return t(
    (
      { AUTH_401: 'wrong', AUTH_403: 'forbidden', AUTH_409: 'conflict', AUTH_503: 'unavailable' } as Record<
        string,
        string
      >
    )[code] || 'failed'
  )
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    const [p, b] = await Promise.all([
      externalAuth<ExternalProvider[]>('/auth/external/providers'),
      externalAuth<ExternalBinding[]>('/auth/bindings')
    ])
    providers.value = p
    bindings.value = b
  } catch (e) {
    error.value = message(e)
  } finally {
    loading.value = false
  }
}
function select(provider: string, bindingId?: string) {
  password.value = ''
  modalError.value = ''
  selected.value = { provider, bindingId }
}
async function submit() {
  if (!selected.value || busy.value || !password.value) return
  busy.value = true
  modalError.value = ''
  try {
    const proof = passwordProof(password.value)
    if (selected.value.bindingId) {
      await externalAuth('/auth/bindings/unlink', { bindingId: selected.value.bindingId, ...proof })
      selected.value = null
      window.$message?.success(t('unlinked'))
      await auth.resetStore()
      await router.replace('/login')
    } else {
      const result = await externalAuth<{ url: string }>('/auth/external/bind/start', {
        provider: selected.value.provider,
        ...proof
      })
      const target = new URL(result.url)
      if (target.protocol !== 'https:') throw new Error('AUTH_FAILED')
      rememberAuthReturn('/personal-center')
      window.location.assign(target.href)
    }
  } catch (e) {
    modalError.value = message(e)
  } finally {
    password.value = ''
    busy.value = false
  }
}
onMounted(load)
</script>

<template>
  <NCard :title="t('title')" class="mt-16px" :aria-busy="loading">
    <template #header-extra>
      <NButton size="small" :loading="loading" @click="load">{{ t('refresh') }}</NButton>
    </template>
    <p class="binding-description">{{ t('description') }}</p>
    <NAlert v-if="error" type="error" role="alert" class="mb-16px">{{ error }}</NAlert>
    <NEmpty v-if="!loading && !error && !providers.length && !bindings.length" :description="t('empty')" />
    <div v-for="binding in bindings" :key="binding.id" class="binding-row">
      <div>
        <strong>{{ label(binding.provider) }}</strong>
        <p class="binding-date">{{ t('date') }} · {{ new Date(binding.created_at).toLocaleString() }}</p>
      </div>
      <NSpace align="center">
        <NTag :type="binding.enabled ? 'success' : 'default'" :bordered="false">
          {{ t(binding.enabled ? 'linked' : binding.self_unlinked ? 'released' : 'blocked') }}
        </NTag>
        <NButton v-if="binding.enabled" @click="select(binding.provider, binding.id)">{{ t('unlink') }}</NButton>
      </NSpace>
    </div>
    <NSpace v-if="available.length" class="mt-16px" :size="12">
      <NButton v-for="provider in available" :key="provider.id" @click="select(provider.id)">
        {{ t('link') }} {{ provider.label }}
      </NButton>
    </NSpace>
    <p v-if="bindings.some(b => !b.enabled && !b.self_unlinked)" class="binding-date">{{ t('blockedHelp') }}</p>
    <p v-if="providers.some(p => p.kind === 'wechat-mini')" class="binding-date">{{ t('miniHelp') }}</p>
  </NCard>
  <NModal
    v-model:show="showModal"
    preset="card"
    :title="t(selected?.bindingId ? 'unlink' : 'link') + ' ' + label(selected?.provider || '')"
    :style="{ width: 'min(460px, calc(100vw - 32px))' }"
    :mask-closable="!busy"
    :closable="!busy"
    :close-on-esc="!busy"
  >
    <p class="binding-description">{{ t(selected?.bindingId ? 'unlinkHelp' : 'linkHelp') }}</p>
    <NAlert v-if="modalError" type="error" role="alert" class="mb-16px">{{ modalError }}</NAlert>
    <NFormItem :label="t('password')">
      <NInput
        v-model:value="password"
        :input-props="{ 'aria-label': t('password') }"
        type="password"
        autocomplete="current-password"
        :disabled="busy"
        @keydown.enter="submit"
      />
    </NFormItem>
    <template #footer>
      <NSpace justify="end">
        <NButton :disabled="busy" @click="showModal = false">{{ t('cancel') }}</NButton>
        <NButton
          :type="selected?.bindingId ? 'warning' : 'primary'"
          :loading="busy"
          :disabled="!password"
          @click="submit"
        >
          {{ t('confirm') }}
        </NButton>
      </NSpace>
    </template>
  </NModal>
</template>

<style scoped>
.binding-description {
  margin: 0 0 20px;
  line-height: 1.65;
}
.binding-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--n-border-color);
  flex-wrap: wrap;
}
.binding-date {
  margin: 6px 0 0;
  font-size: 13px;
  opacity: 0.75;
  line-height: 1.6;
}
</style>
