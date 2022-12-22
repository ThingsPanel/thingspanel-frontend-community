import Vue from 'vue'
Vue.mixin({
    data() {
        return {
            // 画布上所有的组件集合
            fullData: [],
            scale: 1,
            canvasStyle: {
                intWidth: 1920,
                intHeight: 1080,
                backgroundColor: "#2d3d86",
            }
        }
    },
    methods: {
        setCanvasStyle(refName) {
            this.$nextTick(() => {
                let canvas = this.$refs[refName];
                console.log("====setCanvasStyle", JSON.stringify(this.canvasStyle))
                if (this.canvasStyle.intWidth) {
                    canvas.style.setProperty("--w", this.canvasStyle.intWidth + "px");
                }
                if (this.canvasStyle.intHeight) {
                    canvas.style.setProperty("--h", this.canvasStyle.intHeight + "px");
                }
                if (this.canvasStyle.backgroundColor) {
                    canvas.style.setProperty("--color", this.canvasStyle.backgroundColor);
                }
                this.scale = this.getScale();
                canvas.style.transform = "scale(" + this.scale + ")";
            })
        }
    }
})