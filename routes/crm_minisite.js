const express = require('express');
const { isLoggedIn, isNotLoggedIn, chkRateManager, chkRateMaster } = require('./middlewares');
const sql_con = require('../db_lib');
const { executeQuery } = require('../db_lib/dbset.js');
const bcrypt = require('bcrypt');
const router = express.Router();
const xlsx = require("xlsx");
const multer = require('multer');
const path = require('path');
const fs = require('fs')
const xml2js = require('xml2js');
const app_root_path = require('app-root-path').path;
var url = require('url');

const { setDbData, getDbData, getExLength, randomChracter, getQueryStr } = require('../db_lib/back_lib.js');

const moment = require('moment');
const { IGComment } = require('facebook-nodejs-business-sdk');
const { type } = require('os');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

router.post('/add_row_data', async (req, res, next) => {
    let status = true;

    console.log(status);

    res.json({ status })
})

router.use('/', async (req, res, next) => {


    console.log('메인으로 오는건 아니지??!!');

    res.render('crm/work_minisite', {})
})

module.exports = router;