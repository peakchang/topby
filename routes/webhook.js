const express = require('express');
const fs = require('fs');
const { mailSender } = require('../db_lib/back_lib.js');
const router = express.Router();
const request = require('request');
const mysql_conn = require('../db_lib');
const { sendSms } = require('../db_lib/back_lib');
var token = process.env.TOKEN || 'token';
var received_updates = [];

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

    let leadsUrl = `https://graph.facebook.com/v15.0/474249967950779?access_token=${process.env.ACCESS_TOKEN}`
    let LeadsData = await doRequest({ uri: leadsUrl });

    let formUrl = `https://graph.facebook.com/v15.0/1184770822376703?access_token=${process.env.ACCESS_TOKEN}`
    let formData = await doRequest({ uri: formUrl });
    

    let getLeadsData = JSON.parse(LeadsData)
    let getFormData = JSON.parse(formData)
    // 이름
    let get_name = getLeadsData.field_data[0].values[0];
    let temp_phone = getLeadsData.field_data[1].values[0]
    let get_phone = temp_phone.replace('+82', '0')
    let get_created_ime = getLeadsData.created_time
    let get_form_name = getFormData.name
    if (
        req.query['hub.mode'] == 'subscribe' &&
        req.query['hub.verify_token'] == token
    ) {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('웹 훅 인증 대기 페이지 입니다!!!')
    }
});


router.post('/', async (req, res) => {
    const sendMsg = `인터넷 초특가 렌티입니다. 사이트를 확인해주세요 renty.co.kr`;
    let getData = req.body
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
    let get_name = getLeadsData.field_data[0].values[0];
    let temp_phone = getLeadsData.field_data[1].values[0]
    if (temp_phone.includes('+820')) {
        var get_phone = temp_phone.replace('+820', '0')
    } else {
        var get_phone = temp_phone.replace('+82', '0')
    }
    let get_created_time = getLeadsData.created_time
    let get_form_name = getFormData.name

    if (get_form_name.includes('인터넷')) {
        var form_type_in = '인터넷'
        console.log('인터넷 포함!!');
        await sendSms(get_phone, sendMsg)
    } else if (get_form_name.includes('분양')) {
        console.log('분양 포함!!');
        var form_type_in = '분양'
    } else {
        var form_type_in = '미정'
        console.log('암것도 포함 안됨!!');
    }

    const mailSubject = `${form_type_in} 고객명 ${get_name} 접수되었습니다.`;
    const mailContent = `${form_type_in} 고객명 ${get_name} 접수되었습니다\n\ ${get_form_name} 폼에서 접수되었습니다.`;
    mailSender.sendEmail('adpeak@naver.com',mailSubject, mailContent);
    mailSender.sendEmail('changyong112@naver.com',mailSubject, mailContent);
    
    let getAllData = `${get_name} / ${get_phone} / ${get_created_time} / ${get_form_name}`;
    console.log(getAllData);

    let allDataSql = 'INSERT INTO webhookdatas (webhookdata) VALUES (?)';
    await mysql_conn.promise().query(allDataSql, [getAllData]);

    let getArr = [get_form_name, form_type_in, get_name, get_phone, nowDateTime];
    let formInertSql = `INSERT INTO application_form (form_name, form_type_in, mb_name, mb_phone, af_created_at) VALUES (?,?,?,?,?);`;

    await mysql_conn.promise().query(formInertSql, getArr)

    res.sendStatus(200);
    console.log('success!!!!!');
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