<script lang="ts" setup>
import { ref } from 'vue'
import { useClipboard } from '@vueuse/core'
import { $t } from '@/locales'

const source = ref('')
const { copy, isSupported } = useClipboard()

function handleCopy() {
  if (!isSupported) {
    window.$message?.error(`${"浏览器不支持"}Clipboard API`)
    return
  }
  if (!source.value) {
    window.$message?.error("内容已复制")
    return
  }
  copy(source.value)
  window.$message?.success(`${"复制成功"}：${source.value}`)
}
</script>

<template>
  <div class="h-full">
    <NCard :title="文本复制" :bordered="false" class="h-full rounded-8px shadow-sm">
      <NInputGroup>
        <NInput v-model:value="source" :placeholder="请输入要复制的内容吧" />
        <NButton type="primary" @click="handleCopy">{{ "复制" }}</NButton>
      </NInputGroup>
    </NCard>
  </div>
</template>

<style scoped></style>
