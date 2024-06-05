import { mockRequest } from '../request';

/** 获取应用管理 - 服务管理列表 */
export const fetchServiceManagementList = async () => {
  const data = await mockRequest.get<ServiceManagement.Service[]>('/getServiceManagementList');
  return data;
};

/** 获取规则引擎列表 */
export const fetchRuleEngineList = async () => {
  const data = await mockRequest.get<Api.RuleEngine.Rule[] | null>('/getRuleEngineList');
  return data;
};

/** 获取数据服务列表 */
export const fetchDataServiceList = async () => {
  const data = await mockRequest.get<Api.DataService.Data[] | null>('/getDataServiceList');
  return data;
};
