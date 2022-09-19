const express = require('express');
const Webhookdata = require('../models/webhook');

const fs = require('fs');
const router = express.Router();
const request = require('request');
const needle = require('needle');

var token = process.env.TOKEN || 'token';
var received_updates = [];


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


    let leadsUrl = `https://graph.facebook.com/v15.0/402862271812849?access_token=${process.env.ACCESS_TOKEN}`
    let getLeadsData = await doRequest({ uri: leadsUrl });
    console.log(JSON.parse(getLeadsData));


    let formUrl = `https://graph.facebook.com/v15.0/1184770822376703?access_token=${process.env.ACCESS_TOKEN}`
    let getformUrlData = await doRequest({ uri: formUrl });
    console.log(JSON.parse(getformUrlData));

    // console.log('--------------------------------------------');
    // console.log(test.request);
    // console.log('--------------------------------------------');






    let testVal = [{ ad_id: '23851065075770490', ad_name: '광고 이름', adset_id: '23851065075780490' }];
    // console.log(testVal);
    // console.log(testVal[0].ad_id);

    // console.log('2nd chk here!!!');
    // console.log(req.query['hub.mode']);
    // console.log(req.query['hub.verify_token']);

    if (
        req.query['hub.mode'] == 'subscribe' &&
        req.query['hub.verify_token'] == token
    ) {
        // console.log('3rd chk here!!! - is real true??');
        res.send(req.query['hub.challenge']);
    } else {
        // console.log('3rd chk here!!! - is real false??');
        res.send('웹 훅 인증 대기 페이지 입니다!!!')
    }
    // console.log(JSON.stringify(received_updates, null, 2));
    // res.send('<pre>' + JSON.stringify(received_updates, null, 2) + '</pre>');
});


router.post('/', (req, res) => {
    console.log('4th chk here!!!');
    let getData = req.body
    console.log('Facebook request body:', getData);
    console.log('request header X-Hub-Signature validated');
    console.log(getData.entry[0].changes);

    let leadsId = getData.entry[0].changes[0].value.leadgen_id
    let formId = getData.entry[0].changes[0].value.form_id
    console.log(leadsId);
    console.log(formId);
    console.log('-------------------------');



    // setData = JSON.stringify(getData);
    // console.log(setData);
    // try {
    //     await Webhookdata.create({
    //         webhookdata : setId
    //     });
    // } catch (error) {
    //     console.log('에러가 났습니다요~~~~~~~~');
    // }

    // Process the Facebook updates here111111111111111111
    // received_updates.unshift(req.body);
    res.sendStatus(200);
    console.log('success!!!!!');
    // res.send('zapzaapapapapapapap')
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