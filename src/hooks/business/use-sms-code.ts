import { computed } from 'vue'
import { useLoading } from '@sa/hooks'
import { REG_PHONE } from '@/constants/reg'
import { fetchEmailCodeByEmail, fetchSmsCode } from '@/service/api/auth'
import { $t } from '@/locales'
import useCountDown from './use-count-down'

export default function useSmsCode() {
  const { loading, startLoading, endLoading } = useLoading()
  const { counts, start, isCounting } = useCountDown(60)
  const initLabel = computed(() => $t('page.login.common.getCode'))
  const countingLabel = (second: number) => $t('page.login.common.countingLabel', { second })
  const label = computed(() => {
    let text = initLabel.value
    if (loading.value) {
      text = ''
    }
    if (isCounting.value) {
      text = countingLabel(counts.value)
    }
    return text
  })

  /** 判断手机号码格式是否正确 */
  function isPhoneValid(phone: string) {
    let valid = true
    if (phone.trim() === '') {
      window.$message?.error($t('page.login.common.phoneRequired'))
      valid = false
    } else if (!REG_PHONE.test(phone)) {
      window.$message?.error($t('page.login.common.phoneInvalid'))
      valid = false
    }
    return valid
  }
  /** 判断邮箱格式是否正确 */
  async function isValidEmail(email) {
    // 正则表达式来匹配邮箱格式
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
    const valid = emailRegex.test(email)
    if (!valid) {
      window.$message?.error($t('page.login.common.emailInvalid'))
    } else if (email.trim() === '') {
      window.$message?.error($t('page.login.common.emailRequired'))
    }
    return valid
  }

  /**
   * 获取短信验证码
   *
   * @param phone - 手机号
   */
  async function getSmsCode(phone: string) {
    const valid = isPhoneValid(phone)
    if (!valid || loading.value) return

    startLoading()
    try {
      const { error, data } = await fetchSmsCode(phone)
      if (process.env.NODE_ENV === 'development') {
      }
      if (!error && data) {
        start() // 只有在发送成功时才启动倒计时
        window.$message?.success($t('page.login.common.codeSent'))
      } else {
        // 接口返回错误时不显示成功提示
        window.$message?.error($t('page.login.common.codeError'))
      }
    } catch (err) {
      // 接口调用失败时不显示成功提示
      window.$message?.error($t('page.login.common.codeError'))
    } finally {
      endLoading()
    }
  }

  /**
   * 根据邮箱获取短信验证码
   *
   * @param email - 邮箱
   */
  async function getSmsCodeByEmail(email: string) {
    const valid = await isValidEmail(email)
    if (!valid || loading.value) return

    startLoading()
    try {
      const { error, data } = await fetchEmailCodeByEmail(email)

      if (!error && data) {
        // Success case
        start() // Start countdown on success
        window.$message?.success($t('page.login.common.codeSent'))
      } else if (error) {
        // Error case: Try to access potential custom properties on the error object
        const errorCode = (error as any)?.code // Safely access potential code
        const errorMessage = (error as any)?.message // Safely access potential message

        if (errorCode === 200008) {
          // Specific error code for email registered
          window.$message?.error(errorMessage || $t('page.login.common.emailRegistered'))
        } else {
          // Other errors reported by the API
          window.$message?.error(errorMessage || $t('page.login.common.codeError'))
        }
      } else {
        // Fallback for unexpected scenarios (e.g., no error, no data)
        window.$message?.error($t('page.login.common.codeError'))
      }
    } catch (err) {
      // Catch exceptions during the API call itself (e.g., network error)
      window.$message?.error($t('page.login.common.codeError'))
    } finally {
      endLoading()
    }
  }

  return {
    label,
    start,
    isCounting,
    getSmsCode,
    loading,
    isValidEmail,
    getSmsCodeByEmail
  }
}
