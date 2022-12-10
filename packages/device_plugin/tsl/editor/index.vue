<template>
  <div>
    <el-form :inline="false">
      <el-form-item style="text-align: left">
        <el-radio-group v-model="tslType">
          <el-radio-button label="properties">属性</el-radio-button>
          <el-radio-button label="services">服务</el-radio-button>
          <el-radio-button label="events">事件</el-radio-button>
        </el-radio-group>

        <div v-show="showHandle" style="float: right">
          <el-radio-group v-model="editMode">
            <el-radio-button label="simple">简单模式</el-radio-button>
            <el-radio-button label="advanced">高级模式</el-radio-button>
          </el-radio-group>
          <el-button type="primary" style="margin-left: 10px" @click="jsonDialogVisible=true">JSON模式</el-button>
        </div>

      </el-form-item>

      <el-form-item style="width: 100%">
        <div style="height:440px;overflow-y: auto">
            <!-- 属性 -->
            <common-table v-if="tslType=='properties'" border key="properties"
                          :show-view="showView"
                          :addOrEdit="propertiesAddOrEdit"
                          :showHandle="showHandle"
                          :attr="tableAttr.properties"
                          :data="tableData.properties"
                          :in-edit="inEdit"
                          @updateStatus="v => this.propertiesAddOrEdit = v"
                          @dataChange="dataChange"
            ></common-table>

            <!-- 服务 -->
            <common-table v-else-if="tslType=='services'" border key="services"
                          :show-view="showView"
                          :addOrEdit="servicesAddOrEdit"
                          :showHandle="showHandle"
                          :attr="tableAttr.services"
                          :data="tableData.services"
                          :in-edit="inEdit"
                          @updateStatus="v => this.servicesAddOrEdit = v"
                          @dataChange="dataChange"
            ></common-table>

            <!-- 事件 -->
            <common-table v-else-if="tslType=='events'" border key="events"
                          :show-view="showView"
                          :addOrEdit="eventsAddOrEdit"
                          :showHandle="showHandle"
                          :attr="tableAttr.events"
                          :data="tableData.events"
                          :in-edit="inEdit"
                          @updateStatus="v => this.eventsAddOrEdit = v"
                          @dataChange="dataChange"
            ></common-table>
        </div>
      </el-form-item>
    </el-form>

    <!-- JSON模式对话框 -->
    <el-dialog :class="dark?'dark-dialog':''" :visible="jsonDialogVisible" :append-to-body="true" title="JSON">
      <el-form>
        <el-form-item  style="text-align: left">
          <span style="font-weight: 700">JSON数据：</span>
        </el-form-item>
        <el-form-item>
          <el-input
              type="textarea"
              :autosize="{ minRows: 10, maxRows: 20}"
              placeholder="请输入内容"
              v-model="jsonStr"
          >
          </el-input>
        </el-form-item>

      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="success" @click="jsonDialogVisible=false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>

import CommonTable from "../../common/table"
import props from "./props.js"
import data from "./data.js"
import methods from "./methods";
import watch from "./watch";
export default {
  name: "TslEditor",
  components: { CommonTable },
  props,
  data() {
    return data;
  },
  watch,
  methods
}
</script>

<style scoped>
.el-form-item {

}
</style>