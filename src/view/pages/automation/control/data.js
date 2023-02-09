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
                    "priority": "low",
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

export default data;