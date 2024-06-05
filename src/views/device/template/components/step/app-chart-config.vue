<script setup lang="tsx">
import { provide, ref } from 'vue';
import { $t } from '@/locales';
import { getTemplat, putTemplat } from '@/service/api';
import type { ICardView } from '@/components/panel/card';
import templatePanel from '../card-select/template-panel.vue';

const emit = defineEmits(['update:stepCurrent', 'update:modalVisible']);

const props = defineProps({
  // 当前的步骤
  stepCurrent: {
    type: Number,
    required: true
  },
  // 添加用的模态框状态
  modalVisible: {
    type: Boolean,
    required: true
  },
  // 当前的设备模型id
  deviceTemplateId: {
    type: String,
    required: true
  }
});

const web_chart_config = ref<ICardView[]>([]);
provide('web_chart_config', web_chart_config);

// 取消
const cancellation: () => void = () => {
  emit('update:modalVisible');
};
// 上一步
const back: () => void = () => {
  emit('update:stepCurrent', 3);
};
// 下一步
// eslint-disable-next-line consistent-return
const next = async () => {
  let flag = false;
  let theIndex = 0;
  web_chart_config?.value?.forEach((i, index) => {
    if (i?.data?.dataSource?.deviceSource && !i?.data?.dataSource?.deviceSource[0]?.metricsId) {
      flag = true;
      theIndex = index;
    }
  });

  if (web_chart_config.value.length < 1 || flag) {
    window.NMessage.error(
      flag ? `${$t('common.section')}${theIndex + 1}${$t('common.accompaniedIndicators')}` : $t('common.leastOneChart')
    );
  } else {
    const res = await getTemplat(props.deviceTemplateId);
    await putTemplat({ ...res.data, app_chart_config: JSON.stringify(web_chart_config.value) });
    emit('update:stepCurrent', 5);
  }
};
</script>

<template>
  <div>
    <templatePanel :template-id="props.deviceTemplateId" :is-app="true" />
    <div class="box1 m-t2">
      <NButton type="primary" @click="next">{{ $t('device_template.nextStep') }}</NButton>
      <NButton class="m-r3" type="primary" ghost @click="back">{{ $t('device_template.back') }}</NButton>
      <NButton class="m-r3" @click="cancellation">{{ $t('device_template.cancellation') }}</NButton>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.box1 {
  display: flex;
  flex-direction: row-reverse;
}
</style>
