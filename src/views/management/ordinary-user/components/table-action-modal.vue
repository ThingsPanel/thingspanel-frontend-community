<script setup lang="ts">
import { computed, reactive, ref, toRefs, watch } from 'vue';
import type { FormInst, FormItemRule } from 'naive-ui';
import { addUser, editUser } from '@/service/api/auth';
import { fetchGetAllRoles } from '@/service/api';
import { createRequiredFormRule, formRules, getConfirmPwdRule } from '@/utils/form/rule';
import { $t } from '@/locales';

export type ModalType = NonNullable<any['type']>;

defineOptions({ name: 'TableActionModal' });

const props = withDefaults(
  defineProps<{
    visible?: boolean;
    type: string;
    editData: any;
  }>(),
  {
    type: 'add',
    editData: null
  }
);

interface Emits {
  (e: 'update:visible', visible: boolean): void;

  /** 点击协议 */
  (e: 'success'): void;
}

const emit = defineEmits<Emits>();

const modalVisible = computed({
  get() {
    return props.visible;
  },
  set(visible) {
    emit('update:visible', visible);
  }
});
const closeModal = () => {
  modalVisible.value = false;
};

const title = computed(() => {
  const titles: Record<ModalType, string> = {
    add: $t('common.add'),
    edit: $t('common.edit')
  };
  return titles[props.type];
});

const formRef = ref<HTMLElement & FormInst>();

type FormModel = Pick<any, 'email' | 'name' | 'phone_number' | 'remark' | 'userRoles' | 'status'> & {
  password: string;
  confirmPwd: string;
};

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = {
  name: createRequiredFormRule($t('common.pleaseCheckValue')),

  phone_number: formRules.phone,
  email: formRules.email,
  password: formRules.pwd,
  confirmPwd: getConfirmPwdRule(toRefs(formModel).password),
  remark: createRequiredFormRule($t('common.pleaseCheckValue')),
  status: createRequiredFormRule($t('common.userStatus')),
  userRoles: createRequiredFormRule($t('page.manage.user.form.userRole2'))
};

function createDefaultFormModel(): FormModel {
  return {
    name: '',
    phone_number: '',
    email: '',
    password: '',
    confirmPwd: '',
    userRoles: [],
    remark: '',
    status: ''
  };
}

function handleUpdateFormModel(model: Partial<FormModel>) {
  Object.assign(formModel, model);
}

function handleUpdateFormModelByModalType() {
  const handlers: Record<ModalType, () => void> = {
    add: () => {
      const defaultFormModel = createDefaultFormModel();
      handleUpdateFormModel(defaultFormModel);
    },
    edit: () => {
      if (props.editData) {
        handleUpdateFormModel(props.editData);
      }
    }
  };

  handlers[props.type]();
}

/** the enabled role options */
const roleOptions = ref<any[]>([]);

const userOptions = ref<any[]>([
  { label: $t('generate.normal'), value: 'N' },
  { label: $t('page.manage.user.status.freeze'), value: 'F' }
]);

async function getRoleOptions() {
  const { error, data } = await fetchGetAllRoles({ page: 1, page_size: 10 });
  if (!error) {
    const options = (data?.list || []).map(item => ({
      label: item.name,
      value: item.id
    }));
    roleOptions.value = [...options];
  }
}

async function handleSubmit() {
  await formRef.value?.validate();
  const params: any = { ...formModel };

  let data: any;
  if (props.type === 'add') {
    data = await addUser(params);
  } else if (props.type === 'edit') {
    delete params.password;
    data = await editUser(params);
  }
  if (!data.error) {
    // window.$message?.success(data.msg);
    emit('success');
  }
  closeModal();
}

watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      handleUpdateFormModelByModalType();
      getRoleOptions();
    }
  }
);
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" :title="title">
    <NForm ref="formRef" label-placement="left" :label-width="80" :model="formModel" :rules="rules">
      <NFormItem :span="12" :label="$t('page.manage.user.userEmail')" path="email">
        <input hidden placeholder="8888" autocomplete="off" type="text" />
        <NInput v-model:value="formModel.email" :disabled="props.type == 'edit'" />
      </NFormItem>

      <template v-if="type === 'add'">
        <NFormItem :span="12" :label="$t('page.manage.user.password')" path="password">
          <input hidden placeholder="8888" autocomplete="new-password" type="password" />
          <NInput v-model:value="formModel.password" type="password" autocomplete="new-password" />
        </NFormItem>
        <NFormItem :span="12" :label="$t('page.manage.user.confirmPwd')" path="confirmPwd">
          <NInput v-model:value="formModel.confirmPwd" autocomplete="new-password" type="password" />
        </NFormItem>
      </template>

      <NFormItem :span="12" :label="$t('page.manage.user.userName')" path="name">
        <NInput v-model:value="formModel.name" />
      </NFormItem>

      <NFormItem :span="12" :label="$t('page.manage.user.userPhone')" path="phone_number">
        <NInput v-model:value="formModel.phone_number" />
      </NFormItem>

      <NFormItem :label="$t('page.manage.user.userRole2')">
        <NSelect
          v-model:value="formModel.userRoles"
          multiple
          :options="roleOptions"
          :placeholder="$t('page.manage.user.form.userRole2')"
        ></NSelect>
      </NFormItem>

      <NFormItem v-if="type == 'edit'" :label="$t('page.manage.user.userStatus2')" path="status">
        <NSelect v-model:value="formModel.status" :options="userOptions" placeholder="请选择用户状态"></NSelect>
      </NFormItem>

      <NFormItem :span="24" :label="$t('common.remark')">
        <NInput v-model:value="formModel.remark" type="textarea" />
      </NFormItem>

      <NSpace class="w-full pt-16px" :size="24" justify="end">
        <NButton class="w-72px" @click="closeModal">{{ $t('common.cancel') }}</NButton>
        <NButton class="w-72px" type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>

<style scoped>
.custom-select-container {
  width: 300px !important;
  /* 只会影响该组件内的 NSelect 下拉宽度 */
}
</style>
