declare namespace I18n {
  type LangType = 'zh-CN' | 'en-US'

  interface Schema {
    common: {
      confirm: string
      cancel: string
      button: {
        back: string
      }
      status: {
        registerSuccess: string
      }
    }
    page: {
      home: {
        title: string
      }
      login: {
        title: {
          pwdLogin: string
          resetPwd: string
          codeLogin: string
          [key: string]: string
        }
        [key: string]: any
      }
    }
    route: Record<string, string>
  }

  type I18nKey =
    | 'common.confirm'
    | 'common.cancel'
    | 'common.button.back'
    | 'common.status.registerSuccess'
    | 'page.home.title'
    | 'page.login.title.pwdLogin'
    | 'page.login.title.resetPwd'
    | 'page.login.title.codeLogin'
    | `route.${string}`
    | `page.login.${string}`

  type $T = (key: I18nKey, ...args: any[]) => string
}
