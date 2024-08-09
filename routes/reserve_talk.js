const express = require('express');
const router = express.Router();
const sql_con = require('../db_lib');

const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
const { aligoKakaoNoti_reserved_katalk } = require('../db_lib/back_lib')


router.use('/chk_page', async (req, res, next) => {

    let previousData = [];
    try {
        const get3weekPreviousQuery = "SELECT * FROM application_form WHERE DATE(af_created_at) = DATE_SUB(CURDATE(), INTERVAL 21 DAY);";
        const get3weekPrevious = await sql_con.promise().query(get3weekPreviousQuery);
        const tempPreviousData = get3weekPrevious[0]
        previousData = tempPreviousData.filter(item => !item.af_mb_name.includes('test'));
        console.log(previousData);

    } catch (error) {

    }

    const customerInfo = {
        phoneNum: '01021902197', userName: '테스트',
        form: '테스트 폼'
    }
    aligoKakaoNoti_reserved_katalk(req, customerInfo)




    return res.json({ previousData })
});

module.exports = router;