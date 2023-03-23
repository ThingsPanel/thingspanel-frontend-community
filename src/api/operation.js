import axios from "./interceptor/http"

// 日志列表
export function operation_index(data){
    return axios({
        url: "/operation/list",
        method: "post",
        data
    })
}