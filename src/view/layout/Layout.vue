<template>
  <div class="d-flex flex-column flex-root" style="background-color: #161e43!important;">
    <!-- begin:: Header Mobile -->
    <KTHeaderMobile></KTHeaderMobile>
    <!-- end:: Header Mobile -->

    <Loader v-if="loaderEnabled" v-bind:logo="loaderLogo"></Loader>

    <!-- begin::Body -->
    <div class="d-flex flex-row flex-column-fluid page">
      <!-- begin:: Aside Left -->
      <KTAside v-if="asideEnabled"></KTAside>
      <!-- end:: Aside Left -->
      <div id="kt_wrapper" class="d-flex flex-column flex-row-fluid wrapper">
        <div class="wrapbox">
        <!-- begin:: Header -->
        <KTHeader></KTHeader>
        <!-- end:: Header -->

        <!-- begin:: Content -->
        <div
          id="kt_content"
          class="content d-flex flex-column flex-column-fluid"
        >
          <!-- begin:: Content Head -->

          <!-- begin:: Content Head -->
          <!-- <KTSubheader
            v-if="subheaderDisplay"
            v-bind:breadcrumbs="breadcrumbs"
            v-bind:title="pageTitle"
          /> -->
          <!-- end:: Content Head -->

          <!-- begin:: Content Body -->
          <div class="d-flex flex-column-fluid">
            <div class="container-fluid">
              <transition name="fade-in-up">
                <router-view />
              </transition>
            </div>
          </div>
        </div>
        <!-- <KTFooter></KTFooter> -->
      </div>
      </div>
    </div>
    <!-- <KTStickyToolbar v-if="toolbarDisplay"></KTStickyToolbar> -->
    <KTScrollTop></KTScrollTop>
    <AIDialog></AIDialog>
  </div>
</template>
<style>
.wrapper {
  padding-top: 65px !important;
}
</style>
<script>
import { mapGetters } from "vuex";
import KTAside from "@/view/layout/aside/Aside.vue";
import KTHeader from "@/view/layout/header/Header.vue";
import KTHeaderMobile from "@/view/layout/header/HeaderMobile.vue";
import KTFooter from "@/view/layout/footer/Footer.vue";
import AIDialog from "@/view/layout/aiDialog/index.vue";
import HtmlClass from "@/core/services/htmlclass.service";
// import KTSubheader from "@/view/layout/subheader/Subheader.vue";
// import KTStickyToolbar from "@/view/layout/extras/StickyToolbar.vue";
import KTScrollTop from "@/view/layout/extras/ScrollTop";
import Loader from "@/view/content/Loader.vue";
import {
  ADD_BODY_CLASSNAME,
  REMOVE_BODY_CLASSNAME
} from "@/core/services/store/htmlclass.module.js";
import {getRedToken} from "@/api/transpond";
import RED from "@/core/services/red.module"
import {LOGIN, SET_ROUTERS} from "../../core/services/store/auth.module";
import {RESET_LAYOUT_CONFIG} from "../../core/services/store/config.module";

export default {
  name: "Layout",
  components: {
    KTAside,
    KTHeader,
    KTHeaderMobile,
    KTFooter,
    // KTSubheader,
    // KTStickyToolbar,
    KTScrollTop,
    Loader,
    AIDialog
  },
  beforeMount() {
    // this.$store.dispatch(RESET_LAYOUT_CONFIG);
    // show page loading
    this.$store.dispatch(ADD_BODY_CLASSNAME, "page-loading");
    // initialize html element classes
    HtmlClass.init(this.layoutConfig());
  },
  mounted() {
    // check if current user is authenticated
    if (!this.isAuthenticated) {
      this.$router.push({ name: "login" });
    } else {
        this.$store.dispatch(SET_ROUTERS)
        // getRedToken().then(res => {
        //   if (res.status == 200) {
        //     RED.setRedToken(res.data)
        //   }
        // })
        // .catch()
    }

    // Simulate the delay page loading
    setTimeout(() => {
      // Remove page loader after some time
      this.$store.dispatch(REMOVE_BODY_CLASSNAME, "page-loading");
    }, 2000);
  },
  methods: {},
  computed: {
    ...mapGetters([
      "isAuthenticated",
      "breadcrumbs",
      "pageTitle",
      "layoutConfig"
    ]),

    /**
     * Check if the page loader is enabled
     * @returns {boolean}
     */
    loaderEnabled() {
      return !/false/.test(this.layoutConfig("loader.type"));
    },

    /**
     * Check if container width is fluid
     * @returns {boolean}
     */
    /*contentFluid() {
      return this.layoutConfig("content.width") === "fluid";
    },*/

    /**
     * Page loader logo image using require() function
     * @returns {string}
     */
    loaderLogo() {
      return this.layoutConfig("loader.logo");
    },

    /**
     * Check if the left aside menu is enabled
     * @returns {boolean}
     */
    asideEnabled() {
      return !!this.layoutConfig("aside.self.display");
    },

    /**
     * Set the right toolbar display
     * @returns {boolean}
     */
    toolbarDisplay() {
      // return !!this.layoutConfig("toolbar.display");
      return true;
    },

    /**
     * Set the subheader display
     * @returns {boolean}
     */
    subheaderDisplay() {
      return !!this.layoutConfig("subheader.display");
    }
  }
};
</script>
