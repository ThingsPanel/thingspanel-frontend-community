<template>
  <div class="inspector">
    <div v-if="selectedItem" class="inspector-content">
      <h4>{{ inspectorTitle }}</h4>
      
      <!-- 遍历选中项的配置 -->
      <div v-for="(configItem, key) in selectedItem.config" :key="key">
        <component
          :is="resolveInspectorComponent(configItem.inspector)"
          :modelValue="configItem.value"
          :label="configItem.label || key"
          :description="configItem.description"
          v-bind="configItem"
          @update:modelValue="panelStore.updateConfigValue({ configKey: key, newValue: $event, cardId: selectedItem?.id || undefined })"
        />
      </div>

    </div>
    <div v-else class="placeholder">
      <p>请选择一个卡片或看板进行配置</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { usePanelStore } from '../state/panelStore';
import type { ComponentRegistry } from '../types';

const props = defineProps<{ 
  registry?: ComponentRegistry<any>;
}>();

const panelStore = usePanelStore();

const selectedItem = computed(() => panelStore.selectedItem);

const inspectorTitle = computed(() => {
  if (!selectedItem.value) return '配置';
  return selectedItem.value.id ? `卡片配置 (ID: ${selectedItem.value.id})` : '看板配置';
});

const resolveInspectorComponent = (inspectorName: string) => {
  return props.registry?.[inspectorName] || null;
};



</script>

<style scoped>
.inspector {
  width: 300px;
  background-color: #ffffff;
  padding: 16px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.inspector-content h4 {
  margin-top: 0;
  margin-bottom: 24px;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.placeholder {
  color: #999;
  text-align: center;
  margin-top: 40px;
}
</style>