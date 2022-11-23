const express = require('express');
const sql_con = require('../db_lib');
const { executeQuery } = require('../db_lib/dbset.js');
const router = express.Router();
const path = require('path');
const fs = require('fs')
var url = require('url');

const { setDbData, getDbData, getExLength } = require('../db_lib/back_lib.js');

const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");


router.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});


router.get('/hy1', (req, res, next) => {
    res.render('side/hynjang1')
})



module.exports = router;