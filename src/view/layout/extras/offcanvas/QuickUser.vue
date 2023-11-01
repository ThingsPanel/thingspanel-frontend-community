<template>
  <div class="topbar-item">
    <div class="card-user">
      <span
            class="text-blue font-weight-bold font-size-base d-none d-lg-block mr-1">
        Hi,
      </span>
    <span
            class=" text-white font-weight-bolder font-size-base d-none d-lg-block mr-3"
    >
        {{ user && user.name }}
      </span>
    </div>
   
    <div class="card-toolbar">
      <b-dropdown
              id="dropmenu"
              size="sm"
              variant="link"
              toggle-class="custom-v-dropdown show btn btn-clean btn-hover-light-primary btn-sm btn-icon"
              no-caret
              right
              no-flip
              @
      >
        <template v-slot:button-content>
          <i class="ki ki-bold-more-ver"></i>
        </template>
        <!--begin::Navigation-->
        <div class="navi navi-hover" style="width: 150px;">
          <b-dropdown-text tag="div" class="navi-header font-weight-bold">
              <span class="font-size-lg" @click="editpassword">
                {{ $t('PUBLIC.CHANGEPASSWORD') }}
              </span>

          </b-dropdown-text>
          <b-dropdown-text tag="div" class="navi-header font-weight-bold">
              <span class="font-size-lg" @click="onLogout">
                {{ $t('PUBLIC.SIGNOUT') }}
              </span>

          </b-dropdown-text>
        </div>
        <!--end::Navigation-->
      </b-dropdown>
    </div>

    <ChangePasswordForm :changePasswordDialogVisible.sync="changePasswordDialogVisible"></ChangePasswordForm>
  </div>
</template>

<style lang="scss" scoped>
#kt_quick_user {
  overflow: hidden;
}
.custom-v-dropdown {
  &.dropdown-toggle {
    padding: 0;
    &:hover {
      text-decoration: none;
    }

    &.dropdown-toggle-no-caret {
      &:after {
        content: none;
      }
    }
  }

  &.dropdown-menu {
    margin: 0;
    padding: 0;
    outline: none;
    .b-dropdown-text {
      padding: 0;
    }
  }
}
.font-size-lg:hover{
  color:#198BF6;
  cursor: pointer;
}
</style>

<script>
import { LOGOUT } from "@/core/services/store/auth.module";
import AUTH from "@/core/services/store/auth.module";
import KTLayoutQuickUser from "@/assets/js/layout/extended/quick-user.js";
// import KTOffcanvas from "@/assets/js/components/offcanvas.js";
import ChangePasswordForm from "@/view/pages/users/ChangePasswordForm";
import JwtService from "@/core/services/jwt.service"
export default {
  components: {
    ChangePasswordForm
  },
  data: () => ({
    auth: {
      user:{
        name:''
      }
    },
    user: {},
    name: "KTQuickUser",
    changePasswordDialogVisible: false,
  }),
  mounted() {
    // Init Quick User Panel
    KTLayoutQuickUser.init(this.$refs["kt_quick_user"]);
    this.auth = AUTH.state;
    this.user = JwtService.getCurrentUser();
  },
  methods: {
    onLogout() {
      this.$store
        .dispatch(LOGOUT)
        .then(() => this.$router.push({ name: "login" }));
    },
    editpassword(){
      this.changePasswordDialogVisible = true
        // document.getElementsByClassName('dropdown-menu')[1].classList.remove("show");
        // this.$router.push({ name: "editpassword" });
    },
  },
  computed: {
    picture() {
      return process.env.BASE_URL + "media/users/300_21.jpg";
    },

  },
};
</script>
