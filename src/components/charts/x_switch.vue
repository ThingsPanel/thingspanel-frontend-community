<template>
    <div class="v-application v-application--is-ltr">
        <v-switch
                v-model="switch1"
                color="success"
                inset
                @change="switchChange"
        ></v-switch>
    </div>
</template>
<script>
    export default {
        name: 'XSwitch',
        props: {
            loading: {
                type: Boolean,
                default: true,
            },
            apiData: {
                type: Object
            },
            title: {
                type: String,
                default: '',
            }
        },
        data() {
            return {
                switch1: true,
            };
        },
        computed: {},
        watch: {
            apiData: {
                immediate: true,
                handler(val, oldVal) {
                    var _this = this;
                    if (!_this.loading) {
                        _this.initChart();
                    }
                },
            }
        },
        methods: {
            /**
             * init chart
             */
            initChart() {
                // console.log(this.apiData.enable);
                this.switch1 = (this.apiData.enable == 1 ? true : false);
            },

            // change event
            switchChange(val) {
                // console.log(val);
                this.$emit('send', {
                    enable: val ? 1 : 0
                });
            }
        },
        async mounted() {

        }
    };
</script>
