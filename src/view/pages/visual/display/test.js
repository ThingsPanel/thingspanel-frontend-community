const json = {
    "screen": [{
        "name": "柱状图",
        "type": "bar",
        "controlType": "bar",
        "image_src": "/img/bar.766c7be1.svg",
        "point": {"h": 302, "w": 345, "x": 670, "y": 100, "z": 501},
        "cptId": "GoFp5Mupc",
        "editable": false,
        "activeted": false,
        "mapping": ["DO2"],
        "casValue": [],
        "dataSrc": [{
            "casValue": ["0ba3d6ff-30ed-4830-be8e-b1fbb2052a4b", "52ab6e26-64a3-d643-e79a-08c06ba1fc64", "4c310c31-ec11-0f48-47fa-3d53a005aa41"],
            "deviceId": "4c310c31-ec11-0f48-47fa-3d53a005aa41",
            "property": {
                "dataType": "integer",
                "dataRange": "0-999",
                "stepLength": 0.1,
                "unit": "-",
                "title": "DO2",
                "name": "DO2"
            }
        }]
    }, {
        "name": "饼图",
        "type": "pie",
        "controlType": "pie",
        "image_src": "/img/pie.65a49e55.svg",
        "point": {"h": 302, "w": 361, "x": 157, "y": 394, "z": 502},
        "cptId": "oYDRrsjEg",
        "editable": false,
        "activeted": false,
        "mapping": ["DO1"],
        "casValue": [],
        "dataSrc": [{
            "casValue": ["0ba3d6ff-30ed-4830-be8e-b1fbb2052a4b", "52ab6e26-64a3-d643-e79a-08c06ba1fc64", "4c310c31-ec11-0f48-47fa-3d53a005aa41"],
            "deviceId": "4c310c31-ec11-0f48-47fa-3d53a005aa41",
            "property": {
                "dataType": "integer",
                "dataRange": "0-999",
                "stepLength": 0.1,
                "unit": "-",
                "title": "DO1",
                "name": "DO1"
            }
        }]
    }, {
        "name": "曲线图",
        "type": "curve",
        "controlType": "history",
        "image_src": "/img/curve.103b2c3b.svg",
        "point": {"h": 289, "w": 278, "x": 1199, "y": 324, "z": 503},
        "cptId": "almsnQXrY",
        "editable": false,
        "activeted": false,
        "mapping": ["REG20000"],
        "dataSrc": [{
            "casValue": ["0ba3d6ff-30ed-4830-be8e-b1fbb2052a4b", "52ab6e26-64a3-d643-e79a-08c06ba1fc64", "4c310c31-ec11-0f48-47fa-3d53a005aa41"],
            "deviceId": "4c310c31-ec11-0f48-47fa-3d53a005aa41",
            "property": {
                "dataType": "float",
                "dataRange": "0-999",
                "stepLength": 0.1,
                "unit": "-",
                "title": "REG20000",
                "name": "REG20000"
            }
        }]
    }, {
        "name": "文本",
        "type": "text",
        "style": {
            "opa": 1,
            "bgColor": "#2d3d86",
            "borderRadius": "0px",
            "borderWidth": "0px",
            "borderColor": "#2d3d86",
            "fontSize": "25px",
            "backgroundColor": "rgba(45, 61, 134, 1)"
        },
        "image_src": "/img/text_1.ec9a1b34.svg",
        "point": {"h": 50, "w": 100, "x": 1093, "y": 632, "z": 504},
        "cptId": "vBFQKvemH",
        "editable": false,
        "activeted": true,
        "value": "文本",
        "mapping": ["humidity"],
        "casValue": [],
        "dataSrc": [{
            "casValue": ["f553f517-5c1e-f563-dea7-887542a77dee", "18a0a973-68f3-17ee-0e26-5b32839be245", "261855cc-b9be-fa6a-60eb-0474b7af81f9"],
            "deviceId": "261855cc-b9be-fa6a-60eb-0474b7af81f9",
            "property": {
                "name": "humidity",
                "title": "湿度",
                "dataType": "float",
                "dataRange": "0-100",
                "stepLength": 0.1,
                "unit": "%"
            }
        }]
    }, {
        "name": "仪表盘",
        "type": "dashboard",
        "controlType": "dashboard",
        "image_src": "/img/dashboard.96f152d5.svg",
        "point": {"h": 200, "w": 200, "x": 676, "y": 604, "z": 501},
        "cptId": "DlVF94z1b",
        "editable": false,
        "activeted": false,
        "mapping": ["temp"],
        "dataSrc": [{
            "casValue": ["cbb46065-dfb7-1f94-3b70-d9002544abef", "94bfe48e-e4cb-8699-1d61-d890976d9c9c", "6f3fac81-9b5e-5eeb-1357-40d1ed1d6fa1"],
            "deviceId": "6f3fac81-9b5e-5eeb-1357-40d1ed1d6fa1",
            "property": {
                "dataType": "float",
                "dataRange": "0-999",
                "stepLength": 0.1,
                "title": "温度",
                "name": "temp",
                "unit": "℃"
            }
        }]
    }, {
        "name": "文本",
        "type": "text",
        "style": {"width": 100, "height": 50, "fontSize": 20},
        "image_src": "/img/text_1.ec9a1b34.svg",
        "point": {"h": 50, "w": 100, "x": 1347, "y": 787, "z": 501},
        "cptId": "ULy8AUUoO",
        "editable": false,
        "activeted": true,
        "value": "文本",
        "mapping": ["DO0"],
        "dataSrc": [{
            "casValue": ["0ba3d6ff-30ed-4830-be8e-b1fbb2052a4b", "52ab6e26-64a3-d643-e79a-08c06ba1fc64", "4c310c31-ec11-0f48-47fa-3d53a005aa41"],
            "deviceId": "4c310c31-ec11-0f48-47fa-3d53a005aa41",
            "property": {
                "dataType": "integer",
                "dataRange": "0-999",
                "stepLength": 0.1,
                "unit": "-",
                "title": "DO0",
                "name": "DO0"
            }
        }]
    }], "canvasStyle": {"intWidth": 1920, "intHeight": 1080, "backgroundColor": "#2d3d86"}
}