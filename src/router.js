import Vue from "vue";
import VueRouter from "vue-router";
import store from "./core/services/store"
import {SET_ROUTERS, VERIFY_AUTH} from "./core/services/store/auth.module";
import AUTH from "@/core/services/store/auth.module";
import { RESET_LAYOUT_CONFIG } from "@/core/services/store/config.module";
import JwtService from "@/core/services/jwt.service";
import Permission from "@/core/services/permission.service.js";

export const baseRoutes = [
    {
        path: "/",
        name: "Layout",
        component: () => import ("@/view/layout/Layout"),
        redirect: "/home",
        children: [
            {
                path: "/home",
                name: "home",
                component: () => import ("@/view/pages/Home.vue")
            }
        ]
    },
    {
        path: "/auth",
        component: () => import ("@/view/pages/auth/Auth"),
        children: [
            {
                path: "/login",
                name: "login",
                component: () => import ("@/view/pages/auth/Login")
            },
            {
                path: "/register",
                name: "register",
                component: () => import ("@/view/pages/auth/Register")
            }
        ]
    }

]


Vue.use(VueRouter)

const router = new VueRouter({
    mode: 'hash',
    routes: baseRoutes
})
router.beforeEach(async(to, from, next) => {

    const token = JwtService.getToken()
    const token_expires_in = JwtService.getExpiresTime()
    const now = Date.now();


    if (to.name == 'login') {
        // 如果是登录请求，通过
        next();
    } else if (!token || !token_expires_in || now > token_expires_in) {
        // 如果token为空或已过期，跳转到登录页面
        next({name: 'login'})
    }
    next();


    // reset config to initial state
    store.dispatch(RESET_LAYOUT_CONFIG);

    // Ensure we checked auth before each page load.
    // Promise.all([store.dispatch(VERIFY_AUTH)]).then(next);

    // Scroll page to top on every route change
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 200);
});


export default router