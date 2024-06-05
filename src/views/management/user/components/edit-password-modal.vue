<script setup lang="ts">
import { computed, reactive, ref, toRefs, watch } from 'vue';
import type { FormInst, FormItemRule } from 'naive-ui';
import { editUser } from '@/service/api/auth';
import { formRules, getConfirmPwdRule } from '@/utils/form/rule';
import { $t } from '@/locales';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 编辑的表格行数据 */
  editData?: UserManagement.User | null;
}

defineOptions({ name: 'EditPasswordModal' });

const props = withDefaults(defineProps<Props>(), {
  editData: null
});

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

const formRef = ref<HTMLElement & FormInst>();

type FormModel = Pick<UserManagement.User, 'email'> & {
  password: string;
  confirmPwd: string;
};

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = {
  email: formRules.email,
  password: formRules.pwd,
  confirmPwd: getConfirmPwdRule(toRefs(formModel).password)
};

function createDefaultFormModel(): FormModel {
  return {
    email: '',
    password: '',
    confirmPwd: ''
  };
}

function handleUpdateFormModel(model: Partial<FormModel>) {
  Object.assign(formModel, model);
}

function handleUpdateFormModelByModalType() {
  if (props.editData) {
    handleUpdateFormModel(props.editData);
  }
}

async function handleSubmit() {
  await formRef.value?.validate();
  const data: any = await editUser(formModel);
  if (!data.error) {
    window.$message?.success(data.msg);
    emit('success');
    handleUpdateFormModel(createDefaultFormModel());
    closeModal();
  }
}

watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      handleUpdateFormModelByModalType();
    }
  }
);
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" :title="$t('page.login.resetPwd.title')" class="w-700px">
    <NForm ref="formRef" label-placement="left" :label-width="80" :model="formModel" :rules="rules">
      <NGrid :cols="24" :x-gap="18">
        <NFormItemGridItem :span="24" :label="$t('page.manage.user.userName')" path="email">
          <NInput v-model:value="formModel.email" readonly />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('page.manage.user.password')" path="password">
          <NInput v-model:value="formModel.password" type="password" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="$t('page.manage.user.confirmPwd')" path="confirmPwd">
          <NInput v-model:value="formModel.confirmPwd" type="password" />
        </NFormItemGridItem>
      </NGrid>
      <NSpace class="w-full pt-16px" :size="24" justify="end">
        <NButton class="w-72px" @click="closeModal">{{ $t('common.cancel') }}</NButton>
        <NButton class="w-72px" type="primary" @click="handleSubmit">{{ $t('common.confirm') }}</NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>

<style scoped></style>
