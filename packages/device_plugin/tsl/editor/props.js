import { tableAttr } from "../../data/attrs"
export default {
    dark: {
        type: [Boolean],
        default: true
    },
    /**
     * 是否显示查看列
     */
    showView: {
        type: [Boolean],
        default: true
    },
    /**
     * 表格/表单的字段属性
     */
    tableAttr: {
      type: [Object],
      default: () => { return tableAttr }
    },
    /**
     * 父组件传过来的物模型数据
     */
    data: {
        type: [Object],
        default: () => { return {} }
    },
    /**
     * 类型： 属性，服务，命令
     */
    type: {
        type: [String],
        default: "properties"
    },
    /**
     * 是否可编辑
     */
    showHandle: {
        type: [String, Boolean],
        default: false
    },
    showCreate: {
        type: [String, Boolean],
        default: false
    }
}