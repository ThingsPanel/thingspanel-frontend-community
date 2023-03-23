/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-01-29 14:11:24
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-20 15:07:54
 * @FilePath: \ThingsPanel-Backend-Vue\src\api\dashboard.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import request from '@/utils/request';

/**
 * 获得dashboard 模块
 * @param {number} dashboardId 展示板模块ID
 */
export function fetchDashboard() {
  return request({
    url: '/dashboard/',
    method: 'get',
  });
}

export function fetchChartData(params) {
  return request({
    url: '/chart_data/',
    method: 'get',
    params,
  });
}
