const mysql = require('mysql2')

module.exports = mysql.createConnection({
    host: process.env.HOST || '127.0.0.1',
    user: 'root',
    password: process.env.DBPWD,
    database: process.env.SCHEMA2
})