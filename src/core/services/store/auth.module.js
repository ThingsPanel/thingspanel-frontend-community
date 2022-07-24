import ApiService from "@/core/services/api.service";
import JwtService from "@/core/services/jwt.service";
// 登录和用户详情接口
import { login, logout, me } from "@/api/auth";

// 引入路由下面调用 router.push 跳转
import router from "@/router"
import {getRedToken} from "@/api/transpond";
import RED from "@/core/services/red.module"


// action types
export const VERIFY_AUTH = "verifyAuth";
export const LOGIN = "login";
export const LOGOUT = "logout";
export const REFRESH = "refresh";
export const REGISTER = "register";
export const UPDATE_USER = "updateUser";

// mutation types
export const PURGE_AUTH = "logOut";
export const SET_AUTH = "setUser";
export const SET_ERROR = "setError";

const local_url =
  (process.env.VUE_APP_BASE_URL ||
    document.location.protocol + "//" + document.domain + ":9999/") + "api";
const state = {
  errors: "",
  user: {},
  isAuthenticated: !!JwtService.getToken(),
  userid: "",
};

const worryinfo = "";

const getters = {
  currentUser(state) {
    return state.user;
  },
  isAuthenticated(state) {
    return state.isAuthenticated;
  },
};

const actions = {
  [LOGIN](context, credentials) {
    return new Promise((resolve, reject) => {
      login(credentials).then(({ data }) => {
          if (data.code == 200) {
            context.commit(SET_AUTH, data);
            // 保存 token 和 过期时间
            JwtService.saveToken(data.data.access_token);
            JwtService.saveExpiresTime(data.data.expires_in)

            // 设置node-red的令牌
            getRedToken().then(res => {
              if (res.status == 200) {
                RED.setRedToken(res.data)
              }
            })

            // 登录成功，延迟 500 ms 再跳转
            setTimeout(()=>{
              router.push({name: "home"})
            }, 500)



          }

          resolve(data);
        })
        .catch(({ response }) => {
          reject(response)
          // console.log(response);
          context.commit(SET_ERROR, response.data.errors || "");
          // console.log(state);
        });
    });
  },
  [REFRESH](context) {
    // console.log('store refresh token')
    // 刷新 token 移到 http.js 中刷新
    // 页面中还有调用此方法

    // ApiService.post(local_url + "/auth/refresh")
    //   .then(({ data }) => {
    //     if (data.code == 200) {
    //       JwtService.saveToken(data.data.access_token);
	// 	  ApiService.setHeader();
    //     } else {
    //       context.commit(PURGE_AUTH);
    //     }
    //     window.location.reload();
    //   })
    //   .catch(({ response }) => {
    //     context.commit(PURGE_AUTH);
    //   });
  },
  [LOGOUT](context) {
    // ApiService.post(local_url + "/auth/logout")
    logout()
      .then(({ data }) => {
        if (data.code == 200) {
          context.commit(PURGE_AUTH);
        }
      })
      .catch(({ response }) => {});
  },
  [REGISTER](context, credentials) {
    return new Promise((resolve, reject) => {
      ApiService.post(local_url + "/user/add", credentials)
        .then(({ data }) => {
          // console.log(data);
          if (data.code !== 200) {
            if (data.data.name !== undefined) {
              alert(data.data.name[0]);
            } else if (data.data.email !== undefined) {
              alert(data.data.email[0]);
            } else if (data.data.mobile !== undefined) {
              alert(data.data.mobile[0]);
            }
          }
          // context.commit(SET_AUTH, data);
          resolve(data);
        })
        .catch(({ response }) => {
          /*context.commit(SET_ERROR, response.data.errors);
          reject(response);*/
        });
    });
  },
  [VERIFY_AUTH](context) {
    // console.log(JwtService.getToken());
    if (JwtService.getToken()) {
      // ApiService.setHeader();
      // ApiService.post(local_url + "/auth/me")
      me()
          .then(({ data }) => {
          if (data.code == 200) {
            console.log(data);
            data.data.token = JwtService.getToken();
            data.data.userid = data.data.id;
            context.commit(SET_AUTH, data.data);
          } else {
            this.$store
              .dispatch(LOGOUT)
              .then(() => this.$router.push({ name: "login" }));
          }
        })
        .catch(({ response }) => {
          // context.commit(SET_ERROR, response.data.errors);
        });
    } else {
      context.commit(PURGE_AUTH);
    }
  },
  [UPDATE_USER](context, payload) {
    // console.log(context);
    // console.log(payload);
    const { email, username, password, image, bio } = payload;
    const user = { email, username, bio, image };
    if (password) {
      user.password = password;
    }
    return ApiService.post(local_url + "/user/edit", payload).then(
      ({ data }) => {
        console.log(data);
        // context.commit(SET_AUTH, data);
        return data;
      }
    );
  },
};

const mutations = {
  [SET_ERROR](state, error) {
    state.errors = error;
  },
  [SET_AUTH](state, user) {
    state.isAuthenticated = true;
    state.user = user;
    state.user.name = user.name;
    state.errors = "";
    JwtService.saveToken(state.user.token);
    state.userid = user.userid;
  },
  [PURGE_AUTH](state) {
    state.isAuthenticated = false;
    state.user = {};
    state.errors = "";
    JwtService.destroyToken();
  },
};

export default {
  local_url,
  state,
  actions,
  mutations,
  getters,
  worryinfo,
};
