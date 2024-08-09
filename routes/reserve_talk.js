const express = require('express');
const router = express.Router();
const sql_con = require('../db_lib');

const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
const { aligoKakaoNoti_reserved_katalk } = require('../db_lib/back_lib')

const axios = require('axios');
const qs = require('qs');


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
    // const testReturn = aligoKakaoNoti_reserved_katalk(req, customerInfo)
    // console.log(testReturn);

    let data = qs.stringify({
        'apikey': process.env.ALIGOKEY,
        'userid': process.env.ALIGOID,
        'senderkey': process.env.ALIGO_SENDERKEY,
        'tpl_code': 'TU_1894',
        'sender': '010-4478-1127',
        'receiver_1': '01021902197',
        //'recvname_1': '수신자명을 입력합니다',
        'subject_1': '분양정보 신청고객 알림톡',
        'message_1': `${customerInfo.userName} 고객님\n${customerInfo.form} 상담은 잘 받으셨나요?\n\n추가적으로 다양한 부동산 정보\n(줍줍/미분양/청약 등)를\n아래 링크를 통해 알림 받아보세요 : )`,
        'button_1': '{"button": [{"name": "부동산 정보 받으러가기","linkType": "WL","linkTypeName": "웹링크","linkPc":"https://open.kakao.com/o/gHJyFmpg","linkMo" : "https://open.kakao.com/o/gHJyFmpg"}]}'
    });

    let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: 'https://kakaoapi.aligo.in/akv10/alimtalk/send/',
        headers: {},
        data: data
    };
    axios.request(config)
        .then((response) => {
            console.log(JSON.stringify(response.data));
        })
        .catch((error) => {
            console.log(error);
            console.log(error.message);

        });





    return res.json({ previousData })
});

module.exports = router;