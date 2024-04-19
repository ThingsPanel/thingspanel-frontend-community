import { computed } from 'vue';
import { useLoading } from '@sa/hooks';
import { REG_PHONE } from '@/constants/reg';
import { fetchSmsCode } from '@/service/api/auth';
import useCountDown from './use-count-down';

export default function useSmsCode() {
  const { loading, startLoading, endLoading } = useLoading();
  const { counts, start, isCounting } = useCountDown(60);
  const initLabel = '获取验证码';
  const countingLabel = (second: number) => `${second}秒后重新获取`;
  const label = computed(() => {
    let text = initLabel;
    if (loading.value) {
      text = '';
    }
    if (isCounting.value) {
      text = countingLabel(counts.value);
    }
    return text;
  });

  /** 判断手机号码格式是否正确 */
  function isPhoneValid(phone: string) {
    let valid = true;
    if (phone.trim() === '') {
      window.$message?.error('手机号码不能为空！');
      valid = false;
    } else if (!REG_PHONE.test(phone)) {
      window.$message?.error('手机号码格式错误！');
      valid = false;
    }
    return valid;
  }

  /**
   * 获取短信验证码
   *
   * @param phone - 手机号
   */
  async function getSmsCode(phone: string) {
    const valid = isPhoneValid(phone);
    if (!valid || loading.value) return;

    startLoading();
    const { data } = await fetchSmsCode(phone);
    if (data) {
      start();
    }
    endLoading();
  }

  return {
    label,
    start,
    isCounting,
    getSmsCode,
    loading
  };
}
