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
     * 表格属性，如：列头
     */
    attr: {
        type: [Array],
        default: () => []
    },
    /**
     * 表格数据
     */
    data: {
        type: [Array],
        default: () => []
    },
    /**
     * 点击新增/编辑时是否在表格里编辑
     */
    inEdit: {
        type: [Boolean],
        default: false
    },
    /**
     * 是否显示操作列
     */
    showHandle: {
        type: [Boolean, String],
        default: false
    },
    /**
     * 新增还是编辑
     */
    addOrEdit: {
        type: [String],
        default: ""
    }
}