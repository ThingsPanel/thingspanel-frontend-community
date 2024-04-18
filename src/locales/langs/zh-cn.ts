import { productLocaleZhCn } from '@/views/product/locales/zh-CN';
import { pzh_cn } from '@/locales/langs/页面国际化文件';
import { czh_cn } from './你新增的路由相关的国际化';

const local: App.I18n.Schema = {
  default: '',
  system: {
    title: 'System Name: {name}'
  },
  common: {
    complete: '完成',
    action: '操作',
    input: '请输入',
    select: '请选择',
    remark: '备注',
    add: '新增',
    save: '保存',
    addSuccess: '添加成功',
    backToHome: '返回首页',
    batchDelete: '批量删除',
    cancel: '取消',
    check: '勾选',
    columnSetting: '列设置',
    confirm: '确认',
    delete: '删除',
    deleteSuccess: '删除成功',
    confirmDelete: '确认删除吗？',
    edit: '编辑',
    index: '序号',
    logout: '退出登录',
    logoutConfirm: '确认退出登录吗？',
    lookForward: '敬请期待',
    modify: '修改',
    modifySuccess: '修改成功',
    operate: '操作',
    pleaseCheckValue: '请检查输入的值是否合法',
    refresh: '刷新',
    reset: '重置',
    search: '搜索',
    tip: '提示',
    update: '更新',
    refreshTable: '刷新表格',
    changeTableColumns: '表格列设置',
    updateSuccess: '更新成功',
    userCenter: '个人中心',
    export: '导出',
    description: '描述',
    yesOrNo: {
      yes: '是',
      no: '否'
    },
    debug: '调试',
    send: '发送',
    creationTime: '创建时间'
  },
  theme: {
    themeSchema: {
      title: '主题模式',
      light: '亮色模式',
      dark: '暗黑模式',
      auto: '跟随系统'
    },
    layoutMode: {
      title: '布局模式',
      vertical: '左侧菜单模式',
      'vertical-mix': '左侧菜单混合模式',
      horizontal: '顶部菜单模式',
      'horizontal-mix': '顶部菜单混合模式'
    },
    themeColor: {
      title: '主题颜色',
      primary: '主色',
      info: '信息色',
      success: '成功色',
      warning: '警告色',
      error: '错误色',
      followPrimary: '跟随主色'
    },
    scrollMode: {
      title: '滚动模式',
      wrapper: '外层滚动',
      content: '主体滚动'
    },
    page: {
      animate: '页面切换动画',
      mode: {
        title: '页面切换动画类型',
        'fade-slide': '滑动',
        fade: '淡入淡出',
        'fade-bottom': '底部消退',
        'fade-scale': '缩放消退',
        'zoom-fade': '渐变',
        'zoom-out': '闪现',
        none: '无'
      }
    },
    fixedHeaderAndTab: '固定头部和标签栏',
    header: {
      height: '头部高度',
      breadcrumb: {
        visible: '显示面包屑',
        showIcon: '显示面包屑图标'
      }
    },
    tab: {
      visible: '显示标签栏',
      cache: '缓存标签页',
      height: '标签栏高度',
      mode: {
        title: '标签栏风格',
        chrome: '谷歌风格',
        button: '按钮风格'
      }
    },
    sider: {
      inverted: '深色侧边栏',
      width: '侧边栏宽度',
      collapsedWidth: '侧边栏折叠宽度',
      mixWidth: '混合布局侧边栏宽度',
      mixCollapsedWidth: '混合布局侧边栏折叠宽度',
      mixChildMenuWidth: '混合布局子菜单宽度'
    },
    footer: {
      visible: '显示底部',
      fixed: '固定底部',
      height: '底部高度',
      right: '底部局右'
    },
    themeDrawerTitle: '主题配置',
    pageFunTitle: '页面功能',
    configOperation: {
      copyConfig: '复制配置',
      copySuccessMsg: '复制成功，请替换 src/theme/settings.ts 中的变量 themeSettings',
      resetConfig: '重置配置',
      resetSuccessMsg: '重置成功'
    }
  },
  route: {
    login: '登录',
    403: '无权限',
    404: '页面不存在',
    500: '服务器错误',
    home: '首页',
    'user-center': '个人中心',
    about: '关于',
    function: '系统功能',
    function_tab: '标签页',
    'function_multi-tab': '多标签页',
    'function_hide-child': '隐藏子菜单',
    'function_hide-child_one': '隐藏子菜单',
    'function_hide-child_two': '菜单二',
    'function_hide-child_three': '菜单三',
    manage: '系统管理新',
    manage_user: '用户管理新',
    'manage_user-detail': '用户详情新',
    manage_role: '角色管理新',
    manage_menu: '菜单管理新',
    'multi-menu': '多级菜单',
    'multi-menu_first': '菜单一',
    'multi-menu_first_child': '菜单一子菜单',
    'multi-menu_second': '菜单二',
    'multi-menu_second_child': '菜单二子菜单',
    'multi-menu_second_child_home': '菜单二子菜单首页',
    exception: '异常页',
    exception_403: '403',
    exception_404: '404',
    exception_500: '500',
    component: '组件示例',
    component_button: '按钮',
    component_card: '卡片',
    component_table: '表格',
    ...czh_cn,
    device_template: '功能模板',
    'personal-center': '个人中心',
    'edit-area': '编辑空间/区域',
    'new-area': '添加空间/区域'
  },
  page: {
    product: productLocaleZhCn,
    login: {
      common: {
        loginOrRegister: '登录 / 注册',
        userNamePlaceholder: '请输入用户名',
        phonePlaceholder: '请输入手机号',
        codePlaceholder: '请输入验证码',
        passwordPlaceholder: '请输入密码',
        confirmPasswordPlaceholder: '请再次输入密码',
        codeLogin: '验证码登录',
        confirm: '确定',
        back: '返回',
        validateSuccess: '验证成功',
        loginSuccess: '登录成功',
        welcomeBack: '欢迎回来，{userName} ！'
      },
      pwdLogin: {
        title: '密码登录',
        rememberMe: '记住我',
        forgetPassword: '忘记密码？',
        register: '注册账号',
        otherAccountLogin: '其他账号登录',
        otherLoginMode: '其他登录方式',
        superAdmin: '超级管理员',
        admin: '管理员',
        user: '普通用户'
      },
      codeLogin: {
        title: '验证码登录',
        getCode: '获取验证码',
        imageCodePlaceholder: '请输入图片验证码'
      },
      register: {
        title: '注册账号',
        agreement: '我已经仔细阅读并接受',
        protocol: '《用户协议》',
        policy: '《隐私权政策》'
      },
      resetPwd: {
        title: '重置密码'
      },
      bindWeChat: {
        title: '绑定微信'
      }
    },
    about: {
      title: '关于',
      introduction: `Soybean Admin 是一个优雅且功能强大的后台管理模板，基于最新的前端技术栈，包括 Vue3, Vite5, TypeScript, Pinia 和 UnoCSS。它内置了丰富的主题配置和组件，代码规范严谨，实现了自动化的文件路由系统。此外，它还采用了基于 ApiFox 的在线Mock数据方案。Soybean Admin 为您提供了一站式的后台管理解决方案，无需额外配置，开箱即用。同样是一个快速学习前沿技术的最佳实践。`,
      projectInfo: {
        title: '项目信息',
        version: '版本',
        latestBuildTime: '最新构建时间',
        githubLink: 'Github 地址',
        previewLink: '预览地址'
      },
      prdDep: '生产依赖',
      devDep: '开发依赖'
    },
    home: {
      greeting: '早安，{userName}, 今天又是充满活力的一天!',
      weatherDesc: '今日多云转晴，20℃ - 25℃!',
      projectCount: '项目数',
      todo: '待办',
      message: '消息',
      downloadCount: '下载量',
      registerCount: '注册量',
      schedule: '作息安排',
      study: '学习',
      work: '工作',
      rest: '休息',
      entertainment: '娱乐',
      visitCount: '访问量',
      turnover: '成交额',
      dealCount: '成交量',
      projectNews: {
        title: '项目动态',
        moreNews: '更多动态',
        desc1: 'Soybean 在2021年5月28日创建了开源项目 soybean-admin!',
        desc2: 'Yanbowe 向 soybean-admin 提交了一个bug，多标签栏不会自适应。',
        desc3: 'Soybean 准备为 soybean-admin 的发布做充分的准备工作!',
        desc4: 'Soybean 正在忙于为soybean-admin写项目说明文档！',
        desc5: 'Soybean 刚才把工作台页面随便写了一些，凑合能看了！'
      },
      creativity: '创意'
    },
    function: {
      tab: {
        tabOperate: {
          title: '标签页操作',
          addTab: '添加标签页',
          addTabDesc: '跳转到关于页面',
          closeTab: '关闭标签页',
          closeCurrentTab: '关闭当前标签页',
          closeAboutTab: '关闭"关于"标签页',
          addMultiTab: '添加多标签页',
          addMultiTabDesc1: '跳转到多标签页页面',
          addMultiTabDesc2: '跳转到多标签页页面(带有查询参数)'
        },
        tabTitle: {
          title: '标签页标题',
          changeTitle: '修改标题',
          change: '修改',
          resetTitle: '重置标题',
          reset: '重置'
        }
      },
      multiTab: {
        routeParam: '路由参数',
        backTab: '返回 function_tab'
      }
    },
    manage: {
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
        editRole: '编辑角色'
      },
      user: {
        title: '用户列表',
        userName: '姓名',
        userGender: '性别',
        nickName: '昵称',
        userPhone: '手机号',
        userEmail: '邮箱',
        userStatus: '租户状态',
        userRole: '租户角色',
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
          userRole: '请选择租户角色'
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
        }
      }
    },
    irrigation: {
      name: '灌溉计划',
      duration: '时长',
      hour: '小时',
      minute: '分钟',
      irrigationDuration: '灌溉时长',
      capacity: '容量',
      areaOrSpace: '空间/区域',
      diviceName: '设备名称',
      controlType: '控制类型',
      planStatus: '计划状态',
      distribute: '下发',
      log: '日志',
      addIrrigationPlan: '新建灌溉计划',
      time: {
        device: '设备',
        name: '定时灌溉',
        planName: '计划名称',
        repeatTime: '重复时间',
        orderCode: '指令编号',
        irrigationTime: '灌溉时间点',
        doorOpeing: '阀门开度',
        week: {
          monday: '周一',
          tuesday: '周二',
          wednesday: '周三',
          thursday: '周四',
          friday: '周五',
          saturday: '周六',
          sunday: '周日'
        },
        log: {
          name: '日志',
          commandIssuanceTime: '指令下发时间',
          instructionContent: '指令内容',
          result: '结果',
          operationType: '操作类型',
          detail: '详情'
        }
      },
      group: {
        name: '群灌计划',
        controlModel: '控制模式',
        startTime: '启动时间',
        runDetail: '执行详情',
        deviceName: '设备名称',
        orderNumber: '指令编号',
        addGroupPlane: '新建群灌计划',
        planName: '计划名称',
        deviceType: '设备类型',
        addDevice: '添加设备',
        duration: ' 灌溉时长',
        singleControl: '单次控制',
        loopControl: '循环控制',
        cycleNumber: '循环次数',
        intervalDuration: '间隔时长',
        clickToAdd: '点击添加',
        choosedDevice: '已选设备',
        chooseDevices: '选择群灌设备',
        deviceCode: '设备编码',
        log: {
          planDetail: '(计划名称) 计划日志',
          runTime: '执行时间',
          operationType: '操作类型',
          runResult: '执行结果',
          detail: '详情'
        },
        detail: {
          commandIssuanceTime: '指令下发时间',
          spaceOrArea: '空间/区域',
          orderContent: '指令内容',
          result: '结果',
          detail: '详情',
          actionType: '操作类型'
        }
      },
      rotation: {
        addRotationPlane: '新建轮灌计划',
        name: '轮灌计划',
        waterPumpEquipment: '水泵设备',
        waterPumpDoorOpening: '水泵阀门开度',
        waterPumpPressure: '水泵压力',
        rotationDuration: '轮灌时长',
        addRotationDevice: '添加灌溉设备',
        valveStatus: '阀门状态',
        pressure: '压力',
        chooseDevice: '选择设备'
      }
    },
    apply: {
      service: {
        form: {
          serviceName: '服务名称',
          deviceType: '设备类型',
          protocolType: '协议类型',
          accessAddress: '接入地址',
          httpAddress: 'HTTP服务地址',
          subTopicPrefix: '插件订阅主题前缀',
          additionalInfo: '链接参数'
        }
      }
    }
  },
  form: {
    required: '不能为空',
    userName: {
      required: '请输入用户名',
      invalid: '用户名格式不正确'
    },
    phone: {
      required: '请输入手机号',
      invalid: '手机号格式不正确'
    },
    pwd: {
      required: '请输入密码',
      invalid: '密码格式不正确'
    },
    code: {
      required: '请输入验证码',
      invalid: '验证码格式不正确'
    },
    email: {
      required: '请输入邮箱',
      invalid: '邮箱格式不正确'
    }
  },
  dropdown: {
    closeCurrent: '关闭',
    closeOther: '关闭其它',
    closeLeft: '关闭左侧',
    closeRight: '关闭右侧',
    closeAll: '关闭所有'
  },
  icon: {
    themeConfig: '主题配置',
    themeSchema: '主题模式',
    lang: '切换语言',
    fullscreen: '全屏',
    fullscreenExit: '退出全屏',
    reload: '刷新页面',
    collapse: '折叠菜单',
    expand: '展开菜单',
    pin: '固定',
    unpin: '取消固定'
  },
  dashboard_panel: {
    addKanBan: '新建看板',
    cardName: {
      date: {
        january: '1月',
        february: '2月',
        march: '3月',
        april: '4月',
        may: '5月',
        june: '6月',
        july: '7月',
        august: '8月',
        september: '9月',
        october: '10月',
        november: '11月',
        december: '12月'
      },
      week: {
        mon: '周一',
        tue: '周二',
        wed: '周三',
        thur: '周四',
        fri: '周五',
        sat: '周六',
        sun: '周日'
      },
      bugNum: '告警总数',
      deviceNum: '设备总数',
      userNum: '用户总数',
      regionNum: '区域总数',
      tenantNumLine: '租户总数（折线图）',
      deviceNumPie: '设备总数（饼图）',
      weatherOverview: '天气概况',
      irrigationArea: '浇灌区域',
      weatherStation: '气象站',
      tenant: '租户',
      onLine: '在线',
      offline: '离线',
      onlineRate: '在线率',
      yesterdayAdd: '昨日新增',
      lastMonthAdd: '上月新增',
      thisMonth: '本月新增',
      active: '已激活',
      notActive: '未激活',
      activationRate: '激活率',
      sevenDayWeather: '最近五天气概况',
      spaceNum: '空间总数',
      areaName: '区域名称',
      corn: '玉米',
      SprinklerIrrigationDitchIrrigation: '喷灌沟灌',
      irrigationTypes: '灌溉类型',
      hectare: '公顷',
      regionalArea: '区域面积',
      sandyLoamSoil: '沙壤土',
      soil: '土壤类型',
      soilMoisture: '土壤湿度',
      temperature: '土壤温度',
      Conductivity: '导电率',
      potassiumContent: '含钾量',
      phosphorusContent: '含磷量',
      nitrogenContent: '含氮量',
      weatherStationData: '气象站数据',
      historyData: '历史数据',
      windSpeed: '风速',
      windDirection: '风向',
      humidity: '湿度',
      pressure: '气压',
      rainfall: '雨量'
    }
  },
  device_template: {
    templateInfo: '模板信息',
    editTemplateInfo: '修改模板信息',
    addDeviceInfo: '添加设备的基本信息',
    modelDefinition: '模型定义',
    deviceParameterDescribe: '根据系统提供的模型来配置参数以及设备类型',
    webChartConfiguration: 'web图表配置',
    bindTheCorrespondingChart: '绑定相对应的图表',
    appChartConfiguration: 'App图表配置',
    editAppDetailsPage: '编辑该设备功能模板的App详情页',
    release: '发布',
    releaseAppStore: '发布到应用商店',
    enterTemplateName: '请输入模板名称',
    templateName: '模板名称',
    templateTage: '模板标签',
    authorName: '作者名称',
    enterAuthorName: '请输入作者名称',
    templateVersion: '模板版本',
    entertemplateVersion: '请输入模板版本',
    illustrate: '说明',
    enterIllustrate: '请输入说明',
    selectCover: '选择封面',
    nextStep: '下一步',
    back: '上一步',
    cancellation: '取消',
    confirm: '确定',
    addTage: '添加标签',
    add: '新增',
    telemetry: '遥测',
    attributes: '属性',
    events: '事件',
    command: '命令',
    addAndEditTelemetry: '新增/编辑遥测',
    addAndEditAttributes: '新增/编辑属性',
    addAndEditEvents: '新增/编辑事件',
    addAndEditCommand: '新增/编辑命令',
    table_header: {
      dataName: '数据名称',
      dataIdentifier: '数据标识符',
      readAndWriteSign: '读写标志',
      dataType: '数据类型',
      unit: '单位',
      pleaseEnterTheUnit: '请输入单位',
      PleaseEnterADescription: '请输入描述',
      description: '描述',
      attributeName: '属性名称',
      attributeIdentifier: '属性标识符',
      eventName: '事件名称',
      eventIdentifier: '事件标识符',
      eventParameters: '事件参数',
      commandName: '命令名称',
      commandIdentifier: '命令标识符',
      commandParameters: '命令参数',
      pleaseEnterADataName: '请输入数据名称',
      pleaseEnterTheDataIdentifier: '请输入数据标识符',
      pleaseEnterTheDataType: '请输入数据类型',
      pleaseEnterTheAttributeName: '请输入属性名称',
      pleaseEnterTheAttributeIdentifier: '请输入属性标识符',
      pleaseEnterTheAttributeType: '请输入属性类型',
      attributeType: '属性类型',
      addEditParameters: '新增/编辑参数',
      parameterName: '参数名称',
      PleaseEnterTheParameterName: '请输入参数名称',
      ParameterIdentifier: '参数标识符',
      PleaseEnterTheParameterIdentifier: '请输入参数标识符',
      ParameterType: '参数类型',
      PleaseSelectParameterType: '请选择参数类型',
      singleControlTask: '单次控制任务',
      addParameters: '添加参数',
      commandDescription: '命令描述',
      pleaseEnterACommandDescription: '请输入命令描述',
      pleaseEnterTheCommandName: '请输入命令名称',
      pleaseEnterTheCommandIdentifier: '请输入命令标识符',
      PleaseEnterTheCommandType: '请输入命令类型',
      eventDescription: '事件描述',
      PleaseEventDescription: '请输入事件描述',
      singleControlTaskl: '单次控制任务',
      PleaseEventName: '请输入事件名称',
      PleaseEeventIdentifier: '请输入事件标识符'
    }
  },

  custom: pzh_cn
};

export default local;
