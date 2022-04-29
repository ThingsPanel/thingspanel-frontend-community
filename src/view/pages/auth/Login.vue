<template>
  <div>
    <!--begin::Content header-->
    <!-- <div
      class="position-absolute top-0 right-0 text-right mt-5 mb-15 mb-lg-0 flex-column-auto justify-content-center py-5 px-10"
    >
      <span class="font-weight-bold font-size-3 text-dark-60">
        Don't have an account yet?
      </span>
      <router-link
        class="font-weight-bold font-size-3 ml-2"
        :to="{ name: 'register' }"
      >
        Sign Up!
      </router-link>
    </div> -->
    <!--end::Content header-->

    <!--begin::Signin-->
    <div class="loginrow login-row-height">
      <div class="col-md-6 d-none d-md-flex infologin">
       
      </div>
      <div class="login-form login-signin col-md-6">
        <div class="shadow-lg">
          <div class="card-body">
            <h5 class="font-weight-light mb-1 text-mute-high">Welcome,</h5>
            <h2 class="font-weight-normal mb-4">{{ $t("COMMON.SIGNIN") }}</h2>
            <!--            <div class="text-center mb-10 mb-lg-10">-->
            <!--              <h3 class="font-size-h1">{{ $t("COMMON.SIGNIN") }}</h3>-->
            <p class="font-weight-semi-bold">
              {{ $t("COMMON.TITLE1") }}
            </p>
            <!--            </div>-->

            <!--begin::Form-->
            <b-form class="form" @submit.stop.prevent="onSubmit">
              <!-- <div role="alert" class="alert alert-info">
                <div class="alert-text">

                </div>
              </div> -->
              <div
                role="alert"
                v-bind:class="{ show: errors }"
                class="alert fade alert-danger mb-0"
              >
                <div class="alert-text">
                  {{ errors }}
                </div>
              </div>
              <div class="loginform">
                <b-form-group
                  id="example-input-group-1"
                  label=""
                  label-for="example-input-1"
                >
                  <b-form-input
                    class="form-control form-control-solid h-auto py-5 px-6 no-bg"
                    id="example-input-1"
                    name="example-input-1"
                    v-model="$v.form.email.$model"
                    :state="validateState('email')"
                    aria-describedby="input-1-live-feedback"
                  ></b-form-input>

                  <b-form-invalid-feedback id="input-1-live-feedback">
                    {{ $t("COMMON.TITLE2") }}
                  </b-form-invalid-feedback>
                </b-form-group>

                <b-form-group
                  id="example-input-group-2"
                  label=""
                  label-for="example-input-2"
                >
                  <b-form-input
                    class="form-control form-control-solid h-auto py-5 px-6 no-bg"
                    type="password"
                    id="example-input-2"
                    name="example-input-2"
                    v-model="$v.form.password.$model"
                    :state="validateState('password')"
                    aria-describedby="input-2-live-feedback"
                  ></b-form-input>

                  <b-form-invalid-feedback id="input-2-live-feedback">
                    {{ $t("COMMON.TITLE3") }}
                  </b-form-invalid-feedback>
                </b-form-group>
              </div>

              <!--begin::Action-->
              <div
                class="form-group d-flex flex-wrap justify-content-between align-items-center mt-8"
              >
                <!-- <a
                    href="#"
                    class="text-dark-60 text-hover-primary my-3 mr-2"
                    id="kt_login_forgot"
                  >
                    {{$t('COMMON.FORGETPASS')}}
                  </a> -->
                <button
                  ref="kt_login_signin_submit"
                  class="btn btn-primary font-weight-bold form-control font-size-3"
                >
                  {{ $t("COMMON.SIGNIN") }}
                </button>
              </div>
              <!--end::Action-->
            </b-form>
            <!--end::Form-->
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
}
#example-input-2{
  -webkit-text-fill-color:#fff !important;
}
</style>
<script>
import { mapState } from "vuex";
import JwtService from "@/core/services/jwt.service";
import { validationMixin } from "vuelidate";
import { email, minLength, required } from "vuelidate/lib/validators";
import { LOGIN, LOGOUT } from "@/core/services/store/auth.module";
import { SET_AUTH } from "../../../core/services/store/auth.module";
import ApiService from "@/core/services/api.service";
const local_url =
  (process.env.VUE_APP_BASE_URL ||
    document.location.protocol + "//" + document.domain + ":9999/") + "api";
export default {
  mixins: [validationMixin],
  name: "login",
  data() {
    return {
      // Remove this dummy login info
      form: {
        email: "",
        password: "",
      },
    };
  },
  worryinfo: "",
  validations: {
    form: {
      email: {
        required,
        email,
      },
      password: {
        required,
        minLength: minLength(6),
      },
    },
  },
  methods: {
    validateState(name) {
      const { $dirty, $error } = this.$v.form[name];
      return $dirty ? !$error : null;
    },
    resetForm() {
      this.form = {
        email: null,
        password: null,
      };

      this.$nextTick(() => {
        this.$v.$reset();
      });
    },
    onSubmit() {
      this.$v.form.$touch();
      if (this.$v.form.$anyError) {
        return;
      }

      const email = this.$v.form.email.$model;
      const password = this.$v.form.password.$model;

      // clear existing errors
      this.$store.dispatch(LOGOUT);

      // set spinner to submit button
      const submitButton = this.$refs["kt_login_signin_submit"];
      submitButton.classList.add("spinner", "spinner-light", "spinner-right");

      // dummy delay
      setTimeout(() => {
        // send login request
        /*this.$store
          .dispatch(LOGIN, { email, password })
          // go to which page after successfully login
          .then(() => this.$router.push({ name: "home" }));*/
        this.$store.dispatch(LOGIN, { email, password }).then(() => {
          ApiService.setHeader();
          ApiService.post(local_url + "/auth/me").then(({ data }) => {
            if (data.code == 200) {
              console.log(data);
			  this.$router.push({ name: "home" });
			  
              // if (data.data.is_admin == 0) {
              // } else {
              //   this.$router.push({ name: "chart" });
              // }
            }
          });
        });

        submitButton.classList.remove("spinner", "spinner-light", "spinner-right");
      }, 2000);
    },
  },
  computed: {
    ...mapState({
      errors: (state) => state.auth.errors,
    }),
  },
};
</script>
