<script lang="ts" setup>
import { useSysSettingStore } from '@/store/modules/sys-setting';
defineOptions({ name: 'SystemLogo' });
const sysSettingStore = useSysSettingStore();
export interface Props {
  width: string;
}

withDefaults(defineProps<Props>(), {
  width: '40'
});
</script>

<template>
  <!-- <IconLocalLogo /> -->
  <div>
    <!--  v-if="sysSettingStore.logo_background"  -->
    <!-- {{sysSettingStore  }} -->
    <n-image
      :width="width"
      :src="sysSettingStore.logo_background === '' ? '/favicon.svg' : sysSettingStore.logo_background"
    />
    <!-- <v-else icon-local-logo /> -->
  </div>
</template>

<style scoped></style>
