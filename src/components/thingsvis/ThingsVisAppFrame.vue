
<template>
  <div class="thingsvis-frame-container">
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

const props = defineProps<{
  id: string;
  mode?: string;
}>();

const token = ref('');
const url = ref('');
const loading = ref(true);
const iframeRef = ref<HTMLIFrameElement | null>(null);
let client: ThingsVisClient | null = null;

onMounted(async () => {
  console.log('[AppFrame] 加载中...', props.id);
  try {
    const tokenRes = await getThingsVisToken();
    console.log('[AppFrame] 获取 Token 结果:', tokenRes);

    // res 可能是对象也可能是字符串 (取决于 axios 拦截器或接口定义)
    // 根据 getThingsVisToken 实现，它直接返回 string | null
    const tokenStr = typeof tokenRes === 'string' ? tokenRes : (tokenRes as any)?.data?.token || (tokenRes as any)?.token;

    if (tokenStr) {
      token.value = tokenStr;

      // 从环境变量读取 ThingsVis Studio URL
      let baseUrl = import.meta.env.VITE_THINGSVIS_STUDIO_URL || 'http://localhost:3000/main';
      const hashIdx = baseUrl.indexOf('#');
      if (hashIdx !== -1) baseUrl = baseUrl.substring(0, hashIdx);

      // 构造 URL: /main#/editor/{id}?mode=embedded&token=...
      // 直接使用传入的 props.id，后端已支持通过该 ID 自动创建或查找
      url.value = `${baseUrl}#/editor/${props.id}?mode=embedded&token=${token.value}`;
      console.log('[AppFrame] iframe URL 设置为:', url.value);
    } else {
      console.warn('[AppFrame] Token 获取失败或格式不正确', tokenRes);
    }
  } catch (error) {
    console.error('获取 ThingsVis Token 失败:', error);
  } finally {
    loading.value = false;
  }
});

const handleMessage = async (event: MessageEvent) => {
  if (!event.data || typeof event.data !== 'object') return;

  const { type, projectId } = event.data;

  if (type === 'tv:ready' || type === 'READY') {
    if (iframeRef.value?.contentWindow && token.value) {
      console.log('[AppFrame] Iframe ready, sending init postMessage')
      const apiBaseUrl = window.location.origin + '/thingsvis-api'
      iframeRef.value.contentWindow.postMessage({
        type: 'tv:init',
        data: {
          meta: { id: props.id }
        },
        config: {
          mode: 'app',
          saveTarget: 'self',
          token: token.value,
          apiBaseUrl: apiBaseUrl
        }
      }, '*')
    }
  }

  if (type === 'tv:preview') {
    if (!token.value) return;
    // 打开预览页，复用当前 token
    let baseUrl = import.meta.env.VITE_THINGSVIS_STUDIO_URL || 'http://localhost:3000/main';
    const hashIdx2 = baseUrl.indexOf('#');
    if (hashIdx2 !== -1) baseUrl = baseUrl.substring(0, hashIdx2);
    const previewUrl = `${baseUrl}#/preview?projectId=${projectId || props.id}&token=${token.value}&mode=embedded`;
    window.open(previewUrl, '_blank');
  }

  if (type === 'tv:publish') {
    try {
      // 动态导入以避免循环依赖或按需加载
      const { publishThingsVisDashboard } = await import('@/service/api/thingsvis');
      const res = await publishThingsVisDashboard(projectId || props.id);

      if (res.data) {
        // 使用 window.$message (如果 naive-ui 已挂载到 window) 或者 alert fallback
        if ((window as any).$message) {
          (window as any).$message.success('发布成功');
        } else {
          alert('发布成功');
        }
      } else {
        console.error('发布失败', res.error);
        if ((window as any).$message) {
          (window as any).$message.error('发布失败: ' + (res.error?.message || '未知错误'));
        }
      }
    } catch (e) {
      console.error('发布异常', e);
    }
  }
};

onMounted(() => {
  window.addEventListener('message', handleMessage);
});

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage);
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
