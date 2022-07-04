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
        }]
    },
    // {
    //     path: "/list",
    //     component: () =>
    //         import ("@/view/layout/Layout"),
    //     children: [
    //         // {
    //         //     path: "/list",
    //         //     name: "buslist",
    //         //     component: () =>
    //         //         import ("@/view/pages/business/List.vue")
    //         // },
    //         // 重写的 业务
    //         {
    //             path: "/list",
    //             name: "businesslist",
    //             component: () =>
    //                 import ("@/view/pages/business/BusinessIndex.vue")
    //         },
    //         // {
    //         //     path: "/list2/asset",
    //         //     name: "assetlist",
    //         //     component: () =>
    //         //         import ("@/view/pages/business/AssetIndex.vue")
    //         // },
    //         {
    //             path: "/list/device",
    //             name: "device",
    //             component: () =>
    //                 import ("@/view/pages/device/DeviceIndex.vue")
    //         },
    //         {
    //             path: "/business",
    //             name: "business",
    //             component: () =>
    //                 import ("@/view/pages/business/Business.vue")
    //         },
    //         {
    //             path: "/editbusiness",
    //             name: "editbusiness",
    //             component: () =>
    //                 import ("@/view/pages/business/Editbusiness.vue")
    //         },
    //         {
    //             path: "/editbusiness2",
    //             name: "editbusiness2",
    //             component: () =>
    //                 import ("@/view/pages/business/EditBusinessPage.vue")
    //         },
    //         {
    //             path: "/users/user",
    //             name: "user",
    //             component: () =>
    //                 import ("@/view/pages/users/UserIndex.vue")
    //         },
    //         {
    //             path: "/chart/chart",
    //             name: "chart",
    //             component: () =>
    //                 import ("@/view/pages/chart/Chart.vue")
    //         },
    //         {
    //             path: "/chart/test",
    //             name: "Test",
    //             component: () =>
    //                 import ("@/view/pages/chart/Test.vue")
    //         },
    //         {
    //             path: "/chart/list",
    //             name: "chartlist",
    //             component: () =>
    //                 import ("@/view/pages/chart/List.vue")
    //         },
    //         {
    //             path: "/editpassword",
    //             name: "editpassword",
    //             component: () =>
    //                 import ("@/view/pages/users/EditPassword.vue")
    //         },
    //         // {
    //         //     path: "/strategy/list",
    //         //     name: "strategylist",
    //         //     component: () =>
    //         //         import ("@/view/pages/strategy/List.vue")
    //         // },
    //         // 新自动化
    //         {
    //             path: "/strategy/list",
    //             name: "strategylist2",
    //             component: () =>
    //                 import ("@/view/pages/automation/AutomationIndex.vue")
    //         },
    //         // {
    //         //     path: "/strategy/strlist",
    //         //     name: "strlist",
    //         //     component: () =>
    //         //         import ("@/view/pages/strategy/Strlist.vue")
    //         // },
    //         // 新增控制策略
    //         {
    //             path: "/strategy/strlist",
    //             name: "control_strategy",
    //             component: () =>
    //                 import ("@/view/pages/automation/ControlStrategy.vue")
    //         },
    //         // {
    //         //     path: "/strategy/alarmlist",
    //         //     name: "alarmlist",
    //         //     component: () =>
    //         //         import ("@/view/pages/strategy/Alarmlist.vue")
    //         // },
    //         // 新告警策略
    //         {
    //             path: "/strategy/alarmlist",
    //             name: "alarm_strategy",
    //             component: () =>
    //                 import ("@/view/pages/automation/AlarmStrategy.vue")
    //         },
    //         {
    //             path: "/log/list",
    //             name: "loglist",
    //             component: () =>
    //                 import ("@/view/pages/log/LogIndex.vue")
    //         },
    //         {
    //             path: "/alarm/list",
    //             name: "alarm",
    //             component: () =>
    //                 import ("@/view/pages/alarm/AlarmIndex.vue")
    //         },
    //         {
    //             path: "/data/index",
    //             name: "datas",
    //             component: () =>
    //                 import ("@/view/pages/datas/DataIndex.vue")
    //         },
    //         {
    //             path: "/production/index",
    //             name: "production",
    //             component: () =>
    //                 import ("@/view/pages/production/index.vue")
    //         },
    //         //new page
    //         // 数据转发
    //         {
    //             path: "/transpond/index",
    //             name: 'transpond',
    //             component: () =>
    //                 import ("@/view/pages/transpond/TranspondIndex.vue")
    //         },
    //         // 设备日志
    //         {
    //             path: "/equipment/index",
    //             name: 'equipment',
    //             component: () =>
    //                 import ("@/view/pages/equipment/EquipmentIndex.vue")
    //         },
    //         {
    //             path: "/firmware/index",
    //             name: 'firmware',
    //             component: () =>
    //                 import ("@/view/pages/firmware/FirmwareIndex.vue")
    //         },
    //         {
    //             path: "/system/index",
    //             name: "systems",
    //             component: () =>
    //                 import ("@/view/pages/system/index.vue")
    //         },
    //     ]
    // },
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