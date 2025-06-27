declare namespace I18n {
  type LangType = 'zh-CN' | 'en-US'

  interface Schema {
    common: {
      confirm: string
      cancel: string
    }
    page: {
      home: {
        title: string
      }
    }
  }

  type I18nKey = 'common.confirm' | 'common.cancel' | 'page.home.title'

  type $T = (key: I18nKey, ...args: any[]) => string
}
