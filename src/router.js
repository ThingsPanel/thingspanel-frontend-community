import Vue from "vue";
import Router from "vue-router";

Vue.use(Router);

export default new Router({
    routes: [{
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
                    path: "/market",
                    name: "market",
                    component: () =>
                        import ("@/view/pages/Market.vue")
                },
                {
                    path: "/list",
                    name: "buslist",
                    component: () =>
                        import ("@/view/pages/business/List.vue")
                },
                // 重写的 业务
                {
                    path: "/list2",
                    name: "buslist2",
                    component: () =>
                        import ("@/view/pages/business/BusinessIndex.vue")
                },
                {
                    path: "/device",
                    name: "device",
                    component: () =>
                        import ("@/view/pages/device/DeviceIndex.vue")
                },
                {
                    path: "/business",
                    name: "business",
                    component: () =>
                        import ("@/view/pages/business/Business.vue")
                },
                {
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
                    path: "/users/user",
                    name: "user",
                    component: () =>
                        import ("@/view/pages/users/Index.vue")
                },
                {
                    path: "/chart/chart",
                    name: "chart",
                    component: () =>
                        import ("@/view/pages/chart/Chart.vue")
                },
                {
                    path: "/chart/test",
                    name: "Test",
                    component: () =>
                        import ("@/view/pages/chart/Test.vue")
                },
                {
                    path: "/chart/list",
                    name: "chartlist",
                    component: () =>
                        import ("@/view/pages/chart/List.vue")
                },
                {
                    path: "/editpassword",
                    name: "editpassword",
                    component: () =>
                        import ("@/view/pages/users/EditPassword.vue")
                },
                {
                    path: "/strategy/list",
                    name: "strategylist",
                    component: () =>
                        import ("@/view/pages/strategy/List.vue")
                },
                {
                    path: "/strategy/strlist",
                    name: "strlist",
                    component: () =>
                        import ("@/view/pages/strategy/Strlist.vue")
                },
                {
                    path: "/strategy/alarmlist",
                    name: "alarmlist",
                    component: () =>
                        import ("@/view/pages/strategy/Alarmlist.vue")
                },
                {
                    path: "/log/list",
                    name: "loglist",
                    component: () =>
                        import ("@/view/pages/log/LogIndex.vue")
                },
                {
                    path: "/alarm/list",
                    name: "alarm",
                    component: () =>
                        import ("@/view/pages/alarm/AlarmIndex.vue")
                },
                {
                    path: "/data/index",
                    name: "datas",
                    component: () =>
                        import ("@/view/pages/datas/DataIndex.vue")
                },
                {
                    path: "/production/index",
                    name: "production",
                    component: () =>
                        import ("@/view/pages/production/index.vue")
                },
                //new page
                // 数据转发
                {
                    path: "/transpond/index",
                    name: 'transpond',
                    component: () =>
                        import ("@/view/pages/transpond/index.vue")
                },
                // 设备日志
                {
                    path: "/equipment/index",
                    name: 'equipment',
                    component: () =>
                        import ("@/view/pages/equipment/index.vue")
                },
                {
                    path: "/firmware/index",
                    name: 'firmware',
                    component: () => import("@/view/pages/firmware/Index.vue")
                },
                {
                    path: "/system/index",
                    name: "systems",
                    component: () =>
                        import ("@/view/pages/system/index.vue")
                },
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
        }
    ]
});