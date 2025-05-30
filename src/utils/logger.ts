// logger.ts
export default class Logger {
  isDev: boolean = false
  moduleName: string = ''
  constructor(moduleName = '') {
    this.moduleName = moduleName
    this.isDev = import.meta.env.MODE === 'development'
  }
  info(...args: any[]) {
    if (this.isDev) {
      console.info(`[INFO][${this.moduleName}]`, ...args)
    }
  }
  warn(...args: any[]) {
    if (this.isDev) {
      console.info(`[WARN][${this.moduleName}]`, ...args)
    }
  }
  error(...args: any[]) {
    if (this.isDev) {
      console.error(`[ERROR][${this.moduleName}]`, ...args)
    }
  }

  // 可以继续添加其他日志级别的方法
}

export const createLogger = (moduleName: string) => new Logger(moduleName)
