import ApiService from "@/core/services/api.service";
import JwtService from "@/core/services/jwt.service";
import PermissionService from "../permission.service"

// 登录和用户详情接口
import { login, logout, getUserInfo } from "@/api/auth";
import Perm from "@/api/permission"
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
export const SET_ROUTERS = "setRouters"
export const GET_ROUTERS = "getRouters"

// mutation types
export const PURGE_AUTH = "logOut";
export const SET_AUTH = "setUser";
export const SET_ERROR = "setError";


const local_url = process.env.VUE_APP_BASE_URL  || document.location.origin;
const base_url = local_url + (local_url.endsWith("/") ? "api" : "/api");

const state = {
  errors: "",
  user: {},
  isAuthenticated: !!JwtService.getToken(),
  userid: "",
  // 是否开启了node-red认证
  isRedAuthStarted: false,
  // 权限
  permissions: [],
  // 导航菜单
  navs: [],
  // 授权
  authority: []
};

const worryinfo = "";

const getters = {
  currentUser(state) {
    return state.user || JwtService.getCurrentUser();
  },
  isAuthenticated(state) {
    return state.isAuthenticated;
  },
  isRedAuthStarted(state) {
    return state.isRedAuthStarted;
  },
  getNavs(state) {
    return state.navs;
  },
  getAuth(state) {
    return state.authority;
  }
};

const actions = {
  [LOGIN](context, credentials) {
    console.log("====Login", local_url);
    return new Promise((resolve, reject) => {
      login(credentials).then(({ data }) => {
          if (data.code == 200) {
            // 保存 token 和 过期时间
            JwtService.saveToken(data.data.access_token);
            JwtService.saveExpiresTime(data.data.expires_in)

            PermissionService.clearPermissions();
            // 获取用户菜单
            context.dispatch(SET_ROUTERS).catch()
            // 保存用户状态: 用户信息，登录状态，token
            context.commit(SET_AUTH, data.data);
            getUserInfo()
                .then(({data}) => {
                  if (data.code == 200) {
                    let user = data.data;
                    state.user = user;
                    state.user.name = user.name;
                    state.errors = "";
                    JwtService.saveCurrentUser(user);
                  }
                })



            if (state.isRedAuthStarted) {
              console.log("==============getRedToken===============")
              // 设置node-red的令牌
              getRedToken()
                  .then(res => {
                    if (res.status == 200) {
                      RED.setRedToken(res.data)
                    }
                  })
                  .catch(err => {
                    console.log(err)
                  })
            }

            // 登录成功，延迟 500 ms 再跳转
            setTimeout(() => {
              router.push({name: "home"}).catch(() =>{
                location.reload();
              });
            }, 500)
          }

          resolve(data);
        })
        .catch(({ response }) => {
          reject(response)
          console.log(response);
          context.commit(SET_ERROR, response.data.errors || "");
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
          PermissionService.clearPermissions();
          JwtService.removeCurrentUser();
          context.commit(PURGE_AUTH);
        }
      })
      .catch(({ response }) => {});
  },
  [REGISTER](context, credentials) {
    return new Promise((resolve, reject) => {
      ApiService.post(base_url + "/user/add", credentials)
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
      // getUserInfo()
      //     .then(({ data }) => {
      //     if (data.code == 200) {
      //       console.log(data);
      //       data.data.token = JwtService.getToken();
      //       data.data.userid = data.data.id;
      //       context.commit(SET_AUTH, data.data);
      //     } else {
      //       // this.$store
      //       //   .dispatch(LOGOUT)
      //       //   .then(() => this.$router.push({ name: "login" }));
      //     }
      //   })
      //   .catch(({ response }) => {
      //     // context.commit(SET_ERROR, response.data.errors);
      //   });
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
    return ApiService.post(base_url + "/user/edit", payload).then(
      ({ data }) => {
        console.log(data);
        // context.commit(SET_AUTH, data);
        return data;
      }
    );
  },
  [SET_ROUTERS]() {
    return new Promise((resolve, reject) => {
      if (PermissionService.getPermissions()) {
        // 从缓存中读取路由
        state.permissions = PermissionService.getPermissions();
        // 获取菜单
        state.navs = state.permissions['menu_tree'];
        // 获取按钮权限
        state.authority = state.permissions['other_list']

        // 添加菜单路由
        addPermissionsToRoutes(state.permissions['menu_tree'], router)
        // 添加页面路由
        addPermissionsToRoutes(state.permissions['page_tree'], router)
        resolve({code: 200});
      } else {
        // 如果缓存中没有路由数据，则从服务器读取
        Perm.getPermissions()
            .then(({data}) => {
              if (data.code == 200) {
                state.permissions = data.data;
                // 存储permissions
                PermissionService.savePermissions(state.permissions);
                // 获取导航菜单
                state.navs = state.permissions['menu_tree'];
                // 获取按钮权限
                state.authority = state.permissions['other_list']

                // 添加菜单路由
                addPermissionsToRoutes(state.permissions['menu_tree'], router)
                // 添加页面路由
                addPermissionsToRoutes(state.permissions['page_tree'], router)
                resolve({code: 200});
              } else {
                resolve({code: 400});
              }
            })
            .catch((err) => reject(err))
      }
    })
  }
};

const mutations = {
  [SET_ERROR](state, error) {
    state.errors = error;
  },
  [SET_AUTH](state, user) {
    state.isAuthenticated = true;
    state.user = user;
    state.errors = "";
    // JwtService.saveToken(state.user.token);
    state.userid = user.userid;
  },
  [PURGE_AUTH](state) {
    state.isAuthenticated = false;
    state.user = {};
    state.errors = "";
    JwtService.destroyToken();
  },
};

export default {local_url, state, actions, mutations, getters, worryinfo,};

const addPermissionsToRoutes = (perms, router) => {
  if (!perms) {
    return;
  }
  // 动态绑定路由
  perms.forEach(permission => {
    if (permission.children) {
      permission.children.forEach(e => {
        let route = permissionToRoute(e);
        if (route) {
          router.addRoute('Layout', route);
        }
      })
    } else {
      let route = permissionToRoute(permission);
      if (route) {
        router.addRoute('Layout', route);
      }
    }
  })
}

const permissionToRoute = (permission) => {
  if (!permission.component) {
    return null
  }
  let route = {
    name: permission['name'],
    path: permission.path
  }
  try {
    route.component = () => import("@/view" + permission.component)
  } catch (err) {
    console.log(err)
  }
  return route
}
