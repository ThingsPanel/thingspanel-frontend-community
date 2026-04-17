<!--
 * @Descripttion:
 * @version:
 * @Author: zhaoqi
 * @Date: 2024-03-17 09:14:38
 * @LastEditors: zhaoqi
 * @LastEditTime: 2024-03-20 17:23:40
-->
<script setup lang="ts">
import { computed, onMounted, ref, toRefs, watch } from 'vue'
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
import { createProxyPattern } from '~/env.config'
import ProvinceCityDistrictSelector from '@/components/common/ProvinceCityDistrictSelector.vue'

// 开发环境使用代理路径，生产环境使用完整URL
const isHttpProxy = import.meta.env.VITE_HTTP_PROXY === 'Y'
const uploadUrl = isHttpProxy ? createProxyPattern() : getDemoServerUrl()
const url = ref(uploadUrl)
const { formRef, validate } = useNaiveForm()
const editType = ref(false)
const header = ref(false)
const headUrl = ref('')

// 时区选项
const timezoneOptions = [
  { label: 'Asia/Shanghai (北京时间)', value: 'Asia/Shanghai' },
  { label: 'Asia/Tokyo (东京时间)', value: 'Asia/Tokyo' },
  { label: 'Asia/Seoul (首尔时间)', value: 'Asia/Seoul' },
  { label: 'Asia/Singapore (新加坡时间)', value: 'Asia/Singapore' },
  { label: 'Asia/Hong_Kong (香港时间)', value: 'Asia/Hong_Kong' },
  { label: 'Asia/Bangkok (曼谷时间)', value: 'Asia/Bangkok' },
  { label: 'Asia/Dubai (迪拜时间)', value: 'Asia/Dubai' },
  { label: 'Asia/Kolkata (印度时间)', value: 'Asia/Kolkata' },
  { label: 'Europe/London (伦敦时间)', value: 'Europe/London' },
  { label: 'Europe/Paris (巴黎时间)', value: 'Europe/Paris' },
  { label: 'Europe/Berlin (柏林时间)', value: 'Europe/Berlin' },
  { label: 'Europe/Moscow (莫斯科时间)', value: 'Europe/Moscow' },
  { label: 'America/New_York (纽约时间)', value: 'America/New_York' },
  { label: 'America/Los_Angeles (洛杉矶时间)', value: 'America/Los_Angeles' },
  { label: 'America/Chicago (芝加哥时间)', value: 'America/Chicago' },
  { label: 'America/Toronto (多伦多时间)', value: 'America/Toronto' },
  { label: 'Australia/Sydney (悉尼时间)', value: 'Australia/Sydney' },
  { label: 'Australia/Melbourne (墨尔本时间)', value: 'Australia/Melbourne' },
  { label: 'Pacific/Auckland (奥克兰时间)', value: 'Pacific/Auckland' },
  { label: 'UTC (协调世界时)', value: 'UTC' }
]

// 语言选项
const languageOptions = [
  { label: '中文', value: 'zh-CN' },
  { label: 'English', value: 'en-US' }
]

// 国家区号选项
const countryCodeOptions = [
  { label: '+86', value: '+86' },
  { label: '+1', value: '+1' },
  { label: '+44', value: '+44' },
  { label: '+33', value: '+33' },
  { label: '+49', value: '+49' },
  { label: '+39', value: '+39' },
  { label: '+34', value: '+34' },
  { label: '+7', value: '+7' },
  { label: '+81', value: '+81' },
  { label: '+82', value: '+82' },
  { label: '+65', value: '+65' },
  { label: '+60', value: '+60' },
  { label: '+66', value: '+66' },
  { label: '+84', value: '+84' },
  { label: '+62', value: '+62' },
  { label: '+63', value: '+63' },
  { label: '+91', value: '+91' },
  { label: '+61', value: '+61' },
  { label: '+64', value: '+64' },
  { label: '+55', value: '+55' },
  { label: '+52', value: '+52' },
  { label: '+54', value: '+54' },
  { label: '+27', value: '+27' },
  { label: '+20', value: '+20' },
  { label: '+971', value: '+971' },
  { label: '+966', value: '+966' },
  { label: '+90', value: '+90' },
  { label: '+31', value: '+31' },
  { label: '+46', value: '+46' },
  { label: '+47', value: '+47' },
  { label: '+45', value: '+45' },
  { label: '+41', value: '+41' },
  { label: '+43', value: '+43' },
  { label: '+32', value: '+32' },
  { label: '+351', value: '+351' },
  { label: '+30', value: '+30' },
  { label: '+48', value: '+48' },
  { label: '+420', value: '+420' },
  { label: '+36', value: '+36' },
  { label: '+385', value: '+385' },
  { label: '+852', value: '+852' },
  { label: '+853', value: '+853' },
  { label: '+886', value: '+886' }
]

// 处理省市区选择变化
const handleAddressChange = (value: { province: string; city: string; district: string }) => {
  userInfoData.value.address.province = value.province
  userInfoData.value.address.city = value.city
  userInfoData.value.address.district = value.district
}

const userInfoData = ref({
  additional_info: '',
  name: '',
  email: '',
  phone_number: '', // 完整手机号
  country_code: '+86',
  phone_only: '',
  authority: '',
  organization: '', // 组织
  timezone: '', // 时区
  default_language: '', // 默认语言
  avatar_url: '', // 头像
  address: {
    province: '', // 省份
    city: '', // 城市
    district: '', // 区县
    detailed_address: '' // 详细地址
  }
})

const parsePhoneNumber = (phoneNumber: string) => {
  if (!phoneNumber) return { country_code: '+86', phone_only: '' }
  const cleanPhone = phoneNumber.replace(/[^\d+]/g, '')
  const sortedCountryCodes = countryCodeOptions.map(option => option.value).sort((a, b) => b.length - a.length)
  for (const code of sortedCountryCodes) {
    if (cleanPhone.startsWith(code)) {
      return {
        country_code: code,
        phone_only: cleanPhone.substring(code.length)
      }
    }
  }
  return {
    country_code: '+86',
    phone_only: cleanPhone
  }
}

const fullPhoneNumber = computed(() => `${userInfoData.value.country_code}${userInfoData.value.phone_only}`)
const displayPhoneNumber = computed(() => {
  const code = userInfoData.value.country_code?.trim()
  const phone = userInfoData.value.phone_only?.trim()
  if (code && phone) {
    return `${code} ${phone}`
  }
  return userInfoData.value.phone_number || ''
})

watch(
  () => [userInfoData.value.country_code, userInfoData.value.phone_only],
  () => {
    userInfoData.value.phone_number = fullPhoneNumber.value
  },
  { immediate: true }
)

const getSubmitUserInfoData = () => {
  const { country_code, phone_only, ...rest } = userInfoData.value
  return {
    ...rest,
    phone_number: fullPhoneNumber.value
  }
}
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
    message: $t('generate.email-address')
  },
  name: {
    required: true,
    trigger: ['blur', 'input'],
    message: $t('generate.last-name')
  },
  phone_number: {
    required: true,
    trigger: ['blur', 'input'],
    message: $t('generate.phoneNumber')
  },
  organization: {
    required: false,
    trigger: ['blur', 'input'],
    message: $t('page.manage.user.form.organization')
  },
  timezone: {
    required: false,
    trigger: ['blur', 'change'],
    message: $t('page.manage.user.form.timezone')
  },
  default_language: {
    required: false,
    trigger: ['blur', 'change'],
    message: $t('page.manage.user.form.defaultLanguage')
  },
  'address.province': {
    required: false,
    trigger: ['blur', 'change'],
    message: $t('page.manage.user.form.address')
  },
  'address.detailed_address': {
    required: false,
    trigger: ['blur', 'input'],
    message: $t('page.manage.user.form.detailedAddress')
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
  if (process.env.NODE_ENV === 'development') {
  }

  const { error } = await changeInformation(getSubmitUserInfoData())
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
  const cacheStr = localStorage.getItem('enableZcAndYzm')
  const data = cacheStr ? JSON.parse(cacheStr) : []
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
  // 字符串转成对象，兼容两种字段名
  const additionalInfoStr = userInfoData.value.additional_info || '{}'
  const obj = JSON.parse(additionalInfoStr)
  obj.user_icon = response.data.path
  const info = JSON.stringify(obj)
  userInfoData.value.additional_info = info
  userInfoData.value.avatar_url = response.data.path

  // 调用用户信息更新接口,更新成功，刷新页面头像显示
  const { error } = await changeInformation(getSubmitUserInfoData())
  if (!error) {
    // 显示头像时使用服务器域名，去掉 /api/v1 路径
    const serverUrl = getDemoServerUrl().replace('/api/v1', '')
    headUrl.value = serverUrl + response.data.path.substring(1)
    // header.value = true

    // 重新获取最新的用户信息，确保本地数据与服务器数据保持同步
    const { data } = await fetchUserInfo()
    const basePhone = data.phone_num || data.phone_number || ''
    const { country_code, phone_only } = parsePhoneNumber(basePhone)
    userInfoData.value = {
      ...data,
      // 处理电话号码字段的兼容性映射
      phone_number: basePhone,
      country_code,
      phone_only,
      authority: data.authority || '',
      // 处理附加信息字段的兼容性映射
      additional_info: data.additional_info || data.additionalInfo || '{}',
      // 确保新增字段有默认值
      organization: data.organization || '',
      timezone: data.timezone || '',
      default_language: data.default_language || '',
      address: {
        province: data.address?.province || '',
        city: data.address?.city || '',
        district: data.address?.district || '',
        detailed_address: data.address?.detailed_address || ''
      }
    }

    window.$message?.success($t('custom.grouping_details.operationSuccess'))
  }
}

function handleUploadFinish(payload: { event?: ProgressEvent }) {
  void handleFinish(payload)
}
onMounted(async () => {
  const { data } = await fetchUserInfo()
  const basePhone = data.phone_num || data.phone_number || ''
  const { country_code, phone_only } = parsePhoneNumber(basePhone)
  userInfoData.value = {
    ...data,
    // 将 phone_num 映射为 phone_number
    phone_number: basePhone,
    country_code,
    phone_only,
    authority: data.authority || '',
    // 兼容 additional_info 和 additionalInfo 字段
    additional_info: data.additional_info || data.additionalInfo || '{}',
    // 确保新字段有默认值
    organization: data.organization || '',
    timezone: data.timezone || '',
    default_language: data.default_language || '',
    address: {
      province: data.address?.province || '',
      city: data.address?.city || '',
      district: data.address?.district || '',
      detailed_address: data.address?.detailed_address || ''
    }
  }

  // 兼容两种字段名的头像显示逻辑
  const additionalInfoStr = userInfoData.value.additional_info || '{}'
  if (additionalInfoStr === '{}' || !additionalInfoStr) {
    header.value = false
  } else {
    header.value = true
    try {
      const obj = JSON.parse(additionalInfoStr)
      if (obj.user_icon) {
        // 显示头像时使用服务器域名，去掉 /api/v1 路径
        const serverUrl = getDemoServerUrl().replace('/api/v1', '')
        headUrl.value = serverUrl + obj.user_icon.substring(1)
      }
    } catch (error) {
      console.error('解析用户头像信息失败:', error)
      header.value = false
    }
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
            @finish="handleUploadFinish"
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

                <div>{{ displayPhoneNumber }}</div>
              </div>
              <n-divider style="margin: 12px 0" />
              <div class="flex justify-start">
                <div class="w-120px text-14px text-#666 dark:text-gray-600">
                  {{ $t('page.manage.user.organization') }}
                </div>
                <div>{{ userInfoData.organization || $t('common.notSet') }}</div>
              </div>
              <n-divider style="margin: 12px 0" />
              <div class="flex justify-start">
                <div class="w-120px text-14px text-#666 dark:text-gray-600">{{ $t('page.manage.user.timezone') }}</div>
                <div>{{ userInfoData.timezone || $t('common.notSet') }}</div>
              </div>
              <n-divider style="margin: 12px 0" />
              <div class="flex justify-start">
                <div class="w-120px text-14px text-#666 dark:text-gray-600">
                  {{ $t('page.manage.user.defaultLanguage') }}
                </div>
                <div>{{ userInfoData.default_language || $t('common.notSet') }}</div>
              </div>
              <n-divider style="margin: 12px 0" />
              <div class="flex justify-start">
                <div class="w-120px text-14px text-#666 dark:text-gray-600">{{ $t('page.manage.user.address') }}</div>
                <div>
                  {{
                    [userInfoData.address.province, userInfoData.address.city, userInfoData.address.district]
                      .filter(Boolean)
                      .join(' / ') || $t('common.notSet')
                  }}
                </div>
              </div>
              <n-divider style="margin: 12px 0" />
              <div class="flex justify-start">
                <div class="w-120px text-14px text-#666 dark:text-gray-600">
                  {{ $t('page.manage.user.detailedAddress') }}
                </div>
                <div>{{ userInfoData.address.detailed_address || $t('common.notSet') }}</div>
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
                  <NInput v-model:value="userInfoData.name" placeholder="请输入姓名" />
                </NFormItem>

                <NFormItem path="phone_number" :label="$t('generate.phoneNumber')">
                  <div class="flex gap-2 w-full">
                    <NSelect
                      v-model:value="userInfoData.country_code"
                      class="w-24"
                      :options="countryCodeOptions"
                      :placeholder="'区号'"
                    />
                    <NInput v-model:value="userInfoData.phone_only" class="flex-1" placeholder="请输入手机号码" />
                  </div>
                </NFormItem>

                <NFormItem path="email" :label="$t('generate.email-address')">
                  <NInput v-model:value="userInfoData.email" placeholder="请输入邮箱地址" />
                </NFormItem>

                <NFormItem path="organization" :label="$t('page.manage.user.organization')">
                  <NInput
                    v-model:value="userInfoData.organization"
                    :placeholder="$t('page.manage.user.form.organization')"
                  />
                </NFormItem>

                <NFormItem path="timezone" :label="$t('page.manage.user.timezone')">
                  <NSelect
                    v-model:value="userInfoData.timezone"
                    :options="timezoneOptions"
                    :placeholder="$t('page.manage.user.form.timezone')"
                  />
                </NFormItem>

                <NFormItem path="default_language" :label="$t('page.manage.user.defaultLanguage')">
                  <NSelect
                    v-model:value="userInfoData.default_language"
                    :options="languageOptions"
                    :placeholder="$t('page.manage.user.form.defaultLanguage')"
                  />
                </NFormItem>

                <NFormItem path="address.province" :label="$t('page.manage.user.address')">
                  <ProvinceCityDistrictSelector
                    :province="userInfoData.address.province"
                    :city="userInfoData.address.city"
                    :district="userInfoData.address.district"
                    @change="handleAddressChange"
                  />
                </NFormItem>

                <NFormItem path="address.detailed_address" :label="$t('page.manage.user.detailedAddress')">
                  <NInput
                    v-model:value="userInfoData.address.detailed_address"
                    :placeholder="$t('page.manage.user.form.detailedAddress')"
                  />
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
                  {{ $t('common.save') }}
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
