import type { Ref } from 'vue'
import type { FormItemRule } from 'naive-ui'
import { $t } from '@/locales'
import { REG_CODE_SIX, REG_EMAIL, REG_PHONE, REG_PWD } from '@/constants/reg'
/** 创建自定义错误信息的必填表单规则 */
export const createRequiredFormRule = (message = '不能为空'): FormItemRule => ({ required: true, message })

export const requiredFormRule = createRequiredFormRule()

/** 表单规则 */
interface CustomFormRules {
  /** 手机号码 */
  phone: FormItemRule[]
  /** 密码 */
  pwd: FormItemRule[]
  /** 验证码 */
  code: FormItemRule[]
  /** 邮箱 */
  email: FormItemRule[]
}

/** 表单规则 */
export const formRules: CustomFormRules = {
  phone: [
    createRequiredFormRule('请输入手机号'),
    { pattern: REG_PHONE, message: '手机号格式不正确', trigger: 'input' }
  ],
  pwd: [
    // createRequiredFormRule("请输入密码")
    { pattern: REG_PWD, message: '密码格式不正确', trigger: 'input' }
  ],
  code: [
    createRequiredFormRule('请输入验证码'),
    {
      pattern: REG_CODE_SIX,
      message: '验证码格式不正确',
      trigger: 'input'
    }
  ],
  email: [
    {
      required: true,
      pattern: REG_EMAIL,
      message: '请输入邮箱',
      trigger: 'blur'
    }
  ]
}

/** 是否为空字符串 */
function isBlankString(str: string) {
  return str.trim() === ''
}

/** 获取确认密码的表单规则 */
export function getConfirmPwdRule(pwd: Ref<string>) {
  const confirmPwdRule: FormItemRule[] = [
    { required: true, message: '密码为6-18位字符，需包含字母、数字' },
    {
      validator: (rule, value) => {
        if (!isBlankString(value) && value !== pwd.value) {
          return Promise.reject(rule.message)
        }
        return Promise.resolve()
      },
      message: '输入的值与密码不一致',
      trigger: 'input'
    }
  ]
  return confirmPwdRule
}

/** 获取图片验证码的表单规则 */
export function getImgCodeRule(imgCode: Ref<string>) {
  const imgCodeRule: FormItemRule[] = [
    { required: true, message: '请输入验证码' },
    {
      validator: (rule, value) => {
        if (!isBlankString(value) && value !== imgCode.value) {
          return Promise.reject(rule.message)
        }
        return Promise.resolve()
      },
      message: '验证码格式不正确',
      trigger: 'blur'
    }
  ]
  return imgCodeRule
}
