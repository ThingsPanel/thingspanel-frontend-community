<script setup lang="ts">
import { $t } from '@/locales'

defineOptions({
  name: 'ReloadButton'
})

interface Props {
  loading?: boolean
}

defineProps<Props>()
</script>

<template>
  <ButtonIcon :tooltip-content="刷新页面">
    <IconAntDesignReloadOutlined :class="{ 'animate-spin animate-duration-750': loading }" />
  </ButtonIcon>
</template>

<style scoped></style>
