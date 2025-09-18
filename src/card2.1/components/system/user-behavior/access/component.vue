<template>
  <GenericCard start-color="#722ed1" end-color="#9254de">
    <template #title>{{ t('card.deviceTotal') }}</template>
    <template #icon>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="M12 2a10 10 0 0 0-10 10a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2M9 9h6v6H9zM5 9h2v2H5zm0 4h2v2H5zm12-4h2v2h-2zm0 4h2v2h-2zM9 5h2v2H9zm4 0h2v2h-2zM5 13h2v2H5zm12 0h2v2h-2zm-4 4h2v2h-2zm-4 0h2v2H9z"
        />
      </svg>
    </template>
    <template #value>
      <CountTo :end-val="count" />
    </template>
  </GenericCard>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { CountTo } from 'vue3-count-to';
import { totalNumber } from '@/service/api/system-data';
import GenericCard from '@/card2.1/components/common/generic-card/component.vue';

const { t } = useI18n();
const count = ref(0);

async function fetchDeviceTotal() {
  try {
    const { data } = await totalNumber();
    if (data && typeof data.device_total === 'number') {
      count.value = data.device_total;
    }
  } catch (error) {
    console.error('Error fetching device total:', error);
  }
}

onMounted(() => {
  fetchDeviceTotal();
});
</script>

<style lang="scss" scoped>
/* All styles are now handled by the GenericCard component */
</style>
