/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-01-29 14:11:24
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-20 15:15:28
 * @FilePath: \ThingsPanel-Backend-Vue\src\core\services\api.service.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// import Vue from "vue";
// import axios from "axios";
// import VueAxios from "vue-axios";
// import JwtService from "@/core/services/jwt.service";
import axios from "@/api/interceptor/http";
/**
 * 原方法是使用 VueAxios 发送请求 如：vue.axios.post()
 * 每个页面中请求方法为  ApiService.post(AUTH.local_url + "/markets/list").then(({ data }) => {
 * 响应里再判断 data.code == 401 刷新 token  this.$store.dispatch(REFRESH).then(() => {});
 *
 * 现改为 "@/api/http.js" 中统一设置请求头 和 刷新 token 的方法，/src/api 里封装接口
 */

/**
 * Service to call HTTP request via Axios
 */
const ApiService = {
  init() {
    // Vue.use(VueAxios, axios);
    // Vue.axios.defaults.baseURL = "/api";
  },

  /**
   * Set the default HTTP request headers
   */
  setHeader() {
    // Vue.axios.defaults.headers.common[
    //   "Authorization"
    // ] = `Bearer ${JwtService.getToken()}`;
  },

  query(resource, params) {
    return axios.get(resource, params).catch(error => {
      // console.log(error);
      throw new Error(`[KT] ApiService ${error}`);
    });
  },

  /**
   * Send the GET HTTP request
   * @param resource
   * @param slug
   * @returns {*}
   */
  get(resource, slug = "") {
    return axios.get(`${resource}${slug}`).catch(error => {
      // console.log(error);
      throw new Error(`[KT] ApiService ${error}`);
    });
  },

  /**
   * Set the POST HTTP request
   * @param resource
   * @param params
   * @returns {*}
   */
  post(resource, params) {
    // console.log(resource)
    return axios.post(`${resource}`, params);
  },

  /**
   * Send the UPDATE HTTP request
   * @param resource
   * @param slug
   * @param params
   * @returns {IDBRequest<IDBValidKey> | Promise<void>}
   */
  update(resource, slug, params) {
    return axios.put(`${resource}/${slug}`, params);
  },

  /**
   * Send the PUT HTTP request
   * @param resource
   * @param params
   * @returns {IDBRequest<IDBValidKey> | Promise<void>}
   */
  put(resource, params) {
    return axios.put(`${resource}`, params);
  },

  /**
   * Send the DELETE HTTP request
   * @param resource
   * @returns {*}
   */
  delete(resource) {
    return axios.delete(resource).catch(error => {
      // console.log(error);
      throw new Error(`[RWV] ApiService ${error}`);
    });
  }
};

export default ApiService;
