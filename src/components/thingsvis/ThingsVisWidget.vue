
<template>
  <div class="thingsvis-widget-container" ref="container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { ThingsVisClient } from '@/utils/thingsvis/sdk/client';

const props = defineProps<{
  /** 初始配置 (JSON) */
  config: any;
  /** 可选: 实时数据 (Host推送) */
  data?: Record<string, any>;
  /** 可选: 平台字段 schema (用于选择器) */
  platformFields?: any[];
  /** 可选: 高度 */
  height?: string;
  /** 编辑模式: 'viewer' (纯预览) | 'editor' (可视化编辑) */
  mode?: 'viewer' | 'editor';
}>();

const emit = defineEmits<{
  (e: 'save', config: any): void;
  (e: 'change', config: any): void;
  (e: 'ready'): void;
}>();

const container = ref<HTMLElement | null>(null);
let client: ThingsVisClient | null = null;

// 辅助函数: 深拷贝以去除 Vue Proxy，防止 DataCloneError
const clone = (obj: any) => {
  if (!obj) return null;
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (e) {
    console.error('JSON clone failed:', e);
    return {};
  }
};

import { getThingsVisToken } from '@/service/api/thingsvis';

// 初始化客户端
onMounted(async () => {
  if (!container.value) return;

  // 从环境变量读取 ThingsVis Studio URL
  let baseUrl = import.meta.env.VITE_THINGSVIS_STUDIO_URL || 'http://localhost:3000/main';
  // 移除可能的 hash 部分
  const hashIdx = baseUrl.indexOf('#');
  if (hashIdx !== -1) baseUrl = baseUrl.substring(0, hashIdx);

  // 获取 Token 以便 URL 优先鉴权
  const token = await getThingsVisToken();
  const tokenParams = token ? `&token=${token}` : '';

  // 追加 saveTarget=host，告知 Editor 进入宿主托管模式
  const targetUrl = props.mode === 'editor'
    ? `${baseUrl}#/editor?mode=embedded&saveTarget=host${tokenParams}`
    : `${baseUrl}#/embed?mode=embedded&saveTarget=host${tokenParams}`;

  client = new ThingsVisClient({
    container: container.value,
    mode: 'widget', // 始终是 widget 模式 (数据透传)
    url: targetUrl,
    style: {
      height: props.height || '100%',
      minHeight: '400px'
    }
  });

  // Client Ready 时，发送初始数据
  client.on('ready', () => {
    emit('ready');
    if (props.config) client?.loadWidgetConfig(clone(props.config), clone(props.platformFields || []));
    if (props.platformFields) client?.updateSchema(clone(props.platformFields));
    if (props.data) client?.pushData(clone(props.data));
  });

  // 监听保存 (Guest -> Host)
  client.on('tv:save-config', (payload: any) => {
    // 兼容两种 payload 格式:
    // 1. triggerSave 路径: payload = { canvas, nodes, dataBindings, thumbnail, meta }
    // 2. request-save 路径: payload = { config: { meta, canvas, nodes, dataSources } }
    const config = payload?.config || payload;
    emit('save', config);
    emit('change', config);
  });
});

// 响应式监听配置变化
watch(() => props.config, (newVal) => {
  if (client?.ready && newVal) {
    client.loadWidgetConfig(clone(newVal), clone(props.platformFields || []));
  }
}, { deep: true });

// 响应式监听数据变化
watch(() => props.data, (newVal) => {
  if (client?.ready && newVal) {
    client.pushData(clone(newVal));
  }
}, { deep: true });

// 响应式监听 Schema 变化
watch(() => props.platformFields, (newVal) => {
  if (client?.ready && newVal) {
    client.updateSchema(clone(newVal));
  }
}, { deep: true });

// 主动触发保存 (Host -> Guest -> Host:save)
const triggerSave = () => {
  client?.requestSave();
};

onBeforeUnmount(() => {
  if (client) {
    client.destroy();
    client = null;
  }
});

defineExpose({
  triggerSave,
  client
});
</script>

<style scoped>
.thingsvis-widget-container {
  width: 100%;
  min-height: 100%;
  position: relative;
  /* 不设 overflow:hidden，避免截断内容 */
  overflow: auto;
  /* 确保有最小高度，否则iframe可能塌陷 */
  min-height: 400px;
}
</style>
