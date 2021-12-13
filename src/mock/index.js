import Mock from 'mockjs';
import dashboardAPI from './dashboard';

Mock.setup({
  timeout: '350-600',
});
console.log('dashboardAPI');
console.log(dashboardAPI);

Mock.mock(/\/dashboard/, 'get', dashboardAPI.fetchDashboard);
Mock.mock(/\/api\/chart_data/, 'get', dashboardAPI.fetchChartData);


export default Mock;
