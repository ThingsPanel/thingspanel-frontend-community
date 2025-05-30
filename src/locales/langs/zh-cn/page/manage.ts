export default {
  common: {
    status: {
      enable: '启用',
      disable: '禁用'
    }
  },
  role: {
    title: '角色列表',
    roleName: '角色名称',
    roleCode: '角色编码',
    roleStatus: '角色状态',
    roleDesc: '角色描述',
    form: {
      roleName: '请输入角色名称',
      roleCode: '请输入角色编码',
      roleStatus: '请选择角色状态',
      roleDesc: '请输入角色描述'
    },
    addRole: '新增角色',
    editRole: '编辑角色',
    editPermission: '编辑权限'
  },
  api: {
    title: 'API key',
    addApiKey: '创建API key',
    apiName: '名称',
    api_key: 'key',
    apiStatus: '状态',
    created_at: '创建时间',
    apiStatus1: {
      freeze: '停用',
      normal: '启用'
    },
    form: {
      apiName: '请输入API key的名称'
    },
    editAPi: '编辑'
  },
  user: {
    title: '用户列表',
    userName: '姓名',
    userGender: '性别',
    nickName: '昵称',
    userPhone: '手机号',
    accountStatus: '账户状态',
    remark: '备注',
    userEmail: '邮箱',
    userStatus: '租户状态',
    userStatus2: '用户状态',
    userRole: '租户角色',
    userRole2: '用户角色',
    password: '密码',
    confirmPwd: '确认密码',
    enter: '进入',
    form: {
      userName: '请输入姓名',
      userGender: '请选择性别',
      nickName: '请输入昵称',
      userPhone: '请输入手机号',
      userEmail: '请输入邮箱',
      userStatus: '请选择租户状态',
      userRole: '请选择租户角色',
      userRole2: '请选择用户角色'
    },
    addUser: '新增用户',
    editUser: '编辑用户',
    gender: {
      male: '男',
      female: '女'
    },
    status: {
      freeze: '冻结',
      normal: '正常'
    }
  },
  menu: {
    title: '菜单管理',
    id: 'ID',
    parentId: '父级菜单ID',
    authority: '权限',
    menuType: '菜单类型',
    menuName: '菜单名称',
    componentType: '组件类型',
    routeName: '路由名称',
    routePath: '路由路径',
    page: '页面组件',
    layout: '布局',
    i18nKey: '国际化key',
    icon: '图标',
    localIcon: '本地图标',
    iconTypeTitle: '图标类型',
    order: '排序',
    keepAlive: '缓存路由',
    href: '外链',
    hideInMenu: '隐藏菜单',
    activeMenu: '高亮的菜单',
    multiTab: '支持多页签',
    fixedIndexInTab: '固定在页签中的序号',
    button: '按钮',
    buttonCode: '按钮编码',
    buttonDesc: '按钮描述',
    menuStatus: '菜单状态',
    form: {
      parent: '父级菜单',
      title: '标题',
      multilingual: '标题（多语言）',
      name: '名称',
      path: '访问路径',
      route_path: '组件路径',
      componentType: '组件类型',
      icon: '图标',
      order: '排序',
      type: '类型',
      authority: '权限',
      menuType: '请选择菜单类型',
      menuName: '请输入菜单名称',
      routeName: '请输入路由名称',
      routePath: '请输入路由路径',
      page: '请选择页面组件',
      layout: '请选择布局组件',
      i18nKey: '请输入国际化key',
      localIcon: '请选择本地图标',
      keepAlive: '请选择是否缓存路由',
      href: '请输入外链',
      hideInMenu: '请选择是否隐藏菜单',
      activeMenu: '请输入高亮的菜单的路由名称',
      multiTab: '请选择是否支持多标签',
      fixedInTab: '请选择是否固定在页签中',
      fixedIndexInTab: '请输入固定在页签中的序号',
      button: '请选择是否按钮',
      buttonCode: '请输入按钮编码',
      buttonDesc: '请输入按钮描述',
      menuStatus: '请选择菜单状态'
    },
    addMenu: '新增菜单',
    editMenu: '编辑菜单',
    addChildMenu: '新增子菜单',
    type: {
      directory: '目录',
      menu: '菜单'
    },
    iconType: {
      iconify: 'iconify图标',
      local: '本地图标'
    },
    tooltip: {
      deviceConfig: '设备的协议和其他参数等所有配置',
      deviceTemplate: '定义物模型和显示图表'
    }
  },
  setting: {
    themeSetting: {
      title: '主题设置',
      form: {
        systemTitle: '系统标题',
        homeAndBackendLogo: '首页和后台 logo',
        loadingPageLogo: '加载页面 logo',
        websiteLogo: '站标 logo',
        background: '背景图片'
      },
      changeLogo: '更换 logo'
    },
    dataClearSetting: {
      title: '数据清理设置',
      form: {
        cleanupType: '清理类型',
        retentionDays: '保留天数',
        lastCleanupTime: '上次清理时间',
        lastCleanupDataTime: '上次清理数据时间节点',
        enabled: '是否启用'
      },
      type: {
        equipmentData: '设备数据',
        operationLog: '操作日志'
      }
    }
  },
  notification: {
    enableDisableService: '开启/关闭服务',
    email: {
      title: '邮箱',
      form: {
        sendMailServer: '发送邮件服务器',
        sendPort: '发送端口',
        senderMail: '发送人邮件',
        authorizationCodeOrPassword: '授权码/密码',
        ssl: '开启SSL',
        inbox: '收件箱',
        message: '消息内容'
      }
    },
    shortMessage: {
      title: '短信'
    },
    pushNotification: {
      title: '推送信息',
      pushServer: '推送服务器'
    }
  },
  validation: {
    commandIdentifierRequired: '命令标识符不能为空'
  }
}
