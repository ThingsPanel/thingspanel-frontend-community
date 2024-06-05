import { computed, reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import { useLoading } from '@sa/hooks';
import { SetupStoreId } from '@/enum';
import { useRouterPush } from '@/hooks/common/router';
import { fetchGetUserInfo, fetchLogin } from '@/service/api';
import { transformUser } from '@/service/api/auth';
import { localStg } from '@/utils/storage';
import { $t } from '@/locales';
import { useRouteStore } from '../route';
import { useTabStore } from '../tab';
import { clearAuthStorage, getToken, getUserInfo } from './shared';

export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const routeStore = useRouteStore();
  const { route, toLogin, redirectFromLogin } = useRouterPush(false);
  const { loading: loginLoading, startLoading, endLoading } = useLoading();

  const token = ref(getToken());

  const userInfo: Api.Auth.UserInfo = reactive(getUserInfo());

  /** Is login */
  const isLogin = computed(() => Boolean(token.value));

  /** Reset auth store */
  async function resetStore() {
    const authStore = useAuthStore();

    clearAuthStorage();

    authStore.$reset();

    if (!route.value.meta.constant) {
      await toLogin();
    }

    await routeStore.resetStore();
  }

  /**
   * Login
   *
   * @param userName User name
   * @param password Password
   */
  async function login(userName: string, password: string) {
    startLoading();

    const { data: loginToken, error } = await fetchLogin(userName, password);

    if (!error) {
      const pass = await loginByToken(loginToken);

      if (pass) {
        await routeStore.initAuthRoute();

        await redirectFromLogin();

        // if (routeStore.isInitAuthRoute) {
        //   window.$notification?.success({
        //     title: $t('page.login.common.loginSuccess'),
        //     content: $t('page.login.common.welcomeBack', { userName: userInfo.name }),
        //     duration: 4500
        //   });
        // }
      }
    } else {
      await resetStore();
    }

    endLoading();
  }

  /**
   * enter
   *
   * @param userId userId
   */
  async function enter(userId: string) {
    startLoading();
    const { clearTabs } = useTabStore();
    const { data: loginToken, error } = await transformUser({
      become_user_id: userId
    });

    if (!error) {
      const pass = await loginByToken(loginToken);

      clearTabs();

      if (pass) {
        await routeStore.initAuthRoute();

        await redirectFromLogin();

        if (routeStore.isInitAuthRoute) {
          window.$notification?.success({
            title: $t('page.login.common.loginSuccess'),
            content: $t('page.login.common.welcomeBack', { userName: userInfo.userName }),
            duration: 4500
          });
        }
      }
    } else {
      await resetStore();
    }

    endLoading();
  }

  async function loginByToken(loginToken: Api.Auth.LoginToken) {
    // 1. stored in the localStorage, the later requests need it in headers
    localStg.set('token', loginToken.token);
    localStg.set('refreshToken', loginToken.refreshToken);
    const expires_in = Date.now() + loginToken.expires_in * 1000;
    localStg.set('token_expires_in', expires_in.toString());

    const { data: info, error } = await fetchGetUserInfo();

    if (!error) {
      // 2. store user info
      info.roles = [info.authority];
      localStg.set('userInfo', info);
      // 3. update auth route
      token.value = loginToken.token;
      Object.assign(userInfo, info);

      return true;
    }

    return false;
  }

  return {
    token,
    userInfo,
    isLogin,
    loginLoading,
    resetStore,
    login,
    enter
  };
});
