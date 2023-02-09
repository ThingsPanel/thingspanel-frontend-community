/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-02-02 08:39:13
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-07 09:18:56
 * @FilePath: \ThingsPanel-Backend-Vue\src\view\pages\automation\scene\data.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
const data = [
    {
        id: "1",
        name: "场景1",
        describe: "场景1的描述",
        created_at: "",
        commands: [
            {
                "data": {
                    "projectId": "a2914642-d48f-2728-bcfa-029bcf185201",
                    "groupId": "f1288515-5a53-9b8f-1ed9-55f8f2a65cf9",
                    "deviceId": "be84ccf5-4007-8bd4-af75-28d2a0467d75",
                    "device": {
                        "label": "test_2023_02_06",
                        "value": "be84ccf5-4007-8bd4-af75-28d2a0467d75",
                        "pluginId": "8ec61fbe-55fb-deba-4396-9ecb326385cc"
                    },
                    "state": {
                        "label": "震动次数",
                        "name": "shock",
                        "unit": "次/S",
                        "mode": "property",
                        "operator": {
                            "symbol": "",
                            "value": "12"
                        }
                    }
                }
            }
        ]
    }
]

export default data;