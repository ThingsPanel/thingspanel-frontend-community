/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-03-20 15:38:07
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-21 14:40:47
 * @FilePath: \ThingsPanel-Backend-Vue\src\core\services\store\app-store.module.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import StoreService from "../app-store.service"
import StoreAPI from "@/api/store"
export const LOGIN = "login_store";
const SET_LOGIN = "set_store_loginn";
const REFRESH_PAGE = "refresh_page"
export default {
    state: {
        isStoreAuthenticated: false,
        expiresAt: 0,
        storeUser: {},
    },
    getters: {
        /**
         * 获取登录状态
         * @param {*} state 
         * @returns 
         */
        getStoreAuthenticated(state) {
            return state.isStoreAuthenticated;
        },
        /**
         * 获取仓库登录用户
         * @param {*} state 
         * @returns 
         */
        getStoreUser(state) {
            return state.storeUser;
        }
    },
    mutations: {
        /**
         * 设置登录状态
         * @param {*} state 
         * @param {*} isStoreAuthenticated 
         */
        [SET_LOGIN](state, data) {
            state.isStoreAuthenticated = data.isAuth;
            state.expiresAt = Number(data.expiresAt);
            state.user = data.user || {};
        },
        [REFRESH_PAGE](state) {
            const now = Date.now();
            const token = StoreService.getToken();
            if (token) {
                const expiresAt = StoreService.getTokenExpired();
                if (now > Number(expiresAt)) {
                    // token失效
                    // state.isStoreAuthenticated = false;
                    StoreService.clearToken();
                } else {
                    state.isStoreAuthenticated = true;
                    state.expiresAt = Number(expiresAt);
                    state.user = StoreService.getUser();
                }
            }
        }
    },
    actions: {
      /**
       * 登录
       * @param {*} state 
       * @param {*} credentials 凭证
       * @returns 
       */     
      [LOGIN](state, credentials) {
        return new Promise((resolve, reject) => {
            StoreAPI.login(credentials)
                .then(({ data }) => {
                    if (data.code === 0) {
                        const { token, expiresAt, user } = data.data;
                        StoreService.setToken({ token, expiresAt, user });
                        // 设置登录状态
                        state.commit(SET_LOGIN, { user, expiresAt, isAuth: true});
                    }
                    resolve(data);
                })
                .catch(err => reject(err))
        })
      },
    }
  };
  