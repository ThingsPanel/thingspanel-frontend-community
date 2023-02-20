/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-16 09:15:05
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-16 09:38:18
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\scene\test.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const wx = {
    "id": "1556814591088013312",
    "name": "企业微信配置",
    "type": "weixin",
    "provider": "corpMessage",
    "maxRetryTimes": 0,
    "creatorId": "1199596756811550720",
    "createTime": 1660008497387,
    "configuration": {
        "corpId": "wwd7e935e286789712",
        "corpSecret": "1QY3migmSREZFn1Gcl0OZYTKlMnQ6qclc_QqGQdPa9I"
    }
}

const ali = { 
    "id": "1578670471802449920", 
    "name": "阿里云语音", 
    "type": "voice", 
    "provider": "aliyun", 
    "maxRetryTimes": 0, 
    "creatorId": "1199596756811550720", 
    "createTime": 1665219344248, 
    "configuration": { 
        "regionId": "cn-shenzhen", 
        "accessKeyId": "LTAI4GKmV2uUwVJuiTLTuMhS", 
        "secret": "BfKxMhlUW8LZGuvALlWTKDpltI8CAZ" 
    } 
}

const dingding = {
    "id":"1556577635070521344",
    "name":"钉钉机器人配置",
    "type":"dingTalk",
    "provider":"dingTalkRobotWebHook",
    "maxRetryTimes":0,
    "creatorId":"1199596756811550720",
    "createTime":1659952002670,
    "configuration":{
        "url":"https://oapi.dingtalk.com/robot/send?access_token=f91d3397bfb892dde3164fbe27f4a51513b5212d376f120b8bd2a8d49fd432cf"
    }
}