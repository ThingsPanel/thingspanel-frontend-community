<script setup lang="ts">
import { $t } from '@/locales';

const props = defineProps<{
  isSuccess: boolean;
  closeCallback: () => void;
  backCallback: () => void;
}>();
console.log(props);
</script>

<template>
  <n-result
    v-if="isSuccess"
    status="success"
    :title="$t('custom.devicePage.success')"
    :description="$t('custom.devicePage.deviceConfigSuccess')"
  >
    <template #footer>
      <n-button @click="closeCallback">{{ $t('custom.devicePage.close') }}</n-button>
    </template>
  </n-result>
  <n-result
    v-if="!isSuccess"
    status="error"
    :title="$t('custom.devicePage.fail')"
    :description="$t('custom.devicePage.deviceConfigFail')"
  >
    <template #footer>
      <n-button @click="backCallback">{{ $t('custom.devicePage.back') }}</n-button>
      <n-button @click="closeCallback">{{ $t('custom.devicePage.close') }}</n-button>
    </template>
  </n-result>
</template>

<style scoped></style>
