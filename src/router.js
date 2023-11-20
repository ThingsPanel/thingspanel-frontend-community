/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-09-27 16:52:10
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-10-26 15:24:44
 * @FilePath: \ThingsPanel-Backend-Vue\src\router.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import Vue from "vue";
import VueRouter from "vue-router";
import store from "./core/services/store"
import { VERIFY_AUTH } from "./core/services/store/auth.module";
import JwtService from "@/core/services/jwt.service";
import { message_error } from "./utils/helpers";
import { RESET_LAYOUT_CONFIG } from "./core/services/store/config.module";

export const baseRoutes = [
    {
        path: "/",
        name: "Layout",
        component: () => import("@/view/layout/Layout"),
        redirect: "/home",
        children: [
            {
                path: "/home",
                name: "home",
                component: () => import("@/view/pages/Home.vue")
            }
        ]
    },
    {
        path: "/auth",
        component: () => import("@/view/pages/auth/Auth"),
        children: [
            {
                path: "/login",
                name: "login",
                component: () => import("@/view/pages/auth/Login")
            },
            {
                path: "/register",
                name: "register",
                component: () => import("@/view/pages/auth/Register")
            },
            {
                path: "/reset",
                name: "reset",
                component: () => import("@/view/pages/auth/PasswordReset")
            }
        ]
    },
    {
        path: "/share",
        component: () => import("@/Share"),
        children: [
            {
                path: "/kanban/share",
                name: "ShareConsole",
                component: () => import("@/view/pages/console/Dashboard")
            }
        ]
    },
]


Vue.use(VueRouter)

const router = new VueRouter({
    mode: 'hash',
    routes: baseRoutes
})
// 允许通过的路由名称
const passRouters = ["login", "register", "reset", "ShareConsole"];
router.beforeEach((to, from, next) => {

    const token = JwtService.getToken()
    const token_expires_in = JwtService.getExpiresTime()
    const now = Date.now();
    if (passRouters.includes(to.name)) {
        next();
    } else if (!token || !token_expires_in) {
        // token不存在
        next({ name: 'login' });
    } else if (now > token_expires_in) {
        // token过期
        message_error("用户登录已过期，请重新登录！")
        next({ name: 'login' });
    } else {
        next();
    }


    // Ensure we checked auth before each page load.
    // Promise.all([store.dispatch(VERIFY_AUTH)]).then(next);
    store.dispatch(VERIFY_AUTH).then(next);

    // Scroll page to top on every route change
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 200);
});


export default router