<template>
  <div>
    <div class="loginrow login-row-height">
      <div class="login-form login-signin col-md-6">
        <div class="shadow-lg">
          <div class="card-body" style="margin: 0 6%;">
            <h5 class="font-weight-light mb-1 text-mute-high" style="margin-bottom: 10px;">ThingsPanel</h5>
            <h2 class="font-weight-normal mb-4">{{ $t("LOGIN.PASSWORD_RESET") }}</h2>

            <div style="margin-top: 20px;">
              <el-form ref="resetFormRef" :model="formData" :rules="rules" @keyup.enter.native="handleSubmit">
                <el-form-item prop="phone" :error="errors.phone">
                  <el-input v-model.trim="formData.phone" clearable auto-complete="on" name="phone"
                    prefix-icon="el-icon-phone" :placeholder="$t('LOGIN.PHONE_NUMBER')"></el-input>
                </el-form-item>

                <el-form-item prop="captcha" :error="errors.captcha">
                  <el-input style="width: 45%; display: inline-block; margin-right:10px" v-model.trim="formData.captcha"
                    name="captcha" prefix-icon="el-icon-postcard" auto-complete="captcha" :placeholder="$t('LOGIN.CAPTCHA')"></el-input>
                  <el-button type="primary" :disabled="isCapchaDisabled" :loading="smsCodeLoading" @click="sendCode"
                    style="float: right;">{{ buttonText }}</el-button>
                </el-form-item>

                <el-form-item prop="password" :error="errors.password">
                  <el-input v-model.trim="formData.password" type="password" show-password name="password"
                    prefix-icon="el-icon-lock" :placeholder="$t('LOGIN.PASSWORD')"></el-input>
                </el-form-item>
                <el-button type="primary" class="w-100" :loading="loading" @click="handleSubmit">{{ $t("LOGIN.RESET_NOW")
                }}</el-button>

              </el-form>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import useResetForm from "@/view/pages/auth/useResetForm";
import { computed, defineComponent, ref, onBeforeUnmount } from "@vue/composition-api";
import i18n from "@/core/plugins/vue-i18n.js"

export default defineComponent({
  name: "ResetForm",
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
      resetFormRef,
      formData,
      loading,
      smsCodeLoading,
      rules,
      errors,
      sendCaptchaCode,
      handleSubmit
    } = useResetForm();

    return {
      resetFormRef,
      formData,
      loading,
      rules,
      errors,
      handleSubmit,
      smsCodeLoading,
      sendCaptchaCode,
      isCapchaDisabled,
      buttonText,
      sendCode,
    }
  }
})
</script>

<style lang="scss" scoped>
.infologin {
  display: block !important;
}

.infologin h3 {
  font-size: 56px;
  font-family: Source Han Sans CN;
  font-weight: 400;
  color: #ffffff;
  margin-top: 82px;
}

.infologin span {
  margin-top: 40px;
  font-size: 36px;
  font-family: Source Han Sans CN;
  font-weight: 400;
  color: #ffffff;
}

.spinner.spinner-right {
  padding-right: 3.5rem !important;
}

.login-form {
  min-width: 450px;
  background: rgba(255, 255, 255, 0.6);
  padding: 20px 30px;
  border-radius: 8px;
}

/*登录*/
.loginrow {
  display: flex;
  flex-wrap: wrap;
  margin-right: -15px;
  margin-left: -15px;
  margin-top: 15%;
  color: #fff !important;
  position: relative;

}

.login-signin {
  align-self: center !important;
  flex: 0 0 33.33333%;
  margin: 0 auto;
  max-width: 20%;
  background: unset;
  position: absolute;
  right: 15%;
  top: 3%;
}

.shadow-lg {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  word-wrap: break-word;
  background-color: #fff;
  background-clip: border-box;
  border-radius: 0.25rem;
  backdrop-filter: saturate(125%) blur(10px);
  background-color: rgba(168, 197, 255, 0.25);
  box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175) !important;
  border: 0 !important;
}

.card-body {
  padding: 15px;
  padding-bottom: 3rem !important;
  padding-top: 3rem !important;
  flex: 1 1 auto;
}

.font-weight-light {
  font-weight: 300 !important;
  margin-bottom: 0.25rem !important;
  font-size: 1.25rem;
  line-height: 1.2;
  margin-top: 0;
  font-family: "Roboto", sans-serif;
}

.loginform {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  word-wrap: break-word;
  background-clip: border-box;
  border: 1px solid rgba(0, 0, 0, 0.125);
  border-radius: 0.25rem;
  background-color: #2d3d88;
  margin-bottom: 0.5rem !important;
  overflow: hidden !important;
}

.invalid-feedback {
  margin-top: 0 !important;
}

.no-bg {
  background: unset !important;
  border-color: unset !important;
  padding: 8px !important;
  border-radius: 4px;
}

.form-group {
  margin-bottom: 0;
}

@media (min-width: 768px) {
  .d-md-flex {
    // display: flex !important;
    flex: 0 0 58.33333%;
    max-width: 58.33333%;
  }
}

@media (max-width: 600px) {
  .login-form {
    margin-top: 15% !important;
    min-width: 320px;
    margin: 0 auto;
  }

  .loginrow {
    height: unset;
  }
}

.form-control.form-control-solid {
  background-color: rgba(22, 30, 67, 0.5) !important;
}

#example-input-1 {
  -webkit-text-fill-color: #fff !important;
  transition: background-color 50000s ease-in-out 0s;
}

#example-input-2 {
  -webkit-text-fill-color: #fff !important;
  transition: background-color 50000s ease-in-out 0s;
}

.el-tabs__item {
  font-size: 17px;
}

::v-deep .el-tabs__nav-scroll {

  width: 100%;
  display: flex;
  justify-content: space-around;
}
</style>
