const express = require('express');
const fs = require('fs');
const { mailSender } = require('../db_lib/back_lib.js');
const router = express.Router();
const request = require('request');
const mysql_conn = require('../db_lib');
const { sendSms } = require('../db_lib/back_lib');
var token = process.env.TOKEN || 'token';
var received_updates = [];

const { aligoKakaoNotification_formanager, aligoKakaoNotification_detail } = require('../db_lib/back_lib')

const moment = require('moment');
const { log } = require('console');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

router.get('/', (req, res) => {
    let status = true;
    res.json({ status })
});

router.post('/', async (req, res) => {
    let status = true;
    console.log('zapier 들어옴!!!!');
    console.log('zapier 들어옴!!!!');
    console.log('zapier 들어옴!!!!');
    console.log('zapier 들어옴!!!!');
    console.log('zapier 들어옴!!!!');
    console.log('zapier 들어옴!!!!');
    console.log('zapier 들어옴!!!!');
    console.log('zapier 들어옴!!!!');
    console.log('zapier 들어옴!!!!');
    console.log('zapier 들어옴!!!!');
    log
    console.log(req.body);

    const body = req.body;
    try {

        const get_temp_phone = body['raw__phone_number'];
        console.log(get_temp_phone);

        let get_phone = get_temp_phone
        try {
            get_phone = get_temp_phone.replace('+82', '').replace(/[^0-9]/g, "");
            if (get_phone.charAt(0) != '0') {
                get_phone = `0${get_phone}`
            }
        } catch (error) {
            console.log(error.message);
        }

        const nowStr = moment().format('YYYY-MM-DD HH:mm:ss');
        // 사이트 리스트에 먼저 넣기
        const get_form_name = body['form_name']
        var reFormName = get_form_name.replace(/[a-zA-Z\(\)\-\s]/g, '')
        console.log(reFormName);

        const chkFormInSiteListSql = `SELECT * FROM site_list WHERE sl_site_name = ?`;
        const chkFormInSiteListData = await mysql_conn.promise().query(chkFormInSiteListSql, [reFormName]);
        const chkFormInSiteList = chkFormInSiteListData[0][0]
        if (!chkFormInSiteList) {
            const addFormInSiteList = `INSERT INTO site_list (sl_site_name, sl_created_at) VALUES (?, ?)`
            await mysql_conn.promise().query(addFormInSiteList, [reFormName, nowStr]);
        }

        // etc 리스트 찾기
        let etcInsertStr = '';
        let etcValuesStr = '';
        let addEtcMessage = '';

        for (const key in body) {
            if (key.includes('raw__etc1')) {
                etcInsertStr = etcInsertStr + `, af_mb_etc1`;
                etcValuesStr = etcValuesStr + `, '${body[key]}'`;
                addEtcMessage = addEtcMessage + `// 기타 정보1 : ${body[key]}`
            } else if (key.includes('raw__etc2')) {
                etcInsertStr = etcInsertStr + `, af_mb_etc2`;
                etcValuesStr = etcValuesStr + `, '${body[key]}'`;
                addEtcMessage = addEtcMessage + `// 기타 정보2 : ${body[key]}`
            } else if (key.includes('raw__etc3')) {
                etcInsertStr = etcInsertStr + `, af_mb_etc3`;
                etcValuesStr = etcValuesStr + `, '${body[key]}'`;
                addEtcMessage = addEtcMessage + `// 기타 정보3 : ${body[key]}`
            }
        }
        // for (let eidx = 1; eidx < 5; eidx++) {
        //     let forVal = ""
        //     if (body[`raw__etc${eidx}`]) {
        //         forVal = body[`raw__etc${eidx}`];
        //     } else if (body[`raw__etc${eidx}_`]) {
        //         forVal = body[`raw__etc${eidx}_`];
        //     }
        //     if (forVal) {
        //         etcInsertStr = etcInsertStr + `, af_mb_etc${eidx}`;
        //         etcValuesStr = etcValuesStr + `, '${forVal}'`;
        //         addEtcMessage = addEtcMessage + `// 기타 정보 ${eidx} : ${forVal}`
        //     }
        // }

        console.log(addEtcMessage);


        const values = [reFormName, '분양', 'FB', body['raw__full_name'], get_phone, '', nowStr]

        formInertSql = `INSERT INTO application_form (af_form_name, af_form_type_in, af_form_location, af_mb_name, af_mb_phone, af_mb_status ${etcInsertStr}, af_created_at) VALUES (?,?,?,?,?,? ${etcValuesStr},?);`;

        await mysql_conn.promise().query(formInertSql, values)


        // 해당 폼네임에 저장된 담당자 리스트 찾기
        const userFindSql = `SELECT * FROM users WHERE manage_estate LIKE '%${reFormName}%';`;
        const findUserData = await mysql_conn.promise().query(userFindSql);
        const findUser = findUserData[0];



        // 담당자들 에게 이메일 발송
        for await (const goUser of findUser) {
            const mailSubjectManager = `${reFormName} / ${body['raw__full_name']} 고객 DB 접수되었습니다.`;
            const mailContentManager = `현장 : ${reFormName} / 이름 : ${body['raw__full_name']} / 전화번호 : ${get_phone} ${addEtcMessage}`;
            mailSender.sendEmail(goUser.user_email, mailSubjectManager, mailContentManager);
        }

        // 최고관리자에게 이메일 발송
        const mailSubject = `(탑분양 접수) ${reFormName} 고객명 ${body['raw__full_name']} 접수되었습니다.`;
        const mailContent = `현장: ${reFormName} / 이름 : ${body['raw__full_name']} / 전화번호 : ${get_phone} ${addEtcMessage}`;
        mailSender.sendEmail('adpeak@naver.com', mailSubject, mailContent);
        mailSender.sendEmail('changyong112@naver.com', mailSubject, mailContent);

        // 매니저한테 알림톡 발송
        const getSiteInfoSql = `SELECT * FROM site_list WHERE sl_site_name = ?`
        const getSiteInfoData = await mysql_conn.promise().query(getSiteInfoSql, [reFormName])
        const getSiteInfo = getSiteInfoData[0][0];

        if (getSiteInfo.sl_site_link) {
            var siteList = getSiteInfo.sl_site_link
        } else {
            var siteList = '정보없음'
        }

        const receiverStr = `${get_phone} ${addEtcMessage}`
        for (let oo = 0; oo < findUser.length; oo++) {
            var customerInfo = { ciName: body['raw__full_name'], ciCompany: '탑분양', ciSite: getSiteInfo.sl_site_name, ciPhone: findUser[oo].user_phone, ciSiteLink: siteList, ciReceiver: receiverStr }

            console.log(customerInfo);
            if (oo == 0) {
                // aligoKakaoNotification(req, customerInfo)
            }
            if (customerInfo.ciPhone.includes('010')) {
                aligoKakaoNotification_formanager(req, customerInfo)
            }
        }


        // 여기서 고객에게 보낼 알림톡 발송!!!

        try {
            const getSendContentQuery = "SELECT * FROM site_list WHERE sl_site_name = ?"
            const getSendContent = await mysql_conn.promise().query(getSendContentQuery, [getSiteInfo.sl_site_name])
            const sendRealSiteName = getSendContent[0][0]['sl_site_realname']
            const sendContent = getSendContent[0][0]['sl_sms_content']
            console.log(`sendRealSiteName : ${sendRealSiteName} / sendContent : ${sendContent}`);
            if (sendRealSiteName && sendContent) {
                const detailSendContent = {
                    receiver: get_phone,
                    ciName: body['raw__full_name'],
                    ciCompany: "탑분양",
                    ciSite: sendRealSiteName,
                    smsContent: sendContent
                }
                // aligoKakaoNotification_detail(req, detailSendContent)
            }

        } catch (error) {
            console.log('디테일 발송 에러!!');
            console.error(error.message);
        }

        // 알림톡 발송 끝~~~~
        return res.sendStatus(200);

    } catch (err) {
        console.error(err.message);
        status = false;
    }


    res.json({ status })
});



module.exports = router;