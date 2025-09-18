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
/* 渐变动画 */
@keyframes gradient-bg {
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

/* 基础容器样式 */
.card-container {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: center;
  align-items: center;
  transition: all 0.3s ease;
  background-size: 200% 200%;
  animation: gradient-bg 3s ease infinite;
  /* 恢复用户喜欢的蓝绿色渐变 */
  background-image: linear-gradient(-45deg, #22EDF0, #58B2F8);
  /* 调整文字颜色为白色以保证对比度 */
  color: white;
}

/* 内容包裹器 */
.content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

/* 内容包裹器 */.icon {
  width: 32px;
  height: 32px;
  opacity: 0.9;
  color: white; /* 确保图标也是白色 */
}

.title {
  font-size: 16px;
  font-weight: 500;
  color: white; /* 确保标题也是白色 */
}

.value {
  font-size: 36px;
  font-weight: bold;
  color: white; /* 确保数值也是白色 */
}

/* 暗色主题样式 */
:global(.dark) .card-container {
  /* 使用更柔和的暗色渐变 */
  background-image: linear-gradient(-45deg, #485563, #29323c);
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