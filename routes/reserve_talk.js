const express = require('express');
const router = express.Router();
const sql_con = require('../db_lib');

const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");
const { aligoKakaoNoti_reserved_katalk } = require('../db_lib/back_lib')

const axios = require('axios');
const qs = require('qs');


router.use('/', async (req, res, next) => {


    let status = true;
    let customerInfos = [];
    let configArr = []


    try {
        const get3weekPreviousQuery = "SELECT af_mb_phone, MAX(af_id) AS af_id, MAX(af_created_at) AS af_created_at, MAX(af_mb_name) AS af_mb_name, MAX(af_form_name) AS af_form_name FROM application_form WHERE DATE(af_created_at) = DATE_SUB(CURDATE(), INTERVAL 21 DAY) GROUP BY af_mb_phone;";
        const get3weekPrevious = await sql_con.promise().query(get3weekPreviousQuery);
        const tempPreviousData = get3weekPrevious[0]


        customerInfos = tempPreviousData.filter(item => !item.af_mb_name.includes('test')).map(item => ({ phoneNum: item.af_mb_phone, userName: item.af_mb_name, form: "신청하신 분양 현장" }));


    } catch (error) {
        status = false;
    }

    for (let i = 0; i < customerInfos.length; i++) {
        const customerInfo = customerInfos[i];

        let data = qs.stringify({
            'apikey': process.env.ALIGOKEY,
            'userid': process.env.ALIGOID,
            'senderkey': process.env.ALIGO_SENDERKEY,
            'tpl_code': 'TU_1894',
            'sender': '010-4478-1127',
            'receiver_1': customerInfo.phoneNum,
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

        configArr.push({ config, customerInfo });

    }

    const resultArr = fetchData(configArr).then(results => {
        console.log('All data processed:', results);
    });



    return res.json({ status, configArr })
});


async function fetchData(configArr) {
    const results = [];

    for (const config of configArr) {
        try {
            const response = await axios.request(config.config);
            try {
                const ci = config.customerInfo;
                const insertSendStatusQuery = "INSERT INTO reserve_send_list (rs_name,rs_phone,rs_form,rs_send_status) VALUES (?,?,?,TRUE)";
                await sql_con.promise().query(insertSendStatusQuery, [ci.userName, ci.phoneNum, ci.form]);
            } catch (error) {

            }
        } catch (error) {
            console.error(`Failed!!!`, error.message);
            try {
                const ci = config.customerInfo;
                const insertSendStatusQuery = "INSERT INTO reserve_send_list (rs_name,rs_phone,rs_form,rs_send_status) VALUES (?,?,?,FALSE)";
                await sql_con.promise().query(insertSendStatusQuery, [ci.userName, ci.phoneNum, ci.form]);
            } catch (error) {

            }
        }
    }

    return results;
}

module.exports = router;