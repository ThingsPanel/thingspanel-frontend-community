import axios from "./http";

export function warning_log_list(data){
    return axios({
        url: "/warning/log/list",
        method: "post",
        data
    })
}