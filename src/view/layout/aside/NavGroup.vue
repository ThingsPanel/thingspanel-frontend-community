<template>
  <v-list-group
      :prepend-icon="item.icon"
      :value="item.open"
      no-action
  >
    <template v-slot:activator>
      <v-list-item-content>
        <v-list-item-title>{{ $t(item.name) }}</v-list-item-title>
      </v-list-item-content>
    </template>

    <NavItem v-for="(item, i) in item.children" :key="item.link + i" :item="item"></NavItem>
  </v-list-group>
</template>

<script>
import NavItem from "@/view/layout/aside/NavItem";

export default {
  name: "NavGroup",
  components: {
    NavItem
  },
  props:{
    item:{
      required: true
    }
  }
}
</script>

<style scoped>

</style>