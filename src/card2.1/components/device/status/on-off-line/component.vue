<template>
  <div class="card-container">
    <div class="content-wrapper">
      <!-- Wifi Icon -->
      <svg
        class="icon"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="M12 21a1 1 0 0 1-1-1v-2.05a8 8 0 0 1-6.23-7.45a1 1 0 0 1 2 .22a6 6 0 0 0 10.5 4.51l.1.11a1 1 0 0 1-1.52 1.3l-.1-.11A5.94 5.94 0 0 0 13 11.5a1 1 0 0 1-2 0a8 8 0 0 1 7.23-7.95a1 1 0 0 1 .77 1.22A9.91 9.91 0 0 1 13 18.05V20a1 1 0 0 1-1 1m-3.5-5.68a5.91 5.91 0 0 0 4.24 1.76a6 6 0 0 0 4.22-10.32l.1-.1a1 1 0 1 0-1.52-1.3l-.1.1a4 4 0 0 1-5.66 5.66a1 1 0 0 0 0 1.41a1 1 0 0 0 .71.3Z"
        />
      </svg>

      <div class="data-grid">
        <!-- Online Devices -->
        <div class="data-item">
          <div class="title">{{ t('card.onlineDev') }}</div>
          <div class="value">
            <CountTo :end-val="onlineCount" />
          </div>
        </div>

        <!-- Offline Devices -->
        <div class="data-item">
          <div class="title">{{ t('card.offlineDev') }}</div>
          <div class="value">
            <CountTo :end-val="offlineCount" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { CountTo } from 'vue3-count-to';
import { sumData, totalNumber } from '@/service/api'; // Assuming the API path
import { useAuthStore } from '@/store/modules/auth';

// --- 命名与国际化 ---
defineOptions({ name: 'OnOffLineCard' });
const { t } = useI18n();
const authStore = useAuthStore();

// --- 响应式状态定义 ---
const onlineCount = ref(0);
const offlineCount = ref(0);

/**
 * @description 获取设备在线/离线数量
 * 根据用户权限调用不同接口
 */
async function fetchDeviceCounts() {
  try {
    const response = authStore.userInfo.authority === 'TENANT_ADMIN' ? await sumData() : await totalNumber();
    if (response && response.data) {
      onlineCount.value = response.data.device_on || 0;
      offlineCount.value = response.data.device_off || 0;
    }
  } catch (error) {
    console.error('Error fetching device counts:', error);
  }
}

// --- 生命周期钩子 ---
onMounted(() => {
  fetchDeviceCounts();
});
</script>

<style lang="scss" scoped>
/* 
  炫彩渐变动画的关键帧。
  通过移动背景位置，创造出光影扫过的效果。
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

/* 卡片容器基础样式 */
.card-container {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white; /* 默认文字颜色设为白色以保证对比度 */

  /* 
    金属反射动效的动画设置。
    - 背景尺寸放大到 400%，使渐变移动更明显。
    - 'dazzling-gradient' 动画以 10 秒周期无限循环，效果平滑且具动感。
  */
  background-size: 400% 400%;
  animation: dazzling-gradient 10s ease-in-out infinite;

  /* 
    流动的蓝绿色渐变，不含白色高光，营造纯粹的视觉效果。
  */
  background-image: linear-gradient(
    45deg,
    #409eff,
    #58b2f8,
    #22edf0,
    #67c23a
  );
}

/* 内容包裹器，用于居中和布局 */
.content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px; /* 增加图标与数据网格的间距 */
  text-align: center;
}

/* 数据网格布局，用于并排显示在线/离线数据 */
.data-grid {
  display: flex;
  gap: 24px; /* 增加两个数据项之间的间距 */
}

.data-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

/* 图标样式 */
.icon {
  width: 28px;
  height: 28px;
  opacity: 0.9;
  color: white;
}

/* 标题样式 */
.title {
  font-size: 14px;
  font-weight: 500;
  color: white;
}

/* 数值样式 */
.value {
  font-size: 28px;
  font-weight: bold;
  color: white;
}

/* 暗黑模式样式 */
:global(.dark) .card-container {
  /* 
    为暗黑模式适配的蓝绿色渐变。
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

:global(.dark) .icon,
:global(.dark) .title,
:global(.dark) .value {
  color: #e5e7eb;
}
</style>