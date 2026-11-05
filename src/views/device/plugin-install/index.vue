<script setup lang="ts">
// Tenant administrators install plugins here (runtime identities can only be issued by a tenant administrator).
import { NCard } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import InstallPlugins from '@/views/apply/plugin/InstallPlugins.vue'

const { locale } = useI18n()
const title = () => (locale.value.toLowerCase().startsWith('zh') ? '插件安装' : 'Plugin install')
</script>

<template>
  <NCard :title="title()" :bordered="false" class="h-full rounded-8px shadow-sm">
    <InstallPlugins />
  </NCard>
</template>
