<script setup lang="ts">
import { computed, reactive, ref, toRefs, watch, nextTick } from 'vue'
import type { FormInst, FormItemRule } from 'naive-ui'
import { NButton, NForm, NFormItemGridItem, NGrid, NInput, NModal, NSpace, NSelect, NRadioGroup, NRadio } from 'naive-ui'
// import { genderOptions } from '@/constants'
import { addUser, editUser } from '@/service/api/auth'
import { createRequiredFormRule, formRules, getConfirmPwdRule } from '@/utils/form/rule'
import { userStatusOptions } from '@/constants/business'
import { $t } from '@/locales'
import ProvinceCityDistrictSelector from '@/components/common/ProvinceCityDistrictSelector.vue'

export interface Props {
  /** 弹窗可见性 */
  visible: boolean
  /** 弹窗类型 add: 新增 edit: 编辑 */
  type?: 'add' | 'edit'
  /** 编辑的表格行数据 */
  editData?: UserManagement.User | null
}

export type ModalType = NonNullable<Props['type']>

defineOptions({ name: 'TableActionModal' })

const props = withDefaults(defineProps<Props>(), {
  type: 'add',
  editData: null
})

interface Emits {
  (e: 'update:visible', visible: boolean): void

  /** 点击协议 */
  (e: 'success'): void
}

const emit = defineEmits<Emits>()

const modalVisible = computed({
  get() {
    return props.visible
  },
  set(visible) {
    emit('update:visible', visible)
  }
})

const customUserStatusOptions = computed(() => {
  return userStatusOptions.map(item => {
    const key = item.value === 'N' ? 'page.manage.user.status.normal' : 'page.manage.user.status.freeze'
    return {
      label: $t(key),
      value: item.value
    }
  })
})

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

// 处理省市区选择变化
const handleAddressChange = (value: { province: string; city: string; district: string }) => {
  console.log('自定义三级联动选择的值:', value);
  
  // 更新表单模型中的地址数据
  formModel.address.province = value.province;
  formModel.address.city = value.city;
  formModel.address.district = value.district;
  
  console.log('处理后的地址数据:', {
    province: formModel.address.province,
    city: formModel.address.city,
    district: formModel.address.district
  });
};

const closeModal = () => {
  modalVisible.value = false
}

const title = computed(() => {
  const titles: Record<ModalType, string> = {
    add: $t('common.add'),
    edit: $t('common.edit')
  }
  return titles[props.type]
})

const formRef = ref<HTMLElement & FormInst>()

type FormModel = Pick<UserManagement.User, 'email' | 'name' | 'phone_number' | 'gender' | 'remark' | 'status'> & {
  password: string
  confirmPwd: string
  organization: string
  timezone: string
  default_language: string
  address: {
    province: string
    city: string
    district: string
    detailed_address: string
  }
}

const formModel = reactive<FormModel>(createDefaultFormModel())

const rules: Record<keyof FormModel, FormItemRule | FormItemRule[]> = {
  name: createRequiredFormRule($t('common.pleaseCheckValue')),
  gender: createRequiredFormRule($t('common.pleaseCheckValue')),
  phone_number: formRules.phone,
  email: formRules.email,
  password: formRules.pwd,
  confirmPwd: getConfirmPwdRule(toRefs(formModel).password),
  status: getConfirmPwdRule(toRefs(formModel).password),
  remark: createRequiredFormRule($t('common.pleaseCheckValue')),
  organization: createRequiredFormRule($t('common.pleaseCheckValue')),
  timezone: createRequiredFormRule($t('common.pleaseCheckValue')),
  default_language: createRequiredFormRule($t('common.pleaseCheckValue')),
  address: {
    province: createRequiredFormRule('请选择省份'),
    city: createRequiredFormRule('请选择城市'),
    district: createRequiredFormRule('请选择区县'),
    detailed_address: createRequiredFormRule('请输入详细地址')
  }
}

function createDefaultFormModel(): FormModel {
  return {
    name: '',
    gender: null,
    phone_number: '',
    email: '',
    password: '',
    confirmPwd: '',
    remark: '',
    status: 'N',
    organization: '',
    timezone: 'Asia/Shanghai',
    default_language: 'zh-CN',
    address: {
      province: '',
      city: '',
      district: '',
      detailed_address: ''
    }
  }
}

function handleUpdateFormModel(model: Partial<FormModel>) {
  Object.assign(formModel, model)
}

function handleUpdateFormModelByModalType() {
  const handlers: Record<ModalType, () => void> = {
    add: () => {
      const defaultFormModel = createDefaultFormModel()
      handleUpdateFormModel(defaultFormModel)
    },
    edit: () => {
      if (props.editData) {
        // 从后端数据中提取地址字段（地址字段在 address 对象中）
        const editDataAny = props.editData as any;
        const addressData = editDataAny.address || {
          province: '',
          city: '',
          district: '',
          detailed_address: ''
        };
        
        // 编辑模式下不需要构建级联选择器的值，因为我们使用的是独立的省市区字段
        
        const editFormData = {
          ...editDataAny,
          password: '',
          confirmPwd: '',
          organization: editDataAny.organization || '',
          timezone: editDataAny.timezone || 'Asia/Shanghai',
          default_language: editDataAny.default_language || 'zh-CN',
          address: {
            ...addressData
          }
        }
        handleUpdateFormModel(editFormData)
        
        // 编辑模式下地址数据已经直接设置到表单模型中
      }
    }
  }

  handlers[props.type]()
}

async function handleSubmit() {
  await formRef.value?.validate()
  
  // 准备提交的数据，确保地址字段正确
  const submitData = {
    ...formModel
  };
  
  // 移除不需要提交的字段
  delete (submitData as any).confirmPwd;
  
  console.log('提交的数据结构:', submitData);
  
  let data: any
  if (props.type === 'add') {
    data = await addUser(submitData)
  } else if (props.type === 'edit') {
    data = await editUser(submitData)
  }
  if (!data.error) {
    // window.$message?.success(data.msg);
    emit('success')
  }
  closeModal()
}

watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      handleUpdateFormModelByModalType()
    }
  }
)

// 监听地址字段值的变化，用于调试
watch(
  () => [formModel.address.province, formModel.address.city, formModel.address.district],
  (newValue) => {
    console.log('地址字段值变化:', newValue);
    console.log('当前地址数据:', formModel.address);
  },
  { deep: true }
)
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
        <NFormItemGridItem :span="12" :label="'组织'" path="organization">
          <NInput v-model:value="formModel.organization" placeholder="请输入组织名称" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="12" :label="'时区'" path="timezone">
          <NSelect v-model:value="formModel.timezone" :options="timezoneOptions" placeholder="请选择时区" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="12" :label="'默认语言'" path="default_language">
          <NSelect v-model:value="formModel.default_language" :options="languageOptions" placeholder="请选择默认语言" />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="'省市区'" path="address.province">
          <ProvinceCityDistrictSelector
            :province="formModel.address.province"
            :city="formModel.address.city"
            :district="formModel.address.district"
            @change="handleAddressChange"
          />
        </NFormItemGridItem>
        <NFormItemGridItem :span="24" :label="'详细地址'" path="address.detailed_address">
          <NInput v-model:value="formModel.address.detailed_address" placeholder="请输入详细地址" />
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
