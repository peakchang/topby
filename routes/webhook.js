const express = require('express');
const fs = require('fs');
const { mailSender } = require('../db_lib/back_lib.js');
const router = express.Router();
const request = require('request');
const mysql_conn = require('../db_lib');
const { sendSms } = require('../db_lib/back_lib');
var token = process.env.TOKEN || 'token';
const axios = require('axios');
const qs = require('qs');
const aligoapi = require('aligoapi');
var received_updates = [];


const { aligoKakaoNotification_detail, aligoKakaoNotification_formanager } = require('../db_lib/back_lib')

const moment = require('moment');
const { log } = require('console');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");


// 알리고 문자 발송 테스트!!

var AuthData = {
    key: 'jt7j3tl1dopaogmoauhoc68wrry0wswc',
    // 이곳에 발급받으신 api key를 입력하세요
    user_id: 'adpeaka',
    // 이곳에 userid를 입력하세요
}

router.get('/aligo_sms_test', async (req, res) => {
    req.body = {
        sender: '010-6628-6651',
        receiver: '010-2190-2197',
        msg: `테스트 메세지 고고고고!!!`,
        msg_type: 'SMS'
    }
    try {
        const aligo_res = await aligoapi.send(req, AuthData)
    } catch (err) {
        console.error(err.message);
    }
    res.send('gogo')
});




// ************************ 테스트 끝!!!


router.post('/zap/', (req, res) => {
    res.send('웹훅 수신!')
});

router.post('/zap/', (req, res) => {
    res.send('웹훅 GET PAGE!!!!!')
});


router.use('/test_kakao_error', async (req, res) => {
    const text = "좋아 테스트 𝓐𝓱𝓷.𝓢𝓮𝓸𝓷𝓗𝓸 𝙎𝙨𝙪_ 🅔🅞🅝🅖🅜🅘🅝";
    // const text = "테스트 이름";
    let dbName = text
    const cleanText = dbName.replace(/[^\w\s.,!@#$%^&*()_\-+=\[\]{}|;:'"<>?\\/가-힣]/g, '');
    const containsKoreanOrEnglish = /[A-Za-z\uAC00-\uD7A3]/.test(cleanText);

    let chkName = ""

    if (containsKoreanOrEnglish) {
        chkName = cleanText
    } else {
        chkName = '무명'
    }
    res.send('웹훅 GET PAGE!!!!!')
});


// 핵심 함수 중 하나!!!! 절대 지우지마!!!
doRequest = (url) => {
    return new Promise((resolve, reject) => {
        request(url, (error, response, body) => {
            if (!error && response.statusCode == 200) {
                resolve(body);
            } else {
                reject(error);
            }
        });
    });
}

router.get('/', async (req, res) => {
    if (req.query['hub.mode'] == 'subscribe' && req.query['hub.verify_token'] == token) {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('웹 훅 인증 대기 페이지 입니다!!!')
    }
});

router.get('/test_rich_send', async (req, res) => {
    try {
        const res = await axios.get('https://richby.co.kr/webhook/richhook')

    } catch (error) {

    }

    res.json({ test: 'success!!!' })
});

router.post('/', async (req, res) => {

    // 최초 데이터!!
    var getData = req.body
    try {

        // 핵심 부분!!! 페이스북에서 쏴주는거 제대로 받기!!!
        let leadsId = getData.entry[0].changes[0].value.leadgen_id
        let formId = getData.entry[0].changes[0].value.form_id
        let leadsUrl = `https://graph.facebook.com/v15.0/${leadsId}?access_token=${process.env.ACCESS_TOKEN}`
        let formUrl = `https://graph.facebook.com/v15.0/${formId}?access_token=${process.env.ACCESS_TOKEN}`
        let LeadsData = await doRequest({ uri: leadsUrl });
        let formData = await doRequest({ uri: formUrl });



        let getLeadsData = JSON.parse(LeadsData)
        let getFormData = JSON.parse(formData)

        // console.log(getLeadsData.field_data[0].values); // 1. 옵션
        // console.log(getLeadsData.field_data[1].values); // 2. 이름
        // console.log(getLeadsData.field_data[2].values); // 3. 전번







        // for문 돌려서 baseData 만들기!
        const leadsData = getLeadsData.field_data;
        let baseData = {};
        let etcCount = 0;
        for (let i = 0; i < leadsData.length; i++) {
            if (leadsData[i]['name'] == 'full_name') {
                baseData['db_name'] = leadsData[i]['values'][0];
            } else if (leadsData[i]['name'] == 'phone_number') {
                var get_temp_phone = leadsData[i]['values'][0];
                let get_phone = get_temp_phone.replace('+82', '').replace(/[^0-9]/g, "");
                if (get_phone.charAt(0) != '0') {
                    get_phone = `0${get_phone}`
                }
                baseData['db_phone'] = get_phone;
            } else {
                etcCount += 1;
                baseData[`etc${etcCount}`] = leadsData[i]['values'][0];
            }
        }


        var get_form_name = getFormData.name


        var get_form_name = get_form_name.replace('분양', '')
        var get_form_name = get_form_name.replace('투자', '')

        // 이건 리치에 발송하는건데 일단 냅두기!!!
        // if (get_form_name.includes('rich')) {
        //     try {
        //         const result = await axios.post('https://richby.co.kr/webhook/richhook', { baseData, leadsId, getFormData })
        //         return res.sendStatus(200);
        //     } catch (error) {
        //         return res.sendStatus(200);
        //     }
        // }


        // 최종적으로 baseData와 함께 체크 / 입력 / 발송될 데이터!!!
        const nowDateTime = moment().format('YYYY-MM-DD HH:mm:ss');
        const form_type_in = '분양'
        const reFormName = get_form_name.replace(/[a-zA-Z\(\)\-\s]/g, '')

        // 폰번호와 현장명 중복이 1달 이내에 있는경우 패스하기!!!
        try {
            const chkFor2WeeksDataQuery = "SELECT * FROM application_form WHERE af_mb_phone = ? AND af_form_name = ? AND af_created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH);"
            const chkFor2WeeksData = await mysql_conn.promise().query(chkFor2WeeksDataQuery, [baseData.db_phone, reFormName, reFormName]);

            // 테스트 할때는 잠시 주석!!!
            // if (chkFor2WeeksData[0].length > 0) {
            //     return res.sendStatus(200);
            // }
        } catch (error) {

        }

        // 해당 폼 리스트의 site 이름 찾아서 있으면 쓰고~ 없으면 만들고~
        try {
            const chkFormInSiteListSql = `SELECT * FROM site_list WHERE sl_site_name = ?`;
            const chkFormInSiteListData = await mysql_conn.promise().query(chkFormInSiteListSql, [reFormName]);
            const chkFormInSiteList = chkFormInSiteListData[0][0]
            if (!chkFormInSiteList) {
                const addFormInSiteList = `INSERT INTO site_list (sl_site_name, sl_created_at) VALUES (?, ?)`
                await mysql_conn.promise().query(addFormInSiteList, [reFormName, nowDateTime]);
            }
        } catch (error) {

        }


        // const getStatusSql = `SELECT * FROM form_status WHERE fs_id=1;`;
        // const getStatusText = await mysql_conn.promise().query(getStatusSql)
        // const estate_status_list = getStatusText[0][0].fs_estate_status.split(',')


        // 폼 저장하기!!!!!!!!!!
        // etc 리스트 찾기
        let etcInsertStr = '';
        let etcValuesStr = '';
        let addEtcMessage = '';
        for (let eidx = 1; eidx < 5; eidx++) {
            const forVal = baseData[`etc${eidx}`];
            if (forVal) {
                etcInsertStr = etcInsertStr + `, af_mb_etc${eidx}`;
                etcValuesStr = etcValuesStr + `, '${forVal}'`;
                addEtcMessage = addEtcMessage + `// 기타 정보 ${eidx} : ${forVal}`
            }
        }
        let getArr;
        let formInertSql = '';
        try {
            //  DB 집어넣기~~~!!
            getArr = [reFormName, form_type_in, 'FB', baseData.db_name, baseData.db_phone, "", leadsId, nowDateTime];
            formInertSql = `INSERT INTO application_form (af_form_name, af_form_type_in, af_form_location, af_mb_name, af_mb_phone, af_mb_status, af_lead_id ${etcInsertStr}, af_created_at) VALUES (?,?,?,?,?,?,? ${etcValuesStr},?);`;
            await mysql_conn.promise().query(formInertSql, getArr)

        } catch (error) {
            try {
                // let getArr = [reFormName, form_type_in, 'FB', get_name, get_phone, "", leadsId, nowDateTime];
                getArr = [reFormName, form_type_in, 'FB', baseData.db_name, baseData.db_phone, "", leadsId, nowDateTime];
                formInertSql = `INSERT INTO application_form (af_form_name, af_form_type_in, af_form_location, af_mb_name, af_mb_phone, af_mb_status, af_lead_id, af_created_at) VALUES (?,?,?,?,?,?,?,?);`;
                await mysql_conn.promise().query(formInertSql, getArr)
            } catch (error) {

            }

        }

        // 발송을 위한 준비!!!!

        // 사이트 정보 (현장 및 메세지 내용)를 가져와서 고객에게 보내는 부분 (사용 X)
        const getSiteInfoSql = `SELECT * FROM site_list WHERE sl_site_name = ?`
        const getSiteInfoData = await mysql_conn.promise().query(getSiteInfoSql, [reFormName])
        const getSiteInfo = getSiteInfoData[0][0];




        // 해당 폼네임에 저장된 담당자 리스트 찾기
        const userFindSql = `SELECT * FROM users WHERE manage_estate LIKE '%${reFormName}%';`;
        const findUserData = await mysql_conn.promise().query(userFindSql);
        const findUser = findUserData[0];

        // 담당자들 에게 이메일 발송
        for await (const goUser of findUser) {
            const mailSubjectManager = `${reFormName} / ${baseData.db_name} 고객 DB 접수되었습니다.`;
            const mailContentManager = `현장 : ${reFormName} / 이름 : ${baseData.db_name} / 전화번호 : ${baseData.db_phone} ${addEtcMessage}`;
            mailSender.sendEmail(goUser.user_email, mailSubjectManager, mailContentManager);
        }

        // 최고관리자에게 이메일 발송
        const mailSubject = `${reFormName} 고객명 ${baseData.db_name} 접수되었습니다.`;
        const mailContent = `현장: ${reFormName} / 이름 : ${baseData.db_name} / 전화번호 : ${baseData.db_phone} ${addEtcMessage}`;
        mailSender.sendEmail('adpeak@naver.com', mailSubject, mailContent);
        mailSender.sendEmail('changyong112@naver.com', mailSubject, mailContent);





        const receiverStr = `${baseData.db_phone} ${addEtcMessage}`

        console.log(receiverStr);
        console.log(reFormName);

        // 이름 이상하게 들어오는거 거르기!!!
        let reDbName = "";
        let dbName = baseData.db_name
        const cleanText = dbName.replace(/[^\w\s.,!@#$%^&*()_\-+=\[\]{}|;:'"<>?\\/가-힣]/g, '');
        const containsKoreanOrEnglish = /[A-Za-z\uAC00-\uD7A3]/.test(cleanText);

        if (containsKoreanOrEnglish) {
            reDbName = cleanText
        } else {
            reDbName = '무명'
        }



        // 관리자들에게 카톡 or 문자 발송
        for (let oo = 0; oo < findUser.length; oo++) {

            const customerInfo = { ciName: reDbName, ciCompany: '탑분양정보', ciSite: getSiteInfo.sl_site_name, ciPhone: findUser[oo].user_phone, ciSiteLink: siteList, ciReceiver: receiverStr }

            console.log(customerInfo);
            

            if (customerInfo.ciPhone.includes('010')) {
                // 카톡 발송 부분!!!
                try {
                    // aligoKakaoNotification_formanager(req, customerInfo)
                } catch (error) {
                    console.log('kakao send is error!!!! T.T');
                }

                // -------------------------------------------------------------------------------
                // 문자 발송 부분!!


                // req.body['sender'] = '010-6628-6651'
                // req.body['receiver'] = findUser[oo].user_phone
                // req.body['msg'] = `고객 인입 안내! ${getSiteInfo.sl_site_name} 현장 / ${baseData.db_name}님 접수되었습니다.
                // 고객 번호 : ${receiverStr}`
                // req.body['msg_type'] = 'SMS'

                // try {
                //     const aligo_res = await aligoapi.send(req, AuthData)
                //     console.log(aligo_res);

                // } catch (err) {
                //     console.log('여기 에러 나는거야?!?!?');

                //     console.error(err.message);

                // }
            }
        }


        req.body = {
            sender: '010-6628-6651',
            receiver: '010-2190-2197',
            msg: `테스트 메세지 고고고고!!!`,
            msg_type: 'SMS'
        }

        try {
            const aligo_res = await aligoapi.send(req, AuthData)
        } catch (err) {
            console.error(err.message);
        }

        return res.sendStatus(200);

    } catch (error) {
        console.error(error);

        try {
            const getDataStr = JSON.stringify(req.body)
            const insertAuditWhdataSql = `INSERT INTO audit_webhook (audit_webhookdata) VALUES (?);`;
            await mysql_conn.promise().query(insertAuditWhdataSql, [getDataStr])
        } catch (error) {
            console.log('audit_webhookdata error!!!!!!!!!!!');
        }


        res.sendStatus(200);
    }

    res.sendStatus(200);

})





// router.post('/facebook', async (req, res) => {
//     let getData = req.body
//     setData = JSON.stringify(getData)
//     try {
//         await Webhookdata.create({
//             webhookdata : setData
//         });
//     } catch (error) {
//     }

//     // Process the Facebook updates here111111111111111111
//     received_updates.unshift(req.body);
//     res.sendStatus(200);
// });

// router.post('/instagram', (req, res) => {
//     // Process the Instagram updates here
//     // let getData = JSON.stringify(req.body)
//     // await Webhookdata.create({
//     //     webhookdata : getData
//     // });
//     received_updates.unshift(req.body);
//     res.sendStatus(200);
// });

// router.post('/', (req, res) => {
//     for (const outPut in req) {
//     }
//     res.send('<pre>' + JSON.stringify(received_updates, null, 2) + '</pre>');
// });



// router.get(['/facebook', '/instagram'], (req, res) => {


//     if (
//         req.query['hub.mode'] == 'subscribe' &&
//         req.query['hub.verify_token'] == token
//     ) {
//         res.send(req.query['hub.challenge']);
//     } else {
//         res.sendStatus(400);
//     }
// });


// router.get('/', async (req, res, next) => {
//     let wh_datas = await Webhookdata.findAll();
//     res.render('webhookdata', {wh_datas})
// })

// router.post('/', async (req, res, next) => {
//     let receive_json = req.body;
//     let string_json = JSON.stringify(receive_json);
//     await Webhookdata.create({webhookdata: string_json})
//     let wh_datas = await Webhookdata.findAll();
//     res.render('webhookdata', {wh_datas})
// })


module.exports = router;