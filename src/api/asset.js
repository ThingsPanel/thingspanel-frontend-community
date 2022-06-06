import axios from "./http"

// 资产
export function asset_list(data) {
    return axios({
        url: "/asset/list",
        method: "post",
        data,
    })
}