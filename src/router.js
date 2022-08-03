import Vue from "vue";
import Router from "vue-router";


export const constantRouterMap = [{
        path: "/home",
        // redirect: "/home",
        component: () =>
            import ("@/view/layout/Layout"),
        children: [{
            path: "/home",
            name: "home",
            component: () =>
                import ("@/view/pages/Home.vue")
        },
        {
            path: "/management/index",
            name: "management",
            component: () =>
                import ("@/view/pages/management/index.vue")
        }

    ]
    },
    {
        path: "/",
        redirect: "/login",
        component: () =>
            import ("@/view/pages/auth/Auth"),
        children: [{
                name: "login",
                path: "/login",
                component: () =>
                    import ("@/view/pages/auth/Login")
            },
            {
                name: "register",
                path: "/register",
                component: () =>
                    import ("@/view/pages/auth/Register")
            }
        ]
    },

    {
        path: "/extra",
        component: () =>
            import ("@/view/layout/Layout"),
        children: [{
                path: "/list/device",
                name: "device",
                component: () =>
                    import ("@/view/pages/device/DeviceIndex.vue")
            },
            {
                path: "/business",
                name: "business",
                component: () =>
                    import ("@/view/pages/business/Business.vue")
            }, {
                path: "/editbusiness",
                name: "editbusiness",
                component: () =>
                    import ("@/view/pages/business/Editbusiness.vue")
            },
            {
                path: "/editbusiness2",
                name: "editbusiness2",
                component: () =>
                    import ("@/view/pages/business/EditBusinessPage.vue")
            },
            {
                path: "/chart/chart",
                name: "chart",
                component: () =>
                    import ("@/view/pages/chart/Chart.vue")
            }, {
                path: "/chart/test",
                name: "Test",
                component: () =>
                    import ("@/view/pages/chart/Test.vue")
            },
            {
                path: "/editpassword",
                name: "editpassword",
                component: () =>
                    import ("@/view/pages/users/EditPassword.vue")
            },
            {
                path: "/strategy/strlist",
                name: "control_strategy",
                component: () =>
                    import ("@/view/pages/automation/ControlStrategy.vue")
            },
            {
                path: "/strategy/alarmlist",
                name: "alarm_strategy",
                component: () =>
                    import ("@/view/pages/automation/AlarmStrategy.vue")
            },
            {
                path: "/production/index",
                name: "production",
                component: () =>
                    import ("@/view/pages/production/index.vue")
            }
            
        ]
    }
];

Vue.use(Router)

const router = new Router({
    routes: constantRouterMap
})

// 重新添加路由方法  避免添加已经存在路由警告
router.$addRoutes = (params) => {
    if (params.length > 0) {
        router.matcher = new Router({
            mode: 'history'
        }).matcher

        const newRoutes = constantRouterMap.concat(params);
        router.addRoutes(newRoutes)
    }
}


export default router