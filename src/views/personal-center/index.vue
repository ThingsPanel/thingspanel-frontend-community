<!--
 * @Descripttion:
 * @version:
 * @Author: zhaoqi
 * @Date: 2024-03-17 09:14:38
 * @LastEditors: zhaoqi
 * @LastEditTime: 2024-03-20 17:23:40
-->
<script setup lang="ts">
import { onMounted, ref, toRefs } from 'vue'
import { NButton } from 'naive-ui'
import type { FormItemRule, FormRules } from 'naive-ui'
import { $t } from '@/locales'
import { localStg } from '@/utils/storage'
import { getConfirmPwdRule } from '@/utils/form/rule'
import { useNaiveForm } from '@/hooks/common/form'
import { changeInformation, fetchUserInfo, passwordModification } from '@/service/api/personal-center'
import {
  encryptDataByRsa,
  generateRandomHexString,
  getDemoServerUrl,
  validName,
  validPasswordByExp
} from '@/utils/common/tool'
import CameraBg from '@/assets/imgs/camera-bg.png'
import Camera from '@/assets/imgs/camera.png'

const url = ref(new URL(getDemoServerUrl()))
const { formRef, validate } = useNaiveForm()
const editType = ref(false)
const header = ref(false)
const headUrl = ref('')

const userInfoData = ref({
  additional_info: '',
  name: '',
  email: '',
  phone_num: ''
})
/** 初始from数据 */
const formData = ref({
  name: '',
  old_password: '',
  password: '',
  passwords: ''
})

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
}
const passRules: FormRules = {
  name: [
    {
      required: true,
      validator(rule: FormItemRule, value: string) {
        if (rule && !validName(value)) {
          return new Error($t('custom.personalCenter.nameFieldNotEmpty'))
        }
        return true
      },
      trigger: ['input', 'blur']
    }
  ],
  password: [
    {
      required: true,
      validator(rule: FormItemRule, value: string) {
        if (value.length < 8 || value.length > 18) {
          return Promise.reject(rule.message)
        }
        if (!validPasswordByExp(value)) {
          return Promise.reject(rule.message)
        }
        return Promise.resolve()
      },
      message: $t('form.pwd.tip'),
      trigger: ['input', 'blur']
    }
  ],
  passwords: getConfirmPwdRule(toRefs(formData.value).password)
}

function editName() {
  editType.value = true
  // openModal();
  // setModalType('amend');
}

/** 取消编辑模式 */
function closeEdit() {
  editType.value = false
}

// 移除标签页切换逻辑，新设计不再需要
/** 更新用户信息 */
async function updataUserInfo() {
  console.log('user', userInfoData.value)

  const { error } = await changeInformation(userInfoData.value)
  if (!error) {
    window.$message?.success($t('custom.grouping_details.operationSuccess'))
    closeEdit() // 成功后退出编辑模式
  }
}
/** 重置密码 */
const resetPass = async () => {
  formData.value.old_password = ''
  formData.value.passwords = ''
  formData.value.password = ''
}
/** 修改密码 */
const submitPass = async () => {
  await validate()
  const data = localStorage.getItem('enableZcAndYzm') ? JSON.parse(localStorage.getItem('enableZcAndYzm')) : []
  let salt: any = null
  let password1 = formData.value.password
  if (data.find(v => v.name === 'frontend_res')?.enable_flag === 'enable') {
    salt = generateRandomHexString(16)
    password1 = encryptDataByRsa(password1 + salt)
  }
  const param = {
    old_password: formData.value.old_password,
    password: password1,
    salt
  }
  const res = await passwordModification(param)
  if (!res.error) {
    window.$message?.success($t('custom.grouping_details.operationSuccess'))
  }
}

async function handleFinish({ event }: { event?: ProgressEvent }) {
  const response = JSON.parse((event?.target as XMLHttpRequest).response)
  // 字符串转成对象
  const obj = JSON.parse(userInfoData.value.additional_info)
  obj.user_icon = response.data.path
  const info = JSON.stringify(obj)
  userInfoData.value.additional_info = info
  const { error } = await changeInformation(userInfoData.value)
  if (!error) {
    headUrl.value = String(url.value.origin) + response.data.path.substring(1, obj.user_icon.length)
    window.$message?.success($t('custom.grouping_details.operationSuccess'))
  }
}
onMounted(async () => {
  const { data } = await fetchUserInfo()
  userInfoData.value = data
  if (userInfoData.value.additional_info === '{}') {
    header.value = false
  } else {
    header.value = true
    const obj = JSON.parse(userInfoData.value.additional_info)
    headUrl.value = String(url.value.origin) + obj.user_icon.substring(1, obj.user_icon.length)
  }
})
</script>

<template>
  <div>
    <n-card>
      <div class="flex-col justify-center items-center">
        <div>
          <n-upload
            :action="url + '/file/up'"
            :show-file-list="false"
            :headers="{
              'x-token': localStg.get('token') || ''
            }"
            :data="{
              type: 'user_icon'
            }"
            @on-finish="handleFinish"
          >
            <div class="relative w-100px h-100px">
              <div v-if="!header" class="avatar">
                {{ userInfoData.name.slice(0, 1).toUpperCase() }}
              </div>
              <n-avatar v-else class="w-100px h-100px" round :src="headUrl" />
              <div
                class="absolute bottom-0 right-0 w-32px h-32px bg-#6366f1 rounded-50% z-9999 flex justify-center items-center"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                  <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"></path>
                </svg>
              </div>
            </div>
          </n-upload>
        </div>
        <div class="text-24px text-#1a1a1a font-600 mb-8px dark:text-#E0E0E0">{{ userInfoData.name }}</div>
        <div>
          <!--        扩展说明：去国际化文件src/locales/langs/en-us/generate.ts  src/locales/langs/zh-cn/generate.ts 增加对应角色的key即可-->
          {{ userInfoData.authority && $t(`generate.${userInfoData.authority}`) }}
        </div>
      </div>
      <n-divider />
      <!-- 基本信息 -->
      <div>
        <div>
          <div class="flex justify-between mb-20px">
            <div class="flex text-16px font-600 mb-20px items-center gap-6px">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
                ></path>
              </svg>
              <div>
                {{ $t('generate.baseInfo') }}
              </div>
            </div>
            <NButton :title="$t('common.edit')" size="small" @click="editName()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path
                  d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
                ></path>
              </svg>
            </NButton>
          </div>
          <div class="mt--4">
            <!-- 显示模式 -->
            <div v-if="!editType" class="mb-32px">
              <div class="flex justify-start">
                <div class="w-120px text-14px text-#666 dark:text-gray-600">{{ $t('generate.last-name') }}</div>

                <div>{{ userInfoData.name }}</div>
              </div>
              <n-divider style="margin: 12px 0" />
              <div class="flex justify-start">
                <div class="w-120px text-14px text-#666 dark:text-gray-600">{{ $t('generate.account-type') }}</div>
                <div>
                  {{ $t(`generate.${userInfoData.authority}`) }}
                </div>
              </div>
              <n-divider style="margin: 12px 0" />
              <div class="flex justify-start">
                <div class="w-120px text-14px text-#666 dark:text-gray-600">{{ $t('generate.email-address') }}</div>

                <div>{{ userInfoData.email }}</div>
              </div>
              <n-divider style="margin: 12px 0" />
              <div class="flex justify-start">
                <div class="w-120px text-14px text-#666 dark:text-gray-600">{{ $t('generate.phoneNumber') }}</div>

                <div>{{ userInfoData.phone_num }}</div>
              </div>
              <n-divider style="margin: 12px 0" />
            </div>

            <!-- 编辑模式 -->
            <div v-if="editType" class="mb-32px">
              <NForm
                class="bg-#f8fafc p-18px pb-0 dark:bg-[#1E293B]"
                label-placement="left"
                label-align="left"
                label-width="120px"
                :rules="rules"
                :model="userInfoData"
              >
                <NFormItem path="name" :label="$t('generate.last-name')">
                  <NInput v-model:value="userInfoData.name" :placeholder="$t('page.login.common.codePlaceholder')" />
                </NFormItem>

                <NFormItem path="phone_num" :label="$t('generate.phoneNumber')">
                  <NInput
                    v-model:value="userInfoData.phone_num"
                    :placeholder="$t('page.login.common.codePlaceholder')"
                  />
                </NFormItem>

                <NFormItem path="email" :label="$t('generate.email-address')">
                  <NInput v-model:value="userInfoData.email" :placeholder="$t('page.login.common.codePlaceholder')" />
                </NFormItem>
              </NForm>
              <n-divider style="margin: 12px 0" />
              <div class="flex gap-4">
                <NButton type="primary" @click="updataUserInfo">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"></path>
                  </svg>
                  <span class="ml-2">
                    {{ $t('common.confirm') }}
                  </span>
                </NButton>
                <NButton @click="closeEdit">
                  {{ $t('common.cancel') }}
                </NButton>
              </div>
            </div>
          </div>
        </div>

        <!-- 密码修改 -->
        <div>
          <div class="flex text-16px font-600 mb-20px items-center gap-6px">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
              ></path>
            </svg>
            <div>
              {{ $t('generate.secureSet') }}
            </div>
          </div>

          <div class="bg-#f8fafc p-20px dark:bg-[#1E293B]">
            <NForm ref="formRef" label-placement="top" :model="formData" :rules="passRules">
              <NFormItem :label="$t('generate.old-password')" path="old_password">
                <NInput
                  v-model:value="formData.old_password"
                  type="password"
                  show-password-on="click"
                  :placeholder="$t('generate.old-password')"
                />
              </NFormItem>

              <NFormItem :label="$t('generate.new-password')" path="password">
                <NInput
                  v-model:value="formData.password"
                  type="password"
                  show-password-on="click"
                  :placeholder="$t('generate.new-password')"
                />
              </NFormItem>

              <NFormItem :label="$t('generate.repeat-new-password')" path="passwords">
                <NInput
                  v-model:value="formData.passwords"
                  type="password"
                  show-password-on="click"
                  :placeholder="$t('generate.repeat-new-password')"
                />
              </NFormItem>

              <div class="flex gap-4">
                <NButton type="primary" @click="submitPass">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path
                      d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"
                    ></path>
                  </svg>
                  <span class="ml-8px">{{ $t('common.save') }}</span>
                </NButton>
                <NButton @click="resetPass">
                  {{ $t('generate.reset') }}
                </NButton>
              </div>
            </NForm>
          </div>
        </div>
      </div>
    </n-card>
  </div>
</template>

<style scoped>
.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: #fff;
  font-weight: 500;
}
</style>
