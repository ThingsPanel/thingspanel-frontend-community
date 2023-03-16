<template>
    <div class="panel-bg-blue px-4 py-4 rounded text-center">
        <div class="text-muted">{{title}}</div>
        <div class=" text-white title-num">
            {{ value }}
        </div>
    </div>
</template>

<script>

export default {
  props: {
    title: {
      type: [String],
      default: ""  
    },
    value: {
        type: [String, Number],
        default: 0
    },
    option: {
        type: [Object],
        default: () => { return {} }
    }
  }
}
</script>
<style lang="scss" scoped>
</style>