/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-07-31 10:24:33
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-10-31 17:41:51
 * @FilePath: \ThingsPanel-Backend-Vue\src\mock\index.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import Mock from 'mockjs';
import dashboardAPI from './dashboard';

Mock.setup({
  timeout: '350-600',
});

Mock.mock(/\/dashboard/, 'get', dashboardAPI.fetchDashboard);
Mock.mock(/\/api\/chart_data/, 'get', dashboardAPI.fetchChartData);


export default Mock;
