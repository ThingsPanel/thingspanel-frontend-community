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
//
    if (!store.getters.isAuthenticated && to.name != "login") {
        next({ name: "login" })
    } else {
        next();
    }

    if (JwtService.getToken() && JwtService.getExpiresTime() && Date.now() <= JwtService.getExpiresTime()) {
        if (to.name == "login") {
            next({ name: "home" });
        } else {
            next();
        }
    } else {
        JwtService.destroyToken();
        Permission.clearPermissions();

        next({ name: "login" })
    }

    console.log("====JwtService.getToken()", JwtService.getToken());
    console.log("====JwtService.getExpiresTime()", JwtService.getExpiresTime());
    console.log("====Date()", Date.now());


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