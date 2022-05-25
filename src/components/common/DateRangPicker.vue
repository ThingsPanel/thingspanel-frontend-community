<template>
  <v-menu
      v-model="datepicker"
      :close-on-content-click="false"
      transition="scale-transition"
      offset-y
      min-width="auto"
  >
    <template v-slot:activator="{ on, attrs }">
      <v-text-field
          class="pt-0 mx-2 my-v-input"
          v-model="dateRangeText"
          label="日期范围"
          readonly
          v-bind="attrs"
          v-on="on"
      ></v-text-field>
    </template>
    <v-date-picker
        v-model="date_filter"
        no-title
        scrollable
        range
    ></v-date-picker>
  </v-menu>
</template>

<script>
import { computed, defineComponent, ref } from "@vue/composition-api";

export default defineComponent({
  name: "DateRang",
  props: {
    dates: {
      default: [],
    },
  },
  setup(props, context) {
    let datepicker = ref(false);

    let date_filter = computed({
      get() {
        return props.dates;
      },
      set(val) {
        context.emit("update:dates", val);
      },
    });

    let dateRangeText = computed(() => {
      return date_filter.value.join(" ~ ");
    });

    return {
      datepicker,
      date_filter,
      dateRangeText,
    };
  },
});
</script>