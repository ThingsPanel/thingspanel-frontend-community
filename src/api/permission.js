import axios from "./interceptor/http"

export default {
    /**
     * 分页列表
     * @param data
     * @returns {AxiosPromise}
     */
    page: (data) => {
        return axios({
            url: "/user/function/list",
            method: "post",
            data
        })
    },

    /**
     * 所有权限列表
     * @param data
     * @returns {AxiosPromise}
     */
    list: (data) => {
        return axios({
            url: "/user/function/tree",
            method: "post",
            data
        })
    },


    /**
     * 查询单个
     * @param data
     * @returns {AxiosPromise}
     */
    getOne: (data) => {
        return axios({
            url: "/user/function/list",
            method: "post",
            data
        })
    },

    /**
     * 新增或修改
     * @param url  add/edit
     * @param data
     * @returns {AxiosPromise}
     */
    saveOrUpdate: (url, data) => {
        return axios({
            url: "/user/function/" + url,
            method: "post",
            data
        })
    },

    /**
     * 新增
     * @param data
     * @returns {AxiosPromise}
     */
    add: (data) => {
        return axios({
            url: "/user/function/add",
            method: "post",
            data
        })
    },

    /**
     * 修改
     * @param data
     * @returns {AxiosPromise}
     */
    edit: (data) => {
        return axios({
            url: "/user/function/edit",
            method: "post",
            data
        })
    },

    /**
     * 删除
     * @param data
     * @returns {AxiosPromise}
     */
    del: (data) => {
        return axios({
            url: "/user/function/delete",
            method: "post",
            data
        })
    },

    /**
     * 树形下拉列表
     * @param data
     * @returns {AxiosPromise}
     */
    tree: (data) => {
        return axios({
            url: "/user/function/pull-down-list",
            method: "post",
            data
        })
    },

    /**
     * 获取当前用户的菜单和路由
     * @param data
     * @returns {AxiosPromise}
     */
    getPermissions: (data) => {
        return axios({
            url: "/user/function/auth",
            method: "post",
            data
        })
    },

    /**
     * 给角色分配权限
     * @param data
     * @returns {AxiosPromise}
     */
    assignPermissions: (data) => {
        return axios({
            url: "/casbin/role/function/update",
            method: "post",
            data
        })
    },

    /**
     * 查询角色的权限
     * @param data
     * @returns {AxiosPromise}
     */
    getPermissionsByRole: (data) => {
        return axios({
            url: "/casbin/role/function/index",
            method: "post",
            data
        })
    }

}
