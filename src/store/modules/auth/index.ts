import { computed, reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import { createDiscreteApi } from 'naive-ui';
import { useLoading } from '@sa/hooks';
import { SetupStoreId } from '@/enum';
import { useRouterPush } from '@/hooks/common/router';
import { fetchGetUserInfo, fetchLogin } from '@/service/api';
import { transformUser } from '@/service/api/auth';
import { localStg } from '@/utils/storage';
import { $t } from '@/locales';
import { encryptDataByRsa, generateRandomHexString, validPassword } from '@/utils/common/tool';
import { useRouteStore } from '../route';
import { useTabStore } from '../tab';
import { clearAuthStorage, getToken, getUserInfo } from './shared';

const { dialog } = createDiscreteApi(['dialog']);

export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const routeStore = useRouteStore();
  const { route, toLogin, redirectFromLogin, routerPush } = useRouterPush(false);
  const { loading: loginLoading, startLoading, endLoading } = useLoading();

  const token = ref(getToken());

  /** Is login */
  const isLogin = computed(() => Boolean(token.value));

  const userInfo: Api.Auth.UserInfo = reactive(getUserInfo());
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
    let newP = password;
    const data = localStorage.getItem('enableZcAndYzm') ? JSON.parse(localStorage.getItem('enableZcAndYzm')) : [];
    let salt: string | null = null;
    if (data.find(v => v.name === 'frontend_res')?.enable_flag === 'enable') {
      salt = generateRandomHexString(16);
      newP = encryptDataByRsa(password + salt);
    }
    const { data: loginToken, error } = await fetchLogin(userName, newP, salt);
    if (!error) {
      const { loop } = await loginByToken(loginToken);
      if (loop) {
        if (!validPassword(password)) {
          dialog.warning({
            content: '为了您的账户安全，密码应至少8位且包含字母、数字及符号，请重新设置密码。',
            positiveText: '确认',
            onPositiveClick: () => {
              routerPush({
                path: '/personal-center',
                query: {
                  password: 'invalid'
                }
              });
            },
            negativeText: '取消',
            onNegativeClick: async () => {
              await routeStore.initAuthRoute();
              await redirectFromLogin();
            }
          });
        } else {
          await routeStore.initAuthRoute();
          await redirectFromLogin();
        }

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
      const { info, loop } = await loginByToken(loginToken);

      clearTabs();
      if (loop) {
        await routeStore.initAuthRoute();
        await redirectFromLogin();
        if (routeStore.isInitAuthRoute) {
          window.$notification?.success({
            title: $t('page.login.common.loginSuccess'),
            content: $t('page.login.common.welcomeBack', {
              userName: info?.name
            }),
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

      return { loop: true, info };
    }

    return { loop: false, info };
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
