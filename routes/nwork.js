const express = require('express');
const router = express.Router();
const nsql_con = require('../db_lib/sub_db');

const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

router.use('/ajax_work', async (req, res, next) => {
    if (req.body.checkedAllList) {
        console.log(req.body.checkedAllList);
        var sendList = []
        for await (const sqlid of req.body.checkedAllList) {
            var getListSql = `SELECT * FROM nwork WHERE n_idx = ?`;
            var getList = await nsql_con.promise().query(getListSql, [sqlid]);
            sendList.push(getList[0][0])
        }
        res.send(sendList)
    }
})


router.use('/getnid', async (req, res, next) => {
    const getNidCountSql = `SELECT COUNT(*) FROM nwork WHERE n_update IS NULL OR n_update < CURDATE() - INTERVAL 3 DAY AND n_status IS NULL;`
    const getNidCount = await nsql_con.promise().query(getNidCountSql);
    const get_nid_count = getNidCount[0][0]['COUNT(*)'];
    const getRanVal = Math.floor((Math.random() * (get_nid_count)) + 1)
    var getIdSql = `SELECT n_ua,n_id,n_pwd FROM nwork WHERE n_idx = ?`;
    var getId = await nsql_con.promise().query(getIdSql, [getRanVal]);
    var getIdPwd = getId[0][0];

    res.json(getIdPwd)
})


router.use('/getnidmain', async (req, res, next) => {
    const getIdPwd = { n_ua: '1', n_id: 'changyong112', n_pwd: 'rkwkrh1e@e' }

    res.json(getIdPwd)
})

router.use('/gethook', async (req, res, next) => {
    if (req.body.errchk == 'ok' || req.query.errchk == 'ok') {
        if (req.body.n_id) {
            var getId = req.body.n_id;
        }else{
            var getId = req.query.n_id;
        }
        
        var now = moment(Date.now()).format('YYYY-MM-DD');
        const updateSql = `UPDATE nwork SET n_update = ? WHERE n_id = ?;`;
        await nsql_con.promise().query(updateSql, [now, getId]);
    } else {
        if (req.body.n_id) {
            var getId = req.body.n_id;
            var errchk = req.body.errchk;
        } else {
            var getId = req.query.n_id;
            var errchk = req.query.errchk;
        }

        const updateSql = `UPDATE nwork SET n_status = ? WHERE n_id = ?;`;
        await nsql_con.promise().query(updateSql, [errchk, getId]);
    }

    res.send(200)
})


router.use('/', async (req, res, next) => {

    // var now = moment(Date.now()).add(-3, 'days').format('YYYY-MM-DD');
    // var now = moment(Date.now()).subtract(7, 'days').format('YYYY-MM-DD');
    
    // console.log(now);


    if (req.method == 'POST') {
        console.log('포스트 여기 아니야?!?!?!?!??!');
        if (req.body.btn_val == 'add_id') {
            const idArr = req.body.id_list.split('\r\n');
            var errCount = 0
            for await (const idLine of idArr) {
                console.log(idLine);
                var idLineArr = idLine.split(',')
                while (idLineArr.length < 5) {
                    idLineArr.push('')
                }
                console.log(idLineArr);
                if (idLineArr[0]) {
                    try {
                        var idInsertSql = `INSERT INTO nwork (n_ua, n_id, n_pwd, n_info, n_profile) VALUES (?,?,?,?,?);`;
                        await nsql_con.promise().query(idInsertSql, idLineArr);
                    } catch (error) {
                        errCount = errCount + 1
                    }
                }
            }
        }else if(req.body.btn_val == 'update'){
            console.log(req.body);
            
            // if(typeof(req.body.chk_list) == 'string'){
            //     const getArrNum = Number(req.body.chk_list);

            //     var getDate = req.body.n_update[getArrNum]
            //     if(getDate == ''){
            //         var setDate = null
            //     }else{
            //         var setDate = moment(getDate, "YY-MM-DD").format("YY-MM-DD")
            //         // var setDate = getDate
            //     }

            //     console.log(setDate);

            //     const updateSqlValList = [req.body.n_pwd[getArrNum],req.body.n_status[getArrNum],req.body.n_temp1[getArrNum],req.body.n_temp2[getArrNum],req.body.n_info[getArrNum],req.body.n_profile[getArrNum],req.body.n_idx[getArrNum]]
            //     const updateIdListSql = `UPDATE nwork SET n_pwd=?, n_update='${setDate}', n_status=?, n_temp1=?, n_temp2=?, n_info=?, n_profile=? WHERE n_idx = ?`;

            //     console.log(updateIdListSql);
            //     await nsql_con.promise().query(updateIdListSql, updateSqlValList);
            //     console.log(getArrNum);
            // }
        }

    }
    const getAllIdSql = 'SELECT * FROM nwork';
    const getAllIdList = await nsql_con.promise().query(getAllIdSql);
    const get_all_id_list = getAllIdList[0]

    res.render('nwork', { get_all_id_list, errCount })
})


module.exports = router;