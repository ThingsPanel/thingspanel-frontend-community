<template>
  <v-navigation-drawer
    class="navigation-drawer"
    :mini-variant.sync="mini"
    permanent
  >
    <v-list>
      <!--  -->
      <NavItem v-if="UserType!=='TENANT_USER'" :item="homeNav" key="home"></NavItem>

      <template v-for="(item, index) in navs">
        <!--  list-group里是二级菜单  -->
        <NavGroup v-if="'children' in item" :item="item" :key="item.path"></NavGroup>
        <!--  一级的菜单  -->
        <NavItem v-else :item="item" :key="item.path + index"></NavItem>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
import NavGroup from "@/view/layout/aside/NavGroup";
import NavItem from "@/view/layout/aside/NavItem";
import router from "@/router";
import axios from "axios";
import JwtService from "@/core/services/jwt.service";

export default {
  name: "Navs",
  components: {
    NavGroup,
    NavItem,
  },
  data: () => ({
    mini: false,
    homeNav: {
      path: "/home",
      title: "MENU.HOME",
      icon: "flaticon2-architecture-and-city",
      children: [
        {
          path: "/home",
          title: "MENU.HOME",
          icon: "flaticon2-architecture-and-city",
        }
      ]
    }
  }),
  computed: {
    navs() {
      return this.$store.getters.getNavs
    },
    UserType() {
      return this.$store.getters.currentUser?.authority || JwtService.getCurrentUser()?.authority || "";
    }
  },
  methods: {
  },
  mounted() {
  },
};
</script>

<style lang="scss">
.navigation-drawer {
  // 去除导航栏父级背景色和宽度
  background-color: transparent !important;
  width: auto !important;

  // 导航图标
  .menu-icon {
    background: rgba(91, 146, 255, 0.2) !important;
    color: #3699ff !important;
    padding: 0 5px;
  }

  .v-list-item {
    height: 30px;
  }

  // 图标距离字体的间距
  .v-list-item__icon {
    margin: 12px 15px 0 0;
  }

  // 折叠菜单的图标颜色
  .v-list-group__header__append-icon i {
    color: #5b92ff !important;
  }
  // 折叠菜单父级的左边距
  .v-list-group__header,
  .v-list-item {
    padding: 0 1rem !important;
    margin-left: 1rem;
  }
  // 二级菜单的左边距
  .v-list-group__items .v-list-item {
    padding: 0 1rem !important;
    margin-left: 3rem;
  }

  // 去掉右边框
  .v-navigation-drawer__border {
    display: none !important;
  }

  // 激活状态
  .v-list-item--active {
    border-top-left-radius: 5px;
    border-bottom-left-radius: 5px;
    background: linear-gradient(
      to right,
      rgba(41, 56, 125, 0.95) 0%,
      transparent 100%
    ) !important;
    .v-list-item__title {
      color: #fff !important;
    }

    .menu-icon {
      background-color: #5b92ff !important;
      color: #fff !important;
    }
  }

  // 折叠菜单父级在激活时颜色不变，覆盖上面激活的样式
  .v-list-group__header {
    background: none !important;
    .v-list-item__title {
      color: #5b92ff !important;
    }
    .menu-icon {
      background: rgba(91, 146, 255, 0.2) !important;
      color: #3699ff !important;
    }
  }

  // 统一设定图标 包括右边折叠菜单的箭头
  .v-list-item__icon i {
    font-size: 1.18em;
    width: 24px;
    height: 24px;
    border-radius: 3px;
  }
  // 标题
  .v-list-item__title {
    color: #5b92ff !important;
  }
}
</style>