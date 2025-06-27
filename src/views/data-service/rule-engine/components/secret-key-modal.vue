<script setup lang="ts">
import { computed } from 'vue'
import { useClipboard } from '@vueuse/core'
import { $t } from '@/locales'

export interface Props {
  /** 弹窗可见性 */
  visible: boolean
  /** 编辑的表格行数据 */
  secretKey?: string
}

defineOptions({ name: 'SecretKeyModal' })

const props = withDefaults(defineProps<Props>(), {
  secretKey: ''
})

interface Emits {
  (e: 'update:visible', visible: boolean): void
}

const emit = defineEmits<Emits>()

const modalVisible = computed({
  get() {
    return props.visible
  },
  set(visible) {
    emit('update:visible', visible)
  }
})

const { copy, isSupported } = useClipboard()

function handleCopy() {
  if (!isSupported) {
    window.$message?.error(`${"浏览器不支持"}Clipboard API`)
    return
  }
  if (!props.secretKey) {
    window.$message?.error("内容已复制")
    return
  }
  copy(props.secretKey)
  window.$message?.success(`：${props.secretKey}`)
}
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" :title="查看密钥" class="w-700px">
    <NSpace vertical>
      <NInput :default-value="secretKey" type="text" readonly @focus="handleCopy" />
    </NSpace>
  </NModal>
</template>

<style lang="scss"></style>
