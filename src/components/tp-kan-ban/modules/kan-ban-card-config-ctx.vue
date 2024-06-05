<script setup lang="ts">
import { onMounted, provide, reactive, toRaw, watch } from 'vue';
// import {cloneDeep} from 'lodash';
import type { IConfigCtx } from '@/components/tp-kan-ban/kan-ban';

defineExpose({ name: 'KanBanCardConfigCtx' });
const props = defineProps<IConfigCtx>();
const model = reactive<Record<string, any>>({
  basis: {},
  source: {},
  cardUI: {}
});

onMounted(() => {
  if (props.config) {
    Object.keys(toRaw(props.config)).forEach((key: string) => {
      model[key] = props.config[key];
    });
  }
});

provide('kan-ban-config-ctx', {
  config: model,
  view: props.view
});

// defineExpose({
//   getModel: () => cloneDeep(toRaw(model))
// });

const emit = defineEmits<{
  (e: 'update:config', value: Record<string, any>): void;
}>();

watch(
  model,
  v => {
    emit('update:config', v);
  },
  { deep: true }
);
</script>

<template>
  <div>
    <slot></slot>
  </div>
</template>

<style scoped></style>
