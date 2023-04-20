/*
 * @Author: chaoxiaoshu-mx leukotrichia@163.com
 * @Date: 2023-01-29 14:11:24
 * @LastEditors: chaoxiaoshu-mx leukotrichia@163.com
 * @LastEditTime: 2023-03-01 09:29:36
 * @FilePath: \ThingsPanel-Backend-Vue\server\app.js
 * @Description: 
 */

const express = require("express");
const fs = require("fs");
var path = require("path");
var utils = require("./utils")

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

    const dir = path.join(__dirname, "plugin");
 
    fs.readdir(dir, async (err, files) => {
        if (err) {
            throw err;
        }
    
        for (let index = 0; index < files.length; index++) {
            const file = files[index];
            const code = fs.readFileSync(path.join(__dirname, 'plugin', file), "utf-8");
            const comment = utils.getComment(code);
            const result = utils.getKV(comment, "Category");
            console.log(result)
        }
    });

    
})

app.get('/device-plugin', (req, res) => {

})

function getPluginList() {
    const dir = path.join(__dirname, "plugin");
    let arr = [];
    fs.readdir(dir, (err, files) => {
        if (err) {
            throw err;
        }
    
        files.forEach(file => {
            console.log(file);
            let data = fs.readFileSync(path.join(__dirname, 'plugin', file));
            
            console.log(data.toString())
        });
    });
}


