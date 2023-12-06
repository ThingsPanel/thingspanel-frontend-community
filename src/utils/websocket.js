import JwtService from "@/core/services/jwt.service";
import { ws_url } from "@/api/LocalUrl"
let wsServer = ws_url + (ws_url.endsWith("/") ? "ws/device/current" : "/ws/device/current")
/**
 * websocket封装
 * let ws = new websocket();
 *  ws.init((event) => {
 *    console.log(event)
 *  });
 *  ws.onReady(() => {
 *    ws.send({ device_id: ""})
 *  })
 *  ws.onMessage((result) => {
 *    console.log("onMessage", result)
 *  })
 * @returns 
 */
const websocket = (wsUrl = wsServer) => {
    let socket = null;
    let onReadyCallback = null;
    let onCloseCallback = null;
    const init = (callback) => {
        if (typeof (WebSocket) === "undefined") {
            alert("您的浏览器不支持socket")
        } else {
            // 创建websocket连接
            socket = new WebSocket(wsUrl);
            /**
             * 连接发生错误的回调方法
             * @param {*} err 
             */
            socket.onerror = (err) => {
                socket = null;
                callback && callback({code: 401, message: "连接失败"})
            };
            /**
             * 连接成功建立的回调方法
             */
            socket.onopen = () => {
                onReadyCallback && onReadyCallback();
                callback && callback({code: 200, message: "连接成功"})
            }
           
            /**
             * 连接关闭的回调方法
             */
            socket.onclose = () => {
                socket = null;
                onCloseCallback && onCloseCallback();
                callback && callback({code: 400, message: "连接关闭"})
            }
        }
    };

    /**
     * 连接成功后的回调
     * @param {*} callback 
     */
    const onReady = (callback) => {
        onReadyCallback = callback;
    };
        

    /**
     * 连接关闭后的回调
     * @param {*} callback 
     */
    const onClose = (callback) => {
        onCloseCallback = callback;
    };

    /**
     * 发送消息
     * @param {*} deviceId 
     */
    const send = (data, type="json") => {
        if (type === "json") {
            const params = {
                ...data,
                token: JwtService.getToken()
            }
            if (socket) {
                socket.send(JSON.stringify(params))
            }
        } else if (type === "string") {
            if (socket) {
                socket.send(data)
            }
        }
    };

    const onMessage = (onReceive) => {
        if (socket) {
            socket.onmessage = (event) => {
                onReceive && onReceive(event.data)
            }
        }
    }

    /**
     * 断开连接
     */
    const close = () => {
        return new Promise((resolve, reject) => {
            if (socket) {
                socket.close();
                socket = null;
            }
            resolve(true);
        });
    }

    return { 
        init,
        send,
        onReady,
        onClose,
        onMessage,
        close
    }
}
export { websocket };