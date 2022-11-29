<template>
  <!-- begin:: Header Topbar -->
  <div class="topbar">

    <!--begin: Language bar -->
    <div class="topbar-item">
      <el-select v-model="themeValue" placeholder="主题颜色" @change="handleChangeTheme">
        <el-option v-for="(theme, index) in themeOptions" :key="index" :label="theme.label" :value="theme.value" ></el-option>
      </el-select>

      <b-dropdown size="sm" variant="link" toggle-class="btn btn-icon btn-clean btn-dropdown btn-lg mr-1 text-decoration-none"
        no-caret right no-flip>

        <template v-slot:button-content>
          <img class="h-20px w-20px rounded-sm" :src="languageFlag || getLanguageFlag" alt=""/>
        </template>

        <b-dropdown-text tag="div" style="width: 175px;">
          <KTDropdownLanguage v-on:language-changed="onLanguageChanged"></KTDropdownLanguage>
        </b-dropdown-text>

      </b-dropdown>
    </div>
    <!--end: Language bar -->

    <!--begin: User Bar -->
    <KTQuickUser></KTQuickUser>
    <!--end: User Bar -->
  </div>
  <!-- end:: Header Topbar -->
</template>

<style lang="scss">
.topbar {
  .dropdown-toggle {
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

  .dropdown-menu {
    margin: 0;
    padding: 0;
    outline: none;
    .b-dropdown-text {
      padding: 0;
    }
  }
}
</style>

<script>
// import KTSearchDefault from "@/view/layout/extras/dropdown/SearchDefault.vue";
// import KTDropdownNotification from "@/view/layout/extras/dropdown/DropdownNotification.vue";
// import KTDropdownQuickAction from "@/view/layout/extras/dropdown/DropdownQuickAction.vue";
// import KTDropdownMyCart from "@/view/layout/extras/dropdown/DropdownMyCart.vue";
import KTDropdownLanguage from "@/view/layout/extras/dropdown/DropdownLanguage.vue";
import KTQuickUser from "@/view/layout/extras/offcanvas/QuickUser.vue";
// import KTQuickPanel from "@/view/layout/extras/offcanvas/QuickPanel.vue";
import i18nService from "@/core/services/i18n.service.js";

export default {
  name: "KTTopbar",
  data() {
    return {
      languageFlag: process.env.BASE_URL + "media/svg/flags/034-china.svg",
      languages: i18nService.languages,
      themeValue: "default",
      themeOptions: [
        { label: "默认", value: "default" },
        { label: "白色", value: "white" }
      ]
    };
  },
  components: {
    // KTSearchDefault,
    // KTDropdownNotification,
    // KTDropdownQuickAction,
    // KTDropdownMyCart,
    KTDropdownLanguage,
    KTQuickUser
    // KTQuickPanel
  },
  created() {
    // 初始化
    this.onLanguageChanged();
    //
    let style = localStorage.getItem("style");
    if (style && style == "themes/white.css") {
      this.themeValue = "white";
    }
  },
  methods: {
    onLanguageChanged() {
      this.languageFlag = this.languages.find(val => {
        return val.lang === i18nService.getActiveLanguage();
      }).flag;
    },
    /**
     * 选择主题
     * @param v
     */
    handleChangeTheme(v) {
      // let themeFile = "themes/default.css";
      // if (v == "white") {
      //   themeFile = "themes/white.css";
      // }
      // document.getElementById('style').setAttribute("href", themeFile);
      // localStorage.setItem("style", themeFile);
    }
  },
  computed: {
    getLanguageFlag() {
      return this.onLanguageChanged();
    }
  }
};
</script>
