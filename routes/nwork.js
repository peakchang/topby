const express = require('express');
const router = express.Router();
const nsql_con = require('../db_lib/sub_db');

router.use('/', async (req, res, next) => {
    if (req.method == 'POST') {
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

    const getAllIdSql = 'SELECT * FROM nwork';
    const getAllIdList = await nsql_con.promise().query(getAllIdSql);
    const get_all_id_list = getAllIdList[0]
    console.log(get_all_id_list);

    res.render('nwork', {get_all_id_list})
})

module.exports = router;