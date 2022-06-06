import axios from "./http";

// 业务
export function business_index(data){
    return axios({
        url: "/business/index",
        method: "post",
        data
    })
}