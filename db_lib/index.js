const mysql = require('mysql2')

module.exports = mysql.createConnection({
    host: process.env.HOST || 'localhost',
    user: 'root',
    password: process.env.DBPWD,
    database: process.env.SCHEMA
})

