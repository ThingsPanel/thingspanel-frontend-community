/**
 * ThingsVis 相关类型定义
 */

/** 平台字段类型 */
export interface PlatformField {
    /** 字段唯一标识 */
    id: string
    /** 显示名称 */
    name: string
    /** 数据类型 */
    type: 'number' | 'string' | 'boolean' | 'json'
    /** 字段类型 */
    dataType: 'attribute' | 'telemetry' | 'command'
    /** 单位(可选) */
    unit?: string
    /** 描述(可选) */
    description?: string
}

/** ThingsVis 项目配置 */
export interface ThingsVisProject {
    meta: {
        version: string
        id: string
        name: string
        createdAt?: number
        updatedAt?: number
    }
    canvas: {
        mode: string
        width: number
        height: number
        background: string
        gridEnabled?: boolean
    }
    nodes: any[]
    dataSources: any[]
    dataBindings: any[]
}

/** 保存请求消息 */
export interface SaveRequestMessage {
    type: 'thingsvis:requestSave'
    requestId: string
    payload: ThingsVisProject
}

/** 保存响应消息 */
export interface SaveResponseMessage {
    type: 'thingsvis:saveResponse'
    requestId: string
    payload: {
        success: boolean
        data?: any
        error?: string
    }
}

/** 平台数据推送消息 */
export interface PlatformDataMessage {
    type: 'thingsvis:platformData'
    payload: {
        fieldId: string
        value: any
        timestamp: number
    }
}
