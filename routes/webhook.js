const express = require('express');
const { Webhookdata } = require('../models');

const router = express.Router();

router.get('/', async (req, res, next) => {
    let wh_datas = await Webhookdata.findAll();
    console.log(wh_datas);
    res.render('webhookdata', {wh_datas})
})

router.post('/', async (req, res, next) => {
    console.log(req.body);
    let receive_json = req.body;
    let string_json = JSON.stringify(receive_json);
    console.log(string_json);
    await Webhookdata.create({webhookdata: string_json})

    console.log('--------------------------');
    let wh_datas = await Webhookdata.findAll();
    console.log(wh_datas);
    res.render('webhookdata', {wh_datas})
})


module.exports = router;