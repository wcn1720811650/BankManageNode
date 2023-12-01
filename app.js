const express = require('express')
const app = express()
const router = require('./router/router')
const cors = require("cors");
const db = require('./db/index')//导入数据库操作模块

//使用
app.use('/', cors(), router);
app.listen(3000, function () {
    console.log("项目启动")
})
