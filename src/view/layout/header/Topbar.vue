<template>
  <!-- begin:: Header Topbar -->
  <div class="topbar">
        <div class="header_url">
          <a style="color: white;" href="http://thingspanel.io/" target="_blank">{{ $t('COMMON.DOCUMENTATION') }}</a>
        </div>
        <div class="header_url">
          <el-tooltip class="item" placement="bottom-start" effect="light">
            <div slot="content" style="width: 9vw;">
              <el-row type="flex" align="middle" style="flex-wrap: wrap">
                <el-col :span=7 style="padding-left: 1vw;">
                  <div>{{ $t('COMMON.QQ') }}</div>
                </el-col>
                <el-col :span=17>
                  <img :src="imageSrcQQ" alt="" style="width: 80%;">
                  <div style="width: 100%; text-align:center; padding-right: 30px; padding-top: 10px;">{{ $t('COMMON.QQ_GROUP_NUMBER') + ": 371794256" }}</div>
                </el-col>
                <el-col :span=24>
                  <el-divider></el-divider>
                </el-col>
                <el-col :span=7 style="padding-left: 1vw;">
                  <div>{{ $t('COMMON.WECHAT') }}</div>
                </el-col>
                <el-col :span=17>
                  <img :src="imageSrcWeChat" alt="" style="width: 80%;">
                </el-col>
              </el-row>
            </div>
            <div>{{ $t('COMMON.COMMUNITY') }}</div>
          </el-tooltip>
        </div>
    <!--begin: Language bar -->
    <div class="topbar-item">
      <!-- <el-select class="topbar-select" v-model="themeValue" placeholder="主题颜色" @change="handleChangeTheme">
        <el-option v-for="(theme, index) in themeOptions" :key="index" :label="theme.label" :value="theme.value" ></el-option>
      </el-select> -->

      <b-dropdown size="sm" variant="link" toggle-class="btn btn-icon btn-clean btn-dropdown btn-lg mr-1 text-decoration-none"
        no-caret right no-flip>

        <template v-slot:button-content>
          <img class="h-30px w-30px rounded-sm mad" :src="languageFlag || getLanguageFlag" alt=""/>
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



<script>
import KTDropdownLanguage from "@/view/layout/extras/dropdown/DropdownLanguage.vue";
import KTQuickUser from "@/view/layout/extras/offcanvas/QuickUser.vue";
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
        { label: "白色", value: "white" },
      ],
      imageSrcQQ: require('/src/assets/images/qq.jpg'),
      imageSrcWeChat: require('/src/assets/images/weixin.jpeg')
    };
  },
  components: {
    KTDropdownLanguage,
    KTQuickUser
  },
  created() {
    // 初始化
    this.onLanguageChanged();
    let style = localStorage.getItem("style");
    if (style) {
      this.themeValue = style;
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
    handleChangeTheme(theme) {
      let themeFile = "themes/" + theme + ".css";
      document.getElementById('style').setAttribute("href", themeFile);
      localStorage.setItem("style", theme);
    }
  },
  computed: {
    getLanguageFlag() {
      return this.onLanguageChanged();
    }
  }
};
</script>

<style lang="scss">
.header_url{
  padding: 4% 30px 0 0;
  color: #fff;
}
.topbar {
  .el-input__inner{
    height: 30px;
    line-height: 30px;
  }
  .topbar-select{
    .el-input__suffix{
      top:7px;
    }

  }
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