export default {
  common: {
    status: {
      enable: 'Enable',
      disable: 'Disable'
    }
  },
  role: {
    title: 'Role List',
    roleName: 'Role Name',
    roleCode: 'Role Code',
    roleStatus: 'Role Status',
    roleDesc: 'Role Description',
    form: {
      roleName: 'Please enter role name',
      roleCode: 'Please enter role code',
      roleStatus: 'Please select role status',
      roleDesc: 'Please enter role description'
    },
    addRole: 'Add Role',
    editRole: 'Edit Role',
    editPermission: 'Edit Permission'
  },
  api: {
    title: 'API Key',
    addApiKey: 'Create API Key',
    apiName: 'Name',
    api_key: 'Key',
    apiStatus: 'Status',
    created_at: 'Creation Time',
    apiStatus1: {
      freeze: 'Freeze',
      normal: 'Normal'
    },
    form: {
      apiName: 'Please enter API key name'
    },
    editAPi: 'Edit'
  },
  user: {
    title: 'User List',
    userName: 'Name',
    userGender: 'Gender',
    nickName: 'Nickname',
    userPhone: 'Phone Number',
    accountStatus: 'Account Status',
    remark: 'Remark',
    userEmail: 'Email',
    userStatus: 'Tenant Status',
    userStatus2: 'User Status',
    userRole: 'Tenant Role',
    userRole2: 'User Role',
    password: 'Password',
    confirmPwd: 'Confirm Password',
    enter: 'Enter',
    form: {
      userName: 'Please enter name',
      userGender: 'Please select gender',
      nickName: 'Please enter nickname',
      userPhone: 'Please enter phone number',
      userEmail: 'Please enter email',
      userStatus: 'Please select tenant status',
      userRole: 'Please select tenant role',
      userRole2: 'Please select user role'
    },
    addUser: 'Add User',
    editUser: 'Edit User',
    gender: {
      male: 'Male',
      female: 'Female'
    },
    status: {
      freeze: 'Freeze',
      normal: 'Normal'
    }
  },
  menu: {
    title: 'Menu Management',
    id: 'ID',
    parentId: 'Parent Menu ID',
    authority: 'Authority',
    menuType: 'Menu Type',
    menuName: 'Menu Name',
    componentType: 'Component Type',
    routeName: 'Route Name',
    routePath: 'Route Path',
    page: 'Page Component',
    layout: 'Layout',
    i18nKey: 'Internationalization Key',
    icon: 'Icon',
    localIcon: 'Local Icon',
    iconTypeTitle: 'Icon Type',
    order: 'Order',
    keepAlive: 'Cache Route',
    href: 'External Link',
    hideInMenu: 'Hide in Menu',
    activeMenu: 'Highlighted Menu',
    multiTab: 'Support Multi-Tab',
    fixedIndexInTab: 'Fixed Index in Tab',
    button: 'Button',
    buttonCode: 'Button Code',
    buttonDesc: 'Button Description',
    menuStatus: 'Menu Status',
    form: {
      parent: 'Parent Menu',
      title: 'Title',
      multilingual: 'Title (Multilingual)',
      name: 'Name',
      path: 'Access Path',
      route_path: 'Component Path',
      componentType: 'Component Type',
      icon: 'Icon',
      order: 'Order',
      type: 'Type',
      authority: 'Authority',
      menuType: 'Please select menu type',
      menuName: 'Please enter menu name',
      routeName: 'Please enter route name',
      routePath: 'Please enter route path',
      page: 'Please select page component',
      layout: 'Please select layout component',
      i18nKey: 'Please enter internationalization key',
      localIcon: 'Please select local icon',
      keepAlive: 'Please select whether to cache route',
      href: 'Please enter external link',
      hideInMenu: 'Please select whether to hide menu',
      activeMenu: 'Please enter the route name of the highlighted menu',
      multiTab: 'Please select whether to support multi-tab',
      fixedInTab: 'Please select whether to fix in tab',
      fixedIndexInTab: 'Please enter the fixed index in the tab',
      button: 'Please select whether it is a button',
      buttonCode: 'Please enter button code',
      buttonDesc: 'Please enter button description',
      menuStatus: 'Please select menu status'
    },
    addMenu: 'Add Menu',
    editMenu: 'Edit Menu',
    addChildMenu: 'Add Child Menu',
    type: {
      directory: 'Directory',
      menu: 'Menu'
    },
    iconType: {
      iconify: 'Iconify Icon',
      local: 'Local Icon'
    },
    tooltip: {
      deviceConfig: 'All configurations including protocol and other parameters for the device',
      deviceTemplate: 'Define the thing model and display charts'
    }
  },
  setting: {
    themeSetting: {
      title: 'Theme Settings',
      form: {
        systemTitle: 'System Title',
        homeAndBackendLogo: 'Homepage and Backend Logo',
        loadingPageLogo: 'Loading Page Logo',
        websiteLogo: 'Website Logo',
        background: 'Background Image'
      },
      changeLogo: 'Change Logo'
    },
    dataClearSetting: {
      title: 'Data Cleanup Settings',
      form: {
        cleanupType: 'Cleanup Type',
        retentionDays: 'Retention Days',
        lastCleanupTime: 'Last Cleanup Time',
        lastCleanupDataTime: 'Last Cleanup Data Time Node',
        enabled: 'Enabled'
      },
      type: {
        equipmentData: 'Device Data',
        operationLog: 'Operation Log'
      }
    }
  },
  notification: {
    enableDisableService: 'Enable/Disable Service',
    email: {
      title: 'Email',
      form: {
        sendMailServer: 'Send Mail Server',
        sendPort: 'Send Port',
        senderMail: 'Sender Email',
        authorizationCodeOrPassword: 'Authorization Code/Password',
        ssl: 'Enable SSL',
        inbox: 'Inbox',
        message: 'Message Content'
      }
    },
    shortMessage: {
      title: 'SMS'
    },
    pushNotification: {
      title: 'Push Notification',
      pushServer: 'Push Server'
    }
  },
  validation: {
    commandIdentifierRequired: 'Command Identifier is required'
  }
};
