import router from './router'
import storage from './storage'
import store from "./core/services/store"
import { constantRouterMap } from './router' //router里的固定路由
import { get_menu } from '@/api/user'
import AUTH from "@/core/services/store/auth.module";
import { VERIFY_AUTH } from "./core/services/store/auth.module";
import { RESET_LAYOUT_CONFIG } from "@/core/services/store/config.module";
import JwtService from "@/core/services/jwt.service";

router.beforeEach(async(to, from, next) => {

    let userid = AUTH.state.userid
    let user = AUTH.state.user

    const token = JwtService.getToken()
    const token_expires_in = JwtService.getExpiresTime()
    const now = Date.now();

    // 没有 token 或者时间大于 expires_in 重定向到登录
    if (!token || !token_expires_in || now > token_expires_in) {
        storage.remove('routers');
    } else {
        try {
            const routers = await reSetMenu(router);
            const sRroutes = storage.get('routers');

            if (from.path == '/' || sRroutes == null || routers.length != sRroutes.length) {
                console.log('[--------1--------]');
                storage.set('routers', routers);

                if (routers.length > 0) {
                    router.$addRoutes(routers)
                    next({
                        ...to, // next({ ...to })的目的,是保证路由添加完了再进入页面 (可以理解为重进一次)
                        replace: true // 重进一次, 不保留重复历史
                    })
                } else {
                    next()
                }
            }

        } catch (error) {
            console.log('-----error----', error);
        }
    }




    // reset config to initial state
    store.dispatch(RESET_LAYOUT_CONFIG);

    // Ensure we checked auth before each page load.
    Promise.all([store.dispatch(VERIFY_AUTH)]).then(next);

    // Scroll page to top on every route change
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 100);

})




export async function reSetMenu(router) {

    // console.log('--login-auth---', AUTH.state);

    const routes = [];
    const menus = [{
            path: "/list",
            flag: "buisness",
            component: () =>
                import ("@/view/layout/Layout"),
            children: [{
                path: "/list",
                name: "businesslist",
                component: () =>
                    import ("@/view/pages/business/BusinessIndex.vue")
            }]
        },

        {
            path: "/users",
            flag: "user_management",
            component: () =>
                import ("@/view/layout/Layout"),
            children: [{
                path: "/users/user",
                name: "user",
                component: () =>
                    import ("@/view/pages/users/UserIndex.vue")
            }]
        },

        {
            path: "/chart",
            flag: "dashboard",
            component: () =>
                import ("@/view/layout/Layout"),
            children: [{
                path: "/chart/list",
                name: "chartlist",
                component: () =>
                    import ("@/view/pages/chart/List.vue")
            }]
        },

        // 新自动化
        {
            path: "/strategy",
            flag: "automation",
            component: () =>
                import ("@/view/layout/Layout"),
            children: [{
                path: "/strategy/list",
                name: "strategylist2",
                component: () =>
                    import ("@/view/pages/automation/AutomationIndex.vue")
            }]
        },

        {
            path: "/log",
            flag: "system_log",
            component: () =>
                import ("@/view/layout/Layout"),
            children: [{
                path: "/log/list",
                name: "loglist",
                component: () =>
                    import ("@/view/pages/log/LogIndex.vue")
            }]
        },

        {
            path: "/alarm",
            flag: "alert_message",
            component: () =>
                import ("@/view/layout/Layout"),
            children: [{
                path: "/alarm/list",
                name: "alarm",
                component: () =>
                    import ("@/view/pages/alarm/AlarmIndex.vue")
            }]
        },

        {
            path: "/data",
            flag: "data_management",
            component: () =>
                import ("@/view/layout/Layout"),
            children: [{
                path: "/data/index",
                name: "datas",
                component: () =>
                    import ("@/view/pages/datas/DataIndex.vue")
            }]
        },

        // 规则引擎
        // {
        //     path: "/ruleinstance",
        //     flag: "data_switching",
        //     component: () =>
        //         import ("@/view/layout/Layout"),
        //     children: [{
        //         path: "/ruleinstance/index",
        //         name: 'ruleinstance',
        //         component: () =>
        //             import ("@/view/pages/ruleinstance/RuleinstanceIndex.vue")
        //     }]
        // },

        // 数据转发
        {
            path: "/transpond",
            flag: "data_switching",
            component: () =>
                import ("@/view/layout/Layout"),
            children: [{
                path: "/transpond/index",
                name: 'transpond',
                component: () =>
                    import ("@/view/pages/transpond/TranspondIndex.vue")
            }]
        },

        // 设备日志
        {
            path: "/equipment",
            flag: "equipment_log",
            component: () =>
                import ("@/view/layout/Layout"),
            children: [{
                path: "/equipment/index",
                name: 'equipment',
                component: () =>
                    import ("@/view/pages/equipment/EquipmentIndex.vue")
            }]
        },

        {
            path: "/firmware",
            flag: "firmware_upgrade",
            component: () =>
                import ("@/view/layout/Layout"),
            children: [{
                path: "/firmware/index",
                name: 'firmware',
                component: () =>
                    import ("@/view/pages/firmware/FirmwareIndex.vue")
            }]
        },

        {
            path: "/system",
            flag: "system_setup",
            component: () =>
                import ("@/view/layout/Layout"),
            children: [{
                path: "/system/index",
                name: "systems",
                component: () =>
                    import ("@/view/pages/system/index.vue")
            }]
        },

        {
            path: "/market",
            flag: "application_management",
            component: () =>
                import ("@/view/layout/Layout"),
            children: [{
                path: "/market",
                name: "market",
                component: () =>
                    import ("@/view/pages/Market.vue")
            }]
        }
    ];

    // return menus; //测试

    await get_menu({ 'email': 'admin@thingspanel.cn' }).then(res => {
        let ret = res.data;
        if (ret.code === 200) {

            // console.log('router.getRoutes()', router.getRoutes());
            // console.log('menus', menus);
            let right = ret.data;
            for (let i = 0; i < menus.length; i++) {
                for (let ii = 0; ii < right.length; ii++) {
                    if (menus[i].flag == right[ii]) {
                        let flag = false;
                        for (let iii = 0; iii < router.getRoutes().length; iii++) {
                            if (router.getRoutes()[iii].path == menus[i].path) {
                                flag = true;
                            }
                        }
                        if (!flag) {
                            routes.push(menus[i]);
                        }
                    }
                }
            }

            console.log('---routes---', routes);
        }
    });

    // let flag = false;
    // for (let i = 0; i < router.getRoutes().length; i++) {
    //     if (router.getRoutes()[i].path == '/market') {
    //         flag = true;
    //     }
    // }
    // if (!flag) {
    //     router.addRoute({
    //         path: "/market",
    //         flag: "/market",
    //         component: () =>
    //             import ("@/view/layout/Layout"),
    //         children: [{
    //             path: "/market",
    //             name: "market",
    //             component: () =>
    //                 import ("@/view/pages/Market.vue")
    //         }]
    //     });
    // }

    return routes;
}