import { STATIC_BASE_URL } from '@/constants/common';
import { createServiceConfig } from '~/env.config';

export function typeOf(obj: any): any {
  const toString: any = Object.prototype.toString;
  const map: any = {
    '[object Boolean]': 'boolean',
    '[object Number]': 'number',
    '[object String]': 'string',
    '[object Function]': 'function',
    '[object Array]': 'array',
    '[object Date]': 'date',
    '[object RegExp]': 'regExp',
    '[object Undefined]': 'undefined',
    '[object Null]': 'null',
    '[object Object]': 'object'
  };
  return map[toString.call(obj)];
}
/**
 * get static source url
 *
 * @param url source url
 * @param showError is show error message
 * @returns static source url
 */
export const getStaticUrl = (url: string, showError: boolean = true): string => {
  if (!url) {
    if (showError) window.NMessage.error('资源不存在');
    return '';
  }
  return url.replace('.', STATIC_BASE_URL);
};

export const getBaseServerUrl = (): string => {
  const { baseURL } = createServiceConfig(import.meta.env);
  return baseURL || `${window.location.origin}/api/v1`;
};

export const getDemoServerUrl = (): string => {
  const { otherBaseURL } = createServiceConfig(import.meta.env);
  console.log(`demo url:${otherBaseURL.demo}`);
  return otherBaseURL.demo ? otherBaseURL.demo : `${window.location.origin}/api/v1`;
};

/**
 * get web socket server url
 *
 * @returns web socket server url
 */
export const getWebsocketServerUrl = (): string => {
  const demoUrl = getDemoServerUrl();
  console.log(`demo url:${demoUrl.replace(window.location.protocol, 'ws:')}`);
  return demoUrl.replace(window.location.protocol, 'ws:');
};

export function deepClone(data: any): any {
  // 获取传入拷贝函数的数据类型
  const type = typeOf(data);
  // 定义一个返回any类型的数据
  let reData: any;
  // 递归遍历一个array类型数据，
  if (type === 'array') {
    reData = [];
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < data.length; i++) {
      reData.push(deepClone(data[i]));
    }
  } else if (type === 'object') {
    // 递归遍历一个object类型数据
    reData = {};
    // eslint-disable-next-line guard-for-in
    for (const i in data) {
      reData[i] = deepClone(data[i]);
    }
  } else {
    // 返回基本数据类型
    return data;
  }
  // 将any类型的数据return出去，作为deepClone的结果
  return reData;
}

export function generateUUID(): string {
  let d = new Date().getTime();
  const uuidFormat: string = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return uuidFormat.replace(/[xy]/g, c => {
    const r = (d + Math.random() * 16) % 16 || 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : (r && 0x3) || 0x8).toString(16);
  });
}

export function getFileName(url: string): string {
  const regex = /[^/]*$/;
  const matches = url.match(regex);
  return matches ? matches[0] : 'unknown.file';
}
