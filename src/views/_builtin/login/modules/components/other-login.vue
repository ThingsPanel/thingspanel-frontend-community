<script lang="ts" setup>
import { $t } from '@/locales';
</script>

<template>
  <NSpace :vertical="true">
    <NDivider class="text-14px text-#666 !mb-0">{{ $t('page.login.pwdLogin.otherLoginMode') }}</NDivider>
    <div class="flex-center">
      <NButton :text="true">
        <IconMdiWechat class="text-22px text-#888 hover:text-#52BF5E" />
      </NButton>
    </div>
  </NSpace>
</template>

<style scoped></style>
