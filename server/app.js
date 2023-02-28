/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-01-29 14:11:24
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-02-28 15:09:15
 * @FilePath: \ThingsPanel-Backend-Vue\server\app.js
 * @Description: 
 */

const express = require("express");
const fs = require("fs");
var path = require("path");

const app = express();
const port = 3001


app.listen(port, () => {
    console.log(`Server is start on: http://localhost:${port}`)
});

app.all('*', function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.get('/test', (req, res) => {
    console.log("调用了test接口")
    console.log("path.join(__dirname)", path.join(__dirname, "plugin"))
    let data = fs.readFileSync(path.join(__dirname, 'plugin/test.vue'));
    res.send(data)
})

