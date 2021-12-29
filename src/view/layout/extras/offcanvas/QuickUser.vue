<template>
  <div class="topbar-item">
    <span
            class="text-blue font-weight-bold font-size-base d-none d-md-inline mr-1"
    >
        Hi,
      </span>
    <span
            class=" text-white font-weight-bolder font-size-base d-none d-md-inline mr-3"
    >
        {{ auth.user.name }}
      </span>
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
                {{ $t('COMMON.CHANGEPASSWORD') }}
              </span>

          </b-dropdown-text>
          <b-dropdown-text tag="div" class="navi-header font-weight-bold">
              <span class="font-size-lg" @click="onLogout">
                {{ $t('COMMON.SIGNOUT') }}
              </span>

          </b-dropdown-text>
        </div>
        <!--end::Navigation-->
      </b-dropdown>
    </div>
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
import KTOffcanvas from "@/assets/js/components/offcanvas.js";

export default {
  data: () => ({
    auth: {
      user:{
        name:''
      }
    },
    name: "KTQuickUser",
  }),
  mounted() {
    // Init Quick User Panel
    KTLayoutQuickUser.init(this.$refs["kt_quick_user"]);
    this.auth = AUTH.state;

  },
  methods: {
    onLogout() {
      this.$store
        .dispatch(LOGOUT)
        .then(() => this.$router.push({ name: "login" }));
    },
    editpassword(){
        document.getElementsByClassName('dropdown-menu')[1].classList.remove("show");
        this.$router.push({ name: "editpassword" });
    },
  },
  computed: {
    picture() {
      return process.env.BASE_URL + "media/users/300_21.jpg";
    },

  },
};
</script>
