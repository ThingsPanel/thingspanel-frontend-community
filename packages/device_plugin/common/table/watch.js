export default {
    attr: {
        handler(newValue) {

            this.dataAttr = JSON.parse(JSON.stringify(newValue))
        },
        immediate: true
    },
    data: {
        handler(newValue) {
            this.tableData = JSON.parse(JSON.stringify(newValue))
        },
        immediate: true
    },
    inEdit: {
        handler(newValue) {
            this.editInTable = newValue;
        },
        immediate: true
    }
}