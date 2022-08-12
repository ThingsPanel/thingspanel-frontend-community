import router from './router'
import storage from './storage'
import store from "./core/services/store"
import {constantRouterMap} from './router' //router里的固定路由
import {get_menu} from '@/api/user'
import AUTH from "@/core/services/store/auth.module";
import {VERIFY_AUTH} from "./core/services/store/auth.module";
import {RESET_LAYOUT_CONFIG} from "@/core/services/store/config.module";
import JwtService from "@/core/services/jwt.service";

export const CONST_ROUTERS = [
    {
        path: "/list",
        flag: "buisness",
        component: () => import ("@/view/layout/Layout"),
        children: [
            {
                path: "/list",
                name: "businesslist",
                component: () => import ("@/view/pages/business/BusinessIndex.vue")
            }
        ]
    },
    {
        path: "/users",
        flag: "user_management",
        component: () => import ("@/view/layout/Layout"),
        children: [
            {
                path: "/users/user",
                name: "user",
                component: () => import ("@/view/pages/users/UserIndex.vue")
            }
        ]
    },
    {
        path: "/chart",
        flag: "dashboard",
        component: () => import ("@/view/layout/Layout"),
        children: [
            {
                path: "/chart/list",
                name: "chartlist",
                component: () => import ("@/view/pages/chart/List.vue")
            }
        ]
    },
    // 新自动化
    {
        path: "/strategy",
        flag: "automation",
        component: () => import ("@/view/layout/Layout"),
        children: [
            {
                path: "/strategy/list",
                name: "strategylist2",
                component: () => import ("@/view/pages/automation/AutomationIndex.vue")
            }
        ]
    },
    {
        path: "/log",
        flag: "system_log",
        component: () => import ("@/view/layout/Layout"),
        children: [
            {
                path: "/log/list",
                name: "loglist",
                component: () => import ("@/view/pages/log/LogIndex.vue")
            }
        ]
    },
    {
        path: "/alarm",
        flag: "alert_message",
        component: () => import ("@/view/layout/Layout"),
        children: [
            {
                path: "/alarm/list",
                name: "alarm",
                component: () => import ("@/view/pages/alarm/AlarmIndex.vue")
            }
        ]
    },
    {
        path: "/data",
        flag: "data_management",
        component: () => import ("@/view/layout/Layout"),
        children: [
            {
                path: "/data/index",
                name: "datas",
                component: () => import ("@/view/pages/datas/DataIndex.vue")
            }
        ]
    },
    // 网络组件
    {
        path: "/network_components",
        flag: "data_switching",
        component: () => import ("@/view/layout/Layout"),
        children: [
            {
                path: "/network_components/index",
                name: 'network_components',
                component: () => import ("@/view/pages/network_components/NetworkComponentsIndex.vue")
            }
        ]
    },
    // 数据转发
    {
        path: "/transpond",
        flag: "data_switching",
        component: () => import ("@/view/layout/Layout"),
        children: [
            {
                path: "/transpond/index",
                name: 'transpond',
                component: () => import ("@/view/pages/transpond/TranspondIndex.vue")
            }
        ]
    },
    // 设备日志
    {
        path: "/equipment",
        flag: "equipment_log",
        component: () => import ("@/view/layout/Layout"),
        children: [
            {
                path: "/equipment/index",
                name: 'equipment',
                component: () => import ("@/view/pages/equipment/EquipmentIndex.vue")
            }
        ]
    },
    {
        path: "/firmware",
        flag: "firmware_upgrade",
        component: () => import ("@/view/layout/Layout"),
        children: [
            {
                path: "/firmware/index",
                name: 'firmware',
                component: () => import ("@/view/pages/firmware/FirmwareIndex.vue")
            }
        ]
    },
    {
        path: "/system",
        flag: "system_setup",
        component: () => import ("@/view/layout/Layout"),
        children: [
            {
                path: "/system/index",
                name: "systems",
                component: () => import ("@/view/pages/system/index.vue")
            }
        ]
    },
    {
        path: "/market",
        flag: "application_management",
        component: () => import ("@/view/layout/Layout"),
        children: [
            {
                path: "/market",
                name: "market",
                component: () => import ("@/view/pages/Market.vue")
            }
        ]
    }
];



export function resetMenu(resolve, reject) {
    const routes = [];
    const menus = [
        {
            path: "/list",
            flag: "buisness",
            component: () => import ("@/view/layout/Layout"),
            children: [
                {
                    path: "/list",
                    name: "businesslist",
                    component: () => import ("@/view/pages/business/BusinessIndex.vue")
                }
            ]
        },
        {
            path: "/users",
            flag: "user_management",
            component: () => import ("@/view/layout/Layout"),
            children: [
                {
                    path: "/users/user",
                    name: "user",
                    component: () => import ("@/view/pages/users/UserIndex.vue")
                }
            ]
        },
        {
            path: "/chart",
            flag: "dashboard",
            component: () => import ("@/view/layout/Layout"),
            children: [
                {
                    path: "/chart/list",
                    name: "chartlist",
                    component: () => import ("@/view/pages/chart/List.vue")
                }
            ]
        },
        // 新自动化
        {
            path: "/strategy",
            flag: "automation",
            component: () => import ("@/view/layout/Layout"),
            children: [
                {
                    path: "/strategy/list",
                    name: "strategylist2",
                    component: () => import ("@/view/pages/automation/AutomationIndex.vue")
                }
            ]
        },
        {
            path: "/log",
            flag: "system_log",
            component: () => import ("@/view/layout/Layout"),
            children: [
                {
                    path: "/log/list",
                    name: "loglist",
                    component: () => import ("@/view/pages/log/LogIndex.vue")
                }
            ]
        },
        {
            path: "/alarm",
            flag: "alert_message",
            component: () => import ("@/view/layout/Layout"),
            children: [
                {
                    path: "/alarm/list",
                    name: "alarm",
                    component: () => import ("@/view/pages/alarm/AlarmIndex.vue")
                }
            ]
        },
        {
            path: "/data",
            flag: "data_management",
            component: () => import ("@/view/layout/Layout"),
            children: [
                {
                    path: "/data/index",
                    name: "datas",
                    component: () => import ("@/view/pages/datas/DataIndex.vue")
                }
            ]
        },
        // 网络组件
        {
            path: "/network_components",
            flag: "data_switching",
            component: () => import ("@/view/layout/Layout"),
            children: [
                {
                    path: "/network_components/index",
                    name: 'network_components',
                    component: () => import ("@/view/pages/network_components/NetworkComponentsIndex.vue")
                }
            ]
        },
        // 数据转发
        {
            path: "/transpond",
            flag: "data_switching",
            component: () => import ("@/view/layout/Layout"),
            children: [
                {
                    path: "/transpond/index",
                    name: 'transpond',
                    component: () => import ("@/view/pages/transpond/TranspondIndex.vue")
                }
            ]
        },
        // 设备日志
        {
            path: "/equipment",
            flag: "equipment_log",
            component: () => import ("@/view/layout/Layout"),
            children: [
                {
                    path: "/equipment/index",
                    name: 'equipment',
                    component: () => import ("@/view/pages/equipment/EquipmentIndex.vue")
                }
            ]
        },
        {
            path: "/firmware",
            flag: "firmware_upgrade",
            component: () => import ("@/view/layout/Layout"),
            children: [
                {
                    path: "/firmware/index",
                    name: 'firmware',
                    component: () => import ("@/view/pages/firmware/FirmwareIndex.vue")
                }
            ]
        },
        {
            path: "/system",
            flag: "system_setup",
            component: () => import ("@/view/layout/Layout"),
            children: [
                {
                    path: "/system/index",
                    name: "systems",
                    component: () => import ("@/view/pages/system/index.vue")
                }
            ]
        },
        {
            path: "/market",
            flag: "application_management",
            component: () => import ("@/view/layout/Layout"),
            children: [
                {
                    path: "/market",
                    name: "market",
                    component: () => import ("@/view/pages/Market.vue")
                }
            ]
        }
    ];

        get_menu()
            .then(res => {
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
                    resolve(routes);
                } else {
                    reject([])
                }
            });
}

// export async function resetMenu(router) {
//     const routes = [];
//     const menus = [
//         {
//             path: "/list",
//             flag: "buisness",
//             component: () => import ("@/view/layout/Layout"),
//             children: [
//                 {
//                     path: "/list",
//                     name: "businesslist",
//                     component: () => import ("@/view/pages/business/BusinessIndex.vue")
//                 }
//             ]
//         },
//         {
//             path: "/users",
//             flag: "user_management",
//             component: () => import ("@/view/layout/Layout"),
//             children: [
//                 {
//                     path: "/users/user",
//                     name: "user",
//                     component: () => import ("@/view/pages/users/UserIndex.vue")
//                 }
//             ]
//         },
//         {
//             path: "/chart",
//             flag: "dashboard",
//             component: () => import ("@/view/layout/Layout"),
//             children: [
//                 {
//                     path: "/chart/list",
//                     name: "chartlist",
//                     component: () => import ("@/view/pages/chart/List.vue")
//                 }
//             ]
//         },
//         // 新自动化
//         {
//             path: "/strategy",
//             flag: "automation",
//             component: () => import ("@/view/layout/Layout"),
//             children: [
//                 {
//                     path: "/strategy/list",
//                     name: "strategylist2",
//                     component: () => import ("@/view/pages/automation/AutomationIndex.vue")
//                 }
//             ]
//         },
//         {
//             path: "/log",
//             flag: "system_log",
//             component: () => import ("@/view/layout/Layout"),
//             children: [
//                 {
//                     path: "/log/list",
//                     name: "loglist",
//                     component: () => import ("@/view/pages/log/LogIndex.vue")
//                 }
//             ]
//         },
//         {
//             path: "/alarm",
//             flag: "alert_message",
//             component: () => import ("@/view/layout/Layout"),
//             children: [
//                 {
//                     path: "/alarm/list",
//                     name: "alarm",
//                     component: () => import ("@/view/pages/alarm/AlarmIndex.vue")
//                 }
//             ]
//         },
//         {
//             path: "/data",
//             flag: "data_management",
//             component: () => import ("@/view/layout/Layout"),
//             children: [
//                 {
//                     path: "/data/index",
//                     name: "datas",
//                     component: () => import ("@/view/pages/datas/DataIndex.vue")
//                 }
//             ]
//         },
//         // 网络组件
//         {
//             path: "/network_components",
//             flag: "data_switching",
//             component: () => import ("@/view/layout/Layout"),
//             children: [
//                 {
//                     path: "/network_components/index",
//                     name: 'network_components',
//                     component: () => import ("@/view/pages/network_components/NetworkComponentsIndex.vue")
//                 }
//             ]
//         },
//         // 数据转发
//         {
//             path: "/transpond",
//             flag: "data_switching",
//             component: () => import ("@/view/layout/Layout"),
//             children: [
//                 {
//                     path: "/transpond/index",
//                     name: 'transpond',
//                     component: () => import ("@/view/pages/transpond/TranspondIndex.vue")
//                 }
//             ]
//         },
//         // 设备日志
//         {
//             path: "/equipment",
//             flag: "equipment_log",
//             component: () => import ("@/view/layout/Layout"),
//             children: [
//                 {
//                     path: "/equipment/index",
//                     name: 'equipment',
//                     component: () => import ("@/view/pages/equipment/EquipmentIndex.vue")
//                 }
//             ]
//         },
//         {
//             path: "/firmware",
//             flag: "firmware_upgrade",
//             component: () => import ("@/view/layout/Layout"),
//             children: [
//                 {
//                     path: "/firmware/index",
//                     name: 'firmware',
//                     component: () => import ("@/view/pages/firmware/FirmwareIndex.vue")
//                 }
//             ]
//         },
//         {
//             path: "/system",
//             flag: "system_setup",
//             component: () => import ("@/view/layout/Layout"),
//             children: [
//                 {
//                     path: "/system/index",
//                     name: "systems",
//                     component: () => import ("@/view/pages/system/index.vue")
//                 }
//             ]
//         },
//         {
//             path: "/market",
//             flag: "application_management",
//             component: () => import ("@/view/layout/Layout"),
//             children: [
//                 {
//                     path: "/market",
//                     name: "market",
//                     component: () => import ("@/view/pages/Market.vue")
//                 }
//             ]
//         }
//     ];
//
//     // return menus; //测试
//
//     await get_menu({'email': 'admin@thingspanel.cn'})
//         .then(res => {
//             let ret = res.data;
//             if (ret.code === 200) {
//                 // console.log('router.getRoutes()', router.getRoutes());
//                 // console.log('menus', menus);
//                 let right = ret.data;
//                 for (let i = 0; i < menus.length; i++) {
//                     for (let ii = 0; ii < right.length; ii++) {
//                         if (menus[i].flag == right[ii]) {
//                             let flag = false;
//                             for (let iii = 0; iii < router.getRoutes().length; iii++) {
//                                 if (router.getRoutes()[iii].path == menus[i].path) {
//                                     flag = true;
//                                 }
//                             }
//                             if (!flag) {
//                                 routes.push(menus[i]);
//                             }
//                         }
//                     }
//                 }
//             }
//         });
//     console.log("=============resetMenu===============")
//
//     console.log(routes)
//     console.log("==============resetMenu==============")
//
//     return routes;
// }