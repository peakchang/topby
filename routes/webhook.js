const express = require('express');
<<<<<<< HEAD
const { Webhookdata } = require('../models');
=======
const Webhookdata = require('../models/webhook');
>>>>>>> 7c1d4ed7db6f29cd5d152a83f89348acd7bee08c
const fs = require('fs');
const router = express.Router();

var token = process.env.TOKEN || 'token';
var received_updates = [];


router.get('/', function (req, res) {
<<<<<<< HEAD
    console.log(JSON.stringify(req));

    // fs.writeFile('/public/test.txt', JSON.stringify(req), (err) => {
    //     if (err === null) {
    //         console.log('success');
    //     } else {
    //         console.log('fail');
    //     }
    // })
    // res.send('<pre>' + JSON.stringify(received_updates, null, 2) + '</pre>');
});
router.post('/', async (req, res) => {
    console.log(req);
=======

});
router.post('/', async (req, res) => {
    console.log('1st chk here!!!');
>>>>>>> 7c1d4ed7db6f29cd5d152a83f89348acd7bee08c
    for (const outPut in req) {
        console.log(`값 : ${outPut}`);
    }
    // fs.writeFile('/public/test.txt', req, (err) => {
    //     if (err === null) {
    //         console.log('success');
    //     } else {
    //         console.log('fail');
    //     }
    // })
    res.send('<pre>' + JSON.stringify(received_updates, null, 2) + '</pre>');
});

router.get(['/facebook', '/instagram'], function (req, res) {
    console.log('2nd chk here!!!');
    console.log(req.query['hub.mode']);
    console.log(req.query['hub.verify_token']);

    if (
        req.query['hub.mode'] == 'subscribe' &&
        req.query['hub.verify_token'] == token
    ) {
        console.log('3rd chk here!!! - is real true??');
        res.send(req.query['hub.challenge']);
    } else {
        console.log('3rd chk here!!! - is real false??');
        res.sendStatus(400);
    }
});

<<<<<<< HEAD
router.post('/facebook', function (req, res) {
    console.log('**********************************');
    console.log(req);
    console.log('Facebook request body:', req.body);
=======
router.post('/facebook', async (req, res) => {
    console.log('4th chk here!!!');
>>>>>>> 7c1d4ed7db6f29cd5d152a83f89348acd7bee08c

    console.log('Facebook request body:', req.body);
    console.log(JSON.stringify(req.body));
    console.log('request header X-Hub-Signature validated');
    let getData = JSON.stringify(req.body)
    await Webhookdata.create({
        webhookdata : getData
    });
    // Process the Facebook updates here
    // received_updates.unshift(req.body);
    res.sendStatus(200);
    res.send('페이스북 받는곳~~~~~')
});

router.post('/instagram', async (req, res) => {
    console.log('Instagram request body:');
    console.log(req.body);
    // Process the Instagram updates here
    let getData = JSON.stringify(req.body)
    await Webhookdata.create({
        webhookdata : getData
    });
    received_updates.unshift(req.body);
    res.sendStatus(200);
});















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