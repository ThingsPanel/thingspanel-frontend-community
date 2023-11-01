<template>
  <div class="status-container" @click="showDialog">
    <div class="center" >
            <img v-if="status" src="./signal_status_on.svg" alt="">
            <img v-else src="./signal_status_off.svg" alt="">
        <p>{{ status ? option.onLabel : option.offLabel }}</p>
    </div>

    <el-dialog class="dark-dialog" :title="$t('PLUGIN.CHART_INFO_TAB.TEXT1')" width="500px" :visible.sync="dialogVisible" :append-to-body="true" :close-on-click-modal="false">
        <el-form :label-position="'left'">
            <el-form-item :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE3')">
                <el-input v-model="optionData.name"></el-input>
              </el-form-item>

              <el-form-item :label="$t('PLUGIN.CHART_INFO_TAB.TAB_TITLE4')">
                <!-- 从json中解析出物模型的所有属性 -->
                  <el-select style="width: 100%; margin-bottom: 10px;" v-model="optionData.mapping">
                    <el-option v-for="(option, index) in dataSrc" :key="index"
                              :label="option.title" :value="option.name" ></el-option>
                  </el-select>

                  <el-row :gutter="20">
                    <el-col :span="12">
                      <span>{{ $t('PLUGIN.CHART_INFO_TAB.TAB_TITLE17') }}</span>
                      <el-input v-model="optionData.on"></el-input>
                    </el-col>
                    <el-col :span="12">
                      <span>{{ $t('PLUGIN.CHART_INFO_TAB.TAB_TITLE18') }}</span>
                      <el-input v-model="optionData.off"></el-input>
                    </el-col>
                  </el-row>

            </el-form-item>
            
        </el-form>
        <span slot="footer" class="dialog-footer">
            <el-button @click="dialogVisible = false">{{ $t('PLUGIN.CHART_INFO_TAB.CANCEL') }}</el-button>
            <el-button type="primary" @click="submit">{{ $t('PLUGIN.CHART_INFO_TAB.CONFIRM') }}</el-button>
          </span>
    </el-dialog>
  </div>
</template>

<!-- 信号状态组件 -->
<script>
export default {
  name: "CommonSignalStatus",
  components: {},
  props: {
    value: {
        type: [Boolean, String, Number, Object],
        default: false
    },
    mode: {
        type: String,
        default: ""
    },
    // 数据源
    dataSrc: {
      type: [Array],
      default: () => ([])
    },
    // 数据
    option: {
        type: Object,
        default: () => ({})
    }
  },
  data() {
    return {
        dialogVisible: false,
        dataSrcOptions: [],
        optionData: {},
        status: false
    }
  },
  watch: {
    value: {
        handler(val) {
        },
        immediate: true,
        deep: true
    },
    dataSrc: {
      handler(val, oldVal) {
      },
      immediate: true
    },
    option: {
        handler(val, oldVal) {
        },
        immediate: true,
        deep: true
    }
  },
  mounted() {
  },
  methods: {
    updateValue(val) {
      const { on, off } = this.option;

      if (val && (val.toString() === on.toString())) {
        this.status = true;
      } else {
        this.status = false;
      }
    },
    showDialog(option) {
        if (this.mode != "edit") return;
        if (option) {
            this.optionData = { ...option };
        }
        this.dialogVisible = true;
    },
    submit() {
        let opt = { ...this.option, ...this.optionData };
        opt.controlType = "information";
        this.$emit("bind", opt);
        this.dialogVisible = false;
    }
  }
}
</script>
<style lang="scss" scoped>
.status-container {
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
      img {
        width: 30%;
        height: 30%;
      }
      p {
        margin: 10px;
      }
  
    }
    ::v-deep .el-row {
        .el-col {
            display: inline-flex!important;
            span {
                width: 60px;
                text-align: center;
            }
        }
    }
  }
</style>