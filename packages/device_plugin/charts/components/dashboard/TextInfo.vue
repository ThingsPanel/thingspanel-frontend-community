<!-- 文字信息 -->
<template>
    <div class="text-info-container" @click="showDialog(null)">
      <div class="center">
        <div class="label-box" :style="formData.style.label">{{ option.label }}</div>
        <div class="value-box" :style="formData.style.value">{{ value || '无数据' }}</div>
      </div>
      <el-dialog class="dark-dialog" :title="$t('PLUGIN.CHART_INFO_TAB.TEXT1')" width="500px" :visible.sync="dialogVisible" :append-to-body="true" :close-on-click-modal="false">
        <el-tabs v-model="tabsValue">
          <el-tab-pane style="height: 300px" :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE')" name="map">
            <div class="add-chart-map-container">
              <el-form ref="mapFormRef" :label-position="'top'" label-width="100px" style="margin: 20px"
                       :model="formData" :rules="formRule">

                <el-form-item :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE3')" prop="name">
                  <el-input v-model="formData.name"></el-input>
                </el-form-item>
  
                <el-form-item label="信息" prop="label">
                  <el-input v-model="formData.label"></el-input>
                </el-form-item>

                <el-form-item :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE4')">
                  <!-- 从json中解析出物模型的所有属性 -->
                  <el-select style="width: 100%; margin-bottom: 10px;" :placeholder="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE8')"
                             v-model="formData.map" @change="changeMappingDataSource">
                    <el-option v-for="(option, index) in dataSrc" :key="index"
                               :value="option.name" >{{option.title + '(' + option.name + ')'}}</el-option>
                  </el-select>
  
                </el-form-item>
  
  
              </el-form>
            </div>
          </el-tab-pane>
  
          <el-tab-pane style="height: 300px" :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE2')" name="ui">
            <div class="add-chart-map-container">
              <el-form :label-position="'left'" label-width="100px">
              </el-form>
            </div>
          </el-tab-pane>
  
        </el-tabs>
        <span slot="footer" class="dialog-footer">
          <el-button @click="dialogVisible = false">{{ $t('PLUGIN.CHART_INFO_TAB.CANCEL') }}</el-button>
          <el-button type="primary" @click="submit">{{ $t('PLUGIN.CHART_INFO_TAB.CONFIRM') }}</el-button>
        </span>
      </el-dialog>
    </div>
  </template>
  
  <script>
  export default {
    name: "CommonTextInfo",
    props: {
      option: {
        type: [Object],
        default: () => { return {} }
      },
      value: {
        type: [String],
        default: "无数据"
      },
      mode: {
        type: [String],
        default: ""
      },
      dataSrc: {
        type: [Array],
        default: () => []
      }
    },
    data() {
      return {
        tabsValue: "map",
        formData: {
          name: "",
          label: "文字信息",   // 
          map: "",
          style: {
            label: {
              fontSize: "20px",
              color: "#ffffff"
            },
            value: {
              fontSize: "30px",
              color: "#ffffff"
            }
          }
        },
        formRule: {
          name: [{required: true, message: "请输入组件名称"}],
          label: [{required: true, message: "请输入信息"}],
          map: [{required: true, message: "请选择数据源"}]
        },
        dialogVisible: false,   // 是否显示绑定图表对话框
      }
    },
  
    mounted() {
      
    },
    methods: {
      showDialog(option) {
        if (this.mode != "edit") return;
        if (option) {
          const { name, label, map, value, style } = option
          this.formData = { name, label, map, value, style }
          this.formData.map = option.mapping[0];
        }
        this.formData.style.label.fontSize += "px" 
        this.formData.style.value.fontSize += "px" 
        this.dialogVisible = true;
      },
      submit() {
        let opt = JSON.parse(JSON.stringify(this.option));
        this.$refs.mapFormRef.validate(valid => {
          if (!valid) return;
          opt.controlType = "information";
          opt.name = this.formData.name;
          opt.label = this.formData.label;
          opt.mapping = [this.formData.map]
          console.log(this.formData, this.formData.style.label.fontSize.replace(/px/g, ""))
          opt.style.label.fontSize = Number(this.formData.style.label.fontSize.replace(/px/g, ""));
          opt.style.value.fontSize = Number(this.formData.style.value.fontSize.replace(/px/g, ""));
          this.$emit("bind", opt);
          this.dialogVisible = false;
        })
  
      },
      changeMappingDataSource() {
        console.log(this.dataSrc.find(item => item.name === this.formData.value))
        this.formData.name = this.dataSrc.find(item => item.name === this.formData.map).title || ""
        console.log("changeMappingDataSource", this.formData.value, this.dataSrc)
      }
    }
  }
  </script>
  
  <style scoped lang="scss">
  .text-info-container {
    width: 100%;
    height: 100%;
    display: table;
    position: absolute;
    top: 0px;
    .center {
      display: table-cell;
      vertical-align: middle;
      text-align: center;
      padding: 20px!important;
      .label-box {
        margin: 10px;
      }
    }
  }
  </style>