<template>
  <div style="display: flex">
      <el-select style="width: 100px;margin-right:10px" v-model="formData.project.id">
        <el-option v-for="(option, index) in options" :key="index" :label="option.name" :value="option.id"></el-option>
      </el-select>
      <!-- 选择项目后显示分组 -->
      <GroupSelector v-if="formData.project.id" :data.sync.once="formData.project"/>
  </div>
</template>

<script>
import GroupSelector from "./GroupSelector";
import {business_index} from "@/api/business";
import bus from "@/core/plugins/eventBus"

export default {
  name: "ProjectSelector",
  components: {
    GroupSelector
  },
  props: {
    data: {
      type: [Object],
      default: () => { return {  }}
    },
    option: {
      type: [Object],
      default: () => { return { operator: true }}
    }
  },
  data() {
    return {
      options: [],
      value: "",
      formData: {}
    }
  },
  created() {
    this.getProjectList();
  },
  watch: {
    data: {
      handler(newValue) {
        this.formData = JSON.parse(JSON.stringify(newValue));
      }
    },
    option(v) {
      bus.$emit("condition_option", v);
    }
  },
  methods: {
    /**
     * 获取项目列表
     */
    getProjectList() {
      business_index({limit: 100, page: 1})
          .then(({data}) => {
            if (data.code == 200) {
              this.options = data.data?.data || [];
            }
          })
    }
  }
}
</script>

<style scoped>

</style>