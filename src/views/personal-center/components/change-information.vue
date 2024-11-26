<!--
 * @Descripttion:
 * @version:
 * @Author: zhaoqi
 * @Date: 2024-03-17 13:31:30
 * @LastEditors: zhaoqi
 * @LastEditTime: 2024-03-20 17:13:33
-->
<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';
import type { FormItemRule, FormRules } from 'naive-ui';
import { useNaiveForm } from '@/hooks/common/form';
import { getConfirmPwdRule } from '@/utils/form/rule';
import { changeInformation, passwordModification } from '@/service/api/personal-center';
import { $t } from '@/locales';
import { encryptDataByRsa, generateRandomHexString, validPasswordByExp } from '@/utils/common/tool';

export interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  type?: 'amend' | 'changePassword';
}

export type ModalType = NonNullable<Props['type']>;

defineOptions({ name: 'TableActionModal' });
const props = withDefaults(defineProps<Props>(), {
  type: 'amend',
  editData: null
});

interface Emits {
  (e: 'update:visible', visible: boolean): void;

  (e: 'modification', name: string): void;
}
const { formRef, validate } = useNaiveForm();
const emit = defineEmits<Emits>();

const modalVisible = computed({
  get() {
    return props.visible;
  },
  set(visible) {
    emit('update:visible', visible);
  }
});
const title = computed(() => {
  const titles: Record<ModalType, string> = {
    amend: '基本信息修改',
    changePassword: '密码修改'
  };
  return titles[props.type];
});
const estimate = computed(() => {
  const titles: Record<ModalType, string> = {
    amend: 'amend',
    changePassword: 'changePassword'
  };
  return titles[props.type];
});

/** 初始from数据 */
const formData = ref({
  name: '',
  old_password: '',
  password: '',
  passwords: ''
});
/** 关闭弹框 */
const closeModal = () => {
  modalVisible.value = false;
  formData.value.name = '';
};
/**
 * 修改姓名
 *
 * @param name
 */
const editName = async () => {
  await validate();
  const data = { name: formData.value.name };
  const res = await changeInformation(data);

  if (!res.error) {
    modalVisible.value = false;
    emit('modification', formData.value.name);
  }
};
/** passwordModification */
const password = async () => {
  await validate();
  const data = localStorage.getItem('enableZcAndYzm') ? JSON.parse(localStorage.getItem('enableZcAndYzm')) : [];
  let salt = null;
  let password1 = formData.value.password;
  if (data.find(v => v.name === 'frontend_res')?.enable_flag === 'enable') {
    salt = generateRandomHexString(16);
    password1 = encryptDataByRsa(password1 + salt);
    console.log('加密后密码：', password1);
  }
  const param = {
    old_password: formData.value.old_password,
    password: password1,
    salt
  };
  const res = await passwordModification(param);
  if (!res.error) {
    modalVisible.value = false;
    emit('modification');
  }
};

const validateUsername = (username: string) => {
  // 定义正则表达式
  const regex = /^[a-zA-Z0-9_]+$/; // 使用正则表达式测试用户名
  return regex.test(username);
};

function submit() {
  if (estimate.value === 'amend') {
    editName();
  } else {
    password();
  }
}
const rules: FormRules = {
  name: [
    {
      required: true,
      validator(rule: FormItemRule, value: string) {
        console.log(rule);
        if (!validateUsername(value)) {
          return new Error('用户名只允许字母、数字和下划线');
        }
        return true;
      },
      trigger: ['input', 'blur']
    }
  ],
  password: [
    {
      required: true,
      validator(rule: FormItemRule, value: string) {
        if (value.length < 8 || value.length > 18) {
          return Promise.reject(rule.message);
        }
        if (!validPasswordByExp(value)) {
          return Promise.reject(rule.message);
        }
        return Promise.resolve();
      },
      message: $t('form.pwd.tip'),
      trigger: ['input', 'blur']
    }
  ],
  passwords: getConfirmPwdRule(toRefs(formData.value).password)
};
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" :title="title" class="w-500px">
    <NForm ref="formRef" label-placement="left" :model="formData" :rules="rules">
      <NGrid :cols="2" :x-gap="18">
        <NFormItemGridItem v-if="estimate === 'amend'" :span="24" :label="$t('page.manage.user.userName')" path="name">
          <NInput v-model:value="formData.name" />
        </NFormItemGridItem>
        <NFormItemGridItem
          v-if="estimate === 'changePassword'"
          :span="24"
          label-width="100"
          type="password"
          show-password-on="mousedown"
          :label="$t('generate.old-password')"
          path="old_password"
        >
          <NInput v-model:value="formData.old_password" type="password" show-password-on="click" />
        </NFormItemGridItem>
        <NFormItemGridItem
          v-if="estimate === 'changePassword'"
          label-width="100"
          :span="24"
          :label="$t('generate.new-password')"
          path="password"
        >
          <NInput v-model:value="formData.password" type="password" show-password-on="click" />
        </NFormItemGridItem>
        <NFormItemGridItem
          v-if="estimate === 'changePassword'"
          :span="24"
          label-width="100"
          :label="$t('generate.repeat-new-password')"
          path="passwords"
        >
          <NInput v-model:value="formData.passwords" type="password" show-password-on="click" />
        </NFormItemGridItem>
      </NGrid>
      <NSpace class="w-full pt-16px" :size="24" justify="end">
        <NButton class="w-72px" @click="closeModal">{{ $t('generate.cancel') }}</NButton>
        <NButton class="w-72px" type="primary" @click="submit">{{ $t('common.save') }}</NButton>
      </NSpace>
    </NForm>
  </NModal>
</template>

<style scoped></style>
