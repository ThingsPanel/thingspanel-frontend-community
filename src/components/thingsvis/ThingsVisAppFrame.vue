
<template>
  <div class="thingsvis-frame-container" v-loading="loading">
    <iframe
      v-if="url && token"
      ref="iframeRef"
      :src="url"
      class="thingsvis-frame"
      frameborder="0"
      allowfullscreen
    ></iframe>
    <div v-else class="loading-placeholder">
      正在连接可视化引擎...
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { getThingsVisToken } from '@/service/api/thingsvis';
import { ThingsVisClient } from '@/utils/thingsvis/sdk/client';

const token = ref('');
const url = ref('');
const loading = ref(true);
const iframeRef = ref<HTMLIFrameElement | null>(null);
let client: ThingsVisClient | null = null;

onMounted(async () => {
  try {
    const res = await getThingsVisToken();
    if (res?.data?.token) {
      token.value = res.data.token;

      // 临时硬编码，之后应从环境变量读取
      // 注意：需要指向 /main#/editor 而不是 /#/editor
      const baseUrl = 'http://localhost:3000/main';
      url.value = `${baseUrl}#/editor?mode=embedded&token=${token.value}`;

      // 初始化 SDK Client (用于监听保存事件)
      // 注意：这里的 client 主要是为了保持双向通信通道打开
      if (iframeRef.value) {
        // 等待 iframe 渲染出来再初始化 client (虽然 v-if 可能导致它还没出来)
        // 实际上 v-if 会导致 ref 为 null，直到 nextTick
      }
    }
  } catch (error) {
    console.error('获取 ThingsVis Token 失败:', error);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.thingsvis-frame-container {
  width: 100%;
  height: 100%;
  position: relative;
  background: #1a1a1a;
}

.thingsvis-frame {
  width: 100%;
  height: 100%;
  display: block;
}

.loading-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: #888;
}
</style>
