<template>
  <div>
    <!-- 表格 -->
    <el-table :data="tableData" border>
      <el-table-column type="expand" label="查看" width="80" v-if="showView">
        <template slot-scope="props">
          <el-form label-position="left" class="table-form-expand">
            <el-form-item v-for="(attr , index) in dataAttr" :key="index" >
<!--              <span>{{ props.row[attr.field] }}</span>-->
              <el-alert
                  :title="attr.label + '： ' + (props.row[attr.field] || '--')"
                  :closable="false"
                  type="info"></el-alert>
            </el-form-item>

          </el-form>
        </template>
      </el-table-column>
      <el-table-column align="center"
                       v-for="(attr , index) in dataAttr" :key="index"
                       v-if="!attr.advanced"
                       :prop="attr.field"
                       :label="attr.label"
      >
        <!-- 表头，非操作列 -->
        <template v-slot:header >

          <div v-if="editInTable">
            <!-- editInTable为TRUE时，点击新增按钮在列头显示编辑框 -->

            <el-select v-if="addOrEdit=='add' && showHandle && attr.type=='select'" v-model="newData[attr.field]">
              <el-option v-for="(option, index) in attr.options" :key="index"
                      :label="option.label" :value="option.value"
              ></el-option>
            </el-select>

            <el-input v-else-if="addOrEdit=='add' && showHandle"
                      v-model="newData[attr.field]"
                      :id="attr.field + '_header'"
                      :placeholder="attr.label"></el-input>
          </div>
          <!-- 显示 -->
          <span v-show="addOrEdit!='add' || !showHandle || !editInTable">{{ attr.label }}</span>
        </template>

        <!-- 行，非操作列 -->
        <template v-slot="scope">

          <!-- 编辑 -->
          <div v-show="scope.row.edit && showHandle">
            <el-select v-show="attr.type=='select'" v-model="editData[attr.field]"
                       :id="attr.field + '_row_' + scope.row['index']" >
              <el-option v-for="(option, index) in attr.options" :key="index"
                         :label="option.label" :value="option.value"
              ></el-option>
            </el-select>
            <!-- 编辑输入框 -->
            <el-input v-show="attr.type!='select'" v-model="editData[attr.field]"
                      :id="attr.field + '_row_' + scope.row['index']" ></el-input>
          </div>

          <div v-show="!scope.row.edit || !showHandle">
            <el-tag v-if="attr.type=='select'">{{ scope.row[attr.field] }}</el-tag>
            <!-- 显示文本 -->
            <span v-else>{{ scope.row[attr.field] }}</span>
          </div>

        </template>
      </el-table-column>



      <!--    操作列-->
      <el-table-column align="center" v-if="showHandle">

        <!-- 列头按钮 -->
        <template v-slot:header>
          <el-button v-if="(showHandle && addOrEdit!='add') || !editInTable" @click="handleAdd">新增</el-button>
          <el-button v-if="editInTable && addOrEdit=='add'" @click="handleSimpleSave(null)">保存</el-button>
          <el-button v-if="editInTable && addOrEdit=='add'" @click="handleCancel(null)">取消</el-button>
        </template>

        <!-- 行按钮 -->
        <template v-slot="scope">
          <el-button v-show="!scope.row['edit']" @click="handleEdit(scope.row)">编辑</el-button>
          <el-button v-show="!scope.row['edit']" @click="handleDel(scope.row)">删除</el-button>
          <el-button v-show="editInTable && scope.row['edit']" @click="handleSimpleSave(scope.row)">保存</el-button>
          <el-button v-show="editInTable && scope.row['edit']" @click="handleCancel(scope.row)">取消</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 高级模式对话框-->
    <el-dialog width="600px" :class="dark?'dark-dialog':''"
        :title="addOrEdit=='add'?'新增':'编辑'"
        :visible.sync="dialogVisible" :append-to-body="true"
        @closed="handleClose">
      <el-form style="padding-left: 30px; padding-right: 30px;" label-position="left" label-width="100px" :model="formData">

        <el-form-item style="margin-bottom: 30px"
            v-for="(attr , index) in dataAttr" :key="index" :label="attr.label + '：'">

          <!-- 下拉列表 -->
          <el-select v-if="attr.type=='select'" style="width: 100%" :filterable="attr.filterable"
                     v-model="formData[attr.field]" @change="selectChange">
            <el-option v-for="(option, index) in attr.options" :key="index"
                       :value="option.value" :label="option.label+'('+option.value+')'"></el-option>
          </el-select>

          <!-- 文本域 -->
          <el-input v-else-if="attr.type=='textarea'"
                    v-model="formData[attr.field]"
                    type="textarea" maxlength="50" :rows="3">
          </el-input>

          <!-- 范围 -->
          <span v-else-if="attr.type=='range'">
              <range-input :data.sync="formData[attr.field]"></range-input>
          </span>

          <!-- 输入框 -->
          <el-input v-else v-model="formData[attr.field]"></el-input>

        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="handleAdvanceSave">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import props from "./props";
import data from "./data";
import watch from "./watch";
import methods from "./methods";
import RangeInput from "./RangeInput"
export default {
  name: "CommonTable",
  components: { RangeInput },
  props,
  data() {
    return data;
  },
  watch,
  methods
}
</script>

<style scoped>
.table-form-expand {
  padding-left: 30px;
}
/deep/ .table-form-expand .el-form-item__label {
  width: 90px;
  color: #99a9bf!important;

}
</style>