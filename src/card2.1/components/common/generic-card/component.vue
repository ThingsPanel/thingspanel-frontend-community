<template>
  <div class="card-container" :style="cardStyle">
    <div class="content-wrapper">
      <div class="header">
        <div class="title">
          <slot name="title"></slot>
        </div>
        <div class="icon">
          <slot name="icon"></slot>
        </div>
      </div>
      <div class="value">
        <slot name="value"></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

// 定义组件的 props
const props = defineProps({
  // 颜色属性，用于设置背景渐变
  startColor: {
    type: String,
    default: '#409eff'
  },
  endColor: {
    type: String,
    default: '#67c23a'
  }
});

// 计算样式，根据传入的颜色 props 生成背景渐变
const cardStyle = computed(() => ({
  backgroundImage: `linear-gradient(45deg, ${props.startColor} 0%, ${props.endColor} 25%, ${props.startColor} 50%, ${props.endColor} 75%, ${props.startColor} 100%)`,
  backgroundSize: '400% 400%', // 确保动效所需的背景尺寸
  animation: 'dazzling-gradient 10s ease-in-out infinite' // 确保动画不被覆盖
}));
</script>

<style lang="scss" scoped>
/*
  定义渐变动画的关键帧
  通过改变背景位置实现扫光效果
*/
@keyframes dazzling-gradient {
  0% {
    background-position: 0% 0%;
  }
  25% {
    background-position: 100% 0%;
  }
  50% {
    background-position: 100% 100%;
  }
  75% {
    background-position: 0% 100%;
  }
  100% {
    background-position: 0% 0%;
  }
}

/* 卡片容器的基础样式 */
.card-container {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  padding: 16px;
  box-sizing: border-box;
  color: white; /* 设置文字颜色为白色以获得更好的对比度 */

  /*
    动画效果现在通过 JavaScript 计算样式设置
    这样可以确保自定义颜色和动效同时生效
  */
}

/* 内容包装器，用于居中 */
.content-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 16px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* 图标样式 */
.icon :deep(svg) {
  width: 44px;
  height: 44px;
  opacity: 0.9;
  color: white; /* 确保图标是白色的 */
}

/* 标题样式 */
.title {
  font-size: 20px;
  font-weight: 500;
  color: white; /* 确保标题是白色的 */
}

/* 数值样式 */
.value {
  font-size: 56px;
  font-weight: bold;
  color: white; /* 确保数值是白色的 */
  text-align: left;
  width: 100%;
}

/* 暗黑模式样式 */
:global(.dark) .card-container {
  /*
    为暗黑模式协调的深蓝绿色渐变
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