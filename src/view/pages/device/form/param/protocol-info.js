import local_url from "@/api/LocalUrl";
const link = true, payload = true;
const getMqttIP = () => {
    if (document.location.host === "dev.thingspanel.cn") {
        return "dev.thingspanel.cn";
    } else {
        return "mqtt服务IP"
    }
}
export default {
    /**
     * 标准设备mqtt协议信息
     */
    mqtt: [
        { label: "MQTT接入点", value: getMqttIP() + ":1883" },
        { label: "设备上报属性主题", value: "device/attributes" },
        { label: "设备订阅属性主题", value: "device/attributes/{AccessToken}" },
        { label: "MQTT用户名", value: "{AccessToken}" },
        { label: "MQTT密码", value: "在设备端密码为空即可连接", show: ["accessToken"] },
        { label: "设备上报数据", value: "{payload}", payload },
    ],

    /**
     * 网关mqtt协议信息
     */
    MQTT: [
        { label: "MQTT接入点", value: getMqttIP() },
        { label: "网关设备上报属性主题", value: "gateway/attributes" },
        { label: "网关设备订阅属性主题", value: "gateway/attributes/{AccessToken}" },
        { label: "MQTT用户名", value: "{AccessToken}" },
        { label: "设备上报数据", value: "{payload}", payload },
    ],

    /**
     * 网关tcp协议信息
     */
    MODBUS_TCP: [
        { label: "协议端口", value: "503" },
        { label: "连接", value: "建立tcp连接时，将AccessToken:{AccessToken}上送。" }
    ],
    /**
     * 网关rtu协议信息
     */

    MODBUS_RTU: [
        { label: "协议端口", value: "503" },
        { label: "连接", value: "建立tcp连接时，将AccessToken:{AccessToken}上送。" }
    ],
}
