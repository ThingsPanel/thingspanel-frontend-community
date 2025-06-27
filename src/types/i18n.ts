/**
 * 国际化类型定义
 * 为新版本的模块化国际化结构提供TypeScript类型支持
 */

// 通用类型定义
export interface CommonTranslations {
  buttons: {
    confirm: string
    cancel: string
    save: string
    delete: string
    edit: string
    add: string
    create: string
    update: string
    submit: string
    reset: string
    search: string
    filter: string
    export: string
    import: string
    refresh: string
    back: string
    next: string
    previous: string
    close: string
    view: string
    details: string
    copy: string
    download: string
    upload: string
  }
  status: {
    active: string
    inactive: string
    online: string
    offline: string
    connected: string
    disconnected: string
    success: string
    failed: string
    pending: string
    processing: string
    completed: string
    cancelled: string
    error: string
    warning: string
    info: string
  }
  messages: {
    loading: string
    saving: string
    deleting: string
    success: string
    error: string
    noData: string
    confirmDelete: string
    deleteSuccess: string
    saveSuccess: string
    networkError: string
    serverError: string
    permissionDenied: string
  }
  form: {
    required: string
    invalidEmail: string
    invalidPhone: string
    passwordTooShort: string
    passwordMismatch: string
    pleaseSelect: string
    pleaseInput: string
    selectAll: string
    clear: string
  }
  table: {
    serialNumber: string
    operation: string
    createTime: string
    updateTime: string
    status: string
    description: string
    name: string
    type: string
    total: string
    selected: string
    batchDelete: string
    batchExport: string
  }
  time: {
    year: string
    month: string
    day: string
    hour: string
    minute: string
    second: string
    today: string
    yesterday: string
    thisWeek: string
    thisMonth: string
    lastWeek: string
    lastMonth: string
  }
}

// 页面翻译类型定义
export interface PageTranslations {
  auth: {
    login: {
      title: string
      subtitle: string
      form: {
        username: {
          label: string
          placeholder: string
        }
        password: {
          label: string
          placeholder: string
        }
        rememberMe: string
        submit: string
      }
      forgotPassword: string
      register: string
      thirdPartyLogin: string
      loginSuccess: string
      loginFailed: string
    }
    register: {
      title: string
      subtitle: string
      form: {
        username: {
          label: string
          placeholder: string
        }
        email: {
          label: string
          placeholder: string
        }
        password: {
          label: string
          placeholder: string
        }
        confirmPassword: {
          label: string
          placeholder: string
        }
        agreement: string
        submit: string
      }
      hasAccount: string
      registerSuccess: string
      registerFailed: string
    }
  }
  dashboard: {
    title: string
    overview: {
      title: string
      totalDevices: string
      onlineDevices: string
      offlineDevices: string
      totalAlarms: string
      todayAlarms: string
      dataPoints: string
      systemLoad: string
      memoryUsage: string
    }
    charts: {
      deviceStatus: string
      alarmTrend: string
      dataFlow: string
      systemMetrics: string
    }
    quickActions: {
      title: string
      addDevice: string
      createDashboard: string
      viewAlarms: string
      systemSettings: string
    }
    recentActivities: {
      title: string
      noActivities: string
    }
  }
  device: {
    title: string
    list: {
      title: string
      columns: {
        name: string
        type: string
        status: string
        lastSeen: string
        location: string
        actions: string
      }
      filters: {
        status: string
        type: string
        location: string
      }
      actions: {
        add: string
        edit: string
        delete: string
        view: string
        batchDelete: string
        export: string
        import: string
      }
    }
    form: {
      title: {
        add: string
        edit: string
      }
      fields: {
        name: {
          label: string
          placeholder: string
        }
        type: {
          label: string
          placeholder: string
        }
        description: {
          label: string
          placeholder: string
        }
        location: {
          label: string
          placeholder: string
        }
        protocol: {
          label: string
          placeholder: string
        }
        config: {
          label: string
          placeholder: string
        }
      }
    }
    details: {
      title: string
      tabs: {
        info: string
        data: string
        alarms: string
        logs: string
        config: string
      }
      info: {
        basicInfo: string
        status: string
        lastSeen: string
        uptime: string
        version: string
      }
    }
    status: {
      online: string
      offline: string
      maintenance: string
      error: string
    }
  }
  // 其他页面类型定义...
}

// 组件翻译类型定义
export interface ComponentTranslations {
  common: {
    loading: string
    noData: string
    error: string
    retry: string
  }
  form: {
    validation: {
      required: string
      email: string
      phone: string
      url: string
      number: string
      integer: string
      minLength: string
      maxLength: string
      min: string
      max: string
      pattern: string
    }
    actions: {
      submit: string
      reset: string
      cancel: string
      save: string
      saveAndContinue: string
    }
  }
  table: {
    columns: {
      index: string
      actions: string
    }
    pagination: {
      total: string
      pageSize: string
      current: string
      prev: string
      next: string
      goto: string
    }
    selection: {
      selectAll: string
      selected: string
      clear: string
    }
    sorting: {
      asc: string
      desc: string
    }
    filtering: {
      filter: string
      clear: string
      apply: string
    }
  }
  chart: {
    noData: string
    loading: string
    error: string
    refresh: string
    fullscreen: string
    download: string
    settings: string
  }
  layout: {
    header: {
      profile: string
      settings: string
      logout: string
      language: string
      theme: string
    }
    sidebar: {
      collapse: string
      expand: string
    }
    footer: {
      copyright: string
      version: string
    }
  }
}

// 验证翻译类型定义
export interface ValidationTranslations {
  form: {
    required: string
    email: string
    phone: string
    url: string
    number: string
    integer: string
    minLength: string
    maxLength: string
    min: string
    max: string
    pattern: string
    custom: string
  }
  device: {
    nameRequired: string
    typeRequired: string
    protocolRequired: string
    configInvalid: string
  }
  user: {
    usernameRequired: string
    emailRequired: string
    passwordRequired: string
    passwordTooShort: string
    passwordMismatch: string
    phoneInvalid: string
  }
}

// API翻译类型定义
export interface ApiTranslations {
  errors: {
    networkError: string
    serverError: string
    unauthorized: string
    forbidden: string
    notFound: string
    timeout: string
    badRequest: string
    conflict: string
    tooManyRequests: string
    internalError: string
  }
  success: {
    created: string
    updated: string
    deleted: string
    saved: string
    uploaded: string
    downloaded: string
    imported: string
    exported: string
  }
}

// 主要翻译接口
export interface I18nTranslations {
  common: CommonTranslations
  pages: PageTranslations
  components: ComponentTranslations
  validation: ValidationTranslations
  api: ApiTranslations
}

// 翻译键类型
export type I18nKeys =
  | `common.${keyof CommonTranslations}`
  | `common.buttons.${keyof CommonTranslations['buttons']}`
  | `common.status.${keyof CommonTranslations['status']}`
  | `common.messages.${keyof CommonTranslations['messages']}`
  | `common.form.${keyof CommonTranslations['form']}`
  | `common.table.${keyof CommonTranslations['table']}`
  | `common.time.${keyof CommonTranslations['time']}`
  | `pages.auth.login.${keyof PageTranslations['auth']['login']}`
  | `pages.auth.register.${keyof PageTranslations['auth']['register']}`
  | `pages.dashboard.${keyof PageTranslations['dashboard']}`
  | `pages.device.${keyof PageTranslations['device']}`
  | `components.${keyof ComponentTranslations}`
  | `validation.${keyof ValidationTranslations}`
  | `api.${keyof ApiTranslations}`

// 翻译函数类型
export type TranslationFunction = (key: I18nKeys, params?: Record<string, any>) => string

// 翻译上下文类型
export interface I18nContext {
  locale: string
  fallbackLocale: string
  messages: I18nTranslations
  t: TranslationFunction
}

// 语言选项类型
export interface LanguageOption {
  code: string
  name: string
  flag: string
}

// 支持的语言
export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'ja-JP', name: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', name: '한국어', flag: '🇰🇷' }
]

// 默认语言
export const DEFAULT_LANGUAGE = 'zh-CN'

// 翻译配置类型
export interface I18nConfig {
  locale: string
  fallbackLocale: string
  messages: Record<string, I18nTranslations>
  silentTranslationWarn: boolean
  silentFallbackWarn: boolean
  formatFallbackMessages: boolean
}

// 导出默认配置
export const defaultI18nConfig: Partial<I18nConfig> = {
  locale: DEFAULT_LANGUAGE,
  fallbackLocale: 'en-US',
  silentTranslationWarn: false,
  silentFallbackWarn: false,
  formatFallbackMessages: true
}
