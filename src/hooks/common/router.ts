import { useRouter } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import type { LastLevelRouteKey, RouteKey } from '@elegant-router/types';
import { router as globalRouter } from '@/router';
// import { useAuthStore } from '@/store/modules/auth';

/**
 * Router push
 *
 * Jump to the specified route, it can replace function router.push
 *
 * @param inSetup Whether is in vue script setup
 */
export function useRouterPush(inSetup = true) {
  const router = inSetup ? useRouter() : globalRouter;
  const route = globalRouter.currentRoute;

  const routerPush = router.push;

  const routerBack = router.back;

  interface RouterPushOptions {
    query?: Record<string, string>;
    params?: Record<string, string>;
  }

  // const authStore = useAuthStore();

  async function routerPushByKey(key: LastLevelRouteKey | RouteKey, options?: RouterPushOptions) {
    const { query, params } = options || {};

    const routeLocation: RouteLocationRaw = {
      name: key
    };
    if (query) {
      routeLocation.query = query;
    }

    if (params) {
      routeLocation.params = params;
    }
    return routerPush(routeLocation);
  }

  async function toHome() {
    const home: LastLevelRouteKey = 'home';
    // if (authStore.userInfo.authority === 'SYS_ADMIN') {
    //   home = 'home';
    // } else {
    //   home = 'device';
    // }

    return routerPushByKey(home);
  }

  /**
   * Navigate to login page
   *
   * @param loginModule The login module
   * @param redirectUrl The redirect url, if not specified, it will be the current route fullPath
   */
  async function toLogin(loginModule?: UnionKey.LoginModule, redirectUrl?: string) {
    const module = loginModule || 'pwd-login';

    const options: RouterPushOptions = {
      params: {
        module
      }
    };
    let redirect = '';
    const is_remember_rath = localStorage.getItem('isRememberPath');

    if (is_remember_rath === '1') {
      redirect = redirectUrl || route.value.fullPath;
    }

    if (redirect) {
      options.query = {
        redirect
      };
    }

    return routerPushByKey('login', options);
  }

  /**
   * Toggle login module
   *
   * @param module
   */
  async function toggleLoginModule(module: UnionKey.LoginModule) {
    const query = route.value.query as Record<string, string>;

    return routerPushByKey('login', { query, params: { module } });
  }

  /** Redirect from login */
  async function redirectFromLogin() {
    const redirect = route.value.query?.redirect as string;

    if (redirect) {
      routerPush(redirect);
    } else {
      toHome();
    }
  }

  return {
    route,
    routerPush,
    routerBack,
    routerPushByKey,
    toLogin,
    toggleLoginModule,
    redirectFromLogin
  };
}
