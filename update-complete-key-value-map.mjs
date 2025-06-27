import fs from 'fs';
import path from 'path';

console.log('🔄 更新完整的键值映射...');

// 读取现有的键值映射
let existingMap = {};
try {
  const existingContent = fs.readFileSync('complete-key-value-map-v2.json', 'utf8');
  existingMap = JSON.parse(existingContent);
  console.log(`📖 读取到现有映射 ${Object.keys(existingMap).length} 个`);
} catch (error) {
  console.log('📝 创建新的映射文件');
}

// 从现有语言包中提取的 common.* 键值映射
const commonKeyMap = {
  'common.January': '一月',
  'common.accompaniedIndicators': '伴随指标',
  'common.activateScene': '激活场景',
  'common.activateSceneInfo': '激活场景信息',
  'common.activationPrompt': '激活提示',
  'common.addExtendedInfo': '添加扩展信息',
  'common.addFail': '添加失败',
  'common.addSuccess': '添加成功',
  'common.alarmHistory': '告警历史',
  'common.alarmRules': '告警规则',
  'common.alarm_level': '告警级别',
  'common.alarm_time': '告警时间',
  'common.allStatus': '全部状态',
  'common.alreadyCurveChart': '已是曲线图',
  'common.alreadyScatterPlot': '已是散点图',
  'common.alreadyToChart': '已转为图表',
  'common.as': '如',
  'common.associatedDevices': '关联设备',
  'common.automatic': '自动',
  'common.average': '平均值',
  'common.backToHome': '返回首页',
  'common.base': '基础',
  'common.batchDelete': '批量删除',
  'common.between': '之间',
  'common.browserNotSupport': '浏览器不支持',
  'common.changeTableColumns': '更改表格列',
  'common.chart': '图表',
  'common.check': '检查',
  'common.chooseNotificationMethod': '选择通知方式',
  'common.columnSetting': '列设置',
  'common.complete': '完成',
  'common.componentsAddedYet': '尚未添加组件',
  'common.contentToCopied': '内容已复制',
  'common.copiedClipboard': '已复制到剪贴板',
  'common.copyFailed': '复制失败',
  'common.copyingFailed': '复制失败',
  'common.createNotificationGroup': '创建通知组',
  'common.dataProces': '数据处理',
  'common.dataSources': '数据源',
  'common.dayBeforeYesterday': '前天',
  'common.days1': '1天',
  'common.days7': '7天',
  'common.debug': '调试',
  'common.deleteDeviceConfig': '删除设备配置',
  'common.deleteFail': '删除失败',
  'common.deleteFailed': '删除失败',
  'common.deleteProcessing': '删除处理中',
  'common.deletePrompt': '删除提示',
  'common.deleteSceneInfo': '删除场景信息',
  'common.description': '描述',
  'common.deviceAccessType': '设备接入类型',
  'common.deviceConditions': '设备条件',
  'common.deviceConfigName': '设备配置名称',
  'common.deviceConnectionMethod': '设备连接方式',
  'common.devicesSetting': '设备设置',
  'common.diffValue': '差值',
  'common.editExtendedInfo': '编辑扩展信息',
  'common.editFail': '编辑失败',
  'common.editNotificationGroup': '编辑通知组',
  'common.editSuccess': '编辑成功',
  'common.enterAlarmDesc': '请输入告警描述',
  'common.enterAlarmLevel': '请输入告警级别',
  'common.enterAlarmName': '请输入告警名称',
  'common.enterJson': '请输入JSON',
  'common.enterName': '请输入名称',
  'common.enterNumberTriggering': '请输入触发次数',
  'common.enterTriggeringDuration': '请输入触发持续时间',
  'common.equal': '等于',
  'common.everyDay': '每天',
  'common.everyHour': '每小时',
  'common.extensionInfoDeleted': '扩展信息已删除',
  'common.fetchDataFailed': '获取数据失败',
  'common.formatFile': '格式文件',
  'common.greaterOrEqual': '大于等于',
  'common.halfYear': '半年',
  'common.hours1': '1小时',
  'common.hours3': '3小时',
  'common.hours6': '6小时',
  'common.includeList': '包含列表',
  'common.index': '序号',
  'common.input': '输入',
  'common.lastDays15': '最近15天',
  'common.lastDays30': '最近30天',
  'common.lastDays60': '最近60天',
  'common.lastDays90': '最近90天',
  'common.lastOneYear': '最近一年',
  'common.lastSixMonth': '最近半年',
  'common.lastWeekToday': '上周至今',
  'common.lastYear': '去年',
  'common.lastYears1': '最近1年',
  'common.last_5m': '最近5分钟',
  'common.leastOneChart': '至少一个图表',
  'common.lessOrEqual': '小于等于',
  'common.loadFailed': '加载失败',
  'common.logout': '退出登录',
  'common.logoutConfirm': '确认退出登录',
  'common.lookForward': '敬请期待',
  'common.maintenance': '维护',
  'common.manual': '手动',
  'common.maxSelect': '最多选择',
  'common.minute1': '1分钟',
  'common.minute2': '2分钟',
  'common.minutes10': '10分钟',
  'common.minutes30': '30分钟',
  'common.minutes5': '5分钟',
  'common.modifySuccess': '修改成功',
  'common.monthly': '每月',
  'common.months1': '1个月',
  'common.networkError': '网络错误',
  'common.noContentToCopy': '没有内容可复制',
  'common.noData': '暂无数据',
  'common.noMoreData': '没有更多数据',
  'common.nodata': '暂无数据',
  'common.notAggre': '不聚合',
  'common.notificationGroupDesc': '通知组描述',
  'common.operateDevice': '操作设备',
  'common.param': '参数',
  'common.pass': '通过',
  'common.pleaseCheckValue': '请检查数值',
  'common.pleaseUploadit': '请上传',
  'common.pluginConfig': '插件配置',
  'common.propertiesAndFunctions': '属性和功能',
  'common.protocol': '协议',
  'common.protocolConfig': '协议配置',
  'common.rangeMustSelected': '必须选择范围',
  'common.refresh': '刷新',
  'common.remark': '备注',
  'common.remove': '移除',
  'common.repeat': '重复',
  'common.requestMethod': '请求方法',
  'common.requestTime': '请求时间',
  'common.saveSceneInfo': '保存场景信息',
  'common.sceneLinkageInfo': '场景联动信息',
  'common.seconds30': '30秒',
  'common.section': '部分',
  'common.select': '选择',
  'common.selectCardFirst': '请先选择卡片',
  'common.selectPlaceholder': '请选择',
  'common.selectionMode': '选择模式',
  'common.send': '发送',
  'common.service': '服务',
  'common.serviceConfi': '服务配置',
  'common.single': '单次',
  'common.singleClassDevice': '单类设备',
  'common.singleDevice': '单个设备',
  'common.startFail': '启动失败',
  'common.startSuccess': '启动成功',
  'common.stopFail': '停止失败',
  'common.stopSuccess': '停止成功',
  'common.sum': '总和',
  'common.sunrise': '日出',
  'common.sunset': '日落',
  'common.switchBarChart': '切换柱状图',
  'common.switchLineChart': '切换折线图',
  'common.templateDeleted': '模板已删除',
  'common.test': '测试',
  'common.thisYear': '今年',
  'common.timeConditions': '时间条件',
  'common.timeFrame': '时间框架',
  'common.tip': '提示',
  'common.triggerAlarm': '触发告警',
  'common.under': '小于',
  'common.unequal': '不等于',
  'common.userCenter': '用户中心',
  'common.weather': '天气',
  'common.weekly': '每周',
  'common.withinOneMonth': '一个月内',
  'common.withinOneYear': '一年内'
};

// 添加一些 form.* 键
const formKeyMap = {
  'form.userName.invalid': '用户名格式不正确',
  'form.oldPwd.required': '请输入旧密码'
};

// 添加一些 page.* 键
const pageKeyMap = {
  'page.home.greeting': '欢迎回来，{userName}！',
  'page.login.common.welcomeBack': '欢迎回来！',
  'page.login.common.countingLabel': '{second}秒后重新获取',
  'page.login.common.phoneRequired': '手机号码不能为空！',
  'page.login.common.phoneInvalid': '手机号码格式错误！',
  'page.login.common.emailRequired': '邮箱不能为空！',
  'page.login.common.emailInvalid': '邮箱格式错误！',
  'page.dataForward.saveFailed': '保存失败'
};

// 合并所有映射
const newMappings = {
  ...existingMap,
  ...commonKeyMap,
  ...formKeyMap,
  ...pageKeyMap
};

console.log(`📊 统计信息:`);
console.log(`  现有映射: ${Object.keys(existingMap).length} 个`);
console.log(`  新增 common.* 键: ${Object.keys(commonKeyMap).length} 个`);
console.log(`  新增 form.* 键: ${Object.keys(formKeyMap).length} 个`);
console.log(`  新增 page.* 键: ${Object.keys(pageKeyMap).length} 个`);
console.log(`  总映射数: ${Object.keys(newMappings).length} 个`);

// 保存更新的映射
fs.writeFileSync('complete-key-value-map-v2.json', JSON.stringify(newMappings, null, 2), 'utf8');
fs.writeFileSync('complete-key-value-map-v2.mjs', `// 完整的键值映射 (ES模块版本)
export const keyValueMap = ${JSON.stringify(newMappings, null, 2)};

export default keyValueMap;`, 'utf8');

console.log('\n✅ 键值映射已更新！');
console.log('📁 文件已保存:');
console.log('  - complete-key-value-map-v2.json');
console.log('  - complete-key-value-map-v2.mjs');
console.log('\n🚀 现在可以运行增强版逆向国际化脚本了！'); 