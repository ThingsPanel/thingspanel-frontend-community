<!--
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-07-31 10:24:33
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-10-31 17:40:29
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\layout\brand\Brand.vue
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
-->
<template>
  <!-- begin:: Aside -->
  <div class="brand flex-column-auto" id="kt_brand" ref="kt_brand">
    <div class="brand-logo">
<!--      <router-link to="/home">-->
        <img :src="siteLogo()" alt="Logo" class="headerlogo" />
<!--      </router-link>-->
    </div>
    <div class="brand-tools" v-if="allowMinimize">
      <button
        class="brand-toggle btn btn-sm px-0"
        id="kt_aside_toggle"
        ref="kt_aside_toggle"
      >
        <span class="svg-icon svg-icon svg-icon-xl">
          <inline-svg
            class="svg-icon"
            src="/media/svg/icons/Navigation/Angle-double-left.svg"
          />
        </span>
      </button>
    </div>
  </div>
  <!-- end:: Aside -->
</template>

<style lang="scss" scoped>
.aside-toggle {
  outline: none;
}
.headerlogo{
    height: 45px;
}
</style>

<script>
import { mapGetters } from "vuex";
import objectPath from "object-path";
import KTLayoutBrand from "@/assets/js/layout/base/brand.js";
import KTLayoutAsideToggle from "@/assets/js/layout/base/aside-toggle.js";

export default {
  name: "KTBrand",
  mounted() {
    // Init Brand Panel For Logo
    KTLayoutBrand.init(this.$refs["kt_brand"]);

    // Init Aside Menu Toggle
    KTLayoutAsideToggle.init(this.$refs["kt_aside_toggle"]);
  },
  methods: {
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
      if (logo[0] != "/" && !logo.startsWith("http")) {
        logo = "/" + logo;
      }

      return logo;
    }
  },
  computed: {
    ...mapGetters(["layoutConfig"]),

    allowMinimize() {
      return !!this.layoutConfig("aside.self.minimize.toggle");
    }
  }
};
</script>
