/**
 * @description: 条件类型
 */
const ConditionType = {
    // 设备条件
    device: "1",
    // 时间条件
    time: "2",
    // 通过value获取key
    getKey: value => Object.keys(ConditionType).find(key => ConditionType[key] === value)
};

/**
 * @description: 设备条件类型
 */
const StateMode = {
    // 属性
    property: "1",
    // 事件
    event: "2",
    // 在线离线状态
    onlineState: "3",
    // 在线持续时间
    onlineDuration: "4",
    // 通过value获取key
    getKey: value => Object.keys(StateMode).find(key => StateMode[key] === value)
};

/**
 * @description: 上下线状态
 * @return {*}
 */
const OnlineState = {
    online: "1",
    offline: "2",
    onAndOff: "3",
    // 通过value获取key
    getKey: value => Object.keys(OnlineState).find(key => OnlineState[key] === value)
}

/**
 * @description: 时间条件类型
 */
const TimeType = {
    // 时间范围
    range: "0",
    // 单次
    once: "1",
    // 重复
    repeat: "2",
    // 自定义
    custom: "3",
    // 通过value获取key
    getKey: value => Object.keys(TimeType).find(key => TimeType[key] === value)
}

/**
 * @description: 重复时间类型
 */
const RepeatTimeType = {
    // 每小时
    perHour: "1",
    // 每天
    days: "2",
    // 每周
    weekly: "3",
    // 每月
    monthly: "4",
    // 自定义cron
    cron: "5",
    // 通过value获取key
    getKey: value => Object.keys(RepeatTimeType).find(key => RepeatTimeType[key] === value)
}

/**
 * @description: 周
 */
const Week = {
    SUNDAY: 1,
    MONDAY: 2,
    TUESDAY: 3,
    WEDNESDAY: 4,
    THURSDAY: 5,
    FRIDAY: 6,
    SATURDAY: 7,
}
/**
 * @description: 动作类型
 */
const ActionType = {
    // 操作设备
    device: "1",
    // 触发告警  
    alarm: "2",
    // 激活场景
    scene: "3",
    // 通过value获取key
    getKey: value => Object.keys(ActionType).find(key => ActionType[key] === value)
}

/**
 * @description: 命令类型
 */
const CommandType = {
    // 设置属性
    property: 1,
    // 服务
    service: 2
}

/**
     * @description: 设置条件, 适配后端接口
     * @param {*} conditions
     * @return {*}
     */
export function setConditions(conditions) {
    let group_number = 1;
    const washCondition = (c) => {
        let condition = {};
        console.log("Object.keys(c)",c)

        if (c.type === "device") {
            // ================================== 设备条件 =====================================
            condition = {
                condition_type: ConditionType.device,
                device_id: c.data.deviceId,
                device_condition_type: StateMode[c.data.state.mode]
            };
            if (condition.device_condition_type === StateMode.property) {
                condition['v1'] = c.data.state.name;
                condition['v2'] = c.data.state.operator.symbol;
                condition['v3'] = c.data.state.operator.value;
            } else if (condition.device_condition_type === StateMode.onlineState) {
                condition['v2'] = OnlineState[c.data.state.name];
            }
        } else if (c.type === "time") {
            // ================================== 时间条件 =====================================
            console.log("时间条件", c)
            condition = {
                condition_type: ConditionType.time,
                time_condition_type: TimeType[c.data.type]
            }
            switch (condition.time_condition_type) {
                case TimeType.once: {
                    // 单次
                    condition['v1'] = c.data.once.value
                    break;
                }
                case TimeType.repeat: {
                    // 重复
                    const repeat = c.data.repeat;
                    condition['v1'] = RepeatTimeType[repeat.type].toString();

                    switch (RepeatTimeType[repeat.type]) {
                        case RepeatTimeType.perHour: {
                            // 每小时
                            condition['v3'] = repeat.perHour.toString();
                            break;
                        }
                        case RepeatTimeType.days: {
                            // 每天
                            condition['v3'] = repeat.days.toString()
                            break;
                        }
                        case RepeatTimeType.weekly: {
                            // 每周周几
                            // 周日: 1, 周一: 2, ..., 周六: 7
                            let v3 = repeat.weekly.week;
                            condition['v3'] = v3.toString();
                            condition['v4'] = repeat.weekly.time.toString();
                            break;
                        }
                        case RepeatTimeType.monthly: {
                            // 每月
                            condition['v3'] = repeat.monthly.day.toString() + ":" + repeat.monthly.time.toString();
                            // condition['v4'] = repeat.monthly.time.toString();
                            break;
                        }
                        case RepeatTimeType.cron: {
                            // 自定义cron
                            condition['v3'] = repeat.cron.toString();
                        }
                    }
                    break;
                }
                case TimeType.range: {
                    // 时间范围
                    condition['v1'] = c.data.range[0];
                    condition['v2'] = c.data.range[1];
                    break;
                }
            }
            console.log("setConditions", condition)

        }

        if (c.relation && c.relation == "or") {
            group_number++;
        }
        condition.group_number = group_number;

        return condition;
    }

    let conditionList = [];
    // 遍历conditions,进行数据转换
    conditions.length > 0 && conditions.forEach(item => {
        conditionList.push(washCondition(item));
    })
    return conditionList;
}

/**
* @description: 设置动作, 适配后端接口
* @param {*} actions
* @return {*}
*/
export function setActions(actions, name) {
    const washAction = a => {
        let action = {};
        // 动作类型
        action.action_type = ActionType[a.type];
        console.log("====washAction", a, action)
        switch (action.action_type) {
            case ActionType.device: {
                // 操作设备
                a.data.forEach(item => {
                    let instruct = {};
                    instruct[item.state.name] = item.state.operator.value;
                    let additionalInfo = {
                        device_model: "1",
                        instruct
                    }
                    actionList.push(
                        {
                            ...action,
                            device_id: item.deviceId,     // 设备id
                            additional_info: JSON.stringify(additionalInfo)
                        }
                    )
                })
                break;
            }
            case ActionType.scene: {
                // 激活场景
                action.scenario_strategy_id = a.value || "";     // 场景策略id
                actionList.push(action);
                break;
            }
            case ActionType.alarm: {
                // 触发告警
                action.warning_strategy = {};
                action.warning_strategy.id = a.data.id ? a.data.id : "";
                action.warning_strategy.warning_strategy_name = name;   // 告警名称
                action.warning_strategy.warning_level = a.data.warningLevel;     // 告警级别
                action.warning_strategy.group = a.data.group;                    // 通知用户组
                action.warning_strategy.repeat_count = Number(a.data.repeatTimes);      // 重复次数
                action.warning_strategy.inform_way = a.data.notification.join(",");        // 通知方式
                action.warning_strategy.warning_description = a.data.warning_description;  // 描述
                actionList.push(action);
                break;
            }
        }
    }

    let actionList = [];
    actions.length > 0 && actions.forEach(item => {
        washAction(item);
    })

    return actionList;
}

/**
     * @description: 回显condition
     * @param {*} conditions
     * @return {*}
     */
export function getConditions(conditions) {
    let conditionList = [];
    let temp = 1;
    console.log("getConditions", conditions)
    if (conditions && conditions.length > 0) {
        conditions.forEach((item, index) => {
            console.log(index, item.group_number)
            let groupNumber = item.group_number; 
            let condition = {};
            if (index === 0) {
                condition.relation = "";
            } else if (groupNumber === temp) {
                condition.relation = "and";
            } else if (groupNumber > temp) {
                condition.relation = "or";
                temp = groupNumber;
            }
            if (item.condition_type == ConditionType.device) {
                // =================================================================================
                // 设备条件 start
                // =================================================================================
                condition.type = ConditionType.getKey(item.condition_type);
                condition.data = {
                    projectId: item.business_id,
                    groupId: item.asset_id,
                    deviceId: item.device_id
                };

                let name = "";
                switch (item.device_condition_type) {
                    case StateMode.property: {
                        // 属性
                        name = item.v1;
                        break;
                    }
                    case StateMode.onlineState: {
                        // 上下线状态
                        name = OnlineState.getKey(item.v2);
                        break;
                    }
                }
                console.log(condition.data.state)

                condition.data.state = {
                    name,
                    mode: StateMode.getKey(item.device_condition_type),
                    operator: {
                        symbol: item.v2,
                        value: item.v3
                    }
                };
                // =================================================================================
                // 设备条件 end
                // =================================================================================
            } else {
                // =================================================================================
                // 时间条件 start
                // =================================================================================
                condition.type = ConditionType.getKey(item.condition_type);
                condition.data = {
                    type: TimeType.getKey(item.time_condition_type)
                }
                switch (item.time_condition_type) {
                    case TimeType.once: {
                        // 单次
                        condition.data.once = {
                            value: item.v1
                        }
                        break;
                    }
                    case TimeType.repeat: {
                        condition.data.repeat = { type: RepeatTimeType.getKey(item.v1) };
                        // 重复
                        switch (item.v1) {
                            case RepeatTimeType.perHour: {
                                // 每小时
                                condition.data.repeat.perHour = item.v3;
                                break;
                            }
                            case RepeatTimeType.days: {
                                // 每天
                                condition.data.repeat.days = item.v3
                                break;
                            }
                            case RepeatTimeType.weekly: {
                                // 每周
                                condition.data.repeat.weekly = {
                                    week: item.v3,
                                    time: item.v4
                                }
                                break;
                            }
                            case RepeatTimeType.monthly: {
                                // 从接口获取的数据格式为 dd:HH:mm
                                let arr = item.v3.split(":");
                                // 每月
                                condition.data.repeat.monthly = {
                                    day: arr[0],
                                    time: arr[1] + ":" + arr[2]
                                }
                                
                                break;

                            }
                            case RepeatTimeType.cron: {
                                condition.data.repeat.cron = item.v3;
                                break;
                            }
                        }
                        break;
                    }
                    case TimeType.range: {
                        // 范围
                        condition.data.range = [item.v1, item.v2]
                        break;
                    }
                    case TimeType.custom: {
                        // 自定义
    
                        break;
                    }
                }
                // =================================================================================
                // 时间条件 end
                // =================================================================================
            }
            conditionList.push(condition);
        })
    } else {
        conditionList.push({})
    }
    
    return conditionList;
}


/**
     * @description: 回显action
     * @return {*}
     */
export function getActions(actions) {
    let actionList = [];
    let commands = [];
    actions.forEach(item => {
        let action = {};
        if (item.action_type === ActionType.device) {
            // 操作设备
            let command = {
                projectId: item.business_id,
                groupId: item.asset_id,
                deviceId: item.device_id,
                state: {}
            };
            const additionalInfo = item.additional_info ? JSON.parse(item.additional_info) : {};
            const name = Object.keys(additionalInfo.instruct || {})[0];
            command.state = {
                name,
                mode: "property",
                operator: {
                    symbol: "",
                    value: additionalInfo.instruct ? additionalInfo.instruct[name] : ""
                }
            }
            commands.push(command);
        } else if (item.action_type === ActionType.alarm) {
            // 触发告警
            action.type = "alarm";
            action.data = {
                id: item.warning_strategy?.id || "",
                warningLevel: item.warning_strategy?.warning_level || "",
                repeatTimes: item.warning_strategy?.repeat_count || 0,
                notification: item.warning_strategy?.inform_way.split(",") || [],
                warning_description: item.warning_strategy?.warning_description || ""
            };
            actionList.push(action);
        } else if (item.action_type === ActionType.scene) {
            // 激活场景
            action.type = "scene";
            action.value = item.scenario_strategy_id;
            actionList.push(action);
        }
    })
    if (commands.length > 0) {
        actionList.push({ type: "device", data: commands });
    }
    console.log("getActions.actionList", actionList);
    return actionList;
}

export { ConditionType, StateMode, TimeType, RepeatTimeType, Week, ActionType, CommandType }