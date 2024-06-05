/** 自定义路由类型 用于权限管理模块 */
declare namespace CustomRoute {
  interface Route extends Api.Route.MenuRoute {}

  /**
   * 清理类型
   *
   * - 1: 菜单
   * - 2: 目录
   * - 3: 路由
   * - 4: 按钮
   */
  type routerTypeKey = NonNullable<Route['element_type']>;

  /**
   * 类型
   *
   * - SYS_ADMIN: 系统管理员
   * - TENANT_USER: 租户用户
   * - TENANT_ADMIN: 租户管理员
   */
  type routerSysFlagKey = string;
}
/** 应用管理-服务管理模块 */
declare namespace ServiceManagement {
  interface Service extends Api.ApiApplyManagement.Service {}
  /** 设备类型 */
  type DeviceTypeKey = NonNullable<Service['device_type']>;
  /** 协议类型 */
  type ProtocolTypeKey = NonNullable<Service['protocol_type']>;
}

/** 规则引擎模块 */
declare namespace RuleEngine {
  interface Rule extends Api.RuleEngine.Rule {
    /** 序号 */
    index: number;
  }

  /**
   * 规则引擎状态
   *
   * - 1: 已启用
   * - 2: 已暂停
   */
  type StatusKey = NonNullable<Rule['status']>;
}

/** 数据服务模块 */
declare namespace DataService {
  interface Data extends Api.DataService.Data {
    /** 序号 */
    index: number;
    /** SQL */
    SQL: string | null;
    /** SQL编写辅助 */
    SQLWritingAid: string | null;
  }

  /**
   * 签名方式
   *
   * - 1: MD5
   * - 2: HAS256
   */
  type SignModeKey = NonNullable<Data['signMode']>;

  /**
   * 接口支持标志
   *
   * - 1: http接口
   * - 2: http和ws接口
   */
  type FlagKey = NonNullable<Data['flag']>;

  /**
   * 规则引擎状态
   *
   * - 1: 已启用
   * - 2: 已停止
   */
  type StatusKey = NonNullable<Data['status']>;
}

/** 常规设置 */
declare namespace GeneralSetting {
  interface ThemeSetting extends Api.GeneralSetting.ThemeSetting {}
  interface DataClearSetting extends Api.GeneralSetting.DataClearSetting {}

  /**
   * 清理类型
   *
   * - 1: 操作日志
   * - 2: 设备数据
   */
  type CleanupTypeKey = NonNullable<DataClearSetting['data_type']>;
  /**
   * 是否启用
   *
   * - 1: 启用
   * - 2: 停用
   */
  type EnabledTypeKey = NonNullable<DataClearSetting['enabled']>;
}

declare namespace NotificationServices {
  interface Email extends Api.NotificationServices.Email {}

  /**
   * 开启/关闭 服务
   *
   * - OPEN-开启
   * - CLOSE-关闭
   */
  type StatusKey = NonNullable<Email['status']>;
}

declare namespace UserManagement {
  interface User extends Api.UserManagement.User {}

  /**
   * 用户性别
   *
   * - 0: 女
   * - 1: 男
   */
  type GenderKey = NonNullable<User['gender']>;

  /**
   * 用户状态
   *
   * - N: 正常
   * - F: 冻结
   */
  type UserStatusKey = NonNullable<User['status']>;
}

// 设备信息
declare namespace AddDeviceModel {
  interface Device extends Api.device.addDeviceModel {}
}
