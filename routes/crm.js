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

const { setDbData, getDbData, getExLength } = require('../db_lib/back_lib.js');

const moment = require('moment');
const { Logform } = require('winston');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

router.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

// const uploadEx = multer({
//     storage: multer.diskStorage({
//         destination(req, file, cb) {
//             cb(null, 'uploads/');
//         },
//         filename(req, file, cb) {
//             const ext = path.extname(file.originalname); // 확장자 뽑기
//             console.log(file.originalname);
//             console.log(ext);
//             cb(null, file.originalname);
//         },
//     }),
//     limits: { fileSize: 5 * 1024 * 1024 },
// });

// const uploadEx = multer({
//     storage: multer.memoryStorage(),
//     limits: { fileSize: 5 * 1024 * 1024 },
// });
// const excelFile = xlsx.readFile(`./uploads/${req.file.originalname}`);
// let worksheet = excelFile.Sheets["Sheet1"]
// const wsLength = getExLength(worksheet)
// console.log(wsLength);

// const upload = multer();



router.get('/down_db', chkRateMaster,async (req, res, next) => {
    var pathBasic = `${app_root_path}/public/temp/down.txt`;
    fs.writeFile(pathBasic, '', (err) => {});

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

    const downDbSql = `SELECT * FROM application_form ${addQuery} GROUP BY af_mb_phone ORDER BY af_id DESC`;
    const downDbList = await sql_con.promise().query(downDbSql)

    console.log(downDbSql);


    for (const downDb of downDbList[0]) {
        const db_name = downDb.af_mb_name
        const db_phone = downDb.af_mb_phone
        fs.appendFileSync(pathBasic, `${db_name},${db_phone}\n`, (err) => { })
    }
    
    var now = moment(Date.now()).format('YYYY-MM-DD');
    const downFileName = `${now}_file.txt`;
    res.setHeader('Content-Disposition', `attachment; filename=${downFileName}`); // 이게 핵심 
    res.sendFile(`${app_root_path}/public/temp/down.txt`);



})


router.use('/upload_db', chkRateMaster, async (req, res, next) => {
    console.log(__dirname);
    if (req.method == 'POST') {
        console.log()
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
    console.log(getForm);
    const estate_list = getForm.fs_estate_list.split(',');
    const marketer_list = getForm.fs_marketer_list.split(',');


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



router.get('/all_data', chkRateMaster, async (req, res, next) => {

    try {
        let allSearchSql = `SELECT * FROM webhookdatas ORDER BY wh_id DESC;`;
        let alldatas = await sql_con.promise().query(allSearchSql)
        let alldata = alldatas[0]
        console.log(alldata);
        res.render('crm/work_alldata', { alldata });
    } catch (error) {
        next(error)
    }


})


router.post('/estate_work/update', async (req, res, next) => {
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
            console.log(on_db_id);
            let updateSql = `UPDATE application_form SET af_mb_status = '${estate_status}' WHERE af_id=${on_db_id}`;
            await sql_con.promise().query(updateSql)
        }
    }

    res.send(200);
})


router.post('/estate_work/delete', async (req, res, next) => {
    var delArr = [req.body.set_db_list]
    for await (const delOn of delArr) {
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
        console.log(load_info);
        console.log(req.body.add_memo);
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





router.use('/modify', async (req, res, next) => {
    const userInfo = req.user
    var { user_nick, user_pwd, user_email } = req.body;
    if (req.method == 'POST') {
        console.log('포스트다~~~~~~~~~~~~~~~~~~~');
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


router.use('/estate_work', chkRateMaster, async (req, res, next) => {

    console.log('이것이 URL이란 말인가????' + req.url);

    const getStatusSql = `SELECT * FROM form_status WHERE fs_id=1;`;
    const getStatusText = await sql_con.promise().query(getStatusSql)

    var testVal = (1 == 21) ? '마장' : '아냥';


    var pageCount = req.query.sc ? parseInt(req.query.sc) : 30;
    var getEst = req.query.est ? `AND af_form_name LIKE '%${req.query.est}%'` : '';
    var getStatus = req.query.status ? `AND af_mb_status = '${req.query.status}'` : '';


    var dateOn = new Date();
    // var startDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
    console.log(dateOn);
    console.log(dateOn.getDate());

    var mDays = dateOn.getDate() - 1;
    var startDay = req.query.sd ? req.query.sd : moment(Date.now()).subtract(mDays, 'days').format('YYYY-MM-DD');
    var endDay = req.query.ed ? req.query.ed : moment(Date.now()).format('YYYY-MM-DD');
    var endDayRe = moment(endDay).add(1, 'day').format('YYYY-MM-DD');

    var sdCountQ = req.query.sd || req.query.ed ? `AND af_created_at > '${startDay}' AND af_created_at < '${endDayRe}'` : '';
    var sdSearchQ = req.query.sd || req.query.ed ? `AND a.af_created_at > '${startDay}' AND a.af_created_at < '${endDayRe}'` : '';

    const allCountSql = `SELECT COUNT(DISTINCT af_mb_phone) FROM application_form WHERE af_form_type_in='분양' ${sdCountQ} ${getEst} ${getStatus};`;

    console.log(allCountSql);
    const allCountQuery = await sql_con.promise().query(allCountSql)
    const allCount = Object.values(allCountQuery[0][0])[0]

    // var setDbSql = `SELECT * FROM application_form as a LEFT JOIN (SELECT * FROM memos WHERE mo_id IN (SELECT max(mo_id) FROM memos GROUP BY mo_phone)) as m ON a.af_mb_phone = m.mo_phone WHERE a.af_form_type_in = '분양' AND a.af_id IN(SELECT max(af_id) FROM application_form GROUP BY af_mb_phone) ${sdSearchQ} ${getEst} ${getStatus} ORDER BY a.af_id DESC`
    var setDbSql = `SELECT * FROM application_form as a LEFT JOIN (SELECT * FROM memos WHERE mo_id IN (SELECT max(mo_id) FROM memos GROUP BY mo_phone)) as m ON a.af_mb_phone = m.mo_phone WHERE a.af_id IN(SELECT max(af_id) FROM application_form GROUP BY af_mb_phone) AND af_form_type_in='분양' ${sdSearchQ} ${getEst} ${getStatus} ORDER BY a.af_id DESC`

    console.log(setDbSql);

    const all_data = await getDbData(allCount, setDbSql, req.query.pnum, pageCount)
    all_data.estate_list = getStatusText[0][0].fs_estate_list.split(',');
    all_data.est = req.query.est
    all_data.status = req.query.status
    all_data.sc = req.query.sc
    all_data.sd = startDay
    all_data.ed = endDay
    add_query = req.url;

    // console.log(all_data);
    res.render('crm/work_estate', { all_data, add_query });
})


router.use('/estate_manager', chkRateManager, async (req, res, next) => {


    if (req.user.rate < 5) {
        const getUserEstateSql = `SELECT * FROM users WHERE id= ?;`;
        const getUserEstateTemp = await sql_con.promise().query(getUserEstateSql, [req.user.id]);
        var getUserEstateList = getUserEstateTemp[0][0].manage_estate.split(',');
    } else if (req.user.rate == 5) {
        const getUserEstateSql = `SELECT * FROM form_status WHERE fs_id= 1;`;
        const getUserEstateTemp = await sql_con.promise().query(getUserEstateSql);
        var getUserEstateList = getUserEstateTemp[0][0].fs_estate_list.split(',');
    }


    if (req.query.sc) {
        var pageCount = parseInt(req.query.sc);
    } else {
        var pageCount = 30;
    }



    var getEst = '';

    console.log(req.user.rate);
    if (req.user.rate < 5) {
        if (req.query.est) {
            var getEst = `WHERE af_form_name LIKE '%${req.query.est}%'`;
        } else {
            for (let i = 0; i < getUserEstateList.length; i++) {
                if (i == 0) {
                    var setJull = 'WHERE'
                    getEst = `${setJull} af_form_name LIKE '%${getUserEstateList[i]}%'`;
                } else {
                    var setJull = 'OR'
                    getEst = `${getEst} ${setJull} af_form_name LIKE '%${getUserEstateList[i]}%'`;
                }
            }
        }
    }




    if (req.query.status) {
        if (getEst) {
            var getStatus = `AND af_mb_status = '${req.query.status}'`;
        } else {
            var getStatus = `WHERE af_mb_status = '${req.query.status}'`;
        }
    } else {
        var getStatus = '';
    }

    console.log('----------------------------');
    console.log(getEst);
    console.log(getStatus);

    // const allCountSql = `SELECT COUNT(DISTINCT af_mb_phone) FROM application_form WHERE af_form_type_in='분양' ${getEst} ${getStatus};`;
    // const allCountSql = `SELECT COUNT(*) FROM application_form WHERE af_form_type_in='분양' ${getEst} ${getStatus};`;
    const allCountSql = `SELECT COUNT(*) FROM application_form ${getEst} ${getStatus};`;
    const allCountQuery = await sql_con.promise().query(allCountSql)
    const allCount = Object.values(allCountQuery[0][0])[0]

    console.log(allCount);

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

    var setDbSql = `SELECT * FROM application_form as a LEFT JOIN memos as m ON a.af_id = m.mo_depend_id ${getEst} ${getStatus} ORDER BY a.af_id DESC`;

    console.log(setDbSql)

    const all_data = await getDbData(allCount, setDbSql, req.query.pnum, pageCount, getUserEstateList)
    all_data.estate_list = getUserEstateList;
    all_data.est = req.query.est
    all_data.status = req.query.status
    all_data.sc = req.query.sc

    res.render('crm/work_estate_manager', { all_data });
})


router.get('/user_manage', chkRateMaster, async (req, res, next) => {

    const masterLoadSql = `SELECT * FROM users WHERE rate = 5;`;
    const masterLoadTemp = await sql_con.promise().query(masterLoadSql);
    const master_load = masterLoadTemp[0];

    const userLoadSql = `SELECT * FROM users WHERE rate < 5;`;
    const userListTemp = await sql_con.promise().query(userLoadSql);
    const user_list = userListTemp[0];

    const locationListSql = `SELECT fs_estate_list FROM form_status WHERE fs_id = 1;`;
    const locationListTemp = await sql_con.promise().query(locationListSql);
    const location_list = locationListTemp[0][0].fs_estate_list.split(',')
    console.log(location_list);

    res.render('crm/user_manage', { master_load, user_list, location_list });
})

router.post('/user_manage', chkRateManager, async (req, res, next) => {
    if (req.body.pwd_val) {
        const hash = await bcrypt.hash(req.body.pwd_val, 12);
        const valArr = [hash, req.body.id_val]
        const pwdUpdateSql = `UPDATE users SET password = ? WHERE id = ?;`;
        await sql_con.promise().query(pwdUpdateSql, valArr);
    } else if (req.body.rate_val) {
        const valArr = [req.body.rate_val, req.body.id_val]
        const rateUpdateSql = `UPDATE users SET rate = ? WHERE id = ?;`;
        await sql_con.promise().query(rateUpdateSql, valArr);
    } else if (req.body.location_val) {
        console.log(req.body.location_val);
        const valArr = [req.body.location_val, req.body.id_val]
        const locationUpdateSql = `UPDATE users SET manage_estate = ? WHERE id = ?;`;
        console.log(locationUpdateSql);
        await sql_con.promise().query(locationUpdateSql, valArr);

    } else if (req.body.delval) {
        const valArr = [req.body.id_val]
        const locationDeleteSql = `UPDATE users SET manage_estate = '' WHERE id = ?;`;
        await sql_con.promise().query(locationDeleteSql, valArr);
    } else if (req.body.email_val){
        const valArr = [req.body.email_val, req.body.id_val]
        const emailUpdateSql = `UPDATE users SET user_email = ? WHERE id = ?;`;
        await sql_con.promise().query(emailUpdateSql, valArr);
    }
    res.send(200)
})


router.post('/memo_manage', async (req, res, next) => {
    if (req.body.memo_val) {
        console.log(req.body);
        let nowTime = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        const memoArr = [req.body.id_val, req.body.estate_val, req.body.ph_val, req.user.nick, req.body.memo_val, nowTime];
        const memoInsertSql = `INSERT INTO memos (mo_depend_id, mo_estate, mo_phone, mo_manager, mo_memo, mo_created_at) VALUES (?,?,?,?,?,?);`;
        await sql_con.promise().query(memoInsertSql, memoArr);
        res.send(200)
    } else if (req.body.load_memo) {
        console.log(req.body);
        const memoLoadSql = `SELECT * FROM memos WHERE mo_depend_id = ? ORDER BY mo_id DESC`;
        const memoLoadTemp = await sql_con.promise().query(memoLoadSql, [req.body.id_val]);
        const memoLoad = memoLoadTemp[0]
        res.send(memoLoad)
    }
})

router.post('/use_axios', async (req, res, next) => {
    console.log(req.body);

    const updateStatusSql = `UPDATE application_form SET af_mb_status = ? WHERE af_id = ?`;
    await sql_con.promise().query(updateStatusSql, [req.body.statusSelVal, req.body.idVal]);

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
            let insertArr = [req.body.estate_status, req.body.estate_status_color, req.body.estate_list, marketerList];
            let insertSql = `INSERT INTO form_status (fs_estate_status,fs_estate_status_color, fs_estate_list, fs_marketer_list) VALUES (?,?,?,?);`;
            await sql_con.promise().query(insertSql, insertArr);
        } else {
            const marketerList = 'FB,' + req.body.marketer_list
            let updatetArr = [req.body.estate_status, req.body.estate_status_color, req.body.estate_list, marketerList];
            let updateSql = `UPDATE form_status SET fs_estate_status=?,fs_estate_status_color=?, fs_estate_list=?, fs_marketer_list=? WHERE fs_id=1`;
            await sql_con.promise().query(updateSql, updatetArr);
        }
    }
    const resultSql = `SELECT * FROM form_status WHERE fs_id=1;`;
    const resultData = await sql_con.promise().query(resultSql)
    const result = resultData[0][0];

    if (result.fs_marketer_list) {
        result.fs_marketer_list = result.fs_marketer_list.replace('FB,', '')
    }

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