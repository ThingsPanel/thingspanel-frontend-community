<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { FormItemRule } from 'naive-ui';
import { MemberNotificationOptions } from '@/constants/business';
import { createRequiredFormRule } from '@/utils/form/rule';
import { $t } from '@/locales';
import {
  getCurrentName,
  handleDeleteMember,
  handleScroll,
  handleSearch,
  handleUpdateMember,
  notificationTypeOptions
} from '../utils';

const loading = ref(false);
type FormModel = Pick<DataService.Data, any>;

const formModel = reactive<FormModel>(createDefaultFormModel());

function createDefaultFormModel(): FormModel {
  return {
    name: '',
    signMode: null
  };
}

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = {
  name: createRequiredFormRule($t('generate.ruleName')),
  signMode: createRequiredFormRule($t('generate.signatureMethod')),
  ip: createRequiredFormRule($t('generate.IPwhitelist'))
};

const props = withDefaults(
  defineProps<{
    index: number;
    selectedNotificationType: string[];
  }>(),
  {
    index: 0,
    notificationType: []
  }
);
const selectedMember = ref(getCurrentName(props.index));
const selectNotificationType = ref(props.selectedNotificationType);

const handleDelete = (index: number) => {
  handleDeleteMember(index);
};

const handleUpdate = () => {
  handleUpdateMember(props.index, { name: selectedMember.value || '', notificationType: selectNotificationType.value });
};

const handleChange = () => {
  handleUpdate();
};
</script>

<template>
  <NForm ref="formRef" label-placement="left" :label-width="120" :model="formModel" :rules="rules">
    <NFormItem path="name">
      <NSelect
        v-model:value="selectedMember"
        :placeholder="$t('generate.select-user')"
        :options="notificationTypeOptions"
        clearable
        remote
        filterable
        :loading="loading"
        style="width: 160px; margin-right: 16px"
        @search="handleSearch"
        @scroll="handleScroll"
        @update:value="handleChange"
      />
      <NCheckboxGroup v-model:value="selectNotificationType" @click="handleUpdate">
        <NSpace item-style="display: flex;">
          <NCheckbox
            v-for="item in MemberNotificationOptions"
            :key="item.value"
            :value="item.value"
            :label="item.label"
          >
            {{ item.label }}
          </NCheckbox>
        </NSpace>
      </NCheckboxGroup>
      <NButton type="error" size="small" style="margin-left: 12px" @click="() => handleDelete(index)">
        {{ $t('common.delete') }}
      </NButton>
    </NFormItem>
  </NForm>
</template>

<style lang="scss" scoped></style>
