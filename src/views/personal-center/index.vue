<!--
 * @Descripttion:
 * @version:
 * @Author: zhaoqi
 * @Date: 2024-03-17 09:14:38
 * @LastEditors: zhaoqi
 * @LastEditTime: 2024-03-20 17:23:40
-->
<script setup lang="tsx">
import { onMounted, ref, toRefs } from 'vue';
import { NButton } from 'naive-ui';
import type { FormItemRule, FormRules } from 'naive-ui';
// import { useAuthStore } from '@/store/modules/auth';
import { $t } from '@/locales';
import { getConfirmPwdRule } from '@/utils/form/rule';
// import ChangeInformation from './components/change-information.vue';
import { useNaiveForm } from '@/hooks/common/form';
import { changeInformation, fetchUserInfo, passwordModification } from '@/service/api/personal-center';
import { encryptDataByRsa, generateRandomHexString, validName, validPasswordByExp } from '@/utils/common/tool';
import Camera from '@/assets/imgs/camera.png';
import CameraBg from '@/assets/imgs/camera-bg.png';

// const authStore = useAuthStore();
const { formRef, validate } = useNaiveForm();
// const message = useMessage();

const currentIndex = ref(0);
const editType = ref(false);
const header = ref(false);

const userInfoData = ref({
  name: '',
  email: '',
  phone_num: ''
});
/** 初始from数据 */
const formData = ref({
  name: '',
  old_password: '',
  password: '',
  passwords: ''
});

const rules: FormRules = {
  email: {
    required: true,
    trigger: ['blur', 'input'],
    message: $t('custom.groupPage.selectParentGroup')
  },
  name: {
    required: true,
    trigger: ['blur', 'input'],
    message: $t('custom.groupPage.enterGroupName')
  },
  phone: {
    required: true,
    trigger: ['blur', 'input'],
    message: $t('custom.groupPage.enterGroupName')
  }
};
const passRules: FormRules = {
  name: [
    {
      required: true,
      validator(rule: FormItemRule, value: string) {
        if (rule && !validName(value)) {
          return new Error($t('custom.personalCenter.nameFieldNotEmpty'));
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

function editName() {
  editType.value = true;
  // openModal();
  // setModalType('amend');
}

/** 取消编辑模式 */
function closeEdit() {
  editType.value = false;
}

function changeBtnType(btn: any) {
  currentIndex.value = btn;
}
/** 更新用户信息 */
async function updataUserInfo() {
  console.log('user', userInfoData.value);

  const { error } = await changeInformation(userInfoData.value);
  if (!error) {
    window.$message?.success($t('custom.grouping_details.operationSuccess'));
  }
}
/** 重置密码 */
const resetPass = async () => {
  formData.value.old_password = '';
  formData.value.passwords = '';
  formData.value.password = '';
};
/** 修改密码 */
const submitPass = async () => {
  await validate();
  const data = localStorage.getItem('enableZcAndYzm') ? JSON.parse(localStorage.getItem('enableZcAndYzm')) : [];
  let salt: any = null;
  let password1 = formData.value.password;
  if (data.find(v => v.name === 'frontend_res')?.enable_flag === 'enable') {
    salt = generateRandomHexString(16);
    password1 = encryptDataByRsa(password1 + salt);
  }
  const param = {
    old_password: formData.value.old_password,
    password: password1,
    salt
  };
  const res = await passwordModification(param);
  if (!res.error) {
    window.$message?.success($t('custom.grouping_details.operationSuccess'));
  }
};

// 校验登录密码是否合规，不合规则弹窗修改密码
// if (route.value.query.password && route.value.query.password === 'invalid') {
//   changePassword();
// }
// function modification(e) {
//   if (e) {
//     useAuthStore();
//     authStore.userInfo.name = e;
//     message.success($t('common.modifySuccess'));
//   } else {
//     message.error($t('common.modifyFail'));
//   }
// }

onMounted(async () => {
  console.log('-----dds');
  const { data } = await fetchUserInfo();
  userInfoData.value = data;
  console.log('res----', userInfoData.value.name);
});
</script>

<template>
  <div class="overflow-hidden">
    <div style="display: flex; margin-top: 30px; margin-bottom: 15px">
      <n-upload
        style="width: 100px"
        action="https://www.mocky.io/v2/5e4bafc63100007100d8b70f"
        :headers="{
          'naive-info': 'hello!'
        }"
        :data="{
          'naive-data': 'cool! naive!'
        }"
      >
        <div style="">
          <SvgIcon v-if="!header" local-icon="avatar" style="width: 80px; height: 80px" />
          <n-avatar
            v-else
            style="width: 80px; height: 80px"
            round
            size="small"
            src="https://07akioni.oss-cn-beijing.aliyuncs.com/07akioni.jpeg"
          />
          <div style="display: flex; width: 30px; height: 30px; margin-left: 50px; margin-top: -25px; z-index: 999">
            <img :src="CameraBg" style="width: 30px; height: 30px" />
            <img
              :src="Camera"
              style="position: absolute; margin-left: 5px; margin-top: 5px; width: 20px; height: 20px"
            />
          </div>
        </div>
      </n-upload>

      <div style="display: flex; flex-direction: column; margin-left: 20px">
        <span style="font-size: 28px">个人空间</span>
        <span style="margin-top: 10px">{{ userInfoData.name }}</span>
      </div>
    </div>

    <NCard :bordered="false" class="h-full rounded-8px shadow-sm">
      <div class="basic-information">
        <div style="display: flex">
          <NButton
            :type="currentIndex === 0 ? 'primary' : 'default'"
            style="margin-right: 30px"
            round
            class="mt-5"
            @click="changeBtnType(0)"
          >
            基础信息
          </NButton>

          <NButton
            :type="currentIndex === 1 ? 'primary' : 'default'"
            style="margin-right: 400px"
            round
            class="mt-5"
            @click="changeBtnType(1)"
          >
            安全设置
          </NButton>

          <SvgIcon
            class="editor mt-8 cursor-pointer lg:text-[18px]"
            style="margin-left: auto"
            local-icon="PencilAlt"
            @click="editName()"
          />
        </div>

        <n-grid x-gap="9" :cols="3">
          <n-gi>
            <NCard class="i-flex-vertical" :bordered="false">
              <NSpace vertical>
                <NForm v-if="currentIndex === 0 && !editType" label-placement="left" :style="{ maxWidth: '640px' }">
                  <NFormItem :label="$t('generate.last-name')" path="inputValue">
                    <span>{{ userInfoData.name }}</span>
                  </NFormItem>
                  <NFormItem :label="$t('generate.account-type')" path="inputValue">
                    <span v-if="userInfoData.authority === 'SYS_ADMIN'">
                      {{ $t('generate.super-admin') }}
                    </span>
                    <span v-if="userInfoData.authority === 'TENANT_ADMIN'">
                      {{ $t('generate.tenant') }}
                    </span>
                  </NFormItem>
                  <NFormItem :label="$t('generate.email-address')" path="inputValue">
                    <span>{{ userInfoData.email }}</span>
                  </NFormItem>
                  <NFormItem :label="$t('generate.phoneNumber')" path="inputValue">
                    <span>{{ userInfoData.phone_num }}</span>
                  </NFormItem>
                </NForm>

                <NForm
                  v-if="currentIndex === 0 && editType"
                  label-placement="left"
                  :rules="rules"
                  :style="{ maxWidth: '440px' }"
                >
                  <NFormItem :label="$t('generate.last-name')" path="name">
                    <NInput
                      v-model:value="userInfoData.name"
                      :placeholder="$t('page.login.common.codePlaceholder')"
                      round
                    />
                  </NFormItem>
                  <NFormItem :label="$t('generate.email-address')" path="email">
                    <NInput
                      v-model:value="userInfoData.email"
                      :placeholder="$t('page.login.common.codePlaceholder')"
                      round
                    />
                  </NFormItem>
                  <NFormItem :label="$t('generate.phoneNumber')" path="phone_num">
                    <NInput
                      v-model:value="userInfoData.phone_num"
                      :placeholder="$t('page.login.common.codePlaceholder')"
                      round
                    />
                  </NFormItem>

                  <NFormItem path="">
                    <NButton
                      style="width: 100px; margin-right: 50px"
                      type="default"
                      size="large"
                      round
                      @click="closeEdit"
                    >
                      {{ $t('common.cancel') }}
                    </NButton>
                    <NButton style="width: 100px" type="primary" size="large" round @click="updataUserInfo">
                      {{ $t('common.confirm') }}
                    </NButton>
                  </NFormItem>
                </NForm>

                <NForm
                  v-if="currentIndex === 1"
                  ref="formRef"
                  label-placement="left"
                  :model="formData"
                  :rules="passRules"
                >
                  <NGrid :cols="2" :x-gap="18">
                    <NFormItemGridItem
                      :span="24"
                      label-width="100"
                      type="password"
                      show-password-on="mousedown"
                      :label="$t('generate.old-password')"
                      path="old_password"
                    >
                      <NInput v-model:value="formData.old_password" type="password" show-password-on="click" round />
                    </NFormItemGridItem>
                    <NFormItemGridItem
                      label-width="100"
                      :span="24"
                      :label="$t('generate.new-password')"
                      path="password"
                    >
                      <NInput v-model:value="formData.password" type="password" show-password-on="click" round />
                    </NFormItemGridItem>
                    <NFormItemGridItem
                      :span="24"
                      label-width="100"
                      :label="$t('generate.repeat-new-password')"
                      path="passwords"
                    >
                      <NInput v-model:value="formData.passwords" type="password" show-password-on="click" round />
                    </NFormItemGridItem>
                  </NGrid>
                  <NSpace class="w-full pt-16px" :size="24" justify="end">
                    <NButton class="w-72px" round @click="resetPass">{{ $t('generate.reset') }}</NButton>
                    <NButton class="w-72px" type="primary" round @click="submitPass">{{ $t('common.save') }}</NButton>
                  </NSpace>
                </NForm>
              </NSpace>
            </NCard>
          </n-gi>
          <!--
 <n-gi>
              <SvgIcon class="editor mt-8 cursor-pointer lg:text-[18px]" local-icon="PencilAlt" @click="editName()" />
            </n-gi>
            <n-gi>
              <NButton class="mt-5" @click="changePassword">{{ $t('generate.change-password') }}</NButton>
            </n-gi> 
-->
        </n-grid>
      </div>
      <!-- <ChangeInformation v-model:visible="visible" :type="modalType" @modification="modification" /> -->
    </NCard>
  </div>
</template>

<style scoped>
.ref {
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
</style>
