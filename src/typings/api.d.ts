/**
 * Namespace Api
 *
 * All backend api type
 */
declare namespace Api {
  namespace BaseApi {
    /** 后端返回的路由数据类型 */
    interface Data {
      name: string;
      code: number;
      message: string;
    }
  }
  namespace Common {
    /** common params of paginating */
    interface PaginatingCommonParams {
      /** current page number */
      current: number;
      /** page size */
      size: number;
      /** total count */
      total: number;
    }

    /** common params of paginating query list data */
    interface PaginatingQueryRecord<T extends NonNullable<unknown>> extends PaginatingCommonParams {
      records: T[];
    }

    /**
     * enable status
     *
     * - "1": enabled
     * - "2": disabled
     */
    type EnableStatus = '1' | '2';

    /** common record */
    type CommonRecord<T extends NonNullable<unknown>> = {
      /** record id */
      id: number;
      /** record creator */
      createBy: string;
      /** record create time */
      createTime: string;
      /** record updater */
      updateBy: string;
      /** record update time */
      updateTime: string;
      /** record status */
      status: EnableStatus | null;
    } & T;
  }
  /**
   * namespace Auth
   *
   * backend api module: "auth"
   */
  namespace Auth {
    /**
     * 用户角色类型(前端静态路由用角色类型进行路由权限的控制)
     *
     * - SYS_ADMIN: 系统管理员(该权限具有所有路由数据)
     * - TENANT_ADMIN: 租户管理员
     * - TENANT_USER: 用户
     */
    type RoleType = 'SYS_ADMIN' | 'TENANT_ADMIN' | 'TENANT_USER';

    interface LoginToken {
      token: string;
      refreshToken: string;
      expires_in: number;
    }

    /** 用户信息 */
    interface UserInfo {
      /** 用户id */
      id?: string;
      userId?: string;
      /** 用户名 */
      userName: string;
      /** 用户角色类型 */
      roles?: string[];
      authority: string;

      [key: string]: any;
    }
  }
  /**
   * namespace Route
   *
   * backend api module: "route"
   */
  namespace Route {
    type ElegantConstRoute = import('@elegant-router/types').ElegantConstRoute;

    interface MenuRoute extends ElegantConstRoute {
      id: string;
      /** 父节点ID */
      parent_id: string;
      /** 标题 */
      title: string;
      /** 国际化 */
      multilingual: App.I18n.I18nKey;
      /** 图标 */
      param2: string;
      /** 组件名称 */
      element_code: string;
      /** 组件路径 */
      param1: string;
      /** 是否隐藏 0 1 */
      param3: string;
      /** 排序 */
      orders: number;
      /** 类型 */
      // element_type: 1 | 2 | 3 | 4 | 5;
      element_type: 1 | 3;
      /** 访问标识 */
      authority: any;
      /** 描述 */
      description: string;
      /** 描述 */
      remark: string;
      /** 组件地址 */
      route_path: string;
      /** 子节点 */
      children: MenuRoute[];
    }

    interface Data {
      list: MenuRoute[];
      total: number;
    }

    interface UserRoute {
      list: ElegantConstRoute[];
      home: import('@elegant-router/types').LastLevelRouteKey;
    }
  }
  /**
   * namespace SystemManage
   *
   * backend api module: "systemManage"
   */
  namespace SystemManage {
    type CommonSearchParams = Pick<Common.PaginatingCommonParams, 'current' | 'size'>;

    /** role */
    type Role = Common.CommonRecord<{
      /** role name */
      roleName: string;
      /** role code */
      roleCode: string;
      /** role description */
      roleDesc: string;
    }>;

    /** role search params */
    type RoleSearchParams = CommonType.RecordNullable<
      Pick<Api.SystemManage.Role, 'roleName' | 'roleCode' | 'status'> & CommonSearchParams
    >;

    /** role list */
    type RoleList = Common.PaginatingQueryRecord<Role>;

    /** all role */
    type AllRole = Pick<Role, 'id' | 'roleName' | 'roleCode'>;

    /**
     * user gender
     *
     * - "1": "male"
     * - "2": "female"
     */
    type UserGender = '1' | '2';

    /** user */
    type User = Common.CommonRecord<{
      /** user name */
      userName: string;
      /** user gender */
      userGender: UserGender | null;
      /** user nickname */
      nickName: string;
      /** user phone */
      userPhone: string;
      /** user email */
      userEmail: string;
      /** user role code collection */
      userRoles: string[];
    }>;

    /** user search params */
    type UserSearchParams = CommonType.RecordNullable<
      Pick<Api.SystemManage.User, 'userName' | 'userGender' | 'nickName' | 'userPhone' | 'userEmail' | 'status'> &
        CommonSearchParams
    >;

    /** user list */
    type UserList = Common.PaginatingQueryRecord<User>;

    /**
     * menu type
     *
     * - "1": directory
     * - "2": menu
     */
    type MenuType = '1' | '2';

    type MenuButton = {
      /**
       * button code
       *
       * it can be used to control the button permission
       */
      code: string;
      /** button description */
      desc: string;
    };

    /**
     * icon type
     *
     * - "1": iconify icon
     * - "2": local icon
     */
    type IconType = '1' | '2';

    type Menu = Common.CommonRecord<{
      /** parent menu id */
      parentId: number;
      /** menu type */
      menuType: MenuType;
      /** menu name */
      menuName: string;
      /** route name */
      routeName: string;
      /** route path */
      routePath: string;
      /** component */
      component?: string;
      /**
       * i18n key
       *
       * it is for internationalization
       */
      i18nKey?: App.I18n.I18nKey;
      /** iconify icon name or local icon name */
      icon: string;
      /** icon type */
      iconType: IconType;
      /** menu order */
      order: number;
      /** whether to cache the route */
      keepAlive?: boolean;
      /** outer link */
      href?: string;
      /** whether to hide the route in the menu */
      hideInMenu?: boolean;
      /**
       * The menu key will be activated when entering the route
       *
       * The route is not in the menu
       *
       * @example
       *   the route is "user_detail", if it is set to "user_list", the menu "user_list" will be activated
       */
      activeMenu?: import('@elegant-router/types').LastLevelRouteKey;
      /** By default, the same route path will use one tab, if set to true, it will use multiple tabs */
      multiTab?: boolean;
      /** If set, the route will be fixed in tabs, and the value is the order of fixed tabs */
      fixedIndexInTab?: number;
      /** menu buttons */
      buttons?: MenuButton[];
      /** children menu */
      children?: Menu[];
    }>;

    type SystemLogSearchParams = {
      page: number;
      page_size: number;
      username?: string | null;
      start_time?: string | null;
      end_time?: string | null;
    };

    type SystemLogList = {
      id?: string;
      ip?: string;
      path?: string;
      user_id?: string;
      name?: null | string;
      created_at?: Date;
      latency?: number;
      request_message?: string;
      response_message?: string;
      tenant_id?: string;
      remark?: null;
    };
  }
  /** 系统设置-路由管理 */
  namespace ApiApplyManagement {
    interface Service {
      /** id */
      id: string;
      /** 服务名称 */
      name: string | null;
      /** 设备类型 */
      device_type: string | number;
      /** 协议类型 */
      protocol_type: string;
      /** 介绍 */
      description: string | null;
      /** HTTP服务地址 */
      http_address: string | null;
      /** 接入地址 */
      access_address: string | null;
      /** 插件订阅主题前缀 */
      sub_topic_prefix: string | null;
      /** 链接参数 */
      additional_info: string;
      ts: string;
      language_code: string;
    }

    interface Data {
      list: Service[];
      total: number;
    }
  }
  /** 常规设置 */
  namespace GeneralSetting {
    /** 主题设置 */
    interface ThemeSetting {
      /** id */
      id: string;
      /** 系统标题 */
      system_name: string | null;
      /** 首页和后台 logo */
      logo_background: string | undefined;
      /** 加载页面 logo */
      logo_loading: string | undefined;
      /** 站标 logo */
      logo_cache: string | undefined;
      /** 背景图片 */
      home_background: string | undefined;
    }

    /** 数据清理设置 */
    interface DataClearSetting {
      /** id */
      id: string;
      /** 清理类型 */
      data_type: string;
      /** 是否启用 */
      enabled: string;
      /** 保留天数 */
      retention_days: number;
      /** 上次清理时间 */
      last_cleanup_time: string | null;
      /** 上次清理数据时间节点 */
      last_cleanup_data_time: string | null;
      /** 备注 */
      remark: string | null;
    }

    interface DataClear {
      list: DataClearSetting[];
      total: number;
    }

    interface Theme {
      list: ThemeSetting[];
      total: number;
    }
  }
  namespace NotificationServices {
    interface Email {
      id: string;
      config: string;
      email_config: any;
      notice_type: string;
      remark: string;
      status: string;
    }
  }
  namespace UserManagement {
    interface User {
      /** 用户id */
      id: string;
      /** 用户邮箱 */
      email: string | null;
      /** 用户名 */
      name: string | null;
      description: string | null;
      /** 用户手机号码 */
      phone_number: string;
      /**
       * 用户状态
       *
       * - N: 正常
       * - F: 冻结
       */
      status: 'F' | 'N' | null;
      /**
       * 用户性别
       *
       * - 0: 女
       * - 1: 男
       */
      gender: '0' | '1' | null;

      /** 备注 */
      remark: string | null;
      /** 创建时间 */
      created_at: string | null;
      /** 更新時間 */
      updated_at: string | null;
    }

    interface Data {
      list: User[];
      total: number;
    }
  }
  /** 规则引擎 */
  namespace RuleEngine {
    interface Rule {
      /** id */
      id: string;
      /** 规则名 */
      name: string | null;
      /**
       * 规则状态
       *
       * - 1: 已启动
       * - 2: 已暂停
       */
      status: '1' | '2' | null;
    }
  }
  namespace DataService {
    interface Data {
      /** id */
      id: string;
      /** 规则名 */
      name: string | null;
      /** app_key */
      appKey: string | null;
      /** 签名方式 */
      signMode: string | null;
      /** IP白名单 */
      ip: string | null;
      /** 接口支持标志 */
      flag: string | null;
      /** 推送数据间隔 */
      dataInterval: string | null;
      /** 描述 */
      desc: string | null;
      /** 创建时间 */
      createTime: string | null;
      /**
       * 规则状态
       *
       * - 1: 已启动
       * - 2: 已停止
       */
      status: '1' | '2' | null;
    }
  }
  namespace ApplyManagement {
    interface Service {
      /** id */
      id: string;
      /** 服务名称 */
      name: string | null;
      /** 服务类别 */
      serviceType: string | null;
      /** 介绍 */
      desc: string | null;
      /** 作者 */
      author: string | null;
      /** 版本 */
      version: string | null;
      /**
       * 规则状态
       *
       * - 1: 已启动
       * - 2: 已停止
       */
      status: '1' | '2' | null;
    }
  }

  /** 设备管理 */
  namespace device {
    interface addDeviceModel {
      additional_info: string;
      created_at: string;
      data_identifier: string;
      data_name: string;
      data_type: string;
      description: string;
      device_template_id: string;
      id: string;
      read_write_flag: string;
      remark: string;
      tenant_id: string;
      unit: string;
      updated_at: string;

      [property: string]: any;
    }
  }

  /** 告警 */
  namespace Alarm {
    interface NotificationGroupParams {
      name?: string;
      notification_type?: string;
      page: number;
      page_size: number;
      status?: string;
      tenant_id?: string;
    }

    interface AddNotificationGroupParams {
      name: string;
      description?: string;
      notification_config?: string;
      notification_type: string;
      remark?: string;
      status: string;
      tenant_id?: string;
    }

    interface NotificationGroupList {
      created_at: Date;
      description: string;
      id: string;
      name: string;
      notification_config: string;
      notification_type: string;
      remark: string;
      status: string;
      tenant_id: string;
      updated_at: Date;
    }

    interface NotificationHistoryParams {
      page: number;
      page_size: number;
      notification_type: string;
      send_target?: string;
      send_time_start?: string;
      send_time_stop?: string;
    }

    interface NotificationHistoryList {
      page: number;
      page_size: number;
      notification_type: string;
      send_target?: string;
      send_time_start?: string;
      send_time_stop?: string;
    }
  }
  /** 灌溉计划 */
  namespace Irrigation {
    interface AddTimeIrrigation {
      name: string | null;
      space_id: string | null;
      district_id: string | null;
      device_id: string | null;
      irrigation_time: string | null;
      schedule: string | null;
      control_type: string | null;
      irrigation_duration: number | null;
      valve_opening: number | null;
      status?: string | null;
      remark: string | null;
      [key: string]: any;
    }
  }
}
