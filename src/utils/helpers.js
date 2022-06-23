import {Message} from "element-ui";

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