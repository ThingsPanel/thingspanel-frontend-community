import { computed, reactive, ref } from 'vue'
import { defineStore } from 'pinia'
import moment from 'moment'
import { SetupStoreId } from '@/enum'
import { useLoading } from '@sa/hooks'
import { useRouterPush } from '@/hooks/common/router'
import { fetchGetUserInfo, fetchLogin, logout } from '@/service/api'
import { transformUser } from '@/service/api/auth'
import { localStg } from '@/utils/storage'
import { $t } from '@/locales'
import { encryptDataByRsa, generateRandomHexString, validPassword } from '@/utils/common/tool'
import { useRouteStore } from '../route'
import { useTabStore } from '../tab'
import { clearAuthStorage, getToken, getUserInfo } from './shared'
import { clearThingsVisToken } from '@/utils/thingsvis'

export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const routeStore = useRouteStore()
  const { route, toLogin, redirectFromLogin } = useRouterPush(false)
  const { loading: loginLoading, startLoading, endLoading } = useLoading()

  const token = ref(getToken())

  /** Is login */
  const isLogin = computed(() => Boolean(token.value))

  const userInfo: Api.Auth.UserInfo = reactive(getUserInfo())
  /** Reset auth store */
  async function resetStore() {
    const authStore = useAuthStore()

    clearAuthStorage()
    clearThingsVisToken()

    authStore.$reset()

    if (!route.value.meta.constant) {
      await toLogin()
    }

    await routeStore.resetStore()
  }

  /**
   * Login
   *
   * @param userName User name
   * @param password Password
   */
  async function login(userName: string, password: string) {
    startLoading()
    try {
      let newP = password
      const data = localStorage.getItem('enableZcAndYzm') ? JSON.parse(localStorage.getItem('enableZcAndYzm')!) : []
      let salt: string | null = null
      if (data.find(v => v.name === 'frontend_res')?.enable_flag === 'enable') {
        salt = generateRandomHexString(16)
        newP = encryptDataByRsa(password + salt)
      }

      const { data: loginToken } = await fetchLogin(userName, newP, salt ?? null)
      if (!loginToken) {
        await resetStore()
        return
      }

      const { loop, info } = await loginByToken(loginToken)
      if (loop && info) {
        const password_last_updated = info.password_last_updated
        const now = new Date()
        const cha = moment(now).diff(password_last_updated, 'days')
        const tipFunc = async () => {
          // dialog.warning({
          //   content: str,
          //   positiveText: $t('common.confirm'),
          //   onPositiveClick: () => {
          //     routerPush({
          //       path: '/personal-center',
          //       query: {
          //         password: 'invalid'
          //       }
          //     })
          //   },
          //   negativeText: $t('common.cancel'),
          //   onNegativeClick: async () => {
          //     await routeStore.initAuthRoute()
          //     await redirectFromLogin()
          //   }
          // })
          await routeStore.initAuthRoute()
          await redirectFromLogin()
        }

        if (!validPassword(password)) {
          tipFunc()
        } else if (!info.password_last_updated || cha > 90) {
          tipFunc()
        } else {
          await routeStore.initAuthRoute()
          await redirectFromLogin()
        }
      }
    } catch {
      await resetStore()
    } finally {
      endLoading()
    }
  }

  /**
   * enter
   *
   * @param userId userId
   */
  async function enter(userId: string) {
    startLoading()
    const { clearTabs } = useTabStore()
    const { data: loginToken, error } = await transformUser({
      become_user_id: userId
    })

    if (!error) {
      const { info, loop } = await loginByToken(loginToken)

      clearTabs()
      if (loop) {
        await routeStore.initAuthRoute()
        await redirectFromLogin()
        if (routeStore.isInitAuthRoute) {
          window.$notification?.success({
            title: $t('page.login.common.loginSuccess'),
            content: $t('page.login.common.welcomeBack', {
              userName: info?.name
            }),
            duration: 4500
          })
        }
      }
    } else {
      await resetStore()
    }

    endLoading()
  }

  async function loginByToken(loginToken: Api.Auth.LoginToken) {
    // 1. stored in the localStorage, the later requests need it in headers
    localStg.set('token', loginToken.token)
    localStg.set('refreshToken', loginToken.refreshToken)
    const expires_in = Date.now() + loginToken.expires_in * 1000
    localStg.set('token_expires_in', expires_in.toString())

    const { data: info, error } = await fetchGetUserInfo()

    if (!error) {
      // 2. store user info
      info.roles = [info.authority]
      localStg.set('userInfo', info)
      // 3. update auth route
      token.value = loginToken.token
      Object.assign(userInfo, info)

      // 4. 清除 ThingsVis token 缓存，确保使用新用户身份重新交换 SSO token
      clearThingsVisToken()

      return { loop: true, info }
    }

    return { loop: false, info }
  }
  async function requestLogout() {
    await logout()
    resetStore()
  }

  return {
    token,
    userInfo,
    isLogin,
    loginLoading,
    resetStore,
    login,
    enter,
    requestLogout,
    loginByToken
  }
})
