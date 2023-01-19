const json = {
    "info": {"pluginName": "纵横温湿度", "pluginCategory": "1", "author": "wsy", "version": "0.1", "description": "测试"},
    "tsl": {
        "properties": [{
            "dataType": "integer",
            "dataRange": "0-999",
            "stepLength": 0.1,
            "title": "温度",
            "name": "temp",
            "unit": "C"
        }, {
            "dataType": "integer",
            "dataRange": "0-999",
            "stepLength": 0.1,
            "title": "湿度",
            "name": "hum",
            "unit": "rh"
        }], "option": {"classify": "custom", "catValue": "soil_sensor"}
    },
    "chart": [{
        "tooltip": {"formatter": "{a} <br/>{b} : {c}%"},
        "series": [{
            "name": "Pressure",
            "type": "gauge",
            "center": ["30%", "50%"],
            "radius": "60%",
            "startAngle": 320,
            "endAngle": 42,
            "itemStyle": {"color": "#409EFF"},
            "progress": {"show": true, "itemStyle": {"color": "#409EFF"}},
            "axisTick": {"show": false},
            "splitLine": {"show": false},
            "axisLabel": {"distance": 0, "color": "#409EFF", "fontSize": 10},
            "detail": {"fontSize": 30, "formatter": "{value}", "color": "#409EFF"},
            "data": [{"value": 10, "name": ""}]
        }, {
            "name": "Pressure",
            "type": "gauge",
            "center": ["70%", "50%"],
            "radius": "60%",
            "startAngle": 140,
            "endAngle": -138,
            "itemStyle": {"color": "#49B401"},
            "progress": {"show": true, "itemStyle": {"color": "#49B401"}},
            "axisTick": {"show": false},
            "splitLine": {"show": false},
            "axisLabel": {"distance": 0, "color": "#49B401", "fontSize": 10},
            "detail": {"fontSize": 20, "formatter": "{value}", "color": "#49B401"},
            "data": [{"value": 10, "name": ""}]
        }],
        "simulator": {
            "funcArr": ["return +(Math.random() * 60).toFixed(2);", "return +(Math.random() * 60).toFixed(2);"],
            "interval": 5000
        },
        "name": "温湿度显示",
        "mapping": ["temp", "hum"],
        "controlType": "dashboard",
        "style": {"backgroundColor": "rgba(217, 219, 225, 1)", "opacity": 1},
        "id": "zb9HH9Rhe1rY"
    }, {
        "grid": {"left": "20", "right": "20", "top": "20", "bottom": "20", "containLabel": true},
        "xAxis": {"type": "category", "axisLine": {"lineStyle": {"color": "#fff"}}, "data": [""]},
        "dataZoom": [{"type": "inside", "start": 0, "end": 10}, {"start": 0, "end": 10}],
        "yAxis": {"type": "value", "axisLine": {"lineStyle": {"color": "#fff"}}},
        "series": [{"data": [0], "type": "line"}],
        "name": "温度历史曲线图",
        "mapping": ["temp"],
        "controlType": "history",
        "id": "EsA6rTL7WB0A"
    }],
    "publish": {"isPub": false}
}