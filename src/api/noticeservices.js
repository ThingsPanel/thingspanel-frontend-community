import axios from "./interceptor/http"

// 保存
export function getSmsSave(data) {
    return axios({
        url: "/notification/config/save",
        method: "post",
        data
    })
}



// 回显
export function getDetail(data) {
    return axios({
        url: "/notification/config/detail",
        method: "post",
        data
    })
}

// 发送短信
export function getSendSms(data) {
    return axios({
        url: "/notification/send/message",
        method: "post",
        data
    })
}
// 发送邮箱
export function getSendEmail(data) {
    return axios({
        url: "/notification/send/email",
        method: "post",
        data
    })
}






