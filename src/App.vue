<template>
  
  <router-view></router-view>
</template>

<style lang="scss">
body {
  zoom:1!important;
}
// 3rd party plugins css
@import "~vuetify/dist/vuetify.css";
@import "~bootstrap-vue/dist/bootstrap-vue.css";
@import "~perfect-scrollbar/css/perfect-scrollbar.css";
@import "~socicon/css/socicon.css";
@import "~@fortawesome/fontawesome-free/css/all.css";
@import "~line-awesome/dist/line-awesome/css/line-awesome.css";
@import "assets/plugins/flaticon/flaticon.css";
@import "assets/plugins/flaticon2/flaticon.css";
@import "assets/plugins/keenthemes-icons/font/ki.css";

// Main demo style scss
@import "assets/sass/style.vue";

// Check documentation for RTL css
/*@import "assets/css/style.vue.rtl";*/
</style>

<script>
import { OVERRIDE_LAYOUT_CONFIG } from "@/core/services/store/config.module";
import {RESET_LAYOUT_CONFIG} from "./core/services/store/config.module";
import {local_url} from "@/api/LocalUrl";
export default {
  name: "ThingsPanel",
  
  mounted() {
    console.log("====location", document.location.protocol + "//" + document.location.host );

    this.$store.dispatch("setRouters");
    this.$store.commit("refresh_page");
    /**
     * this is to override the layout config using saved data from localStorage
     * remove this to use config only from static json (@/core/config/layout.config.json)
     */
    this.$store.dispatch(OVERRIDE_LAYOUT_CONFIG);
    window.localStorage.setItem("base_url", local_url);
  },
  beforeMount() {
    console.log("local_url", local_url)
    this.$store.dispatch(RESET_LAYOUT_CONFIG);
    // // show page loading
    // this.$store.dispatch(ADD_BODY_CLASSNAME, "page-loading");
    // // initialize html element classes
    // HtmlClass.init(this.layoutConfig());
  },
  created() {
    let theme = localStorage.getItem("style");
    let themeFile = "themes/default.css";
    if (theme){
      themeFile = "themes/" + theme + ".css";
    }
    document.getElementById('style').setAttribute("href", themeFile); //实现将主题保存在内存中刷新浏览器不改变
  }
};
</script>
