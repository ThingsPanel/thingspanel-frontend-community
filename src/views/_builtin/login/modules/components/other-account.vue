<script lang="ts" setup>
import { userRoleLabels } from '@/constants/business';
import { $t } from '@/locales';

interface Emits {
  (e: 'login', param: { userName: string; password: string }): void;
}

const emit = defineEmits<Emits>();

interface Account {
  key: Api.Auth.RoleType;
  label: string;
  userName: string;
  password: string;
}

const accounts: Account[] = [
  {
    key: 'SYS_ADMIN',
    label: userRoleLabels.SYS_ADMIN,
    userName: 'super@super.cn',
    password: '123456'
  },
  {
    key: 'TENANT_ADMIN',
    label: userRoleLabels.TENANT_ADMIN,
    userName: 'hezhuo@hezhuo.cn',
    password: '123456'
  },
  {
    key: 'TENANT_USER',
    label: userRoleLabels.TENANT_USER,
    userName: 'User01',
    password: 'user01123'
  }
];

function login(userName: string, password: string) {
  emit('login', { userName, password });
}
</script>

<template>
  <NSpace :vertical="true">
    <NDivider class="text-14px text-#666 !mb-0">{{ $t('page.login.pwdLogin.otherAccountLogin') }}</NDivider>
    <NSpace justify="center">
      <NButton
        v-for="item in accounts"
        :key="item.userName"
        type="primary"
        @click="login(item.userName, item.password)"
      >
        {{ item.label }}
      </NButton>
    </NSpace>
  </NSpace>
</template>

<style scoped></style>
