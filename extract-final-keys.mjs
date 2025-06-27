import fs from 'fs';

console.log('🔍 从语言包中提取剩余键的翻译...');

// 读取现有的键值映射
let existingMap = {};
try {
  const existingContent = fs.readFileSync('complete-key-value-map-v2.json', 'utf8');
  existingMap = JSON.parse(existingContent);
  console.log(`📖 读取到现有映射 ${Object.keys(existingMap).length} 个`);
} catch (error) {
  console.log('📝 创建新的映射文件');
}

// 手动添加剩余的键值映射
const finalKeyMap = {
  // card.* 键
  'card.fetchError': '获取错误',
  'card.unknownError': '未知错误',
  'card.no': '否',
  'card.on': '开',
  'card.off': '关',
  'card.systemData': '系统数据',
  'card.deviceData': '设备数据',
  'card.shadowColor': '阴影颜色',
  'card.networkImageText': '网络图片文本',
  'card.dupCardId': '重复的卡片ID: {id}',
  
  // generate.* 键
  'generate.step': '步长',
  'generate.decimals': '小数位数',
  'generate.InputMinValue': '输入最小值',
  'generate.failedToLoadDeviceTemplates': '加载设备模板失败',
  'generate.addFailed': '添加失败',
  'generate.editFailed': '编辑失败',
  'generate.failedToParseProtocolConfig': '解析协议配置失败',
  'generate.failedToLoadConfig': '加载配置失败',
  
  // route.* 键
  'route.apply_in': '插件管理',
  'route.apply_service': '协议插件管理',
  'route.automation_scene-linkage': '场景联动',
  'route.device_template': '设备模型',
  'route.alarm': '告警',
  'route.management_user': '租户管理',
  
  // item.* 键
  'item.titleKey': '标题键',
  'item.descriptionKey': '描述键',
  'item.data.title': '数据标题',
  'item.title': '标题',
  
  // page.* 键 (已有的)
  'page.login.common.countingLabel': '{second}秒后重新获取',
  'page.login.common.welcomeBack': '欢迎回来！',
  'page.home.greeting': '欢迎回来，{userName}！',
  
  // dtype.* 键
  'dtype.labelKey': '标签键',
  'dtype.helpKey': '帮助键',
  
  // 其他单个键
  'config.label': '配置标签',
  'buttons.refresh': '刷新',
  'view.label': '视图标签',
  'props.addButtonI18nKey': '添加按钮国际化键',
  'kanban.add-cards': '添加卡片',
  'op.remark': '操作备注',
  'i18nKey': '国际化键',
  'custom.associatedDevices.selectDeviceFirst': '请先选择设备',
  'modalTitle': '模态框标题',
  'row.multilingual': '多语言',
  'key': '键',
  'loginModuleRecord.register': '注册'
};

// 合并所有映射
const newMappings = {
  ...existingMap,
  ...finalKeyMap
};

console.log(`📊 统计信息:`);
console.log(`  现有映射: ${Object.keys(existingMap).length} 个`);
console.log(`  新增映射: ${Object.keys(finalKeyMap).length} 个`);
console.log(`  总映射数: ${Object.keys(newMappings).length} 个`);

// 按前缀分组显示新增的键
const prefixGroups = {};
Object.keys(finalKeyMap).forEach(key => {
  const prefix = key.split('.')[0];
  if (!prefixGroups[prefix]) {
    prefixGroups[prefix] = [];
  }
  prefixGroups[prefix].push(key);
});

console.log('\n📝 新增键按前缀分组:');
Object.entries(prefixGroups)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([prefix, keys]) => {
    console.log(`  ${prefix}.*: ${keys.length} 个`);
    keys.forEach(key => {
      console.log(`    ${key}: "${finalKeyMap[key]}"`);
    });
  });

// 保存更新的映射
fs.writeFileSync('complete-key-value-map-v2.json', JSON.stringify(newMappings, null, 2), 'utf8');
fs.writeFileSync('complete-key-value-map-v2.mjs', `// 完整的键值映射 (ES模块版本)
export const keyValueMap = ${JSON.stringify(newMappings, null, 2)};

export default keyValueMap;`, 'utf8');

console.log('\n✅ 最终键值映射已更新！');
console.log('📁 文件已保存:');
console.log('  - complete-key-value-map-v2.json');
console.log('  - complete-key-value-map-v2.mjs');
console.log('\n🚀 现在可以运行最终的逆向国际化脚本了！'); 