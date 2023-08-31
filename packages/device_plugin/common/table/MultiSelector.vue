<template>
  <div style="display:flex;width:100%">
    <el-select ref="selectRef" style="width:100%;margin-right:4px" multiple 
        :placeholder="'请选择' + placeholder"
        v-model="optionArr" @remove-tag="removeOption">
        <el-option
            v-for="item in options"
            :key="item.identifier"
            :label="item.name"
            :value="item.identifier">
        </el-option>
    </el-select>
    <el-button type="border" size="mini" @click="showAddDialog">新增</el-button>

    <el-dialog  title="新增参数" :append-to-body="true" :visible.sync="dialogVisible" width="30%" :before-close="handleClose">
        <el-form class="el-dark-input" ref="formRef" label-position="left" :model="formData" :rules="formRule" label-width="100px">
            <el-form-item label="参数名称" prop="name">
                <el-input v-model="formData.name"></el-input>
            </el-form-item>
            <el-form-item label="参数标识符" prop="identifier">
                <el-input v-model="formData.identifier"></el-input>
            </el-form-item>
            <el-form-item label="数据类型" prop="type">
                <el-select style="width:100%" v-model="formData.type">
                    <el-option v-for="(option, index) in typeOptions" :key="index" :value="option.value" :label="option.label"></el-option>
                </el-select>
            </el-form-item>
            <el-form-item label="参数描述" prop="description">
                <el-input type="textarea" :rows="6" v-model="formData.description"></el-input>
            </el-form-item>
        </el-form>
        <span slot="footer" class="dialog-footer">
            <el-button type="cancel" @click="handleClose">取消</el-button>
            <el-button type="save" @click="handleSubmit">确定</el-button>
        </span>
    </el-dialog>
  </div>
</template>

<script>
import Const  from "../../data/attrs.js"
export default {
  components: {},
  props: {
    data: {
      type: Array,
      default: () => []
    },
    placeholder: {
        type: String,
        default: () => ''
    }
  },
  data() {
    return {
        dialogVisible: false,
        formData: {},
        formRule: {
            name: [
                { required: true, message: '请输入参数名称', trigger: 'blur' }
            ],
            identifier: [
                { required: true, message: '请输入命令内容', trigger: 'blur' }
            ],
            type: [
                { required: true, message: '请输入数据类型', trigger: 'blur' }
            ]
        },
        options: [],
        optionArr: [],
        typeOptions: Const.commandDataType
    }
  },
  watch: {
    data(val) {
        if (val) {
            this.options = JSON.parse(JSON.stringify(val));
            this.optionArr = [];
            val.forEach(item => {
                this.optionArr.push(item.identifier);
            })
        }
    }
  },
  methods: {
    showAddDialog() {
        console.log('dataType', Const.dataType)
        this.dialogVisible = true;
        this.formData = {
            name: '',
            identifier: '',
            type: 'text',
            description: ''
        }
    },
    removeOption(option) {
        this.options.splice(this.options.indexOf(option), 1);
        this.optionArr.splice(this.optionArr.indexOf(option.identifier), 1);
        this.$emit('update:data', JSON.parse(JSON.stringify(this.options)));
    },
    handleClose() {
        this.dialogVisible = false;
    },
    handleSubmit() {
        this.$refs.formRef.validate((valid) => {
            if (valid) {
                this.options.push(JSON.parse(JSON.stringify(this.formData)));
                this.optionArr.push(this.formData.identifier);
                this.$emit('update:data', JSON.parse(JSON.stringify(this.options)));
                this.handleClose();
            } else {
                return false;
            }
        });
        
    },
    focus() {
        console.log('MultiSelector.focus')
        this.$refs.selectRef.focus();
    }
  }
}
</script>
<style lang="scss" scoped>
</style>