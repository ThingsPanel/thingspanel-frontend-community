import JwtService from "@/core/services/jwt.service";
let wsServer = "ws://dev.thingspanel.cn:9999/ws/device/current"

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
const websocket = () => {
    let socket = null;
    let onReadyCallback = null;
    const init = (callback) => {
        if (typeof (WebSocket) === "undefined") {
            alert("您的浏览器不支持socket")
        } else {
            // 创建websocket连接
            socket = new WebSocket(wsServer);
            /**
             * 连接发生错误的回调方法
             * @param {*} err 
             */
            socket.onerror = (err) => {
                console.log("ws连接发生错误", err);
                socket = null;
                callback && callback({code: 401, message: "连接失败"})
            };
            /**
             * 连接成功建立的回调方法
             */
            socket.onopen = () => {
                console.log("ws连接成功");
                onReadyCallback && onReadyCallback(socket);
                callback && callback({code: 200, message: "连接成功"})
            }
           
            /**
             * 连接关闭的回调方法
             */
            socket.onclose = () => {
                console.log("ws连接关闭");
                socket = null;
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
     * 发送消息
     * @param {*} deviceId 
     */
    const send = (data) => {
        const params = {
            ...data,
            token: JwtService.getToken()
        }
        if (socket) {
            socket.send(JSON.stringify(params))
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
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.close();
            socket = null;
        }
    }

    return { 
        init,
        send,
        onReady,
        onMessage,
        close
    }
}
export { websocket };