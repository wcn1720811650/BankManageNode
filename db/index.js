const mysql = require('mysql')

const db = mysql.createPool({
    host:'localhost',
    user:'root',
    password:'a1720811650',
    database:'questionnarefilter',
    port:'3306'
})
module.exports = db