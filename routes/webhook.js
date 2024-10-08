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
var received_updates = [];


const { aligoKakaoNotification_detail, aligoKakaoNotification_formanager } = require('../db_lib/back_lib')

const moment = require('moment');
const { log } = require('console');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

router.post('/zap/', (req, res) => {
    res.send('웹훅 수신!')
});

router.post('/zap/', (req, res) => {
    res.send('웹훅 GET PAGE!!!!!')
});


router.use('/test_kakao_error', async (req, res) => {

    console.log('test_kakao_error 들어옴!!!');


    const customerInfo = { userName: "🅔🅞🅝🅖🅜🅘🅝", form: '테스트 폼~' }

    let data = {}
    let config = {}

    try {
        data = qs.stringify({
            'apikey': process.env.ALIGOKEY,
            'userid': process.env.ALIGOID,
            'senderkey': process.env.ALIGO_SENDERKEY,
            'tpl_code': 'TU_1894',
            'sender': '010-4478-1127',
            'receiver_1': '010-2190-2197',
            //'recvname_1': '수신자명을 입력합니다',
            'subject_1': '분양정보 신청고객 알림톡',
            'message_1': `${customerInfo.userName} 고객님\n${customerInfo.form} 상담은 잘 받으셨나요?\n\n추가적으로 다양한 부동산 정보\n(줍줍/미분양/청약 등)를\n아래 링크를 통해 알림 받아보세요 : )`,
            'button_1': '{"button": [{"name": "부동산 정보 받으러가기","linkType": "WL","linkTypeName": "웹링크","linkPc":"https://open.kakao.com/o/gHJyFmpg","linkMo" : "https://open.kakao.com/o/gHJyFmpg"}]}'
        });

        config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: 'https://kakaoapi.aligo.in/akv10/alimtalk/send/',
            headers: {},
            data: data
        };

        const res = await axios.request(config.config);
        console.log(res);
    } catch (err) {
        console.error(err.message);
        
        console.log('테스트 에러~~~~~~~~~~~');
    }



    res.send('웹훅 GET PAGE!!!!!')
});



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
    console.log('페이지는 들어오지?!?!');
    try {
        const res = await axios.get('https://richby.co.kr/webhook/richhook')
        console.log(res.data);

    } catch (error) {

    }

    res.json({ test: 'success!!!' })
});

router.post('/', async (req, res) => {
    var getData = req.body
    try {

        // let leadsId = ""
        // let formId = ""
        // let nowDateTime = ""
        // let leadsUrl = ""
        // let LeadsData = ""
        // let formUrl = ""
        // let formData = ""
        // try {
        //     leadsId = getData.entry[0].changes[0].value.leadgen_id
        //     formId = getData.entry[0].changes[0].value.form_id

        //     console.log(`leadsId : ${leadsId}`);
        //     console.log(`formId : ${formId}`);

        //     console.log(process.env.ACCESS_TOKEN);


        //     nowDateTime = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

        //     leadsUrl = `https://graph.facebook.com/v15.0/${leadsId}?access_token=${process.env.ACCESS_TOKEN}`
        //     formUrl = `https://graph.facebook.com/v15.0/${formId}?access_token=${process.env.ACCESS_TOKEN}`
        //     console.log(leadsUrl);
        //     console.log(formUrl);

        //     LeadsData = await doRequest({ uri: leadsUrl });





        //     formData = await doRequest({ uri: formUrl });

        //     console.log(LeadsData);
        //     console.log(formData);



        // } catch (error) {

        //     console.error(error.message);
        // }

        let leadsId = getData.entry[0].changes[0].value.leadgen_id

        console.log(`get leads Id is~~~ : ${leadsId}`);


        let formId = getData.entry[0].changes[0].value.form_id

        console.log(`get form Id is~~~ : ${formId}`);

        var nowDateTime = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

        let leadsUrl = `https://graph.facebook.com/v15.0/${leadsId}?access_token=${process.env.ACCESS_TOKEN}`

        console.log(leadsUrl);

        let formUrl = `https://graph.facebook.com/v15.0/${formId}?access_token=${process.env.ACCESS_TOKEN}`

        console.log(formUrl);


        let LeadsData = await doRequest({ uri: leadsUrl });


        let formData = await doRequest({ uri: formUrl });



        let getLeadsData = JSON.parse(LeadsData)
        let getFormData = JSON.parse(formData)

        console.log(getLeadsData);
        console.log(getFormData);



        // 테스트로 새로 만들자!!
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

        // console.log('//////////////////////////////////////////');
        // console.log(baseData);
        // console.log('//////////////////////////////////////////');


        // 수신 내용이 리치분양일경우 여기서 발송하고 리턴 처리!!



        let get_created_time = getLeadsData.created_time
        // console.log(getFormData);

        var get_form_name = getFormData.name
        var form_type_in = '분양'

        var get_form_name = get_form_name.replace('분양', '')
        var get_form_name = get_form_name.replace('투자', '')

        console.log(get_form_name);
        if (get_form_name.includes('rich')) {
            console.log(baseData);
            console.log(`baseData : ${baseData} // leadsId : ${leadsId}`);
            try {
                const result = await axios.post('https://richby.co.kr/webhook/richhook', { baseData, leadsId, getFormData })
                return res.sendStatus(200);
            } catch (error) {
                return res.sendStatus(200);
            }
        }
        var reFormName = get_form_name.replace(/[a-zA-Z\(\)\-\s]/g, '')


        let chkFor2WeeksDataBool = true;
        try {

            const chkFor2WeeksDataQuery = "SELECT * FROM application_form WHERE af_mb_phone = ? AND af_created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH);"
            const chkFor2WeeksData = await mysql_conn.promise().query(chkFor2WeeksDataQuery, [baseData.db_phone, reFormName]);
            if (chkFor2WeeksData[0].length > 0) {
                chkFor2WeeksDataBool = false;
            }
        } catch (error) {

        }

        // console.log(`chkFor2WeeksDataBool : ${chkFor2WeeksDataBool}`);

        if (!chkFor2WeeksDataBool) {
            // console.log('DB registered within 2 weeks');
            return res.sendStatus(200);
        }


        try {
            // 해당 폼 리스트의 site 이름 찾아서 있으면 쓰고~ 없으면 만들고~
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


        // 폼 저장하기

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
                console.log('modify fail TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT');
            } catch (error) {
                console.log('insert db error!!!!!!!!!?!?!?!??!?!?!?!');

            }

        }

        // 발송을 위한 준비!!!!

        // 사이트 정보 (현장 및 메세지 내용)를 가져와서 고객에게 보내는 부분 (사용 X)
        const getSiteInfoSql = `SELECT * FROM site_list WHERE sl_site_name = ?`
        const getSiteInfoData = await mysql_conn.promise().query(getSiteInfoSql, [reFormName])
        const getSiteInfo = getSiteInfoData[0][0];

        // let sendMessageObj = {}

        // try {
        //     if (getSiteInfo.sl_site_realname && getSiteInfo.sl_sms_content) {
        //         // console.log('make sendMessageObj~~~~~~~~~~~~~~~~~~~~~~!!!!!!!!!!!!!!!!!!!!!!!!!!');
        //         sendMessageObj['customerName'] = baseData.db_name
        //         sendMessageObj['siteRealName'] = getSiteInfo.sl_site_realname
        //         sendMessageObj['smsContent'] = getSiteInfo.sl_sms_content
        //         sendMessageObj['receiver'] = baseData.db_phone
        //         sendMessageObj['company'] = '탑분양정보'
        //         aligoKakaoNotification_detail(req, sendMessageObj)
        //     }
        // } catch (error) {
        //     console.error(error.message);
        // }

        // console.log('////////////////////sendMessageObj////////////////////');
        // console.log(sendMessageObj);
        // console.log('////////////////////~~~~~~~~~~~~~~////////////////////');




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




        if (getSiteInfo.sl_site_link) {
            var siteList = getSiteInfo.sl_site_link
        } else {
            var siteList = '정보없음'
        }

        const receiverStr = `${baseData.db_phone} ${addEtcMessage}`
        console.log(reFormName);

        for (let oo = 0; oo < findUser.length; oo++) {
            var customerInfo = { ciName: baseData.db_name, ciCompany: '탑분양정보', ciSite: getSiteInfo.sl_site_name, ciPhone: findUser[oo].user_phone, ciSiteLink: siteList, ciReceiver: receiverStr }


            if (oo == 0) {
                // aligoKakaoNotification(req, customerInfo)
            }

            try {

            } catch (error) {

            }

            if (customerInfo.ciPhone.includes('010')) {
                try {
                    aligoKakaoNotification_formanager(req, customerInfo)
                } catch (error) {
                    console.log('kakao send is error!!!! T.T');
                }
            }
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

})





// router.post('/facebook', async (req, res) => {
//     let getData = req.body
//     console.log('Facebook request body:', getData);
//     console.log('request header X-Hub-Signature validated');
//     console.log(getData.entry[0].changes);
//     setData = JSON.stringify(getData)
//     console.log(setData);
//     try {
//         await Webhookdata.create({
//             webhookdata : setData
//         });
//     } catch (error) {
//         console.log('에러가 났습니다요~~~~~~~~');
//     }

//     // Process the Facebook updates here111111111111111111
//     received_updates.unshift(req.body);
//     res.sendStatus(200);
// });

// router.post('/instagram', (req, res) => {
//     console.log('Instagram request body:');
//     console.log(req.body);
//     // Process the Instagram updates here
//     // let getData = JSON.stringify(req.body)
//     // await Webhookdata.create({
//     //     webhookdata : getData
//     // });
//     received_updates.unshift(req.body);
//     res.sendStatus(200);
// });

// router.post('/', (req, res) => {
//     console.log('1st chk here!!!');
//     for (const outPut in req) {
//         console.log(`값 : ${outPut}`);
//     }
//     res.send('<pre>' + JSON.stringify(received_updates, null, 2) + '</pre>');
// });



// router.get(['/facebook', '/instagram'], (req, res) => {
//     console.log('2nd chk here!!!');
//     console.log(req.query['hub.mode']);
//     console.log(req.query['hub.verify_token']);

//     if (
//         req.query['hub.mode'] == 'subscribe' &&
//         req.query['hub.verify_token'] == token
//     ) {
//         console.log('3rd chk here!!! - is real true??');
//         res.send(req.query['hub.challenge']);
//     } else {
//         console.log('3rd chk here!!! - is real false??');
//         res.sendStatus(400);
//     }
// });


// router.get('/', async (req, res, next) => {
//     let wh_datas = await Webhookdata.findAll();
//     console.log(wh_datas);
//     res.render('webhookdata', {wh_datas})
// })

// router.post('/', async (req, res, next) => {
//     console.log(req.body);
//     let receive_json = req.body;
//     let string_json = JSON.stringify(receive_json);
//     console.log(string_json);
//     await Webhookdata.create({webhookdata: string_json})

//     console.log('--------------------------');
//     let wh_datas = await Webhookdata.findAll();
//     console.log(wh_datas);
//     res.render('webhookdata', {wh_datas})
// })


module.exports = router;