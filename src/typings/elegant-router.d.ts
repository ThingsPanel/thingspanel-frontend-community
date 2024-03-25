/* eslint-disable */
/* prettier-ignore */
// Generated by elegant-router
// Read more: https://github.com/soybeanjs/elegant-router

declare module "@elegant-router/types" {
  type ElegantConstRoute = import('@elegant-router/vue').ElegantConstRoute;

  /**
   * route layout
   */
  export type RouteLayout = "base" | "blank";

  /**
   * route map
   */
  export type RouteMap = {
    "root": "/";
    "not-found": "/:pathMatch(.*)*";
    "exception": "/exception";
    "exception_403": "/exception/403";
    "exception_404": "/exception/404";
    "exception_500": "/exception/500";
    "403": "/403";
    "404": "/404";
    "500": "/500";
    "about": "/about";
    "alarm": "/alarm";
    "alarm_notification-group": "/alarm/notification-group";
    "alarm_notification-record": "/alarm/notification-record";
    "alarm_warning-message": "/alarm/warning-message";
    "apply": "/apply";
    "apply_service": "/apply/service";
    "automation": "/automation";
    "automation_linkage-edit": "/automation/linkage-edit";
    "automation_scene-linkage": "/automation/scene-linkage";
    "automation_scene-manage": "/automation/scene-manage";
    "component": "/component";
    "component_button": "/component/button";
    "component_card": "/component/card";
    "component_table": "/component/table";
    "dashboard": "/dashboard";
    "dashboard_analysis": "/dashboard/analysis";
    "dashboard_mobile-panel": "/dashboard/mobile-panel";
    "dashboard_panel": "/dashboard/panel";
    "dashboard_workbench": "/dashboard/workbench";
    "data-service": "/data-service";
    "data-service_rule-engine": "/data-service/rule-engine";
    "device": "/device";
    "device_config": "/device/config";
    "device_config-detail": "/device/config-detail";
    "device_config-edit": "/device/config-edit";
    "device_details": "/device/details";
    "device_grouping": "/device/grouping";
    "device_grouping-details": "/device/grouping-details";
    "device_manage": "/device/manage";
    "device_template": "/device/template";
    "function": "/function";
    "function_hide-child": "/function/hide-child";
    "function_hide-child_one": "/function/hide-child/one";
    "function_hide-child_three": "/function/hide-child/three";
    "function_hide-child_two": "/function/hide-child/two";
    "function_multi-tab": "/function/multi-tab";
    "function_tab": "/function/tab";
    "home": "/home";
    "irrigation": "/irrigation";
    "irrigation_group": "/irrigation/group";
    "irrigation_rotation": "/irrigation/rotation";
    "irrigation_time": "/irrigation/time";
    "login": "/login/:module(pwd-login|code-login|register|reset-pwd|bind-wechat)?";
    "manage": "/manage";
    "manage_menu": "/manage/menu";
    "manage_role": "/manage/role";
    "manage_user": "/manage/user";
    "manage_user-detail": "/manage/user-detail/:id";
    "management": "/management";
    "management_auth": "/management/auth";
    "management_notification": "/management/notification";
    "management_role": "/management/role";
    "management_route": "/management/route";
    "management_setting": "/management/setting";
    "management_user": "/management/user";
    "multi-menu": "/multi-menu";
    "multi-menu_first": "/multi-menu/first";
    "multi-menu_first_child": "/multi-menu/first/child";
    "multi-menu_second": "/multi-menu/second";
    "multi-menu_second_child": "/multi-menu/second/child";
    "multi-menu_second_child_home": "/multi-menu/second/child/home";
    "personal-center": "/personal-center";
    "plugin": "/plugin";
    "plugin_charts": "/plugin/charts";
    "plugin_charts_antv": "/plugin/charts/antv";
    "plugin_charts_echarts": "/plugin/charts/echarts";
    "plugin_copy": "/plugin/copy";
    "plugin_editor": "/plugin/editor";
    "plugin_editor_markdown": "/plugin/editor/markdown";
    "plugin_editor_quill": "/plugin/editor/quill";
    "plugin_icon": "/plugin/icon";
    "plugin_map": "/plugin/map";
    "plugin_print": "/plugin/print";
    "plugin_swiper": "/plugin/swiper";
    "plugin_video": "/plugin/video";
    "product": "/product";
    "product_list": "/product/list";
    "product_update-ota": "/product/update-ota";
    "product_update-package": "/product/update-package";
    "rule-engine": "/rule-engine";
    "space-management": "/space-management";
    "system-management-user": "/system-management-user";
    "system-management-user_equipment-map": "/system-management-user/equipment-map";
    "system-management-user_system-log": "/system-management-user/system-log";
    "test": "/test";
    "user-center": "/user-center";
    "visualization": "/visualization";
    "visualization_big-screen": "/visualization/big-screen";
    "visualization_panel": "/visualization/panel";
    "visualization_panel-details": "/visualization/panel-details";
    "visualization_panel-preview": "/visualization/panel-preview";
  };

  /**
   * route key
   */
  export type RouteKey = keyof RouteMap;

  /**
   * route path
   */
  export type RoutePath = RouteMap[RouteKey];

  /**
   * custom route key
   */ 
  export type CustomRouteKey = Extract<
    RouteKey,
    | "root"
    | "not-found"
    | "exception"
    | "exception_403"
    | "exception_404"
    | "exception_500"
  >;

  /**
   * the generated route key
   */ 
  export type GeneratedRouteKey = Exclude<RouteKey, CustomRouteKey>;

  /**
   * the first level route key, which contain the layout of the route
   */
  export type FirstLevelRouteKey = Extract<
    RouteKey,
    | "403"
    | "404"
    | "500"
    | "about"
    | "alarm"
    | "apply"
    | "automation"
    | "component"
    | "dashboard"
    | "data-service"
    | "device"
    | "function"
    | "home"
    | "irrigation"
    | "login"
    | "manage"
    | "management"
    | "multi-menu"
    | "personal-center"
    | "plugin"
    | "product"
    | "rule-engine"
    | "space-management"
    | "system-management-user"
    | "test"
    | "user-center"
    | "visualization"
  >;

  /**
   * the custom first level route key
   */
  export type CustomFirstLevelRouteKey = Extract<
    CustomRouteKey,
    | "root"
    | "not-found"
    | "exception"
  >;

  /**
   * the last level route key, which has the page file
   */
  export type LastLevelRouteKey = Extract<
    RouteKey,
    | "irrigation_group"
    | "irrigation_rotation"
    | "irrigation_time"
    | "403"
    | "404"
    | "500"
    | "login"
    | "about"
    | "alarm_notification-group"
    | "alarm_notification-record"
    | "alarm_warning-message"
    | "apply_service"
    | "automation_linkage-edit"
    | "automation_scene-linkage"
    | "automation_scene-manage"
    | "component_button"
    | "component_card"
    | "component_table"
    | "dashboard_analysis"
    | "dashboard_mobile-panel"
    | "dashboard_panel"
    | "dashboard_workbench"
    | "data-service_rule-engine"
    | "device_config-detail"
    | "device_config-edit"
    | "device_config"
    | "device_details"
    | "device_grouping-details"
    | "device_grouping"
    | "device_manage"
    | "device_template"
    | "function_hide-child_one"
    | "function_hide-child_three"
    | "function_hide-child_two"
    | "function_multi-tab"
    | "function_tab"
    | "home"
    | "manage_menu"
    | "manage_role"
    | "manage_user-detail"
    | "manage_user"
    | "management_auth"
    | "management_notification"
    | "management_role"
    | "management_route"
    | "management_setting"
    | "management_user"
    | "multi-menu_first_child"
    | "multi-menu_second_child_home"
    | "personal-center"
    | "plugin_charts_antv"
    | "plugin_charts_echarts"
    | "plugin_copy"
    | "plugin_editor_markdown"
    | "plugin_editor_quill"
    | "plugin_icon"
    | "plugin_map"
    | "plugin_print"
    | "plugin_swiper"
    | "plugin_video"
    | "product_list"
    | "product_update-ota"
    | "product_update-package"
    | "rule-engine"
    | "space-management"
    | "system-management-user_equipment-map"
    | "system-management-user_system-log"
    | "test"
    | "user-center"
    | "visualization_big-screen"
    | "visualization_panel-details"
    | "visualization_panel-preview"
    | "visualization_panel"
  >;

  /**
   * the custom last level route key
   */
  export type CustomLastLevelRouteKey = Extract<
    CustomRouteKey,
    | "root"
    | "not-found"
    | "exception_403"
    | "exception_404"
    | "exception_500"
  >;

  /**
   * the single level route key
   */
  export type SingleLevelRouteKey = FirstLevelRouteKey & LastLevelRouteKey;

  /**
   * the custom single level route key
   */
  export type CustomSingleLevelRouteKey = CustomFirstLevelRouteKey & CustomLastLevelRouteKey;

  /**
   * the first level route key, but not the single level
  */
  export type FirstLevelRouteNotSingleKey = Exclude<FirstLevelRouteKey, SingleLevelRouteKey>;

  /**
   * the custom first level route key, but not the single level
   */
  export type CustomFirstLevelRouteNotSingleKey = Exclude<CustomFirstLevelRouteKey, CustomSingleLevelRouteKey>;

  /**
   * the center level route key
   */
  export type CenterLevelRouteKey = Exclude<GeneratedRouteKey, FirstLevelRouteKey | LastLevelRouteKey>;

  /**
   * the custom center level route key
   */
  export type CustomCenterLevelRouteKey = Exclude<CustomRouteKey, CustomFirstLevelRouteKey | CustomLastLevelRouteKey>;

  /**
   * the center level route key
   */
  type GetChildRouteKey<K extends RouteKey, T extends RouteKey = RouteKey> = T extends `${K}_${infer R}`
    ? R extends `${string}_${string}`
      ? never
      : T
    : never;

  /**
   * the single level route
   */
  type SingleLevelRoute<K extends SingleLevelRouteKey = SingleLevelRouteKey> = K extends string
    ? Omit<ElegantConstRoute, 'children'> & {
        name: K;
        path: RouteMap[K];
        component: `layout.${RouteLayout}$view.${K}`;
      }
    : never;

  /**
   * the last level route
   */
  type LastLevelRoute<K extends GeneratedRouteKey> = K extends LastLevelRouteKey
    ? Omit<ElegantConstRoute, 'children'> & {
        name: K;
        path: RouteMap[K];
        component: `view.${K}`;
      }
    : never;
  
  /**
   * the center level route
   */
  type CenterLevelRoute<K extends GeneratedRouteKey> = K extends CenterLevelRouteKey
    ? Omit<ElegantConstRoute, 'component'> & {
        name: K;
        path: RouteMap[K];
        children: (CenterLevelRoute<GetChildRouteKey<K>> | LastLevelRoute<GetChildRouteKey<K>>)[];
      }
    : never;

  /**
   * the multi level route
   */
  type MultiLevelRoute<K extends FirstLevelRouteNotSingleKey = FirstLevelRouteNotSingleKey> = K extends string
    ? ElegantConstRoute & {
        name: K;
        path: RouteMap[K];
        component: `layout.${RouteLayout}`;
        children: (CenterLevelRoute<GetChildRouteKey<K>> | LastLevelRoute<GetChildRouteKey<K>>)[];
      }
    : never;
  
  /**
   * the custom first level route
   */
  type CustomSingleLevelRoute<K extends CustomFirstLevelRouteKey = CustomFirstLevelRouteKey> = K extends string
    ? Omit<ElegantConstRoute, 'children'> & {
        name: K;
        path: RouteMap[K];
        component?: `layout.${RouteLayout}$view.${LastLevelRouteKey}`;
      }
    : never;

  /**
   * the custom last level route
   */
  type CustomLastLevelRoute<K extends CustomRouteKey> = K extends CustomLastLevelRouteKey
    ? Omit<ElegantConstRoute, 'children'> & {
        name: K;
        path: RouteMap[K];
        component?: `view.${LastLevelRouteKey}`;
      }
    : never;

  /**
   * the custom center level route
   */
  type CustomCenterLevelRoute<K extends CustomRouteKey> = K extends CustomCenterLevelRouteKey
    ? Omit<ElegantConstRoute, 'component'> & {
        name: K;
        path: RouteMap[K];
        children: (CustomCenterLevelRoute<GetChildRouteKey<K>> | CustomLastLevelRoute<GetChildRouteKey<K>>)[];
      }
    : never;

  /**
   * the custom multi level route
   */
  type CustomMultiLevelRoute<K extends CustomFirstLevelRouteNotSingleKey = CustomFirstLevelRouteNotSingleKey> =
    K extends string
      ? ElegantConstRoute & {
          name: K;
          path: RouteMap[K];
          component: `layout.${RouteLayout}`;
          children: (CustomCenterLevelRoute<GetChildRouteKey<K>> | CustomLastLevelRoute<GetChildRouteKey<K>>)[];
        }
      : never;

  /**
   * the custom route
   */
  type CustomRoute = CustomSingleLevelRoute | CustomMultiLevelRoute;

  /**
   * the generated route
   */
  type GeneratedRoute = SingleLevelRoute | MultiLevelRoute;

  /**
   * the elegant route
   */
  type ElegantRoute = GeneratedRoute | CustomRoute;
}
