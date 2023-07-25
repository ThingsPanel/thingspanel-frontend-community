import axios from "./interceptor/http";

//OpenApi授权列表分页查询（创建时间倒叙排列，名称模糊匹配）
export function getOpenApiPermissionList(data) {
  return axios({
    url: "/openapi/auth/list",
    method: "post",
    data,
  });
}

// 新增OpenApi授权（新增时候生成app_key和密钥）
export function createOpenApiPermission(data) {
  return axios({
    url: "/openapi/auth/add",
    method: "post",
    data,
  });
}

// 修改OpenApi授权（不能修改app_key和密钥）
export function updateOpenApiPermission(data) {
  return axios({
    url: "/openapi/auth/edit",
    method: "post",
    data,
  });
}
// 删除OpenApi授权
export function deleteOpenApiPermission(data) {
  return axios({
    url: "/openapi/auth/del",
    method: "post",
    data,
  });
}
// api接口分页查询（api_type、service_type检索，name模糊匹配）
export function getApiInterfaceList(openapiId) {
  return axios({
    url: "/openapi/api/list",
    method: "post",
    data: {
      tp_openapi_auth_id: openapiId,
      current_page: 1,
      per_page: 10000,
      name: "",
      api_type: "",
      service_type: "",
    },
  });
}

// 变更OpenApi授权和接口关系（请求参数：tp_openapi_auth_id,[]tp_api_id ）
export function updateOpenApiInterfaceRelationship(data) {
  return axios({
    url: "/openapi/rapi/edit",
    method: "post",
    data,
  });
}
// 设备资源查询
export function getDeviceList(data) {
  return axios({
    url: "/device/business/asset/permissions",
    method: "post",
    data,
  });
}

// 新增OpenApi授权和设备关系
export function createOpenApiDeviceRelationship(data) {
  return axios({
    url: "/openapi/rdevice/add",
    method: "post",
    data,
  });
}
// 删除OpenApi授权和设备关系
export function deleteOpenApiDeviceRelationship(data) {
  return axios({
    url: "/openapi/rdevice/del",
    method: "post",
    data,
  });
}
