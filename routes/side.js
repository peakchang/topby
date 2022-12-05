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


router.get('/:name', async (req, res, next) => {
    console.log(req.params.name);
    const nameChkSql = `SELECT * FROM hy_site WHERE hy_num = ?`;
    const nameChk = await sql_con.promise().query(nameChkSql, [req.params.name]);
    if (nameChk[0][0]) {
        const setData = nameChk[0][0];
        if(setData.hy_image_list){
            setData.hy_image_list_arr = setData.hy_image_list.split(',');
        }
        
        console.log(setData);
        res.render('side/hynjang', { setData })
    } else {
        const err = new Error('존재하지 않는 url 입니다');
        err.status = 404;
        next(err);
    }
})



module.exports = router;