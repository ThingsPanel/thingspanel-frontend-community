import JwtService from "@/core/services/jwt.service";

let wsServer = (process.env.VUE_APP_WEBSOCKET_URL || ('ws://' + document.domain + ':5200/')) + '?token=' + JwtService.getToken();
let websocket = {
    ws: null,
    connect: function () {
        console.log("WebSocket starting...");
        this.createConnect();
    },
    createConnect: function () {
        let _this = this;

        _this.ws = new WebSocket(wsServer);
        _this.ws.onopen = function (evt) {
            console.log("WebSocket Connected to WebSocket server.");
        };

        _this.ws.onclose = function (evt) {
            console.log("WebSocket Disconnected");
        };

        _this.ws.onerror = function (evt, e) {
            console.log('WebSocket Error occured: ' + evt.data);
        };
    },
    onmessage: function (callback) {
        this.ws.onmessage = function (data) {
            callback(data);
        };
    },
    send: function (data) {
        if (this.ws && this.ws.readyState === 1) {
            this.ws.send(JSON.stringify(data));
        } else {
            //try reconnection
            setTimeout(function () {
                websocket.send(data);
            }, 1000);
        }
    },
    close: function () {
        if(this.ws && this.ws.readyState === 1){
            this.ws.close();
        }
    }
};

export default websocket;
