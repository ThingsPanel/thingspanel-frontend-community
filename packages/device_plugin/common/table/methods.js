import {MessageBox} from "element-ui";

/**
 * CommonTable.methods
 */
export default {
    /**
     * 下拉列表选中值发生变化
     * @param value
     */
    selectChange(value) {
        console.log(value)
        let attr = this.dataAttr.find(item => item.field == "dataType")
        let type = attr.options.find(item => item.value == value)
        if (type.exValue) {
            let keys = Object.keys(type.exValue);
            keys.forEach(key => {
                this.formData[key] = type.exValue[key];
            });
        }
    },
    /**
     * 点击新增按钮
     */
    handleAdd() {
        // 更改编辑状态为新增
        this.$emit("updateStatus", "add")
        // 遍历attr，包含default属性时，新增的数据要带上default的值
        let data = {};
        this.attr.forEach(item => {
            if (item.default) {
                data[item.field] = item.default;
            }
        })
        data._id = this.getRandomString(8);
        if (this.editInTable) {
            // 简单模式
            this.newData = data;
            this.tableData.forEach(item => item.edit = undefined)
        } else {
            // 高级模式
            this.formData = data;
            this.dialogVisible = true;
        }
    },
    /**
     * 点击编辑按钮
     * @param row
     */
    handleEdit(row) {
        let index = this.tableData.findIndex(item => item == row );
        row.index = index;
        if (this.editInTable) {
            // 简单编辑
            this.tableData.forEach(item => item.edit = undefined)
            // 表格内显示输入框
            this.setRowEditable(row, true);
            this.editData = JSON.parse(JSON.stringify(row));
        } else {
            // 高级编辑
            this.formData = JSON.parse(JSON.stringify(row));
            this.dialogVisible = true;
        }
        this.$emit("updateStatus", "edit")
    },
    /**
     * 删除
     * @param row
     */
    handleDel(row) {
        MessageBox.confirm('删除该属性, 是否继续?', '提示', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
        }).then(() => {
            let index = this.tableData.findIndex(item => item == row);
            this.tableData.splice(index, 1);
            this.$emit("dataChange", this.tableData);
        }).catch(() => {})
    },
    /**
     * 表格内保存
     * @param row
     */
    handleSimpleSave(row) {
        let data = this.addOrEdit == "add" ? this.newData : this.editData;
        if (this.validate(data) != true) {
            return;
        }
        if (this.addOrEdit == "add") {
            // 新增
            this.tableData.push(data);
            this.$emit("updateStatus", "")
        } else {
            // 编辑
            this.setRowEditable(row, false);
            delete data.index;
            this.tableData.splice(row.index, 1, data)
        }
        console.log('handleSimpleSave', this.tableData)

        this.$emit("dataChange", this.tableData);
    },
    /**
     * 对话框保存
     * @param row
     */
    handleAdvanceSave() {
        if (this.addOrEdit == "add") {
            // 新增
            this.tableData.push(this.formData);
            this.$emit("updateStatus", "")
        } else {
            let index = this.formData.index;
            delete this.formData.index;
            delete this.formData.edit;
            this.tableData.splice(index, 1, this.formData)
        }
        this.dialogVisible = false;
        console.log('handleAdvanceSave', this.tableData)
        this.$emit("dataChange", this.tableData);
    },
    /**
     * 表格内编辑时点击取消
     * @param row
     */
    handleCancel(row) {
        if (this.addOrEdit == "edit") {
            this.setRowEditable(row, false);
        } else {
            this.newData = {};
        }
        this.$emit("updateStatus", "")
    },
    /**
     * 关闭对话框
     */
    handleClose() {
        this.$emit("updateStatus", "")
    },
    /**
     * 关闭编辑框
     * @param row
     * @param editable
     */
    setRowEditable(row, editable) {
        if (!this.editInTable) {
            return;
        }
        let index = this.tableData.findIndex(item => item == row );
        let data = JSON.parse(JSON.stringify(row))
        data.edit = editable;
        data.index = index
        this.editIndex = index;
        this.tableData.splice(index, 1, data);
    },
    /**
     * 随机生成字符串
     * @param len 指定生成字符串长度
     */
    getRandomString(len) {
        const _charStr = 'abacdefghjklmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ0123456789';
        const RandomIndex = (min, max, i) => {
            let index = Math.floor(Math.random() * (max - min + 1) + min),
                numStart = _charStr.length - 10;
            //如果字符串第一位是数字，则递归重新获取
            if (i == 0 && index >= numStart) {
                index = RandomIndex(min, max, i);
            }
            //返回最终索引值
            return index;
        }
        let min = 0, max = _charStr.length-1, _str = '';
        //判断是否指定长度，否则默认长度为15
        len = len || 15;
        //循环生成字符串
        for(var i = 0, index; i < len; i++){
            index = RandomIndex(min, max, i);
            _str += _charStr[index];
        }
        return _str;
    },
    /**
     * 校验
     * @param row
     * @returns {boolean}
     */
    validate(row) {
        console.log(row)
        let check = true;
        if (this.editInTable) {
            // 表格内编辑
            this.dataAttr.forEach(function(attr) {
                let valid = attr['validate'];
                if (valid && valid['required']) {
                    if  (row[attr.field] == undefined || row[attr.field] == "") {
                        check = attr.field;
                        return;
                    }
                }
            })
            if (check !== true) {
                this.$nextTick(function () {
                    let id = this.addOrEdit =="add" ?
                        check + "_header" :
                        check + "_row_" + row.index;
                    let dom = document.getElementById(id);
                    if (!dom) {
                        this.$refs[check].focus();
                    } else {
                        dom.focus();
                    }
                })
            }
        } else {
            // 高级模式校验


        }
        return check;
    }
}