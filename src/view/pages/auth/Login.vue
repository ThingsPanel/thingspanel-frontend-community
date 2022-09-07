<template>
  <div>
    <!--begin::Signin-->
    <div class="loginrow login-row-height">
<!--      <div class="col-md-6 d-none d-md-flex infologin">-->
<!--       -->
<!--      </div>-->
      <div class="login-form login-signin col-md-6">
        <div class="shadow-lg">
          <div class="card-body">
            <h5 class="font-weight-light mb-1 text-mute-high">Welcome,</h5>
            <h2 class="font-weight-normal mb-4">{{ $t("COMMON.SIGNIN") }}</h2>
            <p class="font-weight-semi-bold">
              {{ $t("COMMON.TITLE1") }}
            </p>

            <LoginForm></LoginForm>

          </div>
        </div>
      </div>
    </div>
    <!--end::Signin-->
  </div>
</template>

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
}
.login-signin {
  align-self: center !important;
  flex: 0 0 33.33333%;
  margin: 0 auto;
  max-width: 30%;
  background: unset;
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
</style>
<style>
.form-control.form-control-solid {
  background-color: rgba(22, 30, 67, 0.5) !important;
}
#example-input-1{
  -webkit-text-fill-color:#fff !important;
    transition: background-color 50000s ease-in-out 0s;
}
#example-input-2{
  -webkit-text-fill-color:#fff !important;
  transition: background-color 50000s ease-in-out 0s;
}
</style>
<script>
import LoginForm from "@/view/pages/auth/LoginForm";

export default {
  components: {
    LoginForm
  },
  name: "login",
};
</script>
