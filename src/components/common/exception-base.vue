<script lang="ts" setup>
import { computed } from 'vue';
import { $t } from '@/locales';
import { useRouterPush } from '@/hooks/common/router';
import { useAuthStore } from '@/store/modules/auth';

defineOptions({ name: 'ExceptionBase' });

type ExceptionType = '403' | '404' | '500';

interface Props {
  /**
   * Exception type
   *
   * - 403: no permission
   * - 404: not found
   * - 500: service error
   */
  type: ExceptionType;
}

const props = defineProps<Props>();

const iconMap: Record<ExceptionType, string> = {
  '403': 'no-permission',
  '404': 'not-found',
  '500': 'service-error'
};

const icon = computed(() => iconMap[props.type]);

const { toLogin } = useRouterPush();
const authStore = useAuthStore();

function logout() {
  window.$dialog?.info({
    title: $t('common.tip'),
    content: $t('common.logoutConfirm'),
    positiveText: $t('common.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: () => {
      authStore.resetStore();
      toLogin();
    }
  });
}
</script>

<template>
  <div class="min-h-520px wh-full flex-vertical-center gap-24px overflow-hidden">
    <ButtonIcon class="position-absolute position-right-2xl position-top-2xl" @click="logout">
      <SvgIcon icon="ph:sign-out" class="text-icon-medium" />
      <span class="text-14px font-medium">{{ $t('common.logout') }}</span>
    </ButtonIcon>
    <div class="flex text-400px text-primary">
      <SvgIcon :local-icon="icon" />
    </div>
    <RouterLink to="/">
      <NButton type="primary">{{ $t('common.backToHome') }}</NButton>
    </RouterLink>
  </div>
</template>

<style scoped></style>
