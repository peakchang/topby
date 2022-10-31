const express = require('express');
const fs = require('fs');
const { mailSender } = require('../db_lib/back_lib.js');
const router = express.Router();
const request = require('request');
const mysql_conn = require('../db_lib');
const { sendSms } = require('../db_lib/back_lib');
var token = process.env.TOKEN || 'token';
var received_updates = [];

const { aligoKakaoNotification } = require('../db_lib/back_lib')

const moment = require('moment');
require('moment-timezone');
moment.tz.setDefault("Asia/Seoul");

router.post('/zap/', (req, res) => {
    console.log(req.body);
    res.send('웹훅 수신!')
});

router.post('/zap/', (req, res) => {
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

    // let leadsUrl = `https://graph.facebook.com/v15.0/474249967950779?access_token=${process.env.ACCESS_TOKEN}`
    // let LeadsData = await doRequest({ uri: leadsUrl });

    // let formUrl = `https://graph.facebook.com/v15.0/1184770822376703?access_token=${process.env.ACCESS_TOKEN}`
    // let formData = await doRequest({ uri: formUrl });


    // let getLeadsData = JSON.parse(LeadsData)
    // let getFormData = JSON.parse(formData)
    // // 이름
    // let get_name = getLeadsData.field_data[0].values[0];
    // let temp_phone = getLeadsData.field_data[1].values[0]
    // let get_phone = temp_phone.replace('+82', '0')
    // let get_created_ime = getLeadsData.created_time
    // let get_form_name = getFormData.name
    if (req.query['hub.mode'] == 'subscribe' && req.query['hub.verify_token'] == token) {
        console.log('여기 안들어옴??');
        res.send(req.query['hub.challenge']);
    } else {
        res.send('웹 훅 인증 대기 페이지 입니다!!!')
    }
});


router.post('/', async (req, res) => {
    const sendMsg = `인터넷 초특가 렌티입니다. 사이트를 확인해주세요 renty.co.kr`;
    var getData = req.body
    console.log(getData);

    try {
        let leadsId = getData.entry[0].changes[0].value.leadgen_id
        let formId = getData.entry[0].changes[0].value.form_id
        var nowDateTime = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

        let leadsUrl = `https://graph.facebook.com/v15.0/${leadsId}?access_token=${process.env.ACCESS_TOKEN}`
        let LeadsData = await doRequest({ uri: leadsUrl });

        let formUrl = `https://graph.facebook.com/v15.0/${formId}?access_token=${process.env.ACCESS_TOKEN}`
        let formData = await doRequest({ uri: formUrl });

        let getLeadsData = JSON.parse(LeadsData)
        let getFormData = JSON.parse(formData)

        // 이름
        var get_name = getLeadsData.field_data[0].values[0];
        var temp_phone = getLeadsData.field_data[1].values[0]
        if (temp_phone.includes('+820')) {
            var get_phone = temp_phone.replace('+820', '0')
        } else if (temp_phone.includes('+82')) {
            var get_phone = temp_phone.replace('+82', '0')
        } else {


            var temp_phone = getLeadsData.field_data[0].values[0];
            var get_name = getLeadsData.field_data[1].values[0];
            if (temp_phone.includes('+820')) {
                var get_phone = temp_phone.replace('+820', '0')
            } else if (temp_phone.includes('+82')) {
                var get_phone = temp_phone.replace('+82', '0')
            }


        }
        let get_created_time = getLeadsData.created_time
        console.log(getFormData);
        var get_form_name = getFormData.name

        if (get_form_name.includes('인터넷')) {
            var form_type_in = '인터넷'
            await sendSms(get_phone, sendMsg)
        } else {
            var form_type_in = '분양'
        }

        var get_form_name = get_form_name.replace('분양', '')
        var get_form_name = get_form_name.replace('투자', '')
        var reFormName = get_form_name.replace(/[a-zA-Z\(\)\-\s]/g, '')


        let getAllData = `${get_name} / ${get_phone} / ${get_created_time} / ${get_form_name}/ ${leadsId} / ${reFormName}`;

        let allDataSql = 'INSERT INTO webhookdatas (webhookdata) VALUES (?)';
        await mysql_conn.promise().query(allDataSql, [getAllData]);

        console.log('여기까지는 정상인가요??')
        const getStatusSql = `SELECT * FROM form_status WHERE fs_id=1;`;
        const getStatusText = await mysql_conn.promise().query(getStatusSql)
        const estate_status_list = getStatusText[0][0].fs_estate_status.split(',')

        // let getArr = [get_form_name, form_type_in, 'FB', get_name, get_phone, estate_status_list[0], leadsId, nowDateTime];
        let getArr = [get_form_name, form_type_in, 'FB', get_name, get_phone, "", leadsId, nowDateTime];
        let formInertSql = `INSERT INTO application_form (af_form_name, af_form_type_in, af_form_location, af_mb_name, af_mb_phone, af_mb_status, af_lead_id, af_created_at) VALUES (?,?,?,?,?,?,?,?);`;

        console.log(formInertSql);
        console.log('***************** pass first');

        await mysql_conn.promise().query(formInertSql, getArr)




        console.log(reFormName);

        const userFindSql = `SELECT * FROM users WHERE manage_estate = ?;`;
        const findUserData = await mysql_conn.promise().query(userFindSql, [reFormName]);
        const findUser = findUserData[0][0];

        console.log(userFindSql);
        console.log('***************** pass second');
        console.log(findUser);



        const mailSubjectManager = `${get_name} 고객 DB 접수되었습니다.`;
        const mailContentManager = `이름 : ${get_name} / 전화번호 : ${get_phone}`;
        mailSender.sendEmail(findUser.user_email, mailSubjectManager, mailContentManager);



        const mailSubject = `${reFormName} 고객명 ${get_name} 접수되었습니다.`;
        const mailContent = `현장: ${reFormName} / 이름 : ${get_name} / 전화번호 : ${get_phone}`;
        mailSender.sendEmail('adpeak@naver.com', mailSubject, mailContent);
        mailSender.sendEmail('changyong112@naver.com', mailSubject, mailContent);


        // 고객한테 갈 알림톡


        const getSiteInfoSql = `SELECT * FROM site_list WHERE sl_site_name = ?`
        const getSiteInfoData = await mysql_conn.promise().query(getSiteInfoSql, [reFormName])
        const getSiteInfo = getSiteInfoData[0][0];


        console.log(getSiteInfoSql);
        console.log('***************** pass END!!!!');
        console.log(getSiteInfo);

        if (getSiteInfo.sl_site_link) {
            var siteList = getSiteInfo.sl_site_link
        } else {
            var siteList = '정보없음'
        }

        var customerInfo = { ciName: get_name, ciCompany: '탑분양정보', ciSite: getSiteInfo.sl_site_name, ciPhone: findUser.user_phone, ciSiteLink: siteList, ciReceiver: get_phone }
        aligoKakaoNotification(req, customerInfo)


        res.sendStatus(200);
        console.log('success!!!!!');
    } catch (error) {
        

        const getDataStr = JSON.stringify(req.body)
        console.log(getDataStr);
        const insertAuditWhdataSql = `INSERT INTO (audit_webhookdata) VALUES ('${getDataStr}');`;
        console.log(insertAuditWhdataSql);
        await mysql_conn.promise().query(insertAuditWhdataSql)

        res.status(200)

        
    }

})





// router.post('/facebook', async (req, res) => {
//     console.log('4th chk here!!!');
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