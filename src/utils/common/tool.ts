import JSEncrypt from 'jsencrypt';
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

export function isJSON(str: string): boolean {
  if (typeof str === 'string') {
    try {
      const obj = JSON.parse(str);
      if (typeof obj === 'object' && obj) {
        return obj;
      }
      return false;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
  return false;
}

// 校验密码强度
export function validPassword(str: string): boolean {
  if (str.length < 8) {
    return false;
  }
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}/.test(str)) {
    return false;
  }
  return true;
}

// RSA 公钥加密
export function encryptDataByRsa(data): string {
  const pubKey = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCZl8ytw/KIs1lTX+wMtQnZYa/c
IvFMkRaSq3sqJ5FUeOEGH/Y05jIa6eEcLy9WwdjhxXK9h6rOX74n1gN6YZ+qSdz2
yc7y4MGzmOsN7uYSCekwK55EQK/I13KNzvw7dAN46MAGORLeqeLNUoxFii+Ok10+
7fzYDIzVJpccqWbfUwIDAQAB
-----END PUBLIC KEY-----`;

  const encrypt = new JSEncrypt();
  encrypt.setPublicKey(pubKey);

  // 使用公钥进行加密
  return encrypt.encrypt(data) || '';
}

// RSA 私钥解密
export function decryptDataByRsa(data): string {
  const priKey = `-----BEGIN RSA PRIVATE KEY-----
MIICXQIBAAKBgQCZl8ytw/KIs1lTX+wMtQnZYa/cIvFMkRaSq3sqJ5FUeOEGH/Y0
5jIa6eEcLy9WwdjhxXK9h6rOX74n1gN6YZ+qSdz2yc7y4MGzmOsN7uYSCekwK55E
QK/I13KNzvw7dAN46MAGORLeqeLNUoxFii+Ok10+7fzYDIzVJpccqWbfUwIDAQAB
AoGASe0+nwSJYDKy8+Zff15D91WFh7dp3SiYbNAM4CVbVgU4ifIoVx3VUA7yQtaT
OnbjJQgcSg1asSp0JEhmNCl454WjgaeO/RXIqNjBAK4g2wbNCBaCI/ENTSe5r8Yi
tv01GhuWzWcNZdx0NTmzlWFTlTxZn8nQklRCs5AxhJMXPQECQQDe74Slf6SrH+pm
SDtwTSQ+cTQVDUttJU4ZrkjRsFskLJL0oXSXt3cHs4jKyvryQIDAv/HUjeWWDwgo
KGVY1KJDAkEAsF910VSG2bdaKg0HOIfYHNHJBznSjzrEEOFcK07i2DbMXhHmgULj
Xav5sEME9C9G09t3Rdbb1GW3BpJi3+UlsQJBAL5qZKkbSmIjw4kTfzlfmmp/NJYa
oeca6weCVo5MDLzsGaU7VqPTv6ZjUZ6tGwTZ1V9NU1hSztuKAVSTlGT4UZMCQDp0
mR71DfCwxVB0mvUQiP8cRK2Ba5kPGBakKqEr9yFEID35XtVurt7H9eyGeejYlnf3
IDPkf12JDL0/3UdpsjECQQDUjAkG686qnyy/nJvX5y2I3hLoh9vWe0oVyTD6etP8
XugcGmZmuGu+/cNeiU3lH4cArL5zNnLvRqCU+ceU9Dik
-----END RSA PRIVATE KEY-----`;

  const encrypt = new JSEncrypt();
  encrypt.setPublicKey(priKey);

  // 使用公钥进行加密
  return encrypt.decrypt(data) || '';
}
