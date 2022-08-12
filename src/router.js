import Vue from "vue";
import VueRouter from "vue-router";
import store from "./core/services/store"
import {SET_ROUTERS, VERIFY_AUTH} from "./core/services/store/auth.module";
import AUTH from "@/core/services/store/auth.module";
import { RESET_LAYOUT_CONFIG } from "@/core/services/store/config.module";
import JwtService from "@/core/services/jwt.service";

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
export const constantRouterMap = [
    {
        path: "/",
        // redirect: "/home",
        component: () => import ("@/view/layout/Layout"),
        children: [
            {
                path: "/home",
                name: "home",
                component: () => import ("@/view/pages/Home.vue")
            },
            {
                path: "/management/index",
                name: "management",
                component: () => import ("@/view/pages/management/index.vue")
            }
        ]
    },
    {
        path: "/auth",
        component: () => import ("@/view/pages/auth/Auth"),
        children: [
            {
                name: "login",
                path: "/login",
                component: () => import ("@/view/pages/auth/Login")
            },
            {
                name: "register",
                path: "/register",
                component: () => import ("@/view/pages/auth/Register")
            }
        ]
    },
    {
        path: "/extra",
        component: () => import ("@/view/layout/Layout"),
        children: [
            {
                path: "/list/device",
                name: "device",
                component: () => import ("@/view/pages/device/DeviceIndex.vue")
            },
            {
                path: "/business",
                name: "business",
                component: () => import ("@/view/pages/business/Business.vue")
            },
            {
                path: "/editbusiness",
                name: "editbusiness",
                component: () => import ("@/view/pages/business/Editbusiness.vue")
            },
            {
                path: "/editbusiness2",
                name: "editbusiness2",
                component: () => import ("@/view/pages/business/EditBusinessPage.vue")
            },
            {
                path: "/chart/chart",
                name: "chart",
                component: () => import ("@/view/pages/chart/Chart.vue")
            }, {
                path: "/chart/test",
                name: "Test",
                component: () => import ("@/view/pages/chart/Test.vue")
            },
            {
                path: "/editpassword",
                name: "editpassword",
                component: () => import ("@/view/pages/users/EditPassword.vue")
            },
            {
                path: "/strategy/strlist",
                name: "control_strategy",
                component: () => import ("@/view/pages/automation/ControlStrategy.vue")
            },
            {
                path: "/strategy/alarmlist",
                name: "alarm_strategy",
                component: () => import ("@/view/pages/automation/AlarmStrategy.vue")
            },
            {
                path: "/production/index",
                name: "production",
                component: () => import ("@/view/pages/production/index.vue")
            }
        ]
    }
];

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


    // reset config to initial state
    store.dispatch(RESET_LAYOUT_CONFIG);

    // Ensure we checked auth before each page load.
    // Promise.all([store.dispatch(VERIFY_AUTH)]).then(next);

    // Scroll page to top on every route change
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 200);
});
// const router = new Router({
//     routes: constantRouterMap
// })

// 重新添加路由方法  避免添加已经存在路由警告
// router.$addRoutes = (params) => {
//     if (params.length > 0) {
//         router.matcher = new VueRouter({
//             mode: 'history'
//         }).matcher
//         const newRoutes = baseRoutes.concat(params);
//         console.log("=========router.$addRoutes=========")
//         console.log(newRoutes)
//         console.log("=========router.$addRoutes=========")
//         router.addRoutes(newRoutes)
//     }
// }


export default router