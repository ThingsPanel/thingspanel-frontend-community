<!-- 物模型 -->
<template>
  <div class="tsl-container">
    <el-radio-group class="radio-classify" v-model="radioClassify">
      <el-radio-button label="standard">{{ $t('PLUGIN.MATTER_MODEL_INFO_TAB.RADIO_TAB1') }}</el-radio-button>
      <el-radio-button label="custom">{{ $t('PLUGIN.MATTER_MODEL_INFO_TAB.RADIO_TAB2') }}</el-radio-button>
    </el-radio-group>

    <!--    标准物模型 start-->
    <div class="div-select" v-if="radioClassify=='standard'">
      <el-form>
        <el-form-item :label="$t('PLUGIN.MATTER_MODEL_INFO_TAB.LABLE1')">
          <el-cascader v-model="tslValue" separator=" -> "
                       :options="tslOptions" filterable
                       @change="handleChange"></el-cascader>
        </el-form-item>
      </el-form>
      <tsl-editor key="standard" :table-attr="tableAttr" :data="standardData"></tsl-editor>
    </div>
    <!--    标准物模型 end -->

    <!-- 自定义物模性 start-->
    <div class="div-select category" v-else>
      <!-- <el-form>
        <el-form-item :label="$t('PLUGIN.MATTER_MODEL_INFO_TAB.LABLE2')">
          <el-select v-model="categoryValue">
            <el-option v-for="(option, index) in tslOptions" :key="index" :value="option.value" :label="option.label"></el-option>
          </el-select>
        </el-form-item>
      </el-form> -->
      <tsl-editor key="custom" :table-attr="tableAttr" :data="customData" :showHandle="true" @dataChange="dataChange"></tsl-editor>
    </div>
    <!-- 自定义物模性 end-->

  </div>

</template>

<script>
import TslEditor from "../tsl/editor"
import { standardTSL } from "../data/attrs";
import {message_error} from "../../../src/utils/helpers";

export default {
  name: "TSL",
  components: {
    TslEditor
  },
  props: {
    standardTSL: {
      type: [Array],
      default: () => []
    },
    /**
     * 表格/表单的字段属性，包括属性，服务，事件
     * 如：属性表格/表单的列头：标题，名称，数据类型，取值范围等。
     */
    tableAttr: {
      type: [Object],
      required: true,
      default: () => { return {} }
    },
    /**
     * 表格的数据，包括属性，服务，事件
     */
    data: {
      type: [Object],
      required: true,
      default: () => { return {} }
    }
  },
  data() {
    return {
      customData: {},
      radioClassify: "standard",   // standard: 标准物模型，custom: 自定义物模型
      tslValue: "",
      categoryValue: "",
      // 标准物模型下拉数据
      tslOptions: standardTSL,
      // 标准物模型数据
      standardData: {}
    }
  },
  created() {
  },
  watch: {
    data: {
      handler(newValue) {
        if (newValue.option && newValue.option.classify && newValue.option.classify == "custom"){
          this.radioClassify = "custom";
          this.categoryValue = newValue.option.catValue ? newValue.option.catValue : "";
          this.customData = newValue;
        } else {
          this.radioClassify = "standard";
          console.log("====this", newValue)
          this.tslValue = newValue.option ? (newValue.option.tslValue ? newValue.option.tslValue : []) : [];
          this.standardData = newValue;
        }
      },
      immediate: true
    }
  },
  methods: {
    dataChange(data) {
      console.log("dataChange", data);
      this.customData = data;
      this.customData.option = { classify: "custom" };
    },
    handleChange() {
      let cat = standardTSL.find(item => item.value == this.tslValue[0]);
      let item = cat.children.find(item => item.value == this.tslValue[1])
      this.standardData = item.tsl;
    },
    /**
     * 校验
     */
    chkValue() {
      if (this.radioClassify == "standard") {
        if (this.tslValue == "") {
          message_error("请选择标准物模型！");
          return false;
        }
      } else {
        // if (this.categoryValue == "") {
        //   message_error("请选择分类！")
        //   return false;
        // }
        if (this.customData.properties == undefined || this.customData.properties.length == 0) {
          message_error("物模型不能为空！")
          return false;
        }
      }
      return true;
    }
  }
}
</script>

<style scoped>
.tsl-container {
  height: 620px;
}
.radio-classify {
  margin-bottom: 15px;
}
.div-select {
  margin-left: 10px;
  padding-top: 10px;
}
</style>