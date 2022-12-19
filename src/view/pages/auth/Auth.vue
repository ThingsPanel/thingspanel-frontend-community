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
                <img :src="siteLogo()" alt="" class="logo-icon" />
              </a>
            </div>
            <div class="col text-right align-self-center">
              <a
                href="http://thingspanel.io/"
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
                版权所有 <a href="http://thingspanel.io/" target="_blank">ThingsPanel</a>
              </p>
            </div>
            <div class="col-12 col-md-auto text-center text-md-right">
              <ul class="nav justify-content-center justify-md-content-end">
                <li class="nav-item">
                  <a
                    class="nav-link"
                    href="http://thingspanel.io/"
                    target="_blank"
                    >使用条款</a
                  >
                </li>
                <li class="nav-item">
                  <a
                    class="nav-link"
                    href="http://thingspanel.io/"
                    target="_blank"
                    >隐私策略</a
                  >
                </li>
                <li class="nav-item">
                  <a class="nav-link" href="http://thingspanel.io/" target="_blank"
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
  margin-bottom: 10px;
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
import { mapGetters } from "vuex";
import objectPath from "object-path";

export default {
  name: "auth",
  methods: {},
  computed: {
    ...mapGetters(["layoutConfig"]),
    ...mapState({
      errors: (state) => state.auth.errors,
    }),
    backgroundImage() {
      return process.env.BASE_URL + "media/bg/bg-12.png";
    },
  },
  methods:{
    siteLogo() {
      const menuAsideLeftSkin = this.layoutConfig("brand.self.theme");
      // set brand logo
      const logoObject = this.layoutConfig("self.logo");

      let logo;

      if (typeof logoObject === "string") {
        logo = logoObject;
      }
      if (typeof logoObject === "object") {
        logo = objectPath.get(logoObject, menuAsideLeftSkin + "");
      }
      if (typeof logo === "undefined") {
        const logos = this.layoutConfig("self.logo");
        logo = logos[Object.keys(logos)[0]];
      }
      return logo;
    }
  }
};
</script>
