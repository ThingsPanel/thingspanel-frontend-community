<script lang="ts" setup>
import { provide, reactive, toRaw, watch } from 'vue';
import { cloneDeep } from 'lodash-es';
import type { IConfigCtx } from '@/components/panel/card';

const props = defineProps<IConfigCtx>();

const model = reactive<Record<string, any>>(cloneDeep(props.config || {}));

watch(
  () => props.config,
  (newConfig) => {
    const newClonedConfig = cloneDeep(newConfig || {});
    if (JSON.stringify(model) !== JSON.stringify(newClonedConfig)) {
       Object.keys(model).forEach(key => delete model[key]);
       Object.assign(model, newClonedConfig);
    }
  },
  { deep: true }
);

provide('config-ctx', {
  config: model,
  view: props.view
});

defineExpose({
  getModel: () => cloneDeep(toRaw(model))
});

const emit = defineEmits<{
  (e: 'update:config', value: Record<string, any>): void;
}>();

watch(
  model,
  v => {
    emit('update:config', cloneDeep(toRaw(v)));
  },
  { deep: true }
);
</script>

<template>
  <div>
    <slot></slot>
  </div>
</template>
