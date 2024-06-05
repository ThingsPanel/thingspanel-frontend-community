<script lang="ts" setup>
import { inject, ref, watch } from 'vue';
import type { ICardData, IConfigCtx } from '@/components/panel/card';
import { $t } from '@/locales';
import { deviceDatas } from './api';

const flag: any = ref(false);
const active0: any = ref('');
const active1: any = ref('');
const ctx = inject<IConfigCtx>('config-ctx')!;

const props = defineProps<{
  // card: ICardData,
  data: ICardData;
}>();

const clickSwitch: () => void = async () => {
  const arr: any = props?.data?.dataSource;
  const device_id = arr.deviceSource[0]?.deviceId ?? '';
  if (device_id) {
    const obj = {
      device_id,
      value: JSON.stringify({
        switch: flag.value ? 1 : 0
      })
    };
    await deviceDatas(obj);
  } else {
    console.log('获取不到设备参数');
  }
};

const blurClick: () => void = () => {
  console.log(active0.value === '0', active1.value);
  if (active0.value === '1' || active1.value === '0') {
    flag.value = active0.value === '1';
    clickSwitch();
  } else {
    console.log('获取不到设备参数');
  }
};

watch(
  () => props.data?.dataSource?.deviceSource,
  () => {
    console.log(props?.data?.dataSource, $t('common.test'));
  },
  { deep: true, immediate: true }
);
</script>

<template>
  <div>
    <div class="title">{{ $t('generate.set-default-device-open-status') }}</div>
    <NForm :model="ctx.config">
      <NFormItem :label="$t('generate.open')">
        <n-input v-model:value="active0" :placeholder="$t('generate.open') + '1'" />
      </NFormItem>
      <NFormItem :label="$t('generate.close')">
        <n-input v-model:value="active1" :placeholder="$t('generate.close') + '0'" />
      </NFormItem>
      <NFormItem>
        <n-button type="info" class="btn" @click="blurClick">{{ $t('page.login.common.confirm') }}</n-button>
      </NFormItem>
    </NForm>
  </div>
</template>

<style lang="scss">
.title {
  font-weight: 900;
  font-size: 20px;
  margin-bottom: 20px;
}

.n-input-number > .n-input > .n-input-wrapper > .n-input__suffix {
  display: none !important;
}

.btn {
  margin-left: 20px;
}
</style>
