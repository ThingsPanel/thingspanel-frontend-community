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
        setCanvasStyle(canvasRef, parentRef, space = 0) {
            this.$nextTick(() => {
                let canvas = this.$refs[canvasRef];
                const parent = this.$refs[parentRef];
                console.log("====setCanvasStyle", JSON.stringify(this.canvasStyle))
                if (this.canvasStyle.intWidth) {
                    canvas.style && canvas.style.setProperty("--w", this.canvasStyle.intWidth + "px");
                }
                if (this.canvasStyle.intHeight) {
                    canvas.style && canvas.style.setProperty("--h", this.canvasStyle.intHeight + "px");
                }
                if (this.canvasStyle.backgroundColor) {
                    parent.style && parent.style.setProperty("--color", this.canvasStyle.backgroundColor);
                    canvas.style && canvas.style.setProperty("--color", this.canvasStyle.backgroundColor);
                }
                this.defaultScale = this.getScale(parentRef, space);
                canvas.style && (canvas.style.transform = "scale(" + this.defaultScale + ")");
            })
        },
        getStyle(cpt) {
            if (!cpt.style) return {};
            if (cpt.style.width) cpt.point.w = cpt.style.width;
            if (cpt.style.height) cpt.point.h = cpt.style.height;
            return cpt.style;
        },
        getScale(refName, space) {
            const parent = this.$refs[refName];
            // 画布父容器宽度
            const parentW = parent.offsetWidth;
            // 画布父容器高度
            const parentH = parent.offsetHeight;
            console.log("====parent", parent.offsetWidth, parent.offsetHeight)
            console.log("====window", window.innerWidth, window.innerHeight)
            let scaleX = (parentW - space) / this.canvasStyle.intWidth;
            let scaleY = (parentH - space)  / this.canvasStyle.intHeight;

            return Math.min(scaleX, scaleY);
        },
        handleUnselect(cptId) {
            const unselect = (cptId) => {
                const dragBox = document.getElementById("drag_box_" + cptId)
                if (!dragBox.style) return;
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