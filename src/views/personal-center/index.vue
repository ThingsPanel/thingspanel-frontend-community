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
import { $t } from '@/locales';
import { localStg } from '@/utils/storage';
import { getConfirmPwdRule } from '@/utils/form/rule';
import { useNaiveForm } from '@/hooks/common/form';
import { changeInformation, fetchUserInfo, passwordModification } from '@/service/api/personal-center';
import {
  encryptDataByRsa,
  generateRandomHexString,
  getDemoServerUrl,
  validName,
  validPasswordByExp
} from '@/utils/common/tool';
import Camera from '@/assets/imgs/camera.png';
import CameraBg from '@/assets/imgs/camera-bg.png';

const url = ref(new URL(getDemoServerUrl()));
const { formRef, validate } = useNaiveForm();
const editType = ref(false);
const header = ref(false);
const headUrl = ref('');
const userInfoData = ref({
  additional_info: '',
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

// 移除标签页切换逻辑，新设计不再需要
/** 更新用户信息 */
async function updataUserInfo() {
  console.log('user', userInfoData.value);

  const { error } = await changeInformation(userInfoData.value);
  if (!error) {
    window.$message?.success($t('custom.grouping_details.operationSuccess'));
    closeEdit(); // 成功后退出编辑模式
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

async function handleFinish({ event }: { event?: ProgressEvent }) {
  const response = JSON.parse((event?.target as XMLHttpRequest).response);
  // 字符串转成对象
  const obj = JSON.parse(userInfoData.value.additional_info);
  obj.user_icon = response.data.path;
  const info = JSON.stringify(obj);
  userInfoData.value.additional_info = info;
  const { error } = await changeInformation(userInfoData.value);
  if (!error) {
    headUrl.value = String(url.value.origin) + response.data.path.substring(1, obj.user_icon.length);
    window.$message?.success($t('custom.grouping_details.operationSuccess'));
  }
}
onMounted(async () => {
  const { data } = await fetchUserInfo();
  userInfoData.value = data;
  if (userInfoData.value.additional_info === '{}') {
    header.value = false;
  } else {
    header.value = true;
    const obj = JSON.parse(userInfoData.value.additional_info);
    headUrl.value = String(url.value.origin) + obj.user_icon.substring(1, obj.user_icon.length);
  }
});
</script>

<template>
  <div class="profile-container">
    <div class="profile-card">
      <!-- 头像区域 -->
      <div class="profile-header">
        <div class="avatar-container">
          <n-upload
            :action="url + '/file/up'"
            :show-file-list="false"
            :headers="{
              'x-token': localStg.get('token') || ''
            }"
            :data="{
              type: 'user_icon'
            }"
            @finish="handleFinish"
          >
            <div class="avatar">
              <SvgIcon v-if="!header" local-icon="avatar" class="avatar-icon" />
              <n-avatar v-else class="avatar-img" round :src="headUrl" />
            </div>
            <div class="avatar-upload">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
              </svg>
            </div>
          </n-upload>
        </div>
        <div class="profile-name">{{ userInfoData.name }}</div>
        <div class="profile-role">
          <span v-if="userInfoData.authority === 'SYS_ADMIN'">
            {{ $t('generate.sysAdmin') }}
          </span>
          <span v-else-if="userInfoData.authority === 'TENANT_ADMIN'">
            {{ $t('generate.tenantAdmin') }}
          </span>
          <span v-else>
            {{ $t('generate.tenantUser') }}
          </span>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="profile-form">
        <div class="form-section">
          <h3 class="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="section-icon">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
            {{ $t('generate.baseInfo') }}
            <button class="edit-btn" @click="editName()" :title="$t('common.edit')">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="edit-icon">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
          </h3>

          <!-- 显示模式 -->
          <div v-if="!editType">
            <div class="info-row">
              <div class="info-label">{{ $t('generate.last-name') }}</div>
              <div class="info-value">
                <span class="info-text">{{ userInfoData.name }}</span>
              </div>
            </div>

            <div class="info-row">
              <div class="info-label">{{ $t('generate.account-type') }}</div>
              <div class="info-value">
                <span class="info-text">
                  <span v-if="userInfoData.authority === 'SYS_ADMIN'">
                    {{ $t('generate.super-admin') }}
                  </span>
                  <span v-if="userInfoData.authority === 'TENANT_ADMIN'">
                    {{ $t('generate.tenant') }}
                  </span>
                </span>
              </div>
            </div>

            <div class="info-row">
              <div class="info-label">{{ $t('generate.email-address') }}</div>
              <div class="info-value">
                <span class="info-text">{{ userInfoData.email }}</span>
              </div>
            </div>

            <div class="info-row">
              <div class="info-label">{{ $t('generate.phoneNumber') }}</div>
              <div class="info-value">
                <span class="info-text">{{ userInfoData.phone_num }}</span>
              </div>
            </div>
          </div>

          <!-- 编辑模式 -->
          <div v-if="editType">
            <NForm
              label-placement="left"
              :rules="rules"
              :model="userInfoData"
            >
              <div class="info-row editing">
                <div class="info-label">{{ $t('generate.last-name') }}</div>
                <div class="info-value">
                  <NFormItem path="name" :show-label="false">
                    <NInput
                      v-model:value="userInfoData.name"
                      :placeholder="$t('page.login.common.codePlaceholder')"
                      class="info-input"
                    />
                  </NFormItem>
                </div>
              </div>

              <div class="info-row editing">
                <div class="info-label">{{ $t('generate.phoneNumber') }}</div>
                <div class="info-value">
                  <NFormItem path="phone_num" :show-label="false">
                    <NInput
                      v-model:value="userInfoData.phone_num"
                      type="tel"
                      :placeholder="$t('page.login.common.codePlaceholder')"
                      class="info-input"
                    />
                  </NFormItem>
                </div>
              </div>

              <div class="info-row editing">
                <div class="info-label">{{ $t('generate.email-address') }}</div>
                <div class="info-value">
                  <NFormItem path="email" :show-label="false">
                    <NInput
                      v-model:value="userInfoData.email"
                      type="email"
                      :placeholder="$t('page.login.common.codePlaceholder')"
                      class="info-input"
                    />
                  </NFormItem>
                </div>
              </div>
            </NForm>

            <div class="edit-actions">
              <NButton class="btn btn-primary" @click="updataUserInfo">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                </svg>
                {{ $t('common.confirm') }}
              </NButton>
              <NButton class="btn btn-secondary" @click="closeEdit">
                {{ $t('common.cancel') }}
              </NButton>
            </div>
          </div>
        </div>

        <!-- 密码修改 -->
        <div class="form-section">
          <h3 class="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" class="section-icon">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
            {{ $t('generate.secureSet') }}
          </h3>

          <div class="password-section">
            <NForm
              ref="formRef"
              label-placement="top"
              :model="formData"
              :rules="passRules"
            >
              <div class="form-group">
                <NFormItem :label="$t('generate.old-password')" path="old_password">
                  <NInput
                    v-model:value="formData.old_password"
                    type="password"
                    show-password-on="click"
                    class="form-input"
                    :placeholder="$t('generate.old-password')"
                  />
                </NFormItem>
              </div>

              <div class="form-group">
                <NFormItem :label="$t('generate.new-password')" path="password">
                  <NInput
                    v-model:value="formData.password"
                    type="password"
                    show-password-on="click"
                    class="form-input"
                    :placeholder="$t('generate.new-password')"
                  />
                </NFormItem>
              </div>

              <div class="form-group">
                <NFormItem :label="$t('generate.repeat-new-password')" path="passwords">
                  <NInput
                    v-model:value="formData.passwords"
                    type="password"
                    show-password-on="click"
                    class="form-input"
                    :placeholder="$t('generate.repeat-new-password')"
                  />
                </NFormItem>
              </div>

              <div class="btn-group">
                <NButton class="btn btn-primary" @click="submitPass">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="btn-icon">
                    <path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/>
                  </svg>
                  {{ $t('common.save') }}
                </NButton>
                <NButton class="btn btn-secondary" @click="resetPass">
                  {{ $t('generate.reset') }}
                </NButton>
              </div>
            </NForm>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  padding: 16px;

  min-height: 100vh;
}

.profile-card {

  border-radius: 4px;
  padding: 24px;

  margin: 0 auto;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.profile-header {
  text-align: center;
  padding-bottom: 32px;
  border-bottom: 1px solid #e5e7eb;
}

.avatar-container {
  position: relative;
  display: inline-block;
  margin-bottom: 16px;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}

.avatar-icon {
  width: 50px;
  height: 50px;
  color: #fff;
}

.avatar-img {
  width: 100px;
  height: 100px;
}

.avatar-upload {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 32px;
  height: 32px;
  background-color: #4874ff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 3px solid #fff;
  transition: all 0.3s;
}

.avatar-upload:hover {
  transform: scale(1.1);
  background-color: #4874ff;
}

.upload-icon {
  width: 16px;
  height: 16px;
  color: #fff;
}

.profile-name {
    font-size: 24px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 8px;
  }

.profile-role {
  color: #666;
  font-size: 14px;
  margin-bottom: 16px;
}

.profile-form {
  padding-top: 32px;
}

.form-section {
  margin-bottom: 32px;
}

.form-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.section-icon {
  width: 20px;
  height: 20px;
}

.edit-btn {
  margin-left: auto;
  padding: 6px 12px;
  background-color: #f0f2f5;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;
  font-size: 13px;
  transition: all 0.2s;
}

.edit-btn:hover {
  background-color: #e6f0ff;
  color: #4874ff;
}

.edit-icon {
  width: 16px;
  height: 16px;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f7fa;
  min-height: 48px;
}

.info-row.editing {
  background-color: #fafbfc;
  margin: 0 -12px;
  padding: 12px;
  border-radius: 4px;
  align-items: flex-start;
}

.info-row.editing .n-form-item {
  margin-bottom: 0;
}

.info-row.editing .n-form-item .n-form-item-blank {
  min-height: auto;
}

.info-label {
  width: 120px;
  color: #666;
  font-size: 14px;
  flex-shrink: 0;
  line-height: 32px;
  padding-top: 4px;
}

.info-value {
  flex: 1;
  color: #1a1a1a;
  font-size: 14px;
}

.info-text {
  display: block;
}

.info-input {
  width: 100%;
}

.edit-actions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 12px;
  align-items: center;
}

.password-section {
  background-color: #f8fafc;
  border-radius: 4px;
  padding: 20px;
  margin-top: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-input {
  width: 100%;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background-color: #4874ff;
  color: #fff;
}

.btn-primary:hover {
  background-color: #4874ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(72, 116, 255, 0.3);
}

.btn-secondary {
  background-color: #fff;
  color: #666;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background-color: #f5f7fa;
  border-color: #d1d5db;
}

.btn-group {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.btn-icon {
  width: 16px;
  height: 16px;
}

/* 响应式 */
@media (max-width: 768px) {
  .profile-container {
    padding: 16px;
  }

  .profile-card {
    padding: 16px;
  }

  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .info-label {
    width: auto;
    font-weight: 500;
  }
}
</style>
