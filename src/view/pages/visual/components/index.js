const configureFiles = require.context("./configure", true, /\.svg|png$/);
const otherFiles = require.context("./other", false, /.json$/);

const getConfigureComponents = () => {
    let list = [];
    let keys = configureFiles.keys();
    for (let i = 0; i < keys.length; i++) {
        let key = keys[i];    // 文件路径
        let parentName = getParentName(key);   // 父文件夹名称
        let index = list.findIndex(item => item.category == parentName);
        if (index == -1) {
            // 添加类别
            list.push({ category: parentName, components: []})
        } else {
            // 给该类别添加组件
            list[index].components.push(
                {
                    type: "configure",
                    name: parentName + (list[index].components.length + 1) ,
                    image_src: require("@/view/pages/visual/components/configure" + key.replace(".", "")) }
            )
        }
    }
    return list;
}
const getParentName = (path)  => {
    return path.substring(path.indexOf("./", 0) + 2, path.indexOf("/", 2));
}

/**
 * 读取组件
 */
const getComponentsFile = (files) => {
    // 遍历文件夹并获取文件内容
    let list = files.keys().map(key => files(key).default || files(key) );
    // 排序
    list.sort((x, y) => x.sort - y.sort)
    return list;
}

const configureComponents = getComponentsFile(configureFiles);

let  otherComponents = getComponentsFile(otherFiles);

export { getConfigureComponents, configureComponents, otherComponents }