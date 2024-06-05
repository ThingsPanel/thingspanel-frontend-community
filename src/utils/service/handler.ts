/** 统一失败和成功的请求结果的数据类型 */
export async function handleServiceResult<T = any>(
  error: App.Service.RequestError | null,
  data: any,
  msg: string = ''
) {
  if (error) {
    const fail: App.Service.FailedResult = {
      error,
      data: null
    };
    return fail;
  }
  const success: App.Service.SuccessResult<T> = {
    error: null,
    data
  };
  return {
    ...success,
    msg
  };
}

/** 请求结果的适配器：用于接收适配器函数和请求结果 */
export function adapter<T extends App.Service.ServiceAdapter>(
  adapterFun: T,
  ...args: App.Service.MultiRequestResult<Parameters<T>>
): App.Service.RequestResult<ReturnType<T>> {
  let result: App.Service.RequestResult | undefined;

  const hasError = args.some(item => {
    const flag = Boolean(item.error);
    if (flag) {
      result = {
        error: item.error,
        data: null
      };
    }
    return flag;
  });

  if (!hasError) {
    const adapterFunArgs = args.map(item => item.data);
    result = {
      error: null,
      data: adapterFun(...adapterFunArgs)
    };
  }

  return result!;
}
