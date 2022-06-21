import axios from "./http"

// 自动化的列表
export function work_index(data){
    return axios({
        url: "/asset/work_index",
        method: "post",
        data
    })
}