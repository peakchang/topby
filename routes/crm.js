const express = require('express');
const { isLoggedIn, isNotLoggedIn, chkRateManager } = require('./middlewares');
const sql_con = require('../db_lib');
const { executeQuery } = require('../db_lib/dbset.js');
const bcrypt = require('bcrypt');
const router = express.Router();

const { setDbData } = require('../db_lib/back_lib.js');


router.use((req, res, next) => {
    res.locals.user = req.user;
    next();
});

router.get('/all_data', async (req, res, next) => {
    let allSearchSql = `SELECT * FROM webhookdatas ORDER BY id DESC;`;
    let alldatas = await sql_con.promise().query(allSearchSql)
    let alldata = alldatas[0]
    console.log(alldata);
    res.render('crm/work_alldata', { alldata });
})


router.post('/estate_work/delete', async (req, res, next) => {
    const set_db_list = req.body.set_db_list;
    const getStatusSql = `SELECT * FROM form_status WHERE fs_id=1;`;
    const getStatusText = await sql_con.promise().query(getStatusSql)
    const estate_status_list = getStatusText[0][0].estate_status.split(',')
    const estate_status = estate_status_list[1];

    for await (const on_db_id of set_db_list) {
        console.log(on_db_id);
        let updateSql = `UPDATE application_form SET mb_status = '${estate_status}' WHERE af_id=${on_db_id}`;
        await sql_con.promise().query(updateSql)
    }
    res.send(200);
})

router.use('/estate_work/detail/:id', async (req, res, next) => {
    if(req.method == 'POST'){
        console.log(req.params.id);
    }
    
    const LoadInfoSql = `SELECT * FROM application_form as a LEFT JOIN memos as m ON a.mb_phone = m.mo_phone WHERE a.af_id = ?`;
    const LoadInfoTemp = await sql_con.promise().query(LoadInfoSql, [req.params.id])
    const load_info = LoadInfoTemp[0];


    const getStatusSql = `SELECT * FROM form_status WHERE fs_id=1;`;
    const getStatusText = await sql_con.promise().query(getStatusSql)
    const estate_status_list = getStatusText[0][0].estate_status.split(',')
    res.render('crm/work_estate_detail', { load_info , estate_status_list});
})



router.use('/estate_work', async (req, res, next) => {

    // 1이면 0부터 / 2 이면 15부터 / 3이면 30부터
    // 옵션값 구하기
    const getStatusSql = `SELECT * FROM form_status WHERE fs_id=1;`;
    const getStatusText = await sql_con.promise().query(getStatusSql)

    // console.log(all_data.estate_list);

    const all_data = await setDbData(req.query.pnum, req.query.est)
    all_data.estate_list = getStatusText[0][0].estate_list.split(',');

    res.render('crm/work_estate', { all_data });
})


router.use('/estate_manager', chkRateManager, async (req, res, next) => {

    const getUserEstateSql = `SELECT * FROM users WHERE id= ?;`;
    const getUserEstateTemp = await sql_con.promise().query(getUserEstateSql, [req.user.id])
    const getUserEstateList = getUserEstateTemp[0][0].manage_estate.split(',');

    const all_data = await setDbData(req.query.pnum, req.query.est, getUserEstateList)
    all_data.estate_list = getUserEstateList;

    const testSql = `SELECT * FROM users JOIN memos ON users.mo_phone = memos.mb_phone;`;
    // SELECT * FROM application_form LEFT JOIN memos ON application_form.mb_phone = memos.mo_phone GROUP BY application_form.mb_phone;
    console.log(testSql);
    res.render('crm/work_estate_manager', { all_data });
})


router.get('/user_manage', async (req, res, next) => {
    const masterLoadSql = `SELECT * FROM users WHERE rate = 5;`;
    const masterLoadTemp = await sql_con.promise().query(masterLoadSql);
    const master_load = masterLoadTemp[0];

    const userLoadSql = `SELECT * FROM users WHERE rate < 5;`;
    const userListTemp = await sql_con.promise().query(userLoadSql);
    const user_list = userListTemp[0];

    const locationListSql = `SELECT estate_list FROM form_status WHERE fs_id = 1;`;
    const locationListTemp = await sql_con.promise().query(locationListSql);
    const location_list = locationListTemp[0][0].estate_list.split(',')
    console.log(location_list);

    res.render('crm/user_manage', { master_load, user_list, location_list });
})

router.post('/user_manage', async (req, res, next) => {
    console.log(req.body);
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
    }
    res.send(200)
})


router.post('/memo_manage', async (req, res, next) => {
    if (req.body.memo_val) {
        const memoArr = [req.body.ph_val, req.user.nick, req.body.memo_val];
        const memoInsertSql = `INSERT INTO memos (mo_phone, mo_manager, mo_memo) VALUES (?,?,?);`;
        await sql_con.promise().query(memoInsertSql, memoArr);
        res.send(200)
    }else if(req.body.load_memo){
        console.log(req.body.ph_val);
        const memoLoadSql = `SELECT * FROM memos WHERE mo_phone = ? ORDER BY mo_id DESC`;
        const memoLoadTemp = await sql_con.promise().query(memoLoadSql, [req.body.ph_val]);
        const memoLoad = memoLoadTemp[0]
        res.send(memoLoad)

    }

    
})


router.use('/test_axios', async(req, res, next) => {

    res.send('니미 개 병신같은 엑시오스 씹새끼가')
})



router.use('/', async (req, res, next) => {
    if (req.method == 'POST') {
        // 검증
        const chkSql = `SELECT * FROM form_status WHERE id=1;`;
        const chkData = await sql_con.promise().query(chkSql)
        if (chkData[0] == '') {
            let insertArr = [req.body.estate_status, req.body.estate_list];
            let insertSql = `INSERT INTO form_status (estate_status, estate_list) VALUES (?, ?);`;
            await sql_con.promise().query(insertSql, insertArr);
        } else {
            let updatetArr = [req.body.estate_status, req.body.estate_list];
            let updateSql = `UPDATE form_status SET estate_status=?, estate_list=? WHERE id=1`;
            await sql_con.promise().query(updateSql, updatetArr);
        }
    }
    const resultSql = `SELECT * FROM form_status WHERE fs_id=1;`;
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