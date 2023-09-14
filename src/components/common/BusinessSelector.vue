<template>
  <el-cascader :placeholder="$t('DATA_MANAGEMENT.PLACEHOLDER2')" v-model="businessCascaderData" :props="businessProps"
    :clearable="clearable" filterable class="w-100" @change="handleChange()">
  </el-cascader>
</template>

<script>
import { defineComponent } from "@vue/composition-api";
import { computed, reactive } from "@vue/composition-api/dist/vue-composition-api";
import { business_index } from "@/api/business";

export default defineComponent({
  name: "BusinessSelector",
  props: {
    business_id: {
      required: true,
      type: String,
    },
    clearable: {
      default: true
    },
    showAll: {
      default: false
    }
  },
  setup(props, context) {
    // 业务
    let businessCascaderData = computed({
      get() {
        return [props.business_id]
      },
      set(val) {
        // 触发事件更新 props.business_id
        context.emit('update:business_id', val.join(""))
      }
    })

    // 业务级联懒加载
    let businessProps = reactive({
      lazy: true,
      lazyLoad(node, resolve) {
        business_index({ page: 1 }).then(({ data }) => {
          let nodes = []
          if (data.code === 200 && data.data.data) {
            nodes = data.data.data.map((item) => ({
              value: item.id,
              label: item.name,
              leaf: true,
            }))

            // 显示所有选项
            if (props.showAll) {
              nodes.unshift({
                label: '所有项目',
                value: 'all',
                leaf: true
              })
            }
            // 返回节点
            resolve(nodes)
          }
        })
      }
    })

    function handleChange() {
      context.emit('change')
      // console.log('handelChange')
    }

    return {
      businessCascaderData,
      businessProps,
      handleChange,
    }
  }
})
</script>

<style>
/* .el-cascader-node:not(.is-disabled):hover{
    color: #fff;
    background: #0087F6;
  } */
</style>