// 简单的分类系统测试脚本
import('./src/card2.1/index.js').then(module => {
  console.log('=== 分类系统测试结果 ===');
  const tree = module.getComponentTree();
  console.log('分类统计:');
  
  const categoryStats = {};
  Object.values(tree).forEach(component => {
    const category = `${component.mainCategory}/${component.subCategory}`;
    categoryStats[category] = (categoryStats[category] || 0) + 1;
    console.log(`${component.name}: ${category}`);
  });
  
  console.log('\n分类统计结果:');
  Object.entries(categoryStats).forEach(([category, count]) => {
    console.log(`${category}: ${count}个组件`);
  });
}).catch(error => {
  console.error('测试失败:', error);
});