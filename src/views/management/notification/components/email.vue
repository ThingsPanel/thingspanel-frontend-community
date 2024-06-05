<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useMessage } from 'naive-ui';
import type { FormInst, MessageReactive } from 'naive-ui';
import { useBoolean, useLoading } from '@sa/hooks';
import { editNotificationServices, fetchNotificationServicesEmail, sendTestEmail } from '@/service/api';
import { deepClone } from '@/utils/common/tool';
import { createRequiredFormRule } from '@/utils/form/rule';
import { $t } from '~/src/locales';

const { loading, startLoading, endLoading } = useLoading(false);
const { bool: visible, setTrue: openModal, setFalse: closeModal } = useBoolean();

const formModel = reactive<NotificationServices.Email>(createDefaultFormModel());

function setTableData(data: Api.NotificationServices.Email) {
  Object.assign(formModel, data);
  if (data.config !== 'null') {
    formModel.email_config = JSON.parse(data.config);
  }
}

async function getNotificationServices() {
  startLoading();
  const { data } = await fetchNotificationServicesEmail();
  if (data) {
    setTableData(data);
  }
  endLoading();
}

function createDefaultFormModel(): NotificationServices.Email {
  return {
    id: '',
    email_config: {},
    config: '',
    notice_type: 'EMAIL',
    status: 'OPEN',
    remark: ''
  };
}

const rules = {
  'email_config.host': createRequiredFormRule($t('common.pleaseCheckValue')),
  'email_config.port': createRequiredFormRule($t('common.pleaseCheckValue')),
  'email_config.from_email': createRequiredFormRule($t('common.pleaseCheckValue')),
  'email_config.from_password': createRequiredFormRule($t('common.pleaseCheckValue')),
  email: createRequiredFormRule($t('common.pleaseCheckValue')),
  body: createRequiredFormRule($t('common.pleaseCheckValue'))
};
const formRef = ref<HTMLElement & FormInst>();
async function handleSubmit() {
  await formRef.value?.validate();
  startLoading();
  const formData = deepClone(formModel);
  delete formData.config;
  const data: any = await editNotificationServices(formData);
  if (!data.error) {
    window.$message?.success('success');
    endLoading();
    await getNotificationServices();
  }
}

type FormModel = {
  body: string;
  email: string;
  header: string;
};

const debugData = reactive<FormModel>({
  body: '',
  email: '',
  header: ''
});

function handleOpenModal() {
  Object.assign(debugData, {
    body: '',
    email: '',
    header: ''
  });
  openModal();
}

const message = useMessage();
const debugFormRef = ref<HTMLElement & FormInst>();
async function handleSend() {
  await debugFormRef.value?.validate();
  let messageReactive: MessageReactive | null = message.loading($t('common.modifySuccess'), {
    duration: 100000
  });
  const data: any = await sendTestEmail(debugData);
  if (!data.error) {
    window.$message?.success('success');
  }
  if (messageReactive) {
    messageReactive.destroy();
    messageReactive = null;
  }
  closeModal();
}

function init() {
  getNotificationServices();
}

init();
</script>

<template>
  <NSpin :show="loading">
    <NForm ref="formRef" label-placement="left" :label-width="130" :model="formModel" :rules="rules">
      <NGrid :cols="24">
        <NFormItemGridItem
          :span="6"
          :label="$t('page.manage.notification.email.form.sendMailServer')"
          path="email_config.host"
        >
          <NInput v-model:value="formModel.email_config.host" />
        </NFormItemGridItem>
      </NGrid>
      <NGrid :cols="24">
        <NFormItemGridItem
          :span="6"
          :label="$t('page.manage.notification.email.form.sendPort')"
          path="email_config.port"
        >
          <NInputNumber v-model:value="formModel.email_config.port" />
        </NFormItemGridItem>
      </NGrid>
      <NGrid :cols="24">
        <NFormItemGridItem
          :span="6"
          :label="$t('page.manage.notification.email.form.senderMail')"
          path="email_config.from_email"
        >
          <NInput v-model:value="formModel.email_config.from_email" />
        </NFormItemGridItem>
      </NGrid>
      <NGrid :cols="24">
        <NFormItemGridItem
          :span="6"
          :label="$t('page.manage.notification.email.form.authorizationCodeOrPassword')"
          path="email_config.from_password"
        >
          <NInput v-model:value="formModel.email_config.from_password" />
        </NFormItemGridItem>
      </NGrid>
      <NGrid :cols="24">
        <NFormItemGridItem :span="6" :label="$t('page.manage.notification.email.form.ssl')" path="email_config.ssl">
          <n-checkbox v-model:checked="formModel.email_config.ssl"></n-checkbox>
        </NFormItemGridItem>
      </NGrid>
      <NGrid :cols="24">
        <NFormItemGridItem :span="6" :label="$t('page.manage.notification.enableDisableService')" path="status">
          <n-switch v-model:value="formModel.status" checked-value="OPEN" />
        </NFormItemGridItem>
      </NGrid>
      <NGrid :cols="24">
        <NFormItemGridItem :span="24" class="mt-20px">
          <div class="w-120px"></div>
          <NButton class="w-72px" @click="handleOpenModal">
            {{ $t('common.debug') }}
          </NButton>
          <NButton class="ml-20px w-72px" type="primary" @click="handleSubmit">
            {{ $t('common.save') }}
          </NButton>
        </NFormItemGridItem>
      </NGrid>
      <NSpace class="w-full pt-16px" :size="24" justify="start"></NSpace>
    </NForm>
  </NSpin>

  <NModal v-model:show="visible" preset="card" :title="$t('common.debug')" class="w-500px">
    <NForm ref="debugFormRef" label-placement="left" :label-width="120" :model="debugData" :rules="rules">
      <NGrid :cols="24" :x-gap="18">
        <NFormItemGridItem :span="24" :label="$t('page.manage.notification.email.form.inbox')" path="email">
          <NInput v-model:value="debugData.email" placeholder="" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('page.manage.notification.email.form.message')" path="body">
          <NInput v-model:value="debugData.body" placeholder="" />
        </NFormItemGridItem>
      </NGrid>
      <NSpace class="w-full pt-16px" :size="24" justify="center">
        <NButton class="w-72px" type="primary" @click="handleSend">{{ $t('common.send') }}</NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>

<style lang="scss"></style>
