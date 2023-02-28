/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-14 11:39:30
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-28 10:51:29
 * @FilePath: \ThingsPanel-Backend-Vue\src\core\mixins\common.js
 * @Description: 
 */
import Vue from 'vue'
Vue.mixin({
  methods: {
    /**
     * 转换时间格式
     * @param {*} format 
     * @returns 
     */
    formatDate(format) {
      var n = parseInt(format) * 1000;
      var D = new Date(n);
      var year = D.getFullYear(); //四位数年份

      var month = D.getMonth() + 1; //月份(0-11),0为一月份
      month = month < 10 ? "0" + month : month;

      var day = D.getDate(); //月的某一天(1-31)
      day = day < 10 ? "0" + day : day;

      var hours = D.getHours(); //小时(0-23)
      hours = hours < 10 ? "0" + hours : hours;

      var minutes = D.getMinutes(); //分钟(0-59)
      minutes = minutes < 10 ? "0" + minutes : minutes;

      var seconds = D.getSeconds(); //秒(0-59)
      seconds = seconds < 10 ? "0" + seconds : seconds;
      // var week = D.getDay();//周几(0-6),0为周日
      // var weekArr = ['周日','周一','周二','周三','周四','周五','周六'];

      var now_time = year + "-" + month + "-" + day +" " + hours + ":" + minutes + ":" + seconds;
      return now_time;
    },


    jsonTypeConvert(t, v) {
      const type = t?.toLowerCase() || "";
      if (type === "float" || type === "integer" || type === "number") {
        return Number(v);
      } else {
        return v.toString();
      }
    }
  }
})