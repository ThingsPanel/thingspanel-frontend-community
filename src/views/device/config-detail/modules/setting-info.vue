<script setup lang="ts">
import { computed, getCurrentInstance, reactive, ref } from 'vue';
import { NButton, useDialog } from 'naive-ui';
import { router } from '@/router';
import { deviceConfigDel, deviceConfigEdit } from '@/service/api/device';
import { $t } from '@/locales';

interface Props {
  configInfo?: object | any;
}
const emit = defineEmits(['change']);
const props = withDefaults(defineProps<Props>(), {
  configInfo: null
});
const dialog = useDialog();
// const message = useMessage();
const deleteConfig = () => {
  dialog.warning({
    title: $t('common.tip'),
    content: $t('common.deleteDeviceConfig'),
    positiveText: $t('device_template.confirm'),
    negativeText: $t('common.cancel'),
    onPositiveClick: async () => {
      await deviceConfigDel({ id: props.configInfo.id });
      // message.success($t('custom.grouping_details.operationSuccess'));
      router.back();
    }
  });
};
const showModal = ref(false);
const modalIndex = ref(1);
const onlinejson = reactive({
  online_timeout: 0,
  heartbeat: 0
});
const onDialogVisble = () => {
  showModal.value = !showModal.value;
};
const onOpenDialogModal = (val: number) => {
  modalIndex.value = val;
  onDialogVisble();
  if (modalIndex.value === 1) {
    console.log('1');
  } else {
    const { online_timeout, heartbeat }: any = JSON.parse(props.configInfo?.other_config || {});
    onlinejson.online_timeout = online_timeout || 0;
    onlinejson.heartbeat = heartbeat || 0;
  }
};
const onSubmit = async () => {
  onDialogVisble();
  if (modalIndex.value === 1) {
    console.log('1');
  } else {
    const { error }: any = await deviceConfigEdit({
      id: props.configInfo.id,
      other_config: JSON.stringify({
        online_timeout: onlinejson.online_timeout,
        heartbeat: onlinejson.heartbeat
      })
    });
    !error && emit('change');
  }
};
const getPlatform = computed(() => {
  const { proxy }: any = getCurrentInstance();
  return proxy.getPlatform();
});
</script>

<template>
  <div class="flex-col gap-30px p-10px">
    <div class="">
      <div class="m-b-10px">{{ $t('generate.auto-create-device') }}</div>
      <div class="m-b-10px">{{ $t('generate.auto-create-device-via-one-type-one-secret') }}</div>
      <NButton class="" type="primary" @click="onOpenDialogModal(1)">{{ $t('generate.configuration') }}</NButton>
    </div>
    <div class="">
      <div class="m-b-10px">{{ $t('generate.onlineDeviceConfig') }}</div>
      <NButton class="" type="primary" @click="onOpenDialogModal(2)">{{ $t('generate.configuration') }}</NButton>
    </div>
    <div>
      <div class="m-b-10px color-error-500">{{ $t('generate.delete-device-configuration') }}</div>
      <NButton type="error" @click="deleteConfig">{{ $t('common.delete') }}</NButton>
    </div>

    <n-modal
      v-model:show="showModal"
      preset="dialog"
      :class="getPlatform ? '90%' : 'w-400px'"
      :title="modalIndex === 1 ? $t('generate.configure-auto-create-device') : $t('generate.onlineDeviceConfig')"
      :show-icon="false"
    >
      <template v-if="modalIndex === 1">
        <dl class="flex-col gap-20px">
          <dd>{{ $t('generate.allow-device-auto-create') }}</dd>
          <dd>
            <n-switch />
          </dd>
          <dd>{{ $t('generate.copy-one-type-one-secret-device-password') }}</dd>
          <dd>
            <NButton type="success">{{ $t('generate.copy') }}</NButton>
          </dd>
        </dl>
      </template>
      <template v-else>
        <dl class="m-b-20px flex-col">
          <dt class="m-b-5px font-900">{{ $t('generate.timeoutMinutes') }}</dt>
          <dd class="m-b-10px">
            {{ $t('generate.timeoutThreshold') }}
          </dd>
          <dd class="m-b-20px max-w-220px">
            <n-input-number v-model:value="onlinejson.online_timeout" placeholder=""></n-input-number>
          </dd>
          <dt class="m-b-5px font-900">{{ $t('generate.heartbeatIntervalSeconds') }}</dt>
          <dd class="m-b-10px">{{ $t('generate.heartbeatThreshold') }}</dd>
          <dd class="max-w-220px">
            <n-input-number v-model:value="onlinejson.heartbeat" type="text" placeholder=""></n-input-number>
          </dd>
        </dl>
      </template>

      <NFlex justify="end">
        <NButton @click="onDialogVisble">{{ $t('generate.cancel') }}</NButton>
        <NButton type="primary" @click="onSubmit">{{ $t('common.save') }}</NButton>
      </NFlex>
    </n-modal>
  </div>
</template>

<style scoped></style>
