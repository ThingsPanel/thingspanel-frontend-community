const v = [
    {
        "type": "time"
        
    },
    {
        "type": "time",
        "relation": "and"
    },
    {
        "type": "time",
        "relation": "or"
    },
    {
        "type": "time",
        "relation": "and"
    }
]
const data = [
    {
        id: "1",
        name: "策略1",
        describe: "策略1的描述",
        created_at: "",
        conditions: [{
            "type": "device",
            "data": {
                "projectId": "216021b2-2064-602a-6bc0-f170dc1806b9",
                "groupId": "4d6534cf-9e9b-1369-219e-78cbbebad248",
                "deviceId": "a838d156-9a8a-ed93-581b-36d98ba85c3e",
                "state": {
                    "label": "温度",
                    "name": "temperature",
                    "unit": "°C",
                    "mode": "property",
                    "operator": {
                        "symbol": ">=",
                        "value": 30
                    }
                }
              }
          }],
          actions: [
            {
                "type": "alarm",
                "data": {
                    "groups": [
                        {
                            "users": [
                                "all"
                            ],
                            "role": "7da83feb-af67-087d-763a-f44feb346ae1"
                        }
                    ],
                    "notification": [
                        "wechat",
                        "sms",
                        "email"
                    ],
                    "warningLevel": "low",
                    "repeatTimes": "1"
                }
            },
            {
                "type": "device",
                "data": [
                    {
                        "projectId": "91c7e5b5-2a52-b049-36fb-d1a65c1d1b5e",
                        "groupId": "a630fba4-9385-3246-2a0f-c89cf2068f1c",
                        "deviceId": "994741fd-f33d-3c15-232d-cf5417484eea",
                        "device": {
                            "label": "开关测试",
                            "value": "994741fd-f33d-3c15-232d-cf5417484eea",
                            "pluginId": "e5e01c1d-2da2-8fc5-72cb-02854efe1820"
                        },
                        "state": {
                            "label": "开关",
                            "name": "status",
                            "mode": "property",
                            "operator": {
                                "symbol": "",
                                "value": "1"
                            }
                        }
                    },
                    {
                        "projectId": "2018f380-0326-77f4-3efc-ab7ca38359f3",
                        "groupId": "eb5ea78a-cef6-9577-8617-fe50663a8c9f",
                        "deviceId": "79c9169b-dd9a-63b9-0c9c-aa807f314778",
                        "device": {
                            "label": "消防设备测试",
                            "value": "79c9169b-dd9a-63b9-0c9c-aa807f314778",
                            "pluginId": "c5989102-2c40-3c6f-6b67-94a30709f036"
                        },
                        "state": {
                            "label": "温度",
                            "name": "temperature",
                            "unit": "°C",
                            "mode": "property",
                            "operator": {
                                "symbol": "",
                                "value": "123"
                            }
                        }
                    }
                ]
            }
          ]
    }
]

const actions = [
    {
        "projectId": "9518757b-3e1a-3fe1-f256-f350d4f170c9",
        "groupId": "828964e8-8662-a44d-f48d-ca2f354fff02",
        "deviceId": "8e08aefb-7c7d-cfb5-3d05-79143a431a19",
        "device": {
            "label": "温度传感器",
            "value": "8e08aefb-7c7d-cfb5-3d05-79143a431a19",
            "pluginId": "3ec9580a-709d-38dd-c282-c8c9481495d8"
        },
        "state": {
            "label": "温度",
            "name": "temp",
            "unit": "℃",
            "mode": "property",
            "type": "float",
            "operator": {
                "symbol": "=",
                "value": "1"
            }
        }
    },
    {
        "projectId": "9518757b-3e1a-3fe1-f256-f350d4f170c9",
        "groupId": "828964e8-8662-a44d-f48d-ca2f354fff02",
        "deviceId": "8e08aefb-7c7d-cfb5-3d05-79143a431a19",
        "device": {
            "label": "温度传感器",
            "value": "8e08aefb-7c7d-cfb5-3d05-79143a431a19",
            "pluginId": "3ec9580a-709d-38dd-c282-c8c9481495d8"
        },
        "state": {
            "label": "温度",
            "name": "temp",
            "unit": "℃",
            "mode": "property",
            "type": "float",
            "operator": {
                "symbol": "=",
                "value": "2"
            }
        }
    }
]
const automation_actions = [
    {
        "action_type": "1",
        "device_id": "8e08aefb-7c7d-cfb5-3d05-79143a431a19",
        "additional_info": "{\"device_model\":\"1\",\"instruct\":{\"temp\":\"1\"}}"
    },
    {
        "action_type": "1",
        "device_id": "8e08aefb-7c7d-cfb5-3d05-79143a431a19",
        "additional_info": "{\"device_model\":\"1\",\"instruct\":{\"temp\":\"2\"}}"
    }
]

export default data;