import axios from "./interceptor/http"

// 通知记录列表
export function getList(data) {
    return axios({
        url: "/notification/history/list",
        method: "post",
        data
    })
}