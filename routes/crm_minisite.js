const express = require('express');
const { chkRateMaster } = require('./middlewares');
const sql_con = require('../db_lib');
const router = express.Router();

const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");



router.post('/add_row_data', async (req, res, next) => {
    let status = true;
    let message = ""

    console.log(req.body);
    const domainName = req.body.addRowValue;
    const nowStr = moment().format('YYYY-MM-DD HH:mm:ss');

    try {
        const domainInsertQuery = "INSERT INTO land (ld_domain, ld_created_at) VALUES (?,?)";
        await sql_con.promise().query(domainInsertQuery, [domainName, nowStr]);
    } catch (err) {
        status = false;
        console.error(err.message);
        if (err.message.includes("Duplicate")) {
            message = "중복된 도메인이 있습니다."
        }
    }



    res.json({ status, message })
})

router.use('/', chkRateMaster, async (req, res, next) => {

    let status = true;
    let land_list = []

    try {
        const loadLandListQuery = "SELECT * FROM land ORDER BY ld_id DESC"
        const loadLandList = await sql_con.promise().query(loadLandListQuery);
        land_list = loadLandList[0]
    } catch (error) {
        status = false;
    }

    console.log(land_list);
    console.log('메인으로 오는건 아니지??!!');

    res.render('crm/work_minisite', { land_list })
})

module.exports = router;