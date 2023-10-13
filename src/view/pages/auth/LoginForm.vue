<template>
  <div style="margin-top: 20px;">
    <!-- email -->
    <el-form v-if="loginType === 'email'" ref="loginEmailFormRef" :model="formData" :rules="emailRules"
      @keyup.enter.native="handleSubmit">
      <el-form-item prop="email" :error="errors.email">
        <el-input v-model.trim="formData.email" clearable auto-complete="on" name="email" prefix-icon="el-icon-message"
          :placeholder="$t('LOGIN.EMAIL')"></el-input>
      </el-form-item>
      <el-form-item prop="password" :error="errors.password">
        <el-input v-model.trim="formData.password" type="password" show-password name="password"
          prefix-icon="el-icon-lock" :placeholder="$t('LOGIN.PASSWORD')"></el-input>
      </el-form-item>
    </el-form>

    <!-- captcha -->
    <el-form v-if="loginType === 'phone'" ref="loginPhoneFormRef" :model="formData" :rules="phoneRules"
      @keyup.enter.native="handleSubmit">

      <el-form-item prop="phone" :error="errors.phone">
        <el-input v-model.trim="formData.phone" clearable auto-complete="on" name="phone" prefix-icon="el-icon-phone"
          :placeholder="$t('LOGIN.PHONE_NUMBER')"></el-input>
      </el-form-item>
      <el-form-item prop="captcha" :error="errors.captcha">
        <el-input style="width: 45%; display: inline-block; margin-right:10px" v-model.trim="formData.captcha"
          name="captcha" prefix-icon="el-icon-postcard"
          :placeholder="$t('LOGIN.CAPTCHA')"></el-input>
        <el-button type="primary" :disabled="isCapchaDisabled" :loading="smsCodeLoading" @click="sendCode"
          style="float: right;">{{ buttonText }}</el-button>
      </el-form-item>

    </el-form>
    <el-button type="primary" class="w-100" :loading="loading" @click="handleSubmit(loginType)">{{ $t("LOGIN.SIGNIN")
    }}</el-button>
  </div>
</template>

<script>
import { computed, defineComponent, ref, onBeforeUnmount } from "@vue/composition-api";
import useLoginForm from "@/view/pages/auth/useLoginForm";
import i18n from "@/core/plugins/vue-i18n.js"

export default defineComponent({
  name: "LoginForm",
  props: {
    loginType: {
      type: String,
      default: "email",
    },
  },
  setup() {
    const countdown = ref(0);
    const initialTime = 60;
    let timer = null;

    const isCapchaDisabled = ref(false);
    const sendCode = () => {
      try {
        // 这里调用发送验证码的 API
        console.debug(formData)
        sendCaptchaCode(startCountdown);
      } catch (error) {
      }
    };
    const startCountdown = () => {
      countdown.value = initialTime;
      isCapchaDisabled.value = true;

      timer = setInterval(() => {
        if (countdown.value > 0) {
          countdown.value--;
        } else {
          clearInterval(timer);
          isCapchaDisabled.value = false;
        }
      }, 1000);
    };

    const buttonText = computed(() => {
      return countdown.value > 0 ? `${countdown.value} ` + i18n.t("LOGIN.RESEND_TEXT") : i18n.t("LOGIN.GET_SMS_CODE");
    });

    onBeforeUnmount(() => {
      if (timer) {
        clearInterval(timer);
      }
    });

    let {
      loginEmailFormRef,
      loginPhoneFormRef,
      formData,
      loading,
      smsCodeLoading,
      emailRules,
      phoneRules,
      errors,
      handleSubmit,
      sendCaptchaCode,

    } = useLoginForm();

    return {
      isCapchaDisabled,
      buttonText,
      loginEmailFormRef,
      loginPhoneFormRef,
      formData,
      loading,
      smsCodeLoading,
      emailRules,
      phoneRules,
      errors,
      handleSubmit,
      sendCaptchaCode,
      sendCode,
    }
  }
})
</script>

<style scoped>
/deep/ .el-input__inner {
  color: #fff;
  background-color: rgba(22, 30, 67, 0.5) !important;
  border-color: transparent;
}

/deep/ .el-button i {
  color: #fff;
}
</style>