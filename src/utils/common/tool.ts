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

function getRandomBytes(length) {
  return window.crypto.getRandomValues(new Uint8Array(length));
}

function randomBytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateRandomHexString(length) {
  const bytes = getRandomBytes(length);
  const hexString = randomBytesToHex(bytes);
  return hexString;
}

// RSA 公钥加密
export function encryptDataByRsa(data): string {
  const pubKey = `-----BEGIN PUBLIC KEY-----
MIIBCgKCAQEA35ATUHHwTvEHxaOKG/8xTETHq7+syHqEkDXSuKf2irYZefaKe4n2
GiM6uWFBgaXX/LxvxkbIQ0WK0R+mIziaF3mTa3gs7n5OiJgJDsqzZHzS9to6j9Mc
NG3v2R0wgjCs9FCR51ZEZIxxC5YYlHd2ZQoVZ8oLMdg9bhop5CsG9J1spkhx8cmY
r50hSenA7rxTQ7fSc8TmMgR6Env84rjUMgxBO7RgnbaURzde0UPOrEmc7FGCZJix
fSkMao0ZoWz5PNE7tNU9LYQJThy+T46HAu5V5zWOuo9AdBdJvQH43yhIptLB/Z1p
UsdVUZ0ESaoP326ag8R5EqBSa2+4gce14QIDAQAB
-----END PUBLIC KEY-----`;
  const encrypt = new JSEncrypt();
  encrypt.setPublicKey(pubKey);
  // 使用公钥进行加密
  try {
    return encrypt.encrypt(data) || '';
  } catch (e) {
    console.error(e);
    return '';
  }
}

// RSA 私钥解密
export function decryptDataByRsa(data): string {
  const priKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA35ATUHHwTvEHxaOKG/8xTETHq7+syHqEkDXSuKf2irYZefaK
e4n2GiM6uWFBgaXX/LxvxkbIQ0WK0R+mIziaF3mTa3gs7n5OiJgJDsqzZHzS9to6
j9McNG3v2R0wgjCs9FCR51ZEZIxxC5YYlHd2ZQoVZ8oLMdg9bhop5CsG9J1spkhx
8cmYr50hSenA7rxTQ7fSc8TmMgR6Env84rjUMgxBO7RgnbaURzde0UPOrEmc7FGC
ZJixfSkMao0ZoWz5PNE7tNU9LYQJThy+T46HAu5V5zWOuo9AdBdJvQH43yhIptLB
/Z1pUsdVUZ0ESaoP326ag8R5EqBSa2+4gce14QIDAQABAoIBAGbkta75scNzdcNF
4KPAER1sLoXioxBmKysASqrIS1VOOG2ExfnT5lvjSPzXQUH9ZWoiBEO6giNMF3bm
XR2qyGjzgKEe33co1NZTOx/+tRATzzjj+b4GSN3sl05S++d/paqQhoZ1kubAKKtP
eqKiVPBt8qohOIPJZYSOMCeekgX0rgIIDMURcv88qb0Sulb9KbLPGIJqh8VMZn6V
GOFcMgq5UB36G2VX8pkVAqCHX5zK2eOHt/E92ItvTClAfBVIpVqDk0YIfW5WK6b3
bN2TZs0HsyTdXj8WOCOErC0c4sZ6ENsYcxJP0XShuAynbVxWfFdOoU5UE3Lh58uh
eWk1xn0CgYEA+nFkZ+7DbK5miEx315DB52zcIyfccuMi3fy0m5ukvQtRGuhCmEHE
MgLXQNq36DL4ctOVKzPyhu9TffAbkdCuOcASvTwAAuOYlVKarhk6o8DKfE5mA/Pu
/Nq+EsoKo+XnO5DZnlxTt4S/V5BbB30Dk+W9Kvz/gdpYC9Pjd53KenMCgYEA5IX+
gQKW4w0frIEexpjtGVXUJTjaltZLHbgRALBwLGDmQfU3quEVOXF9BLwG8DUTbDEd
RORVdF+dOMli2ESJ3gGG+x5eob/aYHpH74/XEkyibUlmYm6pGOtEzAdnIGRqQyGO
P+2uqRWpcBVEycSL3NMk94sAU8PM/BHUVcfCVVsCgYBxH/UtqUEm/2QbHwdnHOEp
ixeo3aGLV6PxR+vA+j4gklMRZ2ZlZhecS4I1rlYyEYv+OiqAOFfNsZ8yHNonNG7u
cR9F0StkIrBSityJ1aWSQEx2d+dG09HY72m6DP9fZ0LauiRCjwvVsqXHhNJJgKO0
E6suFtfHLPxmY1C1QFYslwKBgQCIw8CbCSewXwxTuzrl9GQBw6IhXLNFjp6J/L0A
Qpf/l0Z2twFH3UlMhaUijj1AySMEnyg7MMQLz6VSdQQZFnvER/m2lGhiOWXCU6x1
rQo0Q3T6HvGNe1jsNvGHge6wLiiCYLS3gdIEE5jCIZh3gI+L6zm2hJP/jbFCMpF3
fQPK/QKBgGv5g7zk5zxZsS2LNANbOjSCmJsQRjd83LN4nt08N/ro7ZRCh1XL6HIE
XBkFA8ndBXMeOdpjXk//ydrzfy0v5bbVTGNg+qu27sSl5F0h29fX5WvyFssZafYB
jP7gB07O9kSkzCAh96hMLemrdxUtvpc7HwuRTDYBVsurPo+9dG7l
-----END RSA PRIVATE KEY-----`;

  const encrypt = new JSEncrypt();
  encrypt.setPublicKey(priKey);

  // 使用公钥进行加密
  return encrypt.decrypt(data) || '';
}
