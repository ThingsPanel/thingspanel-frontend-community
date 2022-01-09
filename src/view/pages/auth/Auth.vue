<template>
  <div
    class="d-flex flex-column flex-root"
    :style="{
      backgroundImage: `url(${backgroundImage}) !important`,
	  backgroundRepeat: `repeat !important`
    }"
  >
    <div class="wrappers">
      <header class="headers">
        <!-- Fixed navbar -->
        <nav class="container-fluid">
          <div class="row">
            <div class="col align-self-center">
              <a href="" class="logo text-white">
                <img src="media/logos/logo.svg" alt="" class="logo-icon" />
              </a>
            </div>
            <div class="col text-right align-self-center">
              <a
                href="http://forum.thingspanel.cn"
                class="btn btn-sm btn-primary text-uppercase"
                target="_blank"
                >help</a
              >
            </div>
          </div>
        </nav>
      </header>
      <div class="container main-container">
        <router-view></router-view>
      </div>

      <!--<div
        class="login login-1 login-signin-on d-flex flex-column flex-lg-row flex-row-fluid bg-white"
        id="kt_login"
      >-->
      <!--begin::Aside-->
      <!-- <div
          class="login-aside d-flex flex-row-auto bgi-size-cover bgi-no-repeat p-10 p-lg-15 bg-size"
          :style="{ backgroundImage: `url(${backgroundImage})` }"
        >
          <div class="d-flex flex-row-fluid flex-column justify-content-between">
            <a href="#" class="flex-column-auto">
              <img src="media/logos/logo-letter-1.png" class="h-25" />
            </a>
            <div
              class="flex-column-fluid d-flex flex-column justify-content-center"
            >
              <h3 class="font-size-h1 mt-10 mb-5 text-white">
                Welcome to Metronic!
              </h3>
              <p class="font-weight-lighter text-white opacity-80">
                The ultimate Bootstrap, Angular 8, React &amp; VueJS admin theme
                framework for next generation web apps.
              </p>
            </div>
            <div
              class="d-none flex-column-auto d-lg-flex justify-content-between mt-15"
            >
              <div class="opacity-70 font-weight-bold text-white">
                © 2020 Metronic
              </div>
              <div class="d-flex">
                <a href="#" class="text-white">Privacy</a>
                <a href="#" class="text-white ml-10">Legal</a>
                <a href="#" class="text-white ml-10">Contact</a>
              </div>
            </div>
          </div>
        </div> -->
      <!--begin::Aside-->

      <!--begin::Content-->
      <!--<div
          class="flex-row-fluid d-flex flex-column position-relative p-7 overflow-hidden"
        >
          <div class="d-flex flex-column-fluid flex-center mt-30 mt-lg-0">
            <router-view></router-view>
          </div>
        </div>-->
      <!--end::Content-->
      <!--    </div>-->
      <footer class="footers">
        <div class="container-fluid">
          <div class="row">
            <div class="col-12 col-md text-center text-md-left align-self-center">
              <p class="footer_copy">
                版权所有 <a href="http://www.jiyikeji.cn/" target="_blank">极益科技</a>
              </p>
            </div>
            <div class="col-12 col-md-auto text-center text-md-right">
              <ul class="nav justify-content-center justify-md-content-end">
                <li class="nav-item">
                  <a
                    class="nav-link active"
                    href="https://www.thingspanel.cn/business"
                    target="_blank"
                    >使用条款</a
                  >
                </li>
                <li class="nav-item">
                  <a
                    class="nav-link"
                    href="https://gitee.com/ThingsPanel/thingspanel-php"
                    target="_blank"
                    >隐私策略</a
                  >
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="https://www.thingspanel.cn/aboutus" target="_blank"
                    >联系我们</a
                  >
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<!-- Load login custom page styles -->
<style lang="scss">
@import "@/assets/sass/pages/login/login-1.scss";
#kt_login {
  background: url("/media/bg/bg-5.jpg");
}
.d-flex {
  background-size: cover;
}
</style>
<style scoped>
.main-container {
  position: relative;
  z-index: 1;
  padding-top: 15px;
}
.wrappers {
  padding: 15px;
  display: block;
  width: 100%;
  z-index: 0;
  height: 100%;
}
.logo-icon {
  height: 47px;
  /* width: 98px; */
}
.headers {
  border-bottom: 1px solid rgba(91, 146, 255, 0.15);
}
.nav-link {
  color: #0f5fff;
}
.footers {
  position: absolute;
  bottom: 10px;
  left: 0;
  width: 100%;
}
@media (min-width: 960px) {
  .container {
    max-width: 900px !important;
  }
}
@media (min-width: 1264px) {
  .container {
    max-width: 1185px !important;
  }
}
@media (min-width: 1904px) {
  .container {
    max-width: 1785px !important;
  }
}
@media (max-width: 768px) {
  .footers {
    position: absolute;
    bottom: 20px;
    left: 0;
  }
  .footer_copy {
    margin-bottom: -15px;
  }
}
</style>

<script>
import { mapState } from "vuex";

export default {
  name: "auth",
  methods: {},
  computed: {
    ...mapState({
      errors: (state) => state.auth.errors,
    }),
    backgroundImage() {
      return process.env.BASE_URL + "media/bg/bg-12.png";
    },
  },
};
</script>
