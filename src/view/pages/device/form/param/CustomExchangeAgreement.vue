<template>
  <el-dialog width="800px" class="el-dark-dialog el-dark-input" title="自定义数据解析脚本"
             :close-on-click-modal="false" :close-on-press-escape="false" :show-close="false"
             :visible.sync="dialogVisible" :append-to-body="true">
    <el-form ref="customForm" :model="formData" :rules="formRule">
      <el-row :gutter="20">
        <el-col :span="12">
          <el-form-item label="公司名称" prop="companyName">
            <el-input v-model="formData.company"></el-input>
          </el-form-item>
        </el-col>
        <el-col :span="12">
          <el-form-item label="产品名称" prop="productName">
            <el-input v-model="formData.product_name"></el-input>
          </el-form-item>
        </el-col>
      </el-row>

      <p class="code-editor-label">上行解析脚本</p>
      <CodeEditor class="dark-code-editor" key="upside" style="width: 100%;height: 260px;overflow-y: auto"  min_height="260px"
                  :copy_code="true" :hide_header="false" theme="dark" :wrap_code="true"
                  v-model="formData.script_content_a"
      ></CodeEditor>

      <p class="code-editor-label">下行解析脚本</p>
      <CodeEditor class="dark-code-editor" key="down" style="width: 100%;height: 260px" min_height="260px"
                  :copy_code="true" :hide_header="false" theme="dark" :wrap_code="true"
                  v-model="formData.script_content_b"></CodeEditor>

      <div style="margin-top: 10px;display: flex;justify-content: center">
        <el-button style="color:#000" @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="onSubmit">保存</el-button>
      </div>
    </el-form>


  </el-dialog>
</template>

<script>
import {defineComponent, ref, watch, reactive} from "@vue/composition-api";
import CodeEditor from 'simple-code-editor';
import {message_success} from "@/utils/helpers";
import {getCustomExchangeAgreementList, addCustomExchangeAgreement, editCustomExchangeAgreement} from "@/api/device";

const upCodeTemp = "function encodeInp(msg, topic){\n" +
    "    //编写脚本处理从设备发来消息msg,转为平台可接收的消息规范\n" +
    "    //将msg转为json对象,如:var jsonObj = JSON.parse(msg);\n" +
    "    //处理完后将jsonObj转回字符串,如:msg = JSON.stringify(jsonObj);\n" +
    "    return msg;\n" +
    "}"
const downCodeTemp = "function encodeInp(msg, topic){\n" +
    "    //编写脚本处理从平台发出的消息msg,转为设备可接收的消息规范\n" +
    "    //将msg转为json对象,如:var jsonObj = JSON.parse(msg);\n" +
    "    //处理完后将jsonObj转回字符串,如:msg = JSON.stringify(jsonObj);\n" +
    "    return msg;\n" +
    "}"
export default defineComponent ({
  name: "CustomExchangeAgreement",
  components: {
    CodeEditor
  },
  props: {
    dialogVisible: {
      type: [Boolean],
      default: false
    },
    data: {
      type: [Object],
      default: {}
    },
    device: {
      type: [Object]
    }
  },
  setup(props, context) {

    let formData = reactive({
      id: "",
      company: "",
      product_name: "",
      script_content_a: upCodeTemp,
      script_content_b: downCodeTemp,
      script_type: "javascript"
    })

    let formRule = {
      company: [{ required: true, message: '请输入公司名称'}],
      product_name: [{ required: true, message: '请输入产品名称'}],
    }

    watch(() => props.dialogVisible, value => {
      if (!value) return;
      formData.id = props.data.id;
      formData.protocol_type = props.data.protocol_type;
      if (formData.id) {
        getOne(formData.id);
      } else {
        formData.company = "";
        formData.product_name = "";
        formData.script_content_a = upCodeTemp;
        formData.script_content_b = downCodeTemp;
      }
    })

    function getOne(id) {
      getCustomExchangeAgreementList({current_page: 1, per_page: 10, id})
        .then(({data}) => {
          if (data.code == 200) {
            let d = data.data.data[0];
            formData.company = d.company;
            formData.product_name = d.product_name;
            formData.script_content_a = d.script_content_a;
            console.log("getCustomExchangeAgreementList", formData.script_content_a)
            formData.script_content_b = d.script_content_b;
          }
        })
    }


    function closeDialog() {
      context.emit("update:dialogVisible", false);
    }

    const customForm = ref(null);
    function onSubmit() {
      formData.script_name = formData.company + "" + formData.product_name;
      formData.protocol_type = props.device.protocol;
      formData.script_content_a = formData.script_content_a;
      formData.script_content_b = formData.script_content_b;

      customForm.value.validate((valid) => {
        if (valid) {
          if (formData.id) {
            editCustomExchangeAgreement(formData)
                .then(({data}) => {
                  if (data.code == 200) {
                    context.emit("submit", formData.id);
                    closeDialog();
                  }
                })
          } else {
            addCustomExchangeAgreement(formData)
                .then(({data}) => {
                  if (data.code == 200) {
                    context.emit("submit", data.data.id);
                    closeDialog();
                  }
                })
          }
        } else {
          return false;
        }
      });
    }

    return {
      customForm,
      formRule,
      formData,
      closeDialog,
      onSubmit
    }
  }
})
</script>

<style scoped lang="scss">
  .code-editor-label {
    color: #a8c5ff;
    margin-top: 10px;
    textarea {
      overflow-y: auto;
    }
  }

  //.dark-code-editor {
  //  background-color: rgba(22, 30, 67, 0.5) !important;
  //  border-color: rgba(0, 0, 0, 0.1);
  //
  //  //::v-deep textarea {
  //  //  color: #fff!important;
  //  //  webkit-text-fill-color: #fff!important;
  //  //  background-color: #1f295d !important;
  //  //}
  //}

</style>