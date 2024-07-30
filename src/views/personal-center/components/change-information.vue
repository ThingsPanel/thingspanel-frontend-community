<!--
 * @Descripttion:
 * @version:
 * @Author: zhaoqi
 * @Date: 2024-03-17 13:31:30
 * @LastEditors: zhaoqi
 * @LastEditTime: 2024-03-20 17:13:33
-->
<script setup lang="ts">
import { computed, ref } from 'vue';
import type { FormItemRule, FormRules } from 'naive-ui';
import { useMessage } from 'naive-ui';
import { changeInformation, passwordModification } from '@/service/api/personal-center';
import { $t } from '@/locales';
import { encryptDataByRsa, validPassword } from '@/utils/common/tool';
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

  (e: 'modification'): void;
}

const emit = defineEmits<Emits>();
const message = useMessage();
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
/** 关闭弹框 */
const closeModal = () => {
  modalVisible.value = false;
};
/** 初始from数据 */
const formData = ref({
  name: '',
  old_password: '',
  password: '',
  passwords: ''
});
/**
 * 修改姓名
 *
 * @param name
 */
const editName = async () => {
  const data = { name: formData.value.name };
  const res = await changeInformation(data);

  if (!res.error) {
    modalVisible.value = false;
    emit('modification');
  }
};
/** passwordModification */
const password = async () => {
  if (import.meta.env.VITE_ENCRYPT_PASSWORD === '1') {
    console.log('加密后密码：', encryptDataByRsa(formData.value.password));
    formData.value.password = encryptDataByRsa(formData.value.password);
  }
  const data = {
    old_password: formData.value.old_password,
    password: formData.value.password
  };
  const res = await passwordModification(data);
  if (!res.error) {
    modalVisible.value = false;
    emit('modification');
  }
};

function submit() {
  if (estimate.value === 'amend') {
    editName();
  } else if (formData.value.password !== formData.value.passwords) {
    message.warning('两次密码输入不一致');
  } else {
    password();
  }
}
const rules: FormRules = {
  password: [
    {
      required: true,
      validator(rule: FormItemRule, value: string) {
        console.log(rule);
        if (!validPassword(value)) {
          return new Error('密码长度8位，包含大小写字母、数字和特殊字');
        }
        return true;
      },
      trigger: ['input', 'blur']
    }
  ],
  passwords: [
    {
      required: true,
      validator(rule: FormItemRule, value: string) {
        console.log(rule);
        if (!validPassword(value)) {
          return new Error('密码长度8位，包含大小写字母、数字和特殊字');
        }
        return true;
      },
      trigger: ['input', 'blur']
    }
  ]
};
</script>

<template>
  <NModal v-model:show="modalVisible" preset="card" :title="title" class="w-500px">
    <NForm label-placement="left" :model="formData" :rules="rules">
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
