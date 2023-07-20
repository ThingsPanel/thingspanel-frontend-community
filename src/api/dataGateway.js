import axios from "./interceptor/http";

//OpenApi授权列表分页查询（创建时间倒叙排列，名称模糊匹配）
export function getOpenApiPermissionList(data) {
  return axios({
    url: "/openapi/auth/list",
    method: "get",
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
    url: "/tp_data/transpond/switch",
    method: "post",
    data,
  });
}
// 删除OpenApi授权
export function deleteOpenApiPermission(data) {
  return axios({
    url: "/tp_data/transpond/switch",
    method: "post",
    data,
  });
}
// api接口分页查询（api_type、service_type检索，name模糊匹配）
export function getApiInterface(data) {
  return axios({
    url: "/tp_data/transpond/switch",
    method: "post",
    data,
  });
}
// 新增api接口
export function createApiInterface(data) {
  return axios({
    url: "/tp_data/transpond/switch",
    method: "post",
    data,
  });
}
// 修改api接口
export function updateApiInterface(data) {
  return axios({
    url: "/tp_data/transpond/switch",
    method: "post",
    data,
  });
}
// 删除api接口
export function deleteApiInterface(data) {
  return axios({
    url: "/tp_data/transpond/switch",
    method: "post",
    data,
  });
}

// 新增OpenApi授权和接口关系（请求参数：tp_openapi_auth_id,[]tp_api_id ）
export function createOpenApiInterfaceRelationship(data) {
  return axios({
    url: "/tp_data/transpond/switch",
    method: "post",
    data,
  });
}
// 删除OpenApi授权和接口关系（请求参数：tp_openapi_auth_id,[]tp_api_id ）
export function deleteOpenApiInterfaceRelationship(data) {
  return axios({
    url: "/tp_data/transpond/switch",
    method: "post",
    data,
  });
}
// 变更OpenApi授权和设备关系（请求参数：tp_openapi_auth_id,[]device_id 注意先删除再插入）
export function updateOpenApiInterfaceRelationship(data) {
  return axios({
    url: "/tp_data/transpond/switch",
    method: "post",
    data,
  });
}
// api设备权限查询（根据原型出，原型的选择设备弹窗）
export function getApiDevicePermission(data) {
  return axios({
    url: "/tp_data/transpond/switch",
    method: "post",
    data,
  });
}
// api接口权限查询（根据原型出，原型的选择接口弹窗）
export function getApiInterfacePermission(data) {
  return axios({
    url: "/tp_data/transpond/switch",
    method: "post",
    data,
  });
}
