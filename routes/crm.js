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

const app_root_path = require('app-root-path').path;
var url = require('url');

const { setDbData, getDbData, getExLength, randomChracter } = require('../db_lib/back_lib.js');

const moment = require('moment');
const { Logform, log } = require('winston');
const { IGComment } = require('facebook-nodejs-business-sdk');
const { type } = require('os');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

const ExcelJS = require('exceljs');

const ncp = require('ncp').ncp;
ncp.limit = 16;

router.get('/download', async (req, res) => {

    const query = req.query;
    const startDay = query.sd;
    const endDay = query.ed;
    let downloadData = []

    let addQuery = ""
    if (startDay || endDay) {
        addQuery = `WHERE af_created_at BETWEEN '${startDay}' AND '${endDay}'`
    }
    try {
        const getDownloadDataQuery = `SELECT * FROM application_form ${addQuery} ORDER BY af_id DESC`
        const getDownloadData = await sql_con.promise().query(getDownloadDataQuery);
        downloadData = getDownloadData[0]
    } catch (error) {

    }
    const dataFromDB = [
        { name: 'John', age: 30, email: 'john@example.com' },
        { name: 'Jane', age: 25, email: 'jane@example.com' },
        // 여기에 데이터베이스에서 가져온 실제 데이터를 사용합니다.
    ];

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');

    // 열 제목 추가
    worksheet.columns = [
        { header: '접수번호', key: 'af_id', width: 10 },
        { header: '고객명', key: 'af_mb_name', width: 40 },
        { header: '전화번호', key: 'af_mb_phone', width: 30 },
        { header: '현장', key: 'af_form_name', width: 30 },
        { header: '상태', key: 'af_mb_status', width: 10 },
        { header: '접수 시간', key: 'af_created_at', width: 20 },
    ];

    // 데이터 추가
    downloadData.forEach(row => {
        worksheet.addRow(row);
    });

    // 파일 생성 및 전송
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=db_data.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
});

router.use('/site', async (req, res, next) => {
    if (req.method == "POST") {
        if (typeof (req.body.site_id) == "string") {
            const deleteSiteListSql = "DELETE FROM site_list WHERE sl_id = ?";
            await sql_con.promise().query(deleteSiteListSql, [req.body.site_id]);
        } else {
            for await (const idx of req.body.site_id) {
                const deleteSiteListSql = "DELETE FROM site_list WHERE sl_id = ?";
                await sql_con.promise().query(deleteSiteListSql, [idx]);
            }
        }
        return res.redirect('/crm/site')
    }
    const onSiteListSql = "SELECT * FROM site_list ORDER BY sl_id DESC";
    const onSiteList = await sql_con.promise().query(onSiteListSql);
    const on_site_list = onSiteList[0]
    res.render('crm/work_site', { on_site_list })
})

router.use('/site_sms_load', async (req, res, next) => {
    let status = true;
    let sms_content = ""
    try {
        const getSmsContentLoadQuery = "SELECT sl_sms_content FROM site_list WHERE sl_id = ?";
        const getSmsContentLoad = await sql_con.promise().query(getSmsContentLoadQuery, [req.body.getId]);
        sms_content = getSmsContentLoad[0][0].sl_sms_content
    } catch (error) {

    }
    res.json({ status, sms_content })
})

router.use('/site_sms_upload', async (req, res, next) => {
    let status = true;
    try {
        const body = req.body;
        const updateSmsContent = "UPDATE site_list SET sl_sms_content = ? WHERE sl_id = ?";
        await sql_con.promise().query(updateSmsContent, [body.smsContent, body.getId]);
    } catch (error) {
        status = false;
    }

    res.json({ status })
})

router.use('/site_realname_upload', async (req, res, next) => {
    let status = true;
    const body = req.body;

    try {
        const updateRealNameQuery = "UPDATE site_list SET sl_site_realname = ? WHERE sl_id = ?";
        await sql_con.promise().query(updateRealNameQuery, [body.realName, body.getId]);
    } catch (error) {
        status = false;
    }

    res.json({ status })
})


router.get('/down_db', chkRateMaster, async (req, res, next) => {
    var pathBasic = `${app_root_path}/public/temp/down.txt`;
    fs.writeFile(pathBasic, '', (err) => { });

    var addQuery = '';
    if (req.query.sd || req.query.ed) {
        var addQuery = `WHERE af_created_at > '${req.query.sd}' AND af_created_at < '${req.query.ed}'`;
    }

    if (req.query.sd && req.query.est != '') {
        var addQuery = addQuery + `AND af_form_name LIKE '%${req.query.est}%'`;
    } else if (req.query.est && req.query.est != '') {
        var addQuery = `WHERE af_form_name LIKE '%${req.query.est}%'`;
    }


    if (req.query.sd && req.query.status != '' || req.query.est && req.query.status != '') {
        var addQuery = addQuery + `AND af_mb_status = '${req.query.status}'`;
    } else if (req.query.status && req.query.status != '') {
        var addQuery = `WHERE af_mb_status = '${req.query.status}'`;
    }

    const downDbSql = `SELECT af_mb_name,af_mb_phone,af_form_name FROM application_form ${addQuery} GROUP BY af_mb_phone ORDER BY af_id DESC`;
    const downDbList = await sql_con.promise().query(downDbSql)


    for (const downDb of downDbList[0]) {
        const db_name = downDb.af_mb_name
        const db_phone = downDb.af_mb_phone
        const db_form = downDb.af_form_name

        fs.appendFileSync(pathBasic, `${db_name},${db_phone},${db_form}\n`, (err) => { })
    }

    var now = moment(Date.now()).format('YYYY-MM-DD');
    const downFileName = `${now}_file.txt`;
    res.setHeader('Content-Disposition', `attachment; filename=${downFileName}`); // 이게 핵심 
    res.sendFile(`${app_root_path}/public/temp/down.txt`);



})


router.use('/upload_db', chkRateMaster, async (req, res, next) => {

    if (req.method == 'POST') {
        const getDbList = req.body.dblist_text.split('\r\n');
        var now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

        var formName = req.body.set_estate
        if (req.body.set_estate_memo) {
            var formName = formName + ' ' + req.body.set_estate_memo;
        }

        for await (const getDb of getDbList) {
            const spliceDb = getDb.split(',');
            const insertDbSql = `INSERT INTO application_form (af_form_name, af_form_type_in, af_form_location, af_mb_name, af_mb_phone, af_mb_status, af_created_at) VALUES (?,?,?,?,?,?,?)`;
            const insertDbArr = [formName, '분양', req.body.set_marketer, spliceDb[0], spliceDb[1], '', now]
            await sql_con.promise().query(insertDbSql, insertDbArr)
        }
    }

    const getFormStatusSql = `SELECT * FROM form_status WHERE fs_id=1`;
    const getFormStatus = await sql_con.promise().query(getFormStatusSql)
    const getForm = getFormStatus[0][0];
    // const estate_list = getForm.fs_estate_list.split(',');

    const getSiteListSql = "SELECT * FROM site_list";
    const getSiteListResult = await sql_con.promise().query(getSiteListSql)
    const estate_list = [];
    for (const getSiteListFor of getSiteListResult[0]) {
        estate_list.push(getSiteListFor.sl_site_name)
    }
    const marketer_list = getForm.fs_marketer_list.split(',');
    // const marketer_list = "";


    res.render('crm/upload_db', { estate_list, marketer_list })
})

router.use('/testdb_set', async (req, res, next) => {
    if (req.method == 'POST') {
        var now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        testSql = `INSERT INTO application_form (af_mb_name, af_mb_phone, af_mb_status, af_form_name, af_form_type_in, af_created_at) VALUES (?,?,?,?,?,?)`;
        testValList = [req.body.af_mb_name, req.body.af_mb_phone, '접수완료', '강남현대삼성', '분양', now]
        await sql_con.promise().query(testSql, testValList)
    }
    res.render('crm/testdb', {});
})


router.get('/wh_datas', async (req, res, next) => {
    try {
        let allSearchSql = `SELECT * FROM audit_webhook ORDER BY aw_id DESC;`;
        let alldatas = await sql_con.promise().query(allSearchSql)
        let alldata = alldatas[0]
        res.render('crm/wh_alldata', { alldata });
    } catch (error) {
        next(error)
    }
})


router.get('/all_data', chkRateMaster, async (req, res, next) => {
    try {
        let allSearchSql = `SELECT * FROM webhookdatas ORDER BY wh_id DESC;`;
        let alldatas = await sql_con.promise().query(allSearchSql)
        let alldata = alldatas[0]
        res.render('crm/work_alldata', { alldata });
    } catch (error) {
        next(error)
    }
})


router.post('/estate_work/update', chkRateMaster, async (req, res, next) => {
    const set_db_list = req.body['set_db_list[]'];
    const getStatusSql = `SELECT * FROM form_status WHERE fs_id=1;`;
    const getStatusText = await sql_con.promise().query(getStatusSql)
    const estate_status_list = getStatusText[0][0].fs_estate_status.split(',')
    const estate_status = estate_status_list[0];
    if (typeof (set_db_list) == 'string') {
        let updateSql = `UPDATE application_form SET af_mb_status = '${estate_status}' WHERE af_id=${set_db_list}`;
        await sql_con.promise().query(updateSql)
    } else {
        for await (const on_db_id of set_db_list) {
            let updateSql = `UPDATE application_form SET af_mb_status = '${estate_status}' WHERE af_id=${on_db_id}`;
            await sql_con.promise().query(updateSql)
        }
    }

    res.send(200);
})


router.post('/estate_work/delete', chkRateMaster, async (req, res, next) => {
    var delArr = [req.body.set_db_list]
    for await (const delOn of delArr[0]) {
        const delSql = `DELETE FROM application_form WHERE af_id = ?`;
        await sql_con.promise().query(delSql, [delOn])
    }
    res.send(200);
})

router.use('/estate_detail/:id', async (req, res, next) => {

    if (req.user.rate == 5) {
        var LoadInfoSql = `SELECT * FROM application_form as a LEFT JOIN memos as m ON a.af_mb_phone = m.mo_phone WHERE a.af_id = ? ORDER BY m.mo_id DESC`;
    } else {
        var LoadInfoSql = `SELECT * FROM application_form as a LEFT JOIN memos as m ON a.af_id = m.mo_depend_id WHERE a.af_id = ? ORDER BY m.mo_id DESC`;
    }



    var LoadInfoTemp = await sql_con.promise().query(LoadInfoSql, [req.params.id])
    var load_info = LoadInfoTemp[0];

    var now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');


    if (req.method == 'POST') {
        if (req.body.add_memo) {
            const addMemoSql = `INSERT INTO memos (mo_depend_id, mo_estate, mo_phone, mo_manager, mo_memo, mo_created_at) VALUES (?,?,?,?,?,?)`;
            const addMemoArr = [load_info[0].af_id, load_info[0].af_form_name, load_info[0].af_mb_phone, req.user.nick, req.body.write_memo, now];

            await sql_con.promise().query(addMemoSql, addMemoArr)
        } else if (req.body.change_status) {
            const updateStatusSql = `UPDATE application_form SET af_mb_status = ? WHERE af_id = ?`;
            await sql_con.promise().query(updateStatusSql, [req.body.write_memo, req.params.id])
        }

    }

    const getStatusSql = `SELECT * FROM form_status WHERE fs_id=1;`;
    const getStatusText = await sql_con.promise().query(getStatusSql)

    const estate_status_list = getStatusText[0][0].fs_estate_status.split(',')

    res.render('crm/work_estate_detail', { load_info, estate_status_list });
})





router.use('/modify', chkRateManager, async (req, res, next) => {
    const userInfo = req.user
    var { user_nick, user_pwd, user_email } = req.body;
    if (req.method == 'POST') {
        const re_nick = user_nick ? user_nick : userInfo.nick
        if (user_pwd) {
            var re_pwd = await bcrypt.hash(user_pwd, 12);
        } else {
            var re_pwd = userInfo.password
        }
        const re_email = user_email ? user_email : userInfo.user_email
        const userUpdateSql = `UPDATE users SET nick = ?, password = ?, user_email = ? WHERE id = ?`;
        await sql_con.promise().query(userUpdateSql, [re_nick, re_pwd, re_email, userInfo.id])
        res.redirect('/crm/modify')
        return
    }

    res.render('crm/crm_modify', { userInfo })
})

// chkRateMaster
router.use('/estate_work', chkRateMaster, async (req, res, next) => {
    try {

        var pageCount = req.query.sc ? parseInt(req.query.sc) : 30;

        var dateOn = new Date();
        var mDays = dateOn.getDate() - 1;
        var startDay = req.query.sd ? req.query.sd : moment(Date.now()).subtract(mDays, 'days').format('YYYY-MM-DD');
        var endDay = req.query.ed ? req.query.ed : moment(Date.now()).format('YYYY-MM-DD');
        var endDayRe = moment(endDay).add(1, 'day').format('YYYY-MM-DD');


        var sdCountQ = `WHERE af_created_at > '${startDay}' AND af_created_at < '${endDayRe}'`;
        var sdSearchQ = `AND a.af_created_at > '${startDay}' AND a.af_created_at < '${endDayRe}'`;

        // 0614 검색 방식 변경
        // var getEst = req.query.est ? `AND af_form_name LIKE '%${req.query.est}%'` : '';
        var getEst = req.query.est ? `AND af_form_name = '${req.query.est}'` : '';
        var getStatus = req.query.status ? `AND af_mb_status = '${req.query.status}'` : '';

        const allCountSql = `SELECT COUNT(DISTINCT af_mb_phone) FROM application_form  ${sdCountQ} ${getEst} ${getStatus};`;
        // WHERE af_form_type_in='분양'

        const allCountQuery = await sql_con.promise().query(allCountSql)
        const allCount = Object.values(allCountQuery[0][0])[0]

        // var setDbSql = `SELECT * FROM application_form as a LEFT JOIN (SELECT * FROM memos WHERE mo_id IN (SELECT max(mo_id) FROM memos GROUP BY mo_phone)) as m ON a.af_mb_phone = m.mo_phone WHERE a.af_form_type_in = '분양' AND a.af_id IN(SELECT max(af_id) FROM application_form GROUP BY af_mb_phone) ${sdSearchQ} ${getEst} ${getStatus} ORDER BY a.af_id DESC`
        var setDbSql = `SELECT * FROM application_form as a LEFT JOIN (SELECT * FROM memos WHERE mo_id IN (SELECT max(mo_id) FROM memos GROUP BY mo_phone)) as m ON a.af_mb_phone = m.mo_phone WHERE a.af_id IN(SELECT max(af_id) FROM application_form GROUP BY af_mb_phone) ${sdSearchQ} ${getEst} ${getStatus} ORDER BY a.af_id DESC`

        // AND af_form_type_in='분양'

        const all_data = await getDbData(allCount, setDbSql, req.query.pnum, pageCount)

        const getSiteListSql = "SELECT * FROM site_list";
        const getSiteListResult = await sql_con.promise().query(getSiteListSql)
        const siteList = [];
        for (const getSiteListFor of getSiteListResult[0]) {
            siteList.push(getSiteListFor.sl_site_name)
        }

        for (let i = 0; i < all_data.wdata.length; i++) {
            const timeStr = moment(all_data.wdata[i]['af_created_at']).format('YYYY-MM-DD HH:mm:ss');
            all_data.wdata[i]['time_str'] = timeStr;
        }



        all_data.estate_list = siteList;
        all_data.est = req.query.est
        all_data.status = req.query.status
        all_data.sc = req.query.sc
        all_data.sd = startDay
        all_data.ed = endDay
        add_query = req.url;



        res.render('crm/work_estate', { all_data, add_query });
    } catch (error) {
        console.error(error);
        res.render('crm/work_estate', {});
    }

})

router.use('/estate_work_list_filter', async (req, res, next) => {
    let status = true;
    const filterValue = req.body.filterValue;
    let site_list = [];
    try {
        const getFilterEstateListQuery = `SELECT sl_site_name FROM site_list WHERE sl_site_name LIKE '%${filterValue}%'`
        const getFilterEstateList = await sql_con.promise().query(getFilterEstateListQuery)
        const siteList = getFilterEstateList[0]
        for (let i = 0; i < siteList.length; i++) {
            site_list.push(siteList[i]['sl_site_name'])
        }
    } catch (error) {
        console.error(error.message);
    }
    res.json({ status, site_list })
})






router.use('/estate_manager', chkRateManager, async (req, res, next) => {

    try {
        if (req.user.rate < 5) {
            const getUserEstateSql = `SELECT * FROM users WHERE id= ?;`;
            const getUserEstateTemp = await sql_con.promise().query(getUserEstateSql, [req.user.id]);

            // 여기서 null 에러 난다 체크 한번 하자!!!
            var getUserEstateList = getUserEstateTemp[0][0].manage_estate.split(',');
        } else if (req.user.rate == 5) {
            // const getUserEstateSql = `SELECT * FROM form_status WHERE fs_id= 1;`;
            // const getUserEstateTemp = await sql_con.promise().query(getUserEstateSql);
            // var getUserEstateList = getUserEstateTemp[0][0].fs_estate_list.split(',');

            const getSiteListSql = "SELECT * FROM site_list";
            const getSiteListResult = await sql_con.promise().query(getSiteListSql)
            var getUserEstateList = [];
            for (const getSiteListFor of getSiteListResult[0]) {
                getUserEstateList.push(getSiteListFor.sl_site_name)
            }
        }

        if (req.query.sc) {
            var pageCount = parseInt(req.query.sc);
        } else {
            var pageCount = 30;
        }

        var startDay = req.query.sd ? req.query.sd : "";
        var endDay = req.query.ed ? req.query.ed : moment(Date.now()).format('YYYY-MM-DD');
        var endDayRe = moment(endDay).add(1, 'day').format('YYYY-MM-DD');

        if (startDay && endDay) {
            var sdCountQ = `WHERE af_created_at > '${startDay}' AND af_created_at < '${endDayRe}'`;
            var sdSearchQ = `WHERE a.af_created_at > '${startDay}' AND a.af_created_at < '${endDayRe}'`;
        } else {
            var sdCountQ = ``;
            var sdSearchQ = ``;
        }

        var getEst = '';


        if (req.user.rate == 5) {
            if (req.query.est && !startDay) {
                // 0614 검색 방식 변경
                // var getEst = `WHERE af_form_name LIKE '%${req.query.est}%'`;
                var getEst = `WHERE af_form_name = '${req.query.est}'`;
            } else if (req.query.est && startDay) {
                // 0614 검색 방식 변경
                // var getEst = `AND af_form_name LIKE '%${req.query.est}%'`;
                var getEst = `AND af_form_name = '${req.query.est}'`;
            } else {
                var getEst = "";
            }
        } else {
            // 절대 지우면 안됨!! 각 현장 담당자별로 해당 DB만 확인 가능하게 하는 추가 쿼리문!!
            if (getUserEstateList[0]) {
                for (let i = 0; i < getUserEstateList.length; i++) {
                    if (i == 0) {
                        var setJull = 'WHERE'
                        // 0614 검색 방식 변경
                        // getEst = `${setJull} af_form_name LIKE '%${getUserEstateList[i]}%'`;
                        getEst = `${setJull} af_form_name = '${getUserEstateList[i]}'`;
                    } else {
                        var setJull = 'OR'
                        // 0614 검색 방식 변경
                        // getEst = `${getEst} ${setJull} af_form_name LIKE '%${getUserEstateList[i]}%'`;
                        getEst = `${getEst} ${setJull} af_form_name = '${getUserEstateList[i]}'`;
                    }
                }
            } else {
                res.redirect('/')
                return
            }
        }

        if (req.query.status) {
            if (getEst || startDay) {
                var getStatus = `AND af_mb_status = '${req.query.status}'`;
            } else {
                var getStatus = `WHERE af_mb_status = '${req.query.status}'`;
            }
        } else {
            var getStatus = '';
        }

        if (req.query.nm) {
            if (getEst || startDay || getStatus) {
                // 0614 검색 방식 변경
                // var getName = `AND af_mb_name LIKE '%${req.query.nm}%'`;
                var getName = `AND af_mb_name = '${req.query.nm}'`;
            } else {
                // 0614 검색 방식 변경
                // var getName = `WHERE af_mb_name LIKE '%${req.query.nm}%'`;
                var getName = `WHERE af_mb_name = '${req.query.nm}'`;
            }
        } else {
            var getName = '';
        }

        if (req.query.ph) {
            if (getEst || startDay || getStatus || getName) {
                // 0614 검색 방식 변경
                // var getPhone = `AND af_mb_phone LIKE '%${req.query.ph}%'`;
                var getPhone = `AND af_mb_phone = '${req.query.ph}'`;
            } else {
                // 0614 검색 방식 변경
                // var getPhone = `WHERE af_mb_phone LIKE '%${req.query.ph}%'`;
                var getPhone = `WHERE af_mb_phone = '${req.query.ph}'`;
            }
        } else {
            var getPhone = '';
        }

        // const allCountSql = `SELECT COUNT(DISTINCT af_mb_phone) FROM application_form WHERE af_form_type_in='분양' ${getEst} ${getStatus};`;
        // const allCountSql = `SELECT COUNT(*) FROM application_form WHERE af_form_type_in='분양' ${getEst} ${getStatus};`;
        const allCountSql = `SELECT COUNT(*) FROM application_form ${sdCountQ} ${getEst} ${getStatus} ${getName} ${getPhone};`;
        const allCountQuery = await sql_con.promise().query(allCountSql)
        const allCount = Object.values(allCountQuery[0][0])[0]

        if (req.user.rate < 5) {
            if (req.query.est) {
                var getEst = `WHERE a.af_form_name LIKE '%${req.query.est}%'`;
            } else {
                for (let i = 0; i < getUserEstateList.length; i++) {
                    if (i == 0) {
                        var setJull = 'WHERE'
                        getEst = `${setJull} a.af_form_name LIKE '%${getUserEstateList[i]}%'`;
                    } else {
                        var setJull = 'OR'
                        getEst = `${getEst} ${setJull} a.af_form_name LIKE '%${getUserEstateList[i]}%'`;
                    }
                }
            }
        }
        // var setDbSql = `SELECT * FROM application_form as a LEFT JOIN (SELECT * FROM memos WHERE mo_id IN (SELECT max(mo_id) FROM memos GROUP BY mo_phone)) as m ON a.af_id = m.mo_depend_id WHERE a.af_form_type_in = '분양' AND a.af_id IN(SELECT max(af_id) FROM application_form GROUP BY af_mb_phone) ${getEst} ${getStatus} ORDER BY a.af_id DESC`;

        // var setDbSql = `SELECT * FROM application_form as a LEFT JOIN (SELECT * FROM memos WHERE mo_id IN (SELECT max(mo_id) FROM memos GROUP BY mo_phone)) as m ON a.af_id = m.mo_depend_id WHERE a.af_form_type_in = '분양' ${getEst} ${getStatus} ORDER BY a.af_id DESC`;

        // var setDbSql = `SELECT * FROM application_form as a LEFT JOIN memos as m ON a.af_id = m.mo_depend_id ${getEst} ${getStatus} ORDER BY a.af_id DESC`;

        var setDbSql = `SELECT * FROM application_form as a LEFT JOIN (SELECT * FROM memos WHERE mo_id IN (SELECT max(mo_id) FROM memos GROUP BY mo_phone)) as m ON a.af_id = m.mo_depend_id ${sdSearchQ}  ${getEst} ${getStatus} ${getName} ${getPhone} ORDER BY a.af_id DESC`;

        var all_data = await getDbData(allCount, setDbSql, req.query.pnum, pageCount, getUserEstateList)
        
        for await (const data of all_data.wdata) {
            const addMemoSql = `SELECT * FROM memos WHERE mo_depend_id = ? ORDER BY mo_created_at DESC LIMIT 3;`
            const addMemo = await sql_con.promise().query(addMemoSql, [data.af_id])
            if (addMemo[0][0]) {
                data['main_memo'] = []
                for (let i = 0; i < addMemo[0].length; i++) {
                    data['main_memo'].push(addMemo[0][i].mo_memo)
                }
            }

            // const timeStr = moment(data.af_created_at).format('YYYY-MM-DD HH:mm:ss');
            // all_data.wdata[idx]['time_str'] = timeStr;
        }

        for (let i = 0; i < all_data.wdata.length; i++) {
            const timeStr = moment(all_data.wdata[i]['af_created_at']).format('YYYY-MM-DD HH:mm:ss');
            all_data.wdata[i]['time_str'] = timeStr;
        }

        all_data.estate_list = getUserEstateList;
        all_data.est = req.query.est
        all_data.status = req.query.status
        all_data.sc = req.query.sc
        all_data.sd = req.query.sd
        all_data.ed = endDay
        all_data.nm = req.query.nm
        all_data.ph = req.query.ph
    } catch (error) {
        console.error(error);
        all_data = []
    }






    res.render('crm/work_estate_manager', { all_data });
})









router.post('/memo_manage', async (req, res, next) => {
    if (req.body.memo_val) {

        let nowTime = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        const memoArr = [req.body.id_val, req.body.estate_val, req.body.ph_val, req.user.nick, req.body.memo_val, nowTime];
        const memoInsertSql = `INSERT INTO memos (mo_depend_id, mo_estate, mo_phone, mo_manager, mo_memo, mo_created_at) VALUES (?,?,?,?,?,?);`;
        await sql_con.promise().query(memoInsertSql, memoArr);
        res.send(200)
    } else if (req.body.load_memo) {
        const memoLoadSql = `SELECT * FROM memos WHERE mo_depend_id = ? ORDER BY mo_id DESC`;
        const memoLoadTemp = await sql_con.promise().query(memoLoadSql, [req.body.id_val]);
        const memoLoad = memoLoadTemp[0]
        res.send(memoLoad)
    }
})

router.post('/use_axios', async (req, res, next) => {

    var now = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

    if (req.body.statusSelVal) {
        const updateStatusSql = `UPDATE application_form SET af_mb_status = ? WHERE af_id = ?`;
        await sql_con.promise().query(updateStatusSql, [req.body.statusSelVal, req.body.idVal]);
    } else if (req.body.siteVal) {
        const insertSiteSql = `INSERT INTO site_list (sl_site_name, sl_site_link, sl_created_at) VALUES (?,?,?);`;
        await sql_con.promise().query(insertSiteSql, [req.body.siteVal, req.body.siteLinkVal, now]);
    } else if (req.body.btnVal) {

        if (req.body.btnVal == "site_update") {
            for (let i = 0; i < req.body.siteUpdateList.length; i++) {
                const updateStatusSql = `UPDATE site_list SET sl_site_name = ?, sl_site_link = ? WHERE sl_id = ?`;
                await sql_con.promise().query(updateStatusSql, [req.body.siteNameList[i], req.body.siteLinkList[i], req.body.siteUpdateList[i]]);
            }
        } else {
            for (let i = 0; i < req.body.siteUpdateList.length; i++) {
                const deleteStatusSql = `DELETE FROM site_list WHERE sl_id = ?`;
                await sql_con.promise().query(deleteStatusSql, [req.body.siteUpdateList[i]]);
            }
        }
    }


    res.send(200)
})


router.use('/test_axios', async (req, res, next) => {
    const setSql = `SELECT * FROM application_form`
    res.send('니미 개 병신같은 엑시오스 씹새끼가')
})




router.use('/', chkRateMaster, async (req, res, next) => {
    if (req.method == 'POST') {
        // 검증
        const chkSql = `SELECT * FROM form_status WHERE fs_id=1;`;
        const chkData = await sql_con.promise().query(chkSql)
        if (chkData[0] == '') {
            const marketerList = 'FB,' + req.body.marketer_list
            let insertArr = [req.body.estate_status, req.body.estate_status_color, marketerList, req.body.fs_personal_officer, req.body.fs_callnumber, req.body.fs_owner, req.body.fs_address, req.body.fs_business_num, req.body.fs_email, req.body.fs_report_number, req.body.fs_company];
            let insertSql = `INSERT INTO form_status (fs_estate_status,fs_estate_status_color, fs_marketer_list, fs_personal_officer,fs_callnumber,fs_owner,fs_address,fs_business_num,fs_email,fs_report_number,fs_company) VALUES (?,?,?,?,?,?,?,?,?,?,?);`;
            await sql_con.promise().query(insertSql, insertArr);
        } else {
            const marketerList = 'FB,' + req.body.marketer_list
            let updatetArr = [req.body.estate_status, req.body.estate_status_color, marketerList, req.body.fs_personal_officer, req.body.fs_callnumber, req.body.fs_owner, req.body.fs_address, req.body.fs_business_num, req.body.fs_email, req.body.fs_report_number, req.body.fs_company];
            let updateSql = `UPDATE form_status SET fs_estate_status=?,fs_estate_status_color=?, fs_marketer_list=?, fs_personal_officer=?,fs_callnumber=?,fs_owner=?,fs_address=?,fs_business_num=?,fs_email=?,fs_report_number=?,fs_company=? WHERE fs_id=1`;
            await sql_con.promise().query(updateSql, updatetArr);
        }
    }
    const resultSql = `SELECT * FROM form_status WHERE fs_id=1;`;
    const resultData = await sql_con.promise().query(resultSql)
    const result = resultData[0][0];

    const siteListSql = `SELECT * FROM site_list`;
    const siteListData = await sql_con.promise().query(siteListSql)
    const site_list = siteListData[0];

    if (result.fs_marketer_list) {
        result.fs_marketer_list = result.fs_marketer_list.replace('FB,', '')
    }

    res.render('crm/crm_main', { result, site_list });
})







function phNumBar(value) {
    value = value.replace(/[^0-9]/g, "");
    return value.replace(
        /(^02.{0}|^01.{1}|[0-9]{3})([0-9]+)([0-9]{4})/,
        "$1-$2-$3"
    );
}





module.exports = router;