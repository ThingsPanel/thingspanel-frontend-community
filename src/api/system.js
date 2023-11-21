import axios from "./interceptor/http"

/**
 * 系统设置API
 */

// 清理数据列表
export function get_cleanup_list() {
  return axios({
    url: "/data/cleanup/list",
    method: "post",
  })
}

// 清理数据编辑
export function edit_cleanup_data(data) {
  return axios({
    url: "/data/cleanup/edit",
    method: "post",
    data
  })
}