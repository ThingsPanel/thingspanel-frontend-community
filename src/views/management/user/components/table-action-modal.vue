<script setup lang="ts">
import { computed, reactive, ref, toRefs, watch } from 'vue';
import type { FormInst, FormItemRule } from 'naive-ui';
// import { genderOptions } from '@/constants'
import { addUser, editUser } from '@/service/api/auth';
import { createRequiredFormRule, formRules, getConfirmPwdRule } from '@/utils/form/rule';
import { userStatusOptions } from '@/constants/business';
import { $t } from '@/locales';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit';
  /** 编辑的表格行数据 */
  editData?: UserManagement.User | null;
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'TableActionModal' });

const props = withDefaults(defineProps<Props>(), {
  type: 'add',
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

const customUserStatusOptions = computed(() => {
  return userStatusOptions.map(item => {
    const key = item.value === 'N' ? 'page.manage.user.status.normal' : 'page.manage.user.status.freeze';
    return {
      label: $t(key),
      value: item.value
    };
  });
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

type FormModel = Pick<UserManagement.User, 'email' | 'name' | 'phone_number' | 'gender' | 'remark' | 'status'> & {
  password: string;
  confirmPwd: string;
};

const formModel = reactive<FormModel>(createDefaultFormModel());

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = {
  name: createRequiredFormRule($t('common.pleaseCheckValue')),
  gender: createRequiredFormRule($t('common.pleaseCheckValue')),
  phone_number: formRules.phone,
  email: formRules.email,
  password: formRules.pwd,
  confirmPwd: getConfirmPwdRule(toRefs(formModel).password),
  status: getConfirmPwdRule(toRefs(formModel).password),
  remark: createRequiredFormRule($t('common.pleaseCheckValue'))
};

function createDefaultFormModel(): FormModel {
  return {
    name: '',
    gender: null,
    phone_number: '',
    email: '',
    password: '',
    confirmPwd: '',
    remark: '',
    status: 'N'
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

async function handleSubmit() {
  await formRef.value?.validate();
  let data: any;
  if (props.type === 'add') {
    data = await addUser(formModel);
  } else if (props.type === 'edit') {
    data = await editUser(formModel);
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
    }
  }
);
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" :title="title" class="w-700px">
    <NForm ref="formRef" label-placement="left" :label-width="80" :model="formModel" :rules="rules">
      <NGrid :cols="24" :x-gap="18">
        <NFormItemGridItem :span="12" :label="$t('page.manage.user.userName')" path="name">
          <NInput v-model:value="formModel.name" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="12" :label="$t('page.manage.user.userEmail')" path="email">
          <NInput v-model:value="formModel.email" :disabled="type === 'edit'" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="12" :label="$t('page.manage.user.userPhone')" path="phone_number">
          <NInput v-model:value="formModel.phone_number" />
        </NFormItemGridItem>

        <template v-if="type === 'add'">
          <NFormItemGridItem :span="12" :label="$t('page.manage.user.password')" path="password">
            <NInput v-model:value="formModel.password" type="password" />
          </NFormItemGridItem>
          <NFormItemGridItem :span="12" :label="$t('page.manage.user.confirmPwd')" path="confirmPwd">
            <NInput v-model:value="formModel.confirmPwd" type="password" />
          </NFormItemGridItem>
        </template>
        <n-form-item-grid-item v-else :span="12" :label="$t('page.manage.user.accountStatus')">
          <n-radio-group v-model:value="formModel.status">
            <n-radio v-for="item in customUserStatusOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </n-radio>
          </n-radio-group>
        </n-form-item-grid-item>
        <NFormItemGridItem :span="24" :label="$t('common.remark')">
          <NInput v-model:value="formModel.remark" type="textarea" />
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
