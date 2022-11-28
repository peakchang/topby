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


router.get('/:name', (req, res, next) => {
    // hy5371
    console.log(req.params.name);
    if (req.params.name == "dfdfdf") {
        res.render('side/hynjang1')
    } else {
        const err = new Error('존재하지 않는 url 입니다');
        err.status = 404;
        next(err);
    }
})



module.exports = router;