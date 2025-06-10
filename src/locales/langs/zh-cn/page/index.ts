// 导入产品相关的中文语言包
// 导入产品相关的中文语言包
import { productLocaleZhCn } from '@/views/product/locales/zh-CN'
// 导入登录页面语言包
import login from '@/locales/langs/zh-cn/page/login'
// 导入关于页面语言包
import about from '@/locales/langs/zh-cn/page/about'
// 导入首页语言包
// 导入首页语言包
import home from '@/locales/langs/zh-cn/page/home'
// 导入功能页面语言包，使用fn别名避免关键字冲突
import fn from '@/locales/langs/zh-cn/page/function' // 修改为完整路径
// 导入管理页面语言包
import manage from '@/locales/langs/zh-cn/page/manage'
// 导入数据转发页面语言包
import dataForward from '@/locales/langs/zh-cn/page/dataForward'
// 导入期望页面语言包
import expect from '@/locales/langs/zh-cn/page/expect'
// 导入灌溉页面语言包
import irrigation from '@/locales/langs/zh-cn/page/irrigation'
// 导入应用页面语言包
import apply from '@/locales/langs/zh-cn/page/apply'
import automation from '@/locales/langs/zh-cn/page/automation'

export default {
  product: productLocaleZhCn,
  login,
  about,
  home,
  function: fn, // map back to 'function' key
  manage,
  dataForward,
  expect,
  irrigation,
  apply,
  automation
}
