<template>
  <v-navigation-drawer
    class="navigation-drawer"
    :mini-variant.sync="mini"
    permanent
  >
    <v-list>
      <template v-for="(item, index) in navs">
        <!--  list-group里是二级菜单  -->
        <NavGroup
          v-if="'children' in item"
          :item="item"
          :key="item.link"
        ></NavGroup>
        <!--  一级的菜单  -->
        <NavItem v-else :item="item" :key="item.link + index"></NavItem>
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
import NavGroup from "@/view/layout/aside/NavGroup";
import NavItem from "@/view/layout/aside/NavItem";
import router from "@/router";

export default {
  name: "Navs",
  components: {
    NavGroup,
    NavItem,
  },
  data: () => ({
    mini: false,
    navs: [
      {
        name: "COMMON.HOME",
        icon: "menu-icon flaticon2-architecture-and-city",
        link: "/home",
      },
      {
        name: "COMMON.BUSINESS",
        icon: "menu-icon flaticon2-rhombus",
        link: "/list",
      },
      {
        name: "COMMON.DATAS",
        icon: "menu-icon flaticon2-list",
        link: "/data/index",
      }, // 数据管理
      // {name:"COMMON.DEVICE", icon: 'menu-icon flaticon2-rhombus', link: '/device'},
      {
        name: "COMMON.VISUALIZATION",
        icon: "menu-icon flaticon2-laptop",
        link: "/chart/list",
      },
      {
        name: "COMMON.AUTOMATION",
        icon: "menu-icon flaticon2-hourglass",
        link: "/strategy/list",
      },
      // {name:"COMMON.AUTOMATION", icon: 'menu-icon flaticon2-hourglass', link: '/strategy/list2'},
      {
        name: "COMMON.WARNINFO",
        icon: "menu-icon flaticon2-warning",
        link: "/alarm/list",
      },
      {
        name: "COMMON.SYSTEMLOG",
        icon: "menu-icon flaticon-open-box",
        open: false,
        children: [
          {
            name: "COMMON.OPERATIONLOG",
            icon: "menu-icon flaticon2-paper",
            link: "/log/list",
          },
          {
            name: "COMMON.EQUIPMENTLOG",
            icon: "menu-icon flaticon-interface-3",
            link: "/equipment/index",
          },
        ],
      },
      {
        name: "COMMON.PRODUCTMANAGEMENT",
        icon: "menu-icon flaticon2-gift-1",
        open: false,
        children: [
          {
            name: "COMMON.FIRMWAREUPGRADE",
            icon: "menu-icon flaticon-upload-1",
            link: "/firmware/index",
          },
        ],
      },
      // 规则引擎
      {
        name: "COMMON.RULEENGINE",
        icon: "menu-icon flaticon2-gift-1",
        open: false,
        children: [
          // 网络组件
          {
            name: "COMMON.NETWORKCOMPONENTS",
            icon: "menu-icon flaticon-upload-1",
            link: "/network_components/index",
          },
          // 数据转发
          {
            name: "COMMON.TRANSPOND",
            icon: "menu-icon flaticon-upload-1",
            link: "/transpond/index",
          }
        ],
      },
      {
        name: "COMMON.MARKET",
        icon: "menu-icon flaticon2-supermarket",
        link: "/market",
      },
      {
        name: "COMMON.USERS",
        icon: "menu-icon flaticon2-user",
        link: "/users/user",
      },
      // {
      //   name: "COMMON.SYSTEMSETUP",
      //   icon: "menu-icon flaticon2-gear",
      //   link: "/system/index",
      // },
      {name:"COMMON.SYSTEMMANAGEMENT", icon: 'menu-icon flaticon2-gear', 
      open:false, children: [
          {
            name:"COMMON.SYSTEMSETUP", 
            icon: 'menu-icon flaticon-upload-1', 
            link: '/system/index'
          },
          {
             name:"COMMON.MANAGEMENT", 
             icon: 'menu-icon flaticon-upload-1', 
             link: '/management/index'
          },
          //  {name:"COMMON.MANAGEMENT", icon: 'menu-icon flaticon-upload-1', link: '/management/index'},
        ]},
    ],
  }),

  mounted() {
    let routers = router.getRoutes();
    let navs = this.navs;
    let newNavs = [];

    // console.log("navs", navs);

    for (let i = 0; i < navs.length; i++) {

      //有子菜单
      if (navs[i].children) {
        let navTemp = [];
        let navChild = navs[i].children;
        for (let ic = 0; ic < navChild.length; ic++) {
          for (let ii = 0; ii < routers.length; ii++) {
            if (navChild[ic].link == routers[ii].path) {
              navTemp.push(navChild[ic]);
            }
          }
        }

        if (navTemp.length > 0) {
          navs[i].children = navTemp;
          newNavs.push(navs[i]);
        }
      } else {
        for (let ii = 0; ii < routers.length; ii++) {
          if (navs[i].link == routers[ii].path) {
            newNavs.push(navs[i]);
          }
        }
      }
    }

    this.navs = newNavs;
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
    padding-left: 1.5rem !important;
  }
  // 二级菜单的左边距
  .v-list-group__items .v-list-item {
    padding-left: 3rem !important;
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