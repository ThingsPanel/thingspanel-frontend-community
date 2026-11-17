<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useMessage } from 'naive-ui'
import type { DeviceCredentialSummary } from '@/service/api/device-credentials-native'

const props = defineProps<{
  kind: DeviceCredentialSummary['kind']
  publicIdentifier?: string | null
  secret?: string | null
}>()

const message = useMessage()
const revealed = ref(false)
const noPassword = computed(() => props.kind === 'token')
const username = computed(() => (noPassword.value ? props.secret : props.publicIdentifier))

watch(
  () => [props.kind, props.publicIdentifier, props.secret],
  () => {
    revealed.value = false
  }
)

async function copy(value: string) {
  try {
    await navigator.clipboard.writeText(value)
    message.success('已复制')
  } catch {
    revealed.value = true
    message.warning('无法访问剪贴板，请选中文字后复制。')
  }
}
</script>

<template>
  <dl v-if="kind !== 'x509'" class="grid gap-2">
    <div class="flex flex-wrap items-center gap-2">
      <dt class="w-14">用户名</dt>
      <dd class="m-0 flex flex-wrap items-center gap-2">
        <code v-if="username" class="break-all">{{ noPassword && !revealed ? '••••••••' : username }}</code>
        <span v-else>暂不可查看</span>
        <n-button v-if="username" text size="small" @click="copy(username)">复制用户名</n-button>
      </dd>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <dt class="w-14">密码</dt>
      <dd class="m-0 flex flex-wrap items-center gap-2">
        <span v-if="noPassword">留空</span>
        <template v-else-if="secret">
          <code class="break-all">{{ revealed ? secret : '••••••••' }}</code>
          <n-button text size="small" @click="copy(secret)">复制密码</n-button>
        </template>
        <span v-else>暂不可查看</span>
      </dd>
    </div>
    <div v-if="noPassword ? username : secret">
      <n-button text size="small" @click="revealed = !revealed">
        {{ revealed ? '隐藏登录信息' : '显示登录信息' }}
      </n-button>
    </div>
  </dl>
</template>
