<template>
  <div class="card-container">
    <div class="content-wrapper">
      <!-- CPU Icon -->
      <svg
        class="icon"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M12 2a10 10 0 0 0-10 10a10 10 0 0 0 10 10a10 10 0 0 0 10-10A10 10 0 0 0 12 2M9 9h6v6H9zM5 9h2v2H5zm0 4h2v2H5zm12-4h2v2h-2zm0 4h2v2h-2zM9 5h2v2H9zm4 0h2v2h-2zM5 13h2v2H5zm12 0h2v2h-2zm-4 4h2v2h-2zm-4 0h2v2H9z" />
      </svg>
      <div class="title">
        {{ t('card.deviceTotal') }}
      </div>
      <div class="value">
        <CountTo :end-val="count" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { CountTo } from 'vue3-count-to';
import { totalNumber } from '@/service/api/system-data';

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
/* 
  Keyframes for the dazzling gradient animation.
  Moves the background position to create a sweeping light effect.
*/
@keyframes dazzling-gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* Base styles for the card container */
.card-container {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white; /* Set text color to white for better contrast */

  /* 
    Animation setup for the metallic reflection effect.
    - The background is sized at 400% to make the gradient movement more pronounced.
    - The 'dazzling-gradient' animation runs over 10 seconds for a dynamic yet smooth feel.
  */
  background-size: 400% 400%;
  animation: dazzling-gradient 10s ease-in-out infinite;

  /* 
    Pure, flowing blue-green gradient without white highlights.
  */
  background-image: linear-gradient(
    45deg,
    #409eff,
    #58b2f8,
    #22edf0,
    #67c23a
  );
}

/* Content wrapper for centering */
.content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

/* Icon styles */
.icon {
  width: 32px;
  height: 32px;
  opacity: 0.9;
  color: white; /* Ensure icon is white */
}

/* Title styles */
.title {
  font-size: 16px;
  font-weight: 500;
  color: white; /* Ensure title is white */
}

/* Value styles */
.value {
  font-size: 36px;
  font-weight: bold;
  color: white; /* Ensure value is white */
}

/* Dark theme styles */
:global(.dark) .card-container {
  /* 
    A coordinated dark blue-green gradient for dark mode.
  */
  background-image: linear-gradient(
    45deg,
    #1d3a5c,
    #2c5282,
    #2b6cb0,
    #2a5c40
  );
  color: #e5e7eb; /* Tailwind gray-200 */
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

:global(.dark) .icon {
  color: #e5e7eb;
}

:global(.dark) .title {
  color: #d1d5db;
}

:global(.dark) .value {
  color: #f9fafb;
}
</style>