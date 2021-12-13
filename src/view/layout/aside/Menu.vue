<template>
  <ul class="menu-nav">
    <router-link
      to="/home"
      v-slot="{ href, navigate, isActive, isExactActive }"
    >
      <li
        aria-haspopup="true"
        data-menu-toggle="hover"
        class="menu-item adminmeue"
        :class="[
          isActive && 'menu-item-active',
          isExactActive && 'menu-item-active'
        ]"
      >
        <a :href="href" class="menu-link" @click="navigate">
          <i class="menu-icon flaticon2-architecture-and-city"></i>
          <span class="menu-text">{{ $t("COMMON.HOME") }}</span>
        </a>
      </li>
    </router-link>
    <router-link
            to="/list"
            v-slot="{ href, navigate, isActive, isExactActive }"
    >
      <li
              aria-haspopup="true"
              data-menu-toggle="hover"
              class="menu-item adminmeue"
              :class="[
          isActive && 'menu-item-active',
          isExactActive && 'menu-item-active'
        ]"
      >
        <a :href="href" class="menu-link" @click="navigate">
          <i class="menu-icon flaticon2-rhombus"></i>
          <span class="menu-text">{{ $t("COMMON.BUSINESS") }}</span>
        </a>
      </li>
    </router-link>
    <router-link
            to="/strategy/list"
            v-slot="{ href, navigate, isActive, isExactActive }"
    >
      <li
              aria-haspopup="true"
              data-menu-toggle="hover"
              class="menu-item adminmeue"
              :class="[
          isActive && 'menu-item-active',
          isExactActive && 'menu-item-active'
        ]"
      >
        <a :href="href" class="menu-link" @click="navigate">
          <i class="menu-icon flaticon2-hourglass"></i>
          <span class="menu-text">{{ $t("COMMON.AUTOMATION") }}</span>
        </a>
      </li>
    </router-link>
    <router-link
            to="/chart/list"
            v-slot="{ href, navigate, isActive, isExactActive }"
    >
      <li
              aria-haspopup="true"
              data-menu-toggle="hover"
              class="menu-item"
              :class="[
          isActive && 'menu-item-active',
          isExactActive && 'menu-item-active'
        ]"
      >
        <a :href="href" class="menu-link" @click="navigate">
          <i class="menu-icon flaticon2-laptop"></i>
          <span class="menu-text">{{ $t("COMMON.VISUALIZATION") }}</span>
        </a>
      </li>
    </router-link>
    <router-link
            to="/datas/index"
            v-slot="{ href, navigate, isActive, isExactActive }"
    >
      <li
              aria-haspopup="true"
              data-menu-toggle="hover"
              class="menu-item adminmeue"
              :class="[
          isActive && 'menu-item-active',
          isExactActive && 'menu-item-active'
        ]"
      >
        <a :href="href" class="menu-link" @click="navigate">
          <i class="menu-icon flaticon2-list"></i>
          <span class="menu-text">{{ $t("COMMON.DATAS") }}</span>
        </a>
      </li>
    </router-link>
    <router-link
      to="/market"
      v-slot="{ href, navigate, isActive, isExactActive }"
    >
      <li
        aria-haspopup="true"
        data-menu-toggle="hover"
        class="menu-item adminmeue"
        :class="[
          isActive && 'menu-item-active',
          isExactActive && 'menu-item-active'
        ]"
      >
        <a :href="href" class="menu-link" @click="navigate">
          <i class="menu-icon flaticon2-supermarket"></i>
          <span class="menu-text">{{ $t("COMMON.MARKET") }}</span>
        </a>
      </li>
    </router-link>
    <!-- <router-link
            to="/production/index"
            v-slot="{ href, navigate, isActive, isExactActive }"
    >
      <li
              aria-haspopup="true"
              data-menu-toggle="hover"
              class="menu-item adminmeue"
              :class="[
          isActive && 'menu-item-active',
          isExactActive && 'menu-item-active'
        ]"
      >
        <a :href="href" class="menu-link" @click="navigate">
          <i class="menu-icon flaticon2-paper"></i>
          <span class="menu-text">{{ $t("COMMON.PRODUCTION") }}</span>
        </a>
      </li>
    </router-link> -->
    <router-link
      to="/users/user"
      v-slot="{ href, navigate, isActive, isExactActive }"
    >
      <li
        aria-haspopup="true"
        data-menu-toggle="hover"
        class="menu-item adminmeue"
        :class="[
          isActive && 'menu-item-active',
          isExactActive && 'menu-item-active'
        ]"
      >
        <a :href="href" class="menu-link" @click="navigate">
          <i class="menu-icon flaticon2-user"></i>
          <span class="menu-text">{{ $t("COMMON.USERS") }}</span>
        </a>
      </li>
    </router-link>
    <router-link
            to="/alarm/list"
            v-slot="{ href, navigate, isActive, isExactActive }"
    >
      <li
              aria-haspopup="true"
              data-menu-toggle="hover"
              class="menu-item adminmeue"
              :class="[
          isActive && 'menu-item-active',
          isExactActive && 'menu-item-active'
        ]"
      >
        <a :href="href" class="menu-link" @click="navigate">
          <i class="menu-icon flaticon2-warning"></i>
          <span class="menu-text">{{ $t("COMMON.WARNINFO") }}</span>
        </a>
      </li>
    </router-link>
    <router-link
            to="/log/list"
            v-slot="{ href, navigate, isActive, isExactActive }"
    >
      <li
              aria-haspopup="true"
              data-menu-toggle="hover"
              class="menu-item adminmeue"
              :class="[
          isActive && 'menu-item-active',
          isExactActive && 'menu-item-active'
        ]"
      >
        <a :href="href" class="menu-link" @click="navigate">
          <i class="menu-icon flaticon2-paper"></i>
          <span class="menu-text">{{ $t("COMMON.OPERATIONLOG") }}</span>
        </a>
      </li>
    </router-link>
  </ul>
</template>

<script>
import ApiService from "@/core/services/api.service";
import AUTH from "@/core/services/store/auth.module";
export default {
  name: "KTMenu",
  mounted() {
    //普通用户隐藏其他菜单
    var url = AUTH.local_url + '/auth/me';
    ApiService.post(url)
      .then(({data}) => {
        console.log(data);
        if (data.code == 200) {
          if(data.data.is_admin==1){
            var aa = document.getElementsByClassName("adminmeue");
            for(var i=0;i<aa.length;i++){
              aa[i].style.display='none';
            }
          }
        } else if (data.code == 401) {
          this.$store
                  .dispatch(LOGOUT)
                  .then(() => this.$router.push({name: "login"}));
        } else {

        }
      });
  },
  methods: {
    hasActiveChildren(match) {
      return this.$route["path"].indexOf(match) !== -1;
    }
  }
};
</script>
