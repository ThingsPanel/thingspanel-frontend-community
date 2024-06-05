<script setup lang="ts">
import { onMounted } from 'vue';
import { NButton, NFlex } from 'naive-ui';
import { useRouterPush } from '@/hooks/common/router';
import alarmDataList from '@/views/automation/scene-linkage/modules/dataList.vue';
import { $t } from '@/locales';

const { routerPushByKey } = useRouterPush();

const props = defineProps<{
  // eslint-disable-next-line vue/prop-name-casing
  config_id: string;
}>();
const alarmAdd = () => {
  routerPushByKey('automation_linkage-edit', {
    query: { device_config_id: props.config_id }
  });
};
onMounted(() => {});
</script>

<template>
  <div class="alarm-list">
    <NFlex justify="flex-end" class="mb-4">
      <NButton type="primary" @click="alarmAdd()">{{ $t('generate.addAlarmRule') }}</NButton>
    </NFlex>
    <alarmDataList :is-alarm="true" :device_config_id="props.config_id"></alarmDataList>
  </div>
</template>

<style scoped lang="scss">
.alarm-box {
  display: flex;
  flex-flow: row;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
  padding: 10px 40px;

  .alarm-item {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    //margin: 0 10px;
    padding: 18px;
    flex: 0 0 23%;
    margin-right: calc(30% / 3);
    margin-bottom: 30px;

    .item-name {
      display: flex;
      flex-flow: row;
      align-items: center;
      justify-content: space-between;
    }

    .item-desc {
      margin: 15px 0;
    }

    .item-operate {
      display: flex;
      flex-flow: row;
      justify-content: space-between;
      align-items: center;
    }
  }
}
</style>
