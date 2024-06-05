<!--
 * @Descripttion:
 * @version:
 * @Author: zhaoqi
 * @Date: 2024-03-17 09:14:38
 * @LastEditors: zhaoqi
 * @LastEditTime: 2024-03-20 17:23:40
-->
<script setup lang="tsx">
import { ref } from 'vue';
import { NButton, NTag, useMessage } from 'naive-ui';
import { useBoolean } from '@sa/hooks';
import { useAuthStore } from '@/store/modules/auth';
import { $t } from '@/locales';
import type { ModalType } from './components/change-information.vue';
import ChangeInformation from './components/change-information.vue';

const { bool: visible, setTrue: openModal } = useBoolean();
const authStore = useAuthStore();
const modalType = ref<ModalType>('amend');
const message = useMessage();

function setModalType(type: ModalType) {
  modalType.value = type;
}

function editName() {
  openModal();
  setModalType('amend');
}

function changePassword() {
  openModal();
  setModalType('changePassword');
}

function modification(e) {
  console.log(895656, e);
  if (!e) {
    useAuthStore();
    message.success($t('common.modifySuccess'));
  } else {
    message.error('修改失败');
  }
}
</script>

<template>
  <div class="overflow-hidden">
    <NCard :title="$t('generate.personal-space')" :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="basic-information flex">
        <NTag :bordered="false">{{ $t('generate.basic-info') }}</NTag>
        <NCard>
          <n-grid x-gap="9" :cols="3">
            <n-gi>
              <NCard class="i-flex-vertical" :bordered="false">
                <NSpace vertical>
                  <NForm
                    label-placement="left"
                    :style="{
                      maxWidth: '640px'
                    }"
                  >
                    <NFormItem :label="$t('generate.last-name')" path="inputValue">
                      <span>{{ authStore.userInfo.name }}</span>
                    </NFormItem>
                    <NFormItem :label="$t('generate.account-type')" path="inputValue">
                      <span>{{ $t('generate.super-admin') }}</span>
                    </NFormItem>
                    <NFormItem :label="$t('generate.email-address')" path="inputValue">
                      <span>{{ authStore.userInfo.email }}</span>
                    </NFormItem>
                    <NFormItem :label="$t('generate.phoneNumber')" path="inputValue">
                      <span>{{ authStore.userInfo.phone_number }}</span>
                    </NFormItem>
                  </NForm>
                </NSpace>
              </NCard>
            </n-gi>
            <n-gi>
              <SvgIcon class="editor mt-8 cursor-pointer lg:text-[18px]" local-icon="PencilAlt" @click="editName()" />
            </n-gi>
            <n-gi>
              <NButton class="mt-5" @click="changePassword">{{ $t('generate.change-password') }}</NButton>
            </n-gi>
          </n-grid>
        </NCard>
      </div>
      <ChangeInformation v-model:visible="visible" :type="modalType" @modification="modification" />
    </NCard>
  </div>
</template>

<style scoped></style>
