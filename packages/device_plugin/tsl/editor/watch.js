export default {
    /**
     * 父组件传过来的属性，服务，事件 表格的数据
     */
    data: {
        handler(newValue) {
            this.tableData = JSON.parse(JSON.stringify(newValue));
            console.log("====tableData", this.tableData)
        },
        immediate: true
    },
    /**
     * 物模型的功能分类
     * properties: 属性，services: 服务，events: 事件
     */
    type: {
        handler(newValue) {
            this.tslType = newValue;
        },
        immediate: true
    },
    /**
     * 编辑模式, simple: 表格内编辑，advanced: 对话框编辑
     */
    editMode: {
        handler(newValue) {
            this.inEdit = (newValue == "simple") ? true : false;
        },
        immediate: true
    }
}