<template>
  <div style="display: flex">
      <el-select style="width: 100px;margin-right:10px" v-model="value">
        <el-option v-for="(option, index) in options" :key="index" :label="option.name" :value="option.id"></el-option>
      </el-select>
      <!-- 选择项目后显示分组 -->
      <GroupSelector v-if="value != ''" :id="value" :option="option"/>
  </div>
</template>

<script>
import GroupSelector from "./GroupSelector";
import {business_index} from "@/api/business";
export default {
  name: "ProjectSelector",
  components: {
    GroupSelector
  },
  props: {
    option: {
      type: [Object],
      default: () => { return { operator: true }}
    }
  },
  data() {
    return {
      options: [],
      value: ""
    }
  },
  created() {
    this.getProjectList();
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