import {Message} from "element-ui";
import { MessageBox } from 'element-ui';
export function message_success(text){
    Message({
        message: text,
        type: 'success',
        center: true,
        showClose: true,
    })
}

export function message_error(text){
    Message({
        message: text,
        type: "error",
        center: true,
        showClose: true,
    })
}

export function message_confirm(text) {
    return new Promise((resolve, reject) => {
        MessageBox.confirm(text, '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
            resolve("")
        }).catch(() => {
            reject("")
        });
    })
}

/**
 * 验证邮箱
 * @param val
 */
export function is_email(val) {
    return /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/.test(val)
}

/**
 * 验证手机号
 * @param val
 */
export function is_cellphone(val) {
    return /^1[3456789]\d{9}$/.test(val)
}

/**
 * 清除 el 的自定义验证错误
 * @param errorMsg
 */
export function clearErrorsMsg(errorMsg) {
    for (const key in errorMsg) {
        errorMsg[key] = '';
    }
}

/**
 * 处理服务验证错误
 * @param errors
 * @param ServerErrors // 服务器返回的错误
 */
export function handleServerErrorMsg(errors, ServerErrors) {
    for (const key in ServerErrors) {
        if(errors.hasOwnProperty(key)) {
            errors[key] = String(ServerErrors[key])
        }
    }
}

export function formatDate(timestamp) {
    if (!timestamp) return "";
    let time = 0;
    time = timestamp.toString().substr(0, 13);
    let date = new Date(Number(time));   // 转换为格林威治时间对象
    let year = date.getFullYear();    // 获取年
    let month = date.getMonth() + 1;       // 获取月
    let day = date.getDay()
    let hour = date.getHours();
    let minute = date.getMinutes()
    let second = date.getSeconds();
    return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
}

/**
 * 判断是否是字符串
 * @param item
 * @returns {boolean}
 */
export function is_string(item) {
    return typeof(item) === 'string'
}

/**
 * 拷贝对象
 * @param obj
 * @returns {any}
 */
export function json_parse_stringify(obj){
    return JSON.parse(JSON.stringify(obj))
}

const _charStr = 'abacdefghjklmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ0123456789';
/**
 * 随机生成字符串
 * @param len 指定生成字符串长度
 */
export function getRandomString(len) {
    let min = 0, max = _charStr.length-1, _str = '';
    //判断是否指定长度，否则默认长度为15
    len = len || 15;
    //循环生成字符串
    for(var i = 0, index; i < len; i++){
        index = RandomIndex(min, max, i);
        _str += _charStr[index];
    }
    return _str;
}
/**
 * 随机生成索引
 * @param min 最小值
 * @param max 最大值
 * @param i 当前获取位置
 */
const RandomIndex = (min, max, i) => {
    let index = Math.floor(Math.random() * (max - min + 1) + min),
        numStart = _charStr.length - 10;
    //如果字符串第一位是数字，则递归重新获取
    if (i == 0 && index >= numStart) {
        index = RandomIndex(min, max, i);
    }
    //返回最终索引值
    return index;
}

/**
 * RGBA转十六进制颜色
 * @param rgbaColor
 * @returns {{hexColor: string, opacity}}
 */
export function colorRGBA2Hex(rgbaColor) {
    let rgb = rgbaColor.split(',');
    let r = parseInt(rgb[0].split('(')[1]);
    let g = parseInt(rgb[1]);
    let b = parseInt(rgb[2].split(')')[0]);
    let hexColor = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    let opacity = rgb[3];
    return {hexColor, opacity};
}

/**
 * 十六进制颜色转RGBA
 * @param hexColor
 * @param opacity
 * @returns {string}
 */
export function colorHex2RGBA(hexColor, opacity) {
    if (hexColor == ""){
        return ""
    }
    hexColor = hexColor.substring(1);
    hexColor = hexColor.toLowerCase();
    let b = new Array();
    for(let x = 0; x < 3; x++){
        b[0] = hexColor.substr(x * 2,2);
        b[3] = "0123456789abcdef";
        b[1] = b[0].substr(0, 1);
        b[2] = b[0].substr(1, 1);
        b[20+x] = b[3].indexOf(b[1]) * 16 + b[3].indexOf(b[2]);
    }
    return "rgba(" +  b[20] + ", " + b[21] + ", " + b[22] + ", " + opacity + ")";
}

/**
 * 防抖函数
 * @param {*} fn 
 * @param {*} wait 
 * @returns 
 */
export function _debounce(fn, wait) {
    let timeout = null;
    wait = wait || 600;
    return function () {
      let that = this;
      if(timeout !== null)   clearTimeout(timeout);  
      timeout = setTimeout(() => {
        fn.apply(that);
      }, wait);
    }    
}
