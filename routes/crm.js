const express = require('express');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares');
const sql_con = require('../db_lib');
const { executeQuery } = require('../db_lib/dbset.js');

const router = express.Router();



router.get('/all_data', async (req, res, next) => {
    let allSearchSql = `SELECT * FROM webhookdatas ORDER BY id DESC;`;
    let alldatas = await sql_con.promise().query(allSearchSql)
    let alldata = alldatas[0]
    console.log(alldata);
    res.render('crm/work_alldata', { alldata });
})


router.post('/estate_work/delete', async (req, res, next) => {
    const set_db_list = req.body.set_db_list;
    const getStatusSql = `SELECT * FROM form_status WHERE id=1;`;
    const getStatusText = await sql_con.promise().query(getStatusSql)
    const estate_status_list = getStatusText[0][0].estate_status.split(',')
    const estate_status = estate_status_list[1];

    for await (const on_db_id of set_db_list) {
        console.log(on_db_id);
        let updateSql = `UPDATE application_form SET mb_status = '${estate_status}' WHERE id=${on_db_id}`;
        await sql_con.promise().query(updateSql)
    }


    res.send(200);
})


router.use('/estate_work/detail', async (req, res, next) => {
    res.render('crm/work_estate');
})


router.use('/estate_work', async (req, res, next) => {

    // 1이면 0부터 / 2 이면 15부터 / 3이면 30부터
    let all_data = {};




    // 옵션값 구하기
    const getStatusSql = `SELECT * FROM form_status WHERE id=1;`;
    const getStatusText = await sql_con.promise().query(getStatusSql)
    all_data.estate_list = getStatusText[0][0].estate_list.split(',');
    console.log(all_data.estate_list);


    var pageCount = 15;
    if (!req.query.pnum) {
        var startCount = 0;
        var nowCount = 1;
        var pagingStartCount = 1;
        var pagingEndCount = 6;
    } else {
        var startCount = (req.query.pnum - 1) * pageCount;
        var nowCount = req.query.pnum
        if (req.query.pnum < 3) {
            var pagingStartCount = 1;
            var pagingEndCount = 6;
        } else {
            var pagingStartCount = req.query.pnum - 2;
            var pagingEndCount = pagingStartCount + 5;
        }
    }
    if (req.query.est) {
        var getEst = `AND form_name LIKE '%${req.query.est}%'`;
        all_data.est = req.query.est
    } else {
        var getEst = "";
    }
    console.log(getEst);
    // 안성라포르테
    const allCountSql = `SELECT COUNT(*) FROM application_form WHERE form_type_in='분양' ${getEst};`;
    const allCountQuery = await sql_con.promise().query(allCountSql)
    const allCount = Object.values(allCountQuery[0][0])[0]
    var maxCount = Math.ceil(allCount / pageCount) + 1;
    if (pagingEndCount > maxCount) {
        var pagingEndCount = maxCount;
    }
    const setDbSql = `SELECT * FROM application_form WHERE form_type_in='분양' ${getEst} ORDER BY id DESC LIMIT ${startCount}, ${pageCount};`;
    const tempData = await sql_con.promise().query(setDbSql)
    var wData = tempData[0];

    var pageChkCount = allCount - (pageCount * (nowCount - 1));
    for await (const data of wData) {
        data.chkCount = pageChkCount;
        data.mb_phone_chk = phNumBar(data.mb_phone);
        // data.created_at.setHours(data.created_at.getHours()+9);
        pageChkCount--
    }
    // console.log(wData);
    all_data.wdata = wData;
    all_data.pagingStartCount = pagingStartCount;
    all_data.pagingEndCount = pagingEndCount;
    all_data.nowCount = nowCount;
    res.render('crm/work_estate', { all_data });
})






router.get('/renty_work', async (req, res, next) => {
    res.render('crm/work_renty',);
})



router.use('/', async (req, res, next) => {
    if (req.method == 'POST') {
        // 검증
        const chkSql = `SELECT * FROM form_status WHERE id=1;`;
        const chkData = await sql_con.promise().query(chkSql)
        if (chkData[0] == '') {
            let insertArr = [req.body.renty_status, req.body.estate_status, req.body.estate_list];
            let insertSql = `INSERT INTO form_status (renty_status, estate_status, estate_list) VALUES (?, ?, ?);`;
            await sql_con.promise().query(insertSql, insertArr);
        } else {
            let updatetArr = [req.body.renty_status, req.body.estate_status, req.body.estate_list];
            let updateSql = `UPDATE form_status SET renty_status=?, estate_status=?, estate_list=? WHERE id=1`;
            await sql_con.promise().query(updateSql, updatetArr);
        }
    }
    const resultSql = `SELECT * FROM form_status WHERE id=1;`;
    const resultData = await sql_con.promise().query(resultSql)
    const result = resultData[0][0];
    res.render('crm/crm_main', { result });
})


function phNumBar(value) {
    value = value.replace(/[^0-9]/g, "");
    return value.replace(
        /(^02.{0}|^01.{1}|[0-9]{3})([0-9]+)([0-9]{4})/,
        "$1-$2-$3"
    );
}

module.exports = router;