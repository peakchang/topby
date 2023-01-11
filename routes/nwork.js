const express = require('express');
const router = express.Router();
const nsql_con = require('../db_lib/sub_db');

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
    const getNidCountSql = `SELECT COUNT(*) FROM nwork WHERE n_update IS NULL OR n_update > CURDATE() - INTERVAL 3 DAY;`
    const getNidCount = await nsql_con.promise().query(getNidCountSql);
    const get_nid_count = getNidCount[0][0]['COUNT(*)'] - 1;
    const getRanVal = Math.floor(( Math.random() * ( get_nid_count - 1 )  ) + 1)

    var getIdSql = `SELECT n_ua,n_id,n_pwd FROM nwork WHERE n_idx = ?`;
    var getId = await nsql_con.promise().query(getIdSql, [getRanVal]);
    var getIdPwd = getId[0][0];
    
    res.json(getIdPwd)
})


router.use('/getnidmain', async (req, res, next) => {
    const getIdPwd = {n_ua : '1', n_id : 'changyong112', n_pwd : 'rkwkrh1e@e'}
    
    res.json(getIdPwd)
})


router.use('/', async (req, res, next) => {
    if (req.method == 'POST') {
        console.log(req.body);
        if (req.body.add_id) {
            const idArr = req.body.id_list.split('\r\n');
            for await (const idLine of idArr) {
                var idLineArr = idLine.split(',')
                while (idLineArr.length < 5) {
                    idLineArr.push('')
                }
                console.log(idLineArr);
                if (idLineArr[0]) {
                    var idInsertSql = `INSERT INTO nwork (n_ua, n_id, n_pwd, n_info, n_profile) VALUES (?,?,?,?,?);`;
                    await nsql_con.promise().query(idInsertSql, idLineArr);
                }
            }
        }

    }
    const getAllIdSql = 'SELECT * FROM nwork';
    const getAllIdList = await nsql_con.promise().query(getAllIdSql);
    const get_all_id_list = getAllIdList[0]

    res.render('nwork', { get_all_id_list })
})




module.exports = router;