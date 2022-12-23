import Vue from 'vue'
Vue.mixin({
    data() {
        return {
            // 画布上所有的组件集合
            fullData: [],
            defaultScale: 1,
            canvasStyle: {
                intWidth: 1920,
                intHeight: 1080,
                backgroundColor: "#2d3d86",
            },
            selectedStyle: {
                backgroundColor: "#171d46",
                border: "2px solid #26c705"
            }
        }
    },
    methods: {
        setCanvasStyle(canvasRef, parentRef) {
            this.$nextTick(() => {
                let canvas = this.$refs[canvasRef];
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
                this.defaultScale = this.getScale(parentRef);
                canvas.style.transform = "scale(" + this.defaultScale + ")";
            })
        },
        getStyle(cpt) {
            if (!cpt.style) return {};
            if (cpt.style.width) cpt.point.w = cpt.style.width;
            if (cpt.style.height) cpt.point.h = cpt.style.height;
            return cpt.style;
        },
        setZoom(step) {
            if (this.defaultScale >= 1.5 && step > 0) return;
            if (this.defaultScale <= 0.5 && step < 0) return;
            this.defaultScale += step;
            console.log("====setZoom", step)
            let droppable = document.getElementById("droppable")
            droppable.style.transform = "scale(" + this.defaultScale + ")";
        },
        getScale(refName) {
            const parent = this.$refs[refName];
            // 画布父容器宽度
            const parentW = parent.offsetWidth;
            // 画布父容器高度
            const parentH = parent.offsetHeight;
            let scaleX = (parentW - 40) / this.canvasStyle.intWidth;
            let scaleY = (parentH - 40)  / this.canvasStyle.intHeight;
            let scale = Math.min(scaleX, scaleY);
            return scale;
        },
        handleUnselect(cptId) {
            const unselect = (cptId) => {
                const dragBox = document.getElementById("drag_box_" + cptId)
                dragBox.style.backgroundColor = "unset";
                dragBox.style.border = "1px dashed #293b79";
            }
            if (cptId) {
                unselect(cptId);
            }
            // else if (cptId == undefined) {
            //     this.fullData.forEach(item => {
            //         unselect(item.cptId);
            //     })
            // }
        },
        handleSelect(cptId) {
            this.$nextTick(() => {
                const dragBox = document.getElementById("drag_box_" + cptId)
                dragBox.style.backgroundColor = this.selectedStyle.backgroundColor;
                dragBox.style.border = this.selectedStyle.border;
            })
        }
    }
})