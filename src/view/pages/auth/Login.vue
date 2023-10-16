<template>
  <div>
    <!--begin::Signin-->
    <div class="loginrow login-row-height">
      <!--      <div class="col-md-6 d-none d-md-flex infologin">-->
      <!--       -->
      <!--      </div>-->
      <div class="login-form login-signin col-md-6">
        <div class="shadow-lg">
          <div class="card-body" style="margin: 0 6%;">
            <h5 class="font-weight-light mb-1 text-mute-high" style="margin-bottom: 10px;">ThingsPanel</h5>
            <h2 class="font-weight-normal mb-4">{{ $t("LOGIN.SIGNIN") }}</h2>

            <el-tabs v-model="activeName" stretch>
              <el-tab-pane :label="$t('LOGIN.PASSWORD_LOGIN')" name="password">
                <LoginForm loginType="email"></LoginForm>

              </el-tab-pane>
              <el-tab-pane :label="$t('LOGIN.CAPTCHA_LOGIN')" name="captcha">
                <LoginForm loginType="phone"></LoginForm>

              </el-tab-pane>
            </el-tabs>
            
            <el-row type="flex" class="row-bg" justify="space-between" style="margin-top: 12px;">
              <el-col :span=9>
                <a href="/#/reset" style="color: white;">{{ $t("LOGIN.FORGOT_PASSWORD") }}</a>
              </el-col>
              <el-col :span=8>
                <el-tooltip class="item" placement="bottom" effect="light" popper-class="download_tooltip">
                  <div slot="content" style="width: 135px; height: 135px">
                    <img :src="imageSrc" alt="" style="width: 100%;">
                  </div>
                  <div style="width: 150px; cursor: pointer">{{ $t("COMMON.DOWNLOAD_APP") }}</div>
                </el-tooltip>
              </el-col>
              <el-col :span=6 style="text-align: right;">
                <a href="/#/register" style="color: white;">{{ $t("LOGIN.GO_SIGN_UP") }}></a>
              </el-col>
            </el-row>
          </div>
        </div>
      </div>
    </div>
    <!--end::Signin-->
  </div>
</template>
<script>
import LoginForm from "@/view/pages/auth/LoginForm";

export default {
  components: {
    LoginForm
  },
  name: "login",
  data() {
    return {
      activeName: "password",
      imageSrc: require('/src/assets/images/download_app.png'),
    };
  },
};
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
}</style>
