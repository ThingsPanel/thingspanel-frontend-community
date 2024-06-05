<script lang="ts" setup>
import { ref } from 'vue';
import { useClipboard } from '@vueuse/core';
import { $t } from '@/locales';

const source = ref('');
const { copy, isSupported } = useClipboard();

function handleCopy() {
  if (!isSupported) {
    window.$message?.error(`${$t('common.browserNotSupport')}Clipboard API`);
    return;
  }
  if (!source.value) {
    window.$message?.error($t('common.contentToCopied'));
    return;
  }
  copy(source.value);
  window.$message?.success(`${$t('theme.configOperation.copySuccess')}：${source.value}`);
}
</script>

<template>
  <div class="h-full">
    <NCard :title="$t('generate.text-copy')" :bordered="false" class="h-full rounded-8px shadow-sm">
      <NInputGroup>
        <NInput v-model:value="source" :placeholder="$t('generate.enterTextToCopy')" />
        <NButton type="primary" @click="handleCopy">{{ $t('generate.copy') }}</NButton>
      </NInputGroup>
    </NCard>
  </div>
</template>

<style scoped></style>
